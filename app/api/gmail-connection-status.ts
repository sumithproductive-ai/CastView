import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireEntitledAgency } from "./_auth";
import {
  createServiceRoleClient,
  getValidAccessToken,
  type EmailConnectionRow,
} from "./_gmailAuth";

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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
    console.error("[gmail-connection-status] query failed:", error.message);
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
