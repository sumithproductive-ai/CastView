import { createClient } from '@supabase/supabase-js';
import type { DigitalSet } from '../app/types/talent';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const DIGITALS_BUCKET = 'digitals';
const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 3600;

/** Extract storage object path from a public URL, signed URL, or raw path. */
export function extractDigitalStoragePath(stored: string): string | null {
  if (!stored || stored.startsWith('data:')) return null;
  if (!stored.startsWith('http')) return stored.replace(/^\//, '');

  const markers = [
    '/object/sign/digitals/',
    '/object/public/digitals/',
    '/storage/v1/object/public/digitals/',
    '/storage/v1/object/sign/digitals/',
    '/digitals/',
  ];

  for (const marker of markers) {
    const index = stored.indexOf(marker);
    if (index >= 0) {
      return stored.slice(index + marker.length).split('?')[0] ?? null;
    }
  }

  return null;
}

/** Normalize a DB value to a storage path before persisting (never store signed/public URLs). */
export function storagePathForPersist(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith('data:')) return value;
  return extractDigitalStoragePath(value) ?? value;
}

/**
 * Uploads a base64 data URL to the private "digitals" bucket and returns the storage path.
 */
export async function uploadDigitalImage(
  base64DataUrl: string,
  path: string,
): Promise<string | null> {
  if (!base64DataUrl || !base64DataUrl.startsWith('data:')) return null;

  const [header, data] = base64DataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg';

  const byteChars = atob(data);
  const byteNums = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNums[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([byteNums], { type: mimeType });

  const ext = mimeType.split('/')[1]?.split('+')[0] ?? 'jpg';
  const fullPath = `${path}.${ext}`;

  const { error } = await supabase.storage
    .from(DIGITALS_BUCKET)
    .upload(fullPath, blob, { upsert: true, contentType: mimeType });

  if (error) {
    console.error('[CastView] uploadDigitalImage error:', error);
    return null;
  }

  return fullPath;
}

export async function getSignedDigitalUrl(
  path: string,
  expiresInSeconds = DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
): Promise<string | null> {
  const storagePath = extractDigitalStoragePath(path) ?? path;
  if (!storagePath) return null;

  const { data, error } = await supabase.storage
    .from(DIGITALS_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);

  if (error) {
    console.error('[CastView] getSignedDigitalUrl error:', error);
    return null;
  }

  return data?.signedUrl ?? null;
}

export async function getSignedDigitalUrls(
  paths: string[],
  expiresInSeconds = DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  if (paths.length === 0) return result;

  const uniquePaths = [...new Set(paths.map((p) => extractDigitalStoragePath(p) ?? p).filter(Boolean))];

  const { data, error } = await supabase.storage
    .from(DIGITALS_BUCKET)
    .createSignedUrls(uniquePaths, expiresInSeconds);

  if (error) {
    console.error('[CastView] getSignedDigitalUrls error:', error);
    uniquePaths.forEach((p) => result.set(p, null));
    return result;
  }

  for (const item of data ?? []) {
    const key = item.path ?? '';
    result.set(key, item.signedUrl ?? null);
    for (const original of paths) {
      if ((extractDigitalStoragePath(original) ?? original) === key) {
        result.set(original, item.signedUrl ?? null);
      }
    }
  }

  return result;
}

/** Resolve a stored path or legacy URL to a displayable src (signed URL or data: URL). */
export async function resolveDigitalImageForDisplay(
  stored: string | null | undefined,
): Promise<string | null> {
  if (!stored) return null;
  if (stored.startsWith('data:')) return stored;

  const path = extractDigitalStoragePath(stored);
  if (path) {
    const signed = await getSignedDigitalUrl(path);
    if (signed) return signed;
  }

  if (stored.startsWith('http')) {
    return stored;
  }

  return null;
}

export async function resolveDigitalSetForDisplay(ds: DigitalSet): Promise<DigitalSet> {
  const refs = [ds.front, ds.profile, ds.threeQuarter, ds.fullBody].filter(
    (v): v is string => Boolean(v),
  );
  const signed = await getSignedDigitalUrls(refs);

  const resolveField = (value: string | null | undefined) => {
    if (!value) return null;
    if (value.startsWith('data:')) return value;
    return signed.get(value) ?? signed.get(extractDigitalStoragePath(value) ?? '') ?? null;
  };

  return {
    ...ds,
    front: resolveField(ds.front),
    profile: resolveField(ds.profile),
    threeQuarter: resolveField(ds.threeQuarter),
    fullBody: resolveField(ds.fullBody),
  };
}
