import { useState, useCallback, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

/**
 * EventDateTimePicker Component
 * Date/time picker with support for "all day" events
 *
 * @param {Object} props
 * @param {Date|string|null} props.value - Current date value
 * @param {function} props.onChange - Change handler (receives Date object)
 * @param {string} props.label - Field label
 * @param {boolean} props.required - Whether field is required
 * @param {string} props.error - Error message
 * @param {boolean} props.showTime - Whether to show time picker
 * @param {Date} props.minDate - Minimum selectable date
 * @param {Date} props.maxDate - Maximum selectable date
 * @param {boolean} props.disabled - Whether input is disabled
 * @param {string} props.placeholder - Input placeholder
 */
export function EventDateTimePicker({
  value,
  onChange,
  label = "Date",
  required = false,
  error = null,
  showTime = true,
  minDate,
  maxDate,
  disabled = false,
  placeholder,
}) {
  // Convert value to Date object if needed
  const dateValue = useMemo(() => {
    if (!value) return null;
    if (value instanceof Date) return value;

    // Handle ISO string
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }, [value]);

  const handleChange = useCallback((date) => {
    onChange(date);
  }, [onChange]);

  const defaultPlaceholder = showTime ? "Select date and time" : "Select date";
  const dateFormat = showTime ? "yyyy-MM-dd h:mm aa" : "yyyy-MM-dd";

  return (
    <div className="w-full">
      <div className="flex flex-col">
        <label className="text-base font-medium text-[#2D2C3C] mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <DatePicker
          selected={dateValue}
          onChange={handleChange}
          showTimeInput={showTime}
          isClearable
          shouldCloseOnSelect={!showTime}
          showIcon
          dateFormat={dateFormat}
          timeCaption="Time"
          minDate={minDate}
          maxDate={maxDate}
          placeholderText={placeholder || defaultPlaceholder}
          disabled={disabled}
          className={`w-full rounded border p-3 text-black ${
            error ? "border-red-500" : "border-gray-400"
          } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
          wrapperClassName="w-full"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

/**
 * EventDateTimeRange Component
 * Start and end date/time pickers with "all day" toggle
 *
 * @param {Object} props
 * @param {Date|string|null} props.startDate - Start date value
 * @param {Date|string|null} props.endDate - End date value
 * @param {function} props.onStartChange - Start date change handler
 * @param {function} props.onEndChange - End date change handler
 * @param {boolean} props.isAllDay - Whether event is all day (no time selection)
 * @param {function} props.onAllDayChange - All day toggle handler
 * @param {Object} props.errors - { startDate, endDate } error messages
 * @param {boolean} props.startRequired - Whether start date is required
 * @param {boolean} props.endRequired - Whether end date is required
 * @param {string} props.layout - Layout: "horizontal" or "vertical"
 */
export function EventDateTimeRange({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  isAllDay = false,
  onAllDayChange,
  errors = {},
  startRequired = false,
  endRequired = false,
  layout = "horizontal",
}) {
  // Default min/max dates
  const minDate = useMemo(() => new Date(), []);
  const maxDate = useMemo(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  }, []);

  // Calculate end date min based on start date
  const endMinDate = useMemo(() => {
    if (startDate) {
      const date = new Date(startDate);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
    return minDate;
  }, [startDate, minDate]);

  // Handle start date change with default times for all day events
  const handleStartChange = useCallback((date) => {
    if (!date) {
      onStartChange(null);
      return;
    }

    const newDate = new Date(date);
    if (isAllDay) {
      // Set to 8 AM for all day events
      newDate.setHours(8, 0, 0, 0);
    }
    onStartChange(newDate);
  }, [onStartChange, isAllDay]);

  // Handle end date change with default times for all day events
  const handleEndChange = useCallback((date) => {
    if (!date) {
      onEndChange(null);
      return;
    }

    const newDate = new Date(date);
    if (isAllDay) {
      // Set to 5 PM for all day events
      newDate.setHours(17, 0, 0, 0);
    }
    onEndChange(newDate);
  }, [onEndChange, isAllDay]);

  // Handle all day toggle - only notify parent, don't modify dates here
  const handleAllDayToggle = useCallback((e) => {
    const checked = e.target.checked;
    onAllDayChange?.(checked);
    // Note: Date adjustments for all-day events are handled in handleStartChange/handleEndChange
  }, [onAllDayChange]);

  const isHorizontal = layout === "horizontal";

  return (
    <div className="w-full">
      <div className={`flex flex-col gap-4 ${isHorizontal ? "lg:flex-row lg:justify-end" : ""}`}>
        {/* Start Date */}
        <div className={isHorizontal ? "lg:relative" : ""}>
          <EventDateTimePicker
            value={startDate}
            onChange={handleStartChange}
            label={isAllDay ? "Start Date" : "Start Date & Time"}
            required={startRequired}
            showTime={!isAllDay}
            minDate={minDate}
            maxDate={maxDate}
            error={errors.startDate}
          />
        </div>

        {/* End Date */}
        <div className={isHorizontal ? "lg:relative" : ""}>
          <EventDateTimePicker
            value={endDate}
            onChange={handleEndChange}
            label={isAllDay ? "End Date" : "End Date & Time"}
            required={endRequired}
            showTime={!isAllDay}
            minDate={endMinDate}
            maxDate={maxDate}
            error={errors.endDate}
          />
        </div>
      </div>

      {/* All Day Toggle */}
      {onAllDayChange && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <label htmlFor="allDay" className="text-base font-medium text-[#2D2C3C]">
            All Day (8 AM - 5 PM)
          </label>
          <input
            type="checkbox"
            id="allDay"
            checked={isAllDay}
            onChange={handleAllDayToggle}
            className="h-5 w-5"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Format date for Firestore storage
 * @param {Date} date - Date to format
 * @param {boolean} isAllDay - Whether this is an all-day event
 * @returns {string|null} Formatted date string
 */
export function formatDateForStorage(date, isAllDay = false) {
  if (!date) return null;

  const d = date instanceof Date ? date : new Date(date);

  if (isAllDay) {
    // Return date only in YYYY-MM-DD format
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Return full ISO-like string in local time
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Parse date from storage format
 * @param {string} dateString - Date string from storage
 * @returns {Date|null} Parsed Date object
 */
export function parseDateFromStorage(dateString) {
  if (!dateString) return null;

  // Check if it's a date-only string (YYYY-MM-DD)
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateString);

  if (isDateOnly) {
    // For date-only strings, create local date at noon to avoid timezone issues
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  // For datetime strings
  return new Date(dateString);
}

export default EventDateTimePicker;
