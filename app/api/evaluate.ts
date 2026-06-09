import type { IncomingMessage, ServerResponse } from "http";
import { requireEntitledAgency } from "./_auth";

type EvaluateRequestBody = {
  prospectName?: string;
  selectedContexts?: string[];
  images?: Array<{
    data?: string;
    mediaType?: string;
  }>;
};

type ContextEvaluationResult = {
  context: string;
  alignmentScore: number;
  fitLabel: string;
  reasoning: string;
  strengths: string[];
  risks: string[];
  marketSignals: string[];
  suggestedNextSteps: string[];
};

type EvaluateResponseBody = {
  contextEvaluations: ContextEvaluationResult[];
};

type AnthropicImageBlock = {
  type: "image";
  source: {
    type: "base64";
    media_type: string;
    data: string;
  };
};

type AnthropicMessagesResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { type?: string; message?: string };
};

const MAX_REQUEST_BYTES = 4_500_000;
const ANTHROPIC_FETCH_TIMEOUT_MS = 45_000;
const MAX_OUTPUT_TOKENS = 1500;
const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001";

function logEvent(event: string, details: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      service: "castview-api-evaluate",
      event,
      timestamp: new Date().toISOString(),
      ...details,
    }),
  );
}

function stripBase64Data(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("data:")) {
    const comma = trimmed.indexOf(",");
    return comma >= 0 ? trimmed.slice(comma + 1) : trimmed;
  }
  return trimmed;
}

