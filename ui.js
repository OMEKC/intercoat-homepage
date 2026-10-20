/* Intercoat shared behaviour: map hover, contact popup, steady accordion, triangle motion (concept 1). */
(function () {
  var doc = document.documentElement;
  var params = new URLSearchParams(location.search);
  var staticMode = params.has('static');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Map: hover, focus or tap a marker (or a country in the list); both stay in sync ---------- */
  [].forEach.call(document.querySelectorAll('.dot-map'), function (map) {
    var markers = [].slice.call(map.querySelectorAll('.mk'));
    var scope = map.closest('section') || document;
    var rows = [].slice.call(scope.querySelectorAll('.country'));
    function activate(name) {
      map.classList.toggle('has-active', !!name);
      markers.forEach(function (m) { m.classList.toggle('is-active', m.dataset.country === name); });
      rows.forEach(function (r) { r.classList.toggle('is-active', r.dataset.country === name); });
    }
    markers.concat(rows).forEach(function (el) {
      el.addEventListener('mouseenter', function () { activate(el.dataset.country); });
      el.addEventListener('focus', function () { activate(el.dataset.country); });
      el.addEventListener('mouseleave', function () { activate(null); });
      el.addEventListener('blur', function () { activate(null); });
      el.addEventListener('click', function (e) { e.stopPropagation(); activate(el.dataset.country); });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.mk,.country')) activate(null); });
  });

  /* ---------- Accordion: one step open at a time, block height stays constant ---------- */
  var process = document.querySelector('.process');
  if (process) {
    var steps = [].slice.call(process.querySelectorAll('details'));
    steps.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) steps.forEach(function (o) { if (o !== d && o.open) o.open = false; });
      });
      var s = d.querySelector('summary');
      if (s) s.addEventListener('click', function (e) { if (d.open) { /* keep one step open */ e.preventDefault(); } });
    });
    var lock = function () {
      var host = process.closest('.tech-process') || process;
      var target = process;
      var open = steps.filter(function (d) { return d.open; })[0] || steps[0];
      target.style.minHeight = '';
      var max = 0;
      steps.forEach(function (d) {
        steps.forEach(function (o) { o.open = (o === d); });
        max = Math.max(max, target.getBoundingClientRect().height);
      });
      steps.forEach(function (o) { o.open = (o === open); });
      target.style.minHeight = Math.ceil(max) + 'px';
    };
    var t;
    var run = function () { clearTimeout(t); t = setTimeout(lock, 120); };
    window.addEventListener('resize', run);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(lock); else window.addEventListener('load', lock);
    lock();
  }

  /* ---------- Contact popup ---------- */
  var srcForm = document.querySelector('[data-ic-form]');
  var modal, box, paneForm, paneThanks, opener = null;
  var X = '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M2 2l14 14M16 2L2 16" stroke="currentColor" stroke-width="1.5"/></svg>';
  function build() {
    modal = document.createElement('div');
    modal.className = 'ic-modal'; modal.hidden = true; modal.setAttribute('data-name', 'Contact popup');
    modal.innerHTML = '<div class="ic-ov" data-ic-close></div><div class="ic-box" role="dialog" aria-modal="true" aria-labelledby="ic-title" tabindex="-1"><button type="button" class="ic-x" aria-label="Close" data-ic-close>' + X + '</button><div class="ic-pane ic-form"></div><div class="ic-pane ic-thanks" hidden><span class="k">Request received</span><h3 id="ic-thanks-title">Thank you</h3><p>We have received your request. A specialist from Intercoat will get back to you using the contact details you provided.</p><button type="button" class="ic-done" data-ic-close>Close</button></div></div>';
    document.body.appendChild(modal);
    box = modal.querySelector('.ic-box'); paneForm = modal.querySelector('.ic-form'); paneThanks = modal.querySelector('.ic-thanks');
    modal.addEventListener('click', function (e) { if (e.target.closest('[data-ic-close]')) close(); });
  }
  function fresh() {
    var f = srcForm.cloneNode(true);
    f.removeAttribute('data-ic-form'); f.setAttribute('novalidate', '');
    [].forEach.call(f.querySelectorAll('.form-result,.email-draft'), function (n) { n.remove(); });
    var h = f.querySelector('h3'); if (h) h.id = 'ic-title';
    [].forEach.call(f.querySelectorAll('[id]'), function (n) { if (n.id !== 'ic-title') n.removeAttribute('id'); });
    paneForm.innerHTML = ''; paneForm.appendChild(f);
    f.addEventListener('submit', function (e) { e.preventDefault(); if (validate(f)) { showThanks(); } });
    f.addEventListener('input', function (e) { var fld = e.target.closest('.field,.consent'); if (fld) clearErr(fld); });
    f.addEventListener('change', function (e) { var fld = e.target.closest('.field,.consent'); if (fld) clearErr(fld); });
    return f;
  }
  function clearErr(fld) { fld.classList.remove('is-error'); var m = fld.querySelector('.ic-err'); if (m) m.remove(); }
  function validate(f) {
    var ok = true, first = null;
    [].forEach.call(f.querySelectorAll('input[required],textarea[required]'), function (inp) {
      var host = inp.closest('.field') || inp.closest('.consent'); if (!host) return;
      clearErr(host);
      var bad = inp.type === 'checkbox' ? !inp.checked : (!inp.value.trim() || (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())));
      if (bad) {
        ok = false; host.classList.add('is-error');
        var m = document.createElement('span'); m.className = 'ic-err'; m.setAttribute('role', 'alert');
        m.textContent = inp.type === 'checkbox' ? 'Please confirm to continue.' : (inp.type === 'email' && inp.value.trim() ? 'Enter a valid email address.' : 'This field is required.');
        host.appendChild(m); if (!first) first = inp;
      }
    });
    if (first) first.focus();
    return ok;
  }
  function showThanks() { paneForm.hidden = true; paneThanks.hidden = false; box.scrollTop = 0; paneThanks.querySelector('.ic-done').focus(); }
  function open(from) {
    if (!srcForm) return;
    if (!modal) build();
    opener = from || document.activeElement;
    paneThanks.hidden = true; paneForm.hidden = false;
    var f = fresh();
    modal.hidden = false; document.body.classList.add('ic-lock');
    var first = f.querySelector('input,textarea'); if (first) first.focus({ preventScroll: true }); else box.focus();
  }
  function close() {
    if (!modal || modal.hidden) return;
    modal.hidden = true; document.body.classList.remove('ic-lock');
    if (opener && opener.focus) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#contact"],[data-ic-open]');
    if (!a || !srcForm) return;
    e.preventDefault(); open(a);
  });
  document.addEventListener('keydown', function (e) {
    if (!modal || modal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') {
      var f = [].slice.call(box.querySelectorAll('button,[href],input,textarea,select')).filter(function (n) { return !n.closest('[hidden]') && !n.disabled; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  /* The form inside the page: valid submit opens the same thank-you window. */
  if (srcForm) {
    srcForm.setAttribute('novalidate', '');
    srcForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(srcForm)) return;
      srcForm.reset();
      if (!modal) build();
      opener = document.activeElement; fresh(); showThanks_open();
    });
    srcForm.addEventListener('input', function (e) { var fld = e.target.closest('.field,.consent'); if (fld) clearErr(fld); });
  }
  function showThanks_open() { modal.hidden = false; document.body.classList.add('ic-lock'); showThanks(); }

  /* ---------- Concept 1: triangles unfold once from their corner (finite, no loop) ---------- */
  if (doc.hasAttribute('data-ic-tri') && !staticMode && !reduced && 'IntersectionObserver' in window) {
    var tris = [].slice.call(document.querySelectorAll('.tri'));
    tris.forEach(function (t) {
      var s = t.getAttribute('style') || '';
      var x = /(^|;)\s*right:\s*0/.test(s) ? 'right' : 'left';
      var y = /(^|;)\s*bottom:\s*0/.test(s) ? 'bottom' : 'top';
      t.style.transformOrigin = x + ' ' + y;
    });
    doc.classList.add('ic-tri-motion');
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } });
    }, { threshold: .3 });
    tris.forEach(function (t, i) { t.style.transitionDelay = '120ms'; io.observe(t); });
  }
})();
/* mobile menu toggle (concept 1 header) */
(function(){var b=document.querySelector('#header .burger');if(!b)return;var h=document.getElementById('header');
b.setAttribute('aria-expanded','false');
b.addEventListener('click',function(){var o=h.classList.toggle('menu-open');b.setAttribute('aria-expanded',o?'true':'false')});
h.querySelectorAll('nav a').forEach(function(a){a.addEventListener('click',function(){h.classList.remove('menu-open');b.setAttribute('aria-expanded','false')})});})();
