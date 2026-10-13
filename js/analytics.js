/**
 * HS Agency — GA4 con Consent Mode v2 in modalità BASE + provenienza dei contatti.
 *
 * Modalità base (decisione di Simone, 11/10/2026): nessun tag Google si carica
 * prima del consenso. Il consenso parte "denied"; gtag.js si scarica solo dopo
 * "Accetta" nel banner (js/consent.js).
 *
 * Espone window.HSLead.info(servizio, paginaContatti): i dati da allegare a ogni
 * richiesta, così Simone sa da quale pagina arriva il contatto (T4).
 */
(() => {
  "use strict";

  const GA4_ID = "G-H7E3HVY2VG";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied"
  });

  let gaLoaded = false;
  const loadGa4 = () => {
    gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted"
    });
    if (!GA4_ID || gaLoaded) return;
    gaLoaded = true;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
    document.head.append(script);
    gtag("js", new Date());
    gtag("config", GA4_ID);
  };

  const whenConsentReady = (callback) => {
    if (window.HSConsent) callback(window.HSConsent);
    else window.setTimeout(() => whenConsentReady(callback), 50);
  };
  whenConsentReady((consent) => consent.onGrant(loadGa4));

  const track = (name, params) => gtag("event", name, params || {});

  // Codice del clic Google: dall'indirizzo di questa pagina, da quello della pagina
  // precedente (stesso sito) o, se c'è consenso, dal cookie _gcl_aw. Niente storage propri.
  const clickIds = () => {
    const own = new URLSearchParams(window.location.search);
    let previous = new URLSearchParams();
    try {
      const ref = new URL(document.referrer);
      if (ref.origin === window.location.origin) previous = ref.searchParams;
    } catch (error) {
      // referrer vuoto o non valido
    }
    const read = (key) => own.get(key) || previous.get(key) || "";
    let gclid = read("gclid");
    if (!gclid) {
      const match = document.cookie.match(/(?:^|; )_gcl_aw=([^;]*)/);
      if (match) gclid = decodeURIComponent(match[1]).split(".").slice(2).join(".");
    }
    return { gclid, gbraid: read("gbraid"), wbraid: read("wbraid") };
  };

  const sendTime = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const offset = -d.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
      `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
      `${sign}${pad(Math.floor(Math.abs(offset) / 60))}${pad(Math.abs(offset) % 60)}`;
  };

  const previousPage = () => {
    try {
      const ref = new URL(document.referrer);
      return ref.origin === window.location.origin ? ref.pathname : (ref.hostname || "diretto");
    } catch (error) {
      return "diretto";
    }
  };

  window.HSLead = {
    track,
    info: (servizio) => {
      const ids = clickIds();
      return {
        servizio,
        pagina_provenienza: previousPage(),
        pagina_contatti: window.location.pathname,
        gclid: ids.gclid,
        gbraid: ids.gbraid,
        wbraid: ids.wbraid,
        ora_invio: sendTime()
      };
    },
    // Riga leggibile da aggiungere al messaggio: si vede anche se il template EmailJS
    // non ha ancora i campi dedicati.
    summary: (info) =>
      `[Provenienza] servizio: ${info.servizio} · da: ${info.pagina_provenienza} · modulo: ${info.pagina_contatti}` +
      (info.gclid ? ` · gclid: ${info.gclid}` : "")
  };

  // Clic su telefono, WhatsApp, mail e pulsanti verso le pagine contatti.
  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link) return;
    const href = link.getAttribute("href");
    const label = link.textContent.trim().replace(/\s+/g, " ").slice(0, 80);
    if (href.startsWith("tel:")) track("clic_telefono", { posizione: label });
    else if (href.includes("wa.me/")) track("clic_whatsapp", { posizione: label });
    else if (href.startsWith("mailto:")) track("clic_email", { posizione: label });
    else if (/^\/contatti\/|\/(analisi|prenota)\/$|\/(google|meta)-ads\/consulenza\/$/.test(href)) track("clic_cta", { posizione: label, destinazione: href });
  });
})();
