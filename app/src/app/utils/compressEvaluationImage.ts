export type CompressedEvaluationImage = {
  data: string;
  mediaType: string;
};

const MAX_WIDTH = 384;
const JPEG_QUALITY = 0.45;

/** Stay under Vercel serverless request body limits (~4.5MB). */
export const MAX_EVALUATION_PAYLOAD_BYTES = 1_500_000;

export const EVALUATION_REQUEST_TIMEOUT_MS = 45_000;

function stripBase64Payload(value: string): string {
  if (!value) return '';
  if (value.startsWith('data:')) {
    const parts = value.split(',');
    return parts[1] || '';
  }
  return value;
}

function parseDataUrl(dataUrl: string): { data: string; mediaType: string } | null {
  if (!dataUrl.startsWith('data:')) return null;
  const parts = dataUrl.split(',');
  if (parts.length < 2) return null;
  const mediaType =
    parts[0].replace('data:', '').replace(';base64', '') || 'image/jpeg';
  return { data: stripBase64Payload(parts[1]), mediaType };
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
  if (!parsed || !parsed.data) return null;
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

export type EvaluateFetchResult = {
  ok: boolean;
  status: number;
  data?: { contextEvaluations?: Array<{ context: string; alignmentScore: number; fitLabel: string; reasoning: string; strengths: string[]; risks: string[]; marketSignals: string[]; suggestedNextSteps: string[] }> };
  errorBody?: string;
};

/**
 * POST /api/evaluate with AbortController so timeouts cancel the underlying fetch.
 */
export async function fetchEvaluateContext(
  requestBody: {
    prospectName: string;
    selectedContexts: string[];
    images: CompressedEvaluationImage[];
  },
  timeoutMs: number = EVALUATION_REQUEST_TIMEOUT_MS,
): Promise<EvaluateFetchResult> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        errorBody = '';
      }
      return { ok: false, status: response.status, errorBody };
    }

    let data: EvaluateFetchResult['data'];
    try {
      data = await response.json();
    } catch {
      return { ok: false, status: response.status, errorBody: 'invalid_json' };
    }

    return { ok: true, status: response.status, data };
  } catch (error) {
    window.clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('EVALUATION_TIMEOUT');
    }
    throw error;
  }
}
