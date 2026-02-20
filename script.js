/* ============================================================
   BAF3M Classified Balance Sheet â€” JavaScript
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
    // â”€â”€ Current Assets (liquidity order: Cash â†’ A/R â†’ Supplies)
    { name: 'Cash',                        value: 1636,   correct: 'CA',  order: 1, tip: 'Cash is the most liquid asset â€” it IS money. Must always be listed FIRST in Current Assets.' },
    { name: 'A/R â€” J. Hoedl (debtor)',     value: 370,    correct: 'CA',  order: 2, tip: 'J. Hoedl owes the company money â€” Accounts Receivable. A/R comes after Cash (collected in 30â€“60 days).' },
    { name: 'A/R â€” D. Marshall (debtor)',  value: 1100,   correct: 'CA',  order: 3, tip: 'D. Marshall owes the company money â€” another A/R sub-account. Listed alphabetically under A/R.' },
    { name: 'A/R â€” H. Burns (debtor)',     value: 850,    correct: 'CA',  order: 4, tip: 'H. Burns owes the company money â€” another A/R sub-account. Debtors listed alphabetically.' },
    { name: 'Supplies',                    value: 1200,   correct: 'CA',  order: 5, tip: 'Supplies are used up within the year but are the least liquid Current Asset â€” always listed LAST in CA.' },
    // â”€â”€ Long-Term Assets (longest useful life first: Land â†’ Equipment â†’ Vehicles)
    { name: 'Land',                        value: 160000, correct: 'LTA', order: 1, tip: 'Land has an unlimited useful life and is NEVER depreciated. Always listed first in Long-Term Assets.' },
    { name: 'Furniture & Equipment',       value: 14700,  correct: 'LTA', order: 2, tip: 'Furniture & Equipment is a capital asset used for many years. Listed after Land.' },
    { name: 'Delivery Equipment',          value: 20100,  correct: 'LTA', order: 3, tip: 'Delivery Equipment is a vehicle-class capital asset. Listed before Automobile (longer useful life).' },
    { name: 'Automobile',                  value: 18000,  correct: 'LTA', order: 4, tip: 'Automobile is a capital asset with a shorter useful life â€” listed last in Long-Term Assets.' },
    // â”€â”€ Current Liabilities (most urgent first: A/P creditors)
    { name: 'A/P â€” Anglo Supply Co.',      value: 740,    correct: 'CL',  order: 1, tip: 'Anglo Supply Co. is a creditor â€” the company owes them money. Accounts Payable, listed first (alphabetical).' },
    { name: 'A/P â€” W. Anno',               value: 1200,   correct: 'CL',  order: 2, tip: 'W. Anno is a creditor â€” another A/P sub-account. Creditors listed alphabetically under A/P.' },
    { name: 'A/P â€” M. Benrubi',            value: 3000,   correct: 'CL',  order: 3, tip: 'M. Benrubi is a creditor â€” another A/P sub-account. Largest individual creditor in this example.' },
    // â”€â”€ Long-Term Liabilities (shorter term before longer term)
    { name: 'Bank Loan (3-year)',           value: 10000,  correct: 'LTL', order: 1, tip: 'A 3-year bank loan â€” due after one year. Long-Term Liability. Listed before Mortgage (shorter term).' },
    { name: 'Mortgage Payable',            value: 80500,  correct: 'LTL', order: 2, tip: 'Mortgage Payable is a long-term debt secured by property. The largest liability â€” listed last in LTL.' },
    // â”€â”€ Owner's Equity
    { name: 'L. Borel, Capital',           value: 122516, correct: 'OE',  order: 1, tip: 'Lennox Borel\'s capital â€” the owner\'s equity in New Western Company. Assets ($217,956) âˆ’ Liabilities ($95,440) = $122,516.' },
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
      el.innerHTML = `${acc.name} <span class="drag-val">${formatDollar(acc.value)}</span>
        <span class="drag-tip">${acc.tip}</span>`;
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
      items.forEach((item) => { sub += Number(item.getAttribute('data-value')); });
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

  /* Check balance â€” validates classification AND ordering within each zone */
  document.getElementById('checkBalance').addEventListener('click', () => {
    const fb = document.getElementById('dragFeedback');
    fb.classList.remove('hidden', 'success', 'error', 'partial');

    // 1. Check placements
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

    // 2. Check ordering within each correctly-filled zone
    let orderErrors = [];
    if (correctCount === totalCount && totalCount === accounts.length) {
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

    // Items still in bank
    const bankItems = dragBank.querySelectorAll('.drag-item');
    const bankCount = bankItems.length;

    if (bankCount > 0) {
      fb.className = 'drag-feedback partial';
      fb.textContent = `You still have ${bankCount} account(s) in the bank. Drag them all into a zone first!`;
    } else if (correctCount === totalCount && totalCount === accounts.length && orderErrors.length === 0) {
      const tA = document.getElementById('totalAssets').textContent;
      const tL = document.getElementById('totalLOE').textContent;
      if (tA === tL) {
        fb.className = 'drag-feedback success';
        fb.innerHTML = `&#10003; Perfect! All ${correctCount} accounts are correctly classified <strong>and in the right order</strong>. Balance sheet balances: ${tA} = ${tL}.`;
      } else {
        fb.className = 'drag-feedback error';
        fb.innerHTML = `Classifications are correct, but totals don't match: Assets ${tA} â‰  L &amp; OE ${tL}. Check your values.`;
      }
    } else if (orderErrors.length > 0) {
      const zoneNames = { CA: 'Current Assets', LTA: 'Long-Term Assets', CL: 'Current Liabilities', LTL: 'Long-Term Liabilities', OE: "Owner's Equity" };
      const names = [...new Set(orderErrors)].map(k => zoneNames[k]).join(', ');
      fb.className = 'drag-feedback partial';
      fb.innerHTML = `Placements are correct, but the <strong>order is wrong</strong> in: ${names}. Accounts must follow the rules (e.g., Cash first, Land first, liquidity order). Items highlighted in red.`;
    } else {
      fb.className = 'drag-feedback error';
      fb.innerHTML = `${correctCount} of ${totalCount} accounts are in the correct zone. Items outlined in <span style="color:var(--red)">red</span> are misplaced â€” try again!`;
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
        'Assets = Liabilities âˆ’ Owner\'s Equity',
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
      explain: 'Accounts Payable are amounts owed to suppliers, typically due within 30-60 days â€” making them a current liability.'
    },
    {
      q: 'How do you calculate Owner\'s Equity?',
      opts: [
        'Liabilities âˆ’ Assets',
        'Assets + Liabilities',
        'Assets âˆ’ Liabilities',
        'Liabilities Ã· Assets'
      ],
      answer: 2,
      explain: 'Owner\'s Equity = Assets âˆ’ Liabilities. It represents what is left for the owner after all debts are paid.'
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
      explain: 'A balance sheet is a snapshot of one specific moment in time â€” always use a single date like "As at December 31, 2025."'
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
      ${pct >= 70 ? 'â€” Great job!' : 'â€” Review the lesson above and try again.'}
      <div class="score-bar"><div class="score-fill" style="width:${pct}%;background:${pct >= 70 ? 'var(--green)' : 'var(--red)'}"></div></div>`;

    result.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ==========================================================
     SECTION 8 â€” AI QUESTIONS CONTROLLER  (full interactive)
     ========================================================== */
  (function initAIQuestions() {

    /* â”€â”€ state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    let currentType = 'preparation';
    let currentDiff = 1;
    let currentQ    = null;
    // maps accountIndex â†’ classification code ('CA'|'LTA'|'CL'|'LTL'|'OE'|'')
    const classified = {};
    // tracks order accounts were placed into each section
    const sectionOrder = { CA:[], LTA:[], CL:[], LTL:[], OE:[] };

    /* â”€â”€ section â†” DOM id map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const SECTION_ROW_ID = { CA:'aiRowCA', LTA:'aiRowLTA', CL:'aiRowCL', LTL:'aiRowLTL', OE:'aiRowOE' };
    const SECTION_LABEL  = { CA:'Current Asset', LTA:'Long-Term Asset', CL:'Current Liability', LTL:'Long-Term Liability', OE:"Owner's Equity" };

    /* â”€â”€ type button toggles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    document.querySelectorAll('.ai-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ai-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentType = btn.dataset.type;
      });
    });

    /* â”€â”€ difficulty select â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    const diffSel = document.getElementById('aiDiffSelect');
    if (diffSel) diffSel.addEventListener('change', () => { currentDiff = Number(diffSel.value); });

    /* â”€â”€ generate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    el('aiGenerate')?.addEventListener('click', () => generateQuestion(currentType, currentDiff));

    /* â”€â”€ preparation / advanced buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    el('aiShowHint')     ?.addEventListener('click', showHint);
    el('aiCheckAnswer')  ?.addEventListener('click', checkMyAnswer);
    el('aiRevealSolution')?.addEventListener('click', () => revealSolution(false));
    el('aiNewSame')      ?.addEventListener('click', () => generateQuestion(currentType, currentDiff));

    /* â”€â”€ error-finding buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    el('aiErrHint')   ?.addEventListener('click', showErrHint);
    el('aiCheckErrors')?.addEventListener('click', checkErrors);
    el('aiErrReveal') ?.addEventListener('click', () => revealSolution(true));
    el('aiErrNewSame')?.addEventListener('click', () => generateQuestion(currentType, currentDiff));

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       GENERATE
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    async function generateQuestion(type, difficulty) {
      setLoading(true);
      hideError();
      hide('aiWorkspace');
      hide('aiKeyNotice');

      try {
        const resp = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, difficulty })
        });
        const data = await resp.json();
        if (data.error) { showError(data.error); return; }
        currentQ = data;
        renderQuestion(data);
      } catch (e) {
        showError('Network error: ' + e.message);
      } finally {
        setLoading(false);
      }
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       RENDER QUESTION
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function renderQuestion(q) {
      // Meta header
      const typeLabels = { preparation:'ðŸ“‹ Preparation', error_finding:'ðŸ” Error Finding', advanced:'âš¡ Advanced' };
      const diffLabels = { 1:'Level 1 â€” Basic', 2:'Level 2 â€” Intermediate', 3:'Level 3 â€” Advanced' };
      setHTML('aiQMeta', `
        <span class="ai-q-meta-chip ai-chip-type">${typeLabels[q.type] || q.type}</span>
        <span class="ai-q-meta-chip ai-chip-diff">${diffLabels[q.difficulty] || 'Level ' + q.difficulty}</span>
        <span class="ai-q-meta-chip ai-chip-co">ðŸ¢ ${q.company}</span>`);
      setText('aiQTitle', q.company + ' â€” ' + q.date);
      setText('aiQInstructions', q.instructions || '');

      const sn = el('aiScenarioNote');
      if (sn) {
        if (q.scenario_context) { sn.textContent = 'ðŸ“Œ ' + q.scenario_context; show(sn); }
        else hide(sn);
      }

      // Advanced notes
      const anb = el('aiAdvancedNotes');
      if (anb) {
        if (q.advanced_notes?.length) {
          anb.innerHTML = q.advanced_notes.map(n => `<div class="ai-adv-note">ðŸ’¡ ${n}</div>`).join('');
          show(anb);
        } else hide(anb);
      }

      // Reset panels
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

    /* â”€â”€ Preparation / Advanced â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function renderBuilderQuestion(q) {
      // Reset classification state
      Object.keys(classified).forEach(k => delete classified[k]);
      Object.keys(sectionOrder).forEach(k => { sectionOrder[k] = []; });

      // Heading block
      const hb = el('aiBSHeading');
      if (hb) hb.innerHTML = `
        <span class="ai-bs-hline ai-bs-hco">${q.company}</span>
        <span class="ai-bs-hline ai-bs-htit">Balance Sheet</span>
        <span class="ai-bs-hline ai-bs-hdate">As at ${q.date}</span>`;

      // Account classification cards (shuffled)
      const cards = el('aiAcctCards');
      if (cards) {
        const shuffled = [...(q.accounts || [])].map((a, i) => ({ ...a, _idx: i }))
                           .sort(() => Math.random() - 0.5);
        cards.innerHTML = shuffled.map(a => buildAccountCard(a)).join('');
        // Wire up dropdowns
        cards.querySelectorAll('.ai-card-classify').forEach(sel => {
          sel.addEventListener('change', e => onClassify(e.target));
        });
      }

      // Reset section rows
      Object.values(SECTION_ROW_ID).forEach(id => {
        const d = el(id);
        if (d) d.innerHTML = `<div class="ai-empty-hint">Classify accounts in Step 1 â†‘</div>`;
      });

      // Clear inputs
      ['inCA','inLTA','inTA','inCL','inLTL','inTL','inTLOE'].forEach(id => {
        const inp = el(id);
        if (inp) { inp.value = ''; inp.className = 'ai-amt-input'; }
      });
      el('inTA').classList.add('ai-grand-inp');
      el('inTLOE').classList.add('ai-grand-inp');

      hide('aiFeedbackPanel');
      show('aiBsBuilder');
    }

    function buildAccountCard(a) {
      const opts = [
        ['', 'â€” classify this account â€”'],
        ['CA',  'ðŸ“˜ Current Asset'],
        ['LTA', 'ðŸª¨ Long-Term Asset'],
        ['CL',  'ðŸ“• Current Liability'],
        ['LTL', 'ðŸ— Long-Term Liability'],
        ['OE',  'ðŸ“— Owner\'s Equity'],
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

    /* â”€â”€ Error finding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
    function renderErrorQuestion(q) {
      el('aiErrorInput').value = '';
      renderBS(q.erroneous_sheet, 'aiErrorBS');
      hide('aiErrFeedback');
      show('aiErrorPanel');
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       CLASSIFY DROPDOWN CHANGE
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function onClassify(sel) {
      const idx   = Number(sel.dataset.idx);
      const name  = sel.dataset.name;
      const value = Number(sel.dataset.value);
      const newSec = sel.value;  // '' | 'CA' | 'LTA' | 'CL' | 'LTL' | 'OE'
      const oldSec = classified[idx] || '';

      // Remove from old section order
      if (oldSec && sectionOrder[oldSec]) {
        sectionOrder[oldSec] = sectionOrder[oldSec].filter(i => i !== idx);
      }

      // Update classification
      classified[idx] = newSec;

      // Update card appearance
      const card = el('aiAcctCards').querySelector(`[data-idx="${idx}"]`);
      if (card) {
        card.className = 'ai-acct-card' + (newSec ? ' cls-' + newSec : '');
        // Remove old hint badge / feedback
        card.querySelectorAll('.ai-card-hint-badge,.ai-card-feedback').forEach(e => e.remove());
      }

      // Add to new section order
      if (newSec && sectionOrder[newSec]) {
        sectionOrder[newSec].push(idx);
      }

      // Re-render both old and new section rows
      if (oldSec) refreshSectionRows(oldSec);
      if (newSec) refreshSectionRows(newSec);
    }

    function refreshSectionRows(sec) {
      const rowsDiv = el(SECTION_ROW_ID[sec]);
      if (!rowsDiv) return;
      const indices = sectionOrder[sec];
      if (!indices.length) {
        rowsDiv.innerHTML = `<div class="ai-empty-hint">Classify accounts in Step 1 â†‘</div>`;
        return;
      }
      const q = currentQ;
      rowsDiv.innerHTML = indices.map((idx, pos) => {
        const a = q.accounts[idx];
        const indent = (a.name.includes('â€”') || a.note) ? 'ind1' : '';
        return `<div class="ai-ibs-row ${indent}">
          <span class="ai-ibs-row-name">${a.name}</span>
          <span class="ai-ibs-row-amt">${fmtAI(a.value)}</span>
        </div>`;
      }).join('');
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       SHOW HINT
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function showHint() {
      if (!currentQ) return;
      const cards = el('aiAcctCards');
      if (!cards) return;
      cards.querySelectorAll('.ai-acct-card').forEach(card => {
        const correct = card.dataset.correct;
        // Remove old hints first
        card.querySelectorAll('.ai-card-hint-badge').forEach(e => e.remove());
        const badge = document.createElement('div');
        badge.className = `ai-card-hint-badge badge-${correct}`;
        badge.textContent = 'â†’ ' + (SECTION_LABEL[correct] || correct);
        card.appendChild(badge);
      });
    }

    function showErrHint() {
      if (!currentQ?.errors?.length) return;
      const hint = currentQ.errors[0];
      const fb = el('aiErrFeedback');
      if (!fb) return;
      fb.innerHTML = `<div class="ai-feedback-panel"><div class="ai-fb-header fb-fail">ðŸ’¡ Hint â€” look here first:</div>
        <div class="ai-fb-items"><div class="ai-fb-item"><span class="ai-fb-icon">ðŸ“</span>
        <span class="ai-fb-text">${hint.location}</span></div></div></div>`;
      show(fb);
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       CHECK MY ANSWER
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function checkMyAnswer() {
      if (!currentQ) return;
      const q  = currentQ;
      const sol = q.solution;
      const feedItems = [];
      let correct = 0, total = 0;

      // â”€â”€ 1. Classification checks â”€â”€
      (q.accounts || []).forEach((a, idx) => {
        total++;
        const chosen  = classified[idx] || '';
        const expected = a.correct_section;
        const card = el('aiAcctCards')?.querySelector(`[data-idx="${idx}"]`);
        card?.querySelectorAll('.ai-card-hint-badge,.ai-card-feedback,.card-correct,.card-wrong,.card-order-warn')
             .forEach(e => e.remove());
        if (!card) return;

        if (!chosen) {
          card.classList.remove('card-correct','card-wrong');
          feedItems.push({ icon:'âš ï¸', text:`<strong>${a.name}</strong> â€” not yet classified.` });
        } else if (chosen === expected) {
          correct++;
          card.classList.add('card-correct');
          card.classList.remove('card-wrong','card-order-warn');
          const fb = mkFeedback('âœ… Correct section: ' + SECTION_LABEL[expected], 'fb-good');
          card.appendChild(fb);
        } else {
          card.classList.add('card-wrong');
          card.classList.remove('card-correct','card-order-warn');
          feedItems.push({ icon:'âŒ', text:`<strong>${a.name}</strong> classified as <em>${SECTION_LABEL[chosen]}</em> â€” should be <em>${SECTION_LABEL[expected]}</em>.` });
          const fb = mkFeedback('âœ— Should be: ' + SECTION_LABEL[expected], 'fb-bad');
          card.appendChild(fb);
        }
      });

      // â”€â”€ 2. Order checks (within correctly classified sections) â”€â”€
      const sections = ['CA','LTA','CL','LTL','OE'];
      sections.forEach(sec => {
        const placedIdxs = sectionOrder[sec]; // user's placement order
        // Accounts that SHOULD be in this section
        const correctInSec = (q.accounts || [])
          .map((a, i) => ({ ...a, _idx: i }))
          .filter(a => a.correct_section === sec)
          .sort((a, b) => (a.correct_order || 0) - (b.correct_order || 0));

        if (!correctInSec.length) return;

        // Find accounts that user placed correctly in this section
        const correctlyPlaced = placedIdxs.filter(i => (q.accounts[i]?.correct_section || '') === sec);
        if (correctlyPlaced.length < 2) return; // can't check order with <2

        // Compare order
        const expectedOrder = correctInSec.map(a => a._idx);
        const isOrderCorrect = correctlyPlaced.every((idx, pos) => {
          const expectedIdx = expectedOrder.findIndex(e => e === idx);
          const actualPos   = correctlyPlaced.indexOf(idx);
          // check relative order matches expected
          return correctlyPlaced.slice(0,pos).every(prev => {
            return expectedOrder.indexOf(prev) < expectedOrder.indexOf(idx);
          });
        });

        if (!isOrderCorrect) {
          feedItems.push({
            icon: 'ðŸ”€',
            text: `Accounts in <strong>${SECTION_LABEL[sec]}</strong> are not in the correct order. Expected: ${correctInSec.map(a => a.name).join(', ')}.`
          });
          // Mark affected cards
          correctlyPlaced.forEach((idx, pos) => {
            const expPos = expectedOrder.indexOf(idx);
            if (expPos !== pos) {
              const card = el('aiAcctCards')?.querySelector(`[data-idx="${idx}"]`);
              if (card) {
                card.classList.add('card-order-warn');
                card.classList.remove('card-correct');
                const fb = mkFeedback('âš  Check ordering in this section', 'fb-order');
                card.appendChild(fb);
              }
            }
          });
        }
      });

      // â”€â”€ 3. Subtotal & total input checks â”€â”€
      const checks = [
        { id:'inCA',   expected: sol?.assets?.current_total,              label:'Total Current Assets' },
        { id:'inLTA',  expected: sol?.assets?.longterm_total,             label:'Total Long-Term Assets' },
        { id:'inTA',   expected: sol?.assets?.total,                      label:'Total Assets' },
        { id:'inCL',   expected: sol?.liabilities?.current_total,         label:'Total Current Liabilities' },
        { id:'inLTL',  expected: sol?.liabilities?.longterm_total,        label:'Total Long-Term Liabilities' },
        { id:'inTL',   expected: sol?.liabilities?.total,                 label:'Total Liabilities' },
        { id:'inTLOE', expected: sol?.total_liabilities_oe,               label:"Total Liabilities & Owner's Equity" },
      ];

      checks.forEach(({ id, expected, label }) => {
        total++;
        const inp = el(id);
        if (!inp) return;
        const raw    = inp.value.trim();
        const isGrand = inp.classList.contains('ai-grand-inp');
        if (!raw) {
          inp.classList.remove('inp-correct','inp-wrong');
          feedItems.push({ icon:'âš ï¸', text:`<strong>${label}</strong> â€” not filled in.` });
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
          feedItems.push({ icon:'âŒ', text:`<strong>${label}</strong>: you entered ${fmtAI(entered)}, correct is ${fmtAI(expected)}.` });
        }
      });

      // â”€â”€ 4. Balance check â”€â”€
      const ta  = parseAmt(el('inTA')?.value   || '');
      const tloe = parseAmt(el('inTLOE')?.value || '');
      const balanced = (ta > 0 && tloe > 0 && Math.abs(ta - tloe) < 1);

      // â”€â”€ 5. Render feedback â”€â”€
      const score = correct + '/' + total;
      const allGood = feedItems.length === 0;
      const header = el('aiFbHeader');
      const items  = el('aiFbItems');
      const balDiv = el('aiFbBalance');

      if (header) {
        header.innerHTML = allGood
          ? `<span class="ai-fb-score">ðŸŽ‰ ${score}</span> All classifications and totals are correct!`
          : `<span class="ai-fb-score">${score}</span> Check the feedback below.`;
        header.className = 'ai-fb-header ' + (allGood ? 'fb-pass' : 'fb-fail');
      }
      if (items) {
        items.innerHTML = feedItems.length
          ? feedItems.map(f => `<div class="ai-fb-item"><span class="ai-fb-icon">${f.icon}</span><span class="ai-fb-text">${f.text}</span></div>`).join('')
          : `<div class="ai-fb-item"><span class="ai-fb-icon">âœ…</span><span class="ai-fb-text">Every account is classified correctly and in the right order.</span></div>`;
      }
      if (balDiv) {
        if (ta > 0 && tloe > 0) {
          balDiv.className = 'ai-fb-balance ' + (balanced ? 'fb-balanced' : 'fb-unbalanced');
          balDiv.innerHTML = balanced
            ? `âœ“ Balance check passed: Total Assets ${fmtAI(ta)} = Total L &amp; OE ${fmtAI(tloe)}`
            : `âš  Does not balance: Total Assets ${fmtAI(ta)} â‰  Total L &amp; OE ${fmtAI(tloe)}. 
               Difference: ${fmtAI(Math.abs(ta - tloe))}. 
               <br><small>Check whether all accounts are classified, all subtotals are correct, and that Total Assets = Total Current + Total Long-Term Assets.</small>`;
        } else {
          balDiv.className = 'ai-fb-balance';
          balDiv.innerHTML = '';
        }
      }

      show('aiFeedbackPanel');
      el('aiFeedbackPanel').scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       CHECK ERRORS (error-finding)
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function checkErrors() {
      if (!currentQ?.errors) return;
      const textarea = el('aiErrorInput');
      const lines    = (textarea?.value || '').split('\n').map(l => l.trim()).filter(Boolean);
      const total    = currentQ.errors.length;
      const found    = Math.min(lines.length, total);
      const score    = found + '/' + total;
      const pass     = found >= Math.ceil(total * 0.7);

      const fb = el('aiErrFeedback');
      if (!fb) return;
      fb.innerHTML = `<div class="ai-feedback-panel">
        <div class="ai-fb-header ${pass ? 'fb-pass':'fb-fail'}">
          <span class="ai-fb-score">${pass ? 'ðŸŽ‰' : 'ðŸ“'} You identified ${lines.length} error${lines.length !== 1 ? 's' : ''}.</span>
          This question has ${total} errors. ${pass ? 'Great work! Click "See All Errors" to compare.' : 'Keep looking â€” try "Show Hint" for guidance.'}
        </div>
        <div class="ai-fb-items">
          ${lines.map((l,i) => `<div class="ai-fb-item"><span class="ai-fb-icon">${i < total ? 'âœ…' : 'âš ï¸'}</span>
            <span class="ai-fb-text">${l}</span></div>`).join('')}
          ${lines.length < total ? `<div class="ai-fb-item"><span class="ai-fb-icon">â“</span>
            <span class="ai-fb-text">${total - lines.length} more error${total-lines.length!==1?'s':''} not yet found.</span></div>` : ''}
        </div>
      </div>`;
      show(fb);
      fb.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       REVEAL SOLUTION
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function revealSolution(isErrorFinding) {
      if (!currentQ) return;
      const q = currentQ;

      renderBS(q.solution, 'aiSolutionBS');

      const errList = el('aiErrorsList');
      const errRev  = el('aiErrorsList');
      if (errList && isErrorFinding && q.errors?.length) {
        errList.innerHTML = `<h4 style="padding:0 0 10px;font-size:.88rem;font-weight:800;color:var(--muted);">ðŸ” All ${q.errors.length} Errors Explained</h4>` +
          q.errors.map((e, i) => `<div class="ai-error-item">
            <div class="ai-err-num">${i+1}</div>
            <div class="ai-err-body">
              <div class="ai-err-loc">ðŸ“ ${e.location}</div>
              <div>${e.description}</div>
              <div class="ai-err-fix">âœ… Correction: ${e.correction}</div>
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
            ? `<span class="ai-check-pass">âœ“ Balanced â€” Total Assets ${fmtAI(check.total_assets)} = Total L &amp; OE ${fmtAI(check.total_loe)}</span>`
            : `<span class="ai-check-fail">âš  Does not balance: Assets ${fmtAI(check.total_assets)} â‰  L&amp;OE ${fmtAI(check.total_loe)}</span>`;
        } else {
          banner.innerHTML = '';
        }
      }

      show('aiSolutionPanel');
      el('aiSolutionPanel').scrollIntoView({ behavior:'smooth', block:'start' });
    }

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       RENDER BALANCE SHEET (solution / erroneous view)
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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

    /* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
       HELPERS
       â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
    function fmtAI(v) {
      if (v == null) return '$0';
      const n   = Number(v);
      const abs = Math.abs(n);
      const s   = '$' + abs.toLocaleString('en-CA', { minimumFractionDigits:0 });
      return n < 0 ? '(' + s + ')' : s;
    }

    function parseAmt(str) {
      // Strips $, commas, parens (negatives), whitespace
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
      if (e) { e.textContent = 'âš  ' + msg; e.classList.remove('hidden'); }
    }

    function hideError() {
      el('aiErrorMsg')?.classList.add('hidden');
    }

  })();

})();
