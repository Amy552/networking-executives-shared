/**
 * Timezone Service
 *
 * Provides timezone detection and formatting using Google Time Zone API.
 * Consolidated from implementations in both networking-executives and admin projects.
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Timezone abbreviation mappings for US timezones
 */
const TIMEZONE_ABBREVIATIONS = {
  // Standard time
  "America/New_York": { standard: "EST", daylight: "EDT" },
  "America/Chicago": { standard: "CST", daylight: "CDT" },
  "America/Denver": { standard: "MST", daylight: "MDT" },
  "America/Phoenix": { standard: "MST", daylight: "MST" }, // Arizona doesn't observe DST
  "America/Los_Angeles": { standard: "PST", daylight: "PDT" },
  "America/Anchorage": { standard: "AKST", daylight: "AKDT" },
  "America/Honolulu": { standard: "HST", daylight: "HST" }, // Hawaii doesn't observe DST

  // Additional US timezones
  "America/Detroit": { standard: "EST", daylight: "EDT" },
  "America/Indiana/Indianapolis": { standard: "EST", daylight: "EDT" },
  "America/Kentucky/Louisville": { standard: "EST", daylight: "EDT" },
  "America/Boise": { standard: "MST", daylight: "MDT" },
  "America/Juneau": { standard: "AKST", daylight: "AKDT" },

  // Default fallback
  UTC: { standard: "UTC", daylight: "UTC" },
};

/**
 * Common US timezone options for dropdowns
 */
export const US_TIMEZONE_OPTIONS = [
  { value: "America/New_York", label: "Eastern Time (ET)", abbr: "ET" },
  { value: "America/Chicago", label: "Central Time (CT)", abbr: "CT" },
  { value: "America/Denver", label: "Mountain Time (MT)", abbr: "MT" },
  { value: "America/Phoenix", label: "Arizona Time (AZ)", abbr: "AZ" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", abbr: "PT" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)", abbr: "AKT" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)", abbr: "HT" },
];

/**
 * Timezone result structure
 * @typedef {Object} TimezoneResult
 * @property {string} timeZoneId - IANA timezone ID (e.g., "America/Chicago")
 * @property {string} timeZoneName - Full timezone name (e.g., "Central Daylight Time")
 * @property {string} timeZoneAbbr - Abbreviation (e.g., "CDT")
 * @property {number} rawOffset - Base offset from UTC in seconds
 * @property {number} dstOffset - DST offset in seconds (0 if not in DST)
 * @property {boolean} isDST - Whether DST is currently active
 */

/**
 * Gets timezone abbreviation based on timezone ID and whether DST is active
 *
 * @param {string} timeZoneId - IANA timezone ID (e.g., "America/Chicago")
 * @param {boolean} isDST - Whether daylight saving time is active
 * @returns {string} Timezone abbreviation (e.g., "CST" or "CDT")
 */
export function getTimezoneAbbreviation(timeZoneId, isDST = false) {
  const mapping = TIMEZONE_ABBREVIATIONS[timeZoneId];

  if (!mapping) {
    // Fallback to CST for unknown timezones (Dallas-based platform)
    return isDST ? "CDT" : "CST";
  }

  return isDST ? mapping.daylight : mapping.standard;
}

/**
 * Gets timezone information for given coordinates using Google Time Zone API
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Date} timestamp - Optional timestamp for DST calculation (defaults to now)
 * @returns {Promise<TimezoneResult|null>} Timezone data or null if failed
 */
export async function getTimezoneForLocation(lat, lng, timestamp = new Date()) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    console.warn("getTimezoneForLocation: Invalid coordinates provided");
    return null;
  }

  const timestampSeconds = Math.floor(timestamp.getTime() / 1000);
  const url = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestampSeconds}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK") {
      // Check if DST is currently active
      const isDST = data.dstOffset !== 0;
      const abbreviation = getTimezoneAbbreviation(data.timeZoneId, isDST);

      return {
        timeZoneId: data.timeZoneId,
        timeZoneName: data.timeZoneName,
        timeZoneAbbr: abbreviation,
        rawOffset: data.rawOffset,
        dstOffset: data.dstOffset,
        isDST: isDST,
      };
    } else {
      console.warn("Timezone API error:", data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error("Error fetching timezone:", error);
    return null;
  }
}

/**
 * Gets default Dallas/Fort Worth timezone information
 * Used as fallback when location-based detection is not available
 *
 * @param {Date} date - Optional date for DST calculation (defaults to now)
 * @returns {TimezoneResult} Default timezone data for Dallas
 */
