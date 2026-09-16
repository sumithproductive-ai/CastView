import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { OAuth2Client } from "google-auth-library";
import { requireEntitledAgency } from "../_auth";
import { encryptToken } from "../_emailCrypto";
import {
  createServiceRoleClient,
  getValidAccessToken,
  type EmailConnectionRow,
} from "../_gmailAuth";

// Single catch-all serverless function for every Gmail-intake route
// (/api/gmail/oauth-start, /oauth-callback, /status, /set-label,
// /disconnect) — consolidated into one file deliberately, not for
// style: Vercel Hobby caps a deployment at 12 serverless functions,
// this project is already at that cap, and 5 separate route files
// would have pushed it to 17. See PR discussion for the alternative
// (upgrade to Pro) if more routes are needed later.

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const SETTINGS_URL = "https://app.castview.org/settings";

function oauthEnv() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
}

function signState(payload: string): string {
  const secret = process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("Missing EMAIL_TOKEN_ENCRYPTION_KEY");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

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

// ---- oauth-start: POST, session-authenticated, returns { authorizeUrl } ----
async function handleOauthStart(req: VercelRequest, res: VercelResponse) {
  const entitlement = await requireEntitledAgency(req);
  if (entitlement.ok === false) {
    return res
      .status(entitlement.status)
      .json({ error: entitlement.error, reason: entitlement.reason });
  }

  const env = oauthEnv();
  if (!env) {
    console.error("[gmail/oauth-start] missing Google OAuth env vars");
    return res.status(500).json({ error: "Gmail connect is not configured" });
  }

  const { agencyId, userId } = entitlement.auth;
  const nonce = randomBytes(9).toString("base64url");
  const statePayload = JSON.stringify({ agencyId, userId, nonce });
  const stateEncoded = Buffer.from(statePayload).toString("base64url");
  const state = `${stateEncoded}.${signState(stateEncoded)}`;

  const oauth2Client = new OAuth2Client(env.clientId, env.clientSecret, env.redirectUri);
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GMAIL_SCOPE],
    state,
  });

  return res.status(200).json({ authorizeUrl });
}

// ---- oauth-callback: GET, public redirect target from Google ----
async function handleOauthCallback(req: VercelRequest, res: VercelResponse) {
  const { code, state, error: oauthError } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  if (oauthError) {
    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=${encodeURIComponent(oauthError)}`);
  }
  if (!code || !state) {
    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=missing_params`);
  }

  const verified = verifyState(state);
  if (!verified) {
    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=invalid_state`);
  }

  const env = oauthEnv();
  if (!env) {
    console.error("[gmail/oauth-callback] missing Google OAuth env vars");
    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=not_configured`);
  }

  try {
    const oauth2Client = new OAuth2Client(env.clientId, env.clientSecret, env.redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      console.error("[gmail/oauth-callback] incomplete token response", {
        hasAccessToken: Boolean(tokens.access_token),
        hasRefreshToken: Boolean(tokens.refresh_token),
      });
      return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=incomplete_grant`);
    }

    const labels = await fetchGmailLabels(tokens.access_token);
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

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
      console.error("[gmail/oauth-callback] upsert failed:", upsertError.message);
      return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=save_failed`);
    }

    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=success`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[gmail/oauth-callback] token exchange failed:", message);
    return res.redirect(302, `${SETTINGS_URL}?gmail_connect=error&reason=exchange_failed`);
  }
}

// ---- status: GET, session-authenticated ----
async function handleStatus(req: VercelRequest, res: VercelResponse) {
  const entitlement = await requireEntitledAgency(req);
  if (entitlement.ok === false) {
    return res
      .status(entitlement.status)
      .json({ error: entitlement.error, reason: entitlement.reason });
  }

  const supabaseAdmin = createServiceRoleClient();
  const { data: connection, error } = await supabaseAdmin
    .from("email_connections")
    .select(
      "id, agency_id, label_name, access_token_enc, refresh_token_enc, token_expires_at, last_synced_at, status",
    )
    .eq("agency_id", entitlement.auth.agencyId)
    .maybeSingle<EmailConnectionRow>();

  if (error) {
    console.error("[gmail/status] query failed:", error.message);
    return res.status(500).json({ error: "Failed to load connection status" });
  }

  if (!connection || connection.status === "disconnected") {
    return res.status(200).json({ connected: false });
  }

  if (connection.status === "needs_reauth") {
    return res.status(200).json({
      connected: true,
      status: "needs_reauth",
      labelName: connection.label_name,
      lastSyncedAt: connection.last_synced_at,
    });
  }

  const tokenResult = await getValidAccessToken(supabaseAdmin, connection);
  if (!tokenResult.ok) {
    return res.status(200).json({
      connected: true,
      status: tokenResult.reason === "needs_reauth" ? "needs_reauth" : "error",
      labelName: connection.label_name,
      lastSyncedAt: connection.last_synced_at,
    });
  }

  const availableLabels = await fetchGmailLabels(tokenResult.accessToken);

  return res.status(200).json({
    connected: true,
    status: "active",
    labelName: connection.label_name,
    lastSyncedAt: connection.last_synced_at,
    availableLabels,
  });
}

// ---- set-label: POST, session-authenticated ----
async function handleSetLabel(req: VercelRequest, res: VercelResponse) {
  const entitlement = await requireEntitledAgency(req);
  if (entitlement.ok === false) {
    return res
      .status(entitlement.status)
      .json({ error: entitlement.error, reason: entitlement.reason });
  }

  const body = (req.body ?? {}) as { labelName?: unknown };
  const labelName = typeof body.labelName === "string" ? body.labelName.trim() : "";
  if (!labelName) {
    return res.status(400).json({ error: "Missing labelName" });
  }

  const supabaseAdmin = createServiceRoleClient();
  const { error } = await supabaseAdmin
    .from("email_connections")
    .update({ label_name: labelName, updated_at: new Date().toISOString() })
    .eq("agency_id", entitlement.auth.agencyId);

  if (error) {
    console.error("[gmail/set-label] update failed:", error.message);
    return res.status(500).json({ error: "Failed to update label" });
  }

  return res.status(200).json({ ok: true });
}

// ---- disconnect: POST, session-authenticated ----
async function handleDisconnect(req: VercelRequest, res: VercelResponse) {
  const entitlement = await requireEntitledAgency(req);
  if (entitlement.ok === false) {
    return res
      .status(entitlement.status)
      .json({ error: entitlement.error, reason: entitlement.reason });
  }

  const supabaseAdmin = createServiceRoleClient();
  const { error } = await supabaseAdmin
    .from("email_connections")
    .update({ status: "disconnected", updated_at: new Date().toISOString() })
    .eq("agency_id", entitlement.auth.agencyId);

  if (error) {
    console.error("[gmail/disconnect] update failed:", error.message);
    return res.status(500).json({ error: "Failed to disconnect" });
  }

  return res.status(200).json({ ok: true });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const actionParam = req.query.action;
  const action = Array.isArray(actionParam) ? actionParam[0] : actionParam;

  if (action === "oauth-start" && req.method === "POST") {
    return handleOauthStart(req, res);
  }
  if (action === "oauth-callback" && req.method === "GET") {
    return handleOauthCallback(req, res);
  }
  if (action === "status" && req.method === "GET") {
    return handleStatus(req, res);
  }
  if (action === "set-label" && req.method === "POST") {
    return handleSetLabel(req, res);
  }
  if (action === "disconnect" && req.method === "POST") {
    return handleDisconnect(req, res);
  }

  return res.status(404).json({ error: "Not found" });
}
