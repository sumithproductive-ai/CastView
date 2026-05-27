export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const { images, contexts, prospectName } =
    req.body;

  const imageContent = (images || [])
    .filter((img: any) => img && img.data)
    .map((img: any) => ({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType || 'image/jpeg',
        data: img.data,
      },
    }));

  const prompt = `You are an expert modeling
agency evaluator with deep knowledge of the
fashion industry. You are evaluating a model
prospect named ${prospectName} for these
shoot contexts: ${(contexts || []).join(', ')}.

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
- Be specific about what you see in photos
- Minimum 2 items per array
- Return ONLY the JSON object, nothing else`;

  try {
    const response = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
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
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      return res.status(500).json({
        error: 'Anthropic API failed',
        details: errorText
      });
    }

    const data = await response.json();

    const responseText = data.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('');

    const parsed = JSON.parse(responseText);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      error: 'Evaluation failed',
      details: String(error)
    });
  }
}
