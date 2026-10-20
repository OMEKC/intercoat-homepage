/* News carousel — endless, one card per step, always moving left.
   Motion notes (kept deliberately small):
   - every 4.5 s the strip slides left by exactly one card (0.8 s, ease-out, transform only);
   - the first cards are cloned after the last one, so after card 4 card 1 simply slides in;
     the strip is reset to its start invisibly while the clones are on screen, there is no jump back;
   - autoplay pauses on hover, keyboard focus, when the block is off screen or the tab is hidden;
   - with "reduce motion" there is no autoplay; the arrows still work (without sliding animation);
   - arrows, swipe and the Left/Right keys move the strip by one card as well. */
(function () {
  var params = new URLSearchParams(location.search);
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var INTERVAL = 4500, DURATION = 800;

  [].forEach.call(document.querySelectorAll('[data-ic-slider]'), function (root) {
    var vp = root.querySelector('.ic-viewport'), tr = root.querySelector('.ic-track');
    var real = [].slice.call(tr.children), N = real.length;
    if (!N) return;
    var prev = root.querySelector('.ic-prev'), next = root.querySelector('.ic-next');
    var cnt = root.querySelector('.ic-count'), barBox = root.querySelector('.ic-bar');
    var bar = barBox && barBox.querySelector('b'), bar2 = null;
    if (barBox && bar) { bar2 = bar.cloneNode(false); barBox.appendChild(bar2); }

    /* clones: a full second lap so any visible count (1 to 4) stays filled */
    var clones = real.map(function (c) {
      var k = c.cloneNode(true);
      k.setAttribute('aria-hidden', 'true'); k.setAttribute('inert', ''); k.setAttribute('data-clone', '');
      tr.appendChild(k); return k;
    });
    var all = real.concat(clones);

    var i = 0, busy = false, timer = null, snapTimer = null;
    var paused = { hover: false, focus: false, hidden: document.hidden, away: true };
    var auto = !reduced && !params.has('static');

    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function geom() {
      var g = parseFloat(getComputedStyle(tr).columnGap) || 0;
      var w = real[0].getBoundingClientRect().width;
      return { step: w + g, vis: Math.max(1, Math.min(N, Math.round((vp.clientWidth + g) / (w + g)))) };
    }
    function setX(n, animate) {
      tr.style.transition = animate ? '' : 'none';
      tr.style.transform = 'translateX(' + (-n * geom().step) + 'px)';
      if (!animate) { void tr.offsetWidth; tr.style.transition = ''; }
    }
    function ui() {
      var vis = geom().vis, first = i % N, last = (i + vis - 1) % N;
      if (cnt) cnt.textContent = vis > 1 ? pad(first + 1) + '\u2013' + pad(last + 1) + ' / ' + pad(N) : pad(first + 1) + ' / ' + pad(N);
      if (bar) {
        var w1 = Math.min(vis, N - first), w2 = vis - w1;
        bar.style.left = (first / N * 100) + '%'; bar.style.width = (w1 / N * 100) + '%';
        if (bar2) { bar2.style.left = '0%'; bar2.style.width = (w2 / N * 100) + '%'; bar2.style.display = w2 > 0 ? '' : 'none'; }
      }
      real.forEach(function (c, idx) {
        var rel = (idx - i % N + N) % N, on = rel < vis;
        if (on) { c.removeAttribute('inert'); c.removeAttribute('aria-hidden'); }
        else { c.setAttribute('inert', ''); c.setAttribute('aria-hidden', 'true'); }
      });
    }
    function settle() {
      busy = false;
      if (i >= N) { i = i - N; setX(i, false); ui(); }
      schedule();
    }
    function move(dir, viaAuto) {
      if (busy) return;
      var animate = !reduced;
      if (dir < 0 && i === 0) { i = N; setX(i, false); }      /* jump (unseen) onto the identical clone lap, then go back one */
      i += dir;
      busy = true; setX(i, animate); ui();
      clearTimeout(snapTimer);
      snapTimer = setTimeout(settle, animate ? DURATION + 40 : 0);
    }
    function schedule() {
      clearTimeout(timer);
      if (!auto || paused.hover || paused.focus || paused.hidden || paused.away) return;
      timer = setTimeout(function () { move(1, true); }, INTERVAL);
    }
    function setPause(k, v) { paused[k] = v; if (v) clearTimeout(timer); else if (!busy) schedule(); }

    prev.addEventListener('click', function () { move(-1); });
    next.addEventListener('click', function () { move(1); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') move(-1); else if (e.key === 'ArrowRight') move(1);
    });
    root.addEventListener('mouseenter', function () { setPause('hover', true); });
    root.addEventListener('mouseleave', function () { setPause('hover', false); });
    root.addEventListener('focusin', function () { setPause('focus', true); });
    root.addEventListener('focusout', function () { setPause('focus', false); });
    document.addEventListener('visibilitychange', function () { setPause('hidden', document.hidden); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { setPause('away', !en[0].isIntersecting); }, { threshold: 0.25 }).observe(root);
    } else { paused.away = false; }

    var x0 = null;
    vp.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') { x0 = e.clientX; setPause('hover', true); } });
    vp.addEventListener('pointerup', function (e) {
      if (x0 === null) return; var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) move(dx < 0 ? 1 : -1);
      setTimeout(function () { setPause('hover', false); }, 4000);
    });
    vp.addEventListener('pointercancel', function () { x0 = null; setPause('hover', false); });

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { setX(i, false); ui(); }, 100); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setX(i, false); ui(); });
    setX(0, false); ui();
  });
})();
