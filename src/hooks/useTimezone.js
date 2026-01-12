import { useState, useCallback, useEffect } from "react";
import {
  getTimezoneForLocation,
  getDefaultTimezone,
  getTimezoneAbbreviation,
} from "../services/timezoneService.js";

/**
 * useTimezone Hook
 *
 * Provides timezone detection and management with loading states.
 *
 * @param {Object} options - Hook options
 * @param {boolean} options.autoDetect - Auto-detect timezone on mount (default: false)
 * @param {Function} options.onDetected - Callback when timezone is detected
 * @returns {Object} Timezone state and functions
 */
export function useTimezone(options = {}) {
  const { autoDetect = false, onDetected = null } = options;

  const [isDetecting, setIsDetecting] = useState(false);
  const [timezone, setTimezone] = useState(null);
  const [timezoneError, setTimezoneError] = useState(null);

  /**
   * Detect timezone from coordinates
   */
  const detectTimezone = useCallback(
    async (lat, lng, eventDate = new Date()) => {
      if (lat === null || lat === undefined || lng === null || lng === undefined) {
        // Use default timezone if no coordinates
        const defaultTz = getDefaultTimezone(eventDate);
        setTimezone(defaultTz);
        if (onDetected) onDetected(defaultTz);
        return defaultTz;
      }

      setIsDetecting(true);
      setTimezoneError(null);

      try {
        const result = await getTimezoneForLocation(lat, lng, eventDate);

        if (result) {
          setTimezone(result);
          setTimezoneError(null);
          if (onDetected) onDetected(result);
          return result;
        } else {
          // Fallback to default
          const defaultTz = getDefaultTimezone(eventDate);
          setTimezone(defaultTz);
          if (onDetected) onDetected(defaultTz);
          return defaultTz;
        }
      } catch (error) {
        const errorMsg = error.message || "Timezone detection failed";
        setTimezoneError(errorMsg);

        // Still set default timezone
        const defaultTz = getDefaultTimezone(eventDate);
        setTimezone(defaultTz);
        if (onDetected) onDetected(defaultTz);
        return defaultTz;
      } finally {
        setIsDetecting(false);
      }
    },
    [onDetected]
  );

  /**
   * Set timezone manually by IANA ID
   */
  const setTimezoneById = useCallback(
    (timezoneId, eventDate = new Date()) => {
      // Determine if DST is active (rough calculation)
      const month = eventDate.getMonth();
      const isDST = month >= 2 && month <= 10;

      const tzData = {
        timeZoneId: timezoneId,
        timeZoneName: timezoneId.replace(/_/g, " "),
        timeZoneAbbr: getTimezoneAbbreviation(timezoneId, isDST),
        rawOffset: 0, // Unknown without API call
        dstOffset: 0,
        isDST: isDST,
      };

      setTimezone(tzData);
      if (onDetected) onDetected(tzData);
      return tzData;
    },
    [onDetected]
  );

  /**
   * Use default timezone (Dallas/Central)
   */
  const useDefaultTimezone = useCallback(
    (eventDate = new Date()) => {
      const defaultTz = getDefaultTimezone(eventDate);
      setTimezone(defaultTz);
      if (onDetected) onDetected(defaultTz);
      return defaultTz;
    },
    [onDetected]
  );

  /**
   * Clear timezone data
   */
  const clearTimezone = useCallback(() => {
    setTimezone(null);
    setTimezoneError(null);
  }, []);

  // Auto-detect on mount if enabled
  useEffect(() => {
    if (autoDetect && !timezone) {
      useDefaultTimezone();
    }
  }, [autoDetect, timezone, useDefaultTimezone]);

  /**
   * Get formatted timezone string for display
   */
  const getDisplayTimezone = useCallback(() => {
    if (!timezone) return "";
    return `${timezone.timeZoneName} (${timezone.timeZoneAbbr})`;
  }, [timezone]);

  /**
   * Get just the abbreviation
   */
  const getAbbreviation = useCallback(() => {
    return timezone?.timeZoneAbbr || "";
  }, [timezone]);

  /**
   * Get the IANA timezone ID
   */
  const getTimezoneId = useCallback(() => {
    return timezone?.timeZoneId || "";
  }, [timezone]);

  return {
    // State
    isDetecting,
    timezone,
    timezoneError,
    hasTimezone: timezone !== null,

    // Functions
    detectTimezone,
    setTimezoneById,
    useDefaultTimezone,
    clearTimezone,

    // Getters
    getDisplayTimezone,
    getAbbreviation,
    getTimezoneId,
  };
}

export default useTimezone;
