import type { IncomingMessage, ServerResponse } from "http";
import { requireEntitledAgency } from "./_auth";
import { checkAiQuota } from "./_aiQuota";

type EvaluateRequestBody = {
  prospectName?: string;
  selectedContexts?: string[];
  location?: string;
  targetRegion?: string;
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
  const debug = process.env.CASTVIEW_DEBUG_API === '1';

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
    const { status, error, reason } = entitlement;
    finish(requestStartMs, { error, reason: reason ?? 'auth_failed' }, status, res);
    return;
  }

  const quota = await checkAiQuota(entitlement.auth.agencyId, entitlement.auth.plan);
  if (quota.allowed === false) {
    finish(
      requestStartMs,
      {
        error: 'Too many AI evaluation requests. Please slow down and try again shortly.',
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
  const location = typeof body.location === "string" ? body.location.trim() : "";
  const targetRegion = typeof body.targetRegion === "string" ? body.targetRegion.trim() : "";
  const targetContext = selectedContexts[0];

  const sameMarket =
    Boolean(location) && Boolean(targetRegion) && location.toLowerCase() === targetRegion.toLowerCase();

  let regionalGuidance = "";
  if (location && targetRegion && !sameMarket) {
    regionalGuidance = `\n${prospectName} is based in ${location}, and this read is for the ${targetRegion} market. Reason explicitly about the export story: what carries over from their home market — established look, training, existing client relationships, tear sheet strength — to ${targetRegion} clients, and what needs to adapt: regional beauty standards, casting norms, and current aesthetic direction in ${targetRegion} versus ${location}. Ground marketSignals in ${targetRegion} specifically, not a generic Western-market read, layered on top of the ${targetContext} brief below, not instead of it.\n`;
  } else if (targetRegion) {
    regionalGuidance = `\n${prospectName} is being read for the ${targetRegion} market${location ? " (also their home market)" : ""}. Ground your read — especially marketSignals — in the booking realities of ${targetRegion} (regional fashion weeks, campaign/commercial casting norms, agencies and clients active there), layered on top of the ${targetContext} brief below, not instead of it.\n`;
  } else if (location) {
    regionalGuidance = `\n${prospectName} is based in ${location}. Ground your read — especially marketSignals — in the booking realities of that specific market (regional fashion weeks, campaign/commercial casting norms, agencies and clients active there), layered on top of the ${targetContext} brief below, not instead of it.\n`;
  }

  console.log("[API] evaluation request", {
    context: targetContext,
    imageCount: imageBlocks.length,
    payloadBytes,
    payloadKb: Math.round(payloadBytes / 1024),
  });

  const prompt = `You are the senior casting eye at a boutique modeling agency, reviewing new-face digitals the way a director who has scouted for twenty years does: fast, specific, and grounded in what clients in each market actually book.

You are evaluating ${prospectName} for the ${targetContext} market. Four digitals are attached: front, profile, 3/4, and full body.
${regionalGuidance}
Your reader is a working booker. Your job is to sharpen their read on this prospect, not replace it — write as a trusted second opinion they can agree or argue with. Every claim must be anchored to something visible in these four frames. If a sentence could describe any prospect, cut it and replace it with what you actually see: name the feature (eye set, jaw line, brow weight, neck length, shoulder line, proportion, skin, how the hair behaves across angles) and say what it does for or against this specific market.

Market brief — what books in each context:
- Editorial: angular or unusual features that hold interest in a still image; strong bone shadow; a face that photographs like a story
- Fragrance: intensity at close range; eye contact that reads on camera; skin and lip detail that survives macro; mood over conventional prettiness
- Runway: proportion and line above all — height impression, limb length, narrow silhouette; a neutral face designers can style onto
- Campaign: commercial warmth with polish; symmetric, approachable, brand-safe; reads well in lifestyle framing
- Beauty: skin quality, symmetry, and feature definition at extreme close-up; lips, brows, teeth, hairline are all load-bearing
- Sportswear: visible athletic conditioning; energy in the frame; believable movement even in a static digital
- Couture: sculptural presence — features and posture that carry dramatic construction without being overwhelmed by it
- Swimwear: body condition and proportion carry the frame; confidence in minimal styling; skin quality across the full figure
- Street: a distinctive, identifiable presence — texture and attitude rather than a blank canvas

Cross-reference the four angles. Discrepancies are where you earn the booker's trust: a front that flattens in profile, a 3/4 that reveals the strongest angle, a full body that changes the proportion story. These are observations a booker cannot get from one frame.

Score honestly across the full 0-100 range:
- 80-100: board-ready for this context — you would confidently submit this prospect to ${targetContext} clients today
- 60-79: real signal for this market, with named, developable gaps
- 0-59: fundamental mismatch with what this market casts — say plainly why, without hedging

Most prospects are not 80+. A tight, well-reasoned 58 builds more trust with a booker than a polite 74.

What the digitals cannot show — walk, movement, personality, presence in a casting room — stays out of strengths and risks. marketSignals should reflect genuine current casting direction in ${targetContext} (aesthetic trends, what clients are booking toward), stated at the confidence of an informed director; never invent statistics.

Return ONLY valid JSON in exactly this shape:
{
  "contextEvaluations": [{
    "context": "${targetContext}",
    "alignmentScore": <integer 0-100>,
    "fitLabel": <"STRONG ALIGNMENT" for 80-100, "MODERATE ALIGNMENT" for 60-79, "LOW ALIGNMENT" for 0-59>,
    "reasoning": "2-3 sentences: your core read on this prospect for this market, built from what the digitals show",
    "strengths": ["3 items, each naming a visible attribute and its value in this market"],
    "risks": ["2 honest items — what a ${targetContext} client will see as a gap"],
    "marketSignals": ["2 items on current ${targetContext} casting direction as it applies to this prospect"],
    "suggestedNextSteps": ["3 concrete actions for the booker — specific enough to act on this week"]
  }]
}
No preamble, no markdown fences.`;

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
