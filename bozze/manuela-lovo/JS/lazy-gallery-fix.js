(function () {
  'use strict';

  // Promuove data-lazy-src a src per le immagini della vecchia galleria
  // (placeholder SVG + data-lazy-src, senza lo script Jetpack/WP Rocket originale
  // che avrebbe dovuto gestirle). Usa IntersectionObserver per un caricamento
  // lazy reale; se non disponibile, carica tutto subito.
  function init() {
    var images = Array.prototype.slice.call(document.querySelectorAll('img[data-lazy-src]'));
    if (!images.length) return;

    function promote(img) {
      var src = img.getAttribute('data-lazy-src');
      if (src) img.setAttribute('src', src);
      var srcset = img.getAttribute('data-lazy-srcset');
      if (srcset) img.setAttribute('srcset', srcset);
      img.removeAttribute('data-lazy-src');
      img.removeAttribute('data-lazy-srcset');
    }

    if (!('IntersectionObserver' in window)) {
      images.forEach(promote);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        promote(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '200px 0px' });

    images.forEach(function (img) { observer.observe(img); });
  }

  // Lo script è deferred e posizionato in fondo al body: sui documenti più
  // pesanti l'evento DOMContentLoaded può già essere passato quando questo
  // script viene eseguito. Se il documento è già pronto, avvia subito;
  // altrimenti attendi l'evento come fallback.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
