/* =============================================================
   Vercel Serverless Function — AI Question Generator
   POST /api/generate  { type, difficulty }
   Requires env var: OPENAI_API_KEY
   ============================================================= */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type = 'preparation', difficulty = 1 } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY environment variable not set. Add it in your Vercel project settings under Environment Variables.' });
  }

  const systemPrompt = `You are an expert Grade 11 BAF3M Accounting teacher in Ontario, Canada.
You generate ONLY classified balance sheet questions — never simplified balance sheets.
A classified balance sheet has exactly these five sections:
  1. Current Assets (CA) — converted to cash within 1 year, listed by liquidity: Cash, Short-Term Investments, Accounts Receivable (sub-debtors alphabetically), Merchandise Inventory, Prepaid Expenses, Supplies
  2. Long-Term Assets (LTA) — used >1 year, listed by useful life (longest first): Land, Buildings, Equipment, Furniture & Fixtures, Vehicles
  3. Current Liabilities (CL) — due within 1 year: Bank Overdraft, Accounts Payable (sub-creditors alphabetically), Wages Payable, Interest Payable, Unearned Revenue, Current Portion of LT Debt
  4. Long-Term Liabilities (LTL) — due after 1 year: Mortgage Payable, Bank Loan, Bonds Payable
  5. Owner's Equity (OE): Capital + Net Income − Drawings
Layout: Two-column side-by-side. Assets on LEFT. Liabilities + OE on RIGHT.
Total Assets MUST equal Total Liabilities + Owner's Equity.
You ALWAYS return valid JSON only — no markdown, no code fences, no explanation outside the JSON.`;

  const prompts = {
    error_finding: {
      1: buildErrorPrompt(1, 6),
      2: buildErrorPrompt(2, 9),
      3: buildErrorPrompt(3, 12),
    },
    preparation: {
      1: buildPrepPrompt(1),
      2: buildPrepPrompt(2),
      3: buildPrepPrompt(3),
    },
    advanced: {
      1: buildAdvancedPrompt(1),
      2: buildAdvancedPrompt(2),
      3: buildAdvancedPrompt(3),
    },
  };

  const userPrompt = prompts[type]?.[difficulty] || prompts.preparation[1];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.9,
        max_tokens: 3000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(502).json({ error: err.error?.message || 'OpenAI API error', raw: err });
    }

    const data  = await response.json();
    const text  = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/* ---- Prompt Builders ---- */

function buildErrorPrompt(level, errorCount) {
  const companies = ['Sunset Bakery', 'Northgate Hardware', 'Maple Ridge Consulting', 'Lakeview Dental', 'Cedar Springs Auto', 'Hillcrest Flooring', 'Bayview Photography', 'Summit Landscaping'];
  const owners    = ['T. Nguyen', 'A. Okafor', 'M. Kowalski', 'S. Papadopoulos', 'J. Tremblay', 'R. Patel', 'C. Dubois', 'B. McIntyre'];
  const co = companies[Math.floor(Math.random() * companies.length)];
  const own = owners[Math.floor(Math.random() * owners.length)];

  return `Generate an error-finding question for a Grade 11 BAF3M classified balance sheet at difficulty level ${level}.

Company: "${co}", owner: "${own}". Pick a plausible date in December of a recent year.

STEP 1 — Build the CORRECT classified balance sheet first (all numbers must balance: Total Assets = Total L + OE).
STEP 2 — Introduce exactly ${errorCount} intentional errors by modifying the balance sheet. Choose from:
  - Wrong section (e.g., put a LT asset in Current Assets)
  - Wrong liquidity/useful-life ordering within a section
  - Math error in a subtotal or total
  - Missing subtotal line
  - Total not in far-right column position (mark with misplaced:true)
  - Incorrect or missing heading line (company name, "Balance Sheet", or date)
  - Current portion of LT debt not separated
  - A/R or A/P sub-accounts not in alphabetical order
  ${level >= 2 ? '- Net Income added instead of subtracted for Net Loss scenario' : ''}
  ${level >= 3 ? '- Mixed errors across heading, math, ordering AND classification in the same sheet' : ''}

Return ONLY this JSON (no other text):
{
  "type": "error_finding",
  "difficulty": ${level},
  "company": "...",
  "owner": "...",
  "date": "...",
  "instructions": "This classified balance sheet contains exactly ${errorCount} errors. Study it carefully and list every error you can find.",
  "erroneous_sheet": {
    "heading": ["CompanyName", "Balance Sheet", "As at Date"],
    "assets": {
      "current": [{ "name": "...", "indent": 0, "value": 0, "display": "..." }],
      "current_total": 0,
      "longterm": [{ "name": "...", "indent": 0, "value": 0, "display": "..." }],
      "longterm_total": 0,
      "total": 0
    },
    "liabilities": {
      "current": [{ "name": "...", "indent": 0, "value": 0, "display": "..." }],
      "current_total": 0,
      "longterm": [{ "name": "...", "indent": 0, "value": 0, "display": "..." }],
      "longterm_total": 0,
      "total": 0
    },
    "equity": {
      "items": [{ "name": "...", "value": 0, "display": "..." }],
      "total": 0
    },
    "total_liabilities_oe": 0
  },
  "errors": [
    { "id": 1, "location": "...", "description": "...", "correction": "..." }
  ]
}`;
}

