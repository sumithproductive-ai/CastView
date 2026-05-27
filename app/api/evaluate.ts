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
        data: img.data as string,
      },
    }));
}

function extractJsonObject(text: string): EvaluateResponseBody {
  const withoutFences = text.replace(/```json|```/gi, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  const candidate =
    start >= 0 && end >= 0 ? withoutFences.slice(start, end + 1) : withoutFences;
  return JSON.parse(candidate) as EvaluateResponseBody;
}

export default async function handler(req: any, res: any) {
  const method = req.method ?? "UNKNOWN";
  logEvent("request_received", { method });

  if (method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const hasApiKey = Boolean(apiKey && apiKey.trim().length > 0);
  logEvent("environment_checked", { hasAnthropicApiKey: hasApiKey });

  if (!hasApiKey) {
    return res.status(500).json({ error: "Server configuration error: missing API key." });
  }

  const body = normalizeBody(req.body);
  const bodyKeys = Object.keys(body);
  const payloadBytes = estimatePayloadSize(body);

  logEvent("request_body_parsed", {
    bodyKeys,
    payloadBytes,
    payloadKb: Math.round(payloadBytes / 1024),
  });

  if (payloadBytes > MAX_REQUEST_BYTES) {
    return res.status(413).json({
      error: "Images too large. Please upload smaller digitals.",
    });
  }

  const selectedContexts = Array.isArray(body.selectedContexts)
    ? body.selectedContexts.filter((ctx): ctx is string => typeof ctx === "string" && ctx.trim().length > 0)
    : [];

  const imageBlocks = buildAnthropicImageBlocks(body.images);

  logEvent("request_validated", {
    selectedContextsCount: selectedContexts.length,
    imageCount: imageBlocks.length,
  });

  if (selectedContexts.length === 0) {
    return res.status(400).json({ error: "Missing selected contexts." });
  }

  if (imageBlocks.length === 0) {
    return res.status(400).json({ error: "Missing images." });
  }

  const prospectName = body.prospectName?.trim() || "Prospect";

  const prompt = `You are an expert modeling agency evaluator. Evaluate ${prospectName} for these contexts: ${selectedContexts.join(", ")}.

Analyze the digitals and return ONLY valid JSON:
{
  "contextEvaluations": [
    {
      "context": "Fragrance",
      "alignmentScore": 85,
      "fitLabel": "STRONG ALIGNMENT",
      "reasoning": "specific reasoning about what you see",
      "strengths": ["strength 1", "strength 2"],
      "risks": ["risk 1"],
      "marketSignals": ["signal 1"],
      "suggestedNextSteps": ["step 1", "step 2"]
    }
  ]
}

Rules: STRONG ALIGNMENT 80-100, MODERATE ALIGNMENT 60-79, LOW ALIGNMENT below 60. Return ONLY JSON.`;

  const textBlock: AnthropicTextBlock = { type: "text", text: prompt };
  const messageContent: Array<AnthropicImageBlock | AnthropicTextBlock> = [
    ...imageBlocks,
    textBlock,
  ];

  const anthropicRequestBody = {
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: messageContent,
      },
    ],
  };

  try {
    logEvent("anthropic_request_start", {
      model: anthropicRequestBody.model,
      imageCount: imageBlocks.length,
      contentBlockCount: messageContent.length,
    });

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicRequestBody),
    });

    logEvent("anthropic_response_received", {
      status: anthropicResponse.status,
      ok: anthropicResponse.ok,
    });

    if (!anthropicResponse.ok) {
      const anthropicErrorBody = await anthropicResponse.text();
      logEvent("anthropic_request_failed", {
        status: anthropicResponse.status,
        errorBody: anthropicErrorBody.slice(0, 2000),
      });

      if (anthropicResponse.status === 413) {
        return res.status(413).json({
          error: "Images too large. Please upload smaller digitals.",
        });
      }

      return res.status(502).json({ error: "Anthropic API request failed." });
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = (anthropicData.content || [])
      .filter((block: { type?: string }) => block.type === "text")
      .map((block: { text?: string }) => block.text || "")
      .join("");

    let parsed: EvaluateResponseBody;
    try {
      parsed = extractJsonObject(responseText);
    } catch (parseError) {
      logEvent("anthropic_response_parse_failed", {
        responsePreview: responseText.slice(0, 500),
        parseError: parseError instanceof Error ? parseError.message : "unknown",
      });
      return res.status(502).json({ error: "Invalid response from Anthropic API." });
    }

    if (!parsed?.contextEvaluations || !Array.isArray(parsed.contextEvaluations)) {
      logEvent("anthropic_response_invalid_shape", {
        parsedKeys: parsed ? Object.keys(parsed as object) : [],
      });
      return res.status(502).json({ error: "Invalid evaluation payload from Anthropic API." });
    }

    logEvent("evaluation_success", {
      contextEvaluationCount: parsed.contextEvaluations.length,
    });

    return res.status(200).json(parsed);
  } catch (error) {
    logEvent("unexpected_error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return res.status(503).json({ error: "Unexpected server error." });
  }
}
