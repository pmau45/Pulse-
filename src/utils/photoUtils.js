/**
 * Utilities for compressing and handling images before storing in localStorage.
 */

const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const QUALITY = 0.7;

/**
 * Compress an image File to a base64 data URL using the Canvas API.
 * Resizes to at most MAX_WIDTH × MAX_HEIGHT, then encodes as JPEG at QUALITY.
 *
 * @param {File} file - The image file to compress.
 * @returns {Promise<string>} Resolves with a base64 data URL string.
 */
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', QUALITY));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Estimate the size in bytes of a base64-encoded data URL.
 *
 * @param {string} dataUrl - A base64 data URL.
 * @returns {number} Approximate byte size.
 */
export function estimateBase64Size(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  return Math.round((base64.length * 3) / 4);
}
