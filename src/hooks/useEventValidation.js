import { useState, useCallback, useMemo } from "react";
import { eventValidationSchema, bulkUploadValidationSchema } from "../schemas/event.js";

/**
 * useEventValidation Hook
 *
 * Provides Yup-based validation for event forms.
 *
 * @param {Object} options - Hook options
 * @param {string} options.mode - Validation mode ('full' or 'bulk')
 * @param {boolean} options.validateOnChange - Validate on field change
 * @returns {Object} Validation state and functions
 */
export function useEventValidation(options = {}) {
  const { mode = "full", validateOnChange = false } = options;

  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  // Select schema based on mode
  const schema = useMemo(() => {
    return mode === "bulk" ? bulkUploadValidationSchema : eventValidationSchema;
  }, [mode]);

  /**
   * Validate all fields
   */
  const validateAll = useCallback(
    async (data) => {
      setIsValidating(true);

      try {
        await schema.validate(data, { abortEarly: false });
        setErrors({});
        setIsValidating(false);
        return { isValid: true, errors: {} };
      } catch (err) {
        const validationErrors = {};

        if (err.inner) {
          err.inner.forEach((error) => {
            if (error.path && !validationErrors[error.path]) {
              validationErrors[error.path] = error.message;
            }
          });
        }

        setErrors(validationErrors);
        setIsValidating(false);
        return { isValid: false, errors: validationErrors };
      }
    },
    [schema]
  );

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    async (fieldName, value, allData = {}) => {
      try {
        // Create data object with just this field for validation
        const dataToValidate = { ...allData, [fieldName]: value };

        await schema.validateAt(fieldName, dataToValidate);

        // Clear error for this field
        setErrors((prev) => {
          const { [fieldName]: _, ...rest } = prev;
          return rest;
        });

        return { isValid: true, error: null };
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: err.message,
        }));

        return { isValid: false, error: err.message };
      }
    },
    [schema]
  );

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Clear error for a specific field
   */
  const clearFieldError = useCallback((fieldName) => {
    setErrors((prev) => {
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Set error for a specific field (for custom validation)
   */
  const setFieldError = useCallback((fieldName, error) => {
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  }, []);

  /**
   * Check if a field has an error
   */
  const hasError = useCallback(
    (fieldName) => {
      return !!errors[fieldName];
    },
    [errors]
  );

  /**
   * Get error message for a field
   */
  const getError = useCallback(
    (fieldName) => {
      return errors[fieldName] || null;
    },
    [errors]
  );

  /**
   * Get all error messages as array
   */
  const getErrorMessages = useCallback(() => {
    return Object.values(errors);
  }, [errors]);

  /**
   * Check if form is valid (no errors)
   */
  const isValid = Object.keys(errors).length === 0;

  /**
   * Get error count
   */
  const errorCount = Object.keys(errors).length;

  return {
    // State
    errors,
    isValidating,
    isValid,
    errorCount,

    // Validation functions
    validateAll,
    validateField,

    // Error management
    clearErrors,
    clearFieldError,
    setFieldError,
    hasError,
    getError,
    getErrorMessages,

    // Schema (for direct access if needed)
    schema,
  };
}

export default useEventValidation;
