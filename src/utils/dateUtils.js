import { format, parseISO, isValid, isBefore, isAfter, addHours } from "date-fns";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Common date format patterns
 */
export const DATE_FORMATS = {
  // Display formats
  DISPLAY_DATE: "MMMM d, yyyy", // January 15, 2025
  DISPLAY_TIME: "h:mm a", // 3:30 PM
  DISPLAY_DATETIME: "MMMM d, yyyy 'at' h:mm a", // January 15, 2025 at 3:30 PM
  DISPLAY_SHORT: "MMM d, yyyy", // Jan 15, 2025
  DISPLAY_SHORT_TIME: "MMM d, h:mm a", // Jan 15, 3:30 PM

  // Input formats
  INPUT_DATE: "yyyy-MM-dd", // 2025-01-15
  INPUT_TIME: "HH:mm", // 15:30
  INPUT_DATETIME: "yyyy-MM-dd'T'HH:mm", // 2025-01-15T15:30

  // ISO formats
  ISO_DATE: "yyyy-MM-dd",
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ssXXX",
};

/**
 * Format a date for display
 *
 * @param {Date|string|number} date - Date to format
 * @param {string} formatPattern - Format pattern (default: DISPLAY_DATETIME)
 * @returns {string} - Formatted date string
 */
export function formatDate(date, formatPattern = DATE_FORMATS.DISPLAY_DATETIME) {
  const dateObj = toDateObject(date);
  if (!dateObj) return "";
  return format(dateObj, formatPattern);
}

/**
 * Format a date in a specific timezone
 *
 * @param {Date|string|number} date - Date to format
 * @param {string} timezone - IANA timezone ID (e.g., "America/New_York")
 * @param {string} formatPattern - Format pattern
 * @returns {string} - Formatted date string in the specified timezone
 */
export function formatDateInTimezone(
  date,
  timezone,
  formatPattern = DATE_FORMATS.DISPLAY_DATETIME
) {
  const dateObj = toDateObject(date);
  if (!dateObj || !timezone) return formatDate(date, formatPattern);

  try {
    return formatInTimeZone(dateObj, timezone, formatPattern);
  } catch (error) {
    console.warn(`Invalid timezone "${timezone}", falling back to local:`, error);
    return formatDate(date, formatPattern);
  }
}

/**
 * Format event date range for display
 *
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {string} timezone - Optional timezone
 * @returns {string} - Formatted date range
 */
export function formatEventDateRange(startDate, endDate, timezone = null) {
  const start = toDateObject(startDate);
  const end = toDateObject(endDate);

  if (!start || !end) return "";

  const formatFn = timezone
    ? (d, fmt) => formatDateInTimezone(d, timezone, fmt)
    : (d, fmt) => formatDate(d, fmt);

  // Same day
  if (formatFn(start, DATE_FORMATS.INPUT_DATE) === formatFn(end, DATE_FORMATS.INPUT_DATE)) {
    return `${formatFn(start, DATE_FORMATS.DISPLAY_SHORT)} ${formatFn(start, DATE_FORMATS.DISPLAY_TIME)} - ${formatFn(end, DATE_FORMATS.DISPLAY_TIME)}`;
  }

  // Different days
  return `${formatFn(start, DATE_FORMATS.DISPLAY_SHORT_TIME)} - ${formatFn(end, DATE_FORMATS.DISPLAY_SHORT_TIME)}`;
}

/**
 * Convert any date value to a Date object
 *
 * @param {any} value - Date value (Date, string, number, Firestore Timestamp)
 * @returns {Date|null} - Date object or null if invalid
 */
export function toDateObject(value) {
  if (!value) return null;

  // Already a Date
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  // Firestore Timestamp
  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  // String
  if (typeof value === "string") {
    // Try ISO parse first
    const parsed = parseISO(value);
    if (isValid(parsed)) return parsed;

    // Try standard Date constructor
    const fallback = new Date(value);
    return isValid(fallback) ? fallback : null;
  }

  // Number (timestamp)
  if (typeof value === "number") {
    const fromNumber = new Date(value);
    return isValid(fromNumber) ? fromNumber : null;
  }

  return null;
}

/**
 * Convert a local datetime to UTC for storage
 *
 * @param {Date|string} date - Local date
 * @param {string} timezone - Source timezone
 * @returns {Date} - UTC date
 */
export function toUTC(date, timezone) {
  const dateObj = toDateObject(date);
  if (!dateObj) return null;

  try {
    return fromZonedTime(dateObj, timezone);
  } catch (error) {
    console.warn("Error converting to UTC:", error);
    return dateObj;
  }
}

/**
 * Convert a UTC datetime to local for display
 *
 * @param {Date|string} date - UTC date
 * @param {string} timezone - Target timezone
 * @returns {Date} - Zoned date
 */
export function fromUTC(date, timezone) {
  const dateObj = toDateObject(date);
  if (!dateObj) return null;

  try {
    return toZonedTime(dateObj, timezone);
  } catch (error) {
    console.warn("Error converting from UTC:", error);
    return dateObj;
  }
}

/**
 * Check if a date is in the past
 *
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in the past
 */
export function isPast(date) {
  const dateObj = toDateObject(date);
  if (!dateObj) return false;
  return isBefore(dateObj, new Date());
}

/**
 * Check if a date is in the future
 *
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is in the future
 */
export function isFuture(date) {
  const dateObj = toDateObject(date);
  if (!dateObj) return false;
  return isAfter(dateObj, new Date());
}

/**
 * Get the default end time (2 hours after start)
 *
 * @param {Date|string} startDate - Start date
 * @returns {Date} - Default end date
 */
export function getDefaultEndTime(startDate) {
  const start = toDateObject(startDate);
  if (!start) return null;
  return addHours(start, 2);
}

/**
 * Combine separate date and time inputs into a single Date
 *
 * @param {string} dateString - Date string (yyyy-MM-dd)
 * @param {string} timeString - Time string (HH:mm)
 * @returns {Date|null} - Combined Date object
 */
export function combineDateAndTime(dateString, timeString) {
  if (!dateString || !timeString) return null;

  const combined = `${dateString}T${timeString}`;
  const parsed = parseISO(combined);

  return isValid(parsed) ? parsed : null;
}

/**
 * Split a Date into separate date and time strings for form inputs
 *
 * @param {Date|string} date - Date to split
 * @returns {Object} - { date: string, time: string }
 */
export function splitDateAndTime(date) {
  const dateObj = toDateObject(date);
  if (!dateObj) return { date: "", time: "" };

  return {
    date: format(dateObj, DATE_FORMATS.INPUT_DATE),
    time: format(dateObj, DATE_FORMATS.INPUT_TIME),
  };
}

/**
 * Get timezone abbreviation (e.g., "EST", "PST")
 *
 * @param {string} timezone - IANA timezone ID
 * @param {Date} date - Date for DST calculation
 * @returns {string} - Timezone abbreviation
 */
export function getTimezoneAbbreviation(timezone, date = new Date()) {
  if (!timezone) return "";

  try {
    return formatInTimeZone(date, timezone, "zzz");
  } catch {
    return "";
  }
}

/**
 * Get common US timezones for dropdown
 */
export const US_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
];

export default {
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
};
