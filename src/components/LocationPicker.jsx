import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api";
import { getTimezoneForLocation, getDefaultTimezone } from "../services/timezoneService.js";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ["places"];

/**
 * LocationPicker Component
 * Google Maps Places Autocomplete with timezone detection
 *
 * @param {Object} props
 * @param {string} props.value - Current address value
 * @param {function} props.onChange - Called with { address, coordinates, timezone }
 * @param {string} props.label - Field label
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.error - Error message
 * @param {string} props.placeholder - Input placeholder
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.layout - Layout: "horizontal" or "vertical"
 * @param {function} props.onValidation - Called with { isValid, error }
 */
export function LocationPicker({
  value = "",
  onChange,
  label = "Address",
  required = false,
  error = null,
  placeholder = "Search for location",
  disabled = false,
  layout = "horizontal",
  onValidation,
  isAdmin = false,
}) {
  const [autocomplete, setAutocomplete] = useState(null);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const isInternalUpdate = useRef(false);

  // Load Google Maps API using hook (safer than LoadScript component)
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Sync input value with prop (only for external changes)
  useEffect(() => {
    if (!isInternalUpdate.current && value !== inputValue) {
      setInputValue(value || "");
    }
    isInternalUpdate.current = false;
  }, [value]);

  const handlePlaceSelect = useCallback(async () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();

    if (!place.geometry) {
      onValidation?.({ isValid: false, error: "Please select a valid location from the dropdown" });
      return;
    }

    setIsLoading(true);

    const selectedAddress = place.formatted_address;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // Extract address components
    const addressComponents = {};
    if (place.address_components) {
      for (const component of place.address_components) {
        const types = component.types;
        if (types.includes("locality")) {
          addressComponents.city = component.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          addressComponents.state = component.long_name;
          addressComponents.stateShort = component.short_name;
        } else if (types.includes("postal_code")) {
          addressComponents.zipCode = component.long_name;
        } else if (types.includes("country")) {
          addressComponents.country = component.long_name;
        }
      }
    }

    isInternalUpdate.current = true;
    setInputValue(selectedAddress);

    /*
     * Google returns place.name on named venues ("The Adolphus Hotel") and
     * echoes the street when the user picked a plain address ("1321 Commerce
     * St"). Only the first case is useful as a venue label — the echo case
     * would duplicate the address on the event page. Cheap check: if name is
     * distinct from the formatted address AND not just the street number
     * prefix of it, keep it. Otherwise pass empty and let the form leave
     * whatever venueName is already there in place.
     */
    const rawName = String(place.name || "").trim();
    const looksLikeStreetEcho =
      rawName && selectedAddress && selectedAddress.toLowerCase().startsWith(rawName.toLowerCase());
    const venueName = rawName && !looksLikeStreetEcho ? rawName : "";

    /*
     * Apply the address + components IMMEDIATELY, before the async timezone
     * lookup. Selecting a suggestion blurs the input, which fires a synchronous
     * address-only onChange (handleInputBlur). If we waited for the awaited
     * timezone fetch to deliver the components, that blur could land in the gap
     * and leave the address filled but city / state / zip empty — the bug Amy
     * reported 2026-08-09. Sending the components now also makes the parent's
     * `value` match inputValue, so the blur handler no-ops instead of clobbering
     * the pick. Timezone is folded in by a second onChange once it resolves.
     */
    onValidation?.({ isValid: true, error: null });
    onChange?.({
      address: selectedAddress,
      venueName,
      coordinates: { lat, lng },
      timezone: null,
      addressComponents,
    });

    // Timezone is a slower lookup; add it when it resolves. This second
    // onChange only contributes the timezone — address/components already landed.
    let timezone = null;
    try {
      timezone = await getTimezoneForLocation(lat, lng);
      if (!timezone?.timeZoneAbbr) {
        timezone = getDefaultTimezone();
      }
    } catch (err) {
      console.error("Error detecting timezone:", err);
      timezone = getDefaultTimezone();
    }

    setIsLoading(false);
    onChange?.({
      address: selectedAddress,
      venueName,
      coordinates: { lat, lng },
      timezone,
      addressComponents,
    });
  }, [autocomplete, onChange, onValidation]);

  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    isInternalUpdate.current = true;
    setInputValue(newValue);
  }, []);

  const handleInputBlur = useCallback(() => {
    // Only update parent if value actually changed
    if (inputValue !== value) {
      // For admins, accept any text as an address (free-text entry)
      // For regular users, require selection from dropdown (coordinates must be set)
      onChange?.({
        address: inputValue,
        coordinates: isAdmin ? null : null, // Admin allows no coordinates
        timezone: null,
      });
    }
  }, [inputValue, value, onChange, isAdmin]);

  const isHorizontal = layout === "horizontal";

  // Show loading state
  if (loadError) {
    return (
      <div className="w-full">
        <div className={`flex w-full ${isHorizontal ? "flex-col lg:flex-row lg:items-center" : "flex-col"}`}>
          <label className={`text-base font-medium text-[#2D2C3C] ${isHorizontal ? "lg:w-[110px]" : ""}`}>
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <div className={`flex-1 ${isHorizontal ? "lg:ml-8" : "mt-1"}`}>
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                error ? "border-red-500" : "border-gray-300"
              } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
            <p className="mt-1 text-sm text-amber-600">Maps unavailable - enter address manually</p>
          </div>
        </div>
        {error && <p className={`mt-1 text-sm text-red-500 ${isHorizontal ? "lg:ml-[9rem]" : ""}`}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className={`flex w-full ${isHorizontal ? "flex-col lg:flex-row lg:items-center" : "flex-col"}`}>
        <label className={`text-base font-medium text-[#2D2C3C] ${isHorizontal ? "lg:w-[110px]" : ""}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <div className={`flex-1 ${isHorizontal ? "lg:ml-8" : "mt-1"}`}>
          {isLoaded ? (
            <Autocomplete
              onLoad={(auto) => setAutocomplete(auto)}
              onPlaceChanged={handlePlaceSelect}
            >
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder={placeholder}
                disabled={disabled || isLoading}
                className={`w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  error ? "border-red-500" : "border-gray-300"
                } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
            </Autocomplete>
          ) : (
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder="Loading maps..."
              disabled={true}
              className="w-full rounded-md border border-gray-300 p-3 text-black shadow-sm bg-gray-100"
            />
          )}

          {isLoading && (
            <p className="mt-1 text-sm text-gray-500">Detecting timezone...</p>
          )}
        </div>
      </div>
      {error && <p className={`mt-1 text-sm text-red-500 ${isHorizontal ? "lg:ml-[9rem]" : ""}`}>{error}</p>}
    </div>
  );
}

