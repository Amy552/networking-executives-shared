import { useState, useCallback, useEffect } from "react";
import { EventDateTimeRange } from "./EventDateTimePicker.jsx";
import { LocationPicker, CityPicker } from "./LocationPicker.jsx";
import { RichTextEditor } from "./RichTextEditor.jsx";
import { ImageCropper, useImageCropper } from "./ImageCropper.jsx";
import { EVENT_TYPES, DEFAULT_EVENT } from "../schemas/event.js";

/**
 * EventForm Component
 * Unified event creation/editing form for both admin and main UI
 *
 * @param {Object} props
 * @param {Object} props.formData - Current form data
 * @param {function} props.updateField - Update single field handler
 * @param {function} props.updateFields - Update multiple fields handler
 * @param {Object} props.errors - Validation errors
 * @param {function} props.getError - Get error for field
 * @param {boolean} props.isAdmin - Admin context flag
 * @param {boolean} props.isOrganizerFieldLocked - Lock org fields for organizers
 * @param {Array} props.companies - List of companies for admin dropdown
 * @param {Array} props.cities - List of cities for dropdown
 * @param {Array} props.industries - Available industry options
 * @param {Array} props.eventTypes - Available event type options (admin)
 * @param {function} props.onImageUpload - Handler for image upload
 * @param {boolean} props.isSubmitting - Form submission state
 * @param {Object} props.config - Optional configuration overrides
 */
