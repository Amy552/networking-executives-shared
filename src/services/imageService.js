/**
 * Image Service
 *
 * Provides image compression and Firebase Storage upload functionality.
 * Consolidated from implementations in both networking-executives and admin projects.
 *
 * IMPORTANT: This service requires Firebase Storage to be initialized in the consuming app.
 * Pass the Storage instance to initializeImageService() before using other functions.
 */

// Firebase Storage instance - must be set via initializeImageService
let storage = null;
let storageFunctions = null;

/**
 * Compression options for different use cases
 */
export const COMPRESSION_PRESETS = {
  // Event images - good quality, reasonable size
  event: {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.8,
  },
  // Thumbnails - small size
  thumbnail: {
    maxSizeMB: 0.2,
    maxWidthOrHeight: 400,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.7,
  },
  // Profile/logo images
  profile: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.8,
  },
  // High quality (for important images)
  highQuality: {
    maxSizeMB: 2,
    maxWidthOrHeight: 2400,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.9,
  },
};

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
];

/**
 * Maximum file size before compression (10MB)
 */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

/**
 * Initialize the image service with Firebase Storage instance
 * Must be called before using any other functions
 *
 * @param {Object} storageInstance - Firebase Storage instance
 * @param {Object} functions - Storage functions (ref, uploadBytes, getDownloadURL, etc.)
 */
export function initializeImageService(storageInstance, functions) {
  storage = storageInstance;
  storageFunctions = functions;
}

/**
 * Check if the service is initialized
 */
function ensureInitialized() {
  if (!storage || !storageFunctions) {
    throw new Error(
      "Image service not initialized. Call initializeImageService(storage, functions) first."
    );
  }
}

/**
 * Validate image file
 *
 * @param {File} file - File to validate
 * @returns {{valid: boolean, error: string|null}} Validation result
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
    };
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Compress an image file
 *
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options (or preset name)
 * @returns {Promise<File>} Compressed file
 */
export async function compressImage(file, options = "event") {
  // Get compression options (preset or custom)
  const compressionOptions =
    typeof options === "string" ? COMPRESSION_PRESETS[options] : options;

  if (!compressionOptions) {
    throw new Error(`Unknown compression preset: ${options}`);
  }

  // Dynamically import browser-image-compression
  const imageCompression = await import("browser-image-compression").then(
    (m) => m.default
  );

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    return compressedFile;
  } catch (error) {
    console.error("Error compressing image:", error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Generate a unique filename for upload
 *
 * @param {string} originalName - Original filename
 * @param {string} prefix - Optional prefix (e.g., 'event', 'profile')
 * @returns {string} Unique filename
 */
export function generateUniqueFilename(originalName, prefix = "") {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop() || "jpg";
  const sanitizedPrefix = prefix ? `${prefix}_` : "";

  return `${sanitizedPrefix}${timestamp}_${randomStr}.${extension}`;
}

/**
 * Upload result structure
 * @typedef {Object} UploadResult
 * @property {boolean} success - Whether upload succeeded
 * @property {string} url - Download URL of uploaded image
 * @property {string} path - Storage path of uploaded image
 * @property {string} error - Error message if failed
 */

/**
 * Upload an image to Firebase Storage
 *
 * @param {File} file - Image file to upload
 * @param {Object} options - Upload options
 * @param {string} options.path - Storage path (e.g., 'events', 'profiles')
 * @param {string} options.filename - Custom filename (optional, auto-generated if not provided)
 * @param {string|Object} options.compression - Compression preset or options (default: 'event')
 * @param {boolean} options.skipCompression - Skip compression (default: false)
 * @param {Function} options.onProgress - Progress callback (receives 0-100)
 * @returns {Promise<UploadResult>} Upload result
 */
export async function uploadImage(file, options = {}) {
  ensureInitialized();

  const {
    path = "events",
    filename = null,
    compression = "event",
    skipCompression = false,
    onProgress = null,
  } = options;

  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, url: null, path: null, error: validation.error };
    }

    // Compress if not skipped
    let fileToUpload = file;
    if (!skipCompression) {
      fileToUpload = await compressImage(file, compression);
    }

    // Generate filename
    const finalFilename = filename || generateUniqueFilename(file.name, path);
    const storagePath = `${path}/${finalFilename}`;

    // Create storage reference
    const storageRef = storageFunctions.ref(storage, storagePath);

    // Upload with progress tracking
    const uploadTask = storageFunctions.uploadBytesResumable(
      storageRef,
      fileToUpload
    );

    // Return promise that resolves when upload completes
    return new Promise((resolve) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress callback
          if (onProgress) {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(Math.round(progress));
          }
        },
        (error) => {
          // Error
          console.error("Upload error:", error);
          resolve({ success: false, url: null, path: null, error: error.message });
        },
        async () => {
          // Success - get download URL
          try {
            const downloadURL = await storageFunctions.getDownloadURL(
              uploadTask.snapshot.ref
            );
            resolve({
              success: true,
              url: downloadURL,
              path: storagePath,
              error: null,
            });
          } catch (error) {
            resolve({
              success: false,
              url: null,
              path: storagePath,
              error: error.message,
            });
          }
        }
      );
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, url: null, path: null, error: error.message };
  }
}

