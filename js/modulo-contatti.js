/**
 * Moduli delle pagine contatti SEO, Google Ads e Meta Ads.
 * Usa la stessa configurazione EmailJS del modulo di analisi (js/runtime-config.js)
 * e allega la provenienza del contatto (js/analytics.js).
 *
 * Attributi del <form id="contact-form">:
 *   data-servizio  nome del servizio, finisce nel campo "settore" della mail
 *   data-grazie    pagina di ringraziamento
 */
(() => {
  "use strict";

  const form = document.getElementById("contact-form");
  if (!form) return;

  const servizio = form.dataset.servizio || "Contatto";
  const thankYouUrl = form.dataset.grazie || "/contatti/grazie-consulenza/";
  const status = form.querySelector("[data-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const config = window.HS_AGENCY_ANALYSIS_CONFIG?.emailjs || {};

  // Campo dominio: si ripulisce mentre scrivi e si mostra cosa analizzeremo.
  const domainInput = form.elements.dominio;
  const domainStatus = form.querySelector("[data-domain-status]");
  const cleanDomain = (value) =>
    value.trim().toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split(/[/?#\s]/)[0];
  const isDomain = (value) => /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(value);

  if (domainInput && domainStatus) {
    domainInput.addEventListener("input", () => {
      const domain = cleanDomain(domainInput.value);
      domainInput.dataset.placeSelected = String(isDomain(domain));
      domainStatus.textContent = !domain
        ? ""
        : isDomain(domain)
          ? `Analizzeremo il sito: ${domain}`
          : "Scrivi il dominio completo, per esempio iltuosito.it";
    });
    domainInput.addEventListener("blur", () => {
      const domain = cleanDomain(domainInput.value);
      if (isDomain(domain)) domainInput.value = domain;
    });
  }

  let started = false;
  form.addEventListener("input", () => {
    if (started || !window.HSLead) return;
    started = true;
    window.HSLead.track("modulo_iniziato", { servizio });
  });

  const value = (name) => (form.elements[name] ? form.elements[name].value.trim() : "");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (domainInput) {
      const domain = cleanDomain(domainInput.value);
      domainInput.setCustomValidity(isDomain(domain) ? "" : "Scrivi il dominio completo, per esempio iltuosito.it");
      if (isDomain(domain)) domainInput.value = domain;
    }
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const source = window.HSLead ? window.HSLead.info(servizio) : { servizio };
    const extra = [];
    if (value("sito")) extra.push(`Sito: ${value("sito")}`);
    if (value("campagne")) extra.push(`Campagne: ${value("campagne")}`);
    if (value("obiettivi")) extra.push(`Cosa vorrebbe migliorare: ${value("obiettivi")}`);
    const message = [value("domanda"), extra.join("\n"), window.HSLead ? window.HSLead.summary(source) : ""]
      .filter(Boolean).join("\n\n");

    const templateParams = {
      gbp_link: "",
      settore: servizio,
      nome_attivita: value("dominio") || value("nome_attivita"),
      whatsapp: value("phone"),
      nome_persona: value("first_name"),
      domanda: message,
      data_invio: new Date().toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" }),
      dominio: value("dominio"),
      ...source
    };

    const originalLabel = submitButton.innerHTML;
    status.textContent = "Invio in corso…";
    status.style.color = "";
    submitButton.disabled = true;
    submitButton.textContent = "Invio in corso…";

    try {
      if (!window.emailjs || !config.publicKey) throw new Error("emailjs-unavailable");
      window.emailjs.init(config.publicKey);
      await window.emailjs.send(config.serviceId, config.templateId, templateParams);
      if (window.HSLead) window.HSLead.track("generate_lead", { servizio, pagina_contatti: source.pagina_contatti });
      window.location.assign(thankYouUrl);
    } catch (error) {
      status.textContent = "Errore nell'invio. Riprova o scrivici su WhatsApp.";
      status.style.color = "var(--red-text)";
      submitButton.disabled = false;
      submitButton.innerHTML = originalLabel;
    }
  });
})();
