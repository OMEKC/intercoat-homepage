(function () {
  var doc = document.documentElement;
  var params = new URLSearchParams(location.search);
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var staticMode = params.has('static'); // used by the Figma export: renders the settled state
  var motion = !reduced && !staticMode && 'IntersectionObserver' in window;

  /* Header: a hairline shadow appears once the page has scrolled. */
  var header = document.getElementById('header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Language selector: one trigger, searchable list; scales to any number of locales. */
  var trigger = header.querySelector('.language-trigger');
  var panel = document.getElementById('language-panel');
  var search = panel.querySelector('.language-search');
  var options = [].slice.call(panel.querySelectorAll('.language-option'));
  var empty = panel.querySelector('.language-empty');
  var menuBtn = header.querySelector('.menu-trigger');
  var menu = document.getElementById('mobile-menu');
  function setLang(open) {
    panel.hidden = !open; trigger.setAttribute('aria-expanded', String(open));
    if (open) { closeMenu(); search.focus({ preventScroll: true }); } else { search.value = ''; filter(); }
  }
  function closeMenu() { menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Open menu'); }
  function filter() {
    var q = search.value.trim().toLowerCase(), shown = 0;
    options.forEach(function (o) { var hit = !q || (o.textContent + ' ' + o.dataset.search).toLowerCase().indexOf(q) > -1; o.hidden = !hit; if (hit) shown++; });
    empty.hidden = shown > 0;
  }
  trigger.addEventListener('click', function () { setLang(panel.hidden); });
  panel.querySelector('.close-language').addEventListener('click', function () { setLang(false); trigger.focus(); });
  search.addEventListener('input', filter);
  menuBtn.addEventListener('click', function () {
    var open = menu.hidden; menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) setLang(false);
  });
  menu.querySelector('.mobile-language').addEventListener('click', function () { closeMenu(); setLang(true); });
  menu.addEventListener('click', function (e) { if (e.target.closest('nav a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if (!panel.hidden) { setLang(false); trigger.focus(); } closeMenu(); } });
  document.addEventListener('click', function (e) { if (!panel.hidden && !panel.contains(e.target) && !trigger.contains(e.target) && !menu.contains(e.target)) setLang(false); });

  if (!motion) return;
  doc.classList.add('motion');

  /* Scroll reveals: opacity only, once; elements keep their final layout space. */
  var targets = document.querySelectorAll('.section-heading,.about-intro,.fact,.presence,.pathway,.application,.series-image,.series-item,.series-enquiry,.tech-visual,.process-step,.custom-layout,.innovation,.nature-layout,.quality-mark,.quality-bottom,.news-card,.contact-panel,.footer-top');
  [].forEach.call(targets, function (el, i) { el.classList.add('reveal'); });
  [].forEach.call(document.querySelectorAll('.application'), function (el, i) { el.style.transitionDelay = (i * 60) + 'ms'; });
  [].forEach.call(document.querySelectorAll('.series-item'), function (el, i) { el.style.transitionDelay = (i * 45) + 'ms'; });
  [].forEach.call(document.querySelectorAll('.news-card'), function (el, i) { el.style.transitionDelay = (i * 60) + 'ms'; });
  [].forEach.call(document.querySelectorAll('.fact'), function (el, i) { el.style.transitionDelay = (i * 60) + 'ms'; });

  /* Map markers are visible immediately: motion is reserved for the reveals above. */
  
  function countUp(el) {
    var end = +el.dataset.count, t0 = null, dur = 800;
    function step(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); }
    el.textContent = '0'; requestAnimationFrame(step);
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-visible');
      [].forEach.call(en.target.querySelectorAll('[data-count]'), countUp);
      if (en.target.matches('[data-count]')) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  [].forEach.call(document.querySelectorAll('.reveal'), function (el) { io.observe(el); });
})();