/**
 * Upload image with simple interface (no progress tracking)
 * Uses uploadBytes instead of uploadBytesResumable for simpler setup
 *
 * @param {File} file - Image file to upload
 * @param {string} path - Storage path
 * @param {Object} options - Upload options
 * @param {string} options.compression - Compression preset
 * @param {boolean} options.skipCompression - Skip compression
 * @returns {Promise<string|null>} Download URL or null if failed
 */
export async function uploadImageSimple(file, path = "events", options = {}) {
  ensureInitialized();

  try {
    const { compression = "event", skipCompression = false } = options;

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.error("Image validation failed:", validation.error);
      return null;
    }

    // Compress if not skipped
    let fileToUpload = file;
    if (!skipCompression) {
      fileToUpload = await compressImage(file, compression);
    }

    // Generate filename
    const finalFilename = generateUniqueFilename(file.name, path);
    const storagePath = `${path}/${finalFilename}`;

    // Create storage reference
    const storageRef = storageFunctions.ref(storage, storagePath);

    // Upload using simple uploadBytes (no progress tracking needed)
    await storageFunctions.uploadBytes(storageRef, fileToUpload);

    // Get download URL
    const downloadURL = await storageFunctions.getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

/**
 * Delete an image from Firebase Storage
 *
 * @param {string} pathOrUrl - Storage path or download URL
 * @returns {Promise<{success: boolean, error: string|null}>} Result
 */
export async function deleteImage(pathOrUrl) {
  ensureInitialized();

  try {
    // If it's a URL, extract the path
    let storagePath = pathOrUrl;
    if (pathOrUrl.startsWith("http")) {
      // Extract path from Firebase Storage URL
      const match = pathOrUrl.match(/\/o\/(.+?)\?/);
      if (match) {
        storagePath = decodeURIComponent(match[1]);
      } else {
        return { success: false, error: "Could not extract path from URL" };
      }
    }

    const storageRef = storageFunctions.ref(storage, storagePath);
    await storageFunctions.deleteObject(storageRef);

    return { success: true, error: null };
  } catch (error) {
    console.error("Error deleting image:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get image dimensions from a File
 *
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export async function getImageDimensions(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Create a preview URL for an image file
 *
 * @param {File} file - Image file
 * @returns {string} Object URL for preview
 */
export function createImagePreview(file) {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 *
 * @param {string} previewUrl - Preview URL from createImagePreview
 */
export function revokeImagePreview(previewUrl) {
  URL.revokeObjectURL(previewUrl);
}

export default {
  initializeImageService,
  COMPRESSION_PRESETS,
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE,
  validateImageFile,
  compressImage,
  generateUniqueFilename,
  uploadImage,
  uploadImageSimple,
  deleteImage,
  getImageDimensions,
  createImagePreview,
  revokeImagePreview,
};