export function EventForm({
  formData,
  updateField,
  updateFields,
  errors = {},
  getError,
  isAdmin = false,
  isOrganizerFieldLocked = false,
  companies = [],
  cities = [],
  industries = [],
  eventTypes = [],
  onImageUpload,
  isSubmitting = false,
  config = {},
}) {
  // Image cropper state
  const imageCropper = useImageCropper();
  const [imagePreview, setImagePreview] = useState(formData?.eventImage || null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Organization "Other" manual entry state
  const [isOtherOrgSelected, setIsOtherOrgSelected] = useState(false);

  // Track if component has mounted (to avoid initial sync triggering loops)
  const [hasMounted, setHasMounted] = useState(false);

  // Sync image preview with form data (only after mount, and only if different)
  useEffect(() => {
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }
    // Only sync if formData.eventImage is a URL (not a blob preview we created)
    if (formData?.eventImage &&
        formData.eventImage !== imagePreview &&
        !imagePreview?.startsWith('blob:')) {
      setImagePreview(formData.eventImage);
    }
  }, [formData?.eventImage, hasMounted]);

  // Handle organization selection (admin only)
  const handleCompanySelect = useCallback((e) => {
    const value = e.target.value;

    if (value === "other") {
      setIsOtherOrgSelected(true);
      updateFields({
        organizationName: "",
        organizationWeblink: "",
        organizerId: "",
      });
      return;
    }

    if (value === "") {
      setIsOtherOrgSelected(false);
      updateFields({
        organizationName: "",
        organizationWeblink: "",
        organizerId: "",
      });
      return;
    }

    setIsOtherOrgSelected(false);
    const selectedCompany = companies.find(c => c.id === value || c.name === value || c.companyName === value);
    if (selectedCompany) {
      updateFields({
        organizationName: selectedCompany.name || selectedCompany.companyName || selectedCompany.Organization_name,
        organizationWeblink: selectedCompany.website || selectedCompany.websiteUrl || selectedCompany.organizationWeblink || "",
        organizerId: selectedCompany.id || "",
      });
    }
  }, [companies, updateFields]);

  // Handle location selection from Google Places
  const handleLocationSelect = useCallback((locationData) => {
    if (!locationData) return;

    const updates = {
      address: locationData.address || "",
    };

    if (locationData.coordinates) {
      updates.latitude = locationData.coordinates.lat;
      updates.longitude = locationData.coordinates.lng;
    }

    if (locationData.timezone) {
      updates.timezone = locationData.timezone.timeZoneId || locationData.timezone;
      updates.timeZoneAbbr = locationData.timezone.timeZoneAbbr || "";
    }

    // Extract address components (city, state, zip) from Google Places result
    if (locationData.addressComponents) {
      const { city, state, stateShort, zipCode } = locationData.addressComponents;
      if (city) updates.city = city;
      if (stateShort || state) updates.state = stateShort || state;
      if (zipCode) updates.zipCode = zipCode;
    }

    updateFields(updates);
  }, [updateFields]);

  // Handle city selection
  const handleCitySelect = useCallback((cityValue) => {
    updateField("city", cityValue);
  }, [updateField]);

  // Handle date changes
  const handleStartDateChange = useCallback((date) => {
    updateField("startDateTime", date);
  }, [updateField]);

  const handleEndDateChange = useCallback((date) => {
    updateField("endDateTime", date);
  }, [updateField]);

  // Handle image file selection
  const handleImageSelect = useCallback((e) => {
    imageCropper.handleFileSelect(e, {
      allowedTypes: ["image/png", "image/jpeg", "image/jpg"],
      onError: (error) => {
        console.error("Image selection error:", error);
      },
    });
  }, [imageCropper]);

  // Handle drag and drop for image upload
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === "image/png" || droppedFile.type === "image/jpeg" || droppedFile.type === "image/jpg")) {
      handleImageSelect({ target: { files: [droppedFile] } });
    }
  }, [handleImageSelect]);

  // Handle cropped image
  const handleCropComplete = useCallback(async (croppedFile) => {
    imageCropper.closeCropper();

    // Create preview URL
    const previewUrl = URL.createObjectURL(croppedFile);
    setImagePreview(previewUrl);

    // Call upload handler if provided
    if (onImageUpload) {
      try {
        const uploadedUrl = await onImageUpload(croppedFile);
        if (uploadedUrl) {
          updateField("eventImage", uploadedUrl);
        }
      } catch (error) {
        console.error("Image upload error:", error);
      }
    }
  }, [imageCropper, onImageUpload, updateField]);

  // Maximum industries allowed
  const MAX_INDUSTRIES = 3;

  // Handle industry selection toggle
  const handleIndustryToggle = useCallback((industry) => {
    const currentIndustries = formData?.industries || [];
    const isSelected = currentIndustries.includes(industry);

    // If already selected, always allow deselection
    if (isSelected) {
      updateField("industries", currentIndustries.filter(i => i !== industry));
      return;
    }

    // If not selected, check if we've reached the limit
    if (currentIndustries.length >= MAX_INDUSTRIES) {
      return; // Don't add more if at limit
    }

    updateField("industries", [...currentIndustries, industry]);
  }, [formData?.industries, updateField]);

  // Helper to get field error
  const fieldError = (field) => getError ? getError(field) : errors[field];

  // Configuration with defaults
  const formConfig = {
    showOrganization: true,
    showEventDetails: true,
    showDateTime: true,
    showLocation: true,
    showIndustries: true,
    showContact: true,
    showImage: true,
    showPricing: true,
    showEventOptions: true, // Pricing, format, invitation
    showEventLink: true,
    showHighlight: isAdmin, // Admin-only by default
    showEventType: isAdmin && eventTypes.length > 0, // Admin event type dropdown
    layout: "vertical",
    ...config,
  };

  return (
    <div className="space-y-6">
      {/* Organization Section */}
      {formConfig.showOrganization && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Organization Information
          </h3>

          {isAdmin && companies.length > 0 ? (
            <div className="w-full">
              <label className="text-base font-medium text-[#2D2C3C]">
                Organization <span className="text-red-500">*</span>
              </label>
              <select
                value={isOtherOrgSelected ? "other" : (formData?.organizationName || "")}
                onChange={handleCompanySelect}
                disabled={isSubmitting}
                className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  fieldError("organizationName") ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Organization</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.name || company.companyName}>
                    {company.name || company.companyName || company.Organization_name}
                  </option>
                ))}
                <option value="other">Other (Enter manually)</option>
              </select>

              {isOtherOrgSelected && (
                <input
                  type="text"
                  value={formData?.organizationName || ""}
                  onChange={(e) => updateField("organizationName", e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Enter Organization Name"
                  className="mt-2 w-full rounded-md border border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              )}
              {fieldError("organizationName") && (
                <p className="mt-1 text-sm text-red-500">{fieldError("organizationName")}</p>
              )}
            </div>
          ) : (
            <div className="w-full">
              <label className="text-base font-medium text-[#2D2C3C]">
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData?.organizationName || ""}
                onChange={(e) => updateField("organizationName", e.target.value)}
                disabled={isOrganizerFieldLocked || isSubmitting}
                placeholder="Enter organization name"
                className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  fieldError("organizationName") ? "border-red-500" : "border-gray-300"
                } ${isOrganizerFieldLocked ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {fieldError("organizationName") && (
                <p className="mt-1 text-sm text-red-500">{fieldError("organizationName")}</p>
              )}
            </div>
          )}

          <div className="w-full">
            <label className="text-base font-medium text-[#2D2C3C]">
              Organization Website
            </label>
            <input
              type="url"
              value={formData?.organizationWeblink || ""}
              onChange={(e) => updateField("organizationWeblink", e.target.value)}
              disabled={(isOrganizerFieldLocked && !isAdmin) || isSubmitting}
              placeholder="https://example.com"
              className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                fieldError("organizationWeblink") ? "border-red-500" : "border-gray-300"
              } ${isOrganizerFieldLocked && !isAdmin ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
            {fieldError("organizationWeblink") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("organizationWeblink")}</p>
            )}
          </div>
        </section>
      )}

      {/* Event Details Section */}
      {formConfig.showEventDetails && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Event Details
          </h3>

          <div className="w-full">
            <label className="text-base font-medium text-[#2D2C3C]">
              Event Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData?.eventName || ""}
              onChange={(e) => updateField("eventName", e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter event name"
              className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                fieldError("eventName") ? "border-red-500" : "border-gray-300"
              }`}
            />
            {fieldError("eventName") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("eventName")}</p>
            )}
          </div>

          <div className="w-full">
            <label className="text-base font-medium text-[#2D2C3C]">
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData?.eventType || ""}
              onChange={(e) => updateField("eventType", e.target.value)}
              disabled={isSubmitting}
              className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                fieldError("eventType") ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="" disabled>Select Event Type</option>
              <option value={EVENT_TYPES.IN_PERSON}>In Person</option>
              <option value={EVENT_TYPES.VIRTUAL}>Virtual</option>
              <option value={EVENT_TYPES.HYBRID}>Hybrid</option>
            </select>
            {fieldError("eventType") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("eventType")}</p>
            )}
          </div>

          <RichTextEditor
            value={formData?.description || ""}
            onChange={(html) => updateField("description", html)}
            label="Event Description"
            required
            error={fieldError("description")}
            maxLength={5000}
            layout={formConfig.layout}
          />

          {/* Event Link */}
          {formConfig.showEventLink && (
            <div className="w-full">
              <label className="text-base font-medium text-[#2D2C3C]">
                Event Registration Link
              </label>
              <input
                type="url"
                value={formData?.eventLink || ""}
                onChange={(e) => updateField("eventLink", e.target.value)}
                disabled={isSubmitting}
                placeholder="https://eventbrite.com/..."
                className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  fieldError("eventLink") ? "border-red-500" : "border-gray-300"
                }`}
              />
              {fieldError("eventLink") && (
                <p className="mt-1 text-sm text-red-500">{fieldError("eventLink")}</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Event Options Section (Pricing, Format, Invitation) */}
      {formConfig.showEventOptions && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Event Options
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pricing */}
            <div className="w-full">
              <label className="text-base font-medium text-[#2D2C3C]">
                Pricing <span className="text-red-500">*</span>
              </label>
              <select
                value={formData?.eventPricing || ""}
                onChange={(e) => updateField("eventPricing", e.target.value)}
                disabled={isSubmitting}
                className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  fieldError("eventPricing") ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="" disabled hidden>Select Pricing</option>
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
              </select>
              {fieldError("eventPricing") && (
                <p className="mt-1 text-sm text-red-500">{fieldError("eventPricing")}</p>
              )}
            </div>

            {/* Attendance Type (eventFormat) */}
            <div className="w-full">
              <label className="text-base font-medium text-[#2D2C3C]">
                Attendance Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData?.eventFormat || ""}
                onChange={(e) => updateField("eventFormat", e.target.value)}
                disabled={isSubmitting}
                className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  fieldError("eventFormat") ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="" disabled hidden>Select Attendance Type</option>
                <option value="In-Person">In-Person</option>
                <option value="Virtual">Virtual</option>
                <option value="Hybrid">Hybrid</option>
              </select>
              {fieldError("eventFormat") && (
                <p className="mt-1 text-sm text-red-500">{fieldError("eventFormat")}</p>
              )}
            </div>
          </div>

          {/* Access & Invitation */}
          <div className="w-full">
            <label className="text-base font-medium text-[#2D2C3C]">
              Access & Invitation <span className="text-red-500">*</span>
            </label>
            <select
              value={formData?.eventInvitation || ""}
              onChange={(e) => updateField("eventInvitation", e.target.value)}
              disabled={isSubmitting}
              className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                fieldError("eventInvitation") ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="" disabled hidden>Select Access & Invitation</option>
              <option value="Application required">Application required</option>
              <option value="Executives only">Executives only</option>
              <option value="Limited Access">Limited Access (Guest or First-Time)</option>
              <option value="Members only">Members only</option>
              <option value="Open Access">Open Access</option>
            </select>
            {fieldError("eventInvitation") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("eventInvitation")}</p>
            )}
          </div>

          {/* Event Type dropdown (admin only - from eventTypes context) */}
          {formConfig.showEventType && eventTypes.length > 0 && (
            <div className="w-full">
              <label className="text-base font-medium text-[#2D2C3C]">
                Event Type
              </label>
              <select
                value={formData?.eventHighlight || ""}
                onChange={(e) => updateField("eventHighlight", e.target.value)}
                disabled={isSubmitting}
                className="mt-1 w-full rounded-md border border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">No specific event type</option>
                {eventTypes.map((type) => (
                  <option key={type.id} value={type.title}>
                    {type.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Highlight Event checkbox (admin only) */}
          {formConfig.showHighlight && (
            <div className="flex items-center justify-end gap-2">
              <label htmlFor="highlightEvent" className="text-base font-medium text-[#2D2C3C]">
                Highlight Event?
              </label>
              <input
                type="checkbox"
                id="highlightEvent"
                className="h-5 w-5"
                checked={formData?.isHighlighted || false}
                onChange={(e) => updateField("isHighlighted", e.target.checked)}
                disabled={isSubmitting}
              />
            </div>
          )}
        </section>
      )}

      {/* Date & Time Section */}
      {formConfig.showDateTime && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Date & Time
          </h3>

          <EventDateTimeRange
            startDate={formData?.startDateTime}
            endDate={formData?.endDateTime}
            onStartChange={handleStartDateChange}
            onEndChange={handleEndDateChange}
            errors={{
              startDate: fieldError("startDateTime"),
              endDate: fieldError("endDateTime"),
            }}
            startRequired
            endRequired
            layout={formConfig.layout}
          />

          {formData?.timezone && (
            <div className="text-sm text-gray-600">
              Timezone: {formData.timeZoneAbbr || formData.timezone}
            </div>
          )}
        </section>
      )}

      {/* Location Section */}
      {formConfig.showLocation && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Location
          </h3>

          {(formData?.eventType === EVENT_TYPES.IN_PERSON || formData?.eventType === EVENT_TYPES.HYBRID) && (
            <>
              <LocationPicker
                value={formData?.address || ""}
                onChange={handleLocationSelect}
                label="Address"
                required
                error={fieldError("address")}
                layout={formConfig.layout}
              />

              {cities.length > 0 ? (
                <CityPicker
                  value={formData?.city || ""}
                  onChange={handleCitySelect}
                  cities={cities}
                  label="City"
                  required
                  error={fieldError("city")}
                  layout={formConfig.layout}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-base font-medium text-[#2D2C3C]">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData?.city || ""}
                      onChange={(e) => updateField("city", e.target.value)}
                      disabled={isSubmitting}
                      placeholder="City"
                      className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm ${
                        fieldError("city") ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {fieldError("city") && (
                      <p className="mt-1 text-sm text-red-500">{fieldError("city")}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-base font-medium text-[#2D2C3C]">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData?.state || ""}
                      onChange={(e) => updateField("state", e.target.value)}
                      disabled={isSubmitting}
                      placeholder="State"
                      className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm ${
                        fieldError("state") ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {fieldError("state") && (
                      <p className="mt-1 text-sm text-red-500">{fieldError("state")}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="w-full md:w-1/2">
                <label className="text-base font-medium text-[#2D2C3C]">
                  Zip Code
                </label>
                <input
                  type="text"
                  value={formData?.zipCode || ""}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                  disabled={isSubmitting}
                  placeholder="12345"
                  maxLength={10}
                  className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm ${
                    fieldError("zipCode") ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {fieldError("zipCode") && (
                  <p className="mt-1 text-sm text-red-500">{fieldError("zipCode")}</p>
                )}
              </div>
            </>
          )}

          {(formData?.eventType === EVENT_TYPES.VIRTUAL || formData?.eventType === EVENT_TYPES.HYBRID) && (
            <div className="w-full">
              <label className="text-base font-medium text-[#2D2C3C]">
                Virtual Event Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData?.virtualLink || ""}
                onChange={(e) => updateField("virtualLink", e.target.value)}
                disabled={isSubmitting}
                placeholder="https://zoom.us/j/..."
                className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm ${
                  fieldError("virtualLink") ? "border-red-500" : "border-gray-300"
                }`}
              />
              {fieldError("virtualLink") && (
                <p className="mt-1 text-sm text-red-500">{fieldError("virtualLink")}</p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Industries/Categories Section */}
      {formConfig.showIndustries && industries.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Industries / Categories <span className="text-red-500">*</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {industries.map((industry) => {
              const industryValue = typeof industry === "string" ? industry : industry.value || industry.name;
              const industryLabel = typeof industry === "string" ? industry : industry.label || industry.name || industry.value;
              const isSelected = (formData?.industries || []).includes(industryValue);
              const isAtLimit = (formData?.industries || []).length >= MAX_INDUSTRIES;
              const isDisabled = isSubmitting || (!isSelected && isAtLimit);

              return (
                <button
                  key={industryValue}
                  type="button"
                  onClick={() => handleIndustryToggle(industryValue)}
                  disabled={isDisabled}
                  className={`px-4 py-2 rounded-full border transition-colors ${
                    isSelected
                      ? "bg-[#030959] text-white border-[#030959]"
                      : isDisabled
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-gray-700 border-gray-300 hover:border-[#030959]"
                  }`}
                >
                  {industryLabel}
                </button>
              );
            })}
          </div>

          {fieldError("industries") && (
            <p className="mt-1 text-sm text-red-500">{fieldError("industries")}</p>
          )}

          <p className="text-sm text-gray-500">
            Selected: {(formData?.industries || []).length} / {MAX_INDUSTRIES} (max)
          </p>
        </section>
      )}

      {/* Contact Section */}
      {formConfig.showContact && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-base font-medium text-[#2D2C3C]">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData?.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={isSubmitting}
                placeholder="contact@example.com"
                className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm ${
                  fieldError("email") ? "border-red-500" : "border-gray-300"
                } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {fieldError("email") && (
                <p className="mt-1 text-sm text-red-500">{fieldError("email")}</p>
              )}
            </div>

            <div>
              <label className="text-base font-medium text-[#2D2C3C]">
                Phone
              </label>
              <input
                type="tel"
                value={formData?.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={isSubmitting}
                placeholder="(555) 123-4567"
                className={`mt-1 w-full rounded-md border p-3 text-black shadow-sm ${
                  fieldError("phone") ? "border-red-500" : "border-gray-300"
                } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {fieldError("phone") && (
                <p className="mt-1 text-sm text-red-500">{fieldError("phone")}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Event Image Section */}
      {formConfig.showImage && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            Event Image
          </h3>

          <div className="w-full">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Event preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    updateField("eventImage", "");
                  }}
                  disabled={isSubmitting}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragging
                  ? "border-[#030959] bg-blue-50"
                  : "border-gray-300 hover:bg-gray-50"
              } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className={`w-10 h-10 mb-3 transition-colors ${isDragging ? "text-[#030959]" : "text-gray-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-400">PNG or JPG (recommended: 1440x650)</p>
                </div>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageSelect}
                  disabled={isSubmitting}
                  className="hidden"
                />
              </label>
            )}

            {fieldError("eventImage") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("eventImage")}</p>
            )}
          </div>
        </section>
      )}

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={imageCropper.isOpen}
        imageSrc={imageCropper.imageSrc}
        onCropComplete={handleCropComplete}
        onCancel={imageCropper.closeCropper}
        aspect={1440 / 650}
        title="Crop Event Image"
      />
    </div>
  );
}

/**
 * EventFormActions Component
 * Submit and cancel buttons for the form
 */
export function EventFormActions({
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Create Event",
  cancelLabel = "Cancel",
  showCancel = true,
}) {
  return (
    <div className="flex justify-end gap-4 pt-6 border-t">
      {showCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
      )}
      <button
        type="submit"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="px-6 py-3 rounded-md bg-[#030959] text-white hover:bg-[#020847] transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

export default EventForm;
