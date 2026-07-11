const MAX_INPUT_BYTES = 5 * 1024 * 1024;
export const PHOTO_CROP_VIEW_SIZE = 280;
export const PHOTO_OUTPUT_SIZE = 320;
const JPEG_QUALITY = 0.82;

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export function validatePhotoFile(file: File): void {
  if (!ACCEPTED_TYPES.has(file.type) && !file.type.startsWith('image/')) {
    throw new Error('Please choose a JPG, PNG, or WebP image.');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error('Image must be under 5 MB.');
  }
}

export function createPhotoObjectUrl(file: File): string {
  validatePhotoFile(file);
  return URL.createObjectURL(file);
}

export function revokePhotoObjectUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

export function computeCoverTransform(
  imageWidth: number,
  imageHeight: number,
  viewSize: number
): { scale: number; scaledWidth: number; scaledHeight: number } {
  const scale = Math.max(viewSize / imageWidth, viewSize / imageHeight);
  return {
    scale,
    scaledWidth: imageWidth * scale,
    scaledHeight: imageHeight * scale,
  };
}

export function getCenteredPhotoOffset(
  scaledWidth: number,
  scaledHeight: number,
  viewSize: number
): { offsetX: number; offsetY: number } {
  return {
    offsetX: (viewSize - scaledWidth) / 2,
    offsetY: (viewSize - scaledHeight) / 2,
  };
}

export function clampPhotoOffset(
  offsetX: number,
  offsetY: number,
  scaledWidth: number,
  scaledHeight: number,
  viewSize: number
): { offsetX: number; offsetY: number } {
  const minX = viewSize - scaledWidth;
  const minY = viewSize - scaledHeight;
  return {
    offsetX: Math.min(0, Math.max(minX, offsetX)),
    offsetY: Math.min(0, Math.max(minY, offsetY)),
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load member photo.'));
    image.src = src;
  });
}

export async function exportMemberPhoto(
  src: string,
  offsetX: number,
  offsetY: number,
  viewSize = PHOTO_CROP_VIEW_SIZE
): Promise<string> {
  const image = await loadImage(src);
  const { scale } = computeCoverTransform(image.width, image.height, viewSize);

  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_OUTPUT_SIZE;
  canvas.height = PHOTO_OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not process the image.');
  }

  const sourceX = -offsetX / scale;
  const sourceY = -offsetY / scale;
  const sourceSize = viewSize / scale;

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    PHOTO_OUTPUT_SIZE,
    PHOTO_OUTPUT_SIZE
  );

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

/** @deprecated Use exportMemberPhoto after crop adjustment */
export async function processMemberPhoto(file: File): Promise<string> {
  const src = createPhotoObjectUrl(file);
  try {
    const image = await loadImage(src);
    const { scaledWidth, scaledHeight } = computeCoverTransform(
      image.width,
      image.height,
      PHOTO_CROP_VIEW_SIZE
    );
    const { offsetX, offsetY } = getCenteredPhotoOffset(scaledWidth, scaledHeight, PHOTO_CROP_VIEW_SIZE);
    return exportMemberPhoto(src, offsetX, offsetY, PHOTO_CROP_VIEW_SIZE);
  } finally {
    revokePhotoObjectUrl(src);
  }
}

export async function drawCircularMemberPhoto(
  ctx: CanvasRenderingContext2D,
  photoUrl: string,
  centerX: number,
  centerY: number,
  radius: number
): Promise<void> {
  const image = await loadImage(photoUrl);
  const diameter = radius * 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, centerX - radius, centerY - radius, diameter, diameter);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();
}

export function isCameraSupported(): boolean {
  return Boolean(
    typeof navigator !== 'undefined' &&
      navigator.mediaDevices?.getUserMedia &&
      typeof window !== 'undefined' &&
      window.isSecureContext
  );
}

export async function capturePhotoFromCameraStream(
  video: HTMLVideoElement
): Promise<string> {
  if (!video.videoWidth || !video.videoHeight) {
    throw new Error('Camera is not ready yet. Please wait a moment.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not capture photo from camera.');
  }

  ctx.drawImage(video, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92)
  );

  if (!blob) {
    throw new Error('Could not capture photo from camera.');
  }

  return URL.createObjectURL(blob);
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  stream?.getTracks().forEach((track) => track.stop());
}
