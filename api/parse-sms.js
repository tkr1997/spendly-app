export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sms } = req.body;
  if (!sms) return res.status(400).json({ error: 'No SMS provided' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expense parser. Given a bank or UPI SMS, extract: name (merchant/payee or brief description), amount (number only, no currency symbol), category (one of: Food, Transport, Shopping, Bills, Health, Entertainment, Other), date (YYYY-MM-DD, default today if unclear).
Respond ONLY with valid JSON like: {"name":"Swiggy","amount":450,"category":"Food","date":"2026-07-08"}. No markdown, no explanation.

SMS: ${sms}`
          }]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 200 }
      })
    });

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse SMS', detail: err.message });
  }
}
