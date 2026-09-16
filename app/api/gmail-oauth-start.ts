import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, randomBytes } from "crypto";
import { OAuth2Client } from "google-auth-library";
import { requireEntitledAgency } from "./_auth";

const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

function signState(payload: string): string {
  const secret = process.env.EMAIL_TOKEN_ENCRYPTION_KEY;
  if (!secret) throw new Error("Missing EMAIL_TOKEN_ENCRYPTION_KEY");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const entitlement = await requireEntitledAgency(req);
  if (entitlement.ok === false) {
    return res
      .status(entitlement.status)
      .json({ error: entitlement.error, reason: entitlement.reason });
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("[gmail-oauth-start] missing Google OAuth env vars");
    return res.status(500).json({ error: "Gmail connect is not configured" });
  }

  const { agencyId, userId } = entitlement.auth;
  const nonce = randomBytes(9).toString("base64url");
  const statePayload = JSON.stringify({ agencyId, userId, nonce });
  const stateEncoded = Buffer.from(statePayload).toString("base64url");
  const signature = signState(stateEncoded);
  const state = `${stateEncoded}.${signature}`;

  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
  const authorizeUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [GMAIL_SCOPE],
    state,
  });

  return res.status(200).json({ authorizeUrl });
}
