/**
 * Bulk Upload Utilities
 * Shared utilities for parsing Excel files and transforming event data
 */

// Multi-value separator regex - supports both comma and semicolon (for industries only)
export const MULTI_VALUE_SEPARATOR = /[,;]/;

// Maximum number of industries/categories allowed per event
export const MAX_INDUSTRIES = 3;

// Excel column definitions - matches "Enter Events Here" sheet structure
export const EXCEL_COLUMNS = [
  { key: "eventTitle", label: "Event Title *", required: true },
  { key: "startDate", label: "Start Date * (YYYY-MM-DD)", required: true },
  { key: "startTime", label: "Start Time * (HH:MM or H:MM AM/PM)", required: true },
  { key: "endDate", label: "End Date * (YYYY-MM-DD)", required: true },
  { key: "endTime", label: "End Time * (HH:MM or H:MM AM/PM)", required: true },
  { key: "eventLink", label: "Event Link/URL", required: false },
  { key: "eventAddress", label: "Address", required: false },
  { key: "eventCity", label: "City", required: false },
  { key: "eventFormat", label: "Format", required: false },
  { key: "eventPricing", label: "Pricing", required: false },
  { key: "eventInvitation", label: "Access", required: false },
  { key: "eventType", label: "Event Type", required: false },
  { key: "eventCategories", label: "Industries (Max 3)", required: false },
  { key: "eventDescription", label: "Description *", required: true },
];

// Header mapping for flexible column name matching
const HEADER_MAPPING = {
  "event title *": "eventTitle",
  "event title": "eventTitle",
  eventtitle: "eventTitle",
  "start date * (yyyy-mm-dd)": "startDate",
  "start date *": "startDate",
  "start date": "startDate",
  startdate: "startDate",
  "start time * (hh:mm or h:mm am/pm)": "startTime",
  "start time (hh:mm or h:mm am/pm)": "startTime",
  "start time * (hh:mm)": "startTime",
  "start time (hh:mm)": "startTime",
  "start time *": "startTime",
  "start time": "startTime",
  starttime: "startTime",
  "end date * (yyyy-mm-dd)": "endDate",
  "end date *": "endDate",
  "end date (yyyy-mm-dd)": "endDate",
  "end date": "endDate",
  enddate: "endDate",
  "end time * (hh:mm or h:mm am/pm)": "endTime",
  "end time (hh:mm or h:mm am/pm)": "endTime",
  "end time * (hh:mm)": "endTime",
  "end time (hh:mm)": "endTime",
  "end time *": "endTime",
  "end time": "endTime",
  endtime: "endTime",
  "event link/url": "eventLink",
  "event link": "eventLink",
  eventlink: "eventLink",
  address: "eventAddress",
  city: "eventCity",
  format: "eventFormat",
  pricing: "eventPricing",
  access: "eventInvitation",
  invitation: "eventInvitation",
  "event type": "eventType",
  eventtype: "eventType",
  industries: "eventCategories",
  "industries (max 3)": "eventCategories",
  "description *": "eventDescription",
  description: "eventDescription",
};

/**
 * Normalize time string to HH:MM format (24-hour)
 * Handles multiple formats:
 * - 9:00 -> 09:00
 * - 09:00 -> 09:00
 * - 9:00:00 -> 09:00
 * - 9:00:00 AM -> 09:00
 * - 9:00 AM -> 09:00
 * - 1:30:00 PM -> 13:30
 * - 1:30 PM -> 13:30
 */
