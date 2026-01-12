/**
 * Shared services for event management
 *
 * Services require initialization before use:
 * - eventService: Call initializeEventService(db, firestoreFunctions)
 * - imageService: Call initializeImageService(storage, storageFunctions)
 * - geocodingService & timezoneService: No initialization required (use API key)
 */

// Geocoding Service
export {
  geocodeAddress,
  geocodeAddressObject,
  reverseGeocode,
  isValidCoordinates,
  formatCoordinates,
} from "./geocodingService.js";

export { default as geocodingService } from "./geocodingService.js";

// Timezone Service
export {
  US_TIMEZONE_OPTIONS,
  getTimezoneAbbreviation,
  getTimezoneForLocation,
  getDefaultTimezone,
  getEventTimezoneAbbr,
  isDaylightSavingTime,
  formatTimezoneOffset,
  getTotalOffsetHours,
} from "./timezoneService.js";

export { default as timezoneService } from "./timezoneService.js";

// Event Service
export {
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
  bulkCreateEvents,
} from "./eventService.js";

export { default as eventService } from "./eventService.js";

// Image Service
export {
  initializeImageService,
  COMPRESSION_PRESETS,
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE,
  validateImageFile,
  compressImage,
  generateUniqueFilename,
  uploadImage,
  uploadImageSimple,
  deleteImage,
  getImageDimensions,
  createImagePreview,
  revokeImagePreview,
} from "./imageService.js";

export { default as imageService } from "./imageService.js";
