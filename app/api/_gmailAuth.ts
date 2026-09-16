import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { OAuth2Client } from "google-auth-library";
import { decryptToken, encryptToken } from "./_emailCrypto";

export type EmailConnectionRow = {
  id: string;
  agency_id: string;
  label_name: string;
  access_token_enc: string;
  refresh_token_enc: string;
  token_expires_at: string;
  last_synced_at: string | null;
  status: "active" | "needs_reauth" | "disconnected";
};

const REFRESH_MARGIN_MS = 5 * 60 * 1000; // refresh if expiring within 5 min

function oauthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Google OAuth env vars");
  }
  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

export type ValidAccessTokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: "needs_reauth" | "no_connection" | "error" };

/**
 * Returns a valid (non-expired) access token for the agency's Gmail
 * connection, refreshing and persisting it first if it's near expiry.
 * Under Testing-mode publishing, Google expires refresh tokens after ~7
 * days — that failure surfaces here as `needs_reauth`, which the caller
 * should treat as an expected, recurring state, not an exceptional one.
 */
export async function getValidAccessToken(
  supabaseAdmin: SupabaseClient,
  connection: EmailConnectionRow,
): Promise<ValidAccessTokenResult> {
  const expiresAt = new Date(connection.token_expires_at).getTime();
  const needsRefresh = expiresAt - Date.now() < REFRESH_MARGIN_MS;

  if (!needsRefresh) {
    return { ok: true, accessToken: decryptToken(connection.access_token_enc) };
  }

  try {
    const client = oauthClient();
    client.setCredentials({
      refresh_token: decryptToken(connection.refresh_token_enc),
    });
    const { credentials } = await client.refreshAccessToken();

    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error("Refresh response missing access_token/expiry_date");
    }

    await supabaseAdmin
      .from("email_connections")
      .update({
        access_token_enc: encryptToken(credentials.access_token),
        token_expires_at: new Date(credentials.expiry_date).toISOString(),
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    return { ok: true, accessToken: credentials.access_token };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    const isAuthError =
      message.includes("invalid_grant") || message.includes("invalid_token");

    console.error("[gmailAuth] refresh failed:", {
      connectionId: connection.id,
      agencyId: connection.agency_id,
      message,
      isAuthError,
    });

    if (isAuthError) {
      await supabaseAdmin
        .from("email_connections")
        .update({ status: "needs_reauth", updated_at: new Date().toISOString() })
        .eq("id", connection.id);
      return { ok: false, reason: "needs_reauth" };
    }

    return { ok: false, reason: "error" };
  }
}

export function createServiceRoleClient(): SupabaseClient {
  return createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
