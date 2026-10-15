/* fisioleone.it — home
   Il pannello laterale, gli slideshow (con lo swipe) e i due nastri,
   recensioni e foto (che sul telefono si fermano solo col dito giu').
   I testi del menu stanno tutti nell'HTML: qui si mostrano e si
   nascondono soltanto. */
(function () {
  /* ---------- pannello laterale ---------- */
  document.querySelectorAll('[data-apre]').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelector('[data-lat]').classList.add('on');
      document.querySelector('[data-velo]').classList.add('on');
      b.setAttribute('aria-expanded', 'true');
    });
  });
  function chiudi() {
    document.querySelectorAll('.lat').forEach(function (l) { l.classList.remove('on'); });
    document.querySelectorAll('.velo').forEach(function (v) { v.classList.remove('on'); });
    document.querySelectorAll('[data-apre]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
  }
  document.querySelectorAll('[data-chiudi],[data-velo]').forEach(function (e) {
    e.addEventListener('click', chiudi);
  });
  /* da tastiera il velo non e' raggiungibile: senza questa, chi apre il
     pannello con Tab non ha modo di richiuderlo */
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { chiudi(); }
  });

  /* ogni voce porta alla sua ancora e chiude il pannello: nessuna
     sottovoce, nessun primo tocco che apre (uscito il 15/09) */
  document.querySelectorAll('.lat .riga, .lat .wa-lat').forEach(function (a) {
    a.addEventListener('click', chiudi);
  });
  /* ---------- slideshow: ognuno per conto suo (Docenze, blocco Inghilterra
     di Chi sono, i due delle Problematiche — M1, 25/09), contatore e
     frecce; la rotazione automatica si ferma per sempre al primo clic
     manuale ---------- */
  document.querySelectorAll('[data-slider]').forEach(function (st) {
    var wrap = st.closest('.slideshow');
    var f = [].slice.call(st.querySelectorAll('.f'));
    var conta = wrap.querySelector('[data-conta]');
    var tot = f.length;
    var i = 0;
    var timer = null;

    /* le foto oltre la prima hanno data-src: si caricano solo quando
       servono, mai tutte insieme (sono tutte inset:0, "visibili" per il
       browser anche se opache) */
    function carica(k) {
      var img = f[k].querySelector('img');
      if (img && img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    }
    function vai(k) {
      i = (k + tot) % tot;
      carica(i);
      carica((i + 1) % tot);
      carica((i - 1 + tot) % tot);
      f.forEach(function (x, j) { x.classList.toggle('on', j === i); });
      /* lo zero davanti anche al totale: con meno di dieci foto «01 / 09» */
      if (conta) { conta.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(tot).padStart(2, '0'); }
    }
    function ferma() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    carica(1);
    carica(tot - 1);

    /* precarico in catena, una foto alla volta, quando lo slideshow arriva
       a 800px dallo schermo: con il solo +-1 chi scorreva in fretta col
       dito trovava foto ancora bianche, perche' ogni foto partiva solo
       quando quella prima era gia' a schermo (Simone, 15/09/2026). Una alla
       volta e non tutte insieme: il picco di rete resta quello di prima */
    function precarica(k) {
      if (k >= tot) { return; }
      var img = f[k].querySelector('img');
      if (!img || !img.dataset.src) { precarica(k + 1); return; }
      img.addEventListener('load', function () { precarica(k + 1); }, { once: true });
      img.addEventListener('error', function () { precarica(k + 1); }, { once: true });
      carica(k);
    }
    if (window.IntersectionObserver) {
      var oss = new IntersectionObserver(function (voci) {
        if (voci.some(function (v) { return v.isIntersecting; })) { oss.disconnect(); precarica(2); }
      }, { rootMargin: '800px 0px' });
      oss.observe(st);
    } else {
      precarica(2);
    }

    var prec = wrap.querySelector('[data-prec]');
    var succ = wrap.querySelector('[data-succ]');
    if (prec) { prec.addEventListener('click', function () { ferma(); vai(i - 1); }); }
    if (succ) { succ.addEventListener('click', function () { ferma(); vai(i + 1); }); }

    /* la rotazione parte sempre, anche con «riduci animazioni» acceso
       (su Android lo accende il risparmio energetico): prima le foto
       restavano ferme sul telefono (Simone, 25/09/2026). Una foto ogni 3 s
       dal 29/09 (era 4,6) */
    timer = setInterval(function () { vai(i + 1); }, 3000);

    /* uno swipe conta come clic manuale: ferma la rotazione e cambia foto,
       come le frecce (Simone, 15/09/2026 sera). Conta solo se il dito va
       davvero di lato: chi scorre la pagina in giu' partendo dalla foto
       sposta il dito anche un po' di lato, e prima bastavano 40px per
       fermare la rotazione per sempre senza volerlo (M1, 25/09) */
    var partitaX = null, partitaY = null;
    st.addEventListener('touchstart', function (ev) {
      partitaX = ev.touches[0].clientX;
      partitaY = ev.touches[0].clientY;
    }, { passive: true });
    st.addEventListener('touchend', function (ev) {
      if (partitaX === null) { return; }
      var delta = ev.changedTouches[0].clientX - partitaX;
      var dy = ev.changedTouches[0].clientY - partitaY;
      partitaX = null;
      if (Math.abs(delta) < 40 || Math.abs(delta) <= Math.abs(dy)) { return; }
      ferma();
      vai(delta < 0 ? i + 1 : i - 1);
    });
  });

  /* ---------- i nastri (recensioni e foto delle problematiche): scorrono
     da soli, da destra a sinistra, a 47px al secondo — la velocita' che
     avevano con l'animazione CSS (150s per la serie delle recensioni).
     Dal 26/09 (Simone) li muove lo script spostando lo scorrimento della
     finestra .vista, non piu' un'animazione: cosi' sul telefono il nastro
     si puo' trascinare col dito. Sul telefono si ferma SOLO finche' il dito
     e' giu', e riparte da dove l'hai lasciato (800ms dopo, per non litigare
     con lo slancio dello scorrimento). Sul PC non si ferma e non si scorre:
     la .vista li' ha overflow:hidden (stile.css), e lo scorrimento lo
     cambia solo lo script. La serie e' scritta due volte: arrivati a meta'
     si torna indietro di una serie intera, e il nastro non salta.
     Dal 29/09 la velocita' si legge da data-velocita sulla .vista (il
     nastro delle foto ha 60); senza l'attributo resta 47 (le recensioni) ---------- */
  document.querySelectorAll('.vista').forEach(function (vista) {
    var nastro = vista.querySelector('.nastro');
    if (!nastro) { return; }
    var vel = parseFloat(vista.dataset.velocita) || 47;
    var pos = 0, prima = null, giu = false, riparte = 0;
    vista.addEventListener('touchstart', function () { giu = true; }, { passive: true });
    function su() { giu = false; riparte = performance.now() + 800; pos = vista.scrollLeft; }
    vista.addEventListener('touchend', su, { passive: true });
    vista.addEventListener('touchcancel', su, { passive: true });
    function passo(t) {
      var dt = prima === null ? 0 : Math.min(t - prima, 100);
      prima = t;
      if (!giu && t >= riparte) {
        var meta = nastro.scrollWidth / 2;
        pos += vel * dt / 1000;
        if (meta > 0) { while (pos >= meta) { pos -= meta; } }
        vista.scrollLeft = pos;
      }
      requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  });
})();
