import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { OAuth2Client } from "google-auth-library";
import { encryptToken } from "./_emailCrypto";

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const SETTINGS_URL = "https://app.castview.org/settings";

function verifyState(
  state: string,
): { agencyId: string; userId: string } | null {
  const secret = process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
  if (!secret) return null;

  const [stateEncoded, signature] = state.split(".");
  if (!stateEncoded || !signature) return null;

  const expectedSignature = createHmac("sha256", secret)
    .update(stateEncoded)
    .digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(stateEncoded, "base64url").toString("utf8"),
    ) as { agencyId?: string; userId?: string };
    if (!payload.agencyId || !payload.userId) return null;
    return { agencyId: payload.agencyId, userId: payload.userId };
  } catch {
    return null;
  }
}

async function fetchGmailLabels(accessToken: string): Promise<string[]> {
  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/labels",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) return [];
  const data = (await response.json()) as {
    labels?: Array<{ name?: string; type?: string }>;
  };
  return (data.labels ?? [])
    .filter((l) => l.type === "user" && l.name)
    .map((l) => l.name as string);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const { code, state, error: oauthError } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  if (oauthError) {
    return res.redirect(
      302,
      `${SETTINGS_URL}?gmail_connect=error&reason=${encodeURIComponent(oauthError)}`,
    );
  }

  if (!code || !state) {
    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=missing_params`);
  }

  const verified = verifyState(state);
  if (!verified) {
    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=invalid_state`);
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("[gmail-oauth-callback] missing Google OAuth env vars");
    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=not_configured`);
  }

  try {
    const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      // refresh_token is only returned on first consent (access_type=offline +
      // prompt=consent, both set on the authorize URL) — if it's missing here,
      // the agency needs to fully revoke access in their Google account and
      // reconnect, since Google won't re-issue it on a repeat consent.
      console.error("[gmail-oauth-callback] incomplete token response", {
        hasAccessToken: Boolean(tokens.access_token),
        hasRefreshToken: Boolean(tokens.refresh_token),
      });
      return res.redirect(
        302,
        `${SETTINGS_URL}?gmail_connect=error&reason=incomplete_grant`,
      );
    }

    const labels = await fetchGmailLabels(tokens.access_token);

    const { error: upsertError } = await supabaseAdmin
      .from("email_connections")
      .upsert(
        {
          agency_id: verified.agencyId,
          label_name: labels[0] ?? "",
          access_token_enc: encryptToken(tokens.access_token),
          refresh_token_enc: encryptToken(tokens.refresh_token),
          token_expires_at: new Date(tokens.expiry_date).toISOString(),
          status: "active",
          connected_by: verified.userId,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "agency_id" },
      );

    if (upsertError) {
      console.error("[gmail-oauth-callback] upsert failed:", upsertError.message);
      return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=save_failed`);
    }

    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=success`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[gmail-oauth-callback] token exchange failed:", message);
    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=exchange_failed`);
  }
}
