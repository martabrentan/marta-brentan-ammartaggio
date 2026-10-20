/* MOTION — metti <script src="assets/js/motion.js" defer></script> prima di </body>
   e aggiungi in <head>:  <script>document.documentElement.classList.add('js')</script> */
(function () {
  window.__motion = true;   // dice alla pagina che lo script è partito
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // pathLength=1 così il tratteggio funziona su qualsiasi tracciato
  document.querySelectorAll('.scrib path').forEach(function (p) { p.setAttribute('pathLength', '1'); });

  // i figli di [data-reveal-group] entrano a scaglioni di 80 ms
  document.querySelectorAll('[data-reveal-group]').forEach(function (g) {
    Array.prototype.forEach.call(g.children, function (el, i) {
      el.style.setProperty('--d', Math.min(i, 8) * 80 + 'ms');
    });
  });

  // EFFETTO SCRITTURA: [data-type] scrive il proprio testo lettera per lettera
  var typers = Array.prototype.slice.call(document.querySelectorAll('[data-type]'));
  function typeOut(el) {
    var text = el.getAttribute('data-full');
    var i = 0;
    el.classList.add('is-typing');
    (function step() {
      i++;
      el.textContent = text.slice(0, i);
      if (i < text.length) setTimeout(step, 38);
      else setTimeout(function () { el.classList.remove('is-typing'); }, 900);
    })();
  }
  if (!still) {
    typers.forEach(function (el) {
      var text = el.textContent;
      el.setAttribute('data-full', text);
      el.setAttribute('aria-label', text.trim());
      el.style.minHeight = el.offsetHeight + 'px';   // riserva lo spazio: niente salti di layout
      el.textContent = '\u00a0';
    });
  }

  var targets = document.querySelectorAll('[data-reveal], [data-reveal-group] > *, .scrib');

  if (still || !('IntersectionObserver' in window)) {
    typers.forEach(function (el) { if (el.getAttribute('data-full')) el.textContent = el.getAttribute('data-full'); });
    targets.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('is-in');
      io.unobserve(el);
      // a entrata finita il ritardo non serve più: l'hover riparte subito
      setTimeout(function () { el.style.removeProperty('--d'); }, 1600);
    });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });

  targets.forEach(function (el) { io.observe(el); });

  var tio = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      tio.unobserve(e.target);
      var d = parseInt(e.target.getAttribute('data-type-delay') || '0', 10);
      setTimeout(function () { typeOut(e.target); }, d);
    });
  }, { threshold: .2 });
  typers.forEach(function (el) { tio.observe(el); });

  // SCORRIMENTO AUTOMATICO: <div class="projects-scroll" data-autoscroll>
  // parte da solo, si ferma col mouse (o con la tastiera) e ricomincia quando esci.
  // Solo dove c'è un mouse: sul telefono si scorre con il dito.
  (function () {
    var track = document.querySelector('[data-autoscroll]');
    if (!track || still || !window.matchMedia('(hover: hover)').matches) return;

    var SPEED = 40;                 // pixel al secondo
    var box = track.closest('.projects-carousel') || track;
    var pos = 0, last = 0, raf = 0, hold = 0;
    var hovering = false, visible = false, returning = false;

    track.style.scrollSnapType = 'none';   // lo snap farebbe a pugni con lo scorrimento continuo
    track.style.scrollBehavior = 'auto';

    function max() { return track.scrollWidth - track.clientWidth; }
    function running() { return visible && !hovering && !returning && !document.hidden && performance.now() > hold; }

    function tick(t) {
      raf = requestAnimationFrame(tick);
      var dt = Math.min((t - last) / 1000, .1);
      last = t;
      if (!running()) return;
      pos += SPEED * dt;
      if (pos >= max()) {                       // fine corsa: pausa, poi torna all'inizio
        returning = true;
        setTimeout(function () {
          track.style.scrollBehavior = 'smooth';
          track.scrollTo({ left: 0 });
          setTimeout(function () {
            track.style.scrollBehavior = 'auto';
            pos = 0; returning = false; hold = performance.now() + 1200;
          }, 1300);
        }, 1500);
        return;
      }
      track.scrollLeft = pos;
    }

    function pause()  { hovering = true; }
    function resume() { pos = track.scrollLeft; hovering = false; hold = performance.now() + 900; }

    box.addEventListener('mouseenter', pause);
    box.addEventListener('mouseleave', resume);
    box.addEventListener('focusin', pause);
    box.addEventListener('focusout', resume);
    track.addEventListener('wheel', function () { pos = track.scrollLeft; hold = performance.now() + 2500; }, { passive: true });

    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) { pos = track.scrollLeft; hold = performance.now() + 800; }
    }, { threshold: .3 }).observe(track);

    raf = requestAnimationFrame(function (t) { last = t; tick(t); });
  })();
})();