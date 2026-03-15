/**
 * Event Service
 *
 * Provides Firestore CRUD operations for events with dual-write support
 * for backward compatibility during migration.
 *
 * IMPORTANT: This service requires Firebase to be initialized in the consuming app.
 * Pass the Firestore instance to initializeEventService() before using other functions.
 */

import {
  normalizeEventData,
  prepareEventForSave,
  prepareEventForForm,
} from "../utils/normalizer.js";
import { EVENT_STATUS, DUAL_WRITE_FIELDS } from "../schemas/event.js";

// Firestore instance - must be set via initializeEventService
let db = null;
let firestoreFunctions = null;

/**
 * Initialize the event service with Firestore instance
 * Must be called before using any other functions
 *
 * @param {Object} firestore - Firestore instance from Firebase
 * @param {Object} functions - Firestore functions (collection, doc, etc.)
 */
export function initializeEventService(firestore, functions) {
  db = firestore;
  firestoreFunctions = functions;
}

/**
 * Check if the service is initialized
 */
function ensureInitialized() {
  if (!db || !firestoreFunctions) {
    throw new Error(
      "Event service not initialized. Call initializeEventService(db, functions) first."
    );
  }
}

/**
 * Get the events collection reference
 */
function getEventsCollection() {
  ensureInitialized();
  return firestoreFunctions.collection(db, "events");
}

/**
 * Get a document reference for a specific event
 */
function getEventDoc(eventId) {
  ensureInitialized();
  return firestoreFunctions.doc(db, "events", eventId);
}

/**
 * Save event result structure
 * @typedef {Object} SaveEventResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {string} id - Event ID (new or existing)
 * @property {Object} data - Saved event data
 * @property {string} error - Error message if failed
 */

/**
 * Create a new event in Firestore
 *
 * @param {Object} eventData - Event data to save
 * @param {Object} options - Save options
 * @param {boolean} options.isAdmin - Whether this is an admin operation
 * @param {boolean} options.includeLegacyFields - Whether to include legacy fields (dual-write)
 * @returns {Promise<SaveEventResult>} Result object
 */
export async function createEvent(eventData, options = {}) {
  ensureInitialized();

  const { isAdmin = false, includeLegacyFields = true } = options;

  try {
    // Prepare data for save (normalizes and adds dual-write fields)
    const prepared = prepareEventForSave(eventData, {
      isAdmin,
      includeLegacyFields,
    });

    // Set status based on context
    if (!prepared.status) {
      prepared.status = isAdmin ? EVENT_STATUS.APPROVED : EVENT_STATUS.PENDING;
    }

    // Add timestamps
    const now = new Date();
    prepared.createdAt = now;
    prepared.updatedAt = now;

    // Create in Firestore
    const docRef = await firestoreFunctions.addDoc(getEventsCollection(), prepared);

    return {
      success: true,
      id: docRef.id,
      data: { ...prepared, id: docRef.id },
      error: null,
    };
  } catch (error) {
    console.error("Error creating event:", error);
    return {
      success: false,
      id: null,
      data: null,
      error: error.message,
    };
  }
}

/**
 * Update an existing event in Firestore
 *
 * @param {string} eventId - Event ID to update
 * @param {Object} eventData - Updated event data
 * @param {Object} options - Update options
 * @param {boolean} options.isAdmin - Whether this is an admin operation
 * @param {boolean} options.includeLegacyFields - Whether to include legacy fields (dual-write)
 * @param {boolean} options.merge - Whether to merge with existing data (default: true)
 * @returns {Promise<SaveEventResult>} Result object
 */
export async function updateEvent(eventId, eventData, options = {}) {
  ensureInitialized();

  const { isAdmin = false, includeLegacyFields = true, merge = true } = options;

  try {
    // Prepare data for save
    const prepared = prepareEventForSave(eventData, {
      isAdmin,
      includeLegacyFields,
    });

    // Update timestamp
    prepared.updatedAt = new Date();

    // Remove createdAt to prevent overwriting
    delete prepared.createdAt;

    // Update in Firestore
    const docRef = getEventDoc(eventId);

    if (merge) {
      await firestoreFunctions.updateDoc(docRef, prepared);
    } else {
      await firestoreFunctions.setDoc(docRef, prepared);
    }

    return {
      success: true,
      id: eventId,
      data: { ...prepared, id: eventId },
      error: null,
    };
  } catch (error) {
    console.error("Error updating event:", error);
    return {
      success: false,
      id: eventId,
      data: null,
      error: error.message,
    };
  }
}

