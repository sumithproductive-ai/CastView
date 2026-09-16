import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireEntitledAgency } from "./_auth";
import { createServiceRoleClient } from "./_gmailAuth";

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

  const body = (req.body ?? {}) as { labelName?: unknown };
  const labelName =
    typeof body.labelName === "string" ? body.labelName.trim() : "";

  if (!labelName) {
    return res.status(400).json({ error: "Missing labelName" });
  }

  const supabaseAdmin = createServiceRoleClient();
  const { error } = await supabaseAdmin
    .from("email_connections")
    .update({ label_name: labelName, updated_at: new Date().toISOString() })
    .eq("agency_id", entitlement.auth.agencyId);

  if (error) {
    console.error("[gmail-set-label] update failed:", error.message);
    return res.status(500).json({ error: "Failed to update label" });
  }

  return res.status(200).json({ ok: true });
}
