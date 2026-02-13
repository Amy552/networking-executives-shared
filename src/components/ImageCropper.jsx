import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";

/**
 * Get cropped image from canvas
 * @param {string} imageSrc - Source image URL
 * @param {Object} pixelCrop - Crop area in pixels
 * @param {string} outputType - Output MIME type
 * @returns {Promise<File>} - Cropped image file
 */
const getCroppedImg = async (
  imageSrc,
  pixelCrop,
  {
    outputType = "image/jpeg",
    cropWidth = 1440,
    cropHeight = 650,
    outputScale = 1,
  } = {},
) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const outputWidth = cropWidth * outputScale;
  const outputHeight = cropHeight * outputScale;

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  if (outputType === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputWidth, outputHeight);
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        const extension = outputType === "image/png" ? "png" : "jpg";
        resolve(new File([blob], `cropped-image.${extension}`, { type: outputType }));
      },
      outputType,
      outputType === "image/jpeg" ? 1 : undefined
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
  onError,
  aspect = 1440 / 650,
  cropWidth = 1440,
  cropHeight = 650,
  title = "Crop Image",
  prefer2x = true,
  maxAllowedZoom = 3,
  minAllowedZoom = 0.1,
  styles = {},
}) {
  const DEFAULT_ZOOM = 1;
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [minZoom, setMinZoom] = useState(DEFAULT_ZOOM);
  const [maxZoom, setMaxZoom] = useState(maxAllowedZoom);
  const [outputScale, setOutputScale] = useState(1);
  const [sourceMimeType, setSourceMimeType] = useState("image/jpeg");
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setZoom(DEFAULT_ZOOM);
      setMinZoom(DEFAULT_ZOOM);
      setMaxZoom(maxAllowedZoom);
      setOutputScale(1);
      setCroppedAreaPixels(null);
      return;
    }

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      if (img.width < cropWidth || img.height < cropHeight) {
        onError?.(`Image is too small. Minimum size is ${cropWidth}x${cropHeight}px.`);
        onCancel?.();
        return;
      }

      const calculatedOutputScale =
        prefer2x && img.width >= cropWidth * 2 && img.height >= cropHeight * 2 ? 2 : 1;
      const outputWidth = cropWidth * calculatedOutputScale;
      const outputHeight = cropHeight * calculatedOutputScale;

      const oneToOneMaxZoom = Math.min(img.width / outputWidth, img.height / outputHeight);
      const calculatedMaxZoom = Math.max(DEFAULT_ZOOM, Math.min(maxAllowedZoom, oneToOneMaxZoom));

      const widthRatio = cropWidth / img.width;
      const heightRatio = cropHeight / img.height;
      const fitInsideZoom = Math.min(widthRatio, heightRatio);
      const calculatedMinZoom = Math.max(minAllowedZoom, Math.min(fitInsideZoom, DEFAULT_ZOOM));

      setOutputScale(calculatedOutputScale);
      setMinZoom(calculatedMinZoom);
      setMaxZoom(Math.max(calculatedMinZoom, calculatedMaxZoom));
      setZoom(DEFAULT_ZOOM);
      setCrop({ x: 0, y: 0 });

      const mimeFromDataUrl = typeof imageSrc === "string" && imageSrc.startsWith("data:image/png")
        ? "image/png"
        : "image/jpeg";
      setSourceMimeType(mimeFromDataUrl);
    };
  }, [
    isOpen,
    imageSrc,
    cropWidth,
    cropHeight,
    prefer2x,
    maxAllowedZoom,
    minAllowedZoom,
    onCancel,
  ]);

  const onCropChange = useCallback((crop) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback(
    (nextZoom) => {
      const clampedZoom = Math.min(maxZoom, Math.max(minZoom, nextZoom));
      setZoom(clampedZoom);
    },
    [minZoom, maxZoom],
  );

  const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels, {
        outputType: sourceMimeType === "image/png" ? "image/png" : "image/jpeg",
        cropWidth,
        cropHeight,
        outputScale,
      });
      onCropComplete(croppedImage);
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(DEFAULT_ZOOM);
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
            minZoom={minZoom}
            maxZoom={maxZoom}
            restrictPosition={false}
          />
        </div>

        <div className={defaultStyles.zoomContainer}>
          <label className={defaultStyles.zoomLabel}>Zoom: {zoom.toFixed(2)}x</label>
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.01}
            value={Math.min(maxZoom, Math.max(minZoom, zoom))}
            onChange={(e) => onZoomChange(Number(e.target.value))}
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
    const {
      allowedTypes = ["image/png", "image/jpeg", "image/jpg"],
      onError,
      minWidth,
      minHeight,
    } = options;
    const file = event.target.files?.[0];

    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      onError?.("Invalid file type. Please select a valid image file.");
      event.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        if (
          typeof minWidth === "number" &&
          typeof minHeight === "number" &&
          (img.width < minWidth || img.height < minHeight)
        ) {
          onError?.(`Image is too small. Minimum size is ${minWidth}x${minHeight}px.`);
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
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      onError?.("Invalid image file. Please try another image.");
      event.target.value = "";
    };
    img.src = objectUrl;
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
