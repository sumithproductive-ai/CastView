import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a base64 data URL to Supabase Storage and returns the public URL.
 * Bucket: "digitals" — must exist in Supabase with public access enabled.
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
    .from('digitals')
    .upload(fullPath, blob, { upsert: true, contentType: mimeType });

  if (error) {
    console.error('[CastView] uploadDigitalImage error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('digitals')
    .getPublicUrl(fullPath);

  return urlData?.publicUrl ?? null;
}
