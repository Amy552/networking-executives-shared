import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { getTimezoneForLocation, getDefaultTimezone } from "../services/timezoneService.js";
import { geocodeAddress } from "../services/geocodingService.js";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ["places"];

/**
 * LocationPicker Component
 *
 * A plain, controlled text input with a CUSTOM address-suggestions dropdown.
 *
 * WHY custom and not @react-google-maps/api's <Autocomplete>: that widget binds
 * Google's own listeners onto the input DOM node and fights React's controlled
 * value from the very first keystroke, which showed a "!" and locked the field
 * (Amy 2026-08-14). Here the input is always an ordinary React input, and the
 * suggestions come from AutocompleteService.getPlacePredictions rendered in our
 * own list, so nothing ever seizes the field. Picking a suggestion resolves it
 * with PlacesService.getDetails to set exact coordinates (for the venue map and
 * the time-zone lookup) plus city / state / zip. Typing and NOT picking is
 * always allowed: the text is accepted as-is and submit geocodes it. If the
 * Places API is unavailable, this degrades to a plain free-text input.
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
 * @param {boolean} props.isAdmin - Admins get a plain input (no suggestions)
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
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isResolving, setIsResolving] = useState(false);

  const isInternalUpdate = useRef(false);
  const acServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const debounceRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // Suggestions are for the interactive path only. Admins keep the plain input.
  const suggestionsEnabled = isLoaded && !loadError && !isAdmin;

  // Sync the input with the prop when it changes EXTERNALLY (e.g. a draft is
  // restored). isInternalUpdate guards our own edits from being clobbered.
  useEffect(() => {
    if (!isInternalUpdate.current && value !== inputValue) {
      setInputValue(value || "");
    }
    isInternalUpdate.current = false;
  }, [value]);

  // Create the Places services once the SDK is ready. PlacesService needs a DOM
  // node or a map; a detached div is the standard headless host for getDetails.
  useEffect(() => {
    if (!suggestionsEnabled) return;
    try {
      const g = window.google;
      if (!g?.maps?.places) return;
      if (!acServiceRef.current) acServiceRef.current = new g.maps.places.AutocompleteService();
      if (!placesServiceRef.current) {
        placesServiceRef.current = new g.maps.places.PlacesService(document.createElement("div"));
      }
      if (!sessionTokenRef.current) sessionTokenRef.current = new g.maps.places.AutocompleteSessionToken();
    } catch (err) {
      console.warn("Places services unavailable:", err);
    }
  }, [suggestionsEnabled]);

  // Clear timers on unmount.
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    },
    [],
  );

  const fetchPredictions = useCallback((text) => {
    const svc = acServiceRef.current;
    if (!svc || !text || text.trim().length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    svc.getPlacePredictions(
      {
        input: text,
        sessionToken: sessionTokenRef.current || undefined,
        componentRestrictions: { country: "us" },
      },
      (preds, status) => {
        const OK = window.google?.maps?.places?.PlacesServiceStatus?.OK;
        if (status === OK && Array.isArray(preds) && preds.length > 0) {
          setPredictions(preds.slice(0, 5));
          setActiveIndex(-1);
          setShowDropdown(true);
        } else {
          setPredictions([]);
          setShowDropdown(false);
        }
      },
    );
  }, []);

  const emitFreeText = useCallback(
    (text) => {
      // Free text is always valid; never flag the field invalid (that was the
      // old "!"). Coordinates are left null and derived by submit-time geocoding.
      onChange?.({ address: text, coordinates: null, timezone: null });
    },
    [onChange],
  );

  const handleInputChange = useCallback(
    (e) => {
      const newValue = e.target.value;
      isInternalUpdate.current = true;
      setInputValue(newValue);
      if (!suggestionsEnabled) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchPredictions(newValue), 250);
    },
    [suggestionsEnabled, fetchPredictions],
  );

  const selectPrediction = useCallback(
    (pred) => {
      if (!pred) return;
      setShowDropdown(false);
      setPredictions([]);
      isInternalUpdate.current = true;
      setInputValue(pred.description || "");

      const svc = placesServiceRef.current;
      if (!svc) {
        // No details service — keep the chosen text; submit will geocode it.
        emitFreeText(pred.description || "");
        return;
      }

      setIsResolving(true);
      svc.getDetails(
        {
          placeId: pred.place_id,
          fields: ["geometry", "address_components", "name", "formatted_address"],
          sessionToken: sessionTokenRef.current || undefined,
        },
        (place, status) => {
          setIsResolving(false);
          // A new session token per resolved selection (Google billing guidance).
          try {
            sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
          } catch {
            /* ignore */
          }

          const OK = window.google?.maps?.places?.PlacesServiceStatus?.OK;
          if (status !== OK || !place?.geometry?.location) {
            // Places getDetails failed (e.g. Places API quota/config). Resolve
            // the chosen suggestion through the Geocoding API instead — a
            // separate service the submit path already uses — so coordinates and
            // city/state/zip still fill rather than leaving them blank. Falls
            // back to plain free text only if geocoding also returns nothing.
            geocodeAddress(pred.description || "")
              .then(geo => {
                if (!geo || geo.lat == null || geo.lng == null) {
                  emitFreeText(pred.description || "");
                  return;
                }
                const addr = geo.formattedAddress || pred.description || "";
                const comps = geo.addressComponents || {};
                isInternalUpdate.current = true;
                setInputValue(addr);
                onValidation?.({ isValid: true, error: null });
                onChange?.({ address: addr, coordinates: { lat: geo.lat, lng: geo.lng }, timezone: null, addressComponents: comps });
                getTimezoneForLocation(geo.lat, geo.lng)
                  .then(tz => (tz?.timeZoneAbbr ? tz : getDefaultTimezone()))
                  .catch(() => getDefaultTimezone())
                  .then(timezone =>
                    onChange?.({ address: addr, coordinates: { lat: geo.lat, lng: geo.lng }, timezone, addressComponents: comps }),
                  );
              })
              .catch(() => emitFreeText(pred.description || ""));
            return;
          }

          const selectedAddress = place.formatted_address || pred.description || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          const addressComponents = {};
          for (const component of place.address_components || []) {
            const types = component.types;
            if (types.includes("locality")) addressComponents.city = component.long_name;
            else if (types.includes("administrative_area_level_1")) {
              addressComponents.state = component.long_name;
              addressComponents.stateShort = component.short_name;
            } else if (types.includes("postal_code")) addressComponents.zipCode = component.long_name;
            else if (types.includes("country")) addressComponents.country = component.long_name;
          }

          // Keep place.name only when it's a real venue label, not a street echo.
          const rawName = String(place.name || "").trim();
          const looksLikeStreetEcho =
            rawName && selectedAddress && selectedAddress.toLowerCase().startsWith(rawName.toLowerCase());
          const venueName = rawName && !looksLikeStreetEcho ? rawName : "";

          isInternalUpdate.current = true;
          setInputValue(selectedAddress);
          onValidation?.({ isValid: true, error: null });
          // Send address + coordinates + components first so a blur can't land
          // in the gap and blank the city/state/zip; fold timezone in after.
          onChange?.({
            address: selectedAddress,
            venueName,
            coordinates: { lat, lng },
            timezone: null,
            addressComponents,
          });

          getTimezoneForLocation(lat, lng)
            .then((tz) => (tz?.timeZoneAbbr ? tz : getDefaultTimezone()))
            .catch(() => getDefaultTimezone())
            .then((timezone) => {
              onChange?.({
                address: selectedAddress,
                venueName,
                coordinates: { lat, lng },
                timezone,
                addressComponents,
              });
            });
        },
      );
    },
    [emitFreeText, onChange, onValidation],
  );

  const handleInputBlur = useCallback(() => {
    // Delay so a mousedown on a suggestion is handled before we hide the list.
    blurTimeoutRef.current = setTimeout(() => {
      setShowDropdown(false);
    }, 150);
    if (inputValue !== value) emitFreeText(inputValue);
  }, [inputValue, value, emitFreeText]);

  const handleKeyDown = useCallback(
    (e) => {
      if (!showDropdown || predictions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, predictions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        if (activeIndex >= 0 && activeIndex < predictions.length) {
          e.preventDefault();
          selectPrediction(predictions[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    },
    [showDropdown, predictions, activeIndex, selectPrediction],
  );

  const isHorizontal = layout === "horizontal";
  const inputClassName = `w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
    error ? "border-red-500" : "border-gray-300"
  } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`;

  return (
    <div className="w-full">
      <div className={`flex w-full ${isHorizontal ? "flex-col lg:flex-row lg:items-center" : "flex-col"}`}>
        <label className={`text-base font-medium text-[#2D2C3C] ${isHorizontal ? "lg:w-[110px]" : ""}`}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        <div className={`relative flex-1 ${isHorizontal ? "lg:ml-8" : "mt-1"}`}>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (predictions.length > 0) setShowDropdown(true);
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={showDropdown}
            aria-autocomplete="list"
            className={inputClassName}
          />

          {isResolving && (
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-400">…</span>
          )}

          {showDropdown && predictions.length > 0 && (
            <ul
              role="listbox"
              className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
            >
              {predictions.map((pred, i) => (
                <li
                  key={pred.place_id}
                  role="option"
                  aria-selected={i === activeIndex}
                  // onMouseDown (not onClick) fires before the input's blur, so
                  // the selection is handled before the list is hidden.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectPrediction(pred);
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`cursor-pointer px-3 py-2 text-sm text-[#2D2C3C] ${
                    i === activeIndex ? "bg-[#c9a34e]/15" : "hover:bg-gray-50"
                  }`}
                >
                  {pred.description}
                </li>
              ))}
            </ul>
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
