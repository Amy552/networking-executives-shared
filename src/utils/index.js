// Normalizer utilities
export {
  normalizeEventData,
  prepareEventForSave,
  prepareEventForForm,
  getEventChanges,
  validateRequiredFields,
} from "./normalizer.js";

export { default as normalizer } from "./normalizer.js";

// Date utilities
export {
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
} from "./dateUtils.js";

export { default as dateUtils } from "./dateUtils.js";
