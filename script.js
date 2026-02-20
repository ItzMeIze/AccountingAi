/* ============================================================
   BAF3M Classified Balance Sheet — JavaScript
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Reading progress bar ---------- */
  const progressBar = document.getElementById('readingProgress');
  if (progressBar) {
    const updateProgress = () => {
      const h   = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      progressBar.style.width = Math.min(pct, 100) + '%';
    };
    document.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ---------- Mobile nav toggle ---------- */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') navLinks.classList.remove('open');
  });

  /* ---------- Active nav highlight on scroll ---------- */
  const sections = document.querySelectorAll('.section');
  const navItems = document.querySelectorAll('#nav-links a');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navItems.forEach((a) => a.classList.remove('active'));
        const id = entry.target.id;
        const match = document.querySelector(`#nav-links a[href="#${id}"]`);
        if (match) match.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => observer.observe(s));

  /* ==========================================================
     TOOLTIP for Example Balance Sheet (Section 4)
     ========================================================== */
  const tooltip = document.getElementById('tooltip');
  document.querySelectorAll('[data-tip]').forEach((el) => {
    el.addEventListener('mouseenter', (e) => {
      tooltip.textContent = el.getAttribute('data-tip');
      tooltip.classList.remove('hidden');
      positionTooltip(e);
    });
    el.addEventListener('mousemove', positionTooltip);
    el.addEventListener('mouseleave', () => tooltip.classList.add('hidden'));
  });
  function positionTooltip(e) {
    const pad = 14;
    let x = e.clientX + pad;
    let y = e.clientY + pad;
    if (x + 310 > window.innerWidth) x = e.clientX - 310;
    if (y + 80 > window.innerHeight) y = e.clientY - 80;
    tooltip.style.left = x + 'px';
    tooltip.style.top  = y + 'px';
  }

  /* ==========================================================
     DRAG & DROP PRACTICE (Section 5)
     ========================================================== */

  /* -- Account data: New Western Company, December 31, 2008 --
     Correct order within each zone is enforced (order property).
     Total Assets = $217,956  |  Total L + OE = $217,956
  */
  const accounts = [
    // ── Current Assets (liquidity order: Cash → A/R header → A/R debtors alphabetically → Supplies)
    { name: 'Cash',                        value: 1636,   correct: 'CA',  order: 1,   tip: 'Cash is the most liquid asset — it IS money. Must always be listed FIRST in Current Assets.' },
    { name: 'Accounts Receivable',         value: 0,      correct: 'CA',  order: 2,   isHeader: true, tip: 'Drag this as the parent label above your A/R debtor sub-accounts, just like in class. Header rows have no dollar value — the individual debtors are listed and indented below.' },
    { name: 'A/R — H. Burns (debtor)',     value: 850,    correct: 'CA',  order: 3,   tip: 'H. Burns owes the company money — Accounts Receivable. A/R sub-accounts are listed alphabetically by debtor name.' },
    { name: 'A/R — J. Hoedl (debtor)',     value: 370,    correct: 'CA',  order: 4,   tip: 'J. Hoedl owes the company money — another A/R sub-account. Debtors listed alphabetically (Burns, Hoedl, Marshall).' },
    { name: 'A/R — D. Marshall (debtor)',  value: 1100,   correct: 'CA',  order: 5,   tip: 'D. Marshall owes the company money — another A/R sub-account. Listed last alphabetically under Accounts Receivable.' },
    { name: 'Supplies',                    value: 1200,   correct: 'CA',  order: 6,   tip: 'Supplies are used up within the year but are the least liquid Current Asset — always listed LAST in CA.' },
    // ── Long-Term Assets (longest useful life first: Land → Equipment → Vehicles)
    { name: 'Land',                        value: 160000, correct: 'LTA', order: 1,   tip: 'Land has an unlimited useful life and is NEVER depreciated. Always listed first in Long-Term Assets.' },
    { name: 'Furniture & Equipment',       value: 14700,  correct: 'LTA', order: 2,   tip: 'Furniture & Equipment is a capital asset used for many years. Listed after Land.' },
    { name: 'Delivery Equipment',          value: 20100,  correct: 'LTA', order: 3,   tip: 'Delivery Equipment is a vehicle-class capital asset. Listed before Automobile (longer useful life).' },
    { name: 'Automobile',                  value: 18000,  correct: 'LTA', order: 4,   tip: 'Automobile is a capital asset with a shorter useful life — listed last in Long-Term Assets.' },
    // ── Current Liabilities (A/P header first, then creditors alphabetically)
    { name: 'Accounts Payable',            value: 0,      correct: 'CL',  order: 1,   isHeader: true, tip: 'Drag this as the parent label above your A/P creditor sub-accounts, just like in class. Header rows have no dollar value — the individual creditors are listed and indented below.' },
    { name: 'A/P — Anglo Supply Co.',      value: 740,    correct: 'CL',  order: 2,   tip: 'Anglo Supply Co. is a creditor — the company owes them money. Accounts Payable, listed first (alphabetical).' },
    { name: 'A/P — W. Anno',               value: 1200,   correct: 'CL',  order: 3,   tip: 'W. Anno is a creditor — another A/P sub-account. Creditors listed alphabetically under A/P.' },
    { name: 'A/P — M. Benrubi',            value: 3000,   correct: 'CL',  order: 4,   tip: 'M. Benrubi is a creditor — another A/P sub-account. Largest individual creditor in this example.' },
    // ── Long-Term Liabilities (shorter term before longer term)
    { name: 'Bank Loan (3-year)',           value: 10000,  correct: 'LTL', order: 1, tip: 'A 3-year bank loan — due after one year. Long-Term Liability. Listed before Mortgage (shorter term).' },
    { name: 'Mortgage Payable',            value: 80500,  correct: 'LTL', order: 2, tip: 'Mortgage Payable is a long-term debt secured by property. The largest liability — listed last in LTL.' },
    // ── Owner's Equity
    { name: 'L. Borel, Capital',           value: 122516, correct: 'OE',  order: 1, tip: 'Lennox Borel\'s capital — the owner\'s equity in New Western Company. Assets ($217,956) − Liabilities ($95,440) = $122,516.' },
  ];

  const dragBank = document.getElementById('dragBank');
  const zones    = { CA: 'dropCA', LTA: 'dropLTA', CL: 'dropCL', LTL: 'dropLTL', OE: 'dropOE' };

  function buildDragItems() {
    dragBank.innerHTML = '';
    // Shuffle
    const shuffled = [...accounts].sort(() => Math.random() - 0.5);
    shuffled.forEach((acc, i) => {
      const el = document.createElement('div');
      el.className = 'drag-item';
      el.draggable = true;
      el.setAttribute('data-correct', acc.correct);
      el.setAttribute('data-index', i);
      el.setAttribute('data-value', acc.value);
      el.setAttribute('data-order', acc.order);
      el.setAttribute('data-correct', acc.correct);
      el.setAttribute('data-type', acc.name.startsWith('A/R') ? 'AR' : acc.name.startsWith('A/P') ? 'AP' : '');
      if (acc.isHeader) {
        el.setAttribute('data-is-header', 'true');
        el.classList.add('drag-item-header');
        el.innerHTML = `${acc.name} <span class="drag-header-label">(label — no $)</span><span class="drag-tip">${acc.tip}</span>`;
      } else {
        el.innerHTML = `${acc.name} <span class="drag-val">${formatDollar(acc.value)}</span>
          <span class="drag-tip">${acc.tip}</span>`;
      }
      el.addEventListener('dragstart', onDragStart);
      // Touch support
      el.addEventListener('touchstart', onTouchStart, { passive: false });
      dragBank.appendChild(el);
    });
  }

  function formatDollar(v) {
    const abs = Math.abs(v);
    const formatted = '$' + abs.toLocaleString();
    return v < 0 ? '(' + formatted + ')' : formatted;
  }

  /* Drag events */
  let draggedEl = null;

  function onDragStart(e) {
    draggedEl = e.target.closest('.drag-item');
    e.dataTransfer.effectAllowed = 'move';
  }

  Object.values(zones).forEach((id) => {
    const zone = document.getElementById(id);
    const list = zone.querySelector('.drop-list');
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      if (draggedEl) {
        list.appendChild(draggedEl);
        draggedEl = null;
        recalcTotals();
      }
    });
  });

  // Allow dropping back into bank
  dragBank.addEventListener('dragover', (e) => e.preventDefault());
  dragBank.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedEl) {
      dragBank.appendChild(draggedEl);
      draggedEl.classList.remove('correct-placement', 'wrong-placement');
      draggedEl = null;
      recalcTotals();
    }
  });

  /* Touch support for mobile drag */
  let touchItem = null;
  let touchClone = null;
  let touchOffsetX = 0;
  let touchOffsetY = 0;

  function onTouchStart(e) {
    touchItem = e.target.closest('.drag-item');
    if (!touchItem) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = touchItem.getBoundingClientRect();
    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;

    touchClone = touchItem.cloneNode(true);
    touchClone.style.position = 'fixed';
    touchClone.style.zIndex = '9999';
    touchClone.style.width = rect.width + 'px';
    touchClone.style.opacity = '0.85';
    touchClone.style.pointerEvents = 'none';
    document.body.appendChild(touchClone);
    moveTouchClone(touch);

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }

  function moveTouchClone(touch) {
    if (touchClone) {
      touchClone.style.left = (touch.clientX - touchOffsetX) + 'px';
      touchClone.style.top  = (touch.clientY - touchOffsetY) + 'px';
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    moveTouchClone(e.touches[0]);
  }

  function onTouchEnd(e) {
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    if (touchClone) { touchClone.remove(); touchClone = null; }
    if (!touchItem) return;
    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
    if (dropTarget) {
      const zone = dropTarget.closest('.drop-zone');
      const bank = dropTarget.closest('.drag-bank');
      if (zone) {
        zone.querySelector('.drop-list').appendChild(touchItem);
      } else if (bank) {
        bank.appendChild(touchItem);
        touchItem.classList.remove('correct-placement', 'wrong-placement');
      }
      recalcTotals();
    }
    touchItem = null;
  }

  /* Recalculate subtotals and totals */
  function recalcTotals() {
    let totalA = 0, totalLiab = 0, totalOE = 0;

    Object.entries(zones).forEach(([key, id]) => {
      const zone = document.getElementById(id);
      const items = zone.querySelectorAll('.drag-item');
      let sub = 0;
      items.forEach((item) => {
        if (item.getAttribute('data-is-header') === 'true') return; // label cards — no dollar value
        sub += Number(item.getAttribute('data-value'));
      });
      zone.querySelector('.sub-val').textContent = formatDollar(sub);

      if (key === 'CA' || key === 'LTA') totalA += sub;
      else if (key === 'CL' || key === 'LTL') totalLiab += sub;
      else totalOE += sub;
    });

    const totalLOE = totalLiab + totalOE;
    document.getElementById('totalAssets').textContent = formatDollar(totalA);
    const liabEl = document.getElementById('totalLiab');
    if (liabEl) liabEl.textContent = formatDollar(totalLiab);
    document.getElementById('totalLOE').textContent = formatDollar(totalLOE);
  }

  /* Check balance — validates classification AND ordering within each zone */
  document.getElementById('checkBalance').addEventListener('click', () => {
    const fb = document.getElementById('dragFeedback');
    fb.classList.remove('hidden', 'success', 'error', 'partial');

    // 1. Check placements
    let correctCount = 0;
    let totalCount   = 0;
    const allItems = document.querySelectorAll('.drop-zone .drag-item');

    allItems.forEach((item) => {
      if (item.getAttribute('data-is-header') === 'true') return; // skip label cards
      totalCount++;
      const correctZone = zones[item.getAttribute('data-correct')];
      const parentZone  = item.closest('.drop-zone');
      if (parentZone && parentZone.id === correctZone) {
        correctCount++;
        item.classList.add('correct-placement');
        item.classList.remove('wrong-placement');
      } else {
        item.classList.add('wrong-placement');
        item.classList.remove('correct-placement');
      }
    });

    // 2. Check ordering within each correctly-filled zone
    const realAccountCount = accounts.filter(a => !a.isHeader).length;
    let orderErrors = [];
    if (correctCount === totalCount && totalCount === realAccountCount) {
      Object.entries(zones).forEach(([key, id]) => {
        const zone = document.getElementById(id);
        // exclude header label cards from ordering check
        const items = [...zone.querySelectorAll('.drag-item')].filter(el => el.getAttribute('data-is-header') !== 'true');
        for (let i = 0; i < items.length - 1; i++) {
          const curOrder  = Number(items[i].getAttribute('data-order'));
          const nextOrder = Number(items[i + 1].getAttribute('data-order'));
          if (curOrder > nextOrder) {
            items[i].classList.add('wrong-placement');
            items[i + 1].classList.add('wrong-placement');
            orderErrors.push(key);
          }
        }
      });
    }

    // Items still in bank
    const bankItems = [...dragBank.querySelectorAll('.drag-item')]
                         .filter(el => el.getAttribute('data-is-header') !== 'true');
    const bankCount = bankItems.length;

    if (bankCount > 0) {
      fb.className = 'drag-feedback partial';
      fb.textContent = `You still have ${bankCount} account(s) in the bank. Drag them all into a zone first!`;
    } else if (correctCount === totalCount && totalCount === realAccountCount && orderErrors.length === 0) {
      const tA = document.getElementById('totalAssets').textContent;
      const tL = document.getElementById('totalLOE').textContent;
      if (tA === tL) {
        fb.className = 'drag-feedback success';
        fb.innerHTML = `&#10003; Perfect! All ${correctCount} accounts are correctly classified <strong>and in the right order</strong>. Balance sheet balances: ${tA} = ${tL}.`;
      } else {
        fb.className = 'drag-feedback error';
        fb.innerHTML = `Classifications are correct, but totals don't match: Assets ${tA} ≠ L &amp; OE ${tL}. Check your values.`;
      }
    } else if (orderErrors.length > 0) {
      const zoneNames = { CA: 'Current Assets', LTA: 'Long-Term Assets', CL: 'Current Liabilities', LTL: 'Long-Term Liabilities', OE: "Owner's Equity" };
      const names = [...new Set(orderErrors)].map(k => zoneNames[k]).join(', ');
      fb.className = 'drag-feedback partial';
      fb.innerHTML = `Placements are correct, but the <strong>order is wrong</strong> in: ${names}. Accounts must follow the rules (e.g., Cash first, Land first, liquidity order). Items highlighted in red.`;
    } else {
      fb.className = 'drag-feedback error';
      fb.innerHTML = `${correctCount} of ${totalCount} accounts are in the correct zone. Items outlined in <span style="color:var(--red)">red</span> are misplaced — try again!`;
    }
  });

  /* Reset */
  document.getElementById('resetDrag').addEventListener('click', () => {
    document.querySelectorAll('.drop-list .drag-item').forEach((item) => {
      item.classList.remove('correct-placement', 'wrong-placement');
      dragBank.appendChild(item);
    });
    recalcTotals();
    const fb = document.getElementById('dragFeedback');
    fb.classList.add('hidden');
  });

  // Init
  buildDragItems();

  /* ==========================================================
     COMMON MISTAKES accordion (Section 6)
     ========================================================== */
  document.querySelectorAll('.mistake-card').forEach((card) => {
    card.addEventListener('click', () => {
      const isOpen = card.getAttribute('data-open') === 'true';
      // Close all others
      document.querySelectorAll('.mistake-card').forEach((c) => c.setAttribute('data-open', 'false'));
      card.setAttribute('data-open', isOpen ? 'false' : 'true');
    });
  });

  /* ==========================================================
     QUIZ (Section 7)
     ========================================================== */
  const quizData = [
    {
      q: 'What does the accounting equation state?',
      opts: [
        'Assets = Liabilities − Owner\'s Equity',
        'Assets = Liabilities + Owner\'s Equity',
        'Assets + Liabilities = Owner\'s Equity',
        'Liabilities = Assets + Owner\'s Equity'
      ],
      answer: 1,
      explain: 'The accounting equation is Assets = Liabilities + Owner\'s Equity. Everything a business owns is funded by debts or the owner\'s investment.'
    },
    {
      q: 'Which item would be listed FIRST under Current Assets?',
      opts: ['Merchandise Inventory', 'Accounts Receivable', 'Cash', 'Prepaid Rent'],
      answer: 2,
      explain: 'Cash is the most liquid asset and is always listed first under Current Assets.'
    },
    {
      q: 'Land is classified as a:',
      opts: ['Current Asset', 'Long-Term Asset', 'Current Liability', 'Owner\'s Equity'],
      answer: 1,
      explain: 'Land is a long-term (capital/fixed) asset with an unlimited useful life. It is not intended for resale in normal operations.'
    },
    {
      q: 'Accounts Payable is a:',
      opts: ['Current Asset', 'Long-Term Asset', 'Current Liability', 'Long-Term Liability'],
      answer: 2,
      explain: 'Accounts Payable are amounts owed to suppliers, typically due within 30-60 days — making them a current liability.'
    },
    {
      q: 'How do you calculate Owner\'s Equity?',
      opts: [
        'Liabilities − Assets',
        'Assets + Liabilities',
        'Assets − Liabilities',
        'Liabilities Ã· Assets'
      ],
      answer: 2,
      explain: 'Owner\'s Equity = Assets − Liabilities. It represents what is left for the owner after all debts are paid.'
    },
    {
      q: 'The heading date on a balance sheet should be:',
      opts: [
        'A date range (e.g., "For the Year Ended Dec 31")',
        'A single date (e.g., "As at December 31, 2025")',
        'The fiscal year only (e.g., "2025")',
        'No date is needed'
      ],
      answer: 1,
      explain: 'A balance sheet is a snapshot of one specific moment in time — always use a single date like "As at December 31, 2025."'
    },
    {
      q: 'Drawings (withdrawals) affect Owner\'s Equity by:',
      opts: ['Increasing it', 'Decreasing it', 'Having no effect', 'Doubling it'],
      answer: 1,
      explain: 'Drawings reduce equity because the owner is taking assets out of the business for personal use.'
    },
    {
      q: 'A balance sheet that separates current and long-term items is called a:',
      opts: ['Simplified Balance Sheet', 'Classified Balance Sheet', 'Trial Balance', 'General Ledger'],
      answer: 1,
      explain: 'A classified balance sheet organizes assets and liabilities into current and long-term sub-categories for more detailed analysis.'
    },
    {
      q: 'Mortgage Payable (due in 10 years) is classified as:',
      opts: ['Current Liability', 'Long-Term Liability', 'Current Asset', 'Owner\'s Equity'],
      answer: 1,
      explain: 'A mortgage payable that is not due within one year is a long-term liability.'
    },
    {
      q: 'On a properly formatted balance sheet, the final totals should be:',
      opts: [
        'Single underlined',
        'Double underlined',
        'Bold only',
        'Left-aligned with no underline'
      ],
      answer: 1,
      explain: 'Final totals on a balance sheet receive a double underline. This signals that the column is complete and the figures are final.'
    }
  ];

  const quizContainer = document.getElementById('quizQuestions');
  quizData.forEach((item, qi) => {
    const card = document.createElement('div');
    card.className = 'q-card';
    card.setAttribute('data-qi', qi);

    let optsHTML = '';
    item.opts.forEach((opt, oi) => {
      optsHTML += `
        <label class="q-option">
          <input type="radio" name="q${qi}" value="${oi}">
          <span>${opt}</span>
        </label>`;
    });

    card.innerHTML = `
      <div class="q-text"><span class="q-num">${qi + 1}.</span> ${item.q}</div>
      <div class="q-options">${optsHTML}</div>
      <div class="q-explain">${item.explain}</div>`;

    // Highlight selected option
    card.querySelectorAll('.q-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        card.querySelectorAll('.q-option').forEach((o) => o.classList.remove('selected'));
        opt.classList.add('selected');
        opt.querySelector('input').checked = true;
      });
    });

    quizContainer.appendChild(card);
  });

  /* Submit quiz */
  document.getElementById('quizForm').addEventListener('submit', (e) => {
    e.preventDefault();
    let score = 0;

    quizData.forEach((item, qi) => {
      const card = quizContainer.querySelector(`[data-qi="${qi}"]`);
      const selected = card.querySelector(`input[name="q${qi}"]:checked`);
      const opts = card.querySelectorAll('.q-option');

      // Reset
      card.classList.remove('correct', 'incorrect');
      opts.forEach((o) => o.classList.remove('reveal-correct', 'reveal-wrong'));

      if (selected && Number(selected.value) === item.answer) {
        score++;
        card.classList.add('correct');
        opts[item.answer].classList.add('reveal-correct');
      } else {
        card.classList.add('incorrect');
        opts[item.answer].classList.add('reveal-correct');
        if (selected) {
          opts[Number(selected.value)].classList.add('reveal-wrong');
        }
      }
    });

    const pct = Math.round((score / quizData.length) * 100);
    const result = document.getElementById('quizResult');
    result.classList.remove('hidden', 'pass', 'fail');
    result.classList.add(pct >= 70 ? 'pass' : 'fail');
    result.innerHTML = `
      You scored <strong>${score} / ${quizData.length}</strong> (${pct}%)
      ${pct >= 70 ? '— Great job!' : '— Review the lesson above and try again.'}
      <div class="score-bar"><div class="score-fill" style="width:${pct}%;background:${pct >= 70 ? 'var(--green)' : 'var(--red)'}"></div></div>`;

    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });


  /* ==========================================================
     SECTION 8 — PRACTICE QUESTIONS CONTROLLER
     ========================================================== */
  (function initPracticeQuestions() {

    /* -- state ------------------------------------------------ */
    let currentType = 'preparation';
    let currentDiff = 1;
    let currentQ    = null;
    const classified = {};
    const sectionOrder = { CA:[], LTA:[], CL:[], LTL:[], OE:[] };

    const SECTION_ROW_ID = { CA:'aiRowCA', LTA:'aiRowLTA', CL:'aiRowCL', LTL:'aiRowLTL', OE:'aiRowOE' };
    const SECTION_LABEL  = { CA:'Current Asset', LTA:'Long-Term Asset', CL:'Current Liability', LTL:'Long-Term Liability', OE:"Owner's Equity" };

    /* -- type button toggles ---------------------------------- */
    document.querySelectorAll('.ai-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ai-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;
      });
    });

    const diffSel = document.getElementById('aiDiffSelect');
    if (diffSel) diffSel.addEventListener('change', () => { currentDiff = Number(diffSel.value); });

    el('aiGenerate')?.addEventListener('click', () => generateQuestion(currentType, currentDiff));
    el('aiShowHint')?.addEventListener('click', showHint);
    el('aiCheckAnswer')?.addEventListener('click', checkMyAnswer);
    el('aiRevealSolution')?.addEventListener('click', () => revealSolution(false));
    el('aiNewSame')?.addEventListener('click', () => generateQuestion(currentType, currentDiff));
    el('aiErrHint')?.addEventListener('click', showErrHint);
    el('aiCheckErrors')?.addEventListener('click', checkErrors);
    el('aiErrReveal')?.addEventListener('click', () => revealSolution(true));
    el('aiErrNewSame')?.addEventListener('click', () => generateQuestion(currentType, currentDiff));

    /* =========================================================
       QUESTION BANK — 3 per type (preparation, error_finding, advanced)
       ========================================================= */
    const questionBank = [

      /* ---------- PREPARATION Level 1 ---------- */
      {
        type:'preparation', difficulty:1,
        company:'Riverside Tutoring', owner:'K. Chen', date:'December 31, 2024',
        instructions:'Using the following accounts, prepare a properly formatted classified balance sheet for Riverside Tutoring as at December 31, 2024. Classify each account, arrange them in proper order within each section, and calculate all subtotals and grand totals.',
        accounts:[
          { name:'Cash',                      value:5200,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 B. Taylor',     value:1800,  correct_section:'CA',  correct_order:2 },
          { name:'Supplies',                   value:600,   correct_section:'CA',  correct_order:3 },
          { name:'Land',                       value:45000, correct_section:'LTA', correct_order:1 },
          { name:'Equipment',                  value:8400,  correct_section:'LTA', correct_order:2 },
          { name:'A/P \u2014 Office Depot',   value:3500,  correct_section:'CL',  correct_order:1 },
          { name:'Mortgage Payable',           value:25000, correct_section:'LTL', correct_order:1 },
          { name:'K. Chen, Capital',           value:32500, correct_section:'OE',  correct_order:1 },
        ],
        solution:{
          heading:['Riverside Tutoring','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:5200,indent:0},{name:'A/R \u2014 B. Taylor',value:1800,indent:0},{name:'Supplies',value:600,indent:0}],
            current_total:7600,
            longterm:[{name:'Land',value:45000,indent:0},{name:'Equipment',value:8400,indent:0}],
            longterm_total:53400,
            total:61000
          },
          liabilities:{
            current:[{name:'A/P \u2014 Office Depot',value:3500,indent:0}],
            current_total:3500,
            longterm:[{name:'Mortgage Payable',value:25000,indent:0}],
            longterm_total:25000,
            total:28500
          },
          equity:{items:[{name:'K. Chen, Capital, Dec. 31',value:32500}],total:32500},
          total_liabilities_oe:61000
        },
        check:{total_assets:61000,total_loe:61000,balanced:true}
      },

      /* ---------- PREPARATION Level 2 ---------- */
      {
        type:'preparation', difficulty:2,
        company:'Northside Plumbing', owner:'R. Patel', date:'December 31, 2024',
        instructions:'Prepare a classified balance sheet for Northside Plumbing as at December 31, 2024. Classify each account into the correct section, arrange accounts in proper order (liquidity for CA, useful life for LTA, alphabetical for A/R and A/P sub-accounts), and calculate all subtotals and grand totals.',
        accounts:[
          { name:'Cash',                         value:8900,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 J. Adams',         value:2100,  correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 T. Garcia',        value:1600,  correct_section:'CA',  correct_order:3 },
          { name:'Prepaid Insurance',             value:1200,  correct_section:'CA',  correct_order:4 },
          { name:'Supplies',                      value:800,   correct_section:'CA',  correct_order:5 },
          { name:'Land',                          value:60000, correct_section:'LTA', correct_order:1 },
          { name:'Equipment',                     value:22000, correct_section:'LTA', correct_order:2 },
          { name:'Vehicles',                      value:15000, correct_section:'LTA', correct_order:3 },
          { name:'A/P \u2014 BuildAll Supply',   value:4200,  correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Plumb Wholesale',   value:2800,  correct_section:'CL',  correct_order:2 },
          { name:'Mortgage Payable',              value:50000, correct_section:'LTL', correct_order:1 },
          { name:'R. Patel, Capital, Jan. 1',     value:59000, correct_section:'OE',  correct_order:1 },
          { name:'Less: R. Patel, Drawings',      value:-4400, correct_section:'OE',  correct_order:2 },
        ],
        solution:{
          heading:['Northside Plumbing','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:8900,indent:0},{name:'A/R \u2014 J. Adams',value:2100,indent:1},{name:'A/R \u2014 T. Garcia',value:1600,indent:1},{name:'Prepaid Insurance',value:1200,indent:0},{name:'Supplies',value:800,indent:0}],
            current_total:14600,
            longterm:[{name:'Land',value:60000,indent:0},{name:'Equipment',value:22000,indent:0},{name:'Vehicles',value:15000,indent:0}],
            longterm_total:97000,
            total:111600
          },
          liabilities:{
            current:[{name:'A/P \u2014 BuildAll Supply',value:4200,indent:1},{name:'A/P \u2014 Plumb Wholesale',value:2800,indent:1}],
            current_total:7000,
            longterm:[{name:'Mortgage Payable',value:50000,indent:0}],
            longterm_total:50000,
            total:57000
          },
          equity:{items:[{name:'R. Patel, Capital, Jan. 1',value:59000},{name:'Less: R. Patel, Drawings',value:-4400},{name:'R. Patel, Capital, Dec. 31',value:54600}],total:54600},
          total_liabilities_oe:111600
        },
        check:{total_assets:111600,total_loe:111600,balanced:true}
      },

      /* ---------- PREPARATION Level 3 ---------- */
      {
        type:'preparation', difficulty:3,
        company:'Highland Catering', owner:'M. Dubois', date:'December 31, 2024',
        instructions:'Prepare a classified balance sheet for Highland Catering as at December 31, 2024. This company has multiple debtors under Accounts Receivable and multiple creditors under Accounts Payable. List sub-accounts alphabetically, current assets by liquidity, and long-term assets by useful life (longest first). Include all subtotals and grand totals.',
        accounts:[
          { name:'Cash',                               value:12500,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 A. Franklin',            value:3200,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 C. Hernandez',           value:1800,   correct_section:'CA',  correct_order:3 },
          { name:'A/R \u2014 P. Singh',               value:2400,   correct_section:'CA',  correct_order:4 },
          { name:'Merchandise Inventory',               value:9600,   correct_section:'CA',  correct_order:5 },
          { name:'Prepaid Rent',                        value:3000,   correct_section:'CA',  correct_order:6 },
          { name:'Supplies',                            value:1500,   correct_section:'CA',  correct_order:7 },
          { name:'Land',                                value:75000,  correct_section:'LTA', correct_order:1 },
          { name:'Building',                            value:120000, correct_section:'LTA', correct_order:2 },
          { name:'Equipment',                           value:35000,  correct_section:'LTA', correct_order:3 },
          { name:'A/P \u2014 Culinary Supply Co.',     value:5400,   correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Fresh Foods Inc.',        value:3800,   correct_section:'CL',  correct_order:2 },
          { name:'A/P \u2014 Metro Linen Service',     value:2200,   correct_section:'CL',  correct_order:3 },
          { name:'Bank Loan (5-year)',                  value:40000,  correct_section:'LTL', correct_order:1 },
          { name:'Mortgage Payable',                    value:95000,  correct_section:'LTL', correct_order:2 },
          { name:'M. Dubois, Capital, Jan. 1',          value:90000,  correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                     value:35000,  correct_section:'OE',  correct_order:2 },
          { name:'Less: M. Dubois, Drawings',           value:-7400,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Highland Catering','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:12500,indent:0},{name:'A/R \u2014 A. Franklin',value:3200,indent:1},{name:'A/R \u2014 C. Hernandez',value:1800,indent:1},{name:'A/R \u2014 P. Singh',value:2400,indent:1},{name:'Merchandise Inventory',value:9600,indent:0},{name:'Prepaid Rent',value:3000,indent:0},{name:'Supplies',value:1500,indent:0}],
            current_total:34000,
            longterm:[{name:'Land',value:75000,indent:0},{name:'Building',value:120000,indent:0},{name:'Equipment',value:35000,indent:0}],
            longterm_total:230000,
            total:264000
          },
          liabilities:{
            current:[{name:'A/P \u2014 Culinary Supply Co.',value:5400,indent:1},{name:'A/P \u2014 Fresh Foods Inc.',value:3800,indent:1},{name:'A/P \u2014 Metro Linen Service',value:2200,indent:1}],
            current_total:11400,
            longterm:[{name:'Bank Loan (5-year)',value:40000,indent:0},{name:'Mortgage Payable',value:95000,indent:0}],
            longterm_total:135000,
            total:146400
          },
          equity:{items:[{name:'M. Dubois, Capital, Jan. 1',value:90000},{name:'Add: Net Income',value:35000},{name:'Less: M. Dubois, Drawings',value:-7400},{name:'M. Dubois, Capital, Dec. 31',value:117600}],total:117600},
          total_liabilities_oe:264000
        },
        check:{total_assets:264000,total_loe:264000,balanced:true}
      },

      /* ---------- ERROR FINDING Level 1 ---------- */
      {
        type:'error_finding', difficulty:1,
        company:'Sunny Day Cleaning', owner:'L. Tran', date:'December 31, 2024',
        instructions:'This classified balance sheet contains exactly 4 errors. Study it carefully and list every error you can find. Be specific \u2014 state what is wrong and where.',
        erroneous_sheet:{
          heading:['Sunny Day Cleaning','Income Statement','As at December 31, 2024'],
          assets:{
            current:[{name:'A/R \u2014 K. Moore',value:1200,indent:0},{name:'Cash',value:4800,indent:0},{name:'Supplies',value:500,indent:0}],
            current_total:6500,
            longterm:[{name:'Equipment',value:12000,indent:0},{name:'Land',value:30000,indent:0}],
            longterm_total:42000,
            total:48500
          },
          liabilities:{
            current:[{name:'A/P \u2014 CleanPro Supply',value:2800,indent:0},{name:'Wages Payable',value:1200,indent:0}],
            current_total:4000,
            longterm:[{name:'Bank Loan (3-year)',value:15000,indent:0}],
            longterm_total:15000,
            total:19000
          },
          equity:{items:[{name:'L. Tran, Capital, Jan. 1',value:32000},{name:'L. Tran, Drawings',value:2500,display:'$2,500'},{name:'L. Tran, Capital, Dec. 31',value:34500}],total:34500},
          total_liabilities_oe:53500
        },
        solution:{
          heading:['Sunny Day Cleaning','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:4800,indent:0},{name:'A/R \u2014 K. Moore',value:1200,indent:0},{name:'Supplies',value:500,indent:0}],
            current_total:6500,
            longterm:[{name:'Land',value:30000,indent:0},{name:'Equipment',value:12000,indent:0}],
            longterm_total:42000,
            total:48500
          },
          liabilities:{
            current:[{name:'A/P \u2014 CleanPro Supply',value:2800,indent:0},{name:'Wages Payable',value:1200,indent:0}],
            current_total:4000,
            longterm:[{name:'Bank Loan (3-year)',value:15000,indent:0}],
            longterm_total:15000,
            total:19000
          },
          equity:{items:[{name:'L. Tran, Capital, Jan. 1',value:32000},{name:'Less: L. Tran, Drawings',value:-2500},{name:'L. Tran, Capital, Dec. 31',value:29500}],total:29500},
          total_liabilities_oe:48500
        },
        errors:[
          {id:1, location:'Heading line 2', description:'Statement is titled "Income Statement" instead of "Balance Sheet".', correction:'Change heading to "Balance Sheet". A balance sheet reports assets, liabilities, and equity at a point in time.'},
          {id:2, location:'Current Assets', description:'A/R is listed before Cash. Cash must always be listed first (most liquid).', correction:'List Cash first, then Accounts Receivable, then Supplies.'},
          {id:3, location:'Long-Term Assets', description:'Equipment is listed before Land. Land has the longest useful life and must be first.', correction:'List Land first, then Equipment (ordered by useful life, longest first).'},
          {id:4, location:"Owner's Equity", description:'Drawings shown as positive $2,500 and added to Capital ($32,000 + $2,500 = $34,500). Drawings reduce equity.', correction:'Show Drawings as ($2,500) in brackets and subtract: $32,000 \u2212 $2,500 = $29,500.'},
        ],
        check:{total_assets:48500,total_loe:48500,balanced:true}
      },

      /* ---------- ERROR FINDING Level 2 ---------- */
      {
        type:'error_finding', difficulty:2,
        company:'Crestview Photography', owner:'J. Nakamura', date:'December 31, 2024',
        instructions:'This classified balance sheet contains exactly 6 errors. Study every line carefully \u2014 check the heading, ordering, classifications, and calculations. List each error you find.',
        erroneous_sheet:{
          heading:['Crestview Photography','Balance Sheet','For the Year Ended December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:6400,indent:0},{name:'A/R \u2014 H. Lee',value:2200,indent:1},{name:'A/R \u2014 D. Brown',value:1800,indent:1},{name:'Supplies',value:700,indent:0}],
            current_total:11100,
            longterm:[{name:'Building',value:35000,indent:0},{name:'Land',value:50000,indent:0},{name:'Equipment',value:18000,indent:0},{name:'Prepaid Insurance',value:900,indent:0}],
            longterm_total:103900,
            total:115000
          },
          liabilities:{
            current:[{name:'A/P \u2014 Photo Pro Supply',value:2100,indent:1},{name:'A/P \u2014 Camera World',value:3200,indent:1},{name:'Wages Payable',value:1700,indent:0}],
            current_total:7000,
            longterm:[{name:'Mortgage Payable',value:55000,indent:0}],
            longterm_total:55000,
            total:62000
          },
          equity:{items:[{name:'J. Nakamura, Capital, Jan. 1',value:49000},{name:'Less: Net Income',value:-9000,display:'($9,000)'},{name:'Less: J. Nakamura, Drawings',value:-5000},{name:'J. Nakamura, Capital, Dec. 31',value:35000}],total:35000},
          total_liabilities_oe:97000
        },
        solution:{
          heading:['Crestview Photography','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:6400,indent:0},{name:'A/R \u2014 D. Brown',value:1800,indent:1},{name:'A/R \u2014 H. Lee',value:2200,indent:1},{name:'Prepaid Insurance',value:900,indent:0},{name:'Supplies',value:700,indent:0}],
            current_total:12000,
            longterm:[{name:'Land',value:50000,indent:0},{name:'Building',value:35000,indent:0},{name:'Equipment',value:18000,indent:0}],
            longterm_total:103000,
            total:115000
          },
          liabilities:{
            current:[{name:'A/P \u2014 Camera World',value:3200,indent:1},{name:'A/P \u2014 Photo Pro Supply',value:2100,indent:1},{name:'Wages Payable',value:1700,indent:0}],
            current_total:7000,
            longterm:[{name:'Mortgage Payable',value:55000,indent:0}],
            longterm_total:55000,
            total:62000
          },
          equity:{items:[{name:'J. Nakamura, Capital, Jan. 1',value:49000},{name:'Add: Net Income',value:9000},{name:'Less: J. Nakamura, Drawings',value:-5000},{name:'J. Nakamura, Capital, Dec. 31',value:53000}],total:53000},
          total_liabilities_oe:115000
        },
        errors:[
          {id:1, location:'Heading line 3', description:'Date reads "For the Year Ended December 31, 2024". A balance sheet is a snapshot at one moment, not a period.', correction:'Change to "As at December 31, 2024".'},
          {id:2, location:'Current Assets', description:'A/R sub-debtors not in alphabetical order: H. Lee listed before D. Brown.', correction:'List A/R \u2014 D. Brown before A/R \u2014 H. Lee (alphabetical by last name).'},
          {id:3, location:'Long-Term Assets', description:'Prepaid Insurance is classified as a Long-Term Asset. Prepaid expenses are used up within one year.', correction:'Move Prepaid Insurance to Current Assets (after A/R, before Supplies).'},
          {id:4, location:'Long-Term Assets', description:'Building is listed before Land. Land has unlimited useful life and must always be listed first.', correction:'List Land first, then Building, then Equipment (ordered by useful life).'},
          {id:5, location:'Current Liabilities', description:'A/P sub-creditors not alphabetical: Photo Pro Supply listed before Camera World.', correction:'List A/P \u2014 Camera World before A/P \u2014 Photo Pro Supply.'},
          {id:6, location:"Owner's Equity", description:'Net Income is shown as "Less: Net Income ($9,000)" \u2014 it was subtracted instead of added. Net Income increases equity.', correction:'Show as "Add: Net Income $9,000" and add it to beginning capital.'},
        ],
        check:{total_assets:115000,total_loe:115000,balanced:true}
      },

      /* ---------- ERROR FINDING Level 3 ---------- */
      {
        type:'error_finding', difficulty:3,
        company:'Granite Ridge Landscaping', owner:'W. Chen', date:'December 31, 2024',
        instructions:'This classified balance sheet contains exactly 8 errors across headings, ordering, classifications, and calculations. Examine every detail and list all errors.',
        erroneous_sheet:{
          heading:['Granit Ridge Landscaping','Balance Sheet','As at December 31 2024'],
          assets:{
            current:[{name:'Cash',value:9500,indent:0},{name:'A/R \u2014 E. Baker',value:2800,indent:1},{name:'A/R \u2014 S. Park',value:3100,indent:1},{name:'A/R \u2014 M. Foster',value:1900,indent:1},{name:'Supplies',value:1100,indent:0},{name:'Merchandise Inventory',value:7200,indent:0}],
            current_total:25600,
            longterm:[{name:'Land',value:80000,indent:0},{name:'Building',value:55000,indent:0},{name:'Equipment',value:28000,indent:0},{name:'Vehicles',value:19000,indent:0}],
            longterm_total:183000,
            total:208600
          },
          liabilities:{
            current:[{name:'A/P \u2014 Garden Supply Co.',value:4500,indent:1},{name:'A/P \u2014 Stone Works Inc.',value:2100,indent:1},{name:'A/P \u2014 Green Earth Ltd.',value:3200,indent:1}],
            current_total:9800,
            longterm:[{name:'Mortgage Payable',value:70000,indent:0},{name:'Current Portion of Mortgage',value:6000,indent:0}],
            longterm_total:76000,
            total:85800
          },
          equity:{items:[{name:'W. Chen, Capital, Jan. 1',value:115000},{name:'Add: Net Income',value:14800},{name:'W. Chen, Drawings',value:8000,display:'$8,000'},{name:'W. Chen, Capital, Dec. 31',value:137800}],total:137800},
          total_liabilities_oe:223600
        },
        solution:{
          heading:['Granite Ridge Landscaping','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:9500,indent:0},{name:'A/R \u2014 E. Baker',value:2800,indent:1},{name:'A/R \u2014 M. Foster',value:1900,indent:1},{name:'A/R \u2014 S. Park',value:3100,indent:1},{name:'Merchandise Inventory',value:7200,indent:0},{name:'Supplies',value:1100,indent:0}],
            current_total:25600,
            longterm:[{name:'Land',value:80000,indent:0},{name:'Building',value:55000,indent:0},{name:'Equipment',value:28000,indent:0},{name:'Vehicles',value:19000,indent:0}],
            longterm_total:182000,
            total:207600
          },
          liabilities:{
            current:[{name:'A/P \u2014 Garden Supply Co.',value:4500,indent:1},{name:'A/P \u2014 Green Earth Ltd.',value:3200,indent:1},{name:'A/P \u2014 Stone Works Inc.',value:2100,indent:1},{name:'Current Portion of Mortgage',value:6000,indent:0}],
            current_total:15800,
            longterm:[{name:'Mortgage Payable',value:70000,indent:0}],
            longterm_total:70000,
            total:85800
          },
          equity:{items:[{name:'W. Chen, Capital, Jan. 1',value:115000},{name:'Add: Net Income',value:14800},{name:'Less: W. Chen, Drawings',value:-8000},{name:'W. Chen, Capital, Dec. 31',value:121800}],total:121800},
          total_liabilities_oe:207600
        },
        errors:[
          {id:1, location:'Heading line 1', description:'Company name misspelled: "Granit" instead of "Granite".', correction:'Correct to "Granite Ridge Landscaping".'},
          {id:2, location:'Heading line 3', description:'Date missing comma: "December 31 2024".', correction:'Write "As at December 31, 2024" with comma.'},
          {id:3, location:'Current Assets', description:'A/R \u2014 S. Park listed before A/R \u2014 M. Foster. Debtors must be alphabetical (Baker, Foster, Park).', correction:'Reorder: E. Baker, M. Foster, S. Park.'},
          {id:4, location:'Current Assets', description:'Supplies listed before Merchandise Inventory. Inventory comes before Supplies in liquidity order.', correction:'List Merchandise Inventory before Supplies.'},
          {id:5, location:'Long-Term Assets', description:'Total Long-Term Assets shows $183,000 instead of $182,000 (80,000 + 55,000 + 28,000 + 19,000 = 182,000).', correction:'Correct the subtotal to $182,000.'},
          {id:6, location:'Current Liabilities', description:'A/P creditors not alphabetical: Stone Works Inc. before Green Earth Ltd.', correction:'Reorder: Garden Supply Co., Green Earth Ltd., Stone Works Inc.'},
          {id:7, location:'Long-Term Liabilities', description:'Current Portion of Mortgage ($6,000) is in Long-Term Liabilities. It is due within one year.', correction:'Move Current Portion of Mortgage to Current Liabilities.'},
          {id:8, location:"Owner's Equity", description:'Drawings shown as positive $8,000. Drawings reduce equity and should be in brackets.', correction:'Show as "Less: W. Chen, Drawings ($8,000)" and subtract from equity.'},
        ],
        check:{total_assets:207600,total_loe:207600,balanced:true}
      },

      /* ---------- ADVANCED Level 1 ---------- */
      {
        type:'advanced', difficulty:1,
        company:'Summit Electrical Services', owner:'A. Morrison', date:'December 31, 2024',
        scenario_context:'Summit Electrical has a bank loan where the current portion (due within 12 months) must be separated from the long-term remainder.',
        instructions:'Prepare a classified balance sheet for Summit Electrical Services as at December 31, 2024. Note: the bank loan has a current portion that must be classified separately as a Current Liability.',
        advanced_notes:['The bank loan has two parts: $5,000 due this year (Current Liability) and $20,000 due after one year (Long-Term Liability). Always separate the current portion.'],
        accounts:[
          { name:'Cash',                                value:11300,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 P. Davies',               value:3500,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 R. Kim',                  value:2200,   correct_section:'CA',  correct_order:3 },
          { name:'Prepaid Insurance',                    value:1500,   correct_section:'CA',  correct_order:4 },
          { name:'Supplies',                             value:900,    correct_section:'CA',  correct_order:5 },
          { name:'Land',                                 value:65000,  correct_section:'LTA', correct_order:1 },
          { name:'Equipment',                            value:24000,  correct_section:'LTA', correct_order:2 },
          { name:'Vehicles',                             value:16000,  correct_section:'LTA', correct_order:3 },
          { name:'A/P \u2014 Circuit Supply Co.',       value:4800,   correct_section:'CL',  correct_order:1 },
          { name:'Current Portion of Bank Loan',         value:5000,   correct_section:'CL',  correct_order:2 },
          { name:'Bank Loan (remaining)',                value:20000,  correct_section:'LTL', correct_order:1 },
          { name:'A. Morrison, Capital, Jan. 1',         value:85000,  correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                      value:13100,  correct_section:'OE',  correct_order:2 },
          { name:'Less: A. Morrison, Drawings',          value:-3500,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Summit Electrical Services','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:11300,indent:0},{name:'A/R \u2014 P. Davies',value:3500,indent:1},{name:'A/R \u2014 R. Kim',value:2200,indent:1},{name:'Prepaid Insurance',value:1500,indent:0},{name:'Supplies',value:900,indent:0}],
            current_total:19400,
            longterm:[{name:'Land',value:65000,indent:0},{name:'Equipment',value:24000,indent:0},{name:'Vehicles',value:16000,indent:0}],
            longterm_total:105000,
            total:124400
          },
          liabilities:{
            current:[{name:'A/P \u2014 Circuit Supply Co.',value:4800,indent:1},{name:'Current Portion of Bank Loan',value:5000,indent:0}],
            current_total:9800,
            longterm:[{name:'Bank Loan (remaining)',value:20000,indent:0}],
            longterm_total:20000,
            total:29800
          },
          equity:{items:[{name:'A. Morrison, Capital, Jan. 1',value:85000},{name:'Add: Net Income',value:13100},{name:'Less: A. Morrison, Drawings',value:-3500},{name:'A. Morrison, Capital, Dec. 31',value:94600}],total:94600},
          total_liabilities_oe:124400
        },
        check:{total_assets:124400,total_loe:124400,balanced:true}
      },

      /* ---------- ADVANCED Level 2 ---------- */
      {
        type:'advanced', difficulty:2,
        company:'Bayview Interior Design', owner:'N. Johal', date:'December 31, 2024',
        scenario_context:'Bayview has multiple named debtors (A/R), multiple named creditors (A/P), and unearned revenue from a client deposit for a project not yet started.',
        instructions:'Prepare a classified balance sheet for Bayview Interior Design as at December 31, 2024. List all A/R sub-debtors and A/P sub-creditors alphabetically. Note that Unearned Revenue is a current liability.',
        advanced_notes:[
          'Accounts Receivable sub-accounts (debtors) must be listed alphabetically: Chen, Okafor, Richards.',
          'Accounts Payable sub-accounts (creditors) must be listed alphabetically: Design Warehouse, Fabric World, Paint Plus.',
          'Unearned Revenue represents a client deposit \u2014 the company owes either the service or a refund, making it a current liability.'
        ],
        accounts:[
          { name:'Cash',                                value:7600,   correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 L. Chen',                 value:2400,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 M. Okafor',               value:3100,   correct_section:'CA',  correct_order:3 },
          { name:'A/R \u2014 T. Richards',              value:1800,   correct_section:'CA',  correct_order:4 },
          { name:'Merchandise Inventory',                value:8500,   correct_section:'CA',  correct_order:5 },
          { name:'Prepaid Insurance',                    value:1200,   correct_section:'CA',  correct_order:6 },
          { name:'Supplies',                             value:600,    correct_section:'CA',  correct_order:7 },
          { name:'Land',                                 value:70000,  correct_section:'LTA', correct_order:1 },
          { name:'Building',                             value:45000,  correct_section:'LTA', correct_order:2 },
          { name:'Furniture & Fixtures',                 value:12000,  correct_section:'LTA', correct_order:3 },
          { name:'A/P \u2014 Design Warehouse',        value:5200,   correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Fabric World',             value:3400,   correct_section:'CL',  correct_order:2 },
          { name:'A/P \u2014 Paint Plus',               value:1800,   correct_section:'CL',  correct_order:3 },
          { name:'Unearned Revenue',                     value:2000,   correct_section:'CL',  correct_order:4 },
          { name:'Mortgage Payable',                     value:55000,  correct_section:'LTL', correct_order:1 },
          { name:'N. Johal, Capital, Jan. 1',            value:72000,  correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                      value:18200,  correct_section:'OE',  correct_order:2 },
          { name:'Less: N. Johal, Drawings',             value:-5400,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Bayview Interior Design','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:7600,indent:0},{name:'A/R \u2014 L. Chen',value:2400,indent:1},{name:'A/R \u2014 M. Okafor',value:3100,indent:1},{name:'A/R \u2014 T. Richards',value:1800,indent:1},{name:'Merchandise Inventory',value:8500,indent:0},{name:'Prepaid Insurance',value:1200,indent:0},{name:'Supplies',value:600,indent:0}],
            current_total:25200,
            longterm:[{name:'Land',value:70000,indent:0},{name:'Building',value:45000,indent:0},{name:'Furniture & Fixtures',value:12000,indent:0}],
            longterm_total:127000,
            total:152200
          },
          liabilities:{
            current:[{name:'A/P \u2014 Design Warehouse',value:5200,indent:1},{name:'A/P \u2014 Fabric World',value:3400,indent:1},{name:'A/P \u2014 Paint Plus',value:1800,indent:1},{name:'Unearned Revenue',value:2000,indent:0}],
            current_total:12400,
            longterm:[{name:'Mortgage Payable',value:55000,indent:0}],
            longterm_total:55000,
            total:67400
          },
          equity:{items:[{name:'N. Johal, Capital, Jan. 1',value:72000},{name:'Add: Net Income',value:18200},{name:'Less: N. Johal, Drawings',value:-5400},{name:'N. Johal, Capital, Dec. 31',value:84800}],total:84800},
          total_liabilities_oe:152200
        },
        check:{total_assets:152200,total_loe:152200,balanced:true}
      },

      /* ---------- ADVANCED Level 3 ---------- */
      {
        type:'advanced', difficulty:3,
        company:'Lakefront Construction', owner:'D. Solberg', date:'December 31, 2024',
        scenario_context:'Lakefront Construction had a net loss this period (expenses exceeded revenue). The mortgage has a current portion due this year. There are multiple debtors and creditors.',
        instructions:'Prepare a classified balance sheet for Lakefront Construction as at December 31, 2024. This is a challenging question: the company had a net loss (which reduces equity), the mortgage must be split into current and long-term portions, and all sub-accounts under A/R and A/P must be alphabetical.',
        advanced_notes:[
          'A net loss REDUCES equity. Show it as "Less: Net Loss" and subtract from beginning capital.',
          'The mortgage has been split: $8,000 due within 12 months (Current Liability) and $82,000 remaining (Long-Term Liability).',
          'Drawings also reduce equity. Both net loss and drawings are subtracted from beginning capital.'
        ],
        accounts:[
          { name:'Cash',                                value:14200,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 F. Alvarez',              value:4500,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 J. Brennan',              value:3200,   correct_section:'CA',  correct_order:3 },
          { name:'A/R \u2014 K. Yamamoto',             value:2800,   correct_section:'CA',  correct_order:4 },
          { name:'Merchandise Inventory',                value:11400,  correct_section:'CA',  correct_order:5 },
          { name:'Prepaid Rent',                         value:3600,   correct_section:'CA',  correct_order:6 },
          { name:'Supplies',                             value:1800,   correct_section:'CA',  correct_order:7 },
          { name:'Land',                                 value:95000,  correct_section:'LTA', correct_order:1 },
          { name:'Building',                             value:75000,  correct_section:'LTA', correct_order:2 },
          { name:'Equipment',                            value:32000,  correct_section:'LTA', correct_order:3 },
          { name:'Vehicles',                             value:24000,  correct_section:'LTA', correct_order:4 },
          { name:'A/P \u2014 Atlas Building Supply',    value:6800,   correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Concrete Plus Ltd.',       value:4200,   correct_section:'CL',  correct_order:2 },
          { name:'A/P \u2014 Rivera Hardware',          value:3000,   correct_section:'CL',  correct_order:3 },
          { name:'Wages Payable',                        value:2500,   correct_section:'CL',  correct_order:4 },
          { name:'Current Portion of Mortgage',          value:8000,   correct_section:'CL',  correct_order:5 },
          { name:'Bank Loan (5-year)',                   value:45000,  correct_section:'LTL', correct_order:1 },
          { name:'Mortgage Payable (remaining)',         value:82000,  correct_section:'LTL', correct_order:2 },
          { name:'D. Solberg, Capital, Jan. 1',          value:130000, correct_section:'OE',  correct_order:1 },
          { name:'Less: Net Loss',                       value:-5000,  correct_section:'OE',  correct_order:2 },
          { name:'Less: D. Solberg, Drawings',           value:-9000,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Lakefront Construction','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:14200,indent:0},{name:'A/R \u2014 F. Alvarez',value:4500,indent:1},{name:'A/R \u2014 J. Brennan',value:3200,indent:1},{name:'A/R \u2014 K. Yamamoto',value:2800,indent:1},{name:'Merchandise Inventory',value:11400,indent:0},{name:'Prepaid Rent',value:3600,indent:0},{name:'Supplies',value:1800,indent:0}],
            current_total:41500,
            longterm:[{name:'Land',value:95000,indent:0},{name:'Building',value:75000,indent:0},{name:'Equipment',value:32000,indent:0},{name:'Vehicles',value:24000,indent:0}],
            longterm_total:226000,
            total:267500
          },
          liabilities:{
            current:[{name:'A/P \u2014 Atlas Building Supply',value:6800,indent:1},{name:'A/P \u2014 Concrete Plus Ltd.',value:4200,indent:1},{name:'A/P \u2014 Rivera Hardware',value:3000,indent:1},{name:'Wages Payable',value:2500,indent:0},{name:'Current Portion of Mortgage',value:8000,indent:0}],
            current_total:24500,
            longterm:[{name:'Bank Loan (5-year)',value:45000,indent:0},{name:'Mortgage Payable (remaining)',value:82000,indent:0}],
            longterm_total:127000,
            total:151500
          },
          equity:{items:[{name:'D. Solberg, Capital, Jan. 1',value:130000},{name:'Less: Net Loss',value:-5000},{name:'Less: D. Solberg, Drawings',value:-9000},{name:'D. Solberg, Capital, Dec. 31',value:116000}],total:116000},
          total_liabilities_oe:267500
        },
        check:{total_assets:267500,total_loe:267500,balanced:true}
      },

    ]; /* end questionBank */

    /* =========================================================
       GENERATE — pick from local question bank
       ========================================================= */
    function generateQuestion(type, difficulty) {
      hideError();
      hide('aiWorkspace');

      const matches = questionBank.filter(q => q.type === type && q.difficulty === difficulty);
      if (!matches.length) {
        showError('No question found for that type and difficulty.');
        return;
      }
      const pick = matches[Math.floor(Math.random() * matches.length)];
      currentQ = JSON.parse(JSON.stringify(pick));
      renderQuestion(currentQ);
    }

    /* =========================================================
       RENDER QUESTION
       ========================================================= */
    function renderQuestion(q) {
      const typeLabels = { preparation:'Preparation', error_finding:'Error Finding', advanced:'Advanced' };
      const diffLabels = { 1:'Level 1 \u2014 Basic', 2:'Level 2 \u2014 Intermediate', 3:'Level 3 \u2014 Advanced' };
      setHTML('aiQMeta', `
        <span class="ai-q-meta-chip ai-chip-type">${typeLabels[q.type] || q.type}</span>
        <span class="ai-q-meta-chip ai-chip-diff">${diffLabels[q.difficulty] || 'Level ' + q.difficulty}</span>
        <span class="ai-q-meta-chip ai-chip-co">${q.company}</span>`);
      setText('aiQTitle', q.company + ' \u2014 ' + q.date);
      setText('aiQInstructions', q.instructions || '');

      const sn = el('aiScenarioNote');
      if (sn) {
        if (q.scenario_context) { sn.textContent = q.scenario_context; show(sn); }
        else hide(sn);
      }

      const anb = el('aiAdvancedNotes');
      if (anb) {
        if (q.advanced_notes?.length) {
          anb.innerHTML = q.advanced_notes.map(n => `<div class="ai-adv-note">${n}</div>`).join('');
          show(anb);
        } else hide(anb);
      }

      hide('aiBsBuilder'); hide('aiErrorPanel'); hide('aiSolutionPanel');
      hide('aiFeedbackPanel'); hide('aiErrFeedback');

      if (q.type === 'error_finding') {
        renderErrorQuestion(q);
      } else {
        renderBuilderQuestion(q);
      }

      show('aiWorkspace');
      el('aiWorkspace').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /* -- Preparation / Advanced -------------------------------- */
    function renderBuilderQuestion(q) {
      Object.keys(classified).forEach(k => delete classified[k]);
      Object.keys(sectionOrder).forEach(k => { sectionOrder[k] = []; });

      const hb = el('aiBSHeading');
      if (hb) hb.innerHTML = `
        <span class="ai-bs-hline ai-bs-hco">${q.company}</span>
        <span class="ai-bs-hline ai-bs-htit">Balance Sheet</span>
        <span class="ai-bs-hline ai-bs-hdate">As at ${q.date}</span>`;

      const cards = el('aiAcctCards');
      if (cards) {
        const shuffled = [...(q.accounts || [])].map((a, i) => ({ ...a, _idx: i }))
                           .sort(() => Math.random() - 0.5);
        cards.innerHTML = shuffled.map(a => buildAccountCard(a)).join('');
        cards.querySelectorAll('.ai-card-classify').forEach(sel => {
          sel.addEventListener('change', e => onClassify(e.target));
        });
      }

      Object.values(SECTION_ROW_ID).forEach(id => {
        const d = el(id);
        if (d) d.innerHTML = '<div class="ai-empty-hint">Classify accounts in Step 1 \u2191</div>';
      });

      ['inCA','inLTA','inTA','inCL','inLTL','inTL','inTLOE'].forEach(id => {
        const inp = el(id);
        if (inp) { inp.value = ''; inp.className = 'ai-amt-input'; }
      });
      el('inTA')?.classList.add('ai-grand-inp');
      el('inTLOE')?.classList.add('ai-grand-inp');

      hide('aiFeedbackPanel');
      show('aiBsBuilder');
    }

    function buildAccountCard(a) {
      const opts = [
        ['', '\u2014 classify this account \u2014'],
        ['CA',  'Current Asset'],
        ['LTA', 'Long-Term Asset'],
        ['CL',  'Current Liability'],
        ['LTL', 'Long-Term Liability'],
        ['OE',  "Owner's Equity"],
      ].map(([v, l]) => `<option value="${v}">${l}</option>`).join('');

      return `<div class="ai-acct-card" data-idx="${a._idx}" data-correct="${a.correct_section}" data-order="${a.correct_order || 0}">
        <div class="ai-card-top">
          <span class="ai-card-name">${a.name}</span>
          <span class="ai-card-amount">${fmtAI(a.value)}</span>
        </div>
        ${a.note ? `<div class="ai-card-note">${a.note}</div>` : ''}
        <select class="ai-card-classify" data-idx="${a._idx}" data-name="${a.name}" data-value="${a.value}">${opts}</select>
      </div>`;
    }

    /* -- Error finding ---------------------------------------- */
    function renderErrorQuestion(q) {
      el('aiErrorInput').value = '';
      renderBS(q.erroneous_sheet, 'aiErrorBS');
      hide('aiErrFeedback');
      show('aiErrorPanel');
    }

    /* =========================================================
       CLASSIFY DROPDOWN CHANGE
       ========================================================= */
    function onClassify(sel) {
      const idx    = Number(sel.dataset.idx);
      const newSec = sel.value;
      const oldSec = classified[idx] || '';

      if (oldSec && sectionOrder[oldSec]) {
        sectionOrder[oldSec] = sectionOrder[oldSec].filter(i => i !== idx);
      }

      classified[idx] = newSec;

      const card = el('aiAcctCards').querySelector(`[data-idx="${idx}"]`);
      if (card) {
        card.className = 'ai-acct-card' + (newSec ? ' cls-' + newSec : '');
        card.querySelectorAll('.ai-card-hint-badge,.ai-card-feedback').forEach(e => e.remove());
      }

      if (newSec && sectionOrder[newSec]) {
        sectionOrder[newSec].push(idx);
      }

      if (oldSec) refreshSectionRows(oldSec);
      if (newSec) refreshSectionRows(newSec);
    }

    function refreshSectionRows(sec) {
      const rowsDiv = el(SECTION_ROW_ID[sec]);
      if (!rowsDiv) return;
      const indices = sectionOrder[sec];
      if (!indices.length) {
        rowsDiv.innerHTML = '<div class="ai-empty-hint">Classify accounts in Step 1 \u2191</div>';
        return;
      }
      const q = currentQ;
      rowsDiv.innerHTML = indices.map(idx => {
        const a = q.accounts[idx];
        const indent = (a.name.includes('\u2014') || a.note) ? 'ind1' : '';
        return `<div class="ai-ibs-row ${indent}">
          <span class="ai-ibs-row-name">${a.name}</span>
          <span class="ai-ibs-row-amt">${fmtAI(a.value)}</span>
        </div>`;
      }).join('');
    }

    /* =========================================================
       SHOW HINT
       ========================================================= */
    function showHint() {
      if (!currentQ) return;
      const cards = el('aiAcctCards');
      if (!cards) return;
      cards.querySelectorAll('.ai-acct-card').forEach(card => {
        const correct = card.dataset.correct;
        card.querySelectorAll('.ai-card-hint-badge').forEach(e => e.remove());
        const badge = document.createElement('div');
        badge.className = `ai-card-hint-badge badge-${correct}`;
        badge.textContent = '\u2192 ' + (SECTION_LABEL[correct] || correct);
        card.appendChild(badge);
      });
    }

    function showErrHint() {
      if (!currentQ?.errors?.length) return;
      const hint = currentQ.errors[0];
      const fb = el('aiErrFeedback');
      if (!fb) return;
      fb.innerHTML = `<div class="ai-feedback-panel"><div class="ai-fb-header fb-fail">Hint \u2014 look here first:</div>
        <div class="ai-fb-items"><div class="ai-fb-item"><span class="ai-fb-icon">&#128269;</span>
        <span class="ai-fb-text">${hint.location}</span></div></div></div>`;
      show(fb);
    }

    /* =========================================================
       CHECK MY ANSWER
       ========================================================= */
    function checkMyAnswer() {
      if (!currentQ) return;
      const q   = currentQ;
      const sol = q.solution;
      const feedItems = [];
      let correct = 0, total = 0;

      (q.accounts || []).forEach((a, idx) => {
        total++;
        const chosen   = classified[idx] || '';
        const expected = a.correct_section;
        const card = el('aiAcctCards')?.querySelector(`[data-idx="${idx}"]`);
        card?.querySelectorAll('.ai-card-hint-badge,.ai-card-feedback,.card-correct,.card-wrong,.card-order-warn')
             .forEach(e => e.remove());
        if (!card) return;

        if (!chosen) {
          card.classList.remove('card-correct','card-wrong');
          feedItems.push({ icon:'&#9888;', text:`<strong>${a.name}</strong> \u2014 not yet classified.` });
        } else if (chosen === expected) {
          correct++;
          card.classList.add('card-correct');
          card.classList.remove('card-wrong','card-order-warn');
          const fb = mkFeedback('\u2713 Correct: ' + SECTION_LABEL[expected], 'fb-good');
          card.appendChild(fb);
        } else {
          card.classList.add('card-wrong');
          card.classList.remove('card-correct','card-order-warn');
          feedItems.push({ icon:'&#10007;', text:`<strong>${a.name}</strong> classified as <em>${SECTION_LABEL[chosen]}</em> \u2014 should be <em>${SECTION_LABEL[expected]}</em>.` });
          const fb = mkFeedback('\u2717 Should be: ' + SECTION_LABEL[expected], 'fb-bad');
          card.appendChild(fb);
        }
      });

      ['CA','LTA','CL','LTL','OE'].forEach(sec => {
        const placedIdxs = sectionOrder[sec];
        const correctInSec = (q.accounts || [])
          .map((a, i) => ({ ...a, _idx: i }))
          .filter(a => a.correct_section === sec)
          .sort((a, b) => (a.correct_order || 0) - (b.correct_order || 0));
        if (!correctInSec.length) return;
        const correctlyPlaced = placedIdxs.filter(i => (q.accounts[i]?.correct_section || '') === sec);
        if (correctlyPlaced.length < 2) return;
        const expectedOrder = correctInSec.map(a => a._idx);
        const isOrderCorrect = correctlyPlaced.every((idx, pos) => {
          return correctlyPlaced.slice(0, pos).every(prev => {
            return expectedOrder.indexOf(prev) < expectedOrder.indexOf(idx);
          });
        });
        if (!isOrderCorrect) {
          feedItems.push({
            icon: '&#128256;',
            text: `Accounts in <strong>${SECTION_LABEL[sec]}</strong> are not in the correct order. Expected: ${correctInSec.map(a => a.name).join(', ')}.`
          });
          correctlyPlaced.forEach((idx, pos) => {
            const expPos = expectedOrder.indexOf(idx);
            if (expPos !== pos) {
              const card = el('aiAcctCards')?.querySelector(`[data-idx="${idx}"]`);
              if (card) {
                card.classList.add('card-order-warn');
                card.classList.remove('card-correct');
                const fb = mkFeedback('\u26A0 Check ordering in this section', 'fb-order');
                card.appendChild(fb);
              }
            }
          });
        }
      });

      const checks = [
        { id:'inCA',   expected: sol?.assets?.current_total,      label:'Total Current Assets' },
        { id:'inLTA',  expected: sol?.assets?.longterm_total,     label:'Total Long-Term Assets' },
        { id:'inTA',   expected: sol?.assets?.total,              label:'Total Assets' },
        { id:'inCL',   expected: sol?.liabilities?.current_total, label:'Total Current Liabilities' },
        { id:'inLTL',  expected: sol?.liabilities?.longterm_total,label:'Total Long-Term Liabilities' },
        { id:'inTL',   expected: sol?.liabilities?.total,         label:'Total Liabilities' },
        { id:'inTLOE', expected: sol?.total_liabilities_oe,       label:"Total Liabilities & Owner's Equity" },
      ];
      checks.forEach(({ id, expected, label }) => {
        total++;
        const inp = el(id);
        if (!inp) return;
        const raw = inp.value.trim();
        if (!raw) {
          inp.classList.remove('inp-correct','inp-wrong');
          feedItems.push({ icon:'&#9888;', text:`<strong>${label}</strong> \u2014 not filled in.` });
          return;
        }
        const entered = parseAmt(raw);
        if (Math.abs(entered - expected) < 1) {
          correct++;
          inp.classList.add('inp-correct');
          inp.classList.remove('inp-wrong');
        } else {
          inp.classList.add('inp-wrong');
          inp.classList.remove('inp-correct');
          feedItems.push({ icon:'&#10007;', text:`<strong>${label}</strong>: you entered ${fmtAI(entered)}, correct is ${fmtAI(expected)}.` });
        }
      });

      const ta   = parseAmt(el('inTA')?.value   || '');
      const tloe = parseAmt(el('inTLOE')?.value || '');
      const balanced = (ta > 0 && tloe > 0 && Math.abs(ta - tloe) < 1);

      const score   = correct + '/' + total;
      const allGood = feedItems.length === 0;
      const header  = el('aiFbHeader');
      const items   = el('aiFbItems');
      const balDiv  = el('aiFbBalance');

      if (header) {
        header.innerHTML = allGood
          ? `<span class="ai-fb-score">&#127881; ${score}</span> All classifications and totals are correct!`
          : `<span class="ai-fb-score">${score}</span> Check the feedback below.`;
        header.className = 'ai-fb-header ' + (allGood ? 'fb-pass' : 'fb-fail');
      }
      if (items) {
        items.innerHTML = feedItems.length
          ? feedItems.map(f => `<div class="ai-fb-item"><span class="ai-fb-icon">${f.icon}</span><span class="ai-fb-text">${f.text}</span></div>`).join('')
          : '<div class="ai-fb-item"><span class="ai-fb-icon">&#10003;</span><span class="ai-fb-text">Every account is classified correctly and in the right order.</span></div>';
      }
      if (balDiv) {
        if (ta > 0 && tloe > 0) {
          balDiv.className = 'ai-fb-balance ' + (balanced ? 'fb-balanced' : 'fb-unbalanced');
          balDiv.innerHTML = balanced
            ? `&#10003; Balance check passed: Total Assets ${fmtAI(ta)} = Total L &amp; OE ${fmtAI(tloe)}`
            : `&#9888; Does not balance: Total Assets ${fmtAI(ta)} \u2260 Total L &amp; OE ${fmtAI(tloe)}.
               Difference: ${fmtAI(Math.abs(ta - tloe))}.
               <br><small>Check all classifications, subtotals, and that Total Assets = Total Current + Total Long-Term Assets.</small>`;
        } else {
          balDiv.className = 'ai-fb-balance';
          balDiv.innerHTML = '';
        }
      }

      show('aiFeedbackPanel');
      el('aiFeedbackPanel').scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    /* =========================================================
       CHECK ERRORS
       ========================================================= */
    function checkErrors() {
      if (!currentQ?.errors) return;
      const textarea = el('aiErrorInput');
      const lines    = (textarea?.value || '').split('\n').map(l => l.trim()).filter(Boolean);
      const total    = currentQ.errors.length;
      const found    = Math.min(lines.length, total);
      const pass     = found >= Math.ceil(total * 0.7);

      const fb = el('aiErrFeedback');
      if (!fb) return;
      fb.innerHTML = `<div class="ai-feedback-panel">
        <div class="ai-fb-header ${pass ? 'fb-pass':'fb-fail'}">
          <span class="ai-fb-score">${pass ? '&#127881;' : '&#128269;'} You identified ${lines.length} error${lines.length !== 1 ? 's' : ''}.</span>
          This question has ${total} errors. ${pass ? 'Great work! Click "See All Errors" to compare.' : 'Keep looking \u2014 try "Show Hint" for guidance.'}
        </div>
        <div class="ai-fb-items">
          ${lines.map((l,i) => `<div class="ai-fb-item"><span class="ai-fb-icon">${i < total ? '&#10003;' : '&#9888;'}</span>
            <span class="ai-fb-text">${l}</span></div>`).join('')}
          ${lines.length < total ? `<div class="ai-fb-item"><span class="ai-fb-icon">&#10067;</span>
            <span class="ai-fb-text">${total - lines.length} more error${total-lines.length!==1?'s':''} not yet found.</span></div>` : ''}
        </div>
      </div>`;
      show(fb);
      fb.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    /* =========================================================
       REVEAL SOLUTION
       ========================================================= */
    function revealSolution(isErrorFinding) {
      if (!currentQ) return;
      const q = currentQ;

      renderBS(q.solution, 'aiSolutionBS');

      const errList = el('aiErrorsList');
      if (errList && isErrorFinding && q.errors?.length) {
        errList.innerHTML = `<h4 style="padding:0 0 10px;font-size:.88rem;font-weight:800;color:var(--muted);">All ${q.errors.length} Errors Explained</h4>` +
          q.errors.map((e, i) => `<div class="ai-error-item">
            <div class="ai-err-num">${i+1}</div>
            <div class="ai-err-body">
              <div class="ai-err-loc">&#128269; ${e.location}</div>
              <div>${e.description}</div>
              <div class="ai-err-fix">&#10003; Correction: ${e.correction}</div>
            </div></div>`).join('');
        show(errList);
      } else if (errList) {
        hide(errList);
      }

      const banner = el('aiCheckBanner');
      if (banner) {
        const check = q.check || {};
        if (check.balanced != null) {
          banner.innerHTML = check.balanced
            ? `<span class="ai-check-pass">&#10003; Balanced \u2014 Total Assets ${fmtAI(check.total_assets)} = Total L &amp; OE ${fmtAI(check.total_loe)}</span>`
            : `<span class="ai-check-fail">&#9888; Does not balance: Assets ${fmtAI(check.total_assets)} \u2260 L&amp;OE ${fmtAI(check.total_loe)}</span>`;
        } else {
          banner.innerHTML = '';
        }
      }

      show('aiSolutionPanel');
      el('aiSolutionPanel').scrollIntoView({ behavior:'smooth', block:'start' });
    }

    /* =========================================================
       RENDER BALANCE SHEET
       ========================================================= */
    function renderBS(sheet, containerId) {
      if (!sheet) return;
      const wrap = el(containerId);
      if (!wrap) return;
      const a  = sheet.assets      || {};
      const l  = sheet.liabilities || {};
      const oe = sheet.equity      || {};
      const h  = sheet.heading     || [];

      wrap.innerHTML = `<div class="ai-bs-wrap">
        <div class="ai-bs-heading">
          ${h.map((line, i) => {
            const cls = i === 0 ? 'ai-bs-co' : i === 1 ? 'ai-bs-title' : 'ai-bs-date';
            return `<span class="ai-bs-hline ${cls}">${line}</span>`;
          }).join('')}
        </div>
        <div class="ai-bs-body">
          <div class="ai-bs-side">
            <div class="ai-bs-major ai-bs-blue">Assets</div>
            <div class="ai-bs-subhead">Current Assets</div>
            ${(a.current||[]).map(r=>bsRow(r)).join('')}
            <div class="ai-bs-subtot"><span>Total Current Assets</span><span class="ai-bs-su">${fmtAI(a.current_total)}</span></div>
            <div style="margin-top:12px"></div>
            <div class="ai-bs-subhead">Long&#8209;Term Assets</div>
            ${(a.longterm||[]).map(r=>bsRow(r)).join('')}
            <div class="ai-bs-subtot"><span>Total Long&#8209;Term Assets</span><span class="ai-bs-su">${fmtAI(a.longterm_total)}</span></div>
            <div class="ai-bs-grand"><span>Total Assets</span><span class="ai-bs-dbl">${fmtAI(a.total)}</span></div>
          </div>
          <div class="ai-bs-div"></div>
          <div class="ai-bs-side">
            <div class="ai-bs-major ai-bs-red">Liabilities</div>
            <div class="ai-bs-subhead">Current Liabilities</div>
            ${(l.current||[]).map(r=>bsRow(r)).join('')}
            <div class="ai-bs-subtot"><span>Total Current Liabilities</span><span class="ai-bs-su">${fmtAI(l.current_total)}</span></div>
            <div style="margin-top:12px"></div>
            <div class="ai-bs-subhead">Long&#8209;Term Liabilities</div>
            ${(l.longterm||[]).map(r=>bsRow(r)).join('')}
            <div class="ai-bs-subtot"><span>Total Long&#8209;Term Liabilities</span><span class="ai-bs-su">${fmtAI(l.longterm_total)}</span></div>
            <div class="ai-bs-sectot"><span>Total Liabilities</span><span class="ai-bs-su">${fmtAI(l.total)}</span></div>
            <div style="margin-top:12px"></div>
            <div class="ai-bs-major ai-bs-green">Owner&#x2019;s Equity</div>
            ${(oe.items||[]).map(r=>bsRow(r)).join('')}
            <div class="ai-bs-grand"><span>Total Liabilities &amp; Owner&#x2019;s Equity</span><span class="ai-bs-dbl">${fmtAI(sheet.total_liabilities_oe)}</span></div>
          </div>
        </div>
      </div>`;
    }

    function bsRow(r) {
      if (!r) return '';
      const cls = r.indent === 2 ? 'i2' : r.indent === 1 ? 'i1' : '';
      return `<div class="ai-bs-row ${cls}"><span>${r.name||''}</span><span class="ai-bs-amt">${r.display||fmtAI(r.value)}</span></div>`;
    }

    /* =========================================================
       HELPERS
       ========================================================= */
    function fmtAI(v) {
      if (v == null) return '$0';
      const n   = Number(v);
      const abs = Math.abs(n);
      const s   = '$' + abs.toLocaleString('en-CA', { minimumFractionDigits:0 });
      return n < 0 ? '(' + s + ')' : s;
    }

    function parseAmt(str) {
      if (!str) return 0;
      const neg = str.includes('(') || str.trim().startsWith('-');
      const clean = str.replace(/[$,()\s]/g, '');
      const num = Number(clean);
      return isNaN(num) ? 0 : (neg ? -Math.abs(num) : num);
    }

    function mkFeedback(text, cls) {
      const d = document.createElement('div');
      d.className = 'ai-card-feedback ' + cls;
      d.textContent = text;
      return d;
    }

    function el(id)         { return document.getElementById(id); }
    function show(idOrEl)   { const e = typeof idOrEl === 'string' ? el(idOrEl) : idOrEl; if (e) e.classList.remove('hidden'); }
    function hide(idOrEl)   { const e = typeof idOrEl === 'string' ? el(idOrEl) : idOrEl; if (e) e.classList.add('hidden'); }
    function setText(id, t) { const e = el(id); if (e) e.textContent = t; }
    function setHTML(id, h) { const e = el(id); if (e) e.innerHTML = h; }

    function setLoading(on) {
      el('aiLoading')?.classList.toggle('hidden', !on);
      const btn = el('aiGenerate');
      if (btn) btn.disabled = on;
    }

    function showError(msg) {
      const e = el('aiErrorMsg');
      if (e) { e.textContent = '\u26A0 ' + msg; e.classList.remove('hidden'); }
    }

    function hideError() {
      el('aiErrorMsg')?.classList.add('hidden');
    }

  })();


})();