export const normalizeTime = (time) => {
  if (!time || typeof time !== "string") return null;
  const trimmed = time.trim();

  // Match 12-hour format with AM/PM: H:MM:SS AM, HH:MM:SS AM, H:MM AM, HH:MM AM
  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (amPmMatch) {
    let hours = parseInt(amPmMatch[1], 10);
    const minutes = amPmMatch[2];
    const period = amPmMatch[3].toUpperCase();

    // Convert to 24-hour format
    if (period === "PM" && hours !== 12) {
      hours += 12;
    } else if (period === "AM" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  // Match 24-hour formats: H:MM, HH:MM, H:MM:SS, HH:MM:SS
  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (timeMatch) {
    const hours = timeMatch[1].padStart(2, "0");
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }

  return null;
};

/**
 * Normalize URL to ensure it has a protocol
 * Supports www. URLs by prepending https://
 */
export const normalizeUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Already has a protocol
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // Starts with www. - add https://
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // Has a domain-like structure (contains a dot) - add https://
  if (/^[\w-]+\.[\w-]+/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // Return as-is if it doesn't look like a URL
  return trimmed;
};

/**
 * Format date in local time (matches AddEvent.jsx format)
 * Returns YYYY-MM-DDTHH:MM:SS without timezone conversion
 */
export const formatLocalDateTime = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const seconds = String(d.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Parse Excel file using XLSX library
 * @param {ArrayBuffer} arrayBuffer - File content as ArrayBuffer
 * @param {object} XLSX - XLSX library instance (passed to avoid bundling issues)
 * @returns {Array} Parsed event objects with _rowNumber for error tracking
 */
export const parseExcelFile = (arrayBuffer, XLSX) => {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });

  // Get the data entry sheet (check for known sheet names, or fall back to first sheet)
  let sheetName = workbook.SheetNames[0];
  if (workbook.SheetNames.includes("Enter Events Here")) {
    sheetName = "Enter Events Here";
  } else if (workbook.SheetNames.includes("Event Data")) {
    sheetName = "Event Data";
  }
  // Skip instructions sheet if it's the first sheet
  if (sheetName === "READ ME FIRST" && workbook.SheetNames.length > 1) {
    sheetName = workbook.SheetNames[1];
  }

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

  if (jsonData.length < 2) return [];

  // Get headers from first row
  const headers = jsonData[0].map((h) => String(h || "").trim());

  // Parse data rows
  const dataRows = [];
  for (let i = 1; i < jsonData.length; i++) {
    const rowData = jsonData[i];
    if (!rowData || rowData.length === 0) continue;

    // Skip sample row with DELETE instruction
    const firstCell = String(rowData[0] || "").trim();
    if (firstCell.includes("DELETE THIS ROW") || firstCell.includes("\u26a0\ufe0f")) continue;
    if (firstCell.includes("REQUIRED") || firstCell.includes("Optional")) continue;
    if (!firstCell) continue;

    const row = { _rowNumber: i + 1 };
    headers.forEach((header, index) => {
      const key =
        HEADER_MAPPING[header.toLowerCase()] || header.toLowerCase().replace(/[^a-z]/g, "");
      const value = String(rowData[index] || "").trim();

      if (key && value) {
        // Handle multi-value fields (industries) - limit to MAX_INDUSTRIES
        if (key === "eventCategories") {
          const industries = value
            .split(MULTI_VALUE_SEPARATOR)
            .map((v) => v.trim())
            .filter(Boolean);
          row[key] = industries.slice(0, MAX_INDUSTRIES);
          if (industries.length > MAX_INDUSTRIES) {
            row._industriesTruncated = true;
          }
        } else {
          row[key] = value;
        }
      }
    });

    // Only add rows with an event title
    if (row.eventTitle) {
      dataRows.push(row);
    }
  }

  return dataRows;
};

/**
 * Validate parsed bulk upload events
 * @param {Array} events - Parsed event objects from parseExcelFile
 * @param {object} options - Validation options
 * @param {Array} options.validFormats - Valid event formats (default: ["in-person", "virtual", "hybrid"])
 * @param {Array} options.validEventTypes - Valid event types (optional, for type validation)
 * @returns {Array} Validation errors with row numbers and field-level errors
 */
export const validateBulkUploadEvents = (events, options = {}) => {
  const { validFormats = ["in-person", "virtual", "hybrid"], validEventTypes = null } = options;

  const errors = [];

  events.forEach((event) => {
    const rowErrors = [];

    // Required field validation
    if (!event.eventTitle?.trim()) {
      rowErrors.push("Event Title is required");
    }
    if (!event.startDate?.trim()) {
      rowErrors.push("Start Date is required");
    }
    if (!event.startTime?.trim()) {
      rowErrors.push("Start Time is required");
    }
    if (!event.endDate?.trim()) {
      rowErrors.push("End Date is required");
    }
    if (!event.endTime?.trim()) {
      rowErrors.push("End Time is required");
    }
    if (!event.eventDescription?.trim()) {
      rowErrors.push("Description is required");
    }

    // Date format validation (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (event.startDate?.trim() && !datePattern.test(event.startDate.trim())) {
      rowErrors.push("Start Date must be in YYYY-MM-DD format");
    }
    if (event.endDate?.trim() && !datePattern.test(event.endDate.trim())) {
      rowErrors.push("End Date must be in YYYY-MM-DD format");
    }

    // Time format validation - normalizeTime handles multiple formats
    if (event.startTime?.trim() && !normalizeTime(event.startTime)) {
      rowErrors.push("Start Time must be in HH:MM or H:MM AM/PM format");
    }
    if (event.endTime?.trim() && !normalizeTime(event.endTime)) {
      rowErrors.push("End Time must be in HH:MM or H:MM AM/PM format");
    }

    // Format validation
    if (event.eventFormat) {
      if (!validFormats.map((f) => f.toLowerCase()).includes(event.eventFormat.toLowerCase())) {
        rowErrors.push(`Format must be: ${validFormats.join(", ")}`);
      }
    }

    // Event type validation (optional)
    if (validEventTypes && event.eventType) {
      if (!validEventTypes.includes(event.eventType)) {
        rowErrors.push(`Invalid event type: ${event.eventType}`);
      }
    }

    // Industries truncation warning
    if (event._industriesTruncated) {
      rowErrors.push(`Industries limited to ${MAX_INDUSTRIES} (extras removed)`);
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: event._rowNumber,
        eventTitle: event.eventTitle || "(no title)",
        errors: rowErrors,
      });
    }
  });

  return errors;
};

