/* ═══════════════════════════════════════════════════════════════
   INDUSTRA — main.js
   Scroll Reveal · Nav Active + Progress · Service Panel · Billing
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── 1. Scroll Reveal ───────────────────────────────────────────
   Fades + translates elements in when they enter the viewport.
   Uses IntersectionObserver for performance (no scroll listener).
─────────────────────────────────────────────────────────────── */
(function initReveal() {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-scale');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => observer.observe(el));
})();


/* ── 2. Nav — Active Section + Scroll Progress Bar ─────────────
   Highlights the nav link for the visible section.
   Draws a gold progress bar along the bottom of the nav.
─────────────────────────────────────────────────────────────── */
(function initNav() {
  const nav      = document.getElementById('main-nav');
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav-links a[href^="#"]');

  /* Scroll progress bar via CSS custom property */
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.body.scrollHeight - window.innerHeight;
    const pct      = total > 0 ? ((scrolled / total) * 100).toFixed(1) : 0;
    nav.style.setProperty('--scroll-progress', pct + '%');
  }, { passive: true });

  /* Active link highlighting */
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        links.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.3 });

  sections.forEach(s => sectionObserver.observe(s));
})();


/* ── 3. Service Panel — Hover Interaction ───────────────────────
   On desktop, hovering a service row populates the sticky panel
   on the right with that service's description.
─────────────────────────────────────────────────────────────── */
(function initServicePanel() {
  const rows        = document.querySelectorAll('.service-row');
  const defaultEl   = document.getElementById('panel-default');
  const allContent  = document.querySelectorAll('.panel-content');

  const panelMap = {
    marketing:       'panel-marketing',
    digital:         'panel-digital',
    'events-contrib':'panel-events-contrib',
    platforms:       'panel-platforms',
    b2b:             'panel-b2b',
  };

  function showPanel(key) {
    if (defaultEl)  defaultEl.classList.add('hidden');
    allContent.forEach(p => p.classList.remove('active'));
    const target = document.getElementById(panelMap[key]);
    if (target) target.classList.add('active');
  }

  function resetPanel() {
    if (defaultEl) defaultEl.classList.remove('hidden');
    allContent.forEach(p => p.classList.remove('active'));
  }

  rows.forEach(row => {
    row.addEventListener('mouseenter', () => showPanel(row.dataset.service));
    row.addEventListener('mouseleave', () => {
      /* Only reset if no sibling row is still hovered */
      const anyHovered = Array.from(rows).some(r => r.matches(':hover'));
      if (!anyHovered) resetPanel();
    });
  });
})();


/* ── 4. Billing Toggle — Price Calculator ───────────────────────
   Yearly (base) · Quarterly (+30%) · Monthly (+25%)
   Shows per-payment price and yearly total cost difference.
─────────────────────────────────────────────────────────────── */
(function initBilling() {
  /* Base yearly prices (EGP) */
  const BASE = {
    starter:    15000,
    growth:     30000,
    enterprise: 100000,
  };

  /* Multipliers applied to yearly base */
  const MULTIPLIER = {
    yearly:    1.00,
    quarterly: 1.30,   /* +30% total vs annual */
    monthly:   1.25,   /* +25% total vs annual */
  };

  /* How many payments per year */
  const PAYMENTS = { yearly: 1, quarterly: 4, monthly: 12 };

  /* Period labels */
  const PERIOD_LABEL = {
    yearly:    'Per Year',
    quarterly: 'Per Quarter',
    monthly:   'Per Month',
  };

  /* Billing note HTML */
  const NOTE = {
    yearly:    'Billed annually — lowest total cost.',
    quarterly: 'Billed every 3 months. <strong>Total yearly cost is 30% higher than the annual plan.</strong>',
    monthly:   'Billed monthly. <strong>Total yearly cost is 25% higher than the annual plan.</strong>',
  };

  /* Format number as "15,000 EGP" */
  function fmt(n) {
    return Math.round(n).toLocaleString('en-EG') + ' EGP';
  }

  function updatePrices(period) {
    const mult     = MULTIPLIER[period];
    const payments = PAYMENTS[period];

    Object.keys(BASE).forEach(pkg => {
      const yearlyTotal  = BASE[pkg] * mult;
      const perPayment   = yearlyTotal / payments;
      const extraVsAnnual = yearlyTotal - BASE[pkg];

      /* Price display */
      const priceEl = document.getElementById('price-' + pkg);
      if (priceEl) priceEl.textContent = fmt(perPayment);

      /* Period label */
      const periodEl = document.getElementById('period-' + pkg);
      if (periodEl) periodEl.textContent = PERIOD_LABEL[period];

      /* Sub-line: yearly total or "Best rate" badge */
      const subEl = document.getElementById('price-' + pkg + '-sub');
      if (subEl) {
        if (period === 'yearly') {
          subEl.innerHTML = '<span style="color:#1a7a3a;font-weight:700;">Best annual rate</span>';
        } else {
          subEl.innerHTML =
            'Yearly total: <span style="color:#c0392b;font-weight:700;">' +
            fmt(yearlyTotal) + '</span>' +
            ' <span style="color:#c0392b;">(+' + fmt(extraVsAnnual) + ')</span>';
        }
      }
    });

    /* Billing note */
    const noteEl = document.getElementById('billing-note');
    if (noteEl) noteEl.innerHTML = NOTE[period];
  }

  /* Wire up toggle buttons */
  document.querySelectorAll('.billing-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.billing-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePrices(btn.dataset.period);
    });
  });

  /* Initialise with yearly */
  updatePrices('yearly');
})();


