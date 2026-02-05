/**
 * Excel Template Generator for Bulk Upload
 * Generates branded NE Excel template with instructions, data entry sheet, and valid options
 */

// NE Brand Colors
const NE_NAVY = "030959";
const NE_GOLD = "DBB76A";
const WHITE = "FFFFFF";
const LIGHT_GRAY = "F5F5F5";
const WARNING_YELLOW = "FFF3CD";
const WARNING_BORDER = "FFE69C";

/**
 * Generate bulk upload Excel template
 * @param {object} ExcelJS - ExcelJS library instance (passed to avoid bundling issues)
 * @param {object} options - Template options
 * @param {Array} options.eventTypes - List of valid event types
 * @param {Array} options.industries - List of valid industries (optional)
 * @param {object} options.organizerDefaults - Default values to show in template (optional)
 * @returns {Promise<Blob>} Excel file as Blob
 */
export const generateBulkUploadTemplate = async (ExcelJS, options = {}) => {
  const {
    eventTypes = [],
    industries = [],
    organizerDefaults = {},
  } = options;

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Networking Executives";
  workbook.created = new Date();

  // ============================================
  // SHEET 1: INSTRUCTIONS
  // ============================================
  const instructionsSheet = workbook.addWorksheet("READ ME FIRST", {
    properties: { tabColor: { argb: NE_NAVY } },
  });

  instructionsSheet.getColumn(1).width = 100;

  // Header section with NE branding
  instructionsSheet.mergeCells("A1:A3");
  const headerCell = instructionsSheet.getCell("A1");
  headerCell.value = "NETWORKING EXECUTIVES\nEvent Bulk Upload Template";
  headerCell.font = { name: "Arial", size: 18, bold: true, color: { argb: WHITE } };
  headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NE_NAVY } };
  headerCell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  instructionsSheet.getRow(1).height = 60;

  // Helper functions for instructions
  let rowNum = 5;
  const addSectionHeader = (text) => {
    const row = instructionsSheet.getRow(rowNum);
    row.getCell(1).value = text;
    row.getCell(1).font = { name: "Arial", size: 14, bold: true, color: { argb: WHITE } };
    row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: NE_GOLD } };
    row.getCell(1).alignment = { horizontal: "center" };
    row.height = 25;
    rowNum++;
  };

  const addText = (text, indent = false) => {
    const row = instructionsSheet.getRow(rowNum);
    row.getCell(1).value = indent ? "    " + text : text;
    row.getCell(1).font = { name: "Arial", size: 11 };
    rowNum++;
  };

  const addEmptyRow = () => {
    rowNum++;
  };

  // Quick Start Guide
  addSectionHeader("QUICK START GUIDE");
  addEmptyRow();
  addText("1. Go to the 'Enter Events Here' sheet (tab at bottom)", true);
  addText("2. DELETE the sample row (Row 2) - it's just an example!", true);
  addText("3. Enter your events starting from Row 2", true);
  addText("4. Save the file and upload it", true);
  addEmptyRow();

  // Important Notes
  addSectionHeader("IMPORTANT NOTES");
  addEmptyRow();
  addText("* Required fields are marked with * (asterisk) in the header row", true);
  addText("* The sample row (yellow) MUST be deleted before uploading", true);
  addText("* Date format: YYYY-MM-DD (example: 2026-03-15)", true);
  addText("* Time format: HH:MM (24-hour) OR H:MM AM/PM (examples: 18:00 or 6:00 PM)", true);
  addEmptyRow();

  // Event Types
  if (eventTypes.length > 0) {
    addSectionHeader("AVAILABLE EVENT TYPES");
    addEmptyRow();
    addText("Select ONE event type per event:");
    eventTypes.forEach((t) => addText("- " + t, true));
    addEmptyRow();
  }

  // Industries
  if (industries.length > 0) {
    addSectionHeader("AVAILABLE INDUSTRIES");
    addEmptyRow();
    addText("Maximum 3 industries per event (separate with comma or semicolon):");
    industries.forEach((ind) => addText("- " + ind, true));
    addEmptyRow();
  }

  // Other Options
  addSectionHeader("OTHER VALID OPTIONS");
  addEmptyRow();
  addText("FORMAT:  In-Person | Virtual | Hybrid", true);
  addText("PRICING: Free | Paid", true);
  addText("ACCESS:  Open Access | Application required | Executives only", true);
  addText("         Limited Access | Members only", true);
  addEmptyRow();

  // Organization Defaults (if provided)
  if (Object.keys(organizerDefaults).length > 0) {
    addSectionHeader("YOUR ORGANIZATION DEFAULTS");
    addEmptyRow();
    addText("These defaults will be used for empty optional fields:");
    if (organizerDefaults.defaultCity)
      addText(`- Default City: ${organizerDefaults.defaultCity}`, true);
    if (organizerDefaults.defaultFormat)
      addText(`- Default Format: ${organizerDefaults.defaultFormat}`, true);
    if (organizerDefaults.defaultPricing)
      addText(`- Default Pricing: ${organizerDefaults.defaultPricing}`, true);
    if (organizerDefaults.defaultInvitation)
      addText(`- Default Access: ${organizerDefaults.defaultInvitation}`, true);
    if (organizerDefaults.defaultEventType)
      addText(`- Default Event Type: ${organizerDefaults.defaultEventType}`, true);
    addEmptyRow();
  }

  // Address Format
  addSectionHeader("ADDRESS FORMAT");
  addEmptyRow();
  addText("Use a valid Google Maps address for best results", true);
  addText("Enter full address including: Street Address, City, State ZIP", true);
  addText("Example: 123 Main St, Dallas, TX 75201", true);
  addEmptyRow();

  // Description Tips
  addSectionHeader("DESCRIPTION FORMATTING");
  addEmptyRow();
  addText("Keep descriptions concise (1-3 paragraphs recommended)", true);
  addText("HTML is supported! Visit text-html.com to convert rich text to HTML", true);
  addEmptyRow();

  // Footer
  const footerRow = instructionsSheet.getRow(rowNum + 1);
  footerRow.getCell(1).value = "Need help? Contact: support@networkingexecutives.com";
  footerRow.getCell(1).font = { name: "Arial", size: 10, italic: true, color: { argb: NE_NAVY } };
  footerRow.getCell(1).alignment = { horizontal: "center" };

  // ============================================
  // SHEET 2: EVENT DATA ENTRY
  // ============================================
  const dataSheet = workbook.addWorksheet("Enter Events Here", {
    properties: { tabColor: { argb: NE_GOLD } },
  });

  // Headers
  const headers = [
    "Event Title *",
    "Start Date * (YYYY-MM-DD)",
    "Start Time * (HH:MM or H:MM AM/PM)",
    "End Date * (YYYY-MM-DD)",
    "End Time * (HH:MM or H:MM AM/PM)",
    "Event Link/URL",
    "Address",
    "City",
    "Format",
    "Pricing",
    "Access",
    "Event Type",
    "Industries (Max 3)",
    "Description *",
  ];

  // Column widths
  const colWidths = [45, 22, 26, 22, 26, 30, 35, 18, 12, 10, 18, 25, 30, 50];

  headers.forEach((header, idx) => {
    const col = dataSheet.getColumn(idx + 1);
    col.width = colWidths[idx];
  });

  // Add header row with styling
  const headerRow = dataSheet.getRow(1);
  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NE_NAVY } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: NE_GOLD } },
      bottom: { style: "thin", color: { argb: NE_GOLD } },
      left: { style: "thin", color: { argb: NE_GOLD } },
      right: { style: "thin", color: { argb: NE_GOLD } },
    };
  });
  headerRow.height = 35;

  // Sample row with warning styling
  const sampleData = [
    ">>> DELETE THIS ROW - Sample: Executive Networking Mixer",
    "2026-03-15",
    "18:00",
    "2026-03-15",
    "21:00",
    "https://example.com/register",
    "123 Main St, Dallas, TX 75201",
    organizerDefaults.defaultCity || "Dallas/Ft Worth",
    organizerDefaults.defaultFormat || "In-Person",
    organizerDefaults.defaultPricing || "Free",
    organizerDefaults.defaultInvitation || "Open Access",
    eventTypes[0] || "",
    "Technology; Finance",
    "Join us for an evening of professional networking with industry leaders.",
  ];

  const sampleRow = dataSheet.getRow(2);
  sampleData.forEach((value, idx) => {
    const cell = sampleRow.getCell(idx + 1);
    cell.value = value;
    cell.font = { name: "Arial", size: 10, italic: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WARNING_YELLOW } };
    cell.border = {
      top: { style: "thin", color: { argb: WARNING_BORDER } },
      bottom: { style: "thin", color: { argb: WARNING_BORDER } },
      left: { style: "thin", color: { argb: WARNING_BORDER } },
      right: { style: "thin", color: { argb: WARNING_BORDER } },
    };
  });
  sampleRow.height = 22;

  // Freeze header row
  dataSheet.views = [{ state: "frozen", ySplit: 1 }];

  // ============================================
  // SHEET 3: VALID OPTIONS REFERENCE
  // ============================================
  const refSheet = workbook.addWorksheet("Valid Options", {
    properties: { tabColor: { argb: "4CAF50" } },
  });

  refSheet.getColumn(1).width = 55;

  // Reference header
  refSheet.mergeCells("A1:A2");
  const refHeader = refSheet.getCell("A1");
  refHeader.value = "VALID OPTIONS REFERENCE";
  refHeader.font = { name: "Arial", size: 16, bold: true, color: { argb: WHITE } };
  refHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NE_NAVY } };
  refHeader.alignment = { horizontal: "center", vertical: "middle" };
  refSheet.getRow(1).height = 40;

  let refRow = 4;
  const addRefSection = (title, items) => {
    const titleCell = refSheet.getRow(refRow).getCell(1);
    titleCell.value = title;
    titleCell.font = { name: "Arial", size: 12, bold: true, color: { argb: NE_NAVY } };
    titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LIGHT_GRAY } };
    refRow++;

    items.forEach((item) => {
      const itemCell = refSheet.getRow(refRow).getCell(1);
      itemCell.value = item;
      itemCell.font = { name: "Arial", size: 11 };
      refRow++;
    });
    refRow++;
  };

  addRefSection("EVENT TYPES (select ONE per event)", eventTypes);
  addRefSection("FORMAT OPTIONS", ["In-Person", "Virtual", "Hybrid"]);
  addRefSection("PRICING OPTIONS", ["Free", "Paid"]);
  addRefSection("ACCESS OPTIONS", [
    "Open Access",
    "Limited Access",
    "Application required",
    "Members only",
    "Executives only",
  ]);
  addRefSection("DATE FORMAT (YYYY-MM-DD)", [
    "2026-01-15  (January 15, 2026)",
    "2026-06-20  (June 20, 2026)",
    "2026-12-31  (December 31, 2026)",
  ]);
  addRefSection("TIME FORMAT (HH:MM or H:MM AM/PM)", [
    "18:00      (6:00 PM in 24-hour format)",
    "09:30      (9:30 AM in 24-hour format)",
    "6:00 PM    (same as 18:00)",
    "9:30 AM    (same as 09:30)",
  ]);

  if (industries.length > 0) {
    addRefSection("INDUSTRIES (Max 3 per event)", [
      "(Separate multiple with comma or semicolon)",
      ...industries,
    ]);
  } else {
    addRefSection("INDUSTRIES (Max 3 per event)", [
      "(Separate multiple with comma or semicolon)",
      "Example: Technology; Finance; Healthcare",
    ]);
  }

  // Generate and return blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

/**
 * Download bulk upload template
 * @param {object} ExcelJS - ExcelJS library instance
 * @param {object} options - Template options (see generateBulkUploadTemplate)
 * @param {string} filename - Optional custom filename (default: NE_Event_Upload_Template_YYYY-MM-DD.xlsx)
 */
export const downloadBulkUploadTemplate = async (ExcelJS, options = {}, filename = null) => {
  const blob = await generateBulkUploadTemplate(ExcelJS, options);
  const today = new Date().toISOString().split("T")[0];
  const downloadFilename = filename || `NE_Event_Upload_Template_${today}.xlsx`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadFilename;
  link.click();
  URL.revokeObjectURL(url);
};
