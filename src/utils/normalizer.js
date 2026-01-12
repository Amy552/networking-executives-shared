import {
  DEFAULT_EVENT,
  LEGACY_FIELD_MAPPINGS,
  DUAL_WRITE_FIELDS,
  EVENT_TYPES,
  EVENT_STATUS,
} from "../schemas/event.js";

/**
 * Normalize event data from any format (legacy or canonical) to canonical format
 *
 * @param {Object} data - Event data object with potentially mixed field naming
 * @returns {Object} - Event data with canonical field names
 */
export function normalizeEventData(data) {
  if (!data) return { ...DEFAULT_EVENT };

  const normalized = { ...DEFAULT_EVENT };

  // Process each field, checking for both canonical and legacy names
  for (const [key, value] of Object.entries(data)) {
    // Get canonical name (either the key itself or mapped from legacy)
    const canonicalKey = LEGACY_FIELD_MAPPINGS[key] || key;

    // Only set if it's a valid canonical field
    if (canonicalKey in DEFAULT_EVENT) {
      // Use the value if we haven't already set it, or if the canonical field is empty
      if (
        normalized[canonicalKey] === DEFAULT_EVENT[canonicalKey] ||
        normalized[canonicalKey] === null ||
        normalized[canonicalKey] === ""
      ) {
        normalized[canonicalKey] = value;
      }
    }
  }

  // Handle special normalization cases

  // Normalize event type to lowercase
  if (normalized.eventType) {
    normalized.eventType = normalized.eventType.toLowerCase();
    // Map common variations
    if (
      normalized.eventType === "inperson" ||
      normalized.eventType === "in_person"
    ) {
      normalized.eventType = EVENT_TYPES.IN_PERSON;
    }
  }

  // Normalize status to lowercase
  if (normalized.status) {
    normalized.status = normalized.status.toLowerCase();
  }

  // Ensure industries is always an array
  if (normalized.industries && !Array.isArray(normalized.industries)) {
    normalized.industries =
      typeof normalized.industries === "string"
        ? normalized.industries.split(",").map((s) => s.trim())
        : [normalized.industries];
  }

  // Handle coordinates - ensure they're numbers or null
  if (normalized.latitude !== null && normalized.latitude !== undefined) {
    normalized.latitude = parseFloat(normalized.latitude) || null;
  }
  if (normalized.longitude !== null && normalized.longitude !== undefined) {
    normalized.longitude = parseFloat(normalized.longitude) || null;
  }

  return normalized;
}

/**
 * Prepare event data for saving to Firestore
 * Includes dual-write fields for backward compatibility during migration
 *
 * @param {Object} eventData - Normalized event data
 * @param {Object} options - Options for preparation
 * @param {boolean} options.includeLegacyFields - Whether to include legacy field names (dual-write)
 * @param {boolean} options.isAdmin - Whether this is an admin operation (affects status)
 * @returns {Object} - Event data ready for Firestore
 */
export function prepareEventForSave(eventData, options = {}) {
  const { includeLegacyFields = true, isAdmin = false } = options;

  // Start with normalized data
  const prepared = normalizeEventData(eventData);

  // Set timestamps
  const now = new Date();
  if (!prepared.createdAt) {
    prepared.createdAt = now;
  }
  prepared.updatedAt = now;

  // Set default status based on context
  if (!prepared.status) {
    prepared.status = isAdmin ? EVENT_STATUS.APPROVED : EVENT_STATUS.PENDING;
  }

  // Add dual-write legacy fields for backward compatibility
  if (includeLegacyFields) {
    for (const [canonical, legacy] of Object.entries(DUAL_WRITE_FIELDS)) {
      if (prepared[canonical] !== undefined && prepared[canonical] !== null) {
        prepared[legacy] = prepared[canonical];
      }
    }

    // Also write legacy categories array if industries exists
    if (prepared.industries && prepared.industries.length > 0) {
      prepared.categories = prepared.industries;
      prepared.eventCategories = prepared.industries;
    }
  }

  // Remove undefined values
  Object.keys(prepared).forEach((key) => {
    if (prepared[key] === undefined) {
      delete prepared[key];
    }
  });

  return prepared;
}

/**
 * Extract form-friendly data from event (for editing)
 * Ensures all values are in the format expected by form inputs
 *
 * @param {Object} eventData - Event data from Firestore
 * @returns {Object} - Form-friendly event data
 */
export function prepareEventForForm(eventData) {
  const normalized = normalizeEventData(eventData);

  return {
    ...normalized,
    // Ensure dates are Date objects or null for date pickers
    startDateTime: normalizeDate(normalized.startDateTime),
    endDateTime: normalizeDate(normalized.endDateTime),
    // Ensure arrays are arrays
    industries: Array.isArray(normalized.industries) ? normalized.industries : [],
    // Ensure strings are strings
    organizationName: normalized.organizationName || "",
    eventName: normalized.eventName || "",
    description: normalized.description || "",
    address: normalized.address || "",
    city: normalized.city || "",
    state: normalized.state || "",
    zipCode: normalized.zipCode || "",
    email: normalized.email || "",
    phone: normalized.phone || "",
    virtualLink: normalized.virtualLink || "",
    organizationWeblink: normalized.organizationWeblink || "",
    eventImage: normalized.eventImage || "",
    timezone: normalized.timezone || "",
    eventType: normalized.eventType || EVENT_TYPES.IN_PERSON,
  };
}

/**
 * Normalize a date value to a Date object
 *
 * @param {any} value - Date value (Firestore Timestamp, Date, string, or null)
 * @returns {Date|null} - Date object or null
 */
function normalizeDate(value) {
  if (!value) return null;

  // Firestore Timestamp
  if (value && typeof value.toDate === "function") {
    return value.toDate();
  }

  // Already a Date
  if (value instanceof Date) {
    return value;
  }

  // String or number
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Compare two events for changes (useful for tracking what changed)
 *
 * @param {Object} original - Original event data
 * @param {Object} updated - Updated event data
 * @returns {Object} - Object with changed fields and their old/new values
 */
export function getEventChanges(original, updated) {
  const normalizedOriginal = normalizeEventData(original);
  const normalizedUpdated = normalizeEventData(updated);
  const changes = {};

  for (const key of Object.keys(DEFAULT_EVENT)) {
    const oldVal = normalizedOriginal[key];
    const newVal = normalizedUpdated[key];

    // Deep compare for arrays
    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      if (JSON.stringify(oldVal.sort()) !== JSON.stringify(newVal.sort())) {
        changes[key] = { old: oldVal, new: newVal };
      }
    }
    // Date comparison
    else if (oldVal instanceof Date && newVal instanceof Date) {
      if (oldVal.getTime() !== newVal.getTime()) {
        changes[key] = { old: oldVal, new: newVal };
      }
    }
    // Standard comparison
    else if (oldVal !== newVal) {
      changes[key] = { old: oldVal, new: newVal };
    }
  }

  return changes;
}

/**
 * Validate that all required fields are present
 *
 * @param {Object} eventData - Event data to validate
 * @returns {Object} - { isValid: boolean, missingFields: string[] }
 */
export function validateRequiredFields(eventData) {
  const required = [
    "organizationName",
    "eventName",
    "eventType",
    "description",
    "startDateTime",
    "endDateTime",
    "email",
  ];

  const normalized = normalizeEventData(eventData);
  const missingFields = [];

  for (const field of required) {
    const value = normalized[field];
    if (value === null || value === undefined || value === "") {
      missingFields.push(field);
    }
  }

  // Check location for in-person/hybrid events
  if (
    normalized.eventType === EVENT_TYPES.IN_PERSON ||
    normalized.eventType === EVENT_TYPES.HYBRID
  ) {
    const locationFields = ["address", "city", "state"];
    for (const field of locationFields) {
      if (!normalized[field]) {
        missingFields.push(field);
      }
    }
  }

  // Check virtual link for virtual/hybrid events
  if (
    normalized.eventType === EVENT_TYPES.VIRTUAL ||
    normalized.eventType === EVENT_TYPES.HYBRID
  ) {
    if (!normalized.virtualLink) {
      missingFields.push("virtualLink");
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

export default {
  normalizeEventData,
  prepareEventForSave,
  prepareEventForForm,
  getEventChanges,
  validateRequiredFields,
};