function buildPrepPrompt(level) {
  const companies = ['Harborview Marine', 'Ironwood Carpentry', 'Rosewood Catering', 'Pinecrest Pharmacy', 'Goldstream Jewellers', 'Westport Printing', 'Clearwater Plumbing', 'Ridgeline Fitness'];
  const owners    = ['P. Santos', 'D. Lefebvre', 'O. Martins', 'Y. Yamamoto', 'H. Abramowitz', 'F. Nkemdirim', 'L. Bouchard', 'K. Arsenault'];
  const co  = companies[Math.floor(Math.random() * companies.length)];
  const own = owners[Math.floor(Math.random() * owners.length)];

  const complexity = {
    1: `5–7 accounts: Cash, 1 AR debtor, Supplies, 1 LT Asset, 1 AP creditor, 1 LTL, Capital. Simple round numbers.`,
    2: `9–11 accounts: Cash, 2 AR debtors, Prepaid, Supplies, Land, Equipment, 2 AP creditors, Mortgage, Capital, Drawings.`,
    3: `12–14 accounts: Cash, 3 AR debtors, Inventory, Prepaid, Supplies, Land, Building, Equipment, Automobile, 3 AP creditors, Bank Loan (current portion + LT portion), Mortgage, Capital, Net Income, Drawings.`,
  }[level];

  return `Generate a balance sheet PREPARATION question for Grade 11 BAF3M at difficulty level ${level}.

Company: "${co}", owner: "${own}". Pick a plausible December date.
Complexity: ${complexity}

The accounts must total correctly: Total Assets = Total L + OE.

Return ONLY this JSON:
{
  "type": "preparation",
  "difficulty": ${level},
  "company": "...",
  "owner": "...",
  "date": "...",
  "instructions": "Using the following accounts, prepare a properly formatted classified balance sheet for ${co} as at [date]. Ensure it is two-column, all sections are classified correctly, accounts are in the proper order within each section, subtotals are single-underlined, and grand totals are double-underlined.",
  "accounts": [
    { "name": "...", "value": 0, "correct_section": "CA|LTA|CL|LTL|OE", "correct_order": 1, "note": "optional hint" }
  ],
  "solution": {
    "assets": {
      "current": [{ "name": "...", "indent": 0, "value": 0 }],
      "current_total": 0,
      "longterm": [{ "name": "...", "indent": 0, "value": 0 }],
      "longterm_total": 0,
      "total": 0
    },
    "liabilities": {
      "current": [{ "name": "...", "indent": 0, "value": 0 }],
      "current_total": 0,
      "longterm": [{ "name": "...", "indent": 0, "value": 0 }],
      "longterm_total": 0,
      "total": 0
    },
    "equity": {
      "items": [{ "name": "...", "value": 0 }],
      "total": 0
    },
    "total_liabilities_oe": 0
  },
  "check": { "total_assets": 0, "total_loe": 0, "balanced": true }
}`;
}

function buildAdvancedPrompt(level) {
  const scenarios = [
    { name: 'Ridgeback Construction', owner: 'V. Ogundimu',  scenario: 'A construction company with a bank loan that has a current portion due this year, two sub-accounts under A/P (suppliers), three debtors under A/R, and the owner made an additional investment during the year.' },
    { name: 'Sunflower Interior Design', owner: 'T. Beaumont', scenario: 'An interior design firm where the owner took a significant drawing, there is unearned revenue (deposit from a client), prepaid insurance, and a 5-year mortgage with the first year classified as current.' },
    { name: 'Arctic Courier Services', owner: 'D. Solberg',   scenario: 'A courier business with a fleet of three vehicles at different stages of depreciation (shown at book value), a bank overdraft, wages payable, and a net loss reducing equity.' },
    { name: 'Cobalt Technology Repair', owner: 'E. Chukwuma', scenario: 'A tech repair shop with inventory, short-term investments, three debtors with different balances, a long-term lease obligation, and unearned revenue for a service contract.' },
  ];
  const s = scenarios[Math.floor(Math.random() * scenarios.length)];

  const extraComplexity = {
    1: 'Keep it approachable — 8–10 accounts, one advanced element.',
    2: 'Use 11–13 accounts, two advanced elements (e.g., current portion + multiple debtors).',
    3: 'Use 13–16 accounts, three or more advanced elements interwoven. Include a net loss, a current portion of LT debt, multiple debtors AND multiple creditors.',
  }[level];

  return `Generate an ADVANCED classified balance sheet preparation question for Grade 11 BAF3M at difficulty level ${level}.

Scenario: ${s.scenario}
Company: "${s.name}", owner: "${s.owner}". Pick a plausible December date.
${extraComplexity}

Advanced elements to include (pick appropriate ones for the difficulty):
- Bank loan with BOTH a current portion (due within 12 months) AND a long-term remainder
- Multiple named debtors under Accounts Receivable (alphabetical)
- Multiple named creditors under Accounts Payable (alphabetical)
- Owner investment or withdrawal affecting opening capital
- Net Loss scenario (reduces equity instead of adding)
- Unearned Revenue as a current liability

All numbers must balance: Total Assets = Total Liabilities + OE.

Return ONLY this JSON (same schema as preparation):
{
  "type": "advanced",
  "difficulty": ${level},
  "company": "...",
  "owner": "...",
  "date": "...",
  "scenario_context": "...",
  "instructions": "...",
  "accounts": [
    { "name": "...", "value": 0, "correct_section": "CA|LTA|CL|LTL|OE", "correct_order": 1, "note": "..." }
  ],
  "solution": {
    "assets": { "current": [], "current_total": 0, "longterm": [], "longterm_total": 0, "total": 0 },
    "liabilities": { "current": [], "current_total": 0, "longterm": [], "longterm_total": 0, "total": 0 },
    "equity": { "items": [], "total": 0 },
    "total_liabilities_oe": 0
  },
  "check": { "total_assets": 0, "total_loe": 0, "balanced": true },
  "advanced_notes": ["Explain each advanced element in plain English for the student"]
}`;
}
