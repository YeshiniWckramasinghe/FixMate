import client from '../api/client';

// The backend returns thumbnail links like "/api/services/3/thumbnail?v=123".
// An <img> needs the full address, so put the backend's base URL in front.
export function imageUrl(path) {
  if (!path) return '';
  if (/^https?:/i.test(path)) return path;
  return `${client.defaults.baseURL || ''}${path}`;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be read as an image.'));
    };
    img.src = url;
  });
}

// Shrinks a picture in the browser before it is uploaded, so a 6 MB phone photo
// becomes a ~100 KB JPEG. Returns a Blob.
export async function resizeImage(file, maxSide = 800, quality = 0.85) {
  const img = await loadImage(file);
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff'; // JPEG has no transparency
  context.fillRect(0, 0, width, height);
  context.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('That image could not be processed.'))),
      'image/jpeg',
      quality
    );
  });
}