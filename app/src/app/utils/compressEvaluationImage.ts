export type CompressedEvaluationImage = {
  data: string;
  mediaType: string;
};

const MAX_WIDTH = 768;
const JPEG_QUALITY = 0.7;

/** Stay under Vercel serverless request body limits (~4.5MB). */
export const MAX_EVALUATION_PAYLOAD_BYTES = 3_500_000;

function parseDataUrl(dataUrl: string): { data: string; mediaType: string } | null {
  if (!dataUrl.startsWith('data:')) return null;
  const parts = dataUrl.split(',');
  if (parts.length < 2) return null;
  const mediaType =
    parts[0].replace('data:', '').replace(';base64', '') || 'image/jpeg';
  return { data: parts[1], mediaType };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function canvasToCompressedJpeg(canvas: HTMLCanvasElement): CompressedEvaluationImage | null {
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) return null;
  return { data: parsed.data, mediaType: 'image/jpeg' };
}

async function compressLoadedImage(img: HTMLImageElement): Promise<CompressedEvaluationImage | null> {
  const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, width, height);
  return canvasToCompressedJpeg(canvas);
}

export function logCompressedImageSizesInDev(
  images: CompressedEvaluationImage[],
  label: string,
): void {
  if (!import.meta.env.DEV) return;

  images.forEach((img, index) => {
    const bytes = Math.ceil((img.data.length * 3) / 4);
    console.log(
      `[CastView] ${label} image ${index + 1}: ${(bytes / 1024).toFixed(1)} KB (${img.mediaType})`,
    );
  });

  const totalBytes = images.reduce(
    (sum, img) => sum + Math.ceil((img.data.length * 3) / 4),
    0,
  );
  console.log(
    `[CastView] ${label} total compressed payload (images only): ${(totalBytes / 1024).toFixed(1)} KB`,
  );
}

export function getEvaluationPayloadByteSize(body: unknown): number {
  return new TextEncoder().encode(JSON.stringify(body)).length;
}

export async function compressImageUrlForEvaluation(
  url: string,
): Promise<CompressedEvaluationImage | null> {
  if (!url) return null;

  try {
    if (url.startsWith('data:')) {
      const img = await loadImage(url);
      return compressLoadedImage(img);
    }

    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    try {
      const img = await loadImage(objectUrl);
      return compressLoadedImage(img);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}