/**
 * Save event (create or update based on presence of ID)
 *
 * @param {Object} eventData - Event data to save
 * @param {Object} options - Save options
 * @returns {Promise<SaveEventResult>} Result object
 */
export async function saveEvent(eventData, options = {}) {
  if (eventData.id) {
    return updateEvent(eventData.id, eventData, options);
  } else {
    return createEvent(eventData, options);
  }
}

/**
 * Get a single event by ID
 *
 * @param {string} eventId - Event ID
 * @returns {Promise<Object|null>} Normalized event data or null if not found
 */
export async function getEvent(eventId) {
  ensureInitialized();

  try {
    const docRef = getEventDoc(eventId);
    const docSnap = await firestoreFunctions.getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return prepareEventForForm({ ...data, id: docSnap.id });
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting event:", error);
    return null;
  }
}

/**
 * Delete an event
 *
 * @param {string} eventId - Event ID to delete
 * @returns {Promise<{success: boolean, error: string|null}>} Result object
 */
export async function deleteEvent(eventId) {
  ensureInitialized();

  try {
    const docRef = getEventDoc(eventId);
    await firestoreFunctions.deleteDoc(docRef);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Query events with filters
 *
 * @param {Object} filters - Query filters
 * @param {string} filters.status - Filter by status
 * @param {string} filters.organizerId - Filter by organizer ID
 * @param {string} filters.createdBy - Filter by creator UID
 * @param {Date} filters.startAfter - Events starting after this date
 * @param {Date} filters.startBefore - Events starting before this date
 * @param {number} filters.limit - Maximum number of results
 * @param {string} filters.orderBy - Field to order by (default: startDateTime)
 * @param {string} filters.orderDirection - Order direction ('asc' or 'desc')
 * @returns {Promise<Object[]>} Array of normalized event data
 */
export async function queryEvents(filters = {}) {
  ensureInitialized();

  try {
    let q = getEventsCollection();
    const constraints = [];

    // Build query constraints
    if (filters.status) {
      constraints.push(firestoreFunctions.where("status", "==", filters.status));
    }

    if (filters.organizerId) {
      constraints.push(
        firestoreFunctions.where("organizerId", "==", filters.organizerId)
      );
    }

    if (filters.createdBy) {
      constraints.push(
        firestoreFunctions.where("createdBy", "==", filters.createdBy)
      );
    }

    if (filters.startAfter) {
      // Query both canonical and legacy field names
      constraints.push(
        firestoreFunctions.where("startDateTime", ">=", filters.startAfter)
      );
    }

    if (filters.startBefore) {
      constraints.push(
        firestoreFunctions.where("startDateTime", "<=", filters.startBefore)
      );
    }

    // Order by
    const orderField = filters.orderBy || "startDateTime";
    const orderDir = filters.orderDirection || "asc";
    constraints.push(firestoreFunctions.orderBy(orderField, orderDir));

    // Limit
    if (filters.limit) {
      constraints.push(firestoreFunctions.limit(filters.limit));
    }

    // Execute query
    q = firestoreFunctions.query(q, ...constraints);
    const querySnapshot = await firestoreFunctions.getDocs(q);

    // Normalize results
    const events = [];
    querySnapshot.forEach((doc) => {
      events.push(prepareEventForForm({ ...doc.data(), id: doc.id }));
    });

    return events;
  } catch (error) {
    console.error("Error querying events:", error);
    return [];
  }
}

/**
 * Get events for an organizer
 *
 * @param {string} organizerId - Organizer ID
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Array of events
 */
export async function getOrganizerEvents(organizerId, options = {}) {
  return queryEvents({
    organizerId,
    orderBy: "startDateTime",
    orderDirection: "desc",
    ...options,
  });
}

/**
 * Get upcoming events (starting in the future)
 *
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Array of upcoming events
 */
export async function getUpcomingEvents(options = {}) {
  return queryEvents({
    startAfter: new Date(),
    status: EVENT_STATUS.APPROVED,
    orderBy: "startDateTime",
    orderDirection: "asc",
    ...options,
  });
}

/**
 * Get pending events (for admin review)
 *
 * @param {Object} options - Query options
 * @returns {Promise<Object[]>} Array of pending events
 */
export async function getPendingEvents(options = {}) {
  return queryEvents({
    status: EVENT_STATUS.PENDING,
    orderBy: "createdAt",
    orderDirection: "desc",
    ...options,
  });
}

/**
 * Update event status
 *
 * @param {string} eventId - Event ID
 * @param {string} status - New status
 * @returns {Promise<SaveEventResult>} Result object
 */
export async function updateEventStatus(eventId, status) {
  ensureInitialized();

  try {
    const docRef = getEventDoc(eventId);
    await firestoreFunctions.updateDoc(docRef, {
      status,
      updatedAt: new Date(),
    });

    return {
      success: true,
      id: eventId,
      data: { status },
      error: null,
    };
  } catch (error) {
    console.error("Error updating event status:", error);
    return {
      success: false,
      id: eventId,
      data: null,
      error: error.message,
    };
  }
}

/**
 * Check for duplicate events
 * (Same organization, same name, same date)
 *
 * @param {Object} eventData - Event data to check
 * @param {string} excludeId - Event ID to exclude from check (for updates)
 * @returns {Promise<boolean>} Whether a duplicate exists
 */
/**
 * Duplicate detection warning message (client-provided copy)
 */
export const DUPLICATE_EVENT_WARNING =
  "NOTICE: Another event is scheduled for the same time and location. Please ensure that this submission is not a duplicate. Thank you.";

/**
 * Check for duplicate events by matching startDateTime + location (lat/lng).
 *
 * @param {Object} params
 * @param {string|Date} params.startDateTime - Start date/time of the event to check
 * @param {number|null}  params.latitude     - Latitude (null for virtual events — skips check)
 * @param {number|null}  params.longitude    - Longitude
 * @param {string|null}  params.excludeId    - Event ID to exclude (for edit flows)
 * @returns {Promise<{ isDuplicate: boolean, matchingEvent?: { id: string, eventTitle: string, startDateTime: string } }>}
 */
export async function checkDuplicateEvent({ startDateTime, latitude, longitude, excludeId = null }) {
  ensureInitialized();

  // Nothing to compare without coordinates or start time
  if (latitude == null || longitude == null || !startDateTime) {
    return { isDuplicate: false };
  }

  const truncate = (num) => parseFloat(Number(num).toFixed(5));
  const targetLat = truncate(latitude);
  const targetLng = truncate(longitude);

  // Handle Firestore Timestamp, Date object, or ISO string
  const toTimestamp = (val) => {
    if (val && typeof val.toDate === "function") return val.toDate().getTime();
    if (val && typeof val.seconds === "number") return val.seconds * 1000;
    const d = val instanceof Date ? val : new Date(val);
    return d.getTime();
  };
  const targetTimestamp = toTimestamp(startDateTime);

  if (isNaN(targetTimestamp)) {
    return { isDuplicate: false };
  }

  try {
    const querySnapshot = await firestoreFunctions.getDocs(getEventsCollection());

    for (const doc of querySnapshot.docs) {
      if (excludeId && doc.id === excludeId) continue;

      const data = doc.data();
      if (data.status === "rejected" || data.status === "denied") continue;
      if (data.latitude == null || data.longitude == null) continue;

      const dbLat = truncate(data.latitude);
      const dbLng = truncate(data.longitude);
      const dbStartRaw = data.startDateTime || data.starteventDateTime;
      if (!dbStartRaw) continue;

      const dbTimestamp = toTimestamp(dbStartRaw);

      if (dbLat === targetLat && dbLng === targetLng && dbTimestamp === targetTimestamp) {
        return {
          isDuplicate: true,
          matchingEvent: {
            id: doc.id,
            eventTitle: data.eventTitle || "",
            startDateTime: dbStartRaw,
          },
        };
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error("Error checking for duplicate event:", error);
    return { isDuplicate: false };
  }
}

/**
 * Bulk create events (for CSV/Excel import)
 *
 * @param {Object[]} eventsData - Array of event data objects
 * @param {Object} options - Save options
 * @returns {Promise<{success: number, failed: number, errors: Object[]}>} Results
 */
export async function bulkCreateEvents(eventsData, options = {}) {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < eventsData.length; i++) {
    const eventData = eventsData[i];
    const result = await createEvent(eventData, options);

    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({
        index: i,
        data: eventData,
        error: result.error,
      });
    }
  }

  return results;
}

export default {
  initializeEventService,
  createEvent,
  updateEvent,
  saveEvent,
  getEvent,
  deleteEvent,
  queryEvents,
  getOrganizerEvents,
  getUpcomingEvents,
  getPendingEvents,
  updateEventStatus,
  checkDuplicateEvent,
  DUPLICATE_EVENT_WARNING,
  bulkCreateEvents,
};