/**
 * Transform parsed event data for Firestore
 * Combines separate date/time fields into datetime and normalizes values
 * @param {object} event - Parsed event from Excel
 * @param {object} defaults - Default values for optional fields
 * @returns {object} Transformed event data ready for Firestore (without organization fields)
 */
export const transformEventForFirestore = (event, defaults = {}) => {
  // Parse separate date and time into datetime
  const startTime = normalizeTime(event.startTime) || "09:00";
  const endTime = normalizeTime(event.endTime) || "17:00";

  let starteventDateTime = null;
  let endeventDateTime = null;

  if (event.startDate) {
    const startDateObj = new Date(`${event.startDate}T${startTime}:00`);
    if (!isNaN(startDateObj.getTime())) {
      starteventDateTime = formatLocalDateTime(startDateObj);
    }
  }

  if (event.endDate) {
    const endDateObj = new Date(`${event.endDate}T${endTime}:00`);
    if (!isNaN(endDateObj.getTime())) {
      endeventDateTime = formatLocalDateTime(endDateObj);
    }
  }

  return {
    eventTitle: event.eventTitle?.trim() || "",
    eventDescription: event.eventDescription?.trim() || "",
    eventLink: normalizeUrl(event.eventLink),
    starteventDateTime: starteventDateTime || "",
    endeventDateTime: endeventDateTime || starteventDateTime || "",
    eventAddress: event.eventAddress?.trim() || defaults.defaultAddress || "",
    eventCity: event.eventCity?.trim() || defaults.defaultCity || "",
    eventFormat: event.eventFormat?.trim() || defaults.defaultFormat || "",
    eventPricing: event.eventPricing?.trim() || defaults.defaultPricing || "",
    eventInvitation: event.eventInvitation?.trim() || defaults.defaultInvitation || "",
    eventType: event.eventType?.trim() || defaults.defaultEventType || "",
    eventHighlight: event.eventType?.trim() || defaults.defaultEventType || "",
    eventCategories: event.eventCategories || defaults.defaultIndustries || [],
    categories: event.eventCategories || defaults.defaultIndustries || [],
    industries: event.eventCategories || defaults.defaultIndustries || [],
  };
};
