// Web equivalents of the mobile utils (imageToBase64.ts / downloadImage.ts)
import { getFullUrl } from '../config';

/** Convert a File object (from <input type="file">) to a base64 data string */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Convert an image URL (remote or local) to a base64 data string */
export async function imageUrlToBase64(url) {
  // cache: 'no-store' — don't reuse <img>-cached responses that lack CORS headers
  const response = await fetch(getFullUrl(url), { cache: 'no-store' });
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Download a single image to the user's computer */
export async function downloadImage(uri, filename) {
  const response = await fetch(getFullUrl(uri), { cache: 'no-store' });
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `image_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Download multiple images sequentially, reporting progress */
export async function downloadMultipleImages(imageData, onProgress) {
  let completed = 0;
  for (const item of imageData) {
    try {
      await downloadImage(item.uri, item.filename);
    } catch (e) {
      console.error('Download failed:', item.filename, e);
    }
    completed += 1;
    if (onProgress) onProgress(completed, imageData.length);
  }
}
