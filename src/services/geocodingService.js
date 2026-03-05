/**
 * Geocoding Service
 *
 * Provides address-to-coordinates conversion using Google Maps Geocoding API.
 * Consolidated from implementations in both networking-executives and admin projects.
 */

// Google Maps API Key - should be moved to environment variable in production
const GOOGLE_MAPS_API_KEY = "AIzaSyANLvk-LnUPrX_9uRicFUFz4ML0By2Ob1I";

/**
 * Geocode result structure
 * @typedef {Object} GeocodeResult
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} formattedAddress - Formatted address from Google
 * @property {Object} addressComponents - Parsed address components
 */

/**
 * Geocodes an address using Google Maps Geocoding API
 * Converts street addresses to latitude/longitude coordinates
 *
 * @param {string} address - Street address to geocode
 * @returns {Promise<GeocodeResult|null>} Coordinates object or null if failed
 * @example
 * const result = await geocodeAddress("123 Main St, Dallas, TX 75201");
 * // Returns: { lat: 32.7767, lng: -96.7970, formattedAddress: "...", addressComponents: {...} }
 */
export async function geocodeAddress(address) {
  if (!address || typeof address !== "string" || address.trim().length === 0) {
    console.warn("geocodeAddress: Invalid or empty address provided");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;

      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
        addressComponents: parseAddressComponents(result.address_components),
      };
    } else {
      console.warn("Geocoding failed:", data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

/**
 * Geocodes a full address object (with separate fields)
 *
 * @param {Object} addressObj - Address object with separate fields
 * @param {string} addressObj.address - Street address
 * @param {string} addressObj.city - City
 * @param {string} addressObj.state - State
 * @param {string} addressObj.zipCode - Zip code
 * @returns {Promise<GeocodeResult|null>} Coordinates object or null if failed
 */
export async function geocodeAddressObject(addressObj) {
  const { address, city, state, zipCode } = addressObj;
  const parts = [address, city, state, zipCode].filter(Boolean);
  const fullAddress = parts.join(", ");

  return geocodeAddress(fullAddress);
}

/**
 * Parse Google's address_components into a more usable format
 *
 * @param {Array} components - Google's address_components array
 * @returns {Object} Parsed address components
 */
function parseAddressComponents(components) {
  const parsed = {
    streetNumber: "",
    route: "",
    city: "",
    state: "",
    stateShort: "",
    zipCode: "",
    country: "",
    countryShort: "",
  };

  if (!components || !Array.isArray(components)) {
    return parsed;
  }

  for (const component of components) {
    const types = component.types;

    if (types.includes("street_number")) {
      parsed.streetNumber = component.long_name;
    } else if (types.includes("route")) {
      parsed.route = component.long_name;
    } else if (types.includes("locality")) {
      parsed.city = component.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      parsed.state = component.long_name;
      parsed.stateShort = component.short_name;
    } else if (types.includes("postal_code")) {
      parsed.zipCode = component.long_name;
    } else if (types.includes("country")) {
      parsed.country = component.long_name;
      parsed.countryShort = component.short_name;
    }
  }

  return parsed;
}

/**
 * Reverse geocode coordinates to get address information
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object|null>} Address information or null if failed
 */
export async function reverseGeocode(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    console.warn("reverseGeocode: Invalid coordinates provided");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];

      return {
        formattedAddress: result.formatted_address,
        addressComponents: parseAddressComponents(result.address_components),
      };
    } else {
      console.warn("Reverse geocoding failed:", data.status);
      return null;
    }
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
}

/**
 * Validate coordinates are within valid ranges
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} Whether coordinates are valid
 */
export function isValidCoordinates(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Format coordinates for display
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} precision - Decimal precision (default: 6)
 * @returns {string} Formatted coordinate string
 */
export function formatCoordinates(lat, lng, precision = 6) {
  if (!isValidCoordinates(lat, lng)) {
    return "";
  }

  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

export default {
  geocodeAddress,
  geocodeAddressObject,
  reverseGeocode,
  isValidCoordinates,
  formatCoordinates,
};
