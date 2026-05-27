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

function normalizeBody(body: unknown): EvaluateRequestBody {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (typeof body === "object") {
    return body as EvaluateRequestBody;
  }
  return {};
}

function extractJsonObject(text: string): EvaluateResponseBody {
  const withoutFences = text.replace(/```json|```/gi, "").trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  const candidate =
    start >= 0 && end >= 0 ? withoutFences.slice(start, end + 1) : withoutFences;
  return JSON.parse(candidate);
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY in environment.");
    return res.status(503).json({ error: "Evaluation temporarily unavailable." });
  }

  const body = normalizeBody(req.body);
  const prospectName = body.prospectName?.trim() || "Prospect";
  const selectedContexts =
    Array.isArray(body.selectedContexts) && body.selectedContexts.length > 0
      ? body.selectedContexts.filter((ctx): ctx is string => typeof ctx === "string")
      : ["Fragrance"];

  const images = Array.isArray(body.images)
    ? body.images
        .filter((img) => img && typeof img.data === "string" && img.data.length > 0)
        .map((img) => ({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mediaType || "image/jpeg",
            data: img.data as string,
          },
        }))
    : [];

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

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [...images, { type: "text", text: prompt }],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const anthropicError = await anthropicResponse.text();
      console.error("Anthropic evaluation request failed:", anthropicError);
      return res.status(503).json({ error: "Evaluation temporarily unavailable." });
    }

    const anthropicData = await anthropicResponse.json();
    const responseText = (anthropicData.content || [])
      .filter((block: { type?: string }) => block.type === "text")
      .map((block: { text?: string }) => block.text || "")
      .join("");

    const parsed = extractJsonObject(responseText);
    if (!parsed?.contextEvaluations || !Array.isArray(parsed.contextEvaluations)) {
      console.error("Invalid Anthropic evaluation payload:", parsed);
      return res.status(503).json({ error: "Evaluation temporarily unavailable." });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error("Evaluation API route error:", error);
    return res.status(503).json({ error: "Evaluation temporarily unavailable." });
  }
}
