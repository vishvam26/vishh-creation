import { SITE_CONFIG } from "./config";

export interface CompressionResult {
  dataUrl: string;
  fileSizeMB: number;
  width: number;
  height: number;
}

/**
 * Validates file size (max 5MB) and compresses image to optimized base64 data URL
 */
export async function validateAndCompressImage(file: File): Promise<CompressionResult> {
  const maxBytes = SITE_CONFIG.maxUploadSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the maximum allowed limit of ${SITE_CONFIG.maxUploadSizeMB}MB.`);
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type. Please upload an image file (JPG, PNG, WebP).");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Could not initialize image canvas."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compress as JPEG at 0.85 quality
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const approxBytes = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          fileSizeMB: parseFloat((approxBytes / (1024 * 1024)).toFixed(2)),
          width,
          height,
        });
      };
      img.onerror = () => reject(new Error("Failed to load image."));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}
