export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sms } = req.body;
  if (!sms) return res.status(400).json({ error: 'No SMS provided' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Parse this bank/UPI SMS and return a JSON object with exactly these fields:
- name: merchant or payee name (string)
- amount: transaction amount as a number only, no symbols
- category: one of Food, Transport, Shopping, Bills, Health, Entertainment, Other
- date: date in YYYY-MM-DD format, use ${new Date().toISOString().split('T')[0]} if not found

Return ONLY the JSON object, nothing else. No markdown, no backticks.

SMS: ${sms}`
          }]
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 1024 }
      })
    });

    const data = await geminiRes.json();

    if (data.error) {
      return res.status(500).json({ error: 'Gemini error', detail: data.error.message });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response: ' + text);

    const parsed = JSON.parse(match[0]);

    return res.status(200).json({
      name: parsed.name || 'Unknown',
      amount: parseFloat(parsed.amount) || 0,
      category: parsed.category || 'Other',
      date: parsed.date || new Date().toISOString().split('T')[0]
    });

  } catch (err) {
    return res.status(500).json({ error: 'Failed to parse SMS', detail: err.message });
  }
}
