import { useState, useCallback } from "react";
import {
  geocodeAddress,
  geocodeAddressObject,
  isValidCoordinates,
} from "../services/geocodingService.js";

/**
 * useGeocoding Hook
 *
 * Provides geocoding functionality with loading and error states.
 *
 * @param {Object} options - Hook options
 * @param {Function} options.onSuccess - Callback when geocoding succeeds
 * @param {Function} options.onError - Callback when geocoding fails
 * @returns {Object} Geocoding state and functions
 */
export function useGeocoding(options = {}) {
  const { onSuccess = null, onError = null } = options;

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState(null);
  const [geocodeError, setGeocodeError] = useState(null);

  /**
   * Geocode a single address string
   */
  const geocode = useCallback(
    async (address) => {
      if (!address || typeof address !== "string" || !address.trim()) {
        const error = "Please enter a valid address";
        setGeocodeError(error);
        if (onError) onError(error);
        return null;
      }

      setIsGeocoding(true);
      setGeocodeError(null);

      try {
        const result = await geocodeAddress(address);

        if (result && isValidCoordinates(result.lat, result.lng)) {
          setGeocodeResult(result);
          setGeocodeError(null);
          if (onSuccess) onSuccess(result);
          return result;
        } else {
          const error = "Could not find coordinates for this address";
          setGeocodeError(error);
          setGeocodeResult(null);
          if (onError) onError(error);
          return null;
        }
      } catch (error) {
        const errorMsg = error.message || "Geocoding failed";
        setGeocodeError(errorMsg);
        setGeocodeResult(null);
        if (onError) onError(errorMsg);
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    [onSuccess, onError]
  );

  /**
   * Geocode an address object with separate fields
   */
  const geocodeFromFields = useCallback(
    async (addressFields) => {
      const { address, city, state, zipCode } = addressFields;

      // Build full address string
      const parts = [address, city, state, zipCode].filter(Boolean);
      if (parts.length === 0) {
        const error = "Please enter address information";
        setGeocodeError(error);
        if (onError) onError(error);
        return null;
      }

      setIsGeocoding(true);
      setGeocodeError(null);

      try {
        const result = await geocodeAddressObject(addressFields);

        if (result && isValidCoordinates(result.lat, result.lng)) {
          setGeocodeResult(result);
          setGeocodeError(null);
          if (onSuccess) onSuccess(result);
          return result;
        } else {
          const error = "Could not find coordinates for this address";
          setGeocodeError(error);
          setGeocodeResult(null);
          if (onError) onError(error);
          return null;
        }
      } catch (error) {
        const errorMsg = error.message || "Geocoding failed";
        setGeocodeError(errorMsg);
        setGeocodeResult(null);
        if (onError) onError(errorMsg);
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    [onSuccess, onError]
  );

  /**
   * Clear geocoding results and errors
   */
  const clearGeocode = useCallback(() => {
    setGeocodeResult(null);
    setGeocodeError(null);
  }, []);

  /**
   * Check if we have valid coordinates
   */
  const hasValidCoordinates =
    geocodeResult && isValidCoordinates(geocodeResult.lat, geocodeResult.lng);

  return {
    // State
    isGeocoding,
    geocodeResult,
    geocodeError,
    hasValidCoordinates,

    // Functions
    geocode,
    geocodeFromFields,
    clearGeocode,
  };
}

export default useGeocoding;
