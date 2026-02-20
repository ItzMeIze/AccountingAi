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

    // 1. Check placements (includes header cards like A/R, A/P labels)
    let correctCount = 0;
    let totalCount   = 0;
    const allItems = document.querySelectorAll('.drop-zone .drag-item');

    allItems.forEach((item) => {
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

    // 2. Check ordering within each correctly-filled zone (headers included — they must be in position)
    const realAccountCount = accounts.length;
    let orderErrors = [];
    if (correctCount === totalCount && totalCount === realAccountCount) {
      Object.entries(zones).forEach(([key, id]) => {
        const zone = document.getElementById(id);
        const items = [...zone.querySelectorAll('.drag-item')];
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

    // Items still in bank (including headers)
    const bankItems = [...dragBank.querySelectorAll('.drag-item')];
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

      /* ---------- NEW WEST PDF SET — PREPARATION Level 1 ---------- */
      {
        source:'pdf_new_west',
        source_label:'PDF Set: New Western Company',
        type:'preparation', difficulty:1,
        company:'New Western Company', owner:'L. Borel', date:'December 31, 2008',
        instructions:'Using the account list from the New Western Company extra-practice PDF, prepare a correctly formatted classified balance sheet as at December 31, 2008. Classify each account, place them in the correct order within each section, and calculate all subtotals and totals.',
        accounts:[
          { name:'Cash',                        value:1636,   correct_section:'CA',  correct_order:1 },
          { name:'A/R — H. Burns (debtor)',     value:850,    correct_section:'CA',  correct_order:2 },
          { name:'A/R — J. Hoedl (debtor)',     value:370,    correct_section:'CA',  correct_order:3 },
          { name:'A/R — D. Marshall (debtor)',  value:1100,   correct_section:'CA',  correct_order:4 },
          { name:'Supplies',                    value:1200,   correct_section:'CA',  correct_order:5 },
          { name:'Land',                        value:160000, correct_section:'LTA', correct_order:1 },
          { name:'Furniture & Equipment',       value:14700,  correct_section:'LTA', correct_order:2 },
          { name:'Delivery Equipment',          value:20100,  correct_section:'LTA', correct_order:3 },
          { name:'Automobile',                  value:18000,  correct_section:'LTA', correct_order:4 },
          { name:'A/P — Anglo Supply Co.',      value:740,    correct_section:'CL',  correct_order:1 },
          { name:'A/P — W. Anno',               value:1200,   correct_section:'CL',  correct_order:2 },
          { name:'A/P — M. Benrubi',            value:3000,   correct_section:'CL',  correct_order:3 },
          { name:'Bank Loan (3-year)',          value:10000,  correct_section:'LTL', correct_order:1 },
          { name:'Mortgage Payable',            value:80500,  correct_section:'LTL', correct_order:2 },
          { name:'L. Borel, Capital',           value:122516, correct_section:'OE',  correct_order:1 },
        ],
        solution:{
          heading:['New Western Company','Balance Sheet','As at December 31, 2008'],
          assets:{
            current:[{name:'Cash',value:1636,indent:0},{name:'A/R — H. Burns (debtor)',value:850,indent:1},{name:'A/R — J. Hoedl (debtor)',value:370,indent:1},{name:'A/R — D. Marshall (debtor)',value:1100,indent:1},{name:'Supplies',value:1200,indent:0}],
            current_total:5156,
            longterm:[{name:'Land',value:160000,indent:0},{name:'Furniture & Equipment',value:14700,indent:0},{name:'Delivery Equipment',value:20100,indent:0},{name:'Automobile',value:18000,indent:0}],
            longterm_total:212800,
            total:217956
          },
          liabilities:{
            current:[{name:'A/P — Anglo Supply Co.',value:740,indent:1},{name:'A/P — W. Anno',value:1200,indent:1},{name:'A/P — M. Benrubi',value:3000,indent:1}],
            current_total:4940,
            longterm:[{name:'Bank Loan (3-year)',value:10000,indent:0},{name:'Mortgage Payable',value:80500,indent:0}],
            longterm_total:90500,
            total:95440
          },
          equity:{items:[{name:'L. Borel, Capital',value:122516}],total:122516},
          total_liabilities_oe:217956
        },
        check:{total_assets:217956,total_loe:217956,balanced:true}
      },

      /* ---------- NEW WEST PDF SET — ERROR FINDING Level 2 ---------- */
      {
        source:'pdf_new_west',
        source_label:'PDF Set: New Western Company',
        type:'error_finding', difficulty:2,
        company:'New Western Company', owner:'L. Borel', date:'December 31, 2008',
        instructions:'This New Western Company sheet (from the PDF data set) contains exactly 5 errors. Find all heading and ordering errors and explain what should be corrected.',
        erroneous_sheet:{
          heading:['New Western Company','Income Statement','As at December 31, 2008'],
          assets:{
            current:[{name:'A/R — D. Marshall (debtor)',value:1100,indent:1},{name:'Cash',value:1636,indent:0},{name:'A/R — H. Burns (debtor)',value:850,indent:1},{name:'A/R — J. Hoedl (debtor)',value:370,indent:1},{name:'Supplies',value:1200,indent:0}],
            current_total:5156,
            longterm:[{name:'Automobile',value:18000,indent:0},{name:'Delivery Equipment',value:20100,indent:0},{name:'Furniture & Equipment',value:14700,indent:0},{name:'Land',value:160000,indent:0}],
            longterm_total:212800,
            total:217956
          },
          liabilities:{
            current:[{name:'A/P — W. Anno',value:1200,indent:1},{name:'A/P — M. Benrubi',value:3000,indent:1},{name:'A/P — Anglo Supply Co.',value:740,indent:1}],
            current_total:4940,
            longterm:[{name:'Mortgage Payable',value:80500,indent:0},{name:'Bank Loan (3-year)',value:10000,indent:0}],
            longterm_total:90500,
            total:95440
          },
          equity:{items:[{name:'L. Borel, Capital',value:122516}],total:122516},
          total_liabilities_oe:217956
        },
        solution:{
          heading:['New Western Company','Balance Sheet','As at December 31, 2008'],
          assets:{
            current:[{name:'Cash',value:1636,indent:0},{name:'A/R — H. Burns (debtor)',value:850,indent:1},{name:'A/R — J. Hoedl (debtor)',value:370,indent:1},{name:'A/R — D. Marshall (debtor)',value:1100,indent:1},{name:'Supplies',value:1200,indent:0}],
            current_total:5156,
            longterm:[{name:'Land',value:160000,indent:0},{name:'Furniture & Equipment',value:14700,indent:0},{name:'Delivery Equipment',value:20100,indent:0},{name:'Automobile',value:18000,indent:0}],
            longterm_total:212800,
            total:217956
          },
          liabilities:{
            current:[{name:'A/P — Anglo Supply Co.',value:740,indent:1},{name:'A/P — W. Anno',value:1200,indent:1},{name:'A/P — M. Benrubi',value:3000,indent:1}],
            current_total:4940,
            longterm:[{name:'Bank Loan (3-year)',value:10000,indent:0},{name:'Mortgage Payable',value:80500,indent:0}],
            longterm_total:90500,
            total:95440
          },
          equity:{items:[{name:'L. Borel, Capital',value:122516}],total:122516},
          total_liabilities_oe:217956
        },
        errors:[
          {id:1, location:'Heading line 2', description:'Statement title is "Income Statement".', correction:'Change heading line 2 to "Balance Sheet".'},
          {id:2, location:'Current Assets', description:'Cash is not listed first; A/R — D. Marshall appears before Cash.', correction:'List Cash first, then Accounts Receivable sub-accounts, then Supplies.'},
          {id:3, location:'Long-Term Assets', description:'Long-term assets are reversed from useful-life order (Automobile first, Land last).', correction:'List Land first, then Furniture & Equipment, then Delivery Equipment, then Automobile.'},
          {id:4, location:'Current Liabilities', description:'A/P creditors are not in alphabetical order.', correction:'Reorder as Anglo Supply Co., W. Anno, then M. Benrubi.'},
          {id:5, location:'Long-Term Liabilities', description:'Mortgage is listed before the 3-year bank loan; shorter-term long-term debt should be listed first.', correction:'List Bank Loan (3-year) before Mortgage Payable.'},
        ],
        check:{total_assets:217956,total_loe:217956,balanced:true}
      },

      /* ---------- NEW WEST PDF SET — ADVANCED Level 3 ---------- */
      {
        source:'pdf_new_west',
        source_label:'PDF Set: New Western Company',
        type:'advanced', difficulty:3,
        company:'New Western Company', owner:'L. Borel', date:'December 31, 2008',
        scenario_context:'Use the PDF account list and present grouped receivable/payable headings: place "Accounts Receivable" above debtor sub-accounts and "Accounts Payable" above creditor sub-accounts.',
        instructions:'Prepare a classified balance sheet for New Western Company as at December 31, 2008. Include A/R and A/P group labels in the correct sections, place debtor/creditor sub-accounts correctly, and ensure totals balance.',
        advanced_notes:[
          'Current Assets order: Cash, Accounts Receivable (heading), debtors (Burns, Hoedl, Marshall), then Supplies.',
          'Current Liabilities order: Accounts Payable (heading), then creditors (Anglo Supply Co., W. Anno, M. Benrubi).',
          'Long-Term Assets: Land first, then Furniture & Equipment, Delivery Equipment, and Automobile.'
        ],
        accounts:[
          { name:'Cash',                        value:1636,   correct_section:'CA',  correct_order:1 },
          { name:'Accounts Receivable',         value:0,      correct_section:'CA',  correct_order:2 },
          { name:'A/R — H. Burns (debtor)',     value:850,    correct_section:'CA',  correct_order:3 },
          { name:'A/R — J. Hoedl (debtor)',     value:370,    correct_section:'CA',  correct_order:4 },
          { name:'A/R — D. Marshall (debtor)',  value:1100,   correct_section:'CA',  correct_order:5 },
          { name:'Supplies',                    value:1200,   correct_section:'CA',  correct_order:6 },
          { name:'Land',                        value:160000, correct_section:'LTA', correct_order:1 },
          { name:'Furniture & Equipment',       value:14700,  correct_section:'LTA', correct_order:2 },
          { name:'Delivery Equipment',          value:20100,  correct_section:'LTA', correct_order:3 },
          { name:'Automobile',                  value:18000,  correct_section:'LTA', correct_order:4 },
          { name:'Accounts Payable',            value:0,      correct_section:'CL',  correct_order:1 },
          { name:'A/P — Anglo Supply Co.',      value:740,    correct_section:'CL',  correct_order:2 },
          { name:'A/P — W. Anno',               value:1200,   correct_section:'CL',  correct_order:3 },
          { name:'A/P — M. Benrubi',            value:3000,   correct_section:'CL',  correct_order:4 },
          { name:'Bank Loan (3-year)',          value:10000,  correct_section:'LTL', correct_order:1 },
          { name:'Mortgage Payable',            value:80500,  correct_section:'LTL', correct_order:2 },
          { name:'L. Borel, Capital',           value:122516, correct_section:'OE',  correct_order:1 },
        ],
        solution:{
          heading:['New Western Company','Balance Sheet','As at December 31, 2008'],
          assets:{
            current:[{name:'Cash',value:1636,indent:0},{name:'Accounts Receivable',value:0,indent:0},{name:'A/R — H. Burns (debtor)',value:850,indent:1},{name:'A/R — J. Hoedl (debtor)',value:370,indent:1},{name:'A/R — D. Marshall (debtor)',value:1100,indent:1},{name:'Supplies',value:1200,indent:0}],
            current_total:5156,
            longterm:[{name:'Land',value:160000,indent:0},{name:'Furniture & Equipment',value:14700,indent:0},{name:'Delivery Equipment',value:20100,indent:0},{name:'Automobile',value:18000,indent:0}],
            longterm_total:212800,
            total:217956
          },
          liabilities:{
            current:[{name:'Accounts Payable',value:0,indent:0},{name:'A/P — Anglo Supply Co.',value:740,indent:1},{name:'A/P — W. Anno',value:1200,indent:1},{name:'A/P — M. Benrubi',value:3000,indent:1}],
            current_total:4940,
            longterm:[{name:'Bank Loan (3-year)',value:10000,indent:0},{name:'Mortgage Payable',value:80500,indent:0}],
            longterm_total:90500,
            total:95440
          },
          equity:{items:[{name:'L. Borel, Capital',value:122516}],total:122516},
          total_liabilities_oe:217956
        },
        check:{total_assets:217956,total_loe:217956,balanced:true}
      },

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

      /* ============================================================
         ADDITIONAL QUESTIONS — 3+ per type × difficulty
         ============================================================ */

      /* ---------- PREPARATION Level 1 — #3: Maple Leaf Pet Grooming ---------- */
      {
        type:'preparation', difficulty:1,
        company:'Maple Leaf Pet Grooming', owner:'S. Dhillon', date:'December 31, 2024',
        instructions:'Using the following accounts, prepare a properly formatted classified balance sheet for Maple Leaf Pet Grooming as at December 31, 2024. Classify each account, arrange them in proper order, and calculate all subtotals and totals.',
        accounts:[
          { name:'Cash',                          value:3800,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 T. Novak',          value:950,   correct_section:'CA',  correct_order:2 },
          { name:'Supplies',                       value:420,   correct_section:'CA',  correct_order:3 },
          { name:'Land',                           value:38000, correct_section:'LTA', correct_order:1 },
          { name:'Grooming Equipment',             value:6200,  correct_section:'LTA', correct_order:2 },
          { name:'A/P \u2014 Pet Supply Depot',   value:2700,  correct_section:'CL',  correct_order:1 },
          { name:'Bank Loan (2-year)',             value:12000, correct_section:'LTL', correct_order:1 },
          { name:'S. Dhillon, Capital',            value:34670, correct_section:'OE',  correct_order:1 },
        ],
        solution:{
          heading:['Maple Leaf Pet Grooming','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:3800,indent:0},{name:'A/R \u2014 T. Novak',value:950,indent:0},{name:'Supplies',value:420,indent:0}],
            current_total:5170,
            longterm:[{name:'Land',value:38000,indent:0},{name:'Grooming Equipment',value:6200,indent:0}],
            longterm_total:44200,
            total:49370
          },
          liabilities:{
            current:[{name:'A/P \u2014 Pet Supply Depot',value:2700,indent:0}],
            current_total:2700,
            longterm:[{name:'Bank Loan (2-year)',value:12000,indent:0}],
            longterm_total:12000,
            total:14700
          },
          equity:{items:[{name:'S. Dhillon, Capital, Dec. 31',value:34670}],total:34670},
          total_liabilities_oe:49370
        },
        check:{total_assets:49370,total_loe:49370,balanced:true}
      },

      /* ---------- PREPARATION Level 2 — #2: Oakville Auto Repair ---------- */
      {
        type:'preparation', difficulty:2,
        company:'Oakville Auto Repair', owner:'J. Moreau', date:'December 31, 2024',
        instructions:'Prepare a classified balance sheet for Oakville Auto Repair as at December 31, 2024. Classify each account, arrange current assets by liquidity, long-term assets by useful life (longest first), and sub-accounts alphabetically.',
        accounts:[
          { name:'Cash',                           value:7600,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 B. Khalil',          value:1900,  correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 N. Wong',            value:2400,  correct_section:'CA',  correct_order:3 },
          { name:'Prepaid Insurance',               value:1100,  correct_section:'CA',  correct_order:4 },
          { name:'Supplies',                        value:850,   correct_section:'CA',  correct_order:5 },
          { name:'Land',                            value:55000, correct_section:'LTA', correct_order:1 },
          { name:'Building',                        value:40000, correct_section:'LTA', correct_order:2 },
          { name:'Tools & Equipment',               value:18500, correct_section:'LTA', correct_order:3 },
          { name:'A/P \u2014 AutoParts Wholesale', value:3600,  correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Lube Supply Inc.',    value:2200,  correct_section:'CL',  correct_order:2 },
          { name:'Mortgage Payable',                value:65000, correct_section:'LTL', correct_order:1 },
          { name:'J. Moreau, Capital, Jan. 1',      value:48000, correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                  value:12100, correct_section:'OE',  correct_order:2 },
          { name:'Less: J. Moreau, Drawings',       value:-3550, correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Oakville Auto Repair','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:7600,indent:0},{name:'A/R \u2014 B. Khalil',value:1900,indent:1},{name:'A/R \u2014 N. Wong',value:2400,indent:1},{name:'Prepaid Insurance',value:1100,indent:0},{name:'Supplies',value:850,indent:0}],
            current_total:13850,
            longterm:[{name:'Land',value:55000,indent:0},{name:'Building',value:40000,indent:0},{name:'Tools & Equipment',value:18500,indent:0}],
            longterm_total:113500,
            total:127350
          },
          liabilities:{
            current:[{name:'A/P \u2014 AutoParts Wholesale',value:3600,indent:1},{name:'A/P \u2014 Lube Supply Inc.',value:2200,indent:1}],
            current_total:5800,
            longterm:[{name:'Mortgage Payable',value:65000,indent:0}],
            longterm_total:65000,
            total:70800
          },
          equity:{items:[{name:'J. Moreau, Capital, Jan. 1',value:48000},{name:'Add: Net Income',value:12100},{name:'Less: J. Moreau, Drawings',value:-3550},{name:'J. Moreau, Capital, Dec. 31',value:56550}],total:56550},
          total_liabilities_oe:127350
        },
        check:{total_assets:127350,total_loe:127350,balanced:true}
      },

      /* ---------- PREPARATION Level 2 — #3: Clearwater Pool Service ---------- */
      {
        type:'preparation', difficulty:2,
        company:'Clearwater Pool Service', owner:'A. Reyes', date:'December 31, 2024',
        instructions:'Prepare a classified balance sheet for Clearwater Pool Service as at December 31, 2024. Arrange current assets by liquidity, long-term assets by useful life (longest first), and list A/R and A/P sub-accounts alphabetically.',
        accounts:[
          { name:'Cash',                            value:6300,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 D. Fontaine',         value:1500,  correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 K. Pham',             value:2000,  correct_section:'CA',  correct_order:3 },
          { name:'Supplies',                         value:750,   correct_section:'CA',  correct_order:4 },
          { name:'Land',                             value:48000, correct_section:'LTA', correct_order:1 },
          { name:'Equipment',                        value:15000, correct_section:'LTA', correct_order:2 },
          { name:'Vehicles',                         value:12000, correct_section:'LTA', correct_order:3 },
          { name:'A/P \u2014 AquaChem Supply',      value:3100,  correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Pool Pros Ltd.',       value:1800,  correct_section:'CL',  correct_order:2 },
          { name:'Wages Payable',                    value:900,   correct_section:'CL',  correct_order:3 },
          { name:'Bank Loan (4-year)',               value:20000, correct_section:'LTL', correct_order:1 },
          { name:'A. Reyes, Capital, Jan. 1',        value:52000, correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                  value:7750,  correct_section:'OE',  correct_order:2 },
          { name:'Less: A. Reyes, Drawings',         value:-3200, correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Clearwater Pool Service','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:6300,indent:0},{name:'A/R \u2014 D. Fontaine',value:1500,indent:1},{name:'A/R \u2014 K. Pham',value:2000,indent:1},{name:'Supplies',value:750,indent:0}],
            current_total:10550,
            longterm:[{name:'Land',value:48000,indent:0},{name:'Equipment',value:15000,indent:0},{name:'Vehicles',value:12000,indent:0}],
            longterm_total:75000,
            total:85550
          },
          liabilities:{
            current:[{name:'A/P \u2014 AquaChem Supply',value:3100,indent:1},{name:'A/P \u2014 Pool Pros Ltd.',value:1800,indent:1},{name:'Wages Payable',value:900,indent:0}],
            current_total:5800,
            longterm:[{name:'Bank Loan (4-year)',value:20000,indent:0}],
            longterm_total:20000,
            total:25800
          },
          equity:{items:[{name:'A. Reyes, Capital, Jan. 1',value:52000},{name:'Add: Net Income',value:10950},{name:'Less: A. Reyes, Drawings',value:-3200},{name:'A. Reyes, Capital, Dec. 31',value:59750}],total:59750},
          total_liabilities_oe:85550
        },
        check:{total_assets:85550,total_loe:85550,balanced:true}
      },

      /* ---------- PREPARATION Level 3 — #2: Westfield Event Planning ---------- */
      {
        type:'preparation', difficulty:3,
        company:'Westfield Event Planning', owner:'T. Kapoor', date:'December 31, 2024',
        instructions:'Prepare a classified balance sheet for Westfield Event Planning as at December 31, 2024. This company has multiple debtors under A/R and multiple creditors under A/P. List sub-accounts alphabetically, current assets by liquidity, and long-term assets by useful life (longest first). Include all subtotals and grand totals.',
        accounts:[
          { name:'Cash',                               value:11000,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 E. Chen',                value:2800,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 L. Martinez',            value:1600,   correct_section:'CA',  correct_order:3 },
          { name:'A/R \u2014 S. Thompson',            value:3400,   correct_section:'CA',  correct_order:4 },
          { name:'Merchandise Inventory',               value:8000,   correct_section:'CA',  correct_order:5 },
          { name:'Prepaid Rent',                        value:2400,   correct_section:'CA',  correct_order:6 },
          { name:'Supplies',                            value:1300,   correct_section:'CA',  correct_order:7 },
          { name:'Land',                                value:70000,  correct_section:'LTA', correct_order:1 },
          { name:'Building',                            value:95000,  correct_section:'LTA', correct_order:2 },
          { name:'Equipment',                           value:25000,  correct_section:'LTA', correct_order:3 },
          { name:'A/P \u2014 Creative Designs',        value:4100,   correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Event Supply Co.',        value:2900,   correct_section:'CL',  correct_order:2 },
          { name:'A/P \u2014 Premier Rentals',         value:3600,   correct_section:'CL',  correct_order:3 },
          { name:'Wages Payable',                       value:1800,   correct_section:'CL',  correct_order:4 },
          { name:'Bank Loan (5-year)',                  value:35000,  correct_section:'LTL', correct_order:1 },
          { name:'Mortgage Payable',                    value:85000,  correct_section:'LTL', correct_order:2 },
          { name:'T. Kapoor, Capital, Jan. 1',          value:78000,  correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                     value:16500,  correct_section:'OE',  correct_order:2 },
          { name:'Less: T. Kapoor, Drawings',           value:-6400,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Westfield Event Planning','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:11000,indent:0},{name:'A/R \u2014 E. Chen',value:2800,indent:1},{name:'A/R \u2014 L. Martinez',value:1600,indent:1},{name:'A/R \u2014 S. Thompson',value:3400,indent:1},{name:'Merchandise Inventory',value:8000,indent:0},{name:'Prepaid Rent',value:2400,indent:0},{name:'Supplies',value:1300,indent:0}],
            current_total:30500,
            longterm:[{name:'Land',value:70000,indent:0},{name:'Building',value:95000,indent:0},{name:'Equipment',value:25000,indent:0}],
            longterm_total:190000,
            total:220500
          },
          liabilities:{
            current:[{name:'A/P \u2014 Creative Designs',value:4100,indent:1},{name:'A/P \u2014 Event Supply Co.',value:2900,indent:1},{name:'A/P \u2014 Premier Rentals',value:3600,indent:1},{name:'Wages Payable',value:1800,indent:0}],
            current_total:12400,
            longterm:[{name:'Bank Loan (5-year)',value:35000,indent:0},{name:'Mortgage Payable',value:85000,indent:0}],
            longterm_total:120000,
            total:132400
          },
          equity:{items:[{name:'T. Kapoor, Capital, Jan. 1',value:78000},{name:'Add: Net Income',value:16500},{name:'Less: T. Kapoor, Drawings',value:-6400},{name:'T. Kapoor, Capital, Dec. 31',value:88100}],total:88100},
          total_liabilities_oe:220500
        },
        check:{total_assets:220500,total_loe:220500,balanced:true}
      },

      /* ---------- PREPARATION Level 3 — #3: Harbour City Bakery ---------- */
      {
        type:'preparation', difficulty:3,
        company:'Harbour City Bakery', owner:'R. Osei', date:'December 31, 2024',
        instructions:'Prepare a classified balance sheet for Harbour City Bakery as at December 31, 2024. The company has multiple debtors and creditors. List sub-accounts alphabetically, current assets by liquidity, long-term assets by useful life (longest first). Show drawings reducing equity correctly.',
        accounts:[
          { name:'Cash',                                value:8500,   correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 C. Anderson',             value:2200,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 M. Liu',                  value:1700,   correct_section:'CA',  correct_order:3 },
          { name:'A/R \u2014 S. Patel',                value:2900,   correct_section:'CA',  correct_order:4 },
          { name:'Merchandise Inventory',                value:6800,   correct_section:'CA',  correct_order:5 },
          { name:'Prepaid Insurance',                    value:1600,   correct_section:'CA',  correct_order:6 },
          { name:'Supplies',                             value:1400,   correct_section:'CA',  correct_order:7 },
          { name:'Land',                                 value:65000,  correct_section:'LTA', correct_order:1 },
          { name:'Building',                             value:80000,  correct_section:'LTA', correct_order:2 },
          { name:'Equipment',                            value:18000,  correct_section:'LTA', correct_order:3 },
          { name:'Vehicles',                             value:14000,  correct_section:'LTA', correct_order:4 },
          { name:'A/P \u2014 Flour Mill Direct',        value:3500,   correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Kitchen Supply Co.',       value:4200,   correct_section:'CL',  correct_order:2 },
          { name:'A/P \u2014 Sweet Essentials',         value:2800,   correct_section:'CL',  correct_order:3 },
          { name:'Mortgage Payable',                     value:72000,  correct_section:'LTL', correct_order:1 },
          { name:'Bank Loan (3-year)',                   value:30000,  correct_section:'LTL', correct_order:2 },
          { name:'R. Osei, Capital, Jan. 1',             value:82000,  correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                      value:12800,  correct_section:'OE',  correct_order:2 },
          { name:'Less: R. Osei, Drawings',              value:-5200,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Harbour City Bakery','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:8500,indent:0},{name:'A/R \u2014 C. Anderson',value:2200,indent:1},{name:'A/R \u2014 M. Liu',value:1700,indent:1},{name:'A/R \u2014 S. Patel',value:2900,indent:1},{name:'Merchandise Inventory',value:6800,indent:0},{name:'Prepaid Insurance',value:1600,indent:0},{name:'Supplies',value:1400,indent:0}],
            current_total:25100,
            longterm:[{name:'Land',value:65000,indent:0},{name:'Building',value:80000,indent:0},{name:'Equipment',value:18000,indent:0},{name:'Vehicles',value:14000,indent:0}],
            longterm_total:177000,
            total:202100
          },
          liabilities:{
            current:[{name:'A/P \u2014 Flour Mill Direct',value:3500,indent:1},{name:'A/P \u2014 Kitchen Supply Co.',value:4200,indent:1},{name:'A/P \u2014 Sweet Essentials',value:2800,indent:1}],
            current_total:10500,
            longterm:[{name:'Bank Loan (3-year)',value:30000,indent:0},{name:'Mortgage Payable',value:72000,indent:0}],
            longterm_total:102000,
            total:112500
          },
          equity:{items:[{name:'R. Osei, Capital, Jan. 1',value:82000},{name:'Add: Net Income',value:12800},{name:'Less: R. Osei, Drawings',value:-5200},{name:'R. Osei, Capital, Dec. 31',value:89600}],total:89600},
          total_liabilities_oe:202100
        },
        check:{total_assets:202100,total_loe:202100,balanced:true}
      },

      /* ---------- ERROR FINDING Level 1 — #2: Parkside Lawn Care ---------- */
      {
        type:'error_finding', difficulty:1,
        company:'Parkside Lawn Care', owner:'P. Anderson', date:'December 31, 2024',
        instructions:'This classified balance sheet contains exactly 4 errors. Study it carefully and list every error you can find. Be specific \u2014 state what is wrong and where.',
        erroneous_sheet:{
          heading:['Parkside Lawn Care','Income Statement','As at December 31, 2024'],
          assets:{
            current:[{name:'Supplies',value:500,indent:0},{name:'Cash',value:3600,indent:0},{name:'A/R \u2014 M. Rivera',value:1400,indent:0}],
            current_total:5500,
            longterm:[{name:'Equipment',value:9000,indent:0},{name:'Land',value:25000,indent:0}],
            longterm_total:34000,
            total:39500
          },
          liabilities:{
            current:[{name:'A/P \u2014 Green Garden Supply',value:2200,indent:0},{name:'Wages Payable',value:800,indent:0}],
            current_total:3000,
            longterm:[{name:'Bank Loan (3-year)',value:10000,indent:0}],
            longterm_total:10000,
            total:13000
          },
          equity:{items:[{name:'P. Anderson, Capital, Jan. 1',value:28000},{name:'P. Anderson, Drawings',value:1500,display:'$1,500'},{name:'P. Anderson, Capital, Dec. 31',value:29500}],total:29500},
          total_liabilities_oe:42500
        },
        solution:{
          heading:['Parkside Lawn Care','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:3600,indent:0},{name:'A/R \u2014 M. Rivera',value:1400,indent:0},{name:'Supplies',value:500,indent:0}],
            current_total:5500,
            longterm:[{name:'Land',value:25000,indent:0},{name:'Equipment',value:9000,indent:0}],
            longterm_total:34000,
            total:39500
          },
          liabilities:{
            current:[{name:'A/P \u2014 Green Garden Supply',value:2200,indent:0},{name:'Wages Payable',value:800,indent:0}],
            current_total:3000,
            longterm:[{name:'Bank Loan (3-year)',value:10000,indent:0}],
            longterm_total:10000,
            total:13000
          },
          equity:{items:[{name:'P. Anderson, Capital, Jan. 1',value:28000},{name:'Less: P. Anderson, Drawings',value:-1500},{name:'P. Anderson, Capital, Dec. 31',value:26500}],total:26500},
          total_liabilities_oe:39500
        },
        errors:[
          {id:1, location:'Heading line 2', description:'Statement is titled "Income Statement" instead of "Balance Sheet".', correction:'Change heading to "Balance Sheet".'},
          {id:2, location:'Current Assets', description:'Supplies is listed first instead of Cash. Cash (most liquid) must always be first.', correction:'List Cash first, then A/R, then Supplies.'},
          {id:3, location:'Long-Term Assets', description:'Equipment is listed before Land. Land has the longest useful life.', correction:'List Land first, then Equipment (ordered by useful life, longest first).'},
          {id:4, location:"Owner's Equity", description:'Drawings shown as positive $1,500 and added to Capital ($28,000 + $1,500 = $29,500). Drawings reduce equity.', correction:'Show as "Less: Drawings ($1,500)" and subtract: $28,000 \u2212 $1,500 = $26,500.'},
        ],
        check:{total_assets:39500,total_loe:39500,balanced:true}
      },

      /* ---------- ERROR FINDING Level 1 — #3: Bright Smile Dental ---------- */
      {
        type:'error_finding', difficulty:1,
        company:'Bright Smile Dental', owner:'D. Kaur', date:'December 31, 2024',
        instructions:'This classified balance sheet contains exactly 4 errors. Study every detail carefully and list each error you find.',
        erroneous_sheet:{
          heading:['Bright Smile Dental','Balance Sheet','For the Year Ended December 31, 2024'],
          assets:{
            current:[{name:'A/R \u2014 T. Bailey',value:1800,indent:0},{name:'Cash',value:8200,indent:0},{name:'Supplies',value:600,indent:0}],
            current_total:10600,
            longterm:[{name:'Equipment',value:15000,indent:0},{name:'Building',value:30000,indent:0},{name:'Land',value:42000,indent:0}],
            longterm_total:87000,
            total:97600
          },
          liabilities:{
            current:[{name:'A/P \u2014 Metro Supply Co.',value:1500,indent:0},{name:'A/P \u2014 Ajax Dental Supply',value:2800,indent:0}],
            current_total:4300,
            longterm:[{name:'Mortgage Payable',value:35000,indent:0}],
            longterm_total:35000,
            total:39300
          },
          equity:{items:[{name:'D. Kaur, Capital',value:58300}],total:58300},
          total_liabilities_oe:97600
        },
        solution:{
          heading:['Bright Smile Dental','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:8200,indent:0},{name:'A/R \u2014 T. Bailey',value:1800,indent:0},{name:'Supplies',value:600,indent:0}],
            current_total:10600,
            longterm:[{name:'Land',value:42000,indent:0},{name:'Building',value:30000,indent:0},{name:'Equipment',value:15000,indent:0}],
            longterm_total:87000,
            total:97600
          },
          liabilities:{
            current:[{name:'A/P \u2014 Ajax Dental Supply',value:2800,indent:0},{name:'A/P \u2014 Metro Supply Co.',value:1500,indent:0}],
            current_total:4300,
            longterm:[{name:'Mortgage Payable',value:35000,indent:0}],
            longterm_total:35000,
            total:39300
          },
          equity:{items:[{name:'D. Kaur, Capital',value:58300}],total:58300},
          total_liabilities_oe:97600
        },
        errors:[
          {id:1, location:'Heading line 3', description:'Date says "For the Year Ended December 31, 2024". A balance sheet is a snapshot at one point in time, not a period.', correction:'Change to "As at December 31, 2024".'},
          {id:2, location:'Current Assets', description:'A/R \u2014 T. Bailey listed before Cash. Cash must always be first (most liquid asset).', correction:'List Cash first, then Accounts Receivable, then Supplies.'},
          {id:3, location:'Long-Term Assets', description:'Equipment is listed first, then Building, then Land. The order is reversed \u2014 Land has unlimited useful life.', correction:'List Land first, then Building, then Equipment (longest useful life first).'},
          {id:4, location:'Current Liabilities', description:'A/P creditors are not in alphabetical order: Metro Supply Co. listed before Ajax Dental Supply.', correction:'List Ajax Dental Supply first, then Metro Supply Co. (alphabetical).'},
        ],
        check:{total_assets:97600,total_loe:97600,balanced:true}
      },

      /* ---------- ERROR FINDING Level 2 — #3: Westside Fitness Studio ---------- */
      {
        type:'error_finding', difficulty:2,
        company:'Westside Fitness Studio', owner:'K. Tanaka', date:'December 31, 2024',
        instructions:'This classified balance sheet contains exactly 6 errors. Check everything \u2014 headings, ordering, classifications, and equity. List each error you find.',
        erroneous_sheet:{
          heading:['Westside Fitness Studio','Balance Sheet','For the Month Ended December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:5400,indent:0},{name:'A/R \u2014 S. Park',value:2100,indent:1},{name:'A/R \u2014 H. Lee',value:1600,indent:1},{name:'Supplies',value:450,indent:0}],
            current_total:9550,
            longterm:[{name:'Building',value:38000,indent:0},{name:'Land',value:52000,indent:0},{name:'Equipment',value:14000,indent:0},{name:'Prepaid Insurance',value:800,indent:0}],
            longterm_total:104800,
            total:114350
          },
          liabilities:{
            current:[{name:'A/P \u2014 Yoga Supplies Inc.',value:1800,indent:1},{name:'A/P \u2014 Fitness Wholesale',value:2900,indent:1}],
            current_total:4700,
            longterm:[{name:'Bank Loan (5-year)',value:28000,indent:0}],
            longterm_total:28000,
            total:32700
          },
          equity:{items:[{name:'K. Tanaka, Capital, Jan. 1',value:86000},{name:'K. Tanaka, Drawings',value:4350,display:'$4,350'},{name:'K. Tanaka, Capital, Dec. 31',value:90350}],total:90350},
          total_liabilities_oe:123050
        },
        solution:{
          heading:['Westside Fitness Studio','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:5400,indent:0},{name:'A/R \u2014 H. Lee',value:1600,indent:1},{name:'A/R \u2014 S. Park',value:2100,indent:1},{name:'Prepaid Insurance',value:800,indent:0},{name:'Supplies',value:450,indent:0}],
            current_total:10350,
            longterm:[{name:'Land',value:52000,indent:0},{name:'Building',value:38000,indent:0},{name:'Equipment',value:14000,indent:0}],
            longterm_total:104000,
            total:114350
          },
          liabilities:{
            current:[{name:'A/P \u2014 Fitness Wholesale',value:2900,indent:1},{name:'A/P \u2014 Yoga Supplies Inc.',value:1800,indent:1}],
            current_total:4700,
            longterm:[{name:'Bank Loan (5-year)',value:28000,indent:0}],
            longterm_total:28000,
            total:32700
          },
          equity:{items:[{name:'K. Tanaka, Capital, Jan. 1',value:86000},{name:'Less: K. Tanaka, Drawings',value:-4350},{name:'K. Tanaka, Capital, Dec. 31',value:81650}],total:81650},
          total_liabilities_oe:114350
        },
        errors:[
          {id:1, location:'Heading line 3', description:'Date says "For the Month Ended December 31, 2024". A balance sheet is at one point in time.', correction:'Change to "As at December 31, 2024".'},
          {id:2, location:'Current Assets', description:'A/R sub-debtors not alphabetical: S. Park listed before H. Lee.', correction:'List H. Lee before S. Park (alphabetical by last name).'},
          {id:3, location:'Long-Term Assets', description:'Prepaid Insurance classified as a Long-Term Asset. Prepaid expenses are used within one year.', correction:'Move Prepaid Insurance to Current Assets.'},
          {id:4, location:'Long-Term Assets', description:'Building listed before Land. Land has unlimited useful life and must be first.', correction:'List Land first, then Building, then Equipment.'},
          {id:5, location:'Current Liabilities', description:'A/P creditors not alphabetical: Yoga Supplies Inc. listed before Fitness Wholesale.', correction:'List Fitness Wholesale before Yoga Supplies Inc.'},
          {id:6, location:"Owner's Equity", description:'Drawings shown as positive $4,350 and added to Capital ($86,000 + $4,350 = $90,350). Drawings reduce equity.', correction:'Show as "Less: Drawings ($4,350)" and subtract: $86,000 \u2212 $4,350 = $81,650.'},
        ],
        check:{total_assets:114350,total_loe:114350,balanced:true}
      },

      /* ---------- ERROR FINDING Level 3 — #2: Valley Creek Veterinary ---------- */
      {
        type:'error_finding', difficulty:3,
        company:'Valley Creek Veterinary', owner:'N. Saberi', date:'December 31, 2024',
        instructions:'This classified balance sheet contains exactly 8 errors across headings, ordering, classifications, and calculations. Examine every detail and list all errors.',
        erroneous_sheet:{
          heading:['Valey Creek Veterinary','Balance Sheet','For the Year Ended December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:9800,indent:0},{name:'A/R \u2014 R. Simmons',value:1800,indent:1},{name:'A/R \u2014 B. Grant',value:2600,indent:1},{name:'A/R \u2014 L. Choi',value:3400,indent:1},{name:'Supplies',value:1200,indent:0},{name:'Merchandise Inventory',value:5500,indent:0}],
            current_total:24300,
            longterm:[{name:'Land',value:70000,indent:0},{name:'Building',value:48000,indent:0},{name:'Equipment',value:22000,indent:0},{name:'Vehicles',value:16000,indent:0}],
            longterm_total:157000,
            total:181300
          },
          liabilities:{
            current:[{name:'A/P \u2014 PetPharm Ltd.',value:4200,indent:1},{name:'A/P \u2014 Animal Care Supply',value:3800,indent:1},{name:'A/P \u2014 MedVet Inc.',value:2600,indent:1}],
            current_total:10600,
            longterm:[{name:'Mortgage Payable',value:60000,indent:0},{name:'Current Portion of Mortgage',value:5000,indent:0}],
            longterm_total:65000,
            total:75600
          },
          equity:{items:[{name:'N. Saberi, Capital, Jan. 1',value:98000},{name:'Less: Net Income',value:-12200,display:'($12,200)'},{name:'Less: N. Saberi, Drawings',value:-5500},{name:'N. Saberi, Capital, Dec. 31',value:80300}],total:80300},
          total_liabilities_oe:155900
        },
        solution:{
          heading:['Valley Creek Veterinary','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:9800,indent:0},{name:'A/R \u2014 B. Grant',value:2600,indent:1},{name:'A/R \u2014 L. Choi',value:3400,indent:1},{name:'A/R \u2014 R. Simmons',value:1800,indent:1},{name:'Merchandise Inventory',value:5500,indent:0},{name:'Supplies',value:1200,indent:0}],
            current_total:24300,
            longterm:[{name:'Land',value:70000,indent:0},{name:'Building',value:48000,indent:0},{name:'Equipment',value:22000,indent:0},{name:'Vehicles',value:16000,indent:0}],
            longterm_total:156000,
            total:180300
          },
          liabilities:{
            current:[{name:'A/P \u2014 Animal Care Supply',value:3800,indent:1},{name:'A/P \u2014 MedVet Inc.',value:2600,indent:1},{name:'A/P \u2014 PetPharm Ltd.',value:4200,indent:1},{name:'Current Portion of Mortgage',value:5000,indent:0}],
            current_total:15600,
            longterm:[{name:'Mortgage Payable',value:60000,indent:0}],
            longterm_total:60000,
            total:75600
          },
          equity:{items:[{name:'N. Saberi, Capital, Jan. 1',value:98000},{name:'Add: Net Income',value:12200},{name:'Less: N. Saberi, Drawings',value:-5500},{name:'N. Saberi, Capital, Dec. 31',value:104700}],total:104700},
          total_liabilities_oe:180300
        },
        errors:[
          {id:1, location:'Heading line 1', description:'Company name misspelled: "Valey" instead of "Valley".', correction:'Correct to "Valley Creek Veterinary".'},
          {id:2, location:'Heading line 3', description:'Date reads "For the Year Ended December 31, 2024". A balance sheet is a snapshot, not a period.', correction:'Change to "As at December 31, 2024".'},
          {id:3, location:'Current Assets', description:'A/R debtors not in alphabetical order: Simmons listed before Grant and Choi.', correction:'Reorder: B. Grant, L. Choi, R. Simmons (alphabetical by last name).'},
          {id:4, location:'Current Assets', description:'Supplies listed before Merchandise Inventory. Inventory comes before Supplies in liquidity order.', correction:'List Merchandise Inventory before Supplies.'},
          {id:5, location:'Long-Term Assets', description:'Total Long-Term Assets shows $157,000 instead of $156,000 (70,000 + 48,000 + 22,000 + 16,000 = 156,000).', correction:'Correct the subtotal to $156,000.'},
          {id:6, location:'Current Liabilities', description:'A/P creditors not in alphabetical order: PetPharm before Animal Care Supply.', correction:'Reorder: Animal Care Supply, MedVet Inc., PetPharm Ltd.'},
          {id:7, location:'Long-Term Liabilities', description:'Current Portion of Mortgage ($5,000) is in Long-Term Liabilities. Due within one year.', correction:'Move Current Portion of Mortgage to Current Liabilities.'},
          {id:8, location:"Owner's Equity", description:'Net Income shown as "Less: Net Income ($12,200)" \u2014 subtracted instead of added. Net Income increases equity.', correction:'Show as "Add: Net Income $12,200" and add to beginning capital.'},
        ],
        check:{total_assets:180300,total_loe:180300,balanced:true}
      },

      /* ---------- ERROR FINDING Level 3 — #3: Prairie Wind Farm Supply ---------- */
      {
        type:'error_finding', difficulty:3,
        company:'Prairie Wind Farm Supply', owner:'G. Walsh', date:'December 31, 2024',
        instructions:'This classified balance sheet contains exactly 8 errors across headings, ordering, classifications, and calculations. Find them all.',
        erroneous_sheet:{
          heading:['Prairie Wind Farm Supply','Income Statement','December 31 2024'],
          assets:{
            current:[{name:'Cash',value:11500,indent:0},{name:'A/R \u2014 W. Torres',value:4100,indent:1},{name:'A/R \u2014 F. Hassan',value:2600,indent:1},{name:'A/R \u2014 C. McBride',value:3800,indent:1},{name:'Supplies',value:1700,indent:0},{name:'Merchandise Inventory',value:9200,indent:0},{name:'Prepaid Rent',value:2800,indent:0}],
            current_total:35700,
            longterm:[{name:'Land',value:85000,indent:0},{name:'Vehicles',value:20000,indent:0},{name:'Building',value:60000,indent:0},{name:'Equipment',value:30000,indent:0}],
            longterm_total:195000,
            total:230700
          },
          liabilities:{
            current:[{name:'A/P \u2014 Prairie Equipment',value:4600,indent:1},{name:'A/P \u2014 Agri-Supply Co.',value:5100,indent:1},{name:'A/P \u2014 FarmTech Ltd.',value:3400,indent:1}],
            current_total:13100,
            longterm:[{name:'Bank Loan (5-year)',value:42000,indent:0},{name:'Mortgage Payable',value:78000,indent:0},{name:'Wages Payable',value:2200,indent:0}],
            longterm_total:122200,
            total:135300
          },
          equity:{items:[{name:'G. Walsh, Capital, Jan. 1',value:105000},{name:'Less: Net Loss',value:-3200},{name:'G. Walsh, Drawings',value:6400,display:'$6,400'},{name:'G. Walsh, Capital, Dec. 31',value:108200}],total:108200},
          total_liabilities_oe:243500
        },
        solution:{
          heading:['Prairie Wind Farm Supply','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:11500,indent:0},{name:'A/R \u2014 F. Hassan',value:2600,indent:1},{name:'A/R \u2014 C. McBride',value:3800,indent:1},{name:'A/R \u2014 W. Torres',value:4100,indent:1},{name:'Merchandise Inventory',value:9200,indent:0},{name:'Prepaid Rent',value:2800,indent:0},{name:'Supplies',value:1700,indent:0}],
            current_total:35700,
            longterm:[{name:'Land',value:85000,indent:0},{name:'Building',value:60000,indent:0},{name:'Equipment',value:30000,indent:0},{name:'Vehicles',value:20000,indent:0}],
            longterm_total:195000,
            total:230700
          },
          liabilities:{
            current:[{name:'A/P \u2014 Agri-Supply Co.',value:5100,indent:1},{name:'A/P \u2014 FarmTech Ltd.',value:3400,indent:1},{name:'A/P \u2014 Prairie Equipment',value:4600,indent:1},{name:'Wages Payable',value:2200,indent:0}],
            current_total:15300,
            longterm:[{name:'Bank Loan (5-year)',value:42000,indent:0},{name:'Mortgage Payable',value:78000,indent:0}],
            longterm_total:120000,
            total:135300
          },
          equity:{items:[{name:'G. Walsh, Capital, Jan. 1',value:105000},{name:'Less: Net Loss',value:-3200},{name:'Less: G. Walsh, Drawings',value:-6400},{name:'G. Walsh, Capital, Dec. 31',value:95400}],total:95400},
          total_liabilities_oe:230700
        },
        errors:[
          {id:1, location:'Heading line 2', description:'Statement titled "Income Statement" instead of "Balance Sheet".', correction:'Change heading line 2 to "Balance Sheet".'},
          {id:2, location:'Heading line 3', description:'Date reads "December 31 2024" \u2014 missing "As at" and comma after 31.', correction:'Write "As at December 31, 2024".'},
          {id:3, location:'Current Assets', description:'A/R debtors not alphabetical: Torres, Hassan, McBride instead of Hassan, McBride, Torres.', correction:'Reorder: F. Hassan, C. McBride, W. Torres.'},
          {id:4, location:'Current Assets', description:'Supplies listed before Merchandise Inventory. Inventory has higher liquidity.', correction:'List Merchandise Inventory before Supplies.'},
          {id:5, location:'Long-Term Assets', description:'Vehicles listed before Building. Buildings have a longer useful life than vehicles.', correction:'Order: Land, Building, Equipment, Vehicles (longest useful life first).'},
          {id:6, location:'Current Liabilities', description:'A/P creditors not alphabetical: Prairie Equipment listed before Agri-Supply Co.', correction:'Reorder: Agri-Supply Co., FarmTech Ltd., Prairie Equipment.'},
          {id:7, location:'Long-Term Liabilities', description:'Wages Payable classified as Long-Term Liability. Wages owing are due within days/weeks.', correction:'Move Wages Payable to Current Liabilities.'},
          {id:8, location:"Owner's Equity", description:'Drawings shown as positive $6,400 and added to capital. Drawings reduce equity.', correction:'Show as "Less: Drawings ($6,400)" and subtract from equity.'},
        ],
        check:{total_assets:230700,total_loe:230700,balanced:true}
      },

      /* ---------- ADVANCED Level 1 — #2: Cedar Hill Bookkeeping ---------- */
      {
        type:'advanced', difficulty:1,
        company:'Cedar Hill Bookkeeping', owner:'F. LaRoche', date:'December 31, 2024',
        scenario_context:'Cedar Hill Bookkeeping has a bank loan where the current portion (due within 12 months) must be separated from the long-term remainder.',
        instructions:'Prepare a classified balance sheet for Cedar Hill Bookkeeping as at December 31, 2024. Note: the bank loan has a current portion that must be classified separately as a Current Liability.',
        advanced_notes:['The bank loan has two parts: $4,000 due this year (Current Liability) and $16,000 due after one year (Long-Term Liability). Always split current vs. long-term portions.'],
        accounts:[
          { name:'Cash',                                value:9200,   correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 J. Fernandez',            value:2800,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 P. Ng',                   value:1600,   correct_section:'CA',  correct_order:3 },
          { name:'Prepaid Insurance',                    value:1000,   correct_section:'CA',  correct_order:4 },
          { name:'Supplies',                             value:700,    correct_section:'CA',  correct_order:5 },
          { name:'Land',                                 value:50000,  correct_section:'LTA', correct_order:1 },
          { name:'Equipment',                            value:18000,  correct_section:'LTA', correct_order:2 },
          { name:'Vehicles',                             value:12000,  correct_section:'LTA', correct_order:3 },
          { name:'A/P \u2014 Office Essentials',        value:3200,   correct_section:'CL',  correct_order:1 },
          { name:'Current Portion of Bank Loan',         value:4000,   correct_section:'CL',  correct_order:2 },
          { name:'Bank Loan (remaining)',                value:16000,  correct_section:'LTL', correct_order:1 },
          { name:'F. LaRoche, Capital, Jan. 1',          value:65000,  correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                      value:10600,  correct_section:'OE',  correct_order:2 },
          { name:'Less: F. LaRoche, Drawings',           value:-3500,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Cedar Hill Bookkeeping','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:9200,indent:0},{name:'A/R \u2014 J. Fernandez',value:2800,indent:1},{name:'A/R \u2014 P. Ng',value:1600,indent:1},{name:'Prepaid Insurance',value:1000,indent:0},{name:'Supplies',value:700,indent:0}],
            current_total:15300,
            longterm:[{name:'Land',value:50000,indent:0},{name:'Equipment',value:18000,indent:0},{name:'Vehicles',value:12000,indent:0}],
            longterm_total:80000,
            total:95300
          },
          liabilities:{
            current:[{name:'A/P \u2014 Office Essentials',value:3200,indent:1},{name:'Current Portion of Bank Loan',value:4000,indent:0}],
            current_total:7200,
            longterm:[{name:'Bank Loan (remaining)',value:16000,indent:0}],
            longterm_total:16000,
            total:23200
          },
          equity:{items:[{name:'F. LaRoche, Capital, Jan. 1',value:65000},{name:'Add: Net Income',value:10600},{name:'Less: F. LaRoche, Drawings',value:-3500},{name:'F. LaRoche, Capital, Dec. 31',value:72100}],total:72100},
          total_liabilities_oe:95300
        },
        check:{total_assets:95300,total_loe:95300,balanced:true}
      },

      /* ---------- ADVANCED Level 1 — #3: Ridgeway Home Inspections ---------- */
      {
        type:'advanced', difficulty:1,
        company:'Ridgeway Home Inspections', owner:'B. Trent', date:'December 31, 2024',
        scenario_context:'Ridgeway has unearned revenue from a prepaid inspection deposit and a mortgage with a current portion due this year.',
        instructions:'Prepare a classified balance sheet for Ridgeway Home Inspections as at December 31, 2024. Note: Unearned Revenue is a current liability, and the mortgage must be split into current and long-term portions.',
        advanced_notes:[
          'Unearned Revenue ($1,500) represents a client deposit for an inspection not yet performed \u2014 it is a current liability.',
          'The mortgage has $6,000 due this year (Current Liability) and $48,000 remaining (Long-Term Liability).'
        ],
        accounts:[
          { name:'Cash',                                value:7500,   correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 C. Hoffman',              value:2100,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 R. Santos',               value:1800,   correct_section:'CA',  correct_order:3 },
          { name:'Prepaid Rent',                         value:1200,   correct_section:'CA',  correct_order:4 },
          { name:'Supplies',                             value:600,    correct_section:'CA',  correct_order:5 },
          { name:'Land',                                 value:55000,  correct_section:'LTA', correct_order:1 },
          { name:'Equipment',                            value:14000,  correct_section:'LTA', correct_order:2 },
          { name:'Vehicles',                             value:11000,  correct_section:'LTA', correct_order:3 },
          { name:'A/P \u2014 BuildSafe Supply',         value:2800,   correct_section:'CL',  correct_order:1 },
          { name:'Unearned Revenue',                     value:1500,   correct_section:'CL',  correct_order:2 },
          { name:'Current Portion of Mortgage',          value:6000,   correct_section:'CL',  correct_order:3 },
          { name:'Mortgage Payable (remaining)',         value:48000,  correct_section:'LTL', correct_order:1 },
          { name:'B. Trent, Capital, Jan. 1',            value:32000,  correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                      value:5400,   correct_section:'OE',  correct_order:2 },
          { name:'Less: B. Trent, Drawings',             value:-2500,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Ridgeway Home Inspections','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:7500,indent:0},{name:'A/R \u2014 C. Hoffman',value:2100,indent:1},{name:'A/R \u2014 R. Santos',value:1800,indent:1},{name:'Prepaid Rent',value:1200,indent:0},{name:'Supplies',value:600,indent:0}],
            current_total:13200,
            longterm:[{name:'Land',value:55000,indent:0},{name:'Equipment',value:14000,indent:0},{name:'Vehicles',value:11000,indent:0}],
            longterm_total:80000,
            total:93200
          },
          liabilities:{
            current:[{name:'A/P \u2014 BuildSafe Supply',value:2800,indent:1},{name:'Unearned Revenue',value:1500,indent:0},{name:'Current Portion of Mortgage',value:6000,indent:0}],
            current_total:10300,
            longterm:[{name:'Mortgage Payable (remaining)',value:48000,indent:0}],
            longterm_total:48000,
            total:58300
          },
          equity:{items:[{name:'B. Trent, Capital, Jan. 1',value:32000},{name:'Add: Net Income',value:5400},{name:'Less: B. Trent, Drawings',value:-2500},{name:'B. Trent, Capital, Dec. 31',value:34900}],total:34900},
          total_liabilities_oe:93200
        },
        check:{total_assets:93200,total_loe:93200,balanced:true}
      },

      /* ---------- ADVANCED Level 2 — #2: Northgate Landscaping ---------- */
      {
        type:'advanced', difficulty:2,
        company:'Northgate Landscaping', owner:'E. Volkov', date:'December 31, 2024',
        scenario_context:'Northgate has multiple named debtors (A/R) and creditors (A/P), unearned revenue from a prepaid landscaping contract, and net income with drawings.',
        instructions:'Prepare a classified balance sheet for Northgate Landscaping as at December 31, 2024. List all A/R debtors and A/P creditors alphabetically. Unearned Revenue is a current liability.',
        advanced_notes:[
          'A/R sub-accounts (debtors) alphabetically: Armstrong, Beaumont, Kwon.',
          'A/P sub-accounts (creditors) alphabetically: Green Solutions, Landscape Pro, Terra Supply.',
          'Unearned Revenue ($1,800) = prepaid landscaping contract deposit \u2014 current liability.'
        ],
        accounts:[
          { name:'Cash',                                value:8800,   correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 D. Armstrong',            value:2400,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 T. Beaumont',             value:1700,   correct_section:'CA',  correct_order:3 },
          { name:'A/R \u2014 G. Kwon',                 value:3100,   correct_section:'CA',  correct_order:4 },
          { name:'Merchandise Inventory',                value:7200,   correct_section:'CA',  correct_order:5 },
          { name:'Prepaid Insurance',                    value:1400,   correct_section:'CA',  correct_order:6 },
          { name:'Supplies',                             value:900,    correct_section:'CA',  correct_order:7 },
          { name:'Land',                                 value:68000,  correct_section:'LTA', correct_order:1 },
          { name:'Building',                             value:42000,  correct_section:'LTA', correct_order:2 },
          { name:'Equipment',                            value:20000,  correct_section:'LTA', correct_order:3 },
          { name:'Vehicles',                             value:15000,  correct_section:'LTA', correct_order:4 },
          { name:'A/P \u2014 Green Solutions Ltd.',     value:3800,   correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Landscape Pro',            value:4500,   correct_section:'CL',  correct_order:2 },
          { name:'A/P \u2014 Terra Supply Co.',         value:2600,   correct_section:'CL',  correct_order:3 },
          { name:'Unearned Revenue',                     value:1800,   correct_section:'CL',  correct_order:4 },
          { name:'Bank Loan (5-year)',                   value:38000,  correct_section:'LTL', correct_order:1 },
          { name:'Mortgage Payable',                     value:52000,  correct_section:'LTL', correct_order:2 },
          { name:'E. Volkov, Capital, Jan. 1',           value:60000,  correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                      value:12300,  correct_section:'OE',  correct_order:2 },
          { name:'Less: E. Volkov, Drawings',            value:-4500,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Northgate Landscaping','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:8800,indent:0},{name:'A/R \u2014 D. Armstrong',value:2400,indent:1},{name:'A/R \u2014 T. Beaumont',value:1700,indent:1},{name:'A/R \u2014 G. Kwon',value:3100,indent:1},{name:'Merchandise Inventory',value:7200,indent:0},{name:'Prepaid Insurance',value:1400,indent:0},{name:'Supplies',value:900,indent:0}],
            current_total:25500,
            longterm:[{name:'Land',value:68000,indent:0},{name:'Building',value:42000,indent:0},{name:'Equipment',value:20000,indent:0},{name:'Vehicles',value:15000,indent:0}],
            longterm_total:145000,
            total:170500
          },
          liabilities:{
            current:[{name:'A/P \u2014 Green Solutions Ltd.',value:3800,indent:1},{name:'A/P \u2014 Landscape Pro',value:4500,indent:1},{name:'A/P \u2014 Terra Supply Co.',value:2600,indent:1},{name:'Unearned Revenue',value:1800,indent:0}],
            current_total:12700,
            longterm:[{name:'Bank Loan (5-year)',value:38000,indent:0},{name:'Mortgage Payable',value:52000,indent:0}],
            longterm_total:90000,
            total:102700
          },
          equity:{items:[{name:'E. Volkov, Capital, Jan. 1',value:60000},{name:'Add: Net Income',value:12300},{name:'Less: E. Volkov, Drawings',value:-4500},{name:'E. Volkov, Capital, Dec. 31',value:67800}],total:67800},
          total_liabilities_oe:170500
        },
        check:{total_assets:170500,total_loe:170500,balanced:true}
      },

      /* ---------- ADVANCED Level 2 — #3: Sunrise Bakery & Cafe ---------- */
      {
        type:'advanced', difficulty:2,
        company:'Sunrise Bakery & Caf\u00e9', owner:'H. Morales', date:'December 31, 2024',
        scenario_context:'Sunrise Bakery has a bank loan that must be split into a current portion and long-term remainder. There are multiple debtors and creditors, plus wages payable.',
        instructions:'Prepare a classified balance sheet for Sunrise Bakery & Caf\u00e9 as at December 31, 2024. Split the bank loan into its current and long-term portions. List all A/R debtors and A/P creditors alphabetically.',
        advanced_notes:[
          'A/R debtors alphabetically: L. Caruso, N. Patel, S. Williams.',
          'A/P creditors alphabetically: Bake Supply Co., Fresh Ingredients, Sweet Source Ltd.',
          'Bank loan current portion ($5,000) is a current liability; remaining $35,000 is long-term.'
        ],
        accounts:[
          { name:'Cash',                                value:10500,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 L. Caruso',               value:2200,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 N. Patel',                value:3500,   correct_section:'CA',  correct_order:3 },
          { name:'A/R \u2014 S. Williams',             value:1800,   correct_section:'CA',  correct_order:4 },
          { name:'Merchandise Inventory',                value:8400,   correct_section:'CA',  correct_order:5 },
          { name:'Prepaid Rent',                         value:2000,   correct_section:'CA',  correct_order:6 },
          { name:'Supplies',                             value:1100,   correct_section:'CA',  correct_order:7 },
          { name:'Land',                                 value:72000,  correct_section:'LTA', correct_order:1 },
          { name:'Building',                             value:55000,  correct_section:'LTA', correct_order:2 },
          { name:'Equipment',                            value:22000,  correct_section:'LTA', correct_order:3 },
          { name:'A/P \u2014 Bake Supply Co.',          value:3600,   correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Fresh Ingredients',        value:4800,   correct_section:'CL',  correct_order:2 },
          { name:'A/P \u2014 Sweet Source Ltd.',        value:2400,   correct_section:'CL',  correct_order:3 },
          { name:'Wages Payable',                        value:1900,   correct_section:'CL',  correct_order:4 },
          { name:'Current Portion of Bank Loan',         value:5000,   correct_section:'CL',  correct_order:5 },
          { name:'Bank Loan (remaining)',                value:35000,  correct_section:'LTL', correct_order:1 },
          { name:'Mortgage Payable',                     value:60000,  correct_section:'LTL', correct_order:2 },
          { name:'H. Morales, Capital, Jan. 1',          value:58000,  correct_section:'OE',  correct_order:1 },
          { name:'Add: Net Income',                      value:11800,  correct_section:'OE',  correct_order:2 },
          { name:'Less: H. Morales, Drawings',           value:-4000,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Sunrise Bakery & Caf\u00e9','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:10500,indent:0},{name:'A/R \u2014 L. Caruso',value:2200,indent:1},{name:'A/R \u2014 N. Patel',value:3500,indent:1},{name:'A/R \u2014 S. Williams',value:1800,indent:1},{name:'Merchandise Inventory',value:8400,indent:0},{name:'Prepaid Rent',value:2000,indent:0},{name:'Supplies',value:1100,indent:0}],
            current_total:29500,
            longterm:[{name:'Land',value:72000,indent:0},{name:'Building',value:55000,indent:0},{name:'Equipment',value:22000,indent:0}],
            longterm_total:149000,
            total:178500
          },
          liabilities:{
            current:[{name:'A/P \u2014 Bake Supply Co.',value:3600,indent:1},{name:'A/P \u2014 Fresh Ingredients',value:4800,indent:1},{name:'A/P \u2014 Sweet Source Ltd.',value:2400,indent:1},{name:'Wages Payable',value:1900,indent:0},{name:'Current Portion of Bank Loan',value:5000,indent:0}],
            current_total:17700,
            longterm:[{name:'Bank Loan (remaining)',value:35000,indent:0},{name:'Mortgage Payable',value:60000,indent:0}],
            longterm_total:95000,
            total:112700
          },
          equity:{items:[{name:'H. Morales, Capital, Jan. 1',value:58000},{name:'Add: Net Income',value:11800},{name:'Less: H. Morales, Drawings',value:-4000},{name:'H. Morales, Capital, Dec. 31',value:65800}],total:65800},
          total_liabilities_oe:178500
        },
        check:{total_assets:178500,total_loe:178500,balanced:true}
      },

      /* ---------- ADVANCED Level 3 — #3: Westcoast Marine Services ---------- */
      {
        type:'advanced', difficulty:3,
        company:'Westcoast Marine Services', owner:'J. Lindgren', date:'December 31, 2024',
        scenario_context:'Westcoast Marine had a net loss this period. The mortgage has a current portion due within 12 months. There are multiple debtors and creditors, plus wages payable.',
        instructions:'Prepare a classified balance sheet for Westcoast Marine Services as at December 31, 2024. The company had a net loss (which reduces equity), the mortgage must be split into current and long-term, and all A/R and A/P sub-accounts must be alphabetical.',
        advanced_notes:[
          'A net loss REDUCES equity. Show it as "Less: Net Loss" and subtract from beginning capital.',
          'The mortgage current portion ($7,000) is a current liability; remaining $75,000 is long-term.',
          'Both net loss and drawings are subtracted from beginning capital.'
        ],
        accounts:[
          { name:'Cash',                                value:13500,  correct_section:'CA',  correct_order:1 },
          { name:'A/R \u2014 M. Chang',                value:3600,   correct_section:'CA',  correct_order:2 },
          { name:'A/R \u2014 B. Hendricks',            value:4200,   correct_section:'CA',  correct_order:3 },
          { name:'A/R \u2014 T. Nikolaidis',           value:2800,   correct_section:'CA',  correct_order:4 },
          { name:'Merchandise Inventory',                value:10800,  correct_section:'CA',  correct_order:5 },
          { name:'Prepaid Insurance',                    value:3200,   correct_section:'CA',  correct_order:6 },
          { name:'Supplies',                             value:2100,   correct_section:'CA',  correct_order:7 },
          { name:'Land',                                 value:90000,  correct_section:'LTA', correct_order:1 },
          { name:'Building',                             value:68000,  correct_section:'LTA', correct_order:2 },
          { name:'Equipment',                            value:35000,  correct_section:'LTA', correct_order:3 },
          { name:'Vehicles',                             value:22000,  correct_section:'LTA', correct_order:4 },
          { name:'A/P \u2014 Coastal Supply Co.',       value:5500,   correct_section:'CL',  correct_order:1 },
          { name:'A/P \u2014 Harbour Equipment',        value:4800,   correct_section:'CL',  correct_order:2 },
          { name:'A/P \u2014 Pacific Marine Ltd.',      value:3200,   correct_section:'CL',  correct_order:3 },
          { name:'Wages Payable',                        value:2800,   correct_section:'CL',  correct_order:4 },
          { name:'Current Portion of Mortgage',          value:7000,   correct_section:'CL',  correct_order:5 },
          { name:'Bank Loan (5-year)',                   value:48000,  correct_section:'LTL', correct_order:1 },
          { name:'Mortgage Payable (remaining)',         value:75000,  correct_section:'LTL', correct_order:2 },
          { name:'J. Lindgren, Capital, Jan. 1',         value:120000, correct_section:'OE',  correct_order:1 },
          { name:'Less: Net Loss',                       value:-3800,  correct_section:'OE',  correct_order:2 },
          { name:'Less: J. Lindgren, Drawings',          value:-7300,  correct_section:'OE',  correct_order:3 },
        ],
        solution:{
          heading:['Westcoast Marine Services','Balance Sheet','As at December 31, 2024'],
          assets:{
            current:[{name:'Cash',value:13500,indent:0},{name:'A/R \u2014 M. Chang',value:3600,indent:1},{name:'A/R \u2014 B. Hendricks',value:4200,indent:1},{name:'A/R \u2014 T. Nikolaidis',value:2800,indent:1},{name:'Merchandise Inventory',value:10800,indent:0},{name:'Prepaid Insurance',value:3200,indent:0},{name:'Supplies',value:2100,indent:0}],
            current_total:40200,
            longterm:[{name:'Land',value:90000,indent:0},{name:'Building',value:68000,indent:0},{name:'Equipment',value:35000,indent:0},{name:'Vehicles',value:22000,indent:0}],
            longterm_total:215000,
            total:255200
          },
          liabilities:{
            current:[{name:'A/P \u2014 Coastal Supply Co.',value:5500,indent:1},{name:'A/P \u2014 Harbour Equipment',value:4800,indent:1},{name:'A/P \u2014 Pacific Marine Ltd.',value:3200,indent:1},{name:'Wages Payable',value:2800,indent:0},{name:'Current Portion of Mortgage',value:7000,indent:0}],
            current_total:23300,
            longterm:[{name:'Bank Loan (5-year)',value:48000,indent:0},{name:'Mortgage Payable (remaining)',value:75000,indent:0}],
            longterm_total:123000,
            total:146300
          },
          equity:{items:[{name:'J. Lindgren, Capital, Jan. 1',value:120000},{name:'Less: Net Loss',value:-3800},{name:'Less: J. Lindgren, Drawings',value:-7300},{name:'J. Lindgren, Capital, Dec. 31',value:108900}],total:108900},
          total_liabilities_oe:255200
        },
        check:{total_assets:255200,total_loe:255200,balanced:true}
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
      const pool = matches;
      const pick = pool[Math.floor(Math.random() * pool.length)];
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
        <span class="ai-q-meta-chip ai-chip-co">${q.company}</span>
        ${q.source_label ? `<span class="ai-q-meta-chip ai-chip-type">${q.source_label}</span>` : ''}`);
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
       CHECK ERRORS  —  AI-powered via Gemini
       ========================================================= */
    async function checkErrors() {
      if (!currentQ?.errors) return;
      const textarea = el('aiErrorInput');
      const raw      = (textarea?.value || '').trim();
      const lines    = raw.split('\n').map(l => l.trim()).filter(Boolean);

      const fb = el('aiErrFeedback');
      if (!fb) return;

      if (!lines.length) {
        fb.innerHTML = `<div class="ai-feedback-panel"><div class="ai-fb-header fb-fail">
          &#9888; Please write at least one error before checking.</div></div>`;
        show(fb);
        return;
      }

      /* Loading state */
      fb.innerHTML = `<div class="ai-feedback-panel">
        <div class="ai-fb-header fb-loading">
          <span class="ai-fb-spinner"></span>&nbsp; Gemini is marking your answer&hellip;
        </div>
      </div>`;
      show(fb);
      fb.scrollIntoView({ behavior:'smooth', block:'nearest' });

      let result;
      try {
        const resp = await fetch('/api/check-errors', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentAnswers: lines,
            errors: currentQ.errors,
            company: currentQ.company || '',
            totalErrors: currentQ.errors.length
          })
        });
        const payload = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          console.groupCollapsed('[AI Error Check] API failure');
          console.error('Status:', resp.status);
          console.error('Payload:', payload);
          console.error('Request context:', {
            questionCompany: currentQ.company || null,
            totalExpectedErrors: currentQ.errors.length,
            studentAnswerCount: lines.length,
            endpoint: '/api/check-errors'
          });
          console.groupEnd();
          const msg = payload?.userMessage || payload?.error || ('API returned ' + resp.status);
          throw new Error(msg);
        }
        result = payload;
      } catch (err) {
        console.groupCollapsed('[AI Error Check] Network/parse exception');
        console.error('Error object:', err);
        console.error('Request context:', {
          questionCompany: currentQ.company || null,
          totalExpectedErrors: currentQ.errors.length,
          studentAnswerCount: lines.length,
          endpoint: '/api/check-errors'
        });
        console.groupEnd();
        fb.innerHTML = `<div class="ai-feedback-panel"><div class="ai-fb-header fb-fail">
          &#9888; Could not reach the AI marker (${err.message}). Click <strong>See All Errors</strong> to check manually.
        </div></div>`;
        show(fb);
        return;
      }

      /* Fallback: Gemini returned unparseable text */
      if (result.parseError) {
        console.groupCollapsed('[AI Error Check] Parse fallback used');
        console.error('Request ID:', result.requestId || null);
        console.error('Raw model output:', result.raw);
        console.groupEnd();
        fb.innerHTML = `<div class="ai-feedback-panel"><div class="ai-fb-header fb-fail">
          &#9888; AI response couldn't be parsed. Raw: <pre style="font-size:.75rem;white-space:pre-wrap">${result.raw}</pre>
        </div></div>`;
        show(fb);
        return;
      }

      /* Render AI feedback ---------------------------------- */
      const score     = result.score   || {};
      const matched   = result.matched  || [];
      const partial   = result.partial  || [];
      const irrelevant= result.irrelevant || [];
      const missed    = result.missed   || [];
      const total     = score.total    ?? currentQ.errors.length;
      const found     = score.found    ?? matched.length;
      const partCount = score.partial  ?? partial.length;
      const pass      = score.pass     ?? (found + partCount >= Math.ceil(total * 0.6));

      const pct = total ? Math.round((found + partCount * 0.5) / total * 100) : 0;

      let html = `<div class="ai-feedback-panel ai-err-panel">
        <div class="ai-fb-header ${pass ? 'fb-pass' : 'fb-fail'}">
          <span class="ai-fb-score">${pass ? '&#127881;' : '&#128269;'} ${found} correct, ${partCount} partial out of ${total} errors &mdash; ${pct}%</span>
          ${result.summary ? `<div class="ai-fb-summary">${result.summary}</div>` : ''}
          ${result.fallbackUsed ? `<div class="ai-fb-summary"><strong>Note:</strong> Gemini is unavailable right now, so this was marked with a backup checker.</div>` : ''}
        </div>`;

      /* Correct answers */
      if (matched.length) {
        html += `<div class="ai-fb-group"><div class="ai-fb-group-label ai-fb-glabel-yes">&#10003; Correctly Identified</div>`;
        matched.forEach(m => {
          html += `<div class="ai-fb-item ai-fb-correct">
            <span class="ai-fb-icon">&#10003;</span>
            <div><div class="ai-fb-text">"${escHtml(m.studentText)}"</div>
            <div class="ai-fb-explain">${m.feedback || ''}</div></div>
          </div>`;
        });
        html += `</div>`;
      }

      /* Partial answers */
      if (partial.length) {
        html += `<div class="ai-fb-group"><div class="ai-fb-group-label ai-fb-glabel-partial">&#8764; Partially Correct</div>`;
        partial.forEach(m => {
          html += `<div class="ai-fb-item ai-fb-partial">
            <span class="ai-fb-icon">&#126;</span>
            <div><div class="ai-fb-text">"${escHtml(m.studentText)}"</div>
            <div class="ai-fb-explain">${m.feedback || ''}</div></div>
          </div>`;
        });
        html += `</div>`;
      }

      /* Irrelevant / wrong answers */
      if (irrelevant.length) {
        html += `<div class="ai-fb-group"><div class="ai-fb-group-label ai-fb-glabel-no">&#10005; Not Actually an Error</div>`;
        irrelevant.forEach(m => {
          html += `<div class="ai-fb-item ai-fb-wrong">
            <span class="ai-fb-icon">&#10005;</span>
            <div><div class="ai-fb-text">"${escHtml(m.studentText)}"</div>
            <div class="ai-fb-explain">${m.reason || ''}</div></div>
          </div>`;
        });
        html += `</div>`;
      }

      /* Missed errors (hints, no spoilers) */
      if (missed.length) {
        html += `<div class="ai-fb-group"><div class="ai-fb-group-label ai-fb-glabel-miss">&#128269; Still Missing (${missed.length})</div>`;
        missed.forEach(m => {
          html += `<div class="ai-fb-item ai-fb-miss">
            <span class="ai-fb-icon">?</span>
            <div><div class="ai-fb-text">${m.location ? `<em>${escHtml(m.location)}</em> &mdash; ` : ''}${escHtml(m.hint || 'Look more carefully at this section.')}</div>
            </div>
          </div>`;
        });
        html += `</div>`;
      }

      html += `</div>`;

      fb.innerHTML = html;
      show(fb);
      fb.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    function escHtml(s) {
      return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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

  /* ==========================================================
     CUE CARDS (Section 9) — Spaced Repetition Flashcards
     ========================================================== */
  (function ccModule() {
    const $  = id => document.getElementById(id);
    if (!$('ccCard')) return;

    /* ── Helpers ── */
    function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function pick(arr)     { return arr[Math.floor(Math.random() * arr.length)]; }
    function fmt(n)        { return '$' + n.toLocaleString('en-CA'); }
    function shuffle(arr)  {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    /* ── Account pools ── */
    const POOLS = {
      CA:  ['Cash', 'Bank', 'Accounts Receivable', 'Notes Receivable (due in 3 months)',
            'Supplies', 'Prepaid Insurance', 'Prepaid Rent', 'Merchandise Inventory', 'Short-Term Investment'],
      LTA: ['Land', 'Building', 'Equipment', 'Furniture & Equipment',
            'Delivery Vehicle', 'Computer Equipment', 'Leasehold Improvements', 'Machinery'],
      CL:  ['Accounts Payable', 'Wages Payable', 'GST/HST Payable',
            'Rent Payable', 'Unearned Revenue', 'Bank Loan (due in 90 days)'],
      LTL: ['Mortgage Payable', 'Bank Loan (5-year)',
            'Long-Term Notes Payable', 'Term Loan Payable (due in 4 years)']
    };
    const CAT_NAMES = {
      CA: 'Current Asset', LTA: 'Long-Term Asset',
      CL: 'Current Liability', LTL: 'Long-Term Liability'
    };

    /* ===================================================
       CARD TEMPLATES — each is a function → { type, q, a, hint? }
       =================================================== */
    const TEMPLATES = [

      /* ─── DEFINITIONS ─── */

      () => ({
        type: 'Definition',
        q: 'State the accounting equation.',
        a: '<span class="cc-eq">Assets = Liabilities + Owner\'s Equity</span>Everything a business <strong>owns</strong> (assets) is financed by either <strong>creditors</strong> (liabilities) or the <strong>owner</strong> (equity). The two sides must always be equal.'
      }),

      () => ({
        type: 'Definition',
        q: 'What does a balance sheet report?',
        a: 'A balance sheet shows the <strong>financial position</strong> of a business on a <em>specific date</em> — a snapshot of all assets, liabilities, and owner\'s equity such that:<span class="cc-eq">Total Assets = Total Liabilities + Owner\'s Equity</span>'
      }),

      () => ({
        type: 'Definition',
        q: 'What is Owner\'s Equity?',
        a: '<strong>Owner\'s Equity</strong> is the owner\'s claim on the assets of the business — the residual interest after subtracting all liabilities.<span class="cc-eq">Owner\'s Equity = Assets − Liabilities</span>It appears in the <em>bottom-right</em> section of a classified balance sheet.'
      }),

      () => ({
        type: 'Definition',
        q: 'What is a Current Asset?',
        a: 'A <strong>Current Asset</strong> is an asset that will be converted to cash <em>or</em> used up within <strong>one year</strong> (or the normal operating cycle).<br><br>Examples: Cash, Accounts Receivable, Supplies, Prepaid Insurance, Merchandise Inventory.<br><br>Current assets are listed in <strong>order of liquidity</strong> (most liquid first).'
      }),

      () => ({
        type: 'Definition',
        q: 'What is a Long-Term Asset?',
        a: 'A <strong>Long-Term Asset</strong> is an asset with a useful life of <strong>more than one year</strong>. It will NOT be converted to cash in the normal course of business within 12 months.<br><br>Examples: Land, Building, Equipment, Vehicles.<br><br>Listed in <strong>order of usefulness</strong> (longest life → shortest life, so Land comes first).'
      }),

      () => ({
        type: 'Definition',
        q: 'What is a Current Liability?',
        a: 'A <strong>Current Liability</strong> is a debt due to be paid within <strong>one year</strong>.<br><br>Examples: Accounts Payable, Wages Payable, GST Payable, Bank Loan (short-term).<br><br>Listed in <strong>order of payment</strong> — those due soonest appear first.'
      }),

      () => ({
        type: 'Definition',
        q: 'What is a Long-Term Liability?',
        a: 'A <strong>Long-Term Liability</strong> is a debt that extends <strong>beyond one year</strong> — not due within 12 months.<br><br>Examples: Mortgage Payable, Bank Loan (multi-year term), Long-Term Notes Payable.'
      }),

      () => ({
        type: 'Definition',
        q: 'What is "order of liquidity"?',
        a: '<strong>Order of liquidity</strong> means listing assets from <em>most easily converted to cash</em> → <em>least easily converted</em>.<br><br>Typical order:<ol style="margin:8px 0 0 20px"><li>Cash / Bank</li><li>Short-Term Investments</li><li>Notes Receivable (short-term)</li><li>Accounts Receivable</li><li>Merchandise Inventory</li><li>Prepaid Expenses (Insurance, Rent, Supplies)</li></ol>'
      }),

      () => ({
        type: 'Definition',
        q: 'What is the difference between a Classified and a Simplified Balance Sheet?',
        a: '<ul><li><strong>Simplified:</strong> Lists all assets together and all liabilities together — no sub-categories or subtotals for groups.</li><li><strong>Classified:</strong> Groups assets into <em>Current</em> and <em>Long-Term</em>, and liabilities into <em>Current</em> and <em>Long-Term</em>. Shows subtotals for each group. More useful for financial decision-making.</li></ul>'
      }),

      () => ({
        type: 'Definition',
        q: 'What does it mean that liabilities and owner\'s equity are "claims against assets"?',
        a: 'Every asset the business owns must be funded by <em>someone</em>:<ul><li><strong>Liabilities</strong> = creditors\' claim (money owed to outside parties)</li><li><strong>Owner\'s Equity</strong> = owner\'s claim (owner\'s net investment and retained earnings)</li></ul>Together they equal Total Assets:<span class="cc-eq">Assets = Liabilities + Owner\'s Equity</span>'
      }),

      /* ─── EQUATION REARRANGING ─── */

      () => ({
        type: 'Equation',
        q: 'Rearrange the accounting equation to solve for Owner\'s Equity.',
        hint: 'Start from: Assets = Liabilities + Owner\'s Equity',
        a: '<span class="cc-eq">Owner\'s Equity = Assets − Liabilities</span>Subtract Liabilities from both sides of the original equation.'
      }),

      () => ({
        type: 'Equation',
        q: 'Rearrange the accounting equation to solve for Liabilities.',
        hint: 'Start from: Assets = Liabilities + Owner\'s Equity',
        a: '<span class="cc-eq">Liabilities = Assets − Owner\'s Equity</span>Subtract Owner\'s Equity from both sides of the original equation.'
      }),

      () => ({
        type: 'Equation',
        q: 'A balance sheet must always "balance." What does this mean exactly?',
        a: 'It means the equation holds true:<span class="cc-eq">Total Assets = Total Liabilities + Owner\'s Equity</span>Both sides must be <strong>equal</strong>. An imbalance signals a classification, arithmetic, or recording error.'
      }),

      () => ({
        type: 'Equation',
        q: 'If Owner\'s Equity increases (e.g., from net income), but assets stay the same, what must change in the equation?',
        a: 'If OE increases and Assets stay the same, then <strong>Liabilities must decrease</strong> by the same amount to keep the equation balanced:<span class="cc-eq">Assets = Liabilities + Owner\'s Equity</span>This is because a change to one side must be offset by an equal change on the other.'
      }),

      /* ─── EQUATION CALCULATIONS (randomised numbers) ─── */

      () => {
        const l = rnd(5, 30) * 1000, oe = rnd(10, 60) * 1000, a = l + oe;
        return {
          type: 'Equation',
          q: `Total Liabilities = ${fmt(l)}<br>Owner's Equity = ${fmt(oe)}<br><br>Calculate <strong>Total Assets</strong>.`,
          a: `<span class="cc-eq">Assets = Liabilities + Owner's Equity<br>= ${fmt(l)} + ${fmt(oe)} = <strong>${fmt(a)}</strong></span><span class="cc-correct">&#10003; Total Assets = ${fmt(a)}</span>`
        };
      },

      () => {
        const a = rnd(40, 200) * 1000;
        const l = rnd(10, Math.max(11, Math.floor(a / 1000 * 0.55))) * 1000;
        const oe = a - l;
        return {
          type: 'Equation',
          q: `Total Assets = ${fmt(a)}<br>Total Liabilities = ${fmt(l)}<br><br>Calculate <strong>Owner's Equity</strong>.`,
          a: `<span class="cc-eq">Owner's Equity = Assets − Liabilities<br>= ${fmt(a)} − ${fmt(l)} = <strong>${fmt(oe)}</strong></span><span class="cc-correct">&#10003; Owner's Equity = ${fmt(oe)}</span>`
        };
      },

      () => {
        const a = rnd(50, 300) * 1000;
        const oe = rnd(15, Math.max(16, Math.floor(a / 1000 * 0.65))) * 1000;
        const l = a - oe;
        return {
          type: 'Equation',
          q: `Total Assets = ${fmt(a)}<br>Owner's Equity = ${fmt(oe)}<br><br>Calculate <strong>Total Liabilities</strong>.`,
          a: `<span class="cc-eq">Liabilities = Assets − Owner's Equity<br>= ${fmt(a)} − ${fmt(oe)} = <strong>${fmt(l)}</strong></span><span class="cc-correct">&#10003; Total Liabilities = ${fmt(l)}</span>`
        };
      },

      () => {
        const ca = rnd(5, 40) * 1000, lta = rnd(20, 150) * 1000;
        const cl = rnd(3, 20) * 1000, ltl = rnd(10, 80) * 1000;
        const a = ca + lta, lo = cl + ltl, oe = a - lo;
        return {
          type: 'Equation',
          q: `Current Assets = ${fmt(ca)}<br>Long-Term Assets = ${fmt(lta)}<br>Current Liabilities = ${fmt(cl)}<br>Long-Term Liabilities = ${fmt(ltl)}<br><br>What is <strong>Owner's Equity</strong>?`,
          a: `<span class="cc-eq">Total Assets = ${fmt(ca)} + ${fmt(lta)} = ${fmt(a)}<br>Total Liabilities = ${fmt(cl)} + ${fmt(ltl)} = ${fmt(lo)}<br>Owner's Equity = ${fmt(a)} − ${fmt(lo)} = <strong>${fmt(oe)}</strong></span><span class="cc-correct">&#10003; Owner's Equity = ${fmt(oe)}</span>`
        };
      },

      () => {
        const oe1 = rnd(20, 100) * 1000, ni = rnd(5, 30) * 1000, draw = rnd(1, 15) * 1000;
        const oe2 = oe1 + ni - draw;
        return {
          type: 'Equation',
          q: `[Owner], Capital (Jan. 1) = ${fmt(oe1)}<br>Net Income = ${fmt(ni)}<br>Drawings = ${fmt(draw)}<br><br>Calculate <strong>ending Capital (Dec. 31)</strong>.`,
          a: `<span class="cc-eq">Ending Capital = Opening Capital + Net Income − Drawings<br>= ${fmt(oe1)} + ${fmt(ni)} − ${fmt(draw)} = <strong>${fmt(oe2)}</strong></span><span class="cc-correct">&#10003; Ending Capital = ${fmt(oe2)}</span>`
        };
      },

      () => {
        const ca = rnd(8, 50) * 1000, lta = rnd(30, 200) * 1000;
        return {
          type: 'Equation',
          q: `Current Assets total ${fmt(ca)} and Long-Term Assets total ${fmt(lta)}.<br><br>What is <strong>Total Assets</strong>?`,
          a: `<span class="cc-eq">Total Assets = Current Assets + Long-Term Assets<br>= ${fmt(ca)} + ${fmt(lta)} = <strong>${fmt(ca + lta)}</strong></span><span class="cc-correct">&#10003; Total Assets = ${fmt(ca + lta)}</span>`
        };
      },

      () => {
        const cl = rnd(3, 25) * 1000, ltl = rnd(15, 80) * 1000;
        return {
          type: 'Equation',
          q: `Current Liabilities = ${fmt(cl)}<br>Long-Term Liabilities = ${fmt(ltl)}<br><br>What is <strong>Total Liabilities</strong>?`,
          a: `<span class="cc-eq">Total Liabilities = CL + LTL<br>= ${fmt(cl)} + ${fmt(ltl)} = <strong>${fmt(cl + ltl)}</strong></span><span class="cc-correct">&#10003; Total Liabilities = ${fmt(cl + ltl)}</span>`
        };
      },

      () => {
        const a = rnd(60, 250) * 1000;
        const l = rnd(20, Math.max(21, Math.floor(a / 1000 * 0.55))) * 1000;
        const oe = a - l;
        return {
          type: 'Equation',
          q: `A balance sheet shows:<br>Total Assets = ${fmt(a)}<br>Total Liabilities = ${fmt(l)}<br>Owner's Equity = ${fmt(oe)}<br><br><strong>Does this balance sheet balance? How do you verify?</strong>`,
          a: `<span class="cc-eq">L + OE = ${fmt(l)} + ${fmt(oe)} = ${fmt(l + oe)}</span><span class="cc-correct">&#10003; Yes — it balances. ${fmt(l + oe)} = ${fmt(a)}.</span><br>Always verify: <strong>Total Liabilities + OE must equal Total Assets.</strong>`
        };
      },

      /* ─── CLASSIFICATION (10 randomised) ─── */

      ...Array.from({ length: 10 }, () => () => {
        const cats    = ['CA', 'LTA', 'CL', 'LTL'];
        const cat     = pick(cats);
        const acct    = pick(POOLS[cat]);
        const catExpl = {
          CA:  'It will be converted to cash or used up within <strong>one year</strong>.',
          LTA: 'It has a useful life of <strong>more than one year</strong> and is not sold in the normal course of business.',
          CL:  'This debt is due to be paid within <strong>one year</strong>.',
          LTL: 'This debt is <strong>not</strong> due within one year — it extends beyond 12 months.'
        };
        return {
          type: 'Classification',
          q:    `How would you classify <strong>"${acct}"</strong> on a classified balance sheet?`,
          hint: 'Think: owned or owed? Short-term or long-term?',
          a:    `<span class="cc-correct">&#10003; ${CAT_NAMES[cat]}</span><br><br>${catExpl[cat]}<br><br>It belongs in the <strong>${CAT_NAMES[cat]}s</strong> section.`
        };
      }),

      /* ─── ORDERING ─── */

      () => ({
        type: 'Ordering',
        q: 'List Current Assets in correct order of liquidity (most → least liquid).',
        a: '<ol style="margin:8px 0 0 20px"><li>Cash / Bank</li><li>Short-Term Investments</li><li>Notes Receivable (short-term)</li><li>Accounts Receivable (with sub-debtors)</li><li>Merchandise Inventory</li><li>Prepaid Expenses (Insurance, Rent, Supplies)</li></ol><strong>Rule:</strong> the asset closest to cash goes first.'
      }),

      () => ({
        type: 'Ordering',
        q: 'List Long-Term Assets in correct order (most permanent → least permanent).',
        a: '<ol style="margin:8px 0 0 20px"><li>Land (never depreciates — most permanent)</li><li>Building</li><li>Equipment / Furniture & Equipment</li><li>Vehicles / Delivery Truck</li><li>Computer Equipment (shortest useful life)</li></ol><strong>Rule:</strong> longest useful life listed first.'
      }),

      () => ({
        type: 'Ordering',
        q: 'List Current Liabilities in correct order of payment (due soonest → due latest).',
        a: '<ol style="margin:8px 0 0 20px"><li>Bank Loan (demand / short-term)</li><li>Accounts Payable (with sub-creditors)</li><li>Wages Payable</li><li>GST/HST Payable</li><li>Rent Payable</li><li>Unearned Revenue</li></ol><strong>Rule:</strong> debts due soonest appear first.'
      }),

      () => ({
        type: 'Ordering',
        q: 'What is the standard top-to-bottom section order on a classified balance sheet?',
        a: '<ol style="margin:8px 0 0 20px"><li><strong>Assets</strong><ol style="margin:4px 0 0 16px"><li>Current Assets → Total Current Assets</li><li>Long-Term Assets → Total Long-Term Assets</li><li><strong>Total Assets</strong> (double underline)</li></ol></li><li><strong>Liabilities</strong><ol style="margin:4px 0 0 16px"><li>Current Liabilities → Total Current Liabilities</li><li>Long-Term Liabilities → Total Long-Term Liabilities</li><li>Total Liabilities</li></ol></li><li><strong>Owner\'s Equity</strong> → Total Liabilities + OE (double underline)</li></ol>'
      }),

      () => ({
        type: 'Ordering',
        q: 'A student lists these Current Assets: Merchandise Inventory, Cash, Prepaid Rent, Accounts Receivable.\n\nWhat is the CORRECT order?',
        a: '<ol style="margin:8px 0 0 20px"><li><span class="cc-correct">Cash</span> (most liquid)</li><li><span class="cc-correct">Accounts Receivable</span></li><li><span class="cc-correct">Merchandise Inventory</span></li><li><span class="cc-correct">Prepaid Rent</span> (least liquid — prepaid expenses always last)</li></ol>'
      }),

      /* ─── FORMATTING RULES ─── */

      () => ({
        type: 'Formatting',
        q: 'What are the three lines of a Balance Sheet heading?',
        a: 'Every balance sheet heading has exactly <strong>three centred lines</strong>:<ol style="margin:8px 0 0 20px"><li><strong>Company Name</strong> (e.g., New Western Company)</li><li><strong>Statement Name:</strong> Balance Sheet</li><li><strong>Date:</strong> As at [Month Day, Year]</li></ol>Example:<span class="cc-eq">New Western Company\nBalance Sheet\nAs at December 31, 2025</span>'
      }),

      () => ({
        type: 'Formatting',
        q: 'What is the correct date phrase on a Balance Sheet heading?',
        a: '<span class="cc-correct">As at [Month Day, Year]</span><br>e.g. <span class="cc-mono">As at December 31, 2025</span><br><br><span class="cc-wrong">&#10005; Wrong:</span> "For the Year Ended…" — this belongs on an <em>Income Statement</em>. A balance sheet is a <strong>point-in-time snapshot</strong>, not a period report.'
      }),

      () => ({
        type: 'Formatting',
        q: 'Where does a single underline appear on a classified balance sheet?',
        a: 'A <strong>single underline</strong> appears under the <em>last item</em> before a subtotal:<ul><li>Under the last Current Asset (before Total Current Assets)</li><li>Under the last Long-Term Asset (before Total Long-Term Assets)</li><li>Under the last Current Liability, etc.</li></ul>It signals: <em>"the next line is a subtotal."</em>'
      }),

      () => ({
        type: 'Formatting',
        q: 'Where does a double underline appear on a classified balance sheet?',
        a: 'A <strong>double underline</strong> appears under the two <em>grand totals</em> only:<ul><li>Under <strong>Total Assets</strong></li><li>Under <strong>Total Liabilities + Owner\'s Equity</strong></li></ul>These must be equal. The double underline signals: <em>"final answer — no more calculations."</em>'
      }),

      () => ({
        type: 'Formatting',
        q: 'How are individual A/R debtors presented under Accounts Receivable?',
        a: 'Individual debtors are <strong>indented</strong> under the A/R header with their own subtotal:<span class="cc-eq">Accounts Receivable\n  A/R — J. Smith      $1 200\n  A/R — T. Lee        $2 400\nTotal Accounts Receivable $3 600</span>The same indented format applies to Accounts Payable creditors.'
      }),

      () => ({
        type: 'Formatting',
        q: 'What is the final line on every classified balance sheet, and what must it equal?',
        a: 'The final line is:<br><span class="cc-mono">Total Liabilities and Owner\'s Equity</span><br><br>It is followed by a <strong>double underline</strong> and must equal <span class="cc-correct">Total Assets</span>.<br><br>If these two values differ, the balance sheet has an error.'
      }),

      () => ({
        type: 'Formatting',
        q: 'What dollar amounts go in the inner (indent) column vs the outer (total) column?',
        a: '<ul><li><strong>Inner column:</strong> Individual account amounts and sub-items (e.g., each A/R debtor amount)</li><li><strong>Outer column:</strong> Subtotals and totals (e.g., Total Current Assets, Total Assets)</li></ul>This two-column layout clearly separates individual items from group totals.'
      }),

      () => ({
        type: 'Formatting',
        q: 'Where does Owner\'s Equity appear on a classified balance sheet, and what does it typically contain?',
        a: 'Owner\'s Equity appears in the <strong>bottom-right section</strong>, below Total Liabilities.<br><br>It typically shows:<ul><li>[Owner], Capital, Jan. 1 (opening balance)</li><li>Add: Net Income</li><li>Less: Drawings</li><li>[Owner], Capital, Dec. 31 (closing balance)</li></ul>Ending Capital + Total Liabilities must equal Total Assets.'
      }),

      /* ─── ERROR SPOTTING ─── */

      () => ({
        type: 'Error Spotting',
        q: 'A balance sheet heading reads:<br><em>"Maple Leaf Bakery<br>Income Statement<br>As at December 31, 2025"</em><br><br>Identify the error.',
        a: '<span class="cc-wrong">&#10005; Error:</span> The statement type says <strong>"Income Statement"</strong> — it should say <strong>"Balance Sheet."</strong><br><br>An Income Statement reports revenues and expenses <em>over a period</em>. A Balance Sheet reports financial position <em>on a specific date</em>.'
      }),

      () => ({
        type: 'Error Spotting',
        q: 'A balance sheet heading reads:<br><em>"Valley Plumbing<br>Balance Sheet<br>For the Year Ended March 31, 2025"</em><br><br>Identify the error.',
        a: '<span class="cc-wrong">&#10005; Error:</span> The date uses <strong>"For the Year Ended"</strong> — this phrase belongs on an <em>Income Statement</em>.<br><br><span class="cc-correct">&#10003; Fix:</span> Change to <strong>"As at March 31, 2025"</strong>. A balance sheet is a point-in-time snapshot.'
      }),

      () => ({
        type: 'Error Spotting',
        q: 'A classified balance sheet lists Cash <em>after</em> Accounts Receivable in the Current Assets section.<br><br>What is wrong?',
        a: '<span class="cc-wrong">&#10005; Error:</span> Current Assets must be in <strong>order of liquidity</strong> — most liquid first.<br><br><span class="cc-correct">&#10003; Fix:</span> <strong>Cash</strong> is the most liquid asset and must come <em>first</em>. Accounts Receivable follows.'
      }),

      () => ({
        type: 'Error Spotting',
        q: 'A classified balance sheet lists "Land" inside the <em>Current Assets</em> section.<br><br>What is wrong?',
        a: '<span class="cc-wrong">&#10005; Error:</span> <strong>Land</strong> is a <em>Long-Term Asset</em>, not a Current Asset.<br><br>Land will NOT be converted to cash within one year in normal operations — it has an indefinite useful life.<br><br><span class="cc-correct">&#10003; Fix:</span> Move Land to the Long-Term Assets section, listing it <em>first</em> (most permanent).'
      }),

      () => {
        const a = rnd(60, 200) * 1000;
        const loe = a - rnd(1, 5) * 1000;
        return {
          type: 'Error Spotting',
          q: `A balance sheet shows:<br>Total Assets = ${fmt(a)}<br>Total Liabilities + Owner's Equity = ${fmt(loe)}<br><br>What does this indicate and what should you do?`,
          a: `<span class="cc-wrong">&#10005; The balance sheet does NOT balance.</span><br><br>There is a ${fmt(a - loe)} discrepancy — Total Assets ≠ L + OE.<br><br>Possible causes:<ul><li>An account is mis-classified or omitted</li><li>A subtotal or total was calculated incorrectly</li><li>An amount was entered in the wrong column</li></ul><strong>Action:</strong> Re-check all account placements and arithmetic.`
        };
      },

      () => ({
        type: 'Error Spotting',
        q: 'A classified balance sheet lists "Mortgage Payable" inside <em>Current Liabilities</em>.<br><br>What is wrong?',
        a: '<span class="cc-wrong">&#10005; Error:</span> <strong>Mortgage Payable</strong> is a <em>Long-Term Liability</em>, not a Current Liability.<br><br>A mortgage is typically repaid over many years (e.g., 20–25 years), not within 12 months.<br><br><span class="cc-correct">&#10003; Fix:</span> Move Mortgage Payable to the Long-Term Liabilities section.'
      }),

    ]; // end TEMPLATES

    /* ── Spaced repetition state ── */
    let queue       = [];
    let pointer     = 0;
    let missedCards = [];
    let yesCount    = 0;
    let noCount     = 0;
    let revealed    = false;
    let currentCard = null;

    /* ── Deck builder ── */
    function generateDeck(fromMissed) {
      return fromMissed ? shuffle([...missedCards]) : shuffle(TEMPLATES.map(fn => fn()));
    }

    function startSession(fromMissed) {
      queue    = generateDeck(fromMissed);
      pointer  = 0;
      revealed = false;
      if (!fromMissed) { missedCards = []; yesCount = 0; noCount = 0; }
      hideDone();
      updateStats();
      showCard();
    }

    /* ── Card display ── */
    function showCard(skipAnim) {
      if (pointer >= queue.length) { showDone(); return; }
      currentCard = queue[pointer];
      revealed    = false;

      const doRender = () => {
        $('ccCardType').textContent = currentCard.type;
        $('ccCardType').setAttribute('data-cat', currentCard.type);
        $('ccCardQ').innerHTML      = currentCard.q;
        $('ccCardA').innerHTML      = currentCard.a || '';
        $('ccCardHint').textContent = currentCard.hint || '';
        $('ccCardAnswer').classList.remove('visible');
        $('ccReveal').classList.remove('hidden');
        $('ccReveal').disabled    = false;
        $('ccNo').disabled        = true;
        $('ccYes').disabled       = true;
        $('ccCard').classList.remove('cc-flash-yes', 'cc-flash-no', 'sliding-out', 'sliding-in');
        if (!skipAnim) {
          $('ccCard').classList.add('sliding-in');
          $('ccCard').addEventListener('animationend', () => $('ccCard').classList.remove('sliding-in'), { once: true });
        }
        const total = queue.length;
        $('ccProgressFill').style.width  = Math.round((pointer / total) * 100) + '%';
        $('ccProgressLabel').textContent = 'Card ' + (pointer + 1) + ' of ' + total;
      };

      if (!skipAnim) {
        $('ccCard').classList.add('sliding-out');
        $('ccCard').addEventListener('animationend', doRender, { once: true });
      } else {
        doRender();
      }
    }

    function revealAnswer() {
      if (revealed) return;
      revealed = true;
      $('ccCardAnswer').classList.add('visible');
      $('ccReveal').classList.add('hidden');
      $('ccNo').disabled  = false;
      $('ccYes').disabled = false;
    }

    function rate(understood) {
      if (!revealed) return;
      if (understood) {
        yesCount++;
        $('ccCard').classList.add('cc-flash-yes');
      } else {
        noCount++;
        $('ccCard').classList.add('cc-flash-no');
        // Re-insert card 3–5 positions ahead (comes back soon)
        const insertAt = Math.min(pointer + rnd(3, 5), queue.length);
        queue.splice(insertAt, 0, Object.assign({}, currentCard));
        // Track unique missed cards
        if (!missedCards.find(c => c.q === currentCard.q)) {
          missedCards.push(Object.assign({}, currentCard));
        }
      }
      pointer++;
      updateStats();
      setTimeout(showCard, 300);
    }

    /* ── Stats ── */
    function updateStats() {
      const studied = yesCount + noCount;
      $('ccStatStudied').textContent = String(studied);
      $('ccStatYesPct').textContent  = studied ? Math.round(yesCount / studied * 100) + '%' : '\u2014';
      $('ccStatNoPct').textContent   = studied ? Math.round(noCount  / studied * 100) + '%' : '\u2014';
      $('ccMissedBadge').textContent = String(missedCards.length);
      const missedBtn = $('ccRestartMissed');
      if (missedBtn) missedBtn.disabled = missedCards.length === 0;
      const missedModeBtn = $('ccModeMissed');
      if (missedModeBtn) missedModeBtn.disabled = missedCards.length === 0;
    }

    /* ── Done screen ── */
    function showDone() {
      $('ccCard').classList.add('hidden');
      $('ccActions').classList.add('hidden');
      $('ccProgressFill').style.width  = '100%';
      $('ccProgressLabel').textContent = 'All cards reviewed';
      const studied = yesCount + noCount;
      $('ccDoneSub').innerHTML =
        'You studied <strong>' + studied + '</strong> card' + (studied !== 1 ? 's' : '') + ' this session. ' +
        '<span style="color:var(--green);font-weight:700">' + Math.round(yesCount / (studied || 1) * 100) + '% understood</span>, ' +
        '<span style="color:var(--red);font-weight:700">' + Math.round(noCount / (studied || 1) * 100) + '% missed</span>.' +
        (missedCards.length
          ? '<br>You have <strong>' + missedCards.length + '</strong> missed card' + (missedCards.length !== 1 ? 's' : '') + ' ready to review.'
          : '<br>&#127881; Perfect round — no missed cards!');
      $('ccDone').classList.remove('hidden');
    }

    function hideDone() {
      $('ccDone').classList.add('hidden');
      $('ccCard').classList.remove('hidden');
      $('ccActions').classList.remove('hidden');
    }

    /* ── Event listeners ── */
    $('ccReveal').addEventListener('click', revealAnswer);
    $('ccYes').addEventListener('click', () => rate(true));
    $('ccNo').addEventListener('click',  () => rate(false));

    $('ccModeAll').addEventListener('click', () => {
      $('ccModeAll').classList.add('active');
      $('ccModeMissed').classList.remove('active');
      startSession(false);
    });
    $('ccModeMissed').addEventListener('click', () => {
      if (!missedCards.length) return;
      $('ccModeMissed').classList.add('active');
      $('ccModeAll').classList.remove('active');
      startSession(true);
    });
    $('ccRestartAll').addEventListener('click', () => {
      $('ccModeAll').classList.add('active');
      $('ccModeMissed').classList.remove('active');
      startSession(false);
    });
    $('ccRestartMissed').addEventListener('click', () => {
      if (!missedCards.length) return;
      $('ccModeMissed').classList.add('active');
      $('ccModeAll').classList.remove('active');
      startSession(true);
    });

    // Shuffle: re-shuffle remaining unplayed cards
    $('ccShuffle').addEventListener('click', () => {
      const remaining = queue.slice(pointer);
      const played    = queue.slice(0, pointer);
      const reshuffled = shuffle(remaining);
      queue = played.concat(reshuffled);
      showCard(true);
    });

    // Restart: reset all state + start fresh
    $('ccRestart').addEventListener('click', () => {
      yesCount = 0; noCount = 0; missedCards = [];
      $('ccModeAll').classList.add('active');
      $('ccModeMissed').classList.remove('active');
      startSession(false);
    });

    /* ── Boot ── */
    startSession(false);

  })(); // end ccModule

  /* ==========================================================
     DRAG-DROP EXTRAS: Hint toggle + See Answer
     ========================================================== */
  (function dragExtras() {
    const bankEl     = document.getElementById('dragBank');
    const hintBtn    = document.getElementById('toggleHints');
    const seeAnsBtn  = document.getElementById('seeAnswer');
    if (!hintBtn || !seeAnsBtn || !bankEl) return;

    let hintsOn = false;

    hintBtn.addEventListener('click', () => {
      hintsOn = !hintsOn;
      const practiceSection = document.getElementById('practice');
      if (practiceSection) practiceSection.classList.toggle('hints-visible', hintsOn);
      hintBtn.textContent = hintsOn ? '\u{1F4A1} Hide Hints' : '\u{1F4A1} Show Hints';
      hintBtn.classList.toggle('btn-primary', hintsOn);
      hintBtn.classList.toggle('btn-subtle', !hintsOn);
    });

    seeAnsBtn.addEventListener('click', () => {
      // Move every card to its correct zone
      const zoneMap = { CA: 'dropCA', LTA: 'dropLTA', CL: 'dropCL', LTL: 'dropLTL', OE: 'dropOE' };
      const allCards = [...document.querySelectorAll('.drag-item')];
      allCards.forEach(card => {
        const correctZoneId = zoneMap[card.getAttribute('data-correct')];
        if (!correctZoneId) return;
        const zone = document.getElementById(correctZoneId);
        if (!zone) return;
        zone.querySelector('.drop-list').appendChild(card);
        card.classList.add('correct-placement');
        card.classList.remove('wrong-placement');
      });
      // Recalc totals (function is defined in outer scope)
      if (typeof recalcTotals === 'function') recalcTotals();
      else {
        // trigger input-style recalc via dispatching a drop event indirectly
        document.getElementById('checkBalance').dispatchEvent(new Event('click'));
      }
    });
  })();

  /* ==========================================================
     FLOATING CALCULATOR  (Windows-style + Math.js API)
     ========================================================== */
  (function calcModule() {
    const fab   = document.getElementById('calcFab');
    const panel = document.getElementById('calcPanel');
    const dragHandle = panel?.querySelector('.calc-header');
    const closeBtn = document.getElementById('calcClose');
    const display  = document.getElementById('calcDisplay');
    const historyEl = document.getElementById('calcHistory');
    if (!fab || !panel) return;

    /* ── state ── */
    let expr     = '';      // expression string built so far, e.g. "10+5*"
    let current  = '0';    // number currently being typed
    let justCalc = false;  // true right after pressing =
    let memory   = 0;
    let hasMem   = false;
    let activeOpBtn = null;

    const mcBtn = panel.querySelector('[data-mem="mc"]');
    const mrBtn = panel.querySelector('[data-mem="mr"]');
    function syncMem() {
      if (mcBtn) mcBtn.disabled = !hasMem;
      if (mrBtn) mrBtn.disabled = !hasMem;
    }

    fab.addEventListener('click', () => panel.classList.toggle('hidden'));
    closeBtn.addEventListener('click', () => panel.classList.add('hidden'));

    // Drag panel by header (desktop + touch via Pointer Events)
    let dragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

    function onDragMove(e) {
      if (!dragging) return;
      const w = panel.offsetWidth;
      const h = panel.offsetHeight;
      const maxX = Math.max(0, window.innerWidth - w - 8);
      const maxY = Math.max(0, window.innerHeight - h - 8);
      const x = clamp(e.clientX - dragOffsetX, 8, maxX);
      const y = clamp(e.clientY - dragOffsetY, 8, maxY);
      panel.style.left = x + 'px';
      panel.style.top = y + 'px';
      panel.style.bottom = 'auto';
    }

    function onDragEnd() {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('dragging');
      window.removeEventListener('pointermove', onDragMove);
      window.removeEventListener('pointerup', onDragEnd);
      window.removeEventListener('pointercancel', onDragEnd);
    }

    if (dragHandle) {
      dragHandle.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.calc-close')) return;
        if (panel.classList.contains('hidden')) return;
        const rect = panel.getBoundingClientRect();
        dragging = true;
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        panel.classList.add('dragging');
        panel.style.left = rect.left + 'px';
        panel.style.top = rect.top + 'px';
        panel.style.bottom = 'auto';
        window.addEventListener('pointermove', onDragMove);
        window.addEventListener('pointerup', onDragEnd);
        window.addEventListener('pointercancel', onDragEnd);
        e.preventDefault();
      });
    }

    /* ── helpers ── */
    function fmt(s) {
      if (s === 'Error') return s;
      const n = parseFloat(s);
      if (isNaN(n)) return '0';
      let str = parseFloat(n.toPrecision(10)).toString();
      const p = str.split('.');
      p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return p.join('.');
    }
    function niceExpr(e) {
      return e.replace(/\*/g, ' \u00d7 ').replace(/\//g, ' \u00f7 ').replace(/\+/g, ' + ').replace(/(?<=\d)-/g, ' \u2212 ');
    }
    function show() { display.textContent = fmt(current); }
    function hist(s) { historyEl.textContent = s || ''; }
    function clearOp() { if (activeOpBtn) { activeOpBtn.classList.remove('active-op'); activeOpBtn = null; } }

    /* ── input ── */
    function pressNum(n) {
      if (justCalc) { expr = ''; current = '0'; justCalc = false; hist(''); }
      clearOp();
      if (n === '.' && current.includes('.')) return;
      current = (current === '0' && n !== '.') ? n : current + n;
      show();
    }

    function pressOp(op) {
      if (justCalc) justCalc = false;
      // replace last operator if user changes mind
      if (expr && '+-*/'.includes(expr.slice(-1)) && current === '0') {
        expr = expr.slice(0, -1) + op;
      } else {
        expr += current + op;
        current = '0';
      }
      hist(niceExpr(expr));
      // highlight active operator button
      clearOp();
      const btn = panel.querySelector('[data-op="' + op + '"]');
      if (btn) { btn.classList.add('active-op'); activeOpBtn = btn; }
    }

    /* ── calculate via Math.js API (local fallback) ── */
    async function calculate() {
      const full = expr + current;
      if (!full || full === '0') return;
      hist(niceExpr(full) + ' =');
      clearOp();

      try {
        const res  = await fetch('https://api.mathjs.org/v4/?expr=' + encodeURIComponent(full));
        const text = await res.text();
        if (text.toLowerCase().startsWith('error') || isNaN(parseFloat(text))) throw new Error(text);
        current = String(parseFloat(text));
      } catch (_) {
        // offline / error fallback — simple local eval
        try {
          const r = Function('"use strict"; return (' + full + ')')();
          current = String(parseFloat(parseFloat(r).toPrecision(12)));
        } catch (_e) { current = 'Error'; }
      }
      expr = '';
      justCalc = true;
      show();
    }

    /* ── actions ── */
    function clearEntry() { current = '0'; show(); clearOp(); }
    function clearAll()   { expr = ''; current = '0'; justCalc = false; hist(''); show(); clearOp(); }
    function backspace()  { if (justCalc) return; current = current.length > 1 ? current.slice(0, -1) : '0'; show(); }
    function toggleSign() {
      if (current === '0' || current === 'Error') return;
      current = current.startsWith('-') ? current.slice(1) : '-' + current;
      show();
    }
    function pct()   { current = String(parseFloat(current) / 100); show(); }
    function recip() {
      const v = parseFloat(current);
      hist('1/(' + fmt(String(v)) + ')');
      current = v === 0 ? 'Error' : String(1 / v); justCalc = true; show();
    }
    function sq() {
      const v = parseFloat(current);
      hist('sqr(' + fmt(String(v)) + ')');
      current = String(v * v); justCalc = true; show();
    }
    function sqrt() {
      const v = parseFloat(current);
      hist('\u221a(' + fmt(String(v)) + ')');
      current = v < 0 ? 'Error' : String(Math.sqrt(v)); justCalc = true; show();
    }

    /* ── button router ── */
    panel.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const num = btn.getAttribute('data-num');
        const op  = btn.getAttribute('data-op');
        const act = btn.getAttribute('data-action');
        const mem = btn.getAttribute('data-mem');

        if (num !== null)          pressNum(num);
        else if (op !== null)      pressOp(op);
        else if (act === 'clear')  clearAll();
        else if (act === 'ce')     clearEntry();
        else if (act === 'back')   backspace();
        else if (act === 'sign')   toggleSign();
        else if (act === 'pct')    pct();
        else if (act === 'recip')  recip();
        else if (act === 'sq')     sq();
        else if (act === 'sqrt')   sqrt();
        else if (act === 'dot')    pressNum('.');
        else if (act === 'equals') calculate();

        if (mem === 'mc')      { memory = 0; hasMem = false; syncMem(); }
        else if (mem === 'mr') { current = String(memory); justCalc = true; show(); }
        else if (mem === 'm+') { memory += parseFloat(current); hasMem = true; syncMem(); }
        else if (mem === 'm-') { memory -= parseFloat(current); hasMem = true; syncMem(); }
        else if (mem === 'ms') { memory = parseFloat(current); hasMem = true; syncMem(); }
      });
    });

    /* ── keyboard support ── */
    document.addEventListener('keydown', (e) => {
      if (panel.classList.contains('hidden')) return;
      if ('0123456789'.includes(e.key)) { pressNum(e.key); e.preventDefault(); }
      else if (e.key === '.')            { pressNum('.'); e.preventDefault(); }
      else if (e.key === '+')            { pressOp('+'); e.preventDefault(); }
      else if (e.key === '-')            { pressOp('-'); e.preventDefault(); }
      else if (e.key === '*')            { pressOp('*'); e.preventDefault(); }
      else if (e.key === '/')            { pressOp('/'); e.preventDefault(); }
      else if (e.key === 'Enter' || e.key === '=') { calculate(); e.preventDefault(); }
      else if (e.key === 'Escape')       { panel.classList.add('hidden'); }
      else if (e.key === 'Backspace')    { backspace(); e.preventDefault(); }
      else if (e.key === 'Delete')       { clearAll(); e.preventDefault(); }
    });

    show();
    syncMem();
  })(); // end calcModule

  /* ==========================================================
     SECTION 10 — SHORT ANSWER QUESTIONS
     ========================================================== */
  (() => {
    const SHORT_ANSWER_QUESTIONS = [
      // ── Definitions ──────────────────────────────────────────────
      { id: 1,  cat: 'definitions',    q: 'What is a classified balance sheet and how does it differ from a simple balance sheet?', model: 'A classified balance sheet groups assets and liabilities into meaningful sub-categories — Current Assets, Long-Term Assets, Current Liabilities, Long-Term Liabilities, and Owner\'s Equity — making it easier to assess liquidity and financial position. A simple balance sheet lists all accounts without grouping.' },
      { id: 2,  cat: 'definitions',    q: 'What is liquidity, and why is it important when ordering items on a balance sheet?', model: 'Liquidity is how quickly and easily an asset can be converted to cash without a significant loss of value. On a balance sheet, assets are ordered from most to least liquid so users can quickly assess whether the business can meet its short-term obligations.' },
      { id: 3,  cat: 'definitions',    q: 'Define "current assets" and give two examples.', model: 'Current assets are assets that will be converted to cash or used up within one year (or the normal operating cycle). Examples include Cash and Accounts Receivable (amounts owed by customers).' },
      { id: 4,  cat: 'definitions',    q: 'Define "current liabilities" and give two examples.', model: 'Current liabilities are debts or obligations that must be paid within one year. Examples include Accounts Payable (amounts owed to suppliers) and Bank Overdraft.' },
      { id: 5,  cat: 'definitions',    q: 'What is owner\'s equity and how is it calculated?', model: 'Owner\'s equity is the owner\'s residual claim on the assets of the business after all liabilities are deducted. It is calculated as: Owner\'s Equity = Total Assets − Total Liabilities.' },
      { id: 6,  cat: 'definitions',    q: 'What are long-term assets? Give two examples.', model: 'Long-term assets (also called capital assets or fixed assets) are assets with a useful life extending beyond one year that are used in the operation of the business. Examples include Land and Delivery Equipment.' },
      { id: 7,  cat: 'definitions',    q: 'What are long-term liabilities? Give one example.', model: 'Long-term liabilities are debts that are not due within the next year. A common example is a Mortgage Payable, which is typically repaid over 10–25 years.' },

      // ── Rules ─────────────────────────────────────────────────────
      { id: 8,  cat: 'rules',          q: 'State the rule for ordering accounts within Current Assets and explain the reasoning behind it.', model: 'Current assets are listed in order of decreasing liquidity — Cash first, then Accounts Receivable, then Supplies last. This ordering lets the reader immediately see the most liquid resources and assess the business\'s ability to meet short-term obligations.' },
      { id: 9,  cat: 'rules',          q: 'Why must Accounts Receivable debtors be listed in alphabetical order?', model: 'Debtors are listed alphabetically within the Accounts Receivable sub-section as a standard formatting convention. Alphabetical ordering makes it easy to locate a specific debtor\'s balance and provides a consistent, professional presentation.' },
      { id: 10, cat: 'rules',          q: 'Explain the underline rule used for subtotals and grand totals on a classified balance sheet.', model: 'A single underline is drawn beneath the last item before a subtotal (and the subtotal itself in some formats) to indicate addition is being performed. A double underline (ruling off) is placed beneath the grand total (Total Assets and Total Liabilities + Owner\'s Equity) to signal the final, authoritative figure.' },
      { id: 11, cat: 'rules',          q: 'Where does Land appear in a classified balance sheet, and why is it always listed first among long-term assets?', model: 'Land appears first in the Long-Term Assets section because it has an unlimited useful life — it is never depreciated. Since it is the most permanent and highest-value long-term asset, it is placed at the top of that section.' },
      { id: 12, cat: 'rules',          q: 'Why is Supplies always listed last within Current Assets?', model: 'Supplies are the least liquid current asset because they must be physically used in the business before they provide cash value — they cannot simply be sold like Accounts Receivable or spent like Cash. Therefore, following the liquidity rule, they are listed last in Current Assets.' },

      // ── Concepts ──────────────────────────────────────────────────
      { id: 13, cat: 'concepts',       q: 'Explain why the two sides of every balance sheet must always be equal.', model: 'The balance sheet is based on the accounting equation: Assets = Liabilities + Owner\'s Equity. Every transaction affects at least two accounts in a way that keeps both sides equal (double-entry bookkeeping). If the two sides do not balance, it means an error has been made in recording or preparing the statement.' },
      { id: 14, cat: 'concepts',       q: 'What does it mean for a business to be "solvent"? How can you tell from a balance sheet?', model: 'A business is solvent when it has enough assets to cover all its liabilities — i.e., Total Assets exceed Total Liabilities. On a balance sheet, solvency can be assessed by comparing Total Assets with Total Liabilities or by checking whether Owner\'s Equity is positive.' },
      { id: 15, cat: 'concepts',       q: 'Why is it important for Grade 11 accounting students to distinguish between current and long-term items?', model: 'Separating current and long-term items lets users analyse the business\'s liquidity (ability to pay short-term debts) separately from its long-term financial stability. Lenders and investors rely on this distinction to assess risk and make decisions.' },
      { id: 16, cat: 'concepts',       q: 'A business has Total Assets of $150,000 and Total Liabilities of $95,000. What is Owner\'s Equity? Show your calculation.', model: 'Owner\'s Equity = Total Assets − Total Liabilities = $150,000 − $95,000 = $55,000. This represents the owner\'s net claim on the business\'s assets.' },
      { id: 17, cat: 'concepts',       q: 'How does the heading of a classified balance sheet differ from other financial statements, and what three pieces of information must it include?', model: 'The balance sheet heading states the entity\'s name, the title of the statement ("Classified Balance Sheet"), and the specific date the statement is prepared (e.g., "December 31, 2008") — using "as at" rather than "for the year ended". Other statements like the income statement cover a period rather than a single point in time.' },

      // ── Classification ────────────────────────────────────────────
      { id: 18, cat: 'classification', q: 'Classify each of the following accounts and explain your reasoning: Cash, Mortgage Payable, Land, Accounts Payable, Supplies.', model: 'Cash → Current Asset (most liquid). Mortgage Payable → Long-Term Liability (not due within 1 year). Land → Long-Term Asset (unlimited useful life). Accounts Payable → Current Liability (due within 1 year). Supplies → Current Asset (used up within 1 year, listed last in CA).' },
      { id: 19, cat: 'classification', q: 'A company has a Bank Loan due in 18 months. Where does it appear on the classified balance sheet?', model: 'Because the bank loan is not due within the next year (it matures in 18 months), it is classified as a Long-Term Liability. It would appear in the Long-Term Liabilities section, above any longer-term debt such as a Mortgage Payable.' },
      { id: 20, cat: 'classification', q: 'What is the difference between Accounts Receivable and Accounts Payable? Which section of the balance sheet does each belong to?', model: 'Accounts Receivable represents amounts owed TO the business by customers — it is a Current Asset. Accounts Payable represents amounts the business owes TO its suppliers — it is a Current Liability.' },
      { id: 21, cat: 'classification', q: 'Why is Owner\'s Equity listed separately from liabilities, even though both represent claims on the business\'s assets?', model: 'Liabilities are legal obligations owed to external creditors who must be repaid on specific terms. Owner\'s Equity is the owner\'s residual interest — there is no obligation to repay it on a schedule. Separating them shows clearly who has the primary claim (creditors) and who absorbs any residual gain or loss (the owner).' },
      { id: 22, cat: 'classification', q: 'Delivery Equipment appears in Long-Term Assets. Explain what criteria it meets and where exactly it is ordered within that section.', model: 'Delivery Equipment is a capital asset used in the business with a useful life greater than one year, so it belongs in Long-Term Assets. Within LTA it is ordered by decreasing useful life: Land first (unlimited), then fixed equipment/furniture, then vehicles such as Delivery Equipment and Automobile last.' },
    ];

    const saCard       = document.getElementById('saCard');
    const saCardMeta   = document.getElementById('saCardMeta');
    const saCardQ      = document.getElementById('saCardQ');
    const saAnswerArea = document.getElementById('saAnswerArea');
    const saInput      = document.getElementById('saInput');
    const saFeedback   = document.getElementById('saFeedback');
    const saModelAnswerBox  = document.getElementById('saModelAnswer');
    const saModelAnswerText = document.getElementById('saModelAnswerText');
    const saCheck      = document.getElementById('saCheck');
    const saReveal     = document.getElementById('saReveal');
    const saNext       = document.getElementById('saNext');
    const saProgLabel  = document.getElementById('saProgLabel');
    const saProgFill   = document.getElementById('saProgFill');

    if (!saCard) return; // section not in DOM

    let activeCat = 'all';
    let currentQ  = null;
    let answered  = 0;
    let total     = SHORT_ANSWER_QUESTIONS.length;
    let usedIds   = new Set();

    const catBtns = document.querySelectorAll('.sa-cat-btn');
    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.dataset.cat;
        usedIds.clear();
        loadQuestion();
      });
    });

    function filteredPool() {
      return SHORT_ANSWER_QUESTIONS.filter(q =>
        activeCat === 'all' || q.cat === activeCat
      );
    }

    function loadQuestion() {
      const pool = filteredPool();
      if (!pool.length) return;
      // Pick from unused; reset when exhausted
      let available = pool.filter(q => !usedIds.has(q.id));
      if (!available.length) { usedIds.clear(); available = pool; }
      const pick = available[Math.floor(Math.random() * available.length)];
      usedIds.add(pick.id);
      currentQ = pick;

      const catLabel = pick.cat.charAt(0).toUpperCase() + pick.cat.slice(1);
      const num = usedIds.size;
      const tot = filteredPool().length;
      saCardMeta.textContent = `${catLabel} · Question ${num} of ${tot}`;
      saCardQ.textContent = pick.q;

      saInput.value = '';
      saFeedback.innerHTML = '';
      saFeedback.classList.add('hidden');
      saModelAnswerBox.classList.add('hidden');
      saAnswerArea.classList.remove('hidden');
      saInput.focus();
    }

    function updateProgress() {
      const pct = total ? Math.round(answered / total * 100) : 0;
      saProgLabel.textContent = `${answered} answered this session`;
      saProgFill.style.width = Math.min(pct, 100) + '%';
    }

    saNext.addEventListener('click', loadQuestion);

    saCheck.addEventListener('click', async () => {
      const answer = saInput.value.trim();
      if (!answer) {
        saFeedback.innerHTML = `<div class="sa-fb-panel sa-fb-warn">&#9888; Please write an answer before checking.</div>`;
        saFeedback.classList.remove('hidden');
        return;
      }
      saFeedback.innerHTML = `<div class="sa-fb-panel sa-fb-loading"><span class="ai-fb-spinner"></span>&nbsp; Gemini is reviewing your answer&hellip;</div>`;
      saFeedback.classList.remove('hidden');
      saFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      try {
        const resp = await fetch('/api/check-short', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question:    currentQ.q,
            modelAnswer: currentQ.model,
            studentAnswer: answer,
            category:    currentQ.cat
          })
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) throw new Error(data?.error || `API ${resp.status}`);
        renderFeedback(data);
        answered++;
        updateProgress();
      } catch (err) {
        saFeedback.innerHTML = `<div class="sa-fb-panel sa-fb-fail">&#9888; Could not reach the AI marker (${err.message}). Check your internet connection and try again.</div>`;
      }
    });

    saReveal.addEventListener('click', () => {
      if (!currentQ) return;
      saModelAnswerText.textContent = currentQ.model;
      saModelAnswerBox.classList.remove('hidden');
      saModelAnswerBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    function renderFeedback(data) {
      const score = data.score || 0;          // 0–100
      const grade = data.grade || '?';        // e.g. "Good"
      const pass  = score >= 60;
      const color = score >= 80 ? 'sa-fb-pass' : score >= 60 ? 'sa-fb-partial' : 'sa-fb-fail';

      let html = `<div class="sa-fb-panel ${color}">
        <div class="sa-fb-header">
          <span class="sa-fb-icon">${pass ? '&#10003;' : '&#9888;'}</span>
          <span class="sa-fb-grade">${grade}</span>
          <span class="sa-fb-score">${score}/100</span>
        </div>`;
      if (data.feedback) html += `<div class="sa-fb-body">${escHtml(data.feedback)}</div>`;
      if (data.missing)  html += `<div class="sa-fb-missing"><strong>Missing:</strong> ${escHtml(data.missing)}</div>`;
      if (data.tip)      html += `<div class="sa-fb-tip">&#128161; ${escHtml(data.tip)}</div>`;
      html += `</div>`;
      saFeedback.innerHTML = html;
    }

    // Initialise with no question selected (wait for user click)
    updateProgress();
  })(); // end shortAnswerModule

  // Global diagnostics for quicker debugging in browser console
  window.addEventListener('error', (event) => {
    console.groupCollapsed('[Global JS Error]');
    console.error('Message:', event.message);
    console.error('Source:', event.filename);
    console.error('Line/Col:', event.lineno, event.colno);
    console.error('Error object:', event.error);
    console.groupEnd();
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.groupCollapsed('[Unhandled Promise Rejection]');
    console.error('Reason:', event.reason);
    console.groupEnd();
  });

})();