/**
 * HS Agency — consenso marketing/statistiche + caricamento condizionato del Pixel Meta.
 *
 * Nessun tracciamento (Pixel o CAPI) deve partire prima che l'utente abbia
 * accettato. Questo file espone `window.HSConsent` con:
 *   - HSConsent.hasConsent()      -> true | false | null (null = non ancora deciso)
 *   - HSConsent.onGrant(callback) -> esegue callback subito se già concesso,
 *                                    altrimenti lo mette in coda finché l'utente accetta
 *   - HSConsent.reset()           -> riapre il banner (usato dal link "Preferenze cookie")
 *
 * Include anche `loadMetaPixel(pixelId)`, usato dalle pagine che devono
 * caricare il Pixel dopo il consenso.
 */
(() => {
  "use strict";

  const STORAGE_KEY = "hs_consent_v1";
  const queue = [];
  let decided = null;

  const readStoredConsent = () => {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      if (value === "granted" || value === "denied") return value;
    } catch (error) {
      // localStorage non disponibile (es. modalità privata restrittiva): trattare come non deciso.
    }
    return null;
  };

  const storeConsent = (value) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      // Se non possiamo persistere la scelta, il banner ricomparirà al prossimo load: accettabile.
    }
  };

  const runQueue = () => {
    while (queue.length) {
      const callback = queue.shift();
      try {
        callback();
      } catch (error) {
        console.error("HSConsent callback error:", error);
      }
    }
  };

  const grant = () => {
    decided = "granted";
    storeConsent("granted");
    hideBanner();
    runQueue();
  };

  const deny = () => {
    decided = "denied";
    storeConsent("denied");
    hideBanner();
    queue.length = 0;
  };

  let bannerEl = null;
  let manageEl = null;

  const buildBanner = () => {
    const el = document.createElement("div");
    el.className = "hs-consent";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-live", "polite");
    el.innerHTML = `
      <p class="hs-consent__text">
        Usiamo cookie tecnici e, solo con il tuo consenso, strumenti di misurazione e marketing
        (es. Meta Pixel) per capire come funzionano le nostre campagne.
        <a href="https://www.iubenda.com/privacy-policy/60892143" target="_blank" rel="noopener">Leggi la privacy policy</a>.
      </p>
      <div class="hs-consent__actions">
        <button type="button" class="hs-consent__btn hs-consent__btn--accept" data-hs-consent="accept">Accetta</button>
        <button type="button" class="hs-consent__btn" data-hs-consent="reject">Rifiuta</button>
      </div>
    `;
    document.body.appendChild(el);

    el.querySelector('[data-hs-consent="accept"]').addEventListener("click", grant);
    el.querySelector('[data-hs-consent="reject"]').addEventListener("click", deny);

    return el;
  };

  const buildManageLink = () => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "hs-consent__manage";
    el.textContent = "Preferenze cookie";
    el.hidden = true;
    el.addEventListener("click", () => {
      el.hidden = true;
      showBanner();
    });
    document.body.appendChild(el);
    return el;
  };

  function showBanner() {
    if (!bannerEl) bannerEl = buildBanner();
    bannerEl.hidden = false;
    if (manageEl) manageEl.hidden = true;
  }

  function hideBanner() {
    if (bannerEl) bannerEl.hidden = true;
    if (manageEl && decided) manageEl.hidden = false;
  }

  const init = () => {
    decided = readStoredConsent();
    manageEl = buildManageLink();

    if (decided === "granted") {
      manageEl.hidden = false;
      runQueue();
    } else if (decided === "denied") {
      manageEl.hidden = false;
    } else {
      showBanner();
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.HSConsent = {
    hasConsent: () => decided === "granted",
    onGrant: (callback) => {
      if (decided === "granted") {
        callback();
      } else if (decided !== "denied") {
        queue.push(callback);
      }
      // decided === "denied": non accodiamo nulla, l'utente ha rifiutato esplicitamente.
    },
    reset: () => {
      decided = null;
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (error) {}
      if (manageEl) manageEl.hidden = true;
      showBanner();
    }
  };

  /**
   * Carica il Pixel Meta base (fbq) e traccia il PageView.
   * Va chiamato sempre dentro HSConsent.onGrant(...).
   */
  window.loadMetaPixel = (pixelId) => {
    if (!pixelId) {
      console.error("loadMetaPixel: pixelId mancante");
      return;
    }
    if (window.fbq) {
      window.fbq("init", pixelId);
      window.fbq("track", "PageView");
      return;
    }

    /* eslint-disable */
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window,document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */

    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  };
})();
