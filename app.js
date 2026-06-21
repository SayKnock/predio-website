// Predio — shared site script (i18n toggle, FAQ, nav). Each page defines window.ES and window.META.
(function () {
  var ES = window.ES || {};
  var META = window.META || {};
  var nodes = document.querySelectorAll('[data-i18n]');
  var EN = {};
  nodes.forEach(function (n) { EN[n.getAttribute('data-i18n')] = n.innerHTML; });

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

  // mobile nav
  var mb = document.getElementById('menuBtn');
  var nav = document.getElementById('navLinks');
  if (mb && nav) mb.addEventListener('click', function () { nav.classList.toggle('open'); });

  // year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
