import { useState, useCallback, useEffect } from "react";
import {
  normalizeEventData,
  prepareEventForSave,
  prepareEventForForm,
} from "../utils/normalizer.js";
import { DEFAULT_EVENT, EVENT_STATUS } from "../schemas/event.js";

/**
 * useEventForm Hook
 *
 * Manages event form state with automatic normalization,
 * organizer pre-population, and dual-write support.
 *
 * @param {Object} initialData - Initial event data (for editing)
 * @param {Object} options - Hook options
 * @param {boolean} options.isAdmin - Whether this is an admin context
 * @param {Object} options.organizerData - Organizer data for pre-population
 * @param {Function} options.onSubmit - Custom submit handler
 * @returns {Object} Form state and handlers
 */
export function useEventForm(initialData = null, options = {}) {
  const { isAdmin = false, organizerData = null, onSubmit = null } = options;

  // Initialize form data with normalized values
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      return prepareEventForForm(initialData);
    }
    return { ...DEFAULT_EVENT };
  });

  // Form state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Pre-populate organizer data for non-admin users
  useEffect(() => {
    if (!isAdmin && organizerData && !initialData) {
      setFormData((prev) => ({
        ...prev,
        organizationName: organizerData.organizationName || prev.organizationName,
        email: organizerData.businessEmail || organizerData.email || prev.email,
        phone: organizerData.contactPhone || organizerData.phone || prev.phone,
        organizationWeblink:
          organizerData.website || organizerData.organizationWeblink || prev.organizationWeblink,
        organizerId: organizerData.id || organizerData.organizerId || prev.organizerId,
      }));
    }
  }, [isAdmin, organizerData, initialData]);

  /**
   * Update a single form field
   */
  const updateField = useCallback((name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsDirty(true);

    // Clear error for this field when user types
    setErrors((prev) => {
      if (prev[name]) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      return prev;
    });
  }, []);

  /**
   * Handle input change events
   */
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const newValue = type === "checkbox" ? checked : value;
      updateField(name, newValue);
    },
    [updateField]
  );

  /**
   * Handle field blur (mark as touched)
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  /**
   * Update multiple fields at once
   */
  const updateFields = useCallback((updates) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
    setIsDirty(true);
  }, []);

  /**
   * Set location data (from geocoding)
   */
  const setLocationData = useCallback(
    (locationData) => {
      const updates = {};

      if (locationData.lat !== undefined) updates.latitude = locationData.lat;
      if (locationData.lng !== undefined) updates.longitude = locationData.lng;
      if (locationData.formattedAddress) updates.address = locationData.formattedAddress;

      if (locationData.addressComponents) {
        const { city, state, stateShort, zipCode } = locationData.addressComponents;
        if (city) updates.city = city;
        if (state || stateShort) updates.state = stateShort || state;
        if (zipCode) updates.zipCode = zipCode;
      }

      updateFields(updates);
    },
    [updateFields]
  );

  /**
   * Set timezone data (from timezone detection)
   */
  const setTimezoneData = useCallback(
    (timezoneData) => {
      if (!timezoneData) return;

      updateFields({
        timezone: timezoneData.timeZoneId,
        timeZoneAbbr: timezoneData.timeZoneAbbr,
      });
    },
    [updateFields]
  );

  /**
   * Set event image URL
   */
  const setEventImage = useCallback(
    (imageUrl) => {
      updateField("eventImage", imageUrl);
    },
    [updateField]
  );

  /**
   * Handle industries/categories selection
   */
  const setIndustries = useCallback(
    (industries) => {
      updateField("industries", Array.isArray(industries) ? industries : [industries]);
    },
    [updateField]
  );

  /**
   * Toggle a single industry selection
   */
  const toggleIndustry = useCallback((industry) => {
    setFormData((prev) => {
      const current = prev.industries || [];
      const isSelected = current.includes(industry);

      return {
        ...prev,
        industries: isSelected
          ? current.filter((i) => i !== industry)
          : [...current, industry],
      };
    });
    setIsDirty(true);
  }, []);

  /**
   * Validate form and return errors
   */
  const validate = useCallback(() => {
    const newErrors = {};
    const data = formData;

    // Required fields
    if (!data.organizationName?.trim()) {
      newErrors.organizationName = "Organization name is required";
    }

    if (!data.eventName?.trim()) {
      newErrors.eventName = "Event name is required";
    }

    if (!data.description?.trim()) {
      newErrors.description = "Description is required";
    }

    if (!data.eventType) {
      newErrors.eventType = "Event type is required";
    }

    if (!data.startDateTime) {
      newErrors.startDateTime = "Start date and time is required";
    }

    if (!data.endDateTime) {
      newErrors.endDateTime = "End date and time is required";
    }

    // Date validation
    if (data.startDateTime && data.endDateTime) {
      const start = new Date(data.startDateTime);
      const end = new Date(data.endDateTime);

      if (end <= start) {
        newErrors.endDateTime = "End date must be after start date";
      }
    }

    // Location validation for in-person/hybrid events
    if (data.eventType === "in-person" || data.eventType === "hybrid") {
      if (!data.address?.trim()) {
        newErrors.address = "Address is required for in-person events";
      }
      if (!data.city?.trim()) {
        newErrors.city = "City is required";
      }
      if (!data.state?.trim()) {
        newErrors.state = "State is required";
      }
    }

    // Virtual link for virtual/hybrid events
    if (data.eventType === "virtual" || data.eventType === "hybrid") {
      if (!data.virtualLink?.trim()) {
        newErrors.virtualLink = "Virtual link is required for virtual events";
      }
    }

    // Contact validation
    if (!data.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Industries validation
    if (!data.industries || data.industries.length === 0) {
      newErrors.industries = "Please select at least one industry";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Get data prepared for submission
   */
  const getSubmitData = useCallback(() => {
    return prepareEventForSave(formData, {
      isAdmin,
      includeLegacyFields: true, // Always dual-write during migration
    });
  }, [formData, isAdmin]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(formData).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // Validate
      if (!validate()) {
        return { success: false, errors };
      }

      setIsSubmitting(true);

      try {
        const submitData = getSubmitData();

        // Set appropriate status
        if (!submitData.status) {
          submitData.status = isAdmin ? EVENT_STATUS.APPROVED : EVENT_STATUS.PENDING;
        }

        // Call custom submit handler if provided
        if (onSubmit) {
          const result = await onSubmit(submitData);
          setIsSubmitting(false);
          if (result?.success) {
            setIsDirty(false);
          }
          return result;
        }

        // Return prepared data if no handler
        setIsSubmitting(false);
        return { success: true, data: submitData };
      } catch (error) {
        setIsSubmitting(false);
        return { success: false, error: error.message };
      }
    },
    [formData, validate, errors, getSubmitData, isAdmin, onSubmit]
  );

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    if (initialData) {
      setFormData(prepareEventForForm(initialData));
    } else {
      setFormData({ ...DEFAULT_EVENT });
    }
    setErrors({});
    setTouched({});
    setIsDirty(false);
  }, [initialData]);

  /**
   * Check if a specific field has an error
   */
  const hasError = useCallback(
    (fieldName) => {
      return touched[fieldName] && errors[fieldName];
    },
    [touched, errors]
  );

  /**
   * Get error message for a field
   */
  const getError = useCallback(
    (fieldName) => {
      return hasError(fieldName) ? errors[fieldName] : null;
    },
    [hasError, errors]
  );

  /**
   * Check if form is valid
   */
  const isValid = Object.keys(errors).length === 0;

  /**
   * Check if organizer fields should be locked
   */
  const isOrganizerFieldLocked = !isAdmin && organizerData != null;

  return {
    // Form data
    formData,
    setFormData,

    // Field handlers
    updateField,
    handleChange,
    handleBlur,
    updateFields,

    // Specialized setters
    setLocationData,
    setTimezoneData,
    setEventImage,
    setIndustries,
    toggleIndustry,

    // Validation
    errors,
    touched,
    validate,
    hasError,
    getError,
    isValid,

    // Submission
    isSubmitting,
    handleSubmit,
    getSubmitData,

    // State
    isDirty,
    resetForm,

    // Context
    isAdmin,
    isOrganizerFieldLocked,
  };
}

export default useEventForm;
