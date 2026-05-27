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

type AnthropicTextBlock = {
  type: "text";
  text: string;
};

const MAX_REQUEST_BYTES = 4_500_000;
const ANTHROPIC_FETCH_TIMEOUT_MS = 45_000;
const MAX_OUTPUT_TOKENS = 500;
const DEFAULT_MODEL = "claude-3-5-haiku-20241022";

type AnthropicMessagesResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { type?: string; message?: string };
};

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

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return Response.json(body, { status });
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

function buildAnthropicImageBlocks(
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

function extractAnthropicTextContent(anthropicData: AnthropicMessagesResponse): string {
  if (!Array.isArray(anthropicData.content)) return "";
  return anthropicData.content
    .filter((block) => block.type === "text")
    .map((block) => block.text || "")
    .join("");
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
): Response {
  const totalDurationMs = Date.now() - requestStartMs;
  console.log("[API] total backend duration ms:", totalDurationMs, {
    status,
    error: body.error ?? null,
  });
  logEvent("request_finished", { status, totalDurationMs });
  return jsonResponse(body, status);
}

export async function POST(request: Request) {
  const requestStartMs = Date.now();
  console.log("[API] request received");

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

  logEvent("environment_checked", {
    hasAnthropicApiKey: Boolean(anthropicApiKey),
    model,
  });

  if (!anthropicApiKey) {
    return finish(
      requestStartMs,
      { error: "Missing ANTHROPIC_API_KEY" },
      500,
    );
  }

  let rawBody: unknown;
  try {
    console.log("[API] parsing body");
    rawBody = await request.json();
  } catch (parseBodyError) {
    console.error("[API] request body parse failed:", parseBodyError);
    return finish(
      requestStartMs,
      { error: "Invalid JSON request body." },
      400,
    );
  }

  const body = normalizeBody(rawBody);
  const payloadBytes = estimatePayloadSize(body);

  logEvent("request_body_parsed", {
    bodyKeys: Object.keys(body),
    payloadBytes,
    payloadKb: Math.round(payloadBytes / 1024),
  });

  if (payloadBytes > MAX_REQUEST_BYTES) {
    return finish(
      requestStartMs,
      { error: "Images too large. Please upload smaller digitals." },
      413,
    );
  }

  const selectedContexts = Array.isArray(body.selectedContexts)
    ? body.selectedContexts.filter(
        (ctx): ctx is string => typeof ctx === "string" && ctx.trim().length > 0,
      )
    : [];

  const imageBlocks = buildAnthropicImageBlocks(body.images);
  console.log("[API] images prepared", {
    imageCount: imageBlocks.length,
    selectedContextsCount: selectedContexts.length,
  });

  if (selectedContexts.length === 0) {
    return finish(requestStartMs, { error: "Missing selected contexts." }, 400);
  }

  if (selectedContexts.length !== 1) {
    return finish(
      requestStartMs,
      { error: "Send exactly one context per evaluation request." },
      400,
    );
  }

  if (imageBlocks.length === 0) {
    return finish(requestStartMs, { error: "Missing images." }, 400);
  }

  const prospectName = body.prospectName?.trim() || "Prospect";
  const targetContext = selectedContexts[0];

  const prompt = `Evaluate ${prospectName} for "${targetContext}" using all digitals.
Return ONLY this JSON shape (one object in contextEvaluations):
{"contextEvaluations":[{"context":"${targetContext}","alignmentScore":85,"fitLabel":"STRONG ALIGNMENT","reasoning":"One sentence.","strengths":["a","b"],"risks":["c"],"marketSignals":["d"],"suggestedNextSteps":["e"]}]}
Rules: alignmentScore 0-100; fitLabel STRONG ALIGNMENT (80-100), MODERATE ALIGNMENT (60-79), LOW ALIGNMENT (below 60); reasoning exactly 1 sentence; max 2 strengths; max 1 risk; max 1 marketSignals; max 1 suggestedNextSteps.
Do not provide prose outside JSON. Keep each field concise.`;

  const anthropicRequestBody = {
    model,
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
    console.log("[API] anthropic fetch aborted");
    abortController.abort();
  }, ANTHROPIC_FETCH_TIMEOUT_MS);

  let anthropicResponse: Response;

  try {
    console.log("[API] anthropic request starting", {
      model,
      imageCount: imageBlocks.length,
      payloadKb: Math.round(anthropicPayloadBytes / 1024),
      maxTokens: MAX_OUTPUT_TOKENS,
      fetchTimeoutMs: ANTHROPIC_FETCH_TIMEOUT_MS,
    });

    logEvent("anthropic_request_start", {
      model,
      imageCount: imageBlocks.length,
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

    console.error("[API] anthropic fetch error:", {
      message,
      isAbort,
      name: fetchError instanceof Error ? fetchError.name : "unknown",
    });
    logEvent("anthropic_fetch_error", { message, isAbort });

    return finish(
      requestStartMs,
      {
        error: isAbort
          ? "Anthropic request timed out."
          : "Anthropic fetch failed.",
        detail: message,
      },
      isAbort ? 504 : 502,
    );
  } finally {
    clearTimeout(abortTimeoutId);
  }

  console.log("[API] anthropic response received");
  console.log("[API] anthropic status:", anthropicResponse.status);

  logEvent("anthropic_response_received", {
    status: anthropicResponse.status,
    ok: anthropicResponse.ok,
    durationMs: Date.now() - requestStartMs,
  });

  let rawText = "";
  try {
    rawText = await anthropicResponse.text();
  } catch (readBodyError) {
    console.error("[API] failed to read anthropic response body:", readBodyError);
    return finish(
      requestStartMs,
      { error: "Failed to read Anthropic response body." },
      502,
    );
  }

  console.log(
    "[API] anthropic raw body preview:",
    rawText.slice(0, 1000),
  );

  if (!anthropicResponse.ok) {
    console.error("Anthropic failed:", {
      status: anthropicResponse.status,
      body: rawText.slice(0, 1500),
    });
    logEvent("anthropic_request_failed", {
      status: anthropicResponse.status,
      errorBody: rawText.slice(0, 1500),
    });

    if (anthropicResponse.status === 413) {
      return finish(
        requestStartMs,
        { error: "Images too large. Please upload smaller digitals." },
        413,
      );
    }

    return finish(
      requestStartMs,
      {
        error: "Anthropic API request failed.",
        status: anthropicResponse.status,
        detail: rawText.slice(0, 1500),
      },
      502,
    );
  }

  let anthropicData: AnthropicMessagesResponse;
  try {
    console.log("[API] parsing anthropic json");
    anthropicData = JSON.parse(rawText) as AnthropicMessagesResponse;
  } catch (parseError) {
    const parseMessage =
      parseError instanceof Error ? parseError.message : "unknown";
    console.error("[API] anthropic envelope JSON.parse failed:", {
      parseError: parseMessage,
      rawTextPreview: rawText.slice(0, 1500),
    });
    logEvent("anthropic_envelope_parse_failed", {
      parseError: parseMessage,
      rawTextPreview: rawText.slice(0, 1500),
    });
    return finish(
      requestStartMs,
      { error: "Invalid JSON envelope from Anthropic API.", detail: parseMessage },
      502,
    );
  }

  const responseText = extractAnthropicTextContent(anthropicData);
  console.log(
    "[API] anthropic model text preview:",
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
    return finish(
      requestStartMs,
      {
        error: "Invalid evaluation JSON from Anthropic API.",
        detail: parseMessage,
      },
      502,
    );
  }

  if (evaluations.length === 0) {
    logEvent("anthropic_response_invalid_shape", {
      responsePreview: responseText.slice(0, 1500),
    });
    return finish(
      requestStartMs,
      { error: "Invalid evaluation payload from Anthropic API." },
      502,
    );
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

  return finish(requestStartMs, response as unknown as Record<string, unknown>, 200);
}

export default POST;
