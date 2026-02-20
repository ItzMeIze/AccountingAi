/* =============================================================
   /api/check-errors.js  — Vercel Serverless Function
   Calls Gemini to evaluate student error-finding answers
   against the known error list for the current question.
   ============================================================= */
export const config = { runtime: 'edge' };

const GEMINI_MODELS = ['gemini-2.0-flash-lite', 'gemini-1.5-flash'];

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

  const { studentAnswers, errors, company, totalErrors } = body;

  if (!studentAnswers || !errors || !Array.isArray(errors)) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400, headers: corsHeaders()
    });
  }

  /* Build the prompt ---------------------------------------- */
  const errorsText = errors.map((e, i) =>
    `Error ${i + 1}: [${e.location}] ${e.description} | Correction: ${e.correction}`
  ).join('\n');

  const studentText = (Array.isArray(studentAnswers) ? studentAnswers : [studentAnswers])
    .filter(Boolean)
    .map((s, i) => `Student answer ${i + 1}: ${s}`)
    .join('\n');

  const prompt = `You are a Grade 11 accounting teacher marking a student's error-finding exercise.

CONTEXT:
The student is studying a classified balance sheet for "${company || 'a company'}". The balance sheet has exactly ${totalErrors || errors.length} errors.

THE CORRECT ERRORS (teacher's answer key):
${errorsText}

THE STUDENT'S WRITTEN ANSWERS:
${studentText || '(Student left the answer blank)'}

MARKING TASK:
Grade each of the student's answers against the errors in the answer key. Be lenient — accept paraphrasing, approximate descriptions, and partial descriptions as long as the core issue is correctly identified. Accounting terminology must be generally correct.

RESPOND WITH VALID JSON ONLY. No markdown. No explanation outside the JSON. Use this exact structure:
{
  "matched": [
    {
      "studentIndex": 0,
      "studentText": "...",
      "errorId": 1,
      "quality": "correct",
      "feedback": "Good — you correctly identified that..."
    }
  ],
  "partial": [
    {
      "studentIndex": 1,
      "studentText": "...",
      "errorId": 2,
      "quality": "partial",
      "feedback": "You're on the right track but missed..."
    }
  ],
  "irrelevant": [
    {
      "studentIndex": 2,
      "studentText": "...",
      "reason": "This is not actually an error in the balance sheet because..."
    }
  ],
  "missed": [
    {
      "errorId": 3,
      "location": "...",
      "hint": "Look at the [location] section — something about [vague clue without giving away the answer]."
    }
  ],
  "score": {
    "found": 2,
    "partial": 1,
    "total": ${errors.length},
    "pass": true
  },
  "summary": "One encouraging sentence of overall feedback for a Grade 11 student."
}

Rules:
- "matched" = student clearly identified the error (fully or almost fully correct)
- "partial" = student noticed something in the right area but description is incomplete/imprecise
- "irrelevant" = student wrote something that is NOT actually an error
- "missed" = errors the student did not identify at all
- "score.found" = count of matched items only
- "score.partial" = count of partial items
- "score.pass" = true if found + partial >= ceil(total * 0.6)
- Keep "hint" vague — do NOT reveal the answer, only the section/area to look again
- Keep "feedback" encouraging and Grade 11 appropriate
`;

  /* Call Gemini (with model fallback) ---------------------- */
  let geminiData = null;
  let lastErr = null;

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const geminiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1200,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text().catch(() => '');
        lastErr = { status: geminiRes.status, detail: errText, model };
        continue;
      }

      geminiData = await geminiRes.json();
      lastErr = null;
      break;
    } catch (err) {
      lastErr = { status: 502, detail: String(err?.message || err), model };
    }
  }

  if (!geminiData) {
    const status = lastErr?.status === 429 ? 429 : 502;
    const quotaMsg = status === 429
      ? 'Gemini quota exceeded for this API key/project. Check AI Studio quotas or billing, then retry.'
      : 'Could not reach Gemini right now. Please try again in a moment.';

    return new Response(JSON.stringify({
      error: `Gemini API error ${lastErr?.status || 502}`,
      userMessage: quotaMsg,
      detail: lastErr?.detail || '',
      modelTried: lastErr?.model || null
    }), {
      status,
      headers: corsHeaders()
    });
  }

  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  /* Parse JSON from Gemini response ----------------------- */
  let result;
  try {
    // Strip possible markdown code fences if model ignores responseMimeType
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    result = JSON.parse(cleaned);
  } catch {
    // Fallback: return raw text so frontend can show it
    return new Response(JSON.stringify({ raw: rawText, parseError: true }), {
      status: 200, headers: corsHeaders()
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200, headers: corsHeaders()
  });
}

function corsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
}
