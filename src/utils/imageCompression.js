const IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);
const MAX_WIDTH = 1200;
const MAX_COMPRESSED_SIZE = 2 * 1024 * 1024;
const MIN_QUALITY = 0.3;

function loadImage(objectUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to load image for compression'));
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Unable to compress image'));
    }, 'image/jpeg', quality);
  });
}

async function encodeWithinLimit(canvas, quality) {
  const roundedQuality = Math.round(quality * 10) / 10;
  const blob = await canvasToBlob(canvas, roundedQuality);
  if (blob.size <= MAX_COMPRESSED_SIZE || roundedQuality <= MIN_QUALITY) return blob;
  return encodeWithinLimit(canvas, roundedQuality - 0.1);
}

export async function compressImage(file, options = {}) {
  if (!IMAGE_TYPES.has(file.type)) {
    return { blob: file, originalSize: file.size, compressedSize: file.size };
  }

  const maxWidth = options.maxWidth || MAX_WIDTH;
  const initialQuality = options.quality ?? 0.7;
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    const scale = image.width > maxWidth ? maxWidth / image.width : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await encodeWithinLimit(canvas, initialQuality);
    return { blob, originalSize: file.size, compressedSize: blob.size };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default compressImage;
