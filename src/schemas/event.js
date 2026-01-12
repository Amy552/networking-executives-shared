import * as yup from "yup";

/**
 * Canonical Event Schema
 *
 * This is the single source of truth for event data structure.
 * All event-related operations should use these field names.
 *
 * CANONICAL FIELD NAMING (use these, NOT legacy):
 * - organizationName (NOT Organization_name)
 * - startDateTime (NOT starteventDateTime)
 * - endDateTime (NOT endeventDateTime)
 * - industries (NOT categories, NOT eventCategories)
 */

/**
 * Event type constants
 */
export const EVENT_TYPES = {
  IN_PERSON: "in-person",
  VIRTUAL: "virtual",
  HYBRID: "hybrid",
};

/**
 * Event status constants
 */
export const EVENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  DRAFT: "draft",
};

/**
 * Default empty event object with canonical field names
 */
export const DEFAULT_EVENT = {
  // Identity
  id: null,

  // Organization (CANONICAL)
  organizationName: "",
  organizationWeblink: "",

  // Event Details
  eventName: "",
  eventType: EVENT_TYPES.IN_PERSON,
  description: "",

  // Date/Time (CANONICAL)
  startDateTime: null,
  endDateTime: null,
  timezone: "",

  // Location
  address: "",
  city: "",
  state: "",
  zipCode: "",
  latitude: null,
  longitude: null,
  virtualLink: "",

  // Categories (CANONICAL)
  industries: [],

  // Media
  eventImage: "",

  // Contact
  email: "",
  phone: "",

  // Metadata
  status: EVENT_STATUS.PENDING,
  createdAt: null,
  updatedAt: null,
  createdBy: "",
  organizerId: "",
};

/**
 * Legacy field mappings for backward compatibility
 * Maps legacy field names to canonical names
 */
export const LEGACY_FIELD_MAPPINGS = {
  // Organization variants
  Organization_name: "organizationName",
  organization_name: "organizationName",

  // DateTime variants
  starteventDateTime: "startDateTime",
  start_date_time: "startDateTime",
  endeventDateTime: "endDateTime",
  end_date_time: "endDateTime",

  // Category variants
  categories: "industries",
  eventCategories: "industries",
  event_categories: "industries",

  // Other common variants
  event_name: "eventName",
  event_type: "eventType",
  event_image: "eventImage",
  virtual_link: "virtualLink",
  zip_code: "zipCode",
  created_at: "createdAt",
  updated_at: "updatedAt",
  created_by: "createdBy",
  organizer_id: "organizerId",
};

/**
 * Fields that should be written with legacy names for backward compatibility
 * during the migration period (dual-write)
 */
export const DUAL_WRITE_FIELDS = {
  organizationName: "Organization_name",
  startDateTime: "starteventDateTime",
  endDateTime: "endeventDateTime",
};

/**
 * Yup validation schema for event form
 */
export const eventValidationSchema = yup.object().shape({
  // Organization
  organizationName: yup
    .string()
    .required("Organization name is required")
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters"),

  organizationWeblink: yup
    .string()
    .url("Please enter a valid URL")
    .nullable(),

  // Event Details
  eventName: yup
    .string()
    .required("Event name is required")
    .min(3, "Event name must be at least 3 characters")
    .max(150, "Event name must be less than 150 characters"),

  eventType: yup
    .string()
    .required("Event type is required")
    .oneOf(Object.values(EVENT_TYPES), "Invalid event type"),

  description: yup
    .string()
    .required("Event description is required")
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be less than 5000 characters"),

  // Date/Time
  startDateTime: yup
    .date()
    .required("Start date and time is required")
    .min(new Date(), "Start date must be in the future"),

  endDateTime: yup
    .date()
    .required("End date and time is required")
    .min(yup.ref("startDateTime"), "End date must be after start date"),

  timezone: yup.string().required("Timezone is required"),

  // Location (conditional based on event type)
  address: yup.string().when("eventType", {
    is: (val) => val === EVENT_TYPES.IN_PERSON || val === EVENT_TYPES.HYBRID,
    then: (schema) => schema.required("Address is required for in-person events"),
    otherwise: (schema) => schema.nullable(),
  }),

  city: yup.string().when("eventType", {
    is: (val) => val === EVENT_TYPES.IN_PERSON || val === EVENT_TYPES.HYBRID,
    then: (schema) => schema.required("City is required"),
    otherwise: (schema) => schema.nullable(),
  }),

  state: yup.string().when("eventType", {
    is: (val) => val === EVENT_TYPES.IN_PERSON || val === EVENT_TYPES.HYBRID,
    then: (schema) => schema.required("State is required"),
    otherwise: (schema) => schema.nullable(),
  }),

  zipCode: yup.string().when("eventType", {
    is: (val) => val === EVENT_TYPES.IN_PERSON || val === EVENT_TYPES.HYBRID,
    then: (schema) =>
      schema
        .required("Zip code is required")
        .matches(/^\d{5}(-\d{4})?$/, "Invalid zip code format"),
    otherwise: (schema) => schema.nullable(),
  }),

  virtualLink: yup.string().when("eventType", {
    is: (val) => val === EVENT_TYPES.VIRTUAL || val === EVENT_TYPES.HYBRID,
    then: (schema) =>
      schema
        .required("Virtual link is required for virtual events")
        .url("Please enter a valid URL"),
    otherwise: (schema) => schema.nullable(),
  }),

  // Categories
  industries: yup
    .array()
    .of(yup.string())
    .min(1, "Please select at least one industry/category")
    .max(5, "Maximum 5 industries/categories allowed"),

  // Contact
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address"),

  phone: yup
    .string()
    .nullable()
    .matches(
      /^[\d\s\-+()]*$/,
      "Please enter a valid phone number"
    ),

  // Media
  eventImage: yup.string().nullable(),
});

/**
 * Simplified validation schema for bulk upload
 * Less strict validation for CSV/Excel imports
 */
export const bulkUploadValidationSchema = yup.object().shape({
  organizationName: yup.string().required("Organization name is required"),
  eventName: yup.string().required("Event name is required"),
  eventType: yup
    .string()
    .required("Event type is required")
    .oneOf(Object.values(EVENT_TYPES), "Invalid event type"),
  description: yup.string().required("Description is required"),
  startDateTime: yup.date().required("Start date is required"),
  endDateTime: yup.date().required("End date is required"),
  email: yup.string().required("Email is required").email("Invalid email"),
  industries: yup.array().min(1, "At least one industry required"),
});

/**
 * Get all canonical field names
 */
export const getCanonicalFieldNames = () => Object.keys(DEFAULT_EVENT);

/**
 * Check if a field name is canonical
 */
export const isCanonicalFieldName = (fieldName) =>
  Object.keys(DEFAULT_EVENT).includes(fieldName);

/**
 * Get the canonical name for a potentially legacy field
 */
export const getCanonicalFieldName = (fieldName) =>
  LEGACY_FIELD_MAPPINGS[fieldName] || fieldName;

export default {
  EVENT_TYPES,
  EVENT_STATUS,
  DEFAULT_EVENT,
  LEGACY_FIELD_MAPPINGS,
  DUAL_WRITE_FIELDS,
  eventValidationSchema,
  bulkUploadValidationSchema,
  getCanonicalFieldNames,
  isCanonicalFieldName,
  getCanonicalFieldName,
};
