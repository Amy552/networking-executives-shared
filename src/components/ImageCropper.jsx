import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

/**
 * Get cropped image from canvas
 * @param {string} imageSrc - Source image URL
 * @param {Object} pixelCrop - Crop area in pixels
 * @param {string} outputType - Output MIME type
 * @returns {Promise<File>} - Cropped image file
 */
const getCroppedImg = async (imageSrc, pixelCrop, outputType = "image/jpeg") => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const extension = outputType === "image/png" ? "png" : "jpg";
        resolve(new File([blob], `cropped-image.${extension}`, { type: outputType }));
      },
      outputType,
      0.9
    );
  });
};

/**
 * ImageCropper Component
 * Modal-based image cropper with aspect ratio support
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string} props.imageSrc - Source image to crop
 * @param {function} props.onCropComplete - Callback with cropped file
 * @param {function} props.onCancel - Callback when cancelled
 * @param {number} props.aspect - Aspect ratio (default: 1440/650 for event banners)
 * @param {string} props.title - Modal title
 * @param {Object} props.styles - Custom style overrides
 */
export function ImageCropper({
  isOpen,
  imageSrc,
  onCropComplete,
  onCancel,
  aspect = 1440 / 650,
  title = "Crop Image",
  styles = {},
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onCancel();
  };

  if (!isOpen || !imageSrc) return null;

  // Default styles that can be overridden
  const defaultStyles = {
    overlay: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50",
    modal: "w-full max-w-2xl rounded-lg bg-white p-6",
    title: "mb-4 text-xl font-semibold",
    cropperContainer: "relative h-96 w-full",
    zoomContainer: "mt-4",
    zoomLabel: "text-sm text-gray-600 mb-1",
    zoomInput: "w-full",
    buttonContainer: "mt-4 flex justify-end gap-4",
    cancelButton: "rounded-md bg-gray-300 px-4 py-2 hover:bg-gray-400 transition-colors",
    saveButton: "rounded-md bg-[#030959] px-4 py-2 text-white hover:bg-[#020847] transition-colors disabled:opacity-50",
    ...styles,
  };

  return (
    <div className={defaultStyles.overlay}>
      <div className={defaultStyles.modal}>
        <h2 className={defaultStyles.title}>{title}</h2>

        <div className={defaultStyles.cropperContainer}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
          />
        </div>

        <div className={defaultStyles.zoomContainer}>
          <label className={defaultStyles.zoomLabel}>Zoom: {zoom.toFixed(1)}x</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className={defaultStyles.zoomInput}
          />
        </div>

        <div className={defaultStyles.buttonContainer}>
          <button
            type="button"
            className={defaultStyles.cancelButton}
            onClick={handleCancel}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className={defaultStyles.saveButton}
            onClick={handleCrop}
            disabled={isProcessing || !croppedAreaPixels}
          >
            {isProcessing ? "Processing..." : "Crop & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for managing image cropper state
 * @returns {Object} Cropper state and handlers
 */
export function useImageCropper() {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  const openCropper = useCallback((src) => {
    setImageSrc(src);
    setIsOpen(true);
  }, []);

  const closeCropper = useCallback(() => {
    setIsOpen(false);
    setImageSrc(null);
  }, []);

  /**
   * Handle file input change - reads file and opens cropper
   * @param {Event} event - File input change event
   * @param {Object} options - Options
   * @param {string[]} options.allowedTypes - Allowed MIME types
   * @param {function} options.onError - Error callback
   */
  const handleFileSelect = useCallback((event, options = {}) => {
    const { allowedTypes = ["image/png", "image/jpeg", "image/jpg"], onError } = options;
    const file = event.target.files?.[0];

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      onError?.("Invalid file type. Please select a valid image file.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      openCropper(reader.result);
    };
    reader.onerror = () => {
      onError?.("Error reading file. Please try again.");
    };
    reader.readAsDataURL(file);
  }, [openCropper]);

  return {
    isOpen,
    imageSrc,
    openCropper,
    closeCropper,
    handleFileSelect,
  };
}

export default ImageCropper;