/**
 * CityPicker Component
 * Dropdown with city selection or zip code entry
 *
 * @param {Object} props
 * @param {string} props.value - Current city/zip value
 * @param {function} props.onChange - Change handler
 * @param {Array} props.cities - Array of { title, value } city options
 * @param {string} props.label - Field label
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.error - Error message
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.layout - Layout: "horizontal" or "vertical"
 */
export function CityPicker({
  value = "",
  onChange,
  cities = [],
  label = "Select City",
  required = false,
  error = null,
  disabled = false,
  layout = "horizontal",
}) {
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  /**
   * Find a city match using case-insensitive comparison
   * This handles cases where stored value might be "Dallas/Ft Worth" but
   * dropdown value is "dallas/ft worth" (or vice versa)
   */
  const findMatchingCity = useCallback((searchValue) => {
    if (!searchValue || !cities.length) return null;
    const normalizedSearch = searchValue.toLowerCase().trim();
    return cities.find(
      (c) =>
        (c.value && c.value.toLowerCase().trim() === normalizedSearch) ||
        (c.title && c.title.toLowerCase().trim() === normalizedSearch)
    );
  }, [cities]);

  // Get the actual select value - use matched city's value for proper select binding
  const selectValue = useMemo(() => {
    if (!value) return "";
    const matchedCity = findMatchingCity(value);
    if (matchedCity) {
      // Return the city's actual value (or title if no value) for select binding
      return matchedCity.value || matchedCity.title;
    }
    return value; // Custom value (zip code)
  }, [value, findMatchingCity]);

  // Check if current value is a city or custom zip
  useEffect(() => {
    if (value && !findMatchingCity(value)) {
      setIsOtherSelected(true);
    } else if (value && findMatchingCity(value)) {
      setIsOtherSelected(false);
    }
  }, [value, findMatchingCity]);

  const handleSelectChange = useCallback((e) => {
    const selectedValue = e.target.value;
    if (selectedValue === "other") {
      setIsOtherSelected(true);
      onChange("");
    } else {
      setIsOtherSelected(false);
      // Store the city title (proper case) for consistency across the app
      const selectedCity = cities.find(
        (c) => (c.value || c.title) === selectedValue
      );
      onChange(selectedCity?.title || selectedValue);
    }
  }, [onChange, cities]);

  const handleZipChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleBackToCities = useCallback(() => {
    setIsOtherSelected(false);
    onChange("");
  }, [onChange]);

  const isHorizontal = layout === "horizontal";

  return (
    <div className="w-full">
      <div className={`flex w-full ${isHorizontal ? "flex-col lg:flex-row lg:items-center" : "flex-col"}`}>
        <label className={`text-base font-medium text-[#2D2C3C] ${isHorizontal ? "lg:w-[110px]" : ""}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <div className={`flex-1 ${isHorizontal ? "lg:ml-8" : "mt-1"}`}>
          {isOtherSelected ? (
            <div className="flex flex-col items-start">
              <input
                type="text"
                value={value}
                onChange={handleZipChange}
                placeholder="Enter Zip Code"
                maxLength={10}
                disabled={disabled}
                className={`w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  error ? "border-red-500" : "border-gray-300"
                } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              <button
                type="button"
                onClick={handleBackToCities}
                className="mt-2 text-[#030959] hover:underline text-sm"
                disabled={disabled}
              >
                Back to Cities
              </button>
            </div>
          ) : (
            <select
              value={selectValue}
              onChange={handleSelectChange}
              disabled={disabled}
              className={`w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                error ? "border-red-500" : "border-gray-300"
              } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
            >
              <option value="" disabled hidden>
                Select City
              </option>
              {cities.map((city) => (
                <option key={city.value || city.title} value={city.value || city.title}>
                  {city.title}
                </option>
              ))}
              <option value="other">Enter Zip Code</option>
            </select>
          )}
        </div>
      </div>
      {error && <p className={`mt-1 text-sm text-red-500 ${isHorizontal ? "lg:ml-[9rem]" : ""}`}>{error}</p>}
    </div>
  );
}

export default LocationPicker;
