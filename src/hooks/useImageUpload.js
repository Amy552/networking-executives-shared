import { useState, useCallback } from "react";
import {
  validateImageFile,
  compressImage,
  createImagePreview,
  revokeImagePreview,
  COMPRESSION_PRESETS,
} from "../services/imageService.js";

/**
 * useImageUpload Hook
 *
 * Provides image upload functionality with compression, preview, and progress tracking.
 * Note: Actual upload to Firebase requires imageService to be initialized.
 *
 * @param {Object} options - Hook options
 * @param {string} options.compression - Compression preset ('event', 'thumbnail', 'profile', 'highQuality')
 * @param {Function} options.onUpload - Upload function (receives compressed file, returns URL)
 * @param {Function} options.onSuccess - Callback when upload succeeds
 * @param {Function} options.onError - Callback when upload fails
 * @returns {Object} Image upload state and functions
 */
export function useImageUpload(options = {}) {
  const {
    compression = "event",
    onUpload = null,
    onSuccess = null,
    onError = null,
  } = options;

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  /**
   * Handle file selection
   */
  const selectFile = useCallback(
    async (file) => {
      // Clear previous state
      if (previewUrl) {
        revokeImagePreview(previewUrl);
      }
      setError(null);
      setUploadProgress(0);

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error);
        if (onError) onError(validation.error);
        return false;
      }

      // Create preview
      const preview = createImagePreview(file);
      setPreviewUrl(preview);
      setSelectedFile(file);

      return true;
    },
    [previewUrl, onError]
  );

  /**
   * Handle file input change event
   */
  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        return selectFile(file);
      }
      return false;
    },
    [selectFile]
  );

  /**
   * Compress the selected file
   */
  const compress = useCallback(async () => {
    if (!selectedFile) {
      setError("No file selected");
      return null;
    }

    setIsCompressing(true);
    setError(null);

    try {
      const compressed = await compressImage(selectedFile, compression);
      setIsCompressing(false);
      return compressed;
    } catch (err) {
      setIsCompressing(false);
      const errorMsg = err.message || "Compression failed";
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return null;
    }
  }, [selectedFile, compression, onError]);

  /**
   * Upload the selected file (compresses first)
   */
  const upload = useCallback(async () => {
    if (!selectedFile) {
      setError("No file selected");
      return null;
    }

    if (!onUpload) {
      setError("No upload handler provided");
      return null;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Compress first
      setIsCompressing(true);
      const compressed = await compressImage(selectedFile, compression);
      setIsCompressing(false);

      // Upload
      const result = await onUpload(compressed, {
        onProgress: setUploadProgress,
      });

      if (result && (result.url || typeof result === "string")) {
        const url = result.url || result;
        setUploadedUrl(url);
        setIsUploading(false);
        setUploadProgress(100);
        if (onSuccess) onSuccess(url);
        return url;
      } else {
        throw new Error(result?.error || "Upload failed");
      }
    } catch (err) {
      setIsUploading(false);
      setIsCompressing(false);
      const errorMsg = err.message || "Upload failed";
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return null;
    }
  }, [selectedFile, compression, onUpload, onSuccess, onError]);

  /**
   * Clear all state
   */
  const clear = useCallback(() => {
    if (previewUrl) {
      revokeImagePreview(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setIsCompressing(false);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  }, [previewUrl]);

  /**
   * Set an existing image URL (for editing)
   */
  const setExistingImage = useCallback((url) => {
    setUploadedUrl(url);
    setPreviewUrl(url);
  }, []);

  /**
   * Remove the current image
   */
  const removeImage = useCallback(() => {
    if (previewUrl && previewUrl !== uploadedUrl) {
      revokeImagePreview(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedUrl(null);
    setUploadProgress(0);
  }, [previewUrl, uploadedUrl]);

  // Get the display URL (preview or uploaded)
  const displayUrl = previewUrl || uploadedUrl;
  const hasImage = displayUrl !== null;
  const isProcessing = isCompressing || isUploading;

  return {
    // State
    selectedFile,
    previewUrl,
    uploadedUrl,
    displayUrl,
    hasImage,
    isCompressing,
    isUploading,
    isProcessing,
    uploadProgress,
    error,

    // Functions
    selectFile,
    handleFileChange,
    compress,
    upload,
    clear,
    setExistingImage,
    removeImage,

    // Constants
    compressionPresets: COMPRESSION_PRESETS,
  };
}

export default useImageUpload;
