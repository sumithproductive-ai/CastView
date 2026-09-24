import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { getValidAccessToken, type EmailConnectionRow } from "../_gmailAuth";

// Sprint 2 of the email intake agent: daily cron (Vercel Hobby caps crons at
// once/day) that turns labeled Gmail messages into PENDING_REVIEW prospect
// drafts. No UI reads these yet — that's Sprint 3. Verify via direct
// Supabase queries after a manual trigger.
//
// Per-agency and per-message failures are isolated (one bad email/agency
// must not stop the batch), matching the pattern already used in
// trial-reminders.ts.

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";
const MAX_EMAILS_PER_AGENCY_PER_RUN = 15;
const DRAFT_STATUS_COLOR = "#5d7d8a";

type GmailHeader = { name?: string; value?: string };
type GmailPart = {
  mimeType?: string;
  filename?: string;
  headers?: GmailHeader[];
  body?: { attachmentId?: string; data?: string; size?: number };
  parts?: GmailPart[];
};
type GmailMessage = {
  id: string;
  payload?: GmailPart;
  internalDate?: string;
};

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function decodeBase64UrlToBuffer(data: string): Buffer {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function headerValue(headers: GmailHeader[] | undefined, name: string): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function parseFromEmail(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return (match?.[1] ?? fromHeader).trim().toLowerCase();
}

type Attachment = { attachmentId: string; filename: string; mimeType: string };

/** Walks the (possibly nested) MIME part tree for body text + image attachments. */
function walkParts(
  part: GmailPart | undefined,
  acc: { bodyText: string; bodyHtml: string; attachments: Attachment[] },
): void {
  if (!part) return;

  if (part.filename && part.body?.attachmentId && part.mimeType?.startsWith("image/")) {
    acc.attachments.push({
      attachmentId: part.body.attachmentId,
      filename: part.filename,
      mimeType: part.mimeType,
    });
  } else if (part.mimeType === "text/plain" && part.body?.data && !acc.bodyText) {
    acc.bodyText = decodeBase64Url(part.body.data);
  } else if (part.mimeType === "text/html" && part.body?.data && !acc.bodyHtml) {
    acc.bodyHtml = decodeBase64Url(part.body.data);
  }

  for (const child of part.parts ?? []) {
    walkParts(child, acc);
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function listLabeledMessageIds(
  accessToken: string,
  labelName: string,
  sinceUnixSeconds: number | null,
): Promise<string[]> {
  const q = sinceUnixSeconds
    ? `label:"${labelName}" after:${sinceUnixSeconds}`
    : `label:"${labelName}"`;
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?${new URLSearchParams({
    q,
    maxResults: String(MAX_EMAILS_PER_AGENCY_PER_RUN),
  })}`;

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`messages.list failed: ${response.status}`);
  const data = (await response.json()) as { messages?: Array<{ id: string }> };
  return (data.messages ?? []).map((m) => m.id);
}

async function getMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) throw new Error(`messages.get failed: ${response.status}`);
  return (await response.json()) as GmailMessage;
}

async function getAttachmentBytes(
  accessToken: string,
  messageId: string,
  attachmentId: string,
): Promise<Buffer> {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!response.ok) throw new Error(`attachments.get failed: ${response.status}`);
  const data = (await response.json()) as { data?: string };
  if (!data.data) throw new Error("attachment response missing data");
  return decodeBase64UrlToBuffer(data.data);
}

type ExtractedAngleGuess = { index: number; suggestedAngle: string; confidence: number };
type ExtractionResult = {
  name: string;
  measurements: { height?: string; bust?: string; waist?: string; hips?: string; shoe?: string; hair?: string };
  imageGuesses: ExtractedAngleGuess[];
  notes: string;
};

async function extractProspectData(
  bodyText: string,
  images: Array<{ mediaType: string; data: string }>,
): Promise<ExtractionResult | null> {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!anthropicApiKey) {
    console.error("[email-intake] missing ANTHROPIC_API_KEY");
    return null;
  }

  const prompt = `You are a casting assistant extracting a new-face model submission from an email for a booking agency. Read the email body and look at the attached images.

Email body:
"""
${bodyText.slice(0, 4000)}
"""

Return ONLY valid JSON in exactly this shape:
{
  "name": "the prospect's full name as stated, or empty string if not found",
  "measurements": {
    "height": "as stated (e.g. 177cm), empty string if not mentioned",
    "bust": "", "waist": "", "hips": "", "shoe": "", "hair": ""
  },
  "images": [
    { "index": 0, "suggestedAngle": "front" | "profile" | "threeQuarter" | "fullBody" | "unknown", "confidence": <0-1> }
  ],
  "notes": "one sentence: anything notable an agent should know (e.g. 'no measurements stated', 'photos appear to be a full body set')"
}
"images" must have exactly one entry per attached image, in the same order they were attached, index starting at 0. Guess the angle from what's visible — a close-up face shot is likely "front" or "profile", a waist-up 3/4 turn is "threeQuarter", a head-to-toe shot is "fullBody". If you cannot tell, use "unknown" with low confidence.
No preamble, no markdown fences.`;

  const imageBlocks = images.map((img) => ({
    type: "image" as const,
    source: { type: "base64" as const, media_type: img.mediaType, data: img.data },
  }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 800,
      messages: [{ role: "user", content: [...imageBlocks, { type: "text", text: prompt }] }],
    }),
  });

  if (!response.ok) {
    console.error("[email-intake] extraction call failed:", response.status, await response.text().catch(() => ""));
    return null;
  }

  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  const text = data.content?.[0]?.text ?? "";
  const withoutFences = text.replace(/```json|```/gi, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start < 0 || end < 0) return null;

  try {
    const parsed = JSON.parse(withoutFences.slice(start, end + 1)) as {
      name?: string;
      measurements?: Record<string, string>;
      images?: ExtractedAngleGuess[];
      notes?: string;
    };
    return {
      name: parsed.name?.trim() || "New Submission",
      measurements: parsed.measurements ?? {},
      imageGuesses: Array.isArray(parsed.images) ? parsed.images : [],
      notes: parsed.notes?.trim() ?? "",
    };
  } catch {
    return null;
  }
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

async function findPossibleDuplicate(
  agencyId: string,
  name: string,
  senderEmail: string,
): Promise<string | null> {
  const normalized = normalizeName(name);
  const { data } = await supabaseAdmin
    .from("prospects")
    .select("id, name, email")
    .eq("agency_id", agencyId)
    .limit(200);

  for (const row of data ?? []) {
    if (row.email && senderEmail && row.email.toLowerCase() === senderEmail) return row.id;
    if (row.name && normalizeName(row.name) === normalized && normalized.length > 0) return row.id;
  }
  return null;
}

/** Uploads a digital image buffer directly to Storage — server-side
 * equivalent of the browser-only uploadDigitalImage in lib/supabase.ts
 * (that helper needs a data: URL and calls atob/Blob, neither usable
 * the same way from a cron). Same bucket/path convention. */
async function uploadDigitalBuffer(
  buffer: Buffer,
  path: string,
  contentType: string,
): Promise<string | null> {
  const { error } = await supabaseAdmin.storage
    .from("digitals")
    .upload(path, buffer, { upsert: true, contentType });
  if (error) {
    console.error("[email-intake] storage upload failed:", path, error.message);
    return null;
  }
  return path;
}

const ANGLE_TO_COLUMN: Record<string, "front" | "profile" | "three_quarter" | "full_body"> = {
  front: "front",
  profile: "profile",
  threeQuarter: "three_quarter",
  fullBody: "full_body",
};

async function processMessage(
  connection: EmailConnectionRow,
  accessToken: string,
  messageId: string,
): Promise<"created" | "skipped_duplicate_message" | "failed"> {
  const message = await getMessage(accessToken, messageId);
  const acc = { bodyText: "", bodyHtml: "", attachments: [] as Attachment[] };
  walkParts(message.payload, acc);

  const bodyText = acc.bodyText || stripHtml(acc.bodyHtml) || "(empty message)";
  const fromHeader = headerValue(message.payload?.headers, "From");
  const senderEmail = parseFromEmail(fromHeader);

  const imageAttachments = acc.attachments.slice(0, 4); // front/profile/3-4/full-body at most
  const downloadedImages: Array<{ mediaType: string; data: string; filename: string }> = [];
  for (const att of imageAttachments) {
    try {
      const bytes = await getAttachmentBytes(accessToken, messageId, att.attachmentId);
      downloadedImages.push({
        mediaType: att.mimeType,
        data: bytes.toString("base64"),
        filename: att.filename,
      });
    } catch (err) {
      console.error("[email-intake] attachment download failed:", messageId, att.filename, err);
    }
  }

  const extraction = await extractProspectData(bodyText, downloadedImages);
  if (!extraction) {
    console.error("[email-intake] extraction failed for message:", messageId);
    return "failed";
  }

  const duplicateOf = await findPossibleDuplicate(connection.agency_id, extraction.name, senderEmail);

  const prospectId = crypto.randomUUID();
  const digitalSetId = crypto.randomUUID();

  const digitalColumns: Record<string, string> = {};
  for (let i = 0; i < downloadedImages.length; i++) {
    const guess = extraction.imageGuesses.find((g) => g.index === i);
    const column = guess ? ANGLE_TO_COLUMN[guess.suggestedAngle] : undefined;
    const ext = downloadedImages[i].mediaType === "image/png" ? "png" : "jpg";
    const path = `prospects/${prospectId}/${digitalSetId}/${column ?? `unassigned_${i}`}.${ext}`;
    const buffer = Buffer.from(downloadedImages[i].data, "base64");
    const uploaded = await uploadDigitalBuffer(buffer, path, downloadedImages[i].mediaType);
    if (uploaded && column) {
      digitalColumns[column] = uploaded;
    }
  }

  const { error: prospectError } = await supabaseAdmin.from("prospects").upsert(
    {
      id: prospectId,
      agency_id: connection.agency_id,
      name: extraction.name,
      status: "PENDING_REVIEW",
      status_color: DRAFT_STATUS_COLOR,
      source: "EMAIL",
      email: senderEmail,
      height: extraction.measurements.height ?? "",
      bust: extraction.measurements.bust ?? "",
      waist: extraction.measurements.waist ?? "",
      hips: extraction.measurements.hips ?? "",
      shoe: extraction.measurements.shoe ?? "",
      hair: extraction.measurements.hair ?? "",
      notes: extraction.notes,
      markets: [],
      source_email_message_id: messageId,
      source_email_connection_id: connection.id,
      possible_duplicate_of: duplicateOf,
    },
    { onConflict: "agency_id,source_email_message_id" },
  );

  if (prospectError) {
    console.error("[email-intake] prospect upsert failed:", messageId, prospectError.message);
    return "failed";
  }

  if (Object.keys(digitalColumns).length > 0) {
    const { error: digitalSetError } = await supabaseAdmin.from("digital_sets").upsert({
      id: digitalSetId,
      entity_id: prospectId,
      entity_type: "prospect",
      agency_id: connection.agency_id,
      title: "Email submission",
      uploaded_at: new Date().toISOString(),
      front: digitalColumns.front ?? null,
      profile: digitalColumns.profile ?? null,
      three_quarter: digitalColumns.three_quarter ?? null,
      full_body: digitalColumns.full_body ?? null,
      notes: "AI-suggested angles — verify in review queue.",
      tags: ["email-intake"],
    });
    if (digitalSetError) {
      console.error("[email-intake] digital_sets upsert failed:", messageId, digitalSetError.message);
    }
  }

  return "created";
}

async function processConnection(connection: EmailConnectionRow): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;

  if (!connection.label_name) return { processed, failed };

  const tokenResult = await getValidAccessToken(supabaseAdmin, connection);
  if (!tokenResult.ok) {
    console.error("[email-intake] skipping connection, token invalid:", connection.agency_id, tokenResult.reason);
    return { processed, failed };
  }

  const sinceUnixSeconds = connection.last_synced_at
    ? Math.floor(new Date(connection.last_synced_at).getTime() / 1000)
    : null;

  const messageIds = await listLabeledMessageIds(tokenResult.accessToken, connection.label_name, sinceUnixSeconds);

  for (const messageId of messageIds) {
    try {
      const result = await processMessage(connection, tokenResult.accessToken, messageId);
      if (result === "created") processed++;
      else if (result === "failed") failed++;
    } catch (err) {
      failed++;
      console.error("[email-intake] message processing threw:", connection.agency_id, messageId, err);
    }
  }

  await supabaseAdmin
    .from("email_connections")
    .update({ last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", connection.id);

  return { processed, failed };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: connections, error } = await supabaseAdmin
    .from("email_connections")
    .select(
      "id, agency_id, label_name, access_token_enc, refresh_token_enc, token_expires_at, last_synced_at, status",
    )
    .eq("status", "active");

  if (error) {
    console.error("[email-intake] failed to list connections:", error.message);
    return res.status(500).json({ error: "Failed to list connections" });
  }

  let totalProcessed = 0;
  let totalFailed = 0;
  let agenciesFailed = 0;

  for (const connection of (connections ?? []) as EmailConnectionRow[]) {
    try {
      const { processed, failed } = await processConnection(connection);
      totalProcessed += processed;
      totalFailed += failed;
    } catch (err) {
      agenciesFailed++;
      console.error("[email-intake] connection processing threw:", connection.agency_id, err);
    }
  }

  return res.status(200).json({
    connectionsChecked: connections?.length ?? 0,
    prospectsCreated: totalProcessed,
    messagesFailed: totalFailed,
    agenciesFailed,
  });
}
