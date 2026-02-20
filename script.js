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
    // ── Current Assets (liquidity order: Cash → A/R → Supplies)
    { name: 'Cash',                        value: 1636,   correct: 'CA',  order: 1, tip: 'Cash is the most liquid asset — it IS money. Must always be listed FIRST in Current Assets.' },
    { name: 'A/R — J. Hoedl (debtor)',     value: 370,    correct: 'CA',  order: 2, tip: 'J. Hoedl owes the company money — Accounts Receivable. A/R comes after Cash (collected in 30–60 days).' },
    { name: 'A/R — D. Marshall (debtor)',  value: 1100,   correct: 'CA',  order: 3, tip: 'D. Marshall owes the company money — another A/R sub-account. Listed alphabetically under A/R.' },
    { name: 'A/R — H. Burns (debtor)',     value: 850,    correct: 'CA',  order: 4, tip: 'H. Burns owes the company money — another A/R sub-account. Debtors listed alphabetically.' },
    { name: 'Supplies',                    value: 1200,   correct: 'CA',  order: 5, tip: 'Supplies are used up within the year but are the least liquid Current Asset — always listed LAST in CA.' },
    // ── Long-Term Assets (longest useful life first: Land → Equipment → Vehicles)
    { name: 'Land',                        value: 160000, correct: 'LTA', order: 1, tip: 'Land has an unlimited useful life and is NEVER depreciated. Always listed first in Long-Term Assets.' },
    { name: 'Furniture & Equipment',       value: 14700,  correct: 'LTA', order: 2, tip: 'Furniture & Equipment is a capital asset used for many years. Listed after Land.' },
    { name: 'Delivery Equipment',          value: 20100,  correct: 'LTA', order: 3, tip: 'Delivery Equipment is a vehicle-class capital asset. Listed before Automobile (longer useful life).' },
    { name: 'Automobile',                  value: 18000,  correct: 'LTA', order: 4, tip: 'Automobile is a capital asset with a shorter useful life — listed last in Long-Term Assets.' },
    // ── Current Liabilities (most urgent first: A/P creditors)
    { name: 'A/P — Anglo Supply Co.',      value: 740,    correct: 'CL',  order: 1, tip: 'Anglo Supply Co. is a creditor — the company owes them money. Accounts Payable, listed first (alphabetical).' },
    { name: 'A/P — W. Anno',               value: 1200,   correct: 'CL',  order: 2, tip: 'W. Anno is a creditor — another A/P sub-account. Creditors listed alphabetically under A/P.' },
    { name: 'A/P — M. Benrubi',            value: 3000,   correct: 'CL',  order: 3, tip: 'M. Benrubi is a creditor — another A/P sub-account. Largest individual creditor in this example.' },
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

  /* Check balance — validates classification AND ordering within each zone */
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
        'Liabilities ÷ Assets'
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

})();
