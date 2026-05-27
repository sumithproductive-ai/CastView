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
const ANTHROPIC_TIMEOUT_MS = 50_000;
const DEFAULT_MODEL = "claude-3-5-sonnet-20241022";

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
    strengths: asStringArray(raw.strengths),
    risks: asStringArray(raw.risks),
    marketSignals: asStringArray(raw.marketSignals),
    suggestedNextSteps: asStringArray(raw.suggestedNextSteps),
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

export async function POST(request: Request) {
  logEvent("request_received", { method: "POST" });

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

  logEvent("environment_checked", {
    hasAnthropicApiKey: Boolean(anthropicApiKey),
    model,
  });

  if (!anthropicApiKey) {
    return jsonResponse({ error: "Missing ANTHROPIC_API_KEY" }, 500);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON request body." }, 400);
  }

  const body = normalizeBody(rawBody);
  const payloadBytes = estimatePayloadSize(body);

  logEvent("request_body_parsed", {
    bodyKeys: Object.keys(body),
    payloadBytes,
    payloadKb: Math.round(payloadBytes / 1024),
  });

  if (payloadBytes > MAX_REQUEST_BYTES) {
    return jsonResponse(
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

  logEvent("request_validated", {
    selectedContextsCount: selectedContexts.length,
    imageCount: imageBlocks.length,
  });

  if (selectedContexts.length === 0) {
    return jsonResponse({ error: "Missing selected contexts." }, 400);
  }

  if (selectedContexts.length !== 1) {
    return jsonResponse(
      { error: "Send exactly one context per evaluation request." },
      400,
    );
  }

  if (imageBlocks.length === 0) {
    return jsonResponse({ error: "Missing images." }, 400);
  }

  const prospectName = body.prospectName?.trim() || "Prospect";
  const targetContext = selectedContexts[0];

  const prompt = `Analyze all digitals for ${prospectName}. Evaluate ONLY "${targetContext}".
Return JSON only:
{"contextEvaluations":[{"context":"${targetContext}","alignmentScore":85,"fitLabel":"STRONG ALIGNMENT","reasoning":"brief","strengths":["a"],"risks":["b"],"marketSignals":["c"],"suggestedNextSteps":["d"]}]}
Rules: 80-100 STRONG ALIGNMENT, 60-79 MODERATE ALIGNMENT, below 60 LOW ALIGNMENT. One object only.`;

  const anthropicRequestBody = {
    model,
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: [...imageBlocks, { type: "text", text: prompt }],
      },
    ],
  };

  const anthropicPayloadBytes = estimatePayloadSize(anthropicRequestBody);

  try {
    logEvent("anthropic_request_start", {
      model,
      imageCount: imageBlocks.length,
      payloadKb: Math.round(anthropicPayloadBytes / 1024),
      maxTokens: 600,
    });

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicRequestBody),
      signal: AbortSignal.timeout(ANTHROPIC_TIMEOUT_MS),
    });

    logEvent("anthropic_response_received", {
      status: anthropicResponse.status,
      ok: anthropicResponse.ok,
    });

    if (!anthropicResponse.ok) {
      const anthropicErrorBody = await anthropicResponse.text();
      console.error("Anthropic failed:", {
        status: anthropicResponse.status,
        body: anthropicErrorBody.slice(0, 1500),
      });
      logEvent("anthropic_request_failed", {
        status: anthropicResponse.status,
        errorBody: anthropicErrorBody.slice(0, 1500),
      });

      if (anthropicResponse.status === 413) {
        return jsonResponse(
          { error: "Images too large. Please upload smaller digitals." },
          413,
        );
      }

      return jsonResponse(
        {
          error: "Anthropic API request failed.",
          status: anthropicResponse.status,
          detail: anthropicErrorBody.slice(0, 1500),
        },
        502,
      );
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = (anthropicData.content || [])
      .filter((block: { type?: string }) => block.type === "text")
      .map((block: { text?: string }) => block.text || "")
      .join("");

    logEvent("anthropic_raw_preview", {
      preview: responseText.slice(0, 500),
    });

    let evaluations: ContextEvaluationResult[];
    try {
      evaluations = parseModelOutput(responseText, targetContext);
    } catch (parseError) {
      console.error("Anthropic JSON parse failed:", {
        preview: responseText.slice(0, 1500),
        message: parseError instanceof Error ? parseError.message : "unknown",
      });
      logEvent("anthropic_response_parse_failed", {
        responsePreview: responseText.slice(0, 1500),
        parseError: parseError instanceof Error ? parseError.message : "unknown",
      });
      return jsonResponse({ error: "Invalid response from Anthropic API." }, 502);
    }

    if (evaluations.length === 0) {
      logEvent("anthropic_response_invalid_shape", {
        responsePreview: responseText.slice(0, 1500),
      });
      return jsonResponse(
        { error: "Invalid evaluation payload from Anthropic API." },
        502,
      );
    }

    logEvent("evaluation_success", {
      targetContext,
      alignmentScore: evaluations[0].alignmentScore,
    });

    console.log("Anthropic parsed response:", evaluations[0]);

    const response: EvaluateResponseBody = {
      contextEvaluations: evaluations,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const isTimeout =
      message.includes("timeout") || message.includes("aborted");
    logEvent("unexpected_error", { message, isTimeout });
    return jsonResponse(
      { error: isTimeout ? "Anthropic request timed out." : "Unexpected server error." },
      isTimeout ? 504 : 503,
    );
  }
}

export default POST;