export function getDefaultTimezone(date = new Date()) {
  const isDST = isDaylightSavingTime(date, "America/Chicago");

  return {
    timeZoneId: "America/Chicago",
    timeZoneName: isDST ? "Central Daylight Time" : "Central Standard Time",
    timeZoneAbbr: isDST ? "CDT" : "CST",
    rawOffset: -21600, // -6 hours in seconds
    dstOffset: isDST ? 3600 : 0,
    isDST: isDST,
  };
}

/**
 * Safely gets timezone abbreviation from event data with fallback
 *
 * @param {Object} event - Event object from Firestore
 * @returns {string} Timezone abbreviation (defaults to Central Time if not available)
 */
export function getEventTimezoneAbbr(event) {
  // Return default if no event
  if (!event) {
    return getDefaultTimezone().timeZoneAbbr;
  }

  // First check for timeZoneAbbr (new events with canonical field)
  if (event.timeZoneAbbr) {
    return event.timeZoneAbbr;
  }

  // Check if we have timezone (canonical) or timeZone (legacy) field
  const timezoneId = event.timezone || event.timeZone;
  if (timezoneId) {
    // Get event date for DST calculation
    const eventDate = getEventDate(event);
    const isDST = isDaylightSavingTime(eventDate, timezoneId);
    return getTimezoneAbbreviation(timezoneId, isDST);
  }

  // Default to Central Time for Dallas-based platform
  const eventDate = getEventDate(event);
  return getDefaultTimezone(eventDate).timeZoneAbbr;
}

/**
 * Get event date from various possible field names
 *
 * @param {Object} event - Event object
 * @returns {Date} Event date or current date if not found
 */
function getEventDate(event) {
  // Try canonical field first
  if (event.startDateTime) {
    return toDateObject(event.startDateTime);
  }

  // Try legacy field
  if (event.starteventDateTime) {
    return toDateObject(event.starteventDateTime);
  }

  return new Date();
}

/**
 * Convert any date value to Date object
 *
 * @param {any} value - Date value (Firestore Timestamp, Date, string, number)
 * @returns {Date} Date object
 */
function toDateObject(value) {
  if (!value) return new Date();

  // Firestore Timestamp
  if (typeof value.toDate === "function") {
    return value.toDate();
  }

  // Already a Date
  if (value instanceof Date) {
    return value;
  }

  // String or number
  return new Date(value);
}

/**
 * Check if a date is during daylight saving time for a given timezone
 *
 * @param {Date} date - Date to check
 * @param {string} timeZoneId - IANA timezone ID
 * @returns {boolean} Whether DST is active
 */
export function isDaylightSavingTime(date, timeZoneId = "America/Chicago") {
  // Simplified DST check for US timezones
  // DST roughly runs from second Sunday in March to first Sunday in November

  // Some zones don't observe DST
  if (
    timeZoneId === "America/Phoenix" ||
    timeZoneId === "America/Honolulu" ||
    timeZoneId === "Pacific/Honolulu"
  ) {
    return false;
  }

  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  // Not DST: November through February
  if (month < 2 || month > 10) {
    return false;
  }

  // DST: April through October (definitely)
  if (month > 2 && month < 10) {
    return true;
  }

  // March: DST starts second Sunday
  if (month === 2) {
    const firstDay = new Date(date.getFullYear(), 2, 1).getDay();
    const secondSunday = firstDay === 0 ? 8 : 15 - firstDay;
    return day >= secondSunday;
  }

  // November: DST ends first Sunday
  if (month === 10) {
    const firstDay = new Date(date.getFullYear(), 10, 1).getDay();
    const firstSunday = firstDay === 0 ? 1 : 8 - firstDay;
    return day < firstSunday;
  }

  return false;
}

/**
 * Format timezone offset as string (e.g., "-06:00")
 *
 * @param {number} offsetSeconds - Offset in seconds
 * @returns {string} Formatted offset string
 */
export function formatTimezoneOffset(offsetSeconds) {
  const totalMinutes = Math.abs(offsetSeconds) / 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const sign = offsetSeconds >= 0 ? "+" : "-";

  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Get total offset (raw + DST) in hours
 *
 * @param {TimezoneResult} timezoneData - Timezone data from API
 * @returns {number} Total offset in hours
 */
export function getTotalOffsetHours(timezoneData) {
  if (!timezoneData) return -6; // Default to CST

  const totalSeconds = timezoneData.rawOffset + timezoneData.dstOffset;
  return totalSeconds / 3600;
}

export default {
  US_TIMEZONE_OPTIONS,
  getTimezoneAbbreviation,
  getTimezoneForLocation,
  getDefaultTimezone,
  getEventTimezoneAbbr,
  isDaylightSavingTime,
  formatTimezoneOffset,
  getTotalOffsetHours,
};
