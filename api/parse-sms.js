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

  const geminiRes = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Parse this SMS and return JSON with fields name, amount, category, date: ${sms}` }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 200 }
    })
  });

  const data = await geminiRes.json();
  
  // Return raw response so we can see exactly what Gemini returns
  return res.status(200).json({ raw: data, key_present: !!GEMINI_API_KEY });
}
