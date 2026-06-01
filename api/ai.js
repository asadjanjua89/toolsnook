export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.toolsnook.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, max_tokens = 800 } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. When asked to respond in JSON, respond ONLY with valid JSON. No preamble, no explanation, no markdown code blocks, no extra text before or after. Just the raw JSON.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: max_tokens,
        temperature: 0.85
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    let text = data.choices[0].message.content;

    // Strip any markdown code fences the model might add despite instructions
    text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    return res.status(200).json({ text });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
