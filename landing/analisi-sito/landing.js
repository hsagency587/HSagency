(() => {
  "use strict";

  // Logo in navbar (02/11/2026, Simone): riporta in cima e toglie l'ancora dall'indirizzo, senza ricaricare la pagina
  document.querySelector(".brand[href]")?.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", location.pathname + location.search);
  });

  // Landing "analisi del sito" (02/11/2026): niente ricerca del profilo Google, si chiede il dominio, uno o più
  // ("Ho più di un sito" aggiunge una riga, con la × per toglierla e la scelta "Principale" sotto il campo).
  // Chi non ha un sito apre i campi nome dell'impresa e settore.

  const form = document.getElementById("analysis-form");
  if (!form) return;

  const sitePath = document.getElementById("site-path");
  const manualPath = document.getElementById("manual-business-path");
  const siteList = document.getElementById("site-list");
  const manualBusinessName = document.getElementById("manual-business-name");
  const businessSector = document.getElementById("business-sector");
  const formStatus = document.getElementById("form-status");
  const submitButton = form.querySelector(".analysis-submit");
  let manual = false;

  const emailjsConfig = window.HS_AGENCY_ANALYSIS_CONFIG?.emailjs || {};
  const capiEndpoint = window.HS_AGENCY_ANALYSIS_CONFIG?.capiEndpoint || "";
  let emailjsInitialized = false;

  const readCookie = (name) => {
    const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  };

  const withTimeout = (promise, ms) =>
    Promise.race([
      promise,
      new Promise((resolve) => window.setTimeout(resolve, ms))
    ]);

  // Manda il Lead alla Conversions API (server-side), in parallelo al Pixel che scatterà
  // sulla thank-you page. Usa lo STESSO event_id passato poi a fbq('track','Lead', ..., {eventID})
  // così Meta può deduplicare i due eventi. Fallisce silenziosamente: il Pixel resta il fallback.
  const sendCapiLead = async (eventId, { whatsapp, sourceUrl }) => {
    if (!capiEndpoint || !window.HSConsent?.hasConsent()) return;

    const params = new URLSearchParams(window.location.search);

    try {
      await withTimeout(
        fetch(capiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            eventId,
            eventSourceUrl: sourceUrl,
            phone: whatsapp,
            fbp: readCookie("_fbp"),
            fbc: readCookie("_fbc"),
            fbclid: params.get("fbclid") || ""
          })
        }).catch((error) => {
          console.warn("CAPI lead invio fallito (non bloccante):", error);
        }),
        800
      );
    } catch (error) {
      console.warn("CAPI lead invio fallito (non bloccante):", error);
    }
  };

  const ensureEmailjsInitialized = () => {
    if (emailjsInitialized) return;
    if (!window.emailjs) throw new Error("emailjs-unavailable");
    if (!emailjsConfig.publicKey) throw new Error("emailjs-not-configured");
    window.emailjs.init(emailjsConfig.publicKey);
    emailjsInitialized = true;
  };

  // ---- Domini: pulizia e verifica ----
  // Mezzo secondo dopo che si smette di scrivere, si chiede ai server DNS di Google se il dominio esiste (gratis, senza
  // chiave, solo il dominio). Se sì: bordo verde e icona del sito. Se no: niente, chi compila non se ne accorge.
  // Senza estensione (es. "tuosito"), uscendo dal campo si provano .it .com .eu .net .org: se ne esiste una sola si aggiunge.
  const ESTENSIONI = ["it", "com", "eu", "net", "org"];

  const pulisciDominio = (valore) =>
    valore.trim().toLowerCase()
      .replace(/^[a-z]+:\/\//, "")
      .replace(/^www\./, "")
      .split(/[/?#\s]/)[0];

  const dominioValido = (dominio) => /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(dominio);
  const soloNome = (dominio) => /^[a-z0-9-]+$/.test(dominio);

  const esisteDominio = async (dominio) => {
    const chiedi = async (nome) => {
      const risposta = await fetch("https://dns.google/resolve?name=" + encodeURIComponent(nome) + "&type=A");
      const dati = await risposta.json();
      return dati.Status === 0 && Array.isArray(dati.Answer) && dati.Answer.length > 0;
    };
    return (await chiedi(dominio)) || (await chiedi("www." + dominio));
  };

  const completaEstensione = async (nome) => {
    const esiti = await Promise.all(ESTENSIONI.map((estensione) => esisteDominio(nome + "." + estensione).catch(() => false)));
    const trovate = ESTENSIONI.filter((estensione, i) => esiti[i]);
    return trovate.length === 1 ? nome + "." + trovate[0] : "";
  };

  const righeSito = () => Array.from(siteList.querySelectorAll(".site-row"));
  const inputSito = (riga) => riga.querySelector("input[type='text']");
  const radioSito = (riga) => riga.querySelector("input[type='radio']");

  const mostraTrovato = (input, trovato, dominio) => {
    const icona = input.parentElement.querySelector(".site-field__icon");
    if (trovato) {
      input.dataset.siteFound = "true";
      icona.src = "https://www.google.com/s2/favicons?domain=" + encodeURIComponent(dominio) + "&sz=64";
      icona.hidden = false;
    } else {
      delete input.dataset.siteFound;
      icona.hidden = true;
      icona.removeAttribute("src");
    }
  };

  const attivaVerifica = (input) => {
    let timer = null;
    let richiesta = 0;

    input.addEventListener("input", () => {
      window.clearTimeout(timer);
      mostraTrovato(input, false);
      const dominio = pulisciDominio(input.value);
      if (!dominioValido(dominio)) return;
      timer = window.setTimeout(async () => {
        const mia = ++richiesta;
        try {
          const trovato = await esisteDominio(dominio);
          if (mia === richiesta && pulisciDominio(input.value) === dominio) mostraTrovato(input, trovato, dominio);
        } catch (error) {
          // Nessun avviso: la verifica è solo un aiuto, se non risponde non cambia niente.
        }
      }, 500);
    });

    input.addEventListener("blur", async () => {
      const nome = pulisciDominio(input.value);
      if (!soloNome(nome)) return;
      const mia = ++richiesta;
      const completo = await completaEstensione(nome);
      if (completo && mia === richiesta && pulisciDominio(input.value) === nome) {
        input.value = completo;
        mostraTrovato(input, true, completo);
      }
    });
  };

  // ---- Più siti ----
  const aggiornaPrincipale = () => {
    const righe = righeSito();
    righe.forEach((riga, i) => {
      const scelta = riga.querySelector(".site-main");
      radioSito(riga).value = String(i);
      scelta.hidden = righe.length < 2;
      riga.classList.toggle("site-row--main", radioSito(riga).checked);
    });
  };

  const preparaRiga = (riga) => {
    attivaVerifica(inputSito(riga));
    radioSito(riga).addEventListener("change", aggiornaPrincipale);
    riga.querySelector(".site-remove")?.addEventListener("click", () => {
      const eraPrincipale = radioSito(riga).checked;
      riga.remove();
      if (eraPrincipale) radioSito(righeSito()[0]).checked = true;
      aggiornaPrincipale();
    });
  };

  const aggiungiSito = () => {
    const n = righeSito().length;
    const riga = document.createElement("div");
    riga.className = "site-row";
    riga.innerHTML = `
      <div class="analysis-field analysis-field--full site-field">
        <label class="visually-hidden" for="site-url-${n}">Altro dominio</label>
        <input id="site-url-${n}" name="site_url_${n}" type="text" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Altro dominio, es. tuosito.com">
        <img class="site-field__icon" alt="" hidden>
      </div>
      <button type="button" class="site-remove" aria-label="Togli questo sito">×</button>
      <label class="site-main"><input type="radio" name="site_main" value="${n}"><span>Principale</span></label>`;
    siteList.append(riga);
    preparaRiga(riga);
    aggiornaPrincipale();
    inputSito(riga).focus();
  };

  righeSito().forEach(preparaRiga);
  aggiornaPrincipale();
  document.getElementById("add-site").addEventListener("click", aggiungiSito);

  // ---- Percorso "Non ho un sito" ----
  const setMode = (isManual) => {
    manual = isManual;
    sitePath.hidden = isManual;
    manualPath.hidden = !isManual;
    righeSito().forEach((riga, i) => {
      const input = inputSito(riga);
      input.disabled = isManual;
      input.required = !isManual && i === 0;
    });
    manualBusinessName.required = isManual;
    manualBusinessName.disabled = !isManual;
    businessSector.required = isManual;
    businessSector.disabled = !isManual;
    (isManual ? manualBusinessName : inputSito(righeSito()[0])).focus();
  };

  document.getElementById("show-manual-path").addEventListener("click", () => setMode(true));
  document.getElementById("show-site-path").addEventListener("click", () => setMode(false));

  // ---- Invio ----
  const raccogliSiti = async () => {
    const siti = [];
    for (const riga of righeSito()) {
      const input = inputSito(riga);
      let dominio = pulisciDominio(input.value);
      if (!dominio) continue;
      if (soloNome(dominio)) {
        const completo = await withTimeout(completaEstensione(dominio).catch(() => ""), 1500);
        if (completo) {
          dominio = completo;
          input.value = completo;
          input.dataset.siteFound = "true";
        }
      }
      siti.push({ dominio, verificato: input.dataset.siteFound === "true", principale: radioSito(riga).checked });
    }
    return siti;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const companyName = manualBusinessName.value.trim();
    const sector = businessSector.value.trim();
    const whatsapp = document.getElementById("phone").value.trim();
    const firstName = document.getElementById("first-name").value.trim();
    const siti = manual ? [] : await raccogliSiti();
    const principale = siti.find((sito) => sito.principale) || siti[0];

    if (!whatsapp || (manual ? !(companyName && sector) : !principale)) {
      formStatus.textContent = manual
        ? "Inserisci WhatsApp, nome dell'impresa e settore."
        : "Inserisci WhatsApp e il tuo dominio.";
      formStatus.style.color = "var(--red-text)";
      return;
    }

    // Stesso modello email delle altre landing: il sito principale va nel nome dell'attività e nella domanda, gli altri
    // siti in una riga a parte, la provenienza dice da quale landing arriva la persona.
    const altri = siti.filter((sito) => sito !== principale);
    const descrivi = (sito) => sito.dominio + (sito.verificato ? "" : " (dominio non verificato)");
    const templateParams = {
      gbp_link: "",
      settore: sector,
      nome_attivita: manual ? companyName : principale.dominio,
      whatsapp,
      nome_persona: firstName,
      domanda: [
        document.getElementById("question").value.trim(),
        manual ? "[Sito] non ha ancora un sito" : "[Sito] " + descrivi(principale),
        altri.length ? "[Altri siti] " + altri.map(descrivi).join(", ") : "",
        "[Provenienza] landing: Sito web (analisi del sito)"
      ].filter(Boolean).join("\n\n"),
      data_invio: new Date().toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })
    };

    const originalLabel = submitButton.innerHTML;
    formStatus.textContent = "Invio in corso…";
    formStatus.style.color = "";
    submitButton.disabled = true;
    submitButton.textContent = "Invio in corso…";

    try {
      ensureEmailjsInitialized();
      await window.emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, templateParams);

      const eventId = crypto.randomUUID();

      try {
        sessionStorage.setItem("hsagencyLead", JSON.stringify({ eventId }));
      } catch (error) {
        // Il redirect deve continuare anche se lo storage non è disponibile.
      }

      // Best-effort, non blocca il redirect oltre il timeout interno (800ms).
      await sendCapiLead(eventId, { whatsapp, sourceUrl: window.location.href });

      window.location.assign("/landing/analisi-sito/grazie/");
    } catch (error) {
      formStatus.textContent = "Errore nell'invio. Riprova.";
      formStatus.style.color = "var(--red-text)";
      submitButton.disabled = false;
      submitButton.innerHTML = originalLabel;
    }
  });
})();
