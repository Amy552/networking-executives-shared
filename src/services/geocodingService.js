/**
 * Geocoding Service
 *
 * Address-to-coordinates conversion using the Google Maps JavaScript SDK
 * (`google.maps.Geocoder`). The JS SDK respects HTTP-referer-restricted API
 * keys; the REST Geocoding endpoint does not. We use the SDK so the same key
 * powering Places Autocomplete also powers our geocoding without exposing an
 * unrestricted key in the bundle.
 */

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let _sdkPromise = null;

function loadGoogleMapsSDK() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps SDK requires a browser"));
  }
  if (window.google?.maps?.Geocoder) {
    return Promise.resolve(window.google);
  }
  if (_sdkPromise) return _sdkPromise;

  _sdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-gmaps-loader="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () => reject(new Error("Maps SDK failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly`;
    s.async = true;
    s.defer = true;
    s.dataset.gmapsLoader = "1";
    s.onload = () => resolve(window.google);
    s.onerror = () => {
      _sdkPromise = null;
      reject(new Error("Maps SDK failed to load"));
    };
    document.head.appendChild(s);
  });
  return _sdkPromise;
}

function _toResult(result) {
  const loc = result.geometry.location;
  return {
    lat: typeof loc.lat === "function" ? loc.lat() : loc.lat,
    lng: typeof loc.lng === "function" ? loc.lng() : loc.lng,
    formattedAddress: result.formatted_address,
    addressComponents: parseAddressComponents(result.address_components),
  };
}

/**
 * Geocodes an address using the Google Maps JS SDK Geocoder.
 * @param {string} address
 * @returns {Promise<GeocodeResult|null>}
 */
export async function geocodeAddress(address) {
  if (!address || typeof address !== "string" || address.trim().length === 0) {
    console.warn("geocodeAddress: Invalid or empty address provided");
    return null;
  }

  try {
    const google = await loadGoogleMapsSDK();
    const geocoder = new google.maps.Geocoder();
    const { results } = await geocoder.geocode({ address });
    if (results && results.length > 0) {
      return _toResult(results[0]);
    }
    console.warn("Geocoding: no results for", address);
    return null;
  } catch (error) {
    const status = error?.code || error?.message || error;
    console.warn("Geocoding failed:", status);
    return null;
  }
}

/**
 * Geocodes a full address object (with separate fields).
 * @param {Object} addressObj
 * @returns {Promise<GeocodeResult|null>}
 */
export async function geocodeAddressObject(addressObj) {
  const { address, city, state, zipCode } = addressObj;
  const parts = [address, city, state, zipCode].filter(Boolean);
  return geocodeAddress(parts.join(", "));
}

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
  if (!components || !Array.isArray(components)) return parsed;

  for (const component of components) {
    const types = component.types;
    if (types.includes("street_number")) parsed.streetNumber = component.long_name;
    else if (types.includes("route")) parsed.route = component.long_name;
    else if (types.includes("locality")) parsed.city = component.long_name;
    else if (types.includes("administrative_area_level_1")) {
      parsed.state = component.long_name;
      parsed.stateShort = component.short_name;
    } else if (types.includes("postal_code")) parsed.zipCode = component.long_name;
    else if (types.includes("country")) {
      parsed.country = component.long_name;
      parsed.countryShort = component.short_name;
    }
  }
  return parsed;
}

/**
 * Reverse geocode coordinates to an address.
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{formattedAddress, addressComponents}|null>}
 */
export async function reverseGeocode(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    console.warn("reverseGeocode: Invalid coordinates provided");
    return null;
  }
  try {
    const google = await loadGoogleMapsSDK();
    const geocoder = new google.maps.Geocoder();
    const { results } = await geocoder.geocode({ location: { lat, lng } });
    if (results && results.length > 0) {
      const r = results[0];
      return {
        formattedAddress: r.formatted_address,
        addressComponents: parseAddressComponents(r.address_components),
      };
    }
    return null;
  } catch (error) {
    const status = error?.code || error?.message || error;
    console.warn("Reverse geocoding failed:", status);
    return null;
  }
}

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

export function formatCoordinates(lat, lng, precision = 6) {
  if (!isValidCoordinates(lat, lng)) return "";
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

export default {
  geocodeAddress,
  geocodeAddressObject,
  reverseGeocode,
  isValidCoordinates,
  formatCoordinates,
};