/* ── 5. Language Dropdown — EN / AR / FR ────────────────────────
   Dropdown selector in the nav.
   Arabic → RTL. French/English → LTR.
   Saves preference to sessionStorage.
─────────────────────────────────────────────────────────────── */
(function initLang() {
  const html    = document.getElementById('html-root');
  const toggle  = document.getElementById('lang-toggle');
  const menu    = document.getElementById('lang-menu');
  const labelEl = document.getElementById('lang-label');
  const options = document.querySelectorAll('.lang-option');

  const FLAG  = { en: '🇬🇧', ar: '🇪🇬', fr: '🇫🇷' };
  const SHORT = { en: 'EN',   ar: 'AR',   fr: 'FR'  };

  const BILLING_NOTES = {
    en: {
      yearly:    'Billed annually — lowest total cost.',
      quarterly: 'Billed every 3 months. <strong>Total yearly cost is 30% higher than the annual plan.</strong>',
      monthly:   'Billed monthly. <strong>Total yearly cost is 25% higher than the annual plan.</strong>',
    },
    ar: {
      yearly:    'يُدفع سنوياً — أقل تكلفة إجمالية.',
      quarterly: 'يُدفع كل 3 أشهر. <strong>التكلفة الإجمالية السنوية أعلى بنسبة 30% من الخطة السنوية.</strong>',
      monthly:   'يُدفع شهرياً. <strong>التكلفة الإجمالية السنوية أعلى بنسبة 25% من الخطة السنوية.</strong>',
    },
    fr: {
      yearly:    'Facturé annuellement — coût total le plus bas.',
      quarterly: 'Facturé tous les 3 mois. <strong>Le coût annuel total est 30% plus élevé que le plan annuel.</strong>',
      monthly:   'Facturé mensuellement. <strong>Le coût annuel total est 25% plus élevé que le plan annuel.</strong>',
    }
  };

  const PERIOD_LABELS = {
    en: { yearly: 'Per Year',  quarterly: 'Per Quarter',   monthly: 'Per Month'  },
    ar: { yearly: 'في السنة', quarterly: 'في الربع',      monthly: 'في الشهر'   },
    fr: { yearly: 'Par An',    quarterly: 'Par Trimestre',  monthly: 'Par Mois'   },
  };

  let lang = sessionStorage.getItem('industra-lang') || 'en';
  let isOpen = false;

  function openMenu() {
    isOpen = true;
    menu && menu.classList.add('open');
    toggle && toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    isOpen = false;
    menu && menu.classList.remove('open');
    toggle && toggle.setAttribute('aria-expanded', 'false');
  }

  if (toggle) {
    toggle.addEventListener('click', e => { e.stopPropagation(); isOpen ? closeMenu() : openMenu(); });
  }
  document.addEventListener('click', closeMenu);
  if (menu) menu.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      lang = opt.dataset.lang;
      applyLang(lang);
      closeMenu();
    });
  });

  function applyLang(l) {
    html.setAttribute('lang', l);
    html.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');

    /* Update button */
    const flagEl = document.getElementById('lang-flag');
    if (flagEl) flagEl.textContent = FLAG[l];
    if (labelEl) labelEl.textContent = SHORT[l];

    /* Mark active option */
    options.forEach(o => o.classList.toggle('active', o.dataset.lang === l));

    /* Translate */
    document.querySelectorAll('[data-' + l + ']').forEach(el => {
      const val = el.getAttribute('data-' + l);
      if (!val) return;
      const tag = el.tagName.toLowerCase();
      if (['p','h1','h2','h3','span','div','a','li','th','td','button'].includes(tag)) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });

    /* Billing note */
    const activeBtn = document.querySelector('.billing-btn.active');
    const period = activeBtn ? activeBtn.dataset.period : 'yearly';
    const noteEl = document.getElementById('billing-note');
    if (noteEl && BILLING_NOTES[l]) noteEl.innerHTML = BILLING_NOTES[l][period];

    /* Period labels */
    ['starter','growth','enterprise'].forEach(pkg => {
      const el = document.getElementById('period-' + pkg);
      if (el && PERIOD_LABELS[l]) el.textContent = PERIOD_LABELS[l][period];
    });

    /* Font swap */
    html.style.fontFamily = l === 'ar' ? "'Noto Kufi Arabic', sans-serif" : '';

    sessionStorage.setItem('industra-lang', l);
  }

  /* Patch billing buttons */
  document.querySelectorAll('.billing-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      const noteEl = document.getElementById('billing-note');
      if (noteEl && BILLING_NOTES[lang]) noteEl.innerHTML = BILLING_NOTES[lang][period];
      ['starter','growth','enterprise'].forEach(pkg => {
        const el = document.getElementById('period-' + pkg);
        if (el && PERIOD_LABELS[lang]) el.textContent = PERIOD_LABELS[lang][period];
      });
    });
  });

  applyLang(lang);
})();
