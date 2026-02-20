/* =============================================================
   /api/check-short.js  — Vercel Serverless Function
   Grades a student's short-answer response using Gemini.
   ============================================================= */
export const config = { runtime: 'edge' };

const GEMINI_MODELS      = ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];
const GEMINI_API_VERSIONS = ['v1beta', 'v1'];

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: corsHeaders()
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), {
      status: 500, headers: corsHeaders()
    });
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: corsHeaders() }); }

  const { question, modelAnswer, studentAnswer, category } = body;
  if (!question || !modelAnswer || !studentAnswer) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: corsHeaders()
    });
  }

  const prompt = `You are a Grade 11 accounting teacher marking a short-answer question.

QUESTION:
${question}

MODEL ANSWER (teacher's key):
${modelAnswer}

STUDENT'S ANSWER:
${studentAnswer}

TASK:
Grade the student's answer on a scale of 0–100, taking into account:
- Accuracy of accounting concepts (most important)
- Coverage of key points from the model answer
- Clarity and appropriate use of terminology
- Be lenient with wording — accept paraphrasing

Respond with VALID JSON ONLY using this exact structure:
{
  "score": 75,
  "grade": "Good",
  "feedback": "One encouraging sentence about what they got right.",
  "missing": "One short phrase describing what key idea was missing, or null if nothing significant was missed.",
  "tip": "One actionable improvement tip for next time, max 15 words."
}

Rules:
- score: integer 0–100
- grade: exactly one of "Excellent", "Good", "Developing", "Needs Work"
- Use "Excellent" for 85+, "Good" for 65–84, "Developing" for 45–64, "Needs Work" for 0–44
- feedback, missing, tip: max 25 words each
- Set missing to null (JSON null, not the string "null") if the answer covered all key points
- No markdown, no text outside the JSON object`;

  /* Try Gemini models in sequence */
  let geminiData = null;
  let lastErr = null;

  const targets = GEMINI_API_VERSIONS.flatMap(v =>
    GEMINI_MODELS.map(m => ({ model: m, apiVersion: v }))
  );

  for (const { model, apiVersion } of targets) {
    const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
            responseMimeType: 'application/json'
          }
        })
      });
      if (!res.ok) {
        lastErr = { status: res.status, model };
        continue;
      }
      geminiData = await res.json();
      break;
    } catch (err) {
      lastErr = { status: 502, model, detail: String(err?.message || err) };
    }
    if (geminiData) break;
  }

  if (!geminiData) {
    return new Response(JSON.stringify({
      error: 'Could not reach Gemini. Please try again.',
      userMessage: lastErr?.status === 429
        ? 'Quota exceeded. Try again in a moment.'
        : 'AI service temporarily unavailable.'
    }), { status: 502, headers: corsHeaders() });
  }

  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  let result;
  try {
    let cleaned = rawText.trim();
    const fence = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/i);
    if (fence) cleaned = fence[1].trim();
    else {
      const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
      if (s !== -1 && e > s) cleaned = cleaned.slice(s, e + 1);
    }
    result = JSON.parse(cleaned);
  } catch {
    return new Response(JSON.stringify({ raw: rawText, parseError: true }), {
      status: 200, headers: corsHeaders()
    });
  }

  return new Response(JSON.stringify(result), { status: 200, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
}
