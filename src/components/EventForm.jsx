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
  onImageError,
  /*
   * Sponsor logos (organizer perk, up to 2). AddEvent has been passing
   * onSponsorLogoUpload and isOrganizer for a while, but this component never
   * declared them — so the handler and the save logic existed while the form
   * had no field at all. Live data confirmed it: 0 of 300 events had a sponsor
   * logo, because there was no way to add one.
   */
  onSponsorLogoUpload,
  isOrganizer = false,
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

  // Whether the user has explicitly chosen to upload a custom flyer
  // (instead of using the saved company logo).
  const [useCustomFlyer, setUseCustomFlyer] = useState(false);
  // Whether to also save the uploaded image as the company's new logo
  const [updateCompanyLogo, setUpdateCompanyLogo] = useState(false);

  // Sync the updateCompanyLogo flag onto formData so the submit handler can read it.
  // Done in an effect (not during render) to avoid infinite re-render loops.
  useEffect(() => {
    if ((formData?.__updateCompanyLogo || false) !== updateCompanyLogo) {
      updateField("__updateCompanyLogo", updateCompanyLogo);
    }
  }, [updateCompanyLogo, formData?.__updateCompanyLogo, updateField]);

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
      const updates = {
        organizationName: selectedCompany.name || selectedCompany.companyName || selectedCompany.Organization_name,
        organizationWeblink: selectedCompany.website || selectedCompany.websiteUrl || selectedCompany.organizationWeblink || "",
        organizerId: selectedCompany.id || "",
      };
      // Default the event flyer to the company's logo when no custom image
      // has been set yet — admin can still override by uploading a different image.
      const companyLogo = selectedCompany.logo || selectedCompany.logoUrl || selectedCompany.companyLogo || "";
      const currentImage = formData?.eventImage || "";
      const noCustomImage = !currentImage || currentImage.startsWith("blob:");
      if (companyLogo && noCustomImage) {
        updates.eventImage = companyLogo;
      }
      updateFields(updates);
    }
  }, [companies, updateFields, formData?.eventImage]);

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
    if (!formData?.state) {
      updateField("state", "TX");
    }
  }, [updateField, formData?.state]);

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
      // Match imageService.ALLOWED_IMAGE_TYPES so an iPhone HEIC or
      // a WEBP banner doesn't get silently refused here. Compression
      // in the upload path transcodes to JPEG before Storage ever
      // sees it.
      allowedTypes: [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp",
        "image/heic",
        "image/heif",
        "image/heic-sequence",
        "image/heif-sequence",
      ],
      // Relaxed minimums — typical org logos are 500-1000px wide; the
      // previous 1440x650 minimum silently rejected those. We use
      // object-contain rendering, so a smaller image just scales down
      // cleanly instead of pixelating.
      minWidth: 400,
      minHeight: 200,
      onError: (error) => {
        if (onImageError) {
          onImageError(error);
          return;
        }
        console.error("Image selection error:", error);
      },
    });
  }, [imageCropper, onImageError]);

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
    if (!droppedFile) return;
    // Accept anything that looks like an image, including HEIC and
    // files with empty `type` (macOS drop-from-Photos, some Safari
    // paths). handleImageSelect + imageCropper's allowedTypes will
    // do the real filtering, so this only needs a coarse sniff.
    const looksLikeImage =
      (droppedFile.type && droppedFile.type.startsWith("image/")) ||
      /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(droppedFile.name || "");
    if (looksLikeImage) {
      handleImageSelect({ target: { files: [droppedFile] } });
    } else if (typeof onImageError === "function") {
      // Route through the same channel the file-picker uses, so the
      // organizer gets a visible signal instead of a silently-
      // swallowed drop. Used to just no-op.
      onImageError({ message: "That file doesn't look like an image. Try a PNG, JPG, WEBP, or HEIC." });
    }
  }, [handleImageSelect, onImageError]);

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
    showEventType: eventTypes.length > 0, // Event type dropdown (visible to all)
    layout: "vertical",
    ...config,
  };

  return (
    <div className="space-y-6">
      {/* Organization Section */}
      {formConfig.showOrganization && (
        <section className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">
          <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-[#c9a34e]/30 pb-2 lg:col-span-2">
            Organization Information
          </h3>

          {isAdmin && companies.length > 0 ? (
            <div className="w-full">
              <label className="text-base font-medium text-[#2D2C3C]">
                Organization <span className="text-[#c9a34e]">*</span>
              </label>
              <select
                value={isOtherOrgSelected ? "other" : (formData?.organizationName || "")}
                onChange={handleCompanySelect}
                disabled={isSubmitting}
                className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
                  className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              )}
              {fieldError("organizationName") && (
                <p className="mt-1 text-sm text-red-500">{fieldError("organizationName")}</p>
              )}
            </div>
          ) : (
            <div className="w-full">
              <label className="text-base font-medium text-[#2D2C3C]">
                Organization Name <span className="text-[#c9a34e]">*</span>
              </label>
              <input
                type="text"
                value={formData?.organizationName || ""}
                onChange={(e) => updateField("organizationName", e.target.value)}
                disabled={isOrganizerFieldLocked || isSubmitting}
                placeholder="Enter organization name"
                className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
              className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
        <section className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">
          <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-[#c9a34e]/30 pb-2 lg:col-span-2">
            Event Details
          </h3>

          <div className="w-full">
            <label className="text-base font-medium text-[#2D2C3C]">
              Event Name <span className="text-[#c9a34e]">*</span>
            </label>
            <input
              type="text"
              value={formData?.eventName || ""}
              onChange={(e) => updateField("eventName", e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter event name"
              className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                fieldError("eventName") ? "border-red-500" : "border-gray-300"
              }`}
            />
            {fieldError("eventName") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("eventName")}</p>
            )}
          </div>

          <div className="w-full">
            <label className="text-base font-medium text-[#2D2C3C]">
              Attendance Type <span className="text-[#c9a34e]">*</span>
            </label>
            <select
              value={formData?.eventType || ""}
              onChange={(e) => updateField("eventType", e.target.value)}
              disabled={isSubmitting}
              className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                fieldError("eventType") ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="" disabled>Select Attendance Type</option>
              <option value={EVENT_TYPES.IN_PERSON}>In Person</option>
              <option value={EVENT_TYPES.VIRTUAL}>Virtual</option>
              <option value={EVENT_TYPES.HYBRID}>Hybrid</option>
            </select>
            {fieldError("eventType") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("eventType")}</p>
            )}
          </div>

          {/* Long-form input, so it takes the whole row rather than half. */}
          <div className="lg:col-span-2">
          <RichTextEditor
            value={formData?.description || ""}
            onChange={(html) => updateField("description", html)}
            label="Event Description"
            required
            error={fieldError("description")}
            maxLength={5000}
            layout={formConfig.layout}
          />
          </div>

          {/* Event Link */}
          {formConfig.showEventLink && (
            <div className="w-full">
              {/*
                Marked optional 2026-07-30 (Amy). The placeholder implied an
                organizer was expected to have a registration page of their own,
                and an organization without an events website had no way to tell
                that leaving it blank was allowed. Saying what happens when it is
                empty matters more than the word "optional" on its own, so the
                helper line names the outcome.
              */}
              <label className="text-base font-medium text-[#2D2C3C]">
                Event Registration Link <span className="font-normal text-gray-500">(optional)</span>
              </label>
              {/*
                Rewritten 2026-07-30. The first attempt said "only if people
                register somewhere else", which assumes the reader knows there is
                a HERE to be elsewhere from. They often do not: registration is
                entitlement-gated, so a free organizer has never seen that section
                and has no idea we can take signups at all. "Somewhere else" was
                therefore relative to something they had never been shown.

                This version is self-contained. It describes the two situations in
                the organizer's own terms, sign-ups happen on your page or there
                are none, without depending on knowledge of our feature set. The
                upsell is not repeated here; the callout at the top of the form
                already introduces what an organizer account adds, and saying it
                twice on one screen reads as pressure.
              */}
              <p className="mt-1 text-sm text-gray-500">
                If people sign up on your own site or a ticketing page, paste that link here. If
                there is nothing to sign up for, leave it blank and the event shows as a listing
                with the details.
              </p>
              <input
                type="url"
                value={formData?.eventLink || ""}
                onChange={(e) => updateField("eventLink", e.target.value)}
                disabled={isSubmitting}
                placeholder="https://your-site.com/register"
                className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
        <section className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">
          <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-[#c9a34e]/30 pb-2 lg:col-span-2">
            Event Options
          </h3>

          <div className="w-full">
            <label className="text-base font-medium text-[#2D2C3C]">
              Admission <span className="text-[#c9a34e]">*</span>
            </label>
            <select
              value={formData?.eventPricing || ""}
              onChange={(e) => updateField("eventPricing", e.target.value)}
              disabled={isSubmitting}
              className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                fieldError("eventPricing") ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="" disabled hidden>Is it free or paid?</option>
              <option value="Free">Free</option>
              {/*
                Amy 2026-08-05: the label at the decision point says
                "managed externally" so an organizer understands the
                platform does not collect the fee. The stored value stays
                "Paid" — existing rows, listings, and schema.org JSON-LD
                keep the short label everywhere else.
              */}
              <option value="Paid">Paid (managed externally)</option>
            </select>
            {fieldError("eventPricing") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("eventPricing")}</p>
            )}
          </div>

          {/*
            Payment link + instructions, shown only when the organizer picks
            Paid. Networking Executives doesn't process ticket payments, so
            these fields are how the organizer pipes their own payment
            mechanism (Stripe payment link, Eventbrite, PayPal.me, at-the-
            door) through to approved attendees. Rendered in the approval
            email and on the ticket page after approval. Amy 2026-08-05.
          */}
          {formData?.eventPricing === "Paid" && (
            <div className="w-full lg:col-span-2 rounded-md border border-[#c9a34e]/40 bg-[#c9a34e]/5 p-4">
              <p className="mb-3 text-sm font-medium text-[#1a254a]">
                How should approved attendees pay? <span className="text-gray-500 font-normal">(shared with them after approval)</span>
              </p>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="mb-1 block text-[13px] text-[#2D2C3C]">Payment link</label>
                  <input
                    type="url"
                    value={formData?.paymentUrl || ""}
                    onChange={(e) => updateField("paymentUrl", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="https://buy.stripe.com/..., https://www.eventbrite.com/..., https://paypal.me/..."
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-[13px] text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] text-[#2D2C3C]">
                    Payment instructions <span className="text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    value={formData?.paymentInstructions || ""}
                    onChange={(e) => updateField("paymentInstructions", e.target.value)}
                    disabled={isSubmitting}
                    rows={2}
                    maxLength={500}
                    placeholder="Amount, deadline, or context. Example: $150 due 48h before the event. Venmo @foo with the confirmation code from your approval email."
                    className="w-full resize-none rounded-lg border border-gray-300 p-2.5 text-[13px] text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Access & Invitation */}
          <div className="w-full">
            <label className="text-base font-medium text-[#2D2C3C]">
              Who can attend? <span className="text-[#c9a34e]">*</span>
            </label>
            <select
              value={formData?.eventInvitation || ""}
              onChange={(e) => updateField("eventInvitation", e.target.value)}
              disabled={isSubmitting}
              className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                fieldError("eventInvitation") ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="" disabled hidden>Select who can attend</option>
              <option value="Open Access">Open to everyone</option>
              <option value="Limited Access">Guests and first-timers welcome</option>
              <option value="Application required">Approval required</option>
              <option value="Members only">Members only</option>
            </select>
            {fieldError("eventInvitation") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("eventInvitation")}</p>
            )}
          </div>

          {/* Event Type dropdown - from eventTypes context */}
          {formConfig.showEventType && eventTypes.length > 0 && (
            <div className="w-full">
              <label className="text-base font-medium text-[#2D2C3C]">
                Event Type
              </label>
              <select
                value={formData?.eventHighlight || ""}
                onChange={(e) => updateField("eventHighlight", e.target.value)}
                disabled={isSubmitting}
                className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-black shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
          {/*
            Reminder cadence, per event. Defaults: all three send. Any
            box unchecked suppresses that reminder for THIS event only.
            The Cloud Function reads these fields; missing = enabled so
            events created before this UI shipped keep the full cadence.
            Amy 2026-08-05.
          */}
          <div className="lg:col-span-2 rounded-md border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-[#1a254a]">Reminder emails to attendees</p>
            <p className="mt-1 text-xs text-gray-500">
              Sent to approved registrants. Uncheck any you want to skip. Reminders send on the Organizer tier and above.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-[#1a254a]">
                <input
                  type="checkbox"
                  checked={formData?.reminderWeekEnabled !== false}
                  onChange={(e) => updateField("reminderWeekEnabled", e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 accent-[#1a254a]"
                />
                1 week before
              </label>
              <label className="flex items-center gap-2 text-sm text-[#1a254a]">
                <input
                  type="checkbox"
                  checked={formData?.reminder24hEnabled !== false}
                  onChange={(e) => updateField("reminder24hEnabled", e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 accent-[#1a254a]"
                />
                24 hours before
              </label>
              <label className="flex items-center gap-2 text-sm text-[#1a254a]">
                <input
                  type="checkbox"
                  checked={formData?.reminderDayOfEnabled !== false}
                  onChange={(e) => updateField("reminderDayOfEnabled", e.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 accent-[#1a254a]"
                />
                Day of
              </label>
            </div>
          </div>
        </section>
      )}

      {/* Date & Time Section */}
      {formConfig.showDateTime && (
        <section className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">
          <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-[#c9a34e]/30 pb-2 lg:col-span-2">
            Date & Time
          </h3>

          {/*
            Sits ABOVE the picker on purpose. Times entered here are
            interpreted as venue-local — a 6 PM pick becomes 6 PM in
            the venue's zone regardless of where the organizer is
            sitting when they type it. Every event tool does this;
            the ambiguity is only in whether the organizer KNOWS
            that's what's happening. Before the address is
            geocoded the zone is unknown, so we say so and prompt
            them to enter the address to lock it in.
          */}
          <div className="lg:col-span-2 rounded-md bg-[#c9a34e]/10 px-3 py-2 text-[13px] text-[#1a254a]">
            {(() => {
              const tz = formData?.timezone;
              if (!tz) {
                return (
                  <>
                    Times below are read as <strong>venue-local time</strong> — enter the venue address
                    below and we'll show the confirmed time zone here.
                  </>
                );
              }
              let pretty = tz;
              try {
                // Resolve the tz name against the EVENT'S date, not
                // today. Using new Date() meant a January event picked
                // in August rendered as "Central Daylight Time (CST)"
                // — self-contradicting, since the event page will read
                // it as CST. Fall back to today only when no start
                // date has been picked yet.
                const reference = (() => {
                  const raw = formData?.startDateTime;
                  if (!raw) return new Date();
                  const d = raw instanceof Date ? raw : new Date(raw);
                  return isNaN(d.getTime()) ? new Date() : d;
                })();
                const parts = new Intl.DateTimeFormat(undefined, {
                  timeZone: tz,
                  timeZoneName: "long",
                }).formatToParts(reference);
                pretty = parts.find((p) => p.type === "timeZoneName")?.value || tz;
              } catch {
                // Intl.DateTimeFormat throws on unrecognised zone IDs. Fall
                // back to whatever the stored value was so the hint still
                // says SOMETHING useful.
              }
              const abbr = formData?.timeZoneAbbr;
              return (
                <>
                  Times below are in <strong>{pretty}</strong>
                  {abbr ? ` (${abbr})` : ""} — this is how attendees will see them on the event page.
                </>
              );
            })()}
          </div>

          <div className="lg:col-span-2">
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
          </div>
        </section>
      )}

      {/* Location Section */}
      {formConfig.showLocation && (() => {
        // Check both eventType and eventFormat (admin uses eventFormat dropdown)
        const format = (formData?.eventType || formData?.eventFormat || "").toLowerCase();
        const isInPerson = format === "in-person" || format === "in person";
        const isHybrid = format === "hybrid";
        const isVirtual = format === "virtual";
        const showLocation = isInPerson || isHybrid;
        const showVirtual = isVirtual || isHybrid;

        if (!showLocation && !showVirtual) return null;

        return (
          <section className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">
            {showLocation && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-[#c9a34e]/30 pb-2 lg:col-span-2">
                  Location
                </h3>
                <div className="lg:col-span-2">
                <LocationPicker
                  value={formData?.address || ""}
                  onChange={handleLocationSelect}
                  label="Address"
                  required
                  error={fieldError("address")}
                  layout={formConfig.layout}
                />
                </div>

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
                  <div>
                    <label className="text-base font-medium text-[#2D2C3C]">
                      City <span className="text-[#c9a34e]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData?.city || ""}
                      onChange={(e) => updateField("city", e.target.value)}
                      disabled={isSubmitting}
                      placeholder="City"
                      className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm ${
                        fieldError("city") ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {fieldError("city") && (
                      <p className="mt-1 text-sm text-red-500">{fieldError("city")}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-base font-medium text-[#2D2C3C]">
                    State <span className="text-[#c9a34e]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData?.state || ""}
                    onChange={(e) => updateField("state", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="e.g. TX"
                    className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm ${
                      fieldError("state") ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {fieldError("state") && (
                    <p className="mt-1 text-sm text-red-500">{fieldError("state")}</p>
                  )}
                </div>

                <div>
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
                    className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm ${
                      fieldError("zipCode") ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {fieldError("zipCode") && (
                    <p className="mt-1 text-sm text-red-500">{fieldError("zipCode")}</p>
                  )}
                </div>
              </>
            )}

            {showVirtual && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-[#c9a34e]/30 pb-2 lg:col-span-2">
                  Virtual Event Details
                </h3>
                <div className="w-full">
                  <label className="text-base font-medium text-[#2D2C3C]">
                    Virtual Event Link
                  </label>
                  <input
                    type="url"
                    value={formData?.virtualLink || ""}
                    onChange={(e) => updateField("virtualLink", e.target.value)}
                    disabled={isSubmitting}
                    placeholder="https://zoom.us/j/..."
                    className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm ${
                      fieldError("virtualLink") ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {fieldError("virtualLink") && (
                    <p className="mt-1 text-sm text-red-500">{fieldError("virtualLink")}</p>
                  )}
                </div>
              </>
            )}
          </section>
        );
      })()}

      {/* Industries/Categories Section */}
      {formConfig.showIndustries && industries.length > 0 && (
        <section className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">
          <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-[#c9a34e]/30 pb-2 lg:col-span-2">
            Industries / Categories <span className="text-[#c9a34e]">*</span>
          </h3>

          <div className="flex flex-wrap gap-2 lg:col-span-2">
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
            <p className="mt-1 text-sm text-red-500 lg:col-span-2">{fieldError("industries")}</p>
          )}

          <p className="text-sm text-gray-500 lg:col-span-2">
            Selected: {(formData?.industries || []).length} / {MAX_INDUSTRIES} (max)
          </p>
        </section>
      )}

      {/* Contact Section */}
      {formConfig.showContact && (
        <section className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">
          <h3 className="text-lg font-semibold text-gray-900 border-b-2 border-[#c9a34e]/30 pb-2 lg:col-span-2">
            Contact Information
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-2">
            <div>
              <label className="text-base font-medium text-[#2D2C3C]">
                Email <span className="text-[#c9a34e]">*</span>
              </label>
              <input
                type="email"
                value={formData?.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={isSubmitting}
                placeholder="contact@example.com"
                className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm ${
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
                className={`mt-1 w-full rounded-lg border p-3 text-black shadow-sm ${
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
      {formConfig.showImage && (() => {
        // Find selected company + its logo for the "use saved logo" default
        const selectedCompany = companies.find(
          c => c.id === formData?.organizerId || c.id === formData?.companyId
        );
        const companyLogo =
          selectedCompany?.logo ||
          selectedCompany?.logoUrl ||
          selectedCompany?.companyLogo ||
          "";
        const companyName =
          selectedCompany?.name ||
          selectedCompany?.companyName ||
          formData?.organizationName ||
          "your organization";
        const usingSavedLogo =
          !!companyLogo &&
          !useCustomFlyer &&
          (formData?.eventImage === companyLogo || !formData?.eventImage);

        return (
        <section className="space-y-4">
          <div className="border-b-2 border-[#c9a34e]/30 pb-2">
            {/*
              Label renamed 2026-07-31 (Amy) from "Event Flyer" to "Event Banner".
              The image renders as the event card and page header — a horizontal
              banner, not a printable portrait flyer. The Firestore field is
              still called eventFlyerImage for historical/data-migration reasons;
              only the user-facing label changed here.
            */}
            <h3 className="text-lg font-semibold text-gray-900">
              Event Banner
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Optional — we'll use {companyName}'s logo on file by default.
              Upload a horizontal image when you have an event-specific design.
            </p>
            {/*
              Sharing-crop guidance. Gig Talent 2026-08-05: Teams / Slack
              render link previews as compact cards with a square thumbnail
              on the LEFT, so a wide banner loses its sides. Full-bleed
              previews (LinkedIn feed, iMessage rich links, Facebook) show
              the whole 1200x630. Both scenarios crop from the sides, never
              the middle, so keeping critical content centered survives
              every platform. Amy 2026-08-05.
            */}
            <p className="mt-2 rounded-md border border-[#c9a34e]/30 bg-[#c9a34e]/5 px-3 py-2 text-[13px] text-[#1a254a]">
              <span className="font-[600]">Design tip:</span> best at 1200×630 (or wider, same ratio). Keep the title, date and logo near the CENTER — Teams, Slack, and similar chat apps show a square crop of the middle for link previews.
            </p>
          </div>

          <div className="w-full">
            {usingSavedLogo ? (
              <div className="rounded-lg border border-gray-200 bg-[#fafafa] p-6">
                <div className="flex flex-col items-center">
                  <img
                    src={companyLogo}
                    alt={`${companyName} logo`}
                    className="max-h-32 w-auto max-w-full object-contain"
                    style={{ mixBlendMode: "multiply" }}
                  />
                  <p className="mt-3 text-sm font-medium text-gray-700">
                    ✓ Using {companyName}'s logo on file
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomFlyer(true);
                      setImagePreview(null);
                      updateField("eventImage", "");
                    }}
                    className="mt-3 text-sm font-medium text-[#1a254a] underline hover:text-[#c9a34e]"
                  >
                    Upload a different image for this event
                  </button>
                </div>
              </div>
            ) : imagePreview ? (
              <div className="space-y-3">
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
                      setUpdateCompanyLogo(false);
                      // If a saved company logo exists, return to "use saved" state
                      if (companyLogo) setUseCustomFlyer(false);
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
                {selectedCompany?.id && (
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={updateCompanyLogo}
                      onChange={(e) => setUpdateCompanyLogo(e.target.checked)}
                      className="mt-0.5"
                    />
                    <span>
                      Also save this as {companyName}'s new logo (use it for future events too)
                    </span>
                  </label>
                )}
              </div>
            ) : (
              <>
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
                    <p className="text-xs text-gray-400">PNG or JPG (recommended: 1200×800px or larger)</p>
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleImageSelect}
                    disabled={isSubmitting}
                    className="hidden"
                  />
                </label>
                {companyLogo && (
                  <button
                    type="button"
                    onClick={() => { setUseCustomFlyer(false); setUpdateCompanyLogo(false); }}
                    className="mt-3 text-sm font-medium text-[#1a254a] underline hover:text-[#c9a34e]"
                  >
                    ← Use {companyName}'s saved logo instead
                  </button>
                )}
              </>
            )}

            {fieldError("eventImage") && (
              <p className="mt-1 text-sm text-red-500">{fieldError("eventImage")}</p>
            )}
          </div>
        </section>
        );
      })()}

      {/* Sponsor logos — organizer perk, up to 2.
          Deliberately NOT on the event cards: those already carry a logo,
          title, two badges, org, date and location, and small sponsor marks
          there read as clutter. The detail page shows them under "Sponsored
          By", which is where someone evaluating the event actually looks. */}
      {isOrganizer && onSponsorLogoUpload && (
        <section className="mt-8 space-y-4">
          <h3 className="border-b-2 border-[#c9a34e]/30 pb-2 text-lg font-semibold text-gray-900">
            Sponsor Logos
          </h3>
          <p className="text-sm text-gray-600">
            Optional. Add up to two sponsor logos and they&apos;ll appear on your event page under
            &ldquo;Sponsored By&rdquo;. Each logo can carry an optional 1-2 sentence description below it —
            useful when a sponsor is paying for visibility, not just a logo lineup.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((slot) => {
              const existing = formData?.sponsorLogos?.[slot];
              const description = formData?.sponsorDescriptions?.[slot] || "";
              return (
                <div key={slot}>
                  <label className="text-base font-medium text-[#2D2C3C]">
                    Sponsor {slot + 1}
                  </label>
                  {existing ? (
                    <div className="mt-1 flex items-center gap-3 rounded-lg border border-gray-300 p-3">
                      <img
                        src={existing}
                        alt={`Sponsor ${slot + 1}`}
                        className="h-12 w-auto max-w-[120px] object-contain"
                      />
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          const next = [...(formData?.sponsorLogos || [])];
                          next[slot] = "";
                          updateField("sponsorLogos", next);
                          // Clear the parallel description too — a lone
                          // paragraph with no logo is worse than nothing.
                          const nextDesc = [...(formData?.sponsorDescriptions || [])];
                          nextDesc[slot] = "";
                          updateField("sponsorDescriptions", nextDesc);
                        }}
                        className="ml-auto text-sm font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label
                      className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-5 text-center transition-colors hover:border-[#c9a34e] ${
                        isSubmitting ? "pointer-events-none opacity-60" : ""
                      }`}
                    >
                      <span className="text-sm text-gray-600">
                        <span className="font-semibold">Click to upload</span> a logo
                      </span>
                      <span className="mt-1 text-xs text-gray-400">PNG or JPG</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={isSubmitting}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onSponsorLogoUpload(file, slot);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                  {/*
                    Description only offered once a logo is present. A
                    textarea sitting under an empty upload zone reads as
                    "start typing here" and confuses the primary action.
                    Amy 2026-07-31: 1-2 sentence limit is enforced by the
                    280-char cap; the copy uses "1-2 sentences" so the
                    guidance sits next to the field rather than in a
                    validation message.
                  */}
                  {existing && (
                    <div className="mt-2">
                      <label className="text-xs font-medium text-gray-600">
                        Description <span className="font-normal text-gray-400">(optional, 1-2 sentences)</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => {
                          const next = [...(formData?.sponsorDescriptions || [])];
                          next[slot] = e.target.value;
                          updateField("sponsorDescriptions", next);
                        }}
                        rows={2}
                        maxLength={280}
                        placeholder="e.g. National sponsor of the CFO Alliance. HR & payroll technology built for private-equity backed growth."
                        className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:border-[#c9a34e] focus:outline-none"
                      />
                      <div className="mt-1 flex justify-end text-[11px] text-gray-500">
                        {description.length}/280
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={imageCropper.isOpen}
        imageSrc={imageCropper.imageSrc}
        onCropComplete={handleCropComplete}
        onCancel={imageCropper.closeCropper}
        onError={onImageError}
        // null = keep the whole image (resolves to the source's own ratio).
        // Was a forced 1440/650, which made anyone uploading a portrait flyer
        // throw away roughly two thirds of it before it ever reached the site.
        // Banner is still one click away via the shape presets.
        aspect={null}
        allowAspectToggle
        cropWidth={1440}
        cropHeight={650}
        // Decouple SOURCE image minimums from the OUTPUT crop size so
        // typical 400–1000px org logos aren't rejected as "too small."
        // Matches the file-select minWidth/minHeight passed to the hook
        // above. Smaller images scale up at crop time — slightly lossy
        // for tiny inputs, but Ola/Mich would rather have something
        // visible than nothing.
        minWidth={400}
        minHeight={200}
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
