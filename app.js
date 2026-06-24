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
    var tog = document.getElementById('langToggle');
    if (tog) {
      tog.classList.toggle('es', lang === 'es');
      tog.querySelectorAll('span').forEach(function (s) { s.classList.toggle('active', s.dataset.l === lang); });
    }
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

  var tog = document.getElementById('langToggle');
  if (tog) {
    tog.addEventListener('click', function () { setLang(document.documentElement.lang === 'es' ? 'en' : 'es'); });
    tog.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tog.click(); } });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(function (qb) {
    qb.addEventListener('click', function () {
      var item = qb.parentElement;
      var a = item.querySelector('.faq-a');
      var open = item.classList.toggle('open');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : 0;
    });
  });

  // mobile nav — toggle drawer on the header, swap hamburger <-> X
  var HAMBURGER = '☰', CLOSE = '✕';
  var mb = document.getElementById('menuBtn');
  var hdr = document.querySelector('header.nav');
  if (mb && hdr) {
    mb.setAttribute('aria-expanded', 'false');
    mb.addEventListener('click', function () {
      var open = hdr.classList.toggle('nav-open');
      mb.textContent = open ? CLOSE : HAMBURGER;
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // close the drawer when a nav link is tapped
    hdr.querySelectorAll('.nav-links a').forEach(function (a) {
      a.addEventListener('click', function () {
        hdr.classList.remove('nav-open');
        mb.textContent = HAMBURGER;
        mb.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
