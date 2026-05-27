import Anthropic from '@anthropic-ai/sdk';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', 
      { status: 405 });
  }

  const body = await req.json();
  const { images, contexts, prospectName } = body;

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const imageContent = images
    .filter((img: any) => img && img.data)
    .map((img: any) => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mediaType as any,
        data: img.data,
      },
    }));

  const prompt = `You are an expert modeling 
agency evaluator with deep knowledge of the 
fashion industry. You are evaluating a model 
prospect named ${prospectName} for these 
shoot contexts: ${contexts.join(', ')}.

Analyze the provided digitals and evaluate 
alignment with each context.

Return ONLY valid JSON, no other text:
{
  "contextEvaluations": [
    {
      "context": "Fragrance",
      "alignmentScore": 85,
      "fitLabel": "STRONG ALIGNMENT",
      "reasoning": "2-3 sentence reasoning based on what you see in the photos",
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "risks": ["risk 1", "risk 2"],
      "marketSignals": ["signal 1", "signal 2"],
      "suggestedNextSteps": ["step 1", "step 2", "step 3"]
    }
  ]
}

Rules:
- fitLabel: "STRONG ALIGNMENT" for 80-100, 
  "MODERATE ALIGNMENT" for 60-79, 
  "LOW ALIGNMENT" below 60
- Be specific — reference what you 
  actually see in the photos
- Minimum 2 items per array
- Base evaluation on current fashion 
  industry standards per context
- Be honest — not every context scores high
- Return ONLY the JSON object, nothing else`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    const parsed = JSON.parse(responseText);
    return new Response(JSON.stringify(parsed), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Evaluation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Evaluation failed',
        details: String(error)
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
