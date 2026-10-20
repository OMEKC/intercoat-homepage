/* Concept 4 hero background: a full-bleed grid of squares whose size follows slow travelling waves.
   Palette: pale blue, mid blue, blue, plus a few accent cells that each carry one RAL Classic colour
   (1023 traffic yellow, 2004 pure orange, 3020 traffic red, 4005 blue lilac, 5015 sky blue, 6018 yellow green,
   6027 light green, 9003 signal white). A cell keeps its RAL colour for as long as it is an accent cell. Calm, looped, paused off-screen.
   Static frame for ?static and prefers-reduced-motion. */
(function () {
  var wrap = document.querySelector('.hero-bg');
  if (!wrap) return;
  var cv = wrap.querySelector('canvas');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = reduce || /[?&]static/.test(location.search);
  var PALE = '175,186,208', MID = '93,115,160', BLUE = '29,59,123', RAL = ['250,210,1', '231,91,18', '204,6,5', '108,70,117', '34,113,179', '87,166,57', '126,186,181', '244,244,244'];
  var W = 0, H = 0, dpr = 1, pitch = 44, cols = 0, rows = 0;
  var running = false, t0 = 0, raf = 0, visible = true, last = 0;

  var SPEED = 1.9; /* client edit: squares appear and wave about twice as fast */
  function ss(a, b, x) { x = (x - a) / (b - a); x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  function hash(i, j) { var h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); }

  function resize() {
    var r = wrap.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    pitch = (W < 700 ? 30 : W < 1100 ? 38 : 46) * Math.min(Math.max(1, W / 1440), 2560 / 1440); /* squares grow with the page on wide screens */
    cols = Math.ceil(W / pitch) + 1; rows = Math.ceil(H / pitch) + 1;
    draw(still ? 6.5 : SPEED * (performance.now() - t0) / 1000, 1);
  }

  function draw(t, intro) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var cx = cols * 0.74, cy = rows * 0.46;
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var f1 = Math.sin(0.34 * i + 0.24 * j - t * 0.8);
        var f2 = Math.sin(0.2 * i - 0.3 * j + t * 0.55 + 1.7);
        var d = Math.sqrt((i - cx) * (i - cx) + (j - cy) * (j - cy));
        var f3 = Math.sin(0.46 * d - t * 1.0);
        var v = (f1 + f2 + f3) / 3;                  /* -1 .. 1 */
        var x = (i * pitch) / W;
        var mask = 0.22 + 0.78 * ss(0.12, 0.78, x);  /* calmer behind the headline */
        var top = ss(0, 0.12, (j * pitch) / H);      /* soft start under the header */
        var s = (0.08 + 0.82 * ss(-0.3, 0.9, v)) * mask * (0.35 + 0.65 * top) * intro;
        if (s < 0.04) continue;
        var size = pitch * s * 0.92;
        var px = i * pitch + (pitch - size) / 2, py = j * pitch + (pitch - size) / 2;
        var col, a;
        if (s > 0.62 && hash(i, j) < 0.06) { col = RAL[Math.floor(hash(j + 7.3, i + 3.1) * RAL.length)]; a = 0.92; }
        else if (s > 0.5) { col = BLUE; a = 0.9; }
        else if (s > 0.28) { col = MID; a = 0.42; }
        else { col = PALE; a = 0.26; }
        ctx.fillStyle = 'rgba(' + col + ',' + a + ')';
        ctx.fillRect(px, py, size, size);
      }
    }
  }

  function frame(now) {
    raf = 0;
    if (!running || !visible) return;
    if (now - last > 33) {
      last = now;
      var t = (now - t0) / 1000;
      draw(SPEED * t, ss(0, 0.7, t));
    }
    raf = requestAnimationFrame(frame);
  }
  function start() { if (still || running) return; running = true; if (!t0) t0 = performance.now(); if (!raf) raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  t0 = performance.now();
  resize();
  var to = 0;
  window.addEventListener('resize', function () { clearTimeout(to); to = setTimeout(resize, 120); });
  if (!still) {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) start(); else stop(); }, { threshold: 0 }).observe(wrap);
    } else start();
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (visible) start(); });
    start();
  }
})();
