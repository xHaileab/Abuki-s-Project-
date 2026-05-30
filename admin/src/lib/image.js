/**
 * Turn a user-selected File into a compact base64 data URL for upload.
 *
 * Small images (QR codes, logos, icons) pass through untouched so they stay
 * pixel-crisp. Larger photos are downscaled on a canvas and re-encoded as
 * JPEG, keeping the payload comfortably under the backend's size cap and
 * Firestore's per-document limit.
 */

const PASSTHROUGH_MAX_BYTES = 500 * 1024;
const MAX_DIM = 1280;
const JPEG_QUALITY = 0.72;

export async function fileToUploadDataUrl(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  const original = await readAsDataUrl(file);
  if (file.size <= PASSTHROUGH_MAX_BYTES) return original;

  const img = await loadImage(original);
  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  // White matte so transparent PNGs don't go black when flattened to JPEG.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load that image.'));
    img.src = src;
  });
}
