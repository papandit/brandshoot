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

/**
 * Share a single image. Tries, in order:
 *   1. Native file share (Web Share API with files) — best on mobile.
 *   2. Native link share (Web Share API with url).
 *   3. Copy the link to the clipboard.
 * Returns 'shared' | 'copied' | 'cancelled'.
 */
export async function shareImage(uri, filename) {
  const fullUrl = getFullUrl(uri);

  // 1. Try sharing the actual image file (richest experience).
  try {
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      const response = await fetch(fullUrl, { cache: 'no-store' });
      const blob = await response.blob();
      const file = new File([blob], filename || `creation_${Date.now()}.png`, {
        type: blob.type || 'image/png',
      });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My BrandShoot creation' });
        return 'shared';
      }
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
    // fall through to link-based sharing
  }

  // 2. Share just the link, or 3. copy it.
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ title: 'My BrandShoot creation', url: fullUrl });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
    // fall through to clipboard
  }

  await navigator.clipboard.writeText(fullUrl);
  return 'copied';
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
