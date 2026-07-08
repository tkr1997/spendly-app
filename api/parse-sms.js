export default async function handler(req, res) {
  // Allow CORS from your Vercel app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sms } = req.body;
  if (!sms) return res.status(400).json({ error: 'No SMS provided' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `You are an expense parser. Given a bank or UPI SMS, extract: name (merchant/payee or brief description), amount (number only, no currency symbol), category (one of: Food, Transport, Shopping, Bills, Health, Entertainment, Other), date (YYYY-MM-DD, default today if unclear). Respond ONLY with valid JSON like: {"name":"Swiggy","amount":450,"category":"Food","date":"2026-07-07"}. No markdown, no explanation.`,
        messages: [{ role: 'user', content: sms }]
      })
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse SMS', detail: err.message });
  }
}
