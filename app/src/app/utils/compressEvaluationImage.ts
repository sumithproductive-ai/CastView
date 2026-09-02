import {
  buildApiAuthHeaders,
  handlePaymentRequired,
  requireAuthSession,
  SESSION_EXPIRED_MESSAGE,
} from '../../lib/apiAuth';
import { resolveDigitalImageForDisplay } from '../../lib/supabase';

export type CompressedEvaluationImage = {
  data: string;
  mediaType: string;
};

const MAX_WIDTH = 384;
const JPEG_QUALITY = 0.45;

/** Stay under Vercel serverless request body limits (~4.5MB). */
export const MAX_EVALUATION_PAYLOAD_BYTES = 1_500_000;

export const EVALUATION_REQUEST_TIMEOUT_MS = 55_000;

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

function loadImage(src: string, useCors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCors) {
      img.crossOrigin = 'anonymous';
    }
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

async function compressRemoteImage(url: string): Promise<CompressedEvaluationImage | null> {
  try {
    const img = await loadImage(url, true);
    return compressLoadedImage(img);
  } catch {
    // Fall back to fetch when canvas CORS is unavailable.
  }

  const response = await fetch(url);
  if (!response.ok) return null;

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = await loadImage(objectUrl);
    return compressLoadedImage(img);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function resolveImageSourceForCompression(
  stored: string,
): Promise<string | null> {
  if (stored.startsWith('data:') || stored.startsWith('blob:')) {
    return stored;
  }

  if (stored.startsWith('http://') || stored.startsWith('https://')) {
    return stored;
  }

  // Storage paths like models/{id}/{setId}/front.jpeg are not fetchable as site URLs.
  const resolved = await resolveDigitalImageForDisplay(stored);
  return resolved;
}

export async function compressImageUrlForEvaluation(
  url: string,
): Promise<CompressedEvaluationImage | null> {
  if (!url) return null;

  try {
    const src = await resolveImageSourceForCompression(url);
    if (!src) return null;

    if (src.startsWith('data:') || src.startsWith('blob:')) {
      const img = await loadImage(src);
      return compressLoadedImage(img);
    }

    return await compressRemoteImage(src);
  } catch {
    return null;
  }
}

export type EvaluateFetchResult = {
  ok: boolean;
  status: number;
  data?: { contextEvaluations?: Array<{ context: string; alignmentScore: number; fitLabel: string; reasoning: string; strengths: string[]; risks: string[]; marketSignals: string[]; suggestedNextSteps: string[] }> };
  errorBody?: string;
  errorReason?: string;
  errorMessage?: string;
};

export function parseEvaluateApiError(errorBody: string): {
  error?: string;
  reason?: string;
} {
  try {
    return JSON.parse(errorBody) as { error?: string; reason?: string };
  } catch {
    return { error: errorBody || undefined };
  }
}

/**
 * POST /api/evaluate with AbortController so timeouts cancel the underlying fetch.
 */
export async function fetchEvaluateContext(
  requestBody: {
    prospectName: string;
    selectedContexts: string[];
    location?: string;
    images: CompressedEvaluationImage[];
  },
  timeoutMs: number = EVALUATION_REQUEST_TIMEOUT_MS,
): Promise<EvaluateFetchResult> {
  const context = requestBody.selectedContexts[0] ?? 'unknown';
  const requestStartedAt = new Date();
  const requestStartedAtMs = Date.now();
  const payloadBytes = getEvaluationPayloadByteSize(requestBody);
  console.log(
    `[CastView] /api/evaluate request payload: ${(payloadBytes / 1024).toFixed(1)} KB`,
    {
      context,
      imageCount: requestBody.images.length,
      timeoutMs,
      requestStartTimestamp: requestStartedAt.toISOString(),
    },
  );

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const auth = await requireAuthSession('evaluate');
    const endpoint = '/api/evaluate';

    console.log('[CastView] /api/evaluate auth preflight', {
      endpoint,
      sessionExists: auth.ok,
      accessTokenExists: auth.ok,
      userId: auth.ok ? auth.userId : null,
      authorizationAttached: auth.ok,
    });

    if (!auth.ok) {
      return { ok: false, status: 401, errorBody: SESSION_EXPIRED_MESSAGE };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: buildApiAuthHeaders(auth.accessToken),
      body: JSON.stringify({
        prospectName: requestBody.prospectName,
        selectedContexts: requestBody.selectedContexts,
        location: requestBody.location,
        images: requestBody.images.map((img) => ({
          data: stripBase64Payload(img.data),
          mediaType: 'image/jpeg',
        })),
      }),
      signal: controller.signal,
    });

    window.clearTimeout(timeoutId);
    const responseAt = new Date();
    const durationMs = Date.now() - requestStartedAtMs;
    console.log('[CastView] /api/evaluate response timestamp:', {
      context,
      responseTimestamp: responseAt.toISOString(),
      totalDurationMs: durationMs,
    });

    if (response.status === 402) {
      handlePaymentRequired();
      return { ok: false, status: 402, errorBody: 'payment_required' };
    }

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        errorBody = '';
      }
      const parsed = parseEvaluateApiError(errorBody);
      console.error(
        `[CastView] /api/evaluate FAILED — status ${response.status}, reason: ${parsed.reason ?? 'unknown'}, error: ${parsed.error ?? (errorBody.slice(0, 200) || 'none')}`,
      );
      console.error('[CastView] /api/evaluate failed details:', {
        status: response.status,
        context,
        reason: parsed.reason ?? null,
        error: parsed.error ?? null,
        body: errorBody.slice(0, 1500),
        timeoutMs,
        requestStartTimestamp: requestStartedAt.toISOString(),
        responseTimestamp: responseAt.toISOString(),
        totalDurationMs: durationMs,
      });
      return {
        ok: false,
        status: response.status,
        errorBody,
        errorReason: parsed.reason,
        errorMessage: parsed.error,
      };
    }

    let data: EvaluateFetchResult['data'];
    try {
      data = await response.json();
    } catch {
      return { ok: false, status: response.status, errorBody: 'invalid_json' };
    }

    console.log('[CastView] /api/evaluate response:', {
      context,
      data,
      timeoutMs,
      requestStartTimestamp: requestStartedAt.toISOString(),
      responseTimestamp: responseAt.toISOString(),
      totalDurationMs: durationMs,
    });

    return { ok: true, status: response.status, data };
  } catch (error) {
    window.clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      const responseAt = new Date();
      const durationMs = Date.now() - requestStartedAtMs;
      console.error(
        `context timeout: ${context}`,
        {
          timeoutMs,
          requestStartTimestamp: requestStartedAt.toISOString(),
          responseTimestamp: responseAt.toISOString(),
          totalDurationMs: durationMs,
        },
      );
      throw new Error('EVALUATION_TIMEOUT');
    }
    throw error;
  }
}
