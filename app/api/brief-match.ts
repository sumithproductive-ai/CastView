import type { IncomingMessage, ServerResponse } from "http";
import { requireEntitledAgency } from "./_auth";
import { checkAiQuota } from "./_aiQuota";

type BriefMatchModelInput = {
  id: string;
  name: string;
  topScore: number;
  contexts: string[];
  division: string;
};

type BriefMatchRequestBody = {
  brief?: string;
  models?: BriefMatchModelInput[];
};

type BriefMatchResult = {
  id: string;
  score: number;
  reasoning: string;
};

type BriefMatchResponseBody = {
  matches: BriefMatchResult[];
};

type AnthropicMessagesResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { type?: string; message?: string };
};

const MAX_REQUEST_BYTES = 4_500_000;
const ANTHROPIC_FETCH_TIMEOUT_MS = 45_000;
const MAX_OUTPUT_TOKENS = 800;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

function logEvent(event: string, details: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      service: "castview-api-brief-match",
      event,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  );
}

function normalizeBody(body: unknown): BriefMatchRequestBody {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as BriefMatchRequestBody;
    } catch {
      return {};
    }
  }
  if (typeof body === "object") {
    return body as BriefMatchRequestBody;
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

function normalizeModelInput(entry: unknown): BriefMatchModelInput | null {
  if (!entry || typeof entry !== "object") return null;

  const raw = entry as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const division = typeof raw.division === "string" ? raw.division.trim() : "";
  const topScore = Number(raw.topScore);

  if (!id || !name) return null;

  const contexts = Array.isArray(raw.contexts)
    ? raw.contexts.filter((ctx): ctx is string => typeof ctx === "string" && ctx.trim().length > 0)
    : [];

  return {
    id,
    name,
    topScore: Number.isFinite(topScore) ? Math.round(topScore) : 0,
    contexts,
    division,
  };
}

function normalizeModelsInput(value: unknown): BriefMatchModelInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => normalizeModelInput(entry))
    .filter((entry): entry is BriefMatchModelInput => entry !== null);
}

function extractJsonText(text: string): string {
  const withoutFences = text.replace(/```json|```/gi, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start >= 0 && end >= 0) return withoutFences.slice(start, end + 1);
  return withoutFences;
}

function normalizeMatchEntry(entry: unknown): BriefMatchResult | null {
  if (!entry || typeof entry !== "object") return null;

  const raw = entry as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const score = Number(raw.score);
  const reasoning =
    typeof raw.reasoning === "string" && raw.reasoning.trim()
      ? raw.reasoning.trim()
      : null;

  if (!id || !Number.isFinite(score) || !reasoning) return null;

  return {
    id,
    score: Math.min(100, Math.max(0, Math.round(score))),
    reasoning,
  };
}

function parseModelOutput(
  text: string,
  models: BriefMatchModelInput[],
): BriefMatchResult[] {
  const jsonText = extractJsonText(text);
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;

  if (!Array.isArray(parsed.matches)) {
    return [];
  }

  const parsedMatches = parsed.matches
    .map((entry) => normalizeMatchEntry(entry))
    .filter((entry): entry is BriefMatchResult => entry !== null);

  const byId = new Map(parsedMatches.map((match) => [match.id, match]));

  const merged = models.map((model) => {
    const existing = byId.get(model.id);
    if (existing) return existing;
    return {
      id: model.id,
      score: 0,
      reasoning: "Insufficient data to assess fit for this brief.",
    };
  });

  return merged.sort((a, b) => b.score - a.score);
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
  res: ServerResponse & { status: (code: number) => any; json: (body: unknown) => void },
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const requestStartMs = Date.now();
  const debug = process.env.CASTVIEW_DEBUG_API === '1';
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

  const quota = await checkAiQuota(entitlement.auth.agencyId, entitlement.auth.plan);
  if (quota.allowed === false) {
    finish(
      requestStartMs,
      {
        error: 'Too many AI requests. Please slow down and try again shortly.',
        reason: quota.reason,
      },
      429,
      res,
    );
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
    finish(requestStartMs, { error: "Request payload too large." }, 413, res);
    return;
  }

  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  const models = normalizeModelsInput(body.models);

  if (!brief) {
    finish(requestStartMs, { error: "Missing brief." }, 400, res);
    return;
  }

  if (models.length === 0) {
    finish(requestStartMs, { error: "Missing models." }, 400, res);
    return;
  }

  console.log("[API] brief-match request", {
    briefLength: brief.length,
    modelCount: models.length,
    payloadBytes,
    payloadKb: Math.round(payloadBytes / 1024),
  });

  const prompt = `You are an expert modeling agency casting director. A booker has described a brief and you must rank the agency's roster models by fit.

Brief: "${brief}"

Roster models:
${JSON.stringify(models, null, 2)}

Return ONLY valid JSON:
{
  "matches": [
    {
      "id": "model-id",
      "score": 87,
      "reasoning": "One sentence explaining why this model fits the brief."
    }
  ]
}

Rules:
- Include ALL models in the response
- score: integer 0-100 based on how well the model fits the brief description
- reasoning: exactly one sentence, specific to why this model fits or doesn't fit
- Sort by score descending
- Return ONLY the JSON, no preamble`;

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
      modelCount: models.length,
      payloadBytes,
      payloadKb: Math.round(anthropicPayloadBytes / 1024),
      maxTokens: MAX_OUTPUT_TOKENS,
      fetchTimeoutMs: ANTHROPIC_FETCH_TIMEOUT_MS,
    });

    logEvent("anthropic_request_start", {
      model: ANTHROPIC_MODEL,
      modelCount: models.length,
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

  if (debug) {
    console.log(
      "[API] Anthropic response preview:",
      JSON.stringify(anthropicData).slice(0, 1000),
    );
  }

  const responseText =
    typeof anthropicData.content?.[0]?.text === "string"
      ? anthropicData.content[0].text
      : "";

  if (debug) {
    console.log("[API] Anthropic model text preview:", responseText.slice(0, 1000));
  }

  let matches: BriefMatchResult[];
  try {
    matches = parseModelOutput(responseText, models);
  } catch (parseError) {
    const parseMessage =
      parseError instanceof Error ? parseError.message : "unknown";
    console.error("[API] brief-match JSON.parse failed:", {
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
        error: "Invalid brief-match JSON from Anthropic API.",
        detail: parseMessage,
      },
      502,
      res,
    );
    return;
  }

  if (matches.length === 0) {
    logEvent("anthropic_response_invalid_shape", {
      responsePreview: responseText.slice(0, 1500),
    });
    finish(
      requestStartMs,
      { error: "Invalid brief-match payload from Anthropic API." },
      502,
      res,
    );
    return;
  }

  logEvent("brief_match_success", {
    modelCount: models.length,
    matchCount: matches.length,
    durationMs: Date.now() - requestStartMs,
  });

  console.log("[API] returning success response", {
    matchCount: matches.length,
  });

  const response: BriefMatchResponseBody = { matches };

  finish(requestStartMs, response as unknown as Record<string, unknown>, 200, res);
}
