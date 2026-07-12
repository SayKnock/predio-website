// Predio — shared site script (i18n toggle, FAQ, nav, typography). Each page defines window.ES and window.META.
(function () {
  var ES = window.ES || {};
  var META = window.META || {};
  var nodes = document.querySelectorAll('[data-i18n]');
  var EN = {};
  nodes.forEach(function (n) { EN[n.getAttribute('data-i18n')] = n.innerHTML; });

  // Product screenshots are bilingual: a Spanish twin of every shot lives in
  // assets/screens/es/ with the same filename. Swap the <img> src with the language.
  var shots = [];
  document.querySelectorAll('img').forEach(function (img) {
    var s = img.getAttribute('src') || '';
    if (s.indexOf('assets/screens/') > -1 && s.indexOf('assets/screens/es/') === -1) {
      shots.push([img, s, s.replace('assets/screens/', 'assets/screens/es/')]);
    }
  });
  function setShots(lang) { shots.forEach(function (o) { o[0].setAttribute('src', lang === 'es' ? o[2] : o[1]); }); }

  function setLang(lang) {
    document.documentElement.lang = lang;
    nodes.forEach(function (n) {
      var k = n.getAttribute('data-i18n');
      n.innerHTML = lang === 'es' ? (ES[k] != null ? ES[k] : EN[k]) : EN[k];
    });
    if (META[lang]) {
      var t = document.getElementById('metaTitle');
      var d = document.getElementById('metaDesc');
      if (t) t.textContent = META[lang].title;
      if (d) d.setAttribute('content', META[lang].desc);
      document.title = META[lang].title;
    }
    document.querySelectorAll('.lang').forEach(function (tog) {
      tog.classList.toggle('es', lang === 'es');
      tog.querySelectorAll('span').forEach(function (s) { s.classList.toggle('active', s.dataset.l === lang); });
    });
    try { localStorage.setItem('predio_lang', lang); } catch (e) {}
    setShots(lang);
    widont();
  }

  // Typography: prevent single-word last lines (orphans/widows).
  //  • Glue the last two words of each text block with a non-breaking space.
  //  • Keep hyphenated compounds in headings (in-app, multi-property) from breaking mid-word.
  // Both are applied ONLY when the resulting unbreakable run still fits the line, so we never
  // trade an orphan for a horizontal scrollbar on a narrow screen. The routine first normalises
  // any previously-inserted no-break characters, so it is safe to re-run on language change,
  // font load and viewport resize, and adapts to whatever width is current.
  var NBSP = ' ', NBHYPHEN = '‑';
  function widont() {
    var ctx = widont._ctx || (widont._ctx = document.createElement('canvas').getContext('2d'));
    document.querySelectorAll('h1,h2,h3,h4,p,li,.tier-for,.badge,.hero-note,.check,.mini .row').forEach(function (el) {
      var cs = getComputedStyle(el);
      var budget = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      ctx.font = (cs.fontWeight || '400') + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      var measure = function (t) { return ctx.measureText(t).width; };

      var tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), node, textNodes = [], last = null;
      while ((node = tw.nextNode())) {
        node.nodeValue = node.nodeValue.replace(/ /g, ' ').replace(/‑/g, '-'); // normalise -> idempotent
        textNodes.push(node);
        if (/\S/.test(node.nodeValue)) last = node;
      }
      if (!last || !(budget > 0)) return;

      // A hyphenated word becomes non-breaking only if the whole word still fits a line —
      // this stops awkward mid-word breaks (in-app, multi-property, real-time) without
      // ever forcing a run wider than the column.
      textNodes.forEach(function (n) {
        n.nodeValue = n.nodeValue.replace(/\S+/g, function (w) {
          // Only short compounds (in-app, real-time, two-way). Long ones (multi-property)
          // keep their hyphen break — removing it would just push a word onto its own line.
          return w.length <= 10 && w.indexOf('-') > -1 && measure(w) <= budget ? w.replace(/-/g, NBHYPHEN) : w;
        });
      });

      // Glue the final two words, but only if that pair fits on a line of its own.
      var v = last.nodeValue, end = v.replace(/\s+$/, ''), i = end.lastIndexOf(' ');
      if (i < 0) return;
      var prevStart = end.slice(0, i).lastIndexOf(' ') + 1;
      var pair = end.slice(prevStart).replace(/[ ‑]/g, function (c) { return c === NBHYPHEN ? '-' : ' '; });
      if (measure(pair) <= budget) last.nodeValue = end.slice(0, i) + NBSP + end.slice(i + 1) + v.slice(end.length);
    });
  }

  // init language: saved -> ?lang -> browser
  var lang = 'en';
  try { var s = localStorage.getItem('predio_lang'); if (s) lang = s; } catch (e) {}
  var q = new URLSearchParams(location.search).get('lang');
  if (q === 'es' || q === 'en') lang = q;
  else {
    var saved = null;
    try { saved = localStorage.getItem('predio_lang'); } catch (e) {}
    if (!saved && (navigator.language || '').toLowerCase().indexOf('es') === 0) lang = 'es';
  }
  setLang(lang);

  // Re-run typography once webfonts are ready (metrics change) and on resize (width changes).
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(widont);
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(widont, 150); });

  document.querySelectorAll('.lang').forEach(function (tog) {
    tog.addEventListener('click', function () { setLang(document.documentElement.lang === 'es' ? 'en' : 'es'); });
    tog.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog.click(); } });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function (qb) {
    qb.addEventListener('click', function () {
      var item = qb.parentElement;
      var a = item.querySelector('.faq-a');
      var open = item.classList.toggle('open');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : 0;
    });
  });

  // nav drawer — minimal bar + hamburger at every width; swap hamburger <-> X
  var HAMBURGER = '☰', CLOSE = '✕';
  var mb = document.getElementById('menuBtn');
  var hdr = document.querySelector('header.nav');
  if (mb && hdr) {
    mb.setAttribute('aria-expanded', 'false');
    var closeNav = function () {
      hdr.classList.remove('nav-open');
      mb.textContent = HAMBURGER;
      mb.setAttribute('aria-expanded', 'false');
    };
    mb.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = hdr.classList.toggle('nav-open');
      mb.textContent = open ? CLOSE : HAMBURGER;
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // close when a nav link is tapped
    hdr.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', closeNav);
    });
    // close on Escape, or when clicking/tapping outside the header
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
    document.addEventListener('click', function (e) {
      if (hdr.classList.contains('nav-open') && !hdr.contains(e.target)) closeNav();
    });
  }


  // ── THE ONE DIAL (Core §8/§9): the pricing page reads the LIVE prices ──────
  // plan_catalog's 'standard' row + the addon_catalog rows — edited in Predio
  // HQ → Catalogs — are the one source of truth for every price on this page;
  // the app's onboarding, Settings, and HQ read the same rows.
  // standard_pricing() is a public, read-only RPC built for this page (the
  // anon key is public by design — the same key every Predio client ships).
  // PROGRESSIVE ENHANCEMENT: the hardcoded numbers in the HTML ($1.50 / $25 /
  // $9 / $2 / 3.5% + $0.35 / $29 / 1,500 / $15) are the no-JS / fetch-failed
  // fallback. This block only ever swaps numbers after a good response — it
  // can never blank the page, spin, or render NaN. It also recomputes the FAQ
  // worked examples (40 / 100 units) from the fetched rate, and patches the
  // EN + ES dictionaries so the language toggle keeps the live prices.
  var PRICE_KEYS = ['one_price', 'one_min', 'price_foot', 'pa1', 'ao1_p', 'ao1_d', 'ao2_p', 'ao2_d', 'pa5'];
  if (window.fetch && PRICE_KEYS.some(function (k) { return EN[k] != null; })) {
    var SB_URL = 'https://knewthjceydrqfaknczw.supabase.co';
    var SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZXd0aGpjZXlkcnFmYWtuY3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NDE3OTcsImV4cCI6MjA5ODAxNzc5N30.3ev95BbpBXB5iBRhgjQe110_q5LMLBOE36cvaqaPv50';
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var tmr = ctrl ? setTimeout(function () { ctrl.abort(); }, 5000) : null;
    fetch(SB_URL + '/rest/v1/rpc/standard_pricing', {
      method: 'POST',
      headers: { apikey: SB_ANON, Authorization: 'Bearer ' + SB_ANON, 'Content-Type': 'application/json' },
      body: '{}',
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (p) {
      if (tmr) clearTimeout(tmr);
      if (!p) return;
      // A bad/missing field falls back to its shipped value — a partial
      // response can only ever produce the same text the HTML already shows.
      var ok = function (n) { return typeof n === 'number' && isFinite(n) && n > 0; };
      var pick = function (n, dflt) { return ok(n) ? n : dflt; };
      var unit = pick(p.unit_cents, 150), floor = pick(p.floor_cents, 2500);
      var byKey = {};
      (Array.isArray(p.addons) ? p.addons : []).forEach(function (a) { if (a && a.key) byKey[a.key] = a; });
      var pay = byKey.payments || {}, ai = byKey.ai_agent || {};
      var payM = pick(pay.monthly_cents, 900), bank = pick(pay.bank_payment_fee_cents, 200);
      var bps = pick(pay.card_fee_bps, 350), fixed = pick(pay.card_fee_fixed_cents, 35);
      var aiM = pick(ai.monthly_cents, 2900), inc = pick(ai.included_messages, 1500);
      var overM = pick(ai.overage_messages, 1500), over = pick(ai.overage_cents, 1500);
      if (unit === 150 && floor === 2500 && payM === 900 && bank === 200 && bps === 350
          && fixed === 35 && aiM === 2900 && inc === 1500 && overM === 1500 && over === 1500) {
        return; // identical to the shipped fallback — nothing to swap
      }
      var money = function (cents) {
        var d = cents / 100;
        return '$' + (cents % 100 === 0 ? d.toFixed(0) : d.toFixed(2));
      };
      var fee = function (units) { return money(Math.max(floor, unit * units)); }; // the one formula shape
      var pct = function (b) { return String(b / 100); }; // 350 → "3.5", 400 → "4"
      var num = function (n) { return n.toLocaleString('en-US'); }; // 1500 → "1,500" (site style, both languages)
      // Two-pass token swap: every shipped literal becomes a placeholder FIRST,
      // then placeholders become live values — so a substituted value can never
      // be re-matched by a later token (e.g. a $2 floor vs the $2 bank fee).
      // Order matters only within pass 1: compound tokens before their parts.
      var SWAPS = [
        ['$15 per additional 1,500', money(over) + ' per additional ' + num(overM)], // AI overage (EN)
        ['$15 por cada 1,500', money(over) + ' por cada ' + num(overM)],             // AI overage (ES)
        ['$0.35', money(fixed)],          // card fee, fixed part
        ['3.5%', pct(bps) + '%'],         // card fee, percent part
        ['$1.50', money(unit)],           // the per-unit rate
        ['$60', fee(40)],                 // the 40-unit worked example
        ['$150', fee(100)],               // the 100-unit worked example
        ['$29', money(aiM)],              // AI Agent monthly (per building)
        [/\$25\b/g, money(floor)],        // the monthly minimum
        [/\$9\b/g, money(payM)],          // Payments monthly (per building)
        [/\$2\b/g, money(bank)],          // the flat bank-payment fee
        ['1,500', num(inc)],              // AI included messages (per building)
      ];
      var patch = function (s) {
        if (s == null) return s;
        SWAPS.forEach(function (sw, i) {
          var ph = '\u0000' + i + '\u0000'; // NUL-delimited - cannot occur in page text
          s = typeof sw[0] === 'string' ? s.split(sw[0]).join(ph) : s.replace(sw[0], ph);
        });
        SWAPS.forEach(function (sw, i) {
          s = s.split('\u0000' + i + '\u0000').join(sw[1]);
        });
        return s;
      };
      PRICE_KEYS.forEach(function (k) {
        if (EN[k] != null) EN[k] = patch(EN[k]);
        if (ES[k] != null) ES[k] = patch(ES[k]);
      });
      var lang = document.documentElement.lang === 'es' ? 'es' : 'en';
      nodes.forEach(function (n) {
        var k = n.getAttribute('data-i18n');
        if (PRICE_KEYS.indexOf(k) > -1) {
          n.innerHTML = lang === 'es' ? (ES[k] != null ? ES[k] : EN[k]) : EN[k];
        }
      });
    }).catch(function () { /* the static fallback stands */ });
  }

  // year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