function normalizeBody(body: unknown): EvaluateRequestBody {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as EvaluateRequestBody;
    } catch {
      return {};
    }
  }
  if (typeof body === "object") {
    return body as EvaluateRequestBody;
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

function normalizeMediaType(mediaType: string | undefined): string {
  const value = (mediaType || "image/jpeg").toLowerCase();
  if (value === "image/jpg") return "image/jpeg";
  if (
    value === "image/jpeg" ||
    value === "image/png" ||
    value === "image/gif" ||
    value === "image/webp"
  ) {
    return value;
  }
  return "image/jpeg";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function normalizeContextEvaluation(
  entry: unknown,
  targetContext: string,
): ContextEvaluationResult | null {
  if (!entry || typeof entry !== "object") return null;

  const raw = entry as Record<string, unknown>;
  const score = Number(raw.alignmentScore ?? raw.score);
  if (!Number.isFinite(score)) return null;

  const fitLabel =
    typeof raw.fitLabel === "string" && raw.fitLabel.trim()
      ? raw.fitLabel.trim()
      : score >= 80
        ? "STRONG ALIGNMENT"
        : score >= 60
          ? "MODERATE ALIGNMENT"
          : "LOW ALIGNMENT";

  const reasoning =
    typeof raw.reasoning === "string" && raw.reasoning.trim()
      ? raw.reasoning.trim()
      : null;
  if (!reasoning) return null;

  return {
    context: targetContext,
    alignmentScore: Math.round(score),
    fitLabel,
    reasoning,
    strengths: asStringArray(raw.strengths).slice(0, 2),
    risks: asStringArray(raw.risks).slice(0, 1),
    marketSignals: asStringArray(raw.marketSignals).slice(0, 1),
    suggestedNextSteps: asStringArray(raw.suggestedNextSteps).slice(0, 1),
  };
}

function buildAnthropicImageContent(
  images: EvaluateRequestBody["images"],
): AnthropicImageBlock[] {
  if (!Array.isArray(images)) return [];

  return images
    .filter((img) => img && typeof img.data === "string" && img.data.length > 0)
    .map((img) => ({
      type: "image" as const,
      source: {
        type: "base64" as const,
        media_type: normalizeMediaType(img.mediaType),
        data: stripBase64Data(img.data as string),
      },
    }));
}

function extractJsonText(text: string): string {
  const withoutFences = text.replace(/```json|```/gi, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start >= 0 && end >= 0) return withoutFences.slice(start, end + 1);
  return withoutFences;
}

function parseModelOutput(
  text: string,
  targetContext: string,
): ContextEvaluationResult[] {
  const jsonText = extractJsonText(text);
  const parsed = JSON.parse(jsonText) as Record<string, unknown>;

  if (Array.isArray(parsed.contextEvaluations)) {
    return parsed.contextEvaluations
      .map((entry) => normalizeContextEvaluation(entry, targetContext))
      .filter((entry): entry is ContextEvaluationResult => entry !== null);
  }

  const single = normalizeContextEvaluation(parsed, targetContext);
  return single ? [single] : [];
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

export default async function handler(req: IncomingMessage & { body?: unknown; method?: string }, res: ServerResponse & { status: (code: number) => any; json: (body: unknown) => void }) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const requestStartMs = Date.now();
  console.log("[API] request received");
  console.log("[API] provider: Anthropic");

  const authHeader =
    (req.headers as Record<string, string | string[] | undefined> | undefined)
      ?.authorization ??
    (req.headers as Record<string, string | string[] | undefined> | undefined)
      ?.Authorization;
  console.log("[API evaluate] authorization header exists:", Boolean(authHeader));

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
  console.log("[API] KEY_STATE:", JSON.stringify({ exists: 'ANTHROPIC_API_KEY' in process.env, length: (process.env.ANTHROPIC_API_KEY || '').length, trimmedLength: (process.env.ANTHROPIC_API_KEY || '').trim().length }));

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
    const { status, error, reason } = entitlement;
    finish(requestStartMs, { error, reason: reason ?? 'auth_failed' }, status, res);
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
      { error: "Images too large. Please upload smaller digitals." },
      413,
      res,
    );
    return;
  }

  const selectedContexts = Array.isArray(body.selectedContexts)
    ? body.selectedContexts.filter(
        (ctx): ctx is string => typeof ctx === "string" && ctx.trim().length > 0,
      )
    : [];

  const imageBlocks = buildAnthropicImageContent(body.images);

  if (selectedContexts.length === 0) {
    finish(requestStartMs, { error: "Missing selected contexts." }, 400, res);
    return;
  }

  if (selectedContexts.length !== 1) {
    finish(
      requestStartMs,
      { error: "Send exactly one context per evaluation request." },
      400,
      res,
    );
    return;
  }

  if (imageBlocks.length === 0) {
    finish(requestStartMs, { error: "Missing images." }, 400, res);
    return;
  }

  const prospectName = body.prospectName?.trim() || "Prospect";
  const targetContext = selectedContexts[0];

  console.log("[API] evaluation request", {
    context: targetContext,
    imageCount: imageBlocks.length,
    payloadBytes,
    payloadKb: Math.round(payloadBytes / 1024),
  });

  const prompt = `You are an expert modeling agency casting director evaluating ${prospectName} for the "${targetContext}" market using all four uploaded digitals (front, profile, 3/4, full body).

Analyse the digitals carefully and return ONLY valid JSON in exactly this shape:
{
  "contextEvaluations": [{
    "context": "${targetContext}",
    "alignmentScore": 85,
    "fitLabel": "STRONG ALIGNMENT",
    "reasoning": "2-3 sentence assessment of overall suitability for this context based on physical attributes, proportions, facial structure, and what shows in the digitals.",
    "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
    "risks": ["specific risk or gap 1", "specific risk or gap 2"],
    "marketSignals": ["market observation 1", "market observation 2"],
    "suggestedNextSteps": ["actionable next step 1", "actionable next step 2", "actionable next step 3"]
  }]
}

Rules:
- alignmentScore: integer 0-100 based on genuine visual assessment
- fitLabel: "STRONG ALIGNMENT" (80-100), "MODERATE ALIGNMENT" (60-79), "LOW ALIGNMENT" (0-59)
- reasoning: 2-3 sentences, specific to what you observe in the digitals
- strengths: 3 items, specific physical or aesthetic attributes that serve this context
- risks: 2 items, honest gaps or concerns for this specific market
- marketSignals: 2 items, current market demand observations for this context
- suggestedNextSteps: 3 actionable items for the booker to pursue
- All items must be specific to ${targetContext} — no generic filler
- Return ONLY the JSON. No preamble, no explanation, no markdown fences.`;

  const anthropicRequestBody = {
    model: ANTHROPIC_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    messages: [
      {
        role: "user",
        content: [...imageBlocks, { type: "text", text: prompt }],
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
      context: targetContext,
      imageCount: imageBlocks.length,
      payloadBytes,
      payloadKb: Math.round(anthropicPayloadBytes / 1024),
      maxTokens: MAX_OUTPUT_TOKENS,
      fetchTimeoutMs: ANTHROPIC_FETCH_TIMEOUT_MS,
    });

    logEvent("anthropic_request_start", {
      model: ANTHROPIC_MODEL,
      context: targetContext,
      imageCount: imageBlocks.length,
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
        { error: "Images too large. Please upload smaller digitals." },
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

  let evaluations: ContextEvaluationResult[];
  try {
    evaluations = parseModelOutput(responseText, targetContext);
  } catch (parseError) {
    const parseMessage =
      parseError instanceof Error ? parseError.message : "unknown";
    console.error("[API] evaluation JSON.parse failed:", {
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
        error: "Invalid evaluation JSON from Anthropic API.",
        detail: parseMessage,
      },
      502,
      res,
    );
    return;
  }

  if (evaluations.length === 0) {
    logEvent("anthropic_response_invalid_shape", {
      responsePreview: responseText.slice(0, 1500),
    });
    finish(
      requestStartMs,
      { error: "Invalid evaluation payload from Anthropic API." },
      502,
      res,
    );
    return;
  }

  logEvent("evaluation_success", {
    targetContext,
    alignmentScore: evaluations[0].alignmentScore,
    durationMs: Date.now() - requestStartMs,
  });

  console.log("[API] returning success response", {
    context: targetContext,
    alignmentScore: evaluations[0].alignmentScore,
  });

  const response: EvaluateResponseBody = {
    contextEvaluations: evaluations,
  };

  finish(requestStartMs, response as unknown as Record<string, unknown>, 200, res);
}
