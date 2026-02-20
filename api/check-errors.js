/* =============================================================
   /api/check-errors.js  — Vercel Serverless Function
   Calls Gemini to evaluate student error-finding answers
   against the known error list for the current question.
   ============================================================= */
export const config = { runtime: 'edge' };

const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash'
];
const GEMINI_API_VERSIONS = ['v1beta', 'v1'];

export default async function handler(req) {
  const requestId = `chkerr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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

  console.info('[check-errors] request:start', {
    requestId,
    hasAnswers: !!studentAnswers,
    answerCount: Array.isArray(studentAnswers) ? studentAnswers.length : (studentAnswers ? 1 : 0),
    errorCount: Array.isArray(errors) ? errors.length : 0,
    company: company || null,
    totalErrors: totalErrors || null
  });

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

  /* Call Gemini (with model discovery + fallback) ---------- */
  let geminiData = null;
  let lastErr = null;
  const attemptLogs = [];

  const discoveredModels = await discoverGenerateModels(apiKey);
  const attemptTargets = discoveredModels.length
    ? discoveredModels
    : GEMINI_API_VERSIONS.flatMap(apiVersion => GEMINI_MODELS.map(model => ({ model, apiVersion })));

  if (discoveredModels.length) {
    console.info('[check-errors] model:discovery', {
      requestId,
      count: discoveredModels.length,
      models: discoveredModels.slice(0, 8)
    });
  }

  for (const target of attemptTargets) {
    const { model, apiVersion } = target;
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
      try {
        const start = Date.now();
        const geminiRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 1200
            }
          })
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text().catch(() => '');
          attemptLogs.push({ model, apiVersion, ok: false, status: geminiRes.status, ms: Date.now() - start });
          lastErr = { status: geminiRes.status, detail: errText, model, apiVersion };
          continue;
        }

        geminiData = await geminiRes.json();
        attemptLogs.push({ model, apiVersion, ok: true, status: 200, ms: Date.now() - start });
        lastErr = null;
        break;
      } catch (err) {
        attemptLogs.push({ model, apiVersion, ok: false, status: 502, ms: 0, message: String(err?.message || err) });
        lastErr = { status: 502, detail: String(err?.message || err), model, apiVersion };
      }
    if (geminiData) break;
  }

  if (!geminiData) {
    const status = lastErr?.status === 429 ? 429 : 502;
    const quotaMsg = status === 429
      ? 'Gemini quota exceeded for this API key/project. Check AI Studio quotas or billing, then retry.'
      : 'Could not reach Gemini right now. Please try again in a moment.';

    console.error('[check-errors] request:failed', {
      requestId,
      status,
      modelTried: lastErr?.model || null,
      attempts: attemptLogs,
      detail: lastErr?.detail || ''
    });

    // Fallback: local heuristic marker so students still get feedback instead of a hard failure.
    const fallback = gradeWithHeuristics({
      studentAnswers,
      errors,
      totalErrors,
      requestId,
      quotaMsg,
      failure: {
        status: lastErr?.status || 502,
        model: lastErr?.model || null,
        apiVersion: lastErr?.apiVersion || null,
        detailSnippet: String(lastErr?.detail || '').slice(0, 500)
      }
    });
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: corsHeaders()
    });
  }

  const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  /* Parse JSON from Gemini response ----------------------- */
  let result;
  try {
    let cleaned = rawText.trim();
    // 1) Try to extract JSON from markdown code fences (```json ... ``` or ``` ... ```)
    const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/i);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    } else {
      // 2) No fences found — try to extract the outermost { ... } block
      const braceStart = cleaned.indexOf('{');
      const braceEnd = cleaned.lastIndexOf('}');
      if (braceStart !== -1 && braceEnd > braceStart) {
        cleaned = cleaned.slice(braceStart, braceEnd + 1);
      }
    }
    result = JSON.parse(cleaned);
  } catch {
    console.error('[check-errors] request:parse_error', {
      requestId,
      attempts: attemptLogs,
      rawPreview: rawText?.slice(0, 350) || ''
    });
    // Fallback: return raw text so frontend can show it
    return new Response(JSON.stringify({ raw: rawText, parseError: true, requestId }), {
      status: 200, headers: corsHeaders()
    });
  }

  console.info('[check-errors] request:success', {
    requestId,
    attempts: attemptLogs,
    matched: Array.isArray(result?.matched) ? result.matched.length : 0,
    partial: Array.isArray(result?.partial) ? result.partial.length : 0,
    irrelevant: Array.isArray(result?.irrelevant) ? result.irrelevant.length : 0,
    missed: Array.isArray(result?.missed) ? result.missed.length : 0
  });

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

async function discoverGenerateModels(apiKey) {
  const out = [];

  for (const apiVersion of GEMINI_API_VERSIONS) {
    try {
      const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const models = Array.isArray(data?.models) ? data.models : [];

      models.forEach((m) => {
        const name = String(m?.name || ''); // e.g. models/gemini-2.0-flash
        const short = name.startsWith('models/') ? name.slice(7) : name;
        const methods = Array.isArray(m?.supportedGenerationMethods) ? m.supportedGenerationMethods : [];
        if (!short.startsWith('gemini-')) return;
        if (!methods.includes('generateContent')) return;
        out.push({ model: short, apiVersion });
      });
    } catch {
      // ignore discovery failures and rely on static fallback list
    }
  }

  // de-dupe
  const seen = new Set();
  return out.filter((m) => {
    const key = `${m.apiVersion}:${m.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function gradeWithHeuristics({ studentAnswers, errors, totalErrors, requestId, quotaMsg, failure }) {
  const answers = (Array.isArray(studentAnswers) ? studentAnswers : [studentAnswers])
    .map(s => String(s || '').trim())
    .filter(Boolean);

  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const keyTerms = (s) => {
    const stop = new Set(['the','and','for','with','that','this','from','into','under','over','after','before','is','are','was','were','to','of','in','on','a','an','by']);
    return norm(s).split(' ').filter(w => w.length > 2 && !stop.has(w));
  };

  const key = errors.map((e, i) => ({
    errorId: e?.id || (i + 1),
    location: e?.location || '',
    terms: [...new Set([...keyTerms(e?.description), ...keyTerms(e?.correction), ...keyTerms(e?.location)])]
  }));

  const used = new Set();
  const matched = [];
  const partial = [];
  const irrelevant = [];

  answers.forEach((studentText, idx) => {
    const aTerms = keyTerms(studentText);
    let best = null;

    key.forEach((k, kIdx) => {
      if (used.has(kIdx)) return;
      const overlap = aTerms.filter(t => k.terms.includes(t)).length;
      const ratio = k.terms.length ? (overlap / k.terms.length) : 0;
      if (!best || ratio > best.ratio) best = { k, kIdx, overlap, ratio };
    });

    if (best && (best.overlap >= 2 || best.ratio >= 0.34)) {
      used.add(best.kIdx);
      matched.push({
        studentIndex: idx,
        studentText,
        errorId: best.k.errorId,
        quality: 'correct',
        feedback: 'Good identification. Your answer aligns with one of the expected errors.'
      });
    } else if (best && best.overlap === 1) {
      partial.push({
        studentIndex: idx,
        studentText,
        errorId: best.k.errorId,
        quality: 'partial',
        feedback: 'You are close, but include a clearer accounting reason and correction.'
      });
    } else {
      irrelevant.push({
        studentIndex: idx,
        studentText,
        reason: 'This does not match the known error list closely enough. Re-check section placement and ordering rules.'
      });
    }
  });

  const missed = key
    .filter((_, i) => !used.has(i))
    .map(k => ({
      errorId: k.errorId,
      location: k.location,
      hint: 'Check this section again for classification, ordering, or subtotal logic.'
    }));

  const total = Number(totalErrors) || errors.length || key.length;
  const found = matched.length;
  const part = partial.length;

  return {
    matched,
    partial,
    irrelevant,
    missed,
    score: {
      found,
      partial: part,
      total,
      pass: (found + part) >= Math.ceil(total * 0.6)
    },
    summary: `Fallback marker used because Gemini is temporarily unavailable. ${quotaMsg}`,
    fallbackUsed: true,
    fallbackReason: failure || null,
    requestId
  };
}
