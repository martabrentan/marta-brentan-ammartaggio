/* MOTION — metti <script src="assets/js/motion.js" defer></script> prima di </body>
   e aggiungi in <head>:  <script>document.documentElement.classList.add('js')</script> */
(function () {
  window.__motion = true;   // dice alla pagina che lo script è partito
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // pathLength=1 così il tratteggio funziona su qualsiasi tracciato
  document.querySelectorAll('.scrib path').forEach(function (p) { p.setAttribute('pathLength', '1'); });

  // CONFERMA DEL MODULO: invia in background (Formspree) e mostra un messaggio animato nella pagina.
  // I testi si cambiano qui sotto, oppure per singola pagina con data-thanks-title / data-thanks-text sul <form>.
  var THANKS_TITLE = 'Atterraggio riuscito.';
  var THANKS_TEXT = 'Il tuo messaggio è sbarcato sul pianeta Marta. Ti rispondo al più presto.';
  var ERROR_TEXT = 'Qualcosa non ha funzionato. Riprova tra poco oppure scrivimi a martabrentan@yahoo.com.';
  var SCRIB_SVG = '<svg viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 7 C40 2, 80 11, 120 6 S220 3, 298 7"/></svg>';

  document.querySelectorAll('form[action*="formspree.io"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.fetch || !window.FormData) return;   // vecchi browser: invio normale
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.textContent : '';
      var old = form.querySelector('.form-error');
      if (old) old.remove();
      if (btn) { btn.disabled = true; btn.textContent = 'Invio…'; }

      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('formspree ' + r.status); showThanks(form); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = label; }
          var err = document.createElement('p');
          err.className = 'form-error';
          err.setAttribute('role', 'alert');
          err.textContent = ERROR_TEXT;
          form.appendChild(err);
        });
    });
  });

  function showThanks(form) {
    var box = document.createElement('div');
    box.className = 'form-thanks';
    box.setAttribute('role', 'status');
    box.setAttribute('tabindex', '-1');

    var planet = document.createElement('div');
    planet.className = 'thanks-planet';
    planet.setAttribute('aria-hidden', 'true');
    planet.innerHTML = '<i class="bi bi-check-lg"></i>';

    var h = document.createElement('h3');
    var sc = document.createElement('span');
    sc.className = 'scrib thanks-title';
    sc.appendChild(document.createTextNode(form.getAttribute('data-thanks-title') || THANKS_TITLE));
    sc.insertAdjacentHTML('beforeend', SCRIB_SVG);
    h.appendChild(sc);

    var p = document.createElement('p');
    p.textContent = form.getAttribute('data-thanks-text') || THANKS_TEXT;

    box.appendChild(planet); box.appendChild(h); box.appendChild(p);
    form.parentNode.insertBefore(box, form);
    form.hidden = true;
    form.style.display = 'none';
    setTimeout(function () { sc.classList.add('is-in'); }, 600);   // la sottolineatura si disegna dopo il titolo
    try { box.focus({ preventScroll: true }); box.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (x) {}
  }

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
      // se l'elemento è già stato superato (salto di scroll) lo mostro comunque
      if (!e.isIntersecting && e.boundingClientRect.top > 0) return;
      var el = e.target;
      el.classList.add('is-in');
      io.unobserve(el);
      // a entrata finita il ritardo non serve più: l'hover riparte subito
      setTimeout(function () { el.style.removeProperty('--d'); }, 1600);
    });
  }, { threshold: .15, rootMargin: '0px 0px -6% 0px' });

  targets.forEach(function (el) { io.observe(el); });

  // salto di scroll (es. "torna su", ancore): ciò che è già sopra lo schermo compare comunque
  var sweep;
  window.addEventListener('scroll', function () {
    clearTimeout(sweep);
    sweep = setTimeout(function () {
      targets.forEach(function (el) {
        if (!el.classList.contains('is-in') && el.getBoundingClientRect().bottom < 0) {
          el.classList.add('is-in'); io.unobserve(el);
        }
      });
    }, 120);
  }, { passive: true });

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