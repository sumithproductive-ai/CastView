import type { IncomingMessage, ServerResponse } from "http";
import { requireEntitledAgency } from "./_auth";

type PathwayRequestBody = {
  prospectName?: string;
  context?: string;
  alignmentScore?: number;
  agentNote?: string;
};

type PathwaySection = {
  label: string;
  items: string[];
};

type PathwayResponseBody = {
  sections: PathwaySection[];
  summary: string;
};

type AnthropicMessagesResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { type?: string; message?: string };
};

const MAX_REQUEST_BYTES = 4_500_000;
const ANTHROPIC_FETCH_TIMEOUT_MS = 45_000;
const MAX_OUTPUT_TOKENS = 1200;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

function logEvent(event: string, details: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      service: "castview-api-pathway",
      event,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  );
}

function normalizeBody(body: unknown): PathwayRequestBody {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as PathwayRequestBody;
    } catch {
      return {};
    }
  }
  if (typeof body === "object") {
    return body as PathwayRequestBody;
  }
  return {};
}

function estimatePayloadSize(body: unknown): number {
  try {
    return JSON.stringify(body ?? {}).length;
  } catch {
    return 0;
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizePathwaySection(entry: unknown): PathwaySection | null {
  if (!entry || typeof entry !== "object") return null;

  const raw = entry as Record<string, unknown>;
  const label =
    typeof raw.label === "string" && raw.label.trim() ? raw.label.trim() : null;
  if (!label) return null;

  const items = asStringArray(raw.items).filter((item) => item.trim().length > 0);
  if (items.length === 0) return null;

  return { label, items };
}

function normalizePathwayResponse(parsed: Record<string, unknown>): PathwayResponseBody | null {
  const summary =
    typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : null;
  if (!summary) return null;

  if (!Array.isArray(parsed.sections)) return null;

  const sections = parsed.sections
    .map((entry) => normalizePathwaySection(entry))
    .filter((entry): entry is PathwaySection => entry !== null);

  if (sections.length === 0) return null;

  return { sections, summary };
}

function extractJsonText(text: string): string {
  const withoutFences = text.replace(/```json|```/gi, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start >= 0 && end >= 0) return withoutFences.slice(start, end + 1);
  return withoutFences;
}

function parseModelOutput(text: string): PathwayResponseBody | null {
  const jsonText = extractJsonText(text);
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;
  return normalizePathwayResponse(parsed);
}

function finish(
  requestStartMs: number,
  body: Record<string, unknown>,
  status: number,
  res: ServerResponse & { status: (code: number) => any; json: (body: unknown) => void },
): void {
  const totalDurationMs = Date.now() - requestStartMs;
  console.log("[API] total backend duration ms:", totalDurationMs, { status });
  logEvent("request_finished", { status, totalDurationMs });
  res.status(status).json(body);
}

export default async function handler(
  req: IncomingMessage & { body?: unknown; method?: string },
  res: ServerResponse & {
    status: (code: number) => any;
    json: (body: unknown) => void;
  },
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const requestStartMs = Date.now();
  console.log("[API] request received");
  console.log("[API] provider: Anthropic");

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();

  logEvent("environment_checked", {
    provider: "Anthropic",
    hasAnthropicApiKey: Boolean(anthropicApiKey),
    model: ANTHROPIC_MODEL,
  });

  if (!anthropicApiKey) {
    finish(requestStartMs, { error: "Missing ANTHROPIC_API_KEY" }, 500, res);
    return;
  }

  const entitlement = await requireEntitledAgency(req);
  if (entitlement.ok === false) {
    const { status, error } = entitlement;
    finish(requestStartMs, { error }, status, res);
    return;
  }

  const rawBody: unknown = req.body;

  if (rawBody === undefined || rawBody === null || rawBody === "") {
    console.error("[API] request body missing or empty");
    finish(requestStartMs, { error: "Invalid JSON request body." }, 400, res);
    return;
  }

  console.log("[API] parsing body");
  const body = normalizeBody(rawBody);
  const payloadBytes = estimatePayloadSize(body);

  logEvent("request_body_parsed", {
    bodyKeys: Object.keys(body),
    payloadBytes,
    payloadKb: Math.round(payloadBytes / 1024),
  });

  if (payloadBytes > MAX_REQUEST_BYTES) {
    finish(
      requestStartMs,
      { error: "Request payload too large." },
      413,
      res,
    );
    return;
  }

  const prospectName =
    typeof body.prospectName === "string" && body.prospectName.trim()
      ? body.prospectName.trim()
      : "";
  const context =
    typeof body.context === "string" && body.context.trim()
      ? body.context.trim()
      : "";
  const alignmentScore = Number(body.alignmentScore);
  const agentNote =
    typeof body.agentNote === "string" ? body.agentNote.trim() : "";

  if (!prospectName) {
    finish(requestStartMs, { error: "Missing prospectName." }, 400, res);
    return;
  }

  if (!context) {
    finish(requestStartMs, { error: "Missing context." }, 400, res);
    return;
  }

  if (!Number.isFinite(alignmentScore) || alignmentScore < 0 || alignmentScore > 100) {
    finish(
      requestStartMs,
      { error: "alignmentScore must be a number between 0 and 100." },
      400,
      res,
    );
    return;
  }

  if (typeof body.agentNote !== "string") {
    finish(requestStartMs, { error: "Missing agentNote." }, 400, res);
    return;
  }

  console.log("[API] pathway request", {
    context,
    alignmentScore,
    agentNoteLength: agentNote.length,
    payloadBytes,
    payloadKb: Math.round(payloadBytes / 1024),
  });

  const prompt = `You are an expert modeling agency director. A booker has evaluated ${prospectName} for the "${context}" market and received an alignment score of ${alignmentScore}/100.

Booker's note: "${agentNote}"

Generate a detailed, actionable development pathway. Return ONLY valid JSON:
{
  "sections": [
    {
      "label": "IMMEDIATE FOCUS",
      "items": ["action 1", "action 2", "action 3"]
    },
    {
      "label": "PHYSICAL DEVELOPMENT", 
      "items": ["action 1", "action 2", "action 3"]
    },
    {
      "label": "PORTFOLIO DIRECTION",
      "items": ["action 1", "action 2", "action 3"]
    },
    {
      "label": "MARKET APPROACH",
      "items": ["action 1", "action 2", "action 3"]
    },
    {
      "label": "TIMELINE",
      "items": ["milestone 1", "milestone 2", "milestone 3"]
    }
  ],
  "summary": "One paragraph summary of the development strategy."
}

Make every item specific to the ${context} market and the score of ${alignmentScore}. 
Low scores need foundational work. High scores need refinement and market positioning.
Return ONLY the JSON.`;

  const anthropicRequestBody = {
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    messages: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }],
      },
    ],
  };

  const anthropicPayloadBytes = estimatePayloadSize(anthropicRequestBody);
  const abortController = new AbortController();
  const abortTimeoutId = setTimeout(() => {
    console.log("[API] Anthropic fetch aborted");
    abortController.abort();
  }, ANTHROPIC_FETCH_TIMEOUT_MS);

  let anthropicResponse: Response;

  try {
    console.log("[API] Anthropic request start", {
      model: ANTHROPIC_MODEL,
      context,
      alignmentScore,
      payloadBytes,
      payloadKb: Math.round(anthropicPayloadBytes / 1024),
      maxTokens: MAX_OUTPUT_TOKENS,
      fetchTimeoutMs: ANTHROPIC_FETCH_TIMEOUT_MS,
    });

    logEvent("anthropic_request_start", {
      model: ANTHROPIC_MODEL,
      context,
      alignmentScore,
      payloadBytes,
      payloadKb: Math.round(anthropicPayloadBytes / 1024),
      maxTokens: MAX_OUTPUT_TOKENS,
    });

    anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicRequestBody),
      signal: abortController.signal,
    });
  } catch (fetchError) {
    clearTimeout(abortTimeoutId);
    const message =
      fetchError instanceof Error ? fetchError.message : "unknown";
    const isAbort =
      fetchError instanceof Error &&
      (fetchError.name === "AbortError" || message.toLowerCase().includes("abort"));

    console.error("[API] Anthropic fetch error:", {
      message,
      isAbort,
      name: fetchError instanceof Error ? fetchError.name : "unknown",
    });
    logEvent("anthropic_fetch_error", { message, isAbort });

    finish(
      requestStartMs,
      {
        error: isAbort
          ? "Anthropic request timed out."
          : "Anthropic fetch failed.",
        detail: message,
      },
      isAbort ? 504 : 502,
      res,
    );
    return;
  } finally {
    clearTimeout(abortTimeoutId);
  }

  console.log("[API] Anthropic response status:", anthropicResponse.status);

  logEvent("anthropic_response_received", {
    status: anthropicResponse.status,
    ok: anthropicResponse.ok,
    durationMs: Date.now() - requestStartMs,
  });

  if (!anthropicResponse.ok) {
    let errorBody = "";
    try {
      errorBody = await anthropicResponse.text();
    } catch {
      errorBody = "";
    }

    console.error("Anthropic failed:", {
      status: anthropicResponse.status,
      body: errorBody.slice(0, 1500),
    });
    logEvent("anthropic_request_failed", {
      status: anthropicResponse.status,
      errorBody: errorBody.slice(0, 1500),
    });

    if (anthropicResponse.status === 413) {
      finish(
        requestStartMs,
        { error: "Request payload too large." },
        413,
        res,
      );
      return;
    }

    finish(
      requestStartMs,
      {
        error: "Anthropic API request failed.",
        status: anthropicResponse.status,
        detail: errorBody.slice(0, 1500),
      },
      502,
      res,
    );
    return;
  }

  let anthropicData: AnthropicMessagesResponse;
  try {
    console.log("[API] parsing Anthropic json");
    anthropicData = (await anthropicResponse.json()) as AnthropicMessagesResponse;
  } catch (parseError) {
    const parseMessage =
      parseError instanceof Error ? parseError.message : "unknown";
    console.error("[API] Anthropic envelope JSON.parse failed:", {
      parseError: parseMessage,
    });
    logEvent("anthropic_envelope_parse_failed", {
      parseError: parseMessage,
    });
    finish(
      requestStartMs,
      { error: "Invalid JSON envelope from Anthropic API.", detail: parseMessage },
      502,
      res,
    );
    return;
  }

  console.log(
    "[API] Anthropic response preview:",
    JSON.stringify(anthropicData).slice(0, 1000),
  );

  const responseText =
    typeof anthropicData.content?.[0]?.text === "string"
      ? anthropicData.content[0].text
      : "";

  console.log(
    "[API] Anthropic model text preview:",
    responseText.slice(0, 1000),
  );

  let pathway: PathwayResponseBody | null;
  try {
    pathway = parseModelOutput(responseText);
  } catch (parseError) {
    const parseMessage =
      parseError instanceof Error ? parseError.message : "unknown";
    console.error("[API] pathway JSON.parse failed:", {
      parseError: parseMessage,
      rawTextPreview: responseText.slice(0, 1500),
    });
    logEvent("anthropic_response_parse_failed", {
      responsePreview: responseText.slice(0, 1500),
      parseError: parseMessage,
    });
    finish(
      requestStartMs,
      {
        error: "Invalid pathway JSON from Anthropic API.",
        detail: parseMessage,
      },
      502,
      res,
    );
    return;
  }

  if (!pathway) {
    logEvent("anthropic_response_invalid_shape", {
      responsePreview: responseText.slice(0, 1500),
    });
    finish(
      requestStartMs,
      { error: "Invalid pathway payload from Anthropic API." },
      502,
      res,
    );
    return;
  }

  logEvent("pathway_success", {
    context,
    alignmentScore,
    sectionCount: pathway.sections.length,
    durationMs: Date.now() - requestStartMs,
  });

  console.log("[API] returning success response", {
    context,
    alignmentScore,
    sectionCount: pathway.sections.length,
  });

  finish(requestStartMs, pathway as unknown as Record<string, unknown>, 200, res);
}
