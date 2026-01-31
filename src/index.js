/**
 * @networking-executives/shared
 *
 * Shared package for event management functionality
 * Used by both networking-executives (main UI) and networking-executives-admin
 *
 * This package provides:
 * - Canonical event schema and validation
 * - Data normalization utilities
 * - Date/time formatting utilities
 * - Shared React hooks (Phase 3)
 * - Shared services (Phase 2)
 * - Shared UI components (Phase 4)
 */

// Schema exports
export {
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
  eventSchema,
} from "./schemas/index.js";

// Utility exports
export {
  // Normalizer
  normalizeEventData,
  prepareEventForSave,
  prepareEventForForm,
  getEventChanges,
  validateRequiredFields,
  normalizer,
  // Date utilities
  DATE_FORMATS,
  formatDate,
  formatDateInTimezone,
  formatEventDateRange,
  toDateObject,
  toUTC,
  fromUTC,
  isPast,
  isFuture,
  getDefaultEndTime,
  combineDateAndTime,
  splitDateAndTime,
  getTimezoneAbbreviation,
  US_TIMEZONES,
  dateUtils,
} from "./utils/index.js";

// Services exports
export {
  // Geocoding
  geocodeAddress,
  geocodeAddressObject,
  reverseGeocode,
  isValidCoordinates,
  formatCoordinates,
  geocodingService,
  // Timezone (note: getTimezoneAbbreviation also in dateUtils, use timezoneService version for full features)
  US_TIMEZONE_OPTIONS,
  getTimezoneForLocation,
  getDefaultTimezone,
  getEventTimezoneAbbr,
  isDaylightSavingTime,
  formatTimezoneOffset,
  getTotalOffsetHours,
  timezoneService,
  // Event Service
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
  eventService,
  // Image Service
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
  imageService,
} from "./services/index.js";

// Hooks exports
export {
  useEventForm,
  useGeocoding,
  useTimezone,
  useImageUpload,
  useEventValidation,
} from "./hooks/index.js";

// Components exports (Phase 4)
export {
  EventForm,
  EventFormActions,
  EventDateTimePicker,
  EventDateTimeRange,
  formatDateForStorage,
  parseDateFromStorage,
  LocationPicker,
  CityPicker,
  RichTextEditor,
  stripHtml,
  ImageCropper,
  useImageCropper,
} from "./components/index.js";

// Bulk Upload utilities
export {
  // Constants
  EXCEL_COLUMNS,
  MULTI_VALUE_SEPARATOR,
  MAX_INDUSTRIES,
  // Utility functions
  normalizeTime,
  normalizeUrl,
  formatLocalDateTime,
  parseExcelFile,
  validateBulkUploadEvents,
  transformEventForFirestore,
} from "./utils/bulkUploadUtils.js";

export {
  generateBulkUploadTemplate,
  downloadBulkUploadTemplate,
} from "./utils/excelTemplateGenerator.js";
