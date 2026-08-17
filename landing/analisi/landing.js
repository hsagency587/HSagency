(() => {
  "use strict";

  const form = document.getElementById("analysis-form");
  if (!form) return;

  const googlePath = document.getElementById("google-profile-path");
  const manualPath = document.getElementById("manual-business-path");
  const businessSearch = document.getElementById("business-search");
  const businessLocation = document.getElementById("business-location");
  const locationField = document.getElementById("location-field");
  const showLocationButton = document.getElementById("show-location");
  const hideLocationButton = document.getElementById("hide-location");
  const manualBusinessName = document.getElementById("manual-business-name");
  const businessSector = document.getElementById("business-sector");
  const resultsPanel = document.getElementById("business-results-panel");
  const resultsList = document.getElementById("business-results");
  const searchStatus = document.getElementById("search-status");
  const formStatus = document.getElementById("form-status");
  const submitButton = form.querySelector(".analysis-submit");

  const state = {
    mode: "google",
    selectedPlace: null,
    sessionToken: null,
    placesLibrary: null,
    mapsPromise: null,
    mapsAuthFailed: false,
    searchTimer: null,
    requestId: 0
  };

  const previousGoogleAuthFailure = window.gm_authFailure;
  window.gm_authFailure = () => {
    state.mapsAuthFailed = true;
    if (typeof previousGoogleAuthFailure === "function") previousGoogleAuthFailure();
  };

  const getMapsApiKey = () => {
    const configuredKey = window.HS_AGENCY_ANALYSIS_CONFIG?.googleMapsApiKey;
    const metaKey = document.querySelector('meta[name="google-maps-api-key"]')?.content;
    return String(configuredKey || metaKey || "").trim();
  };

  const emailjsConfig = window.HS_AGENCY_ANALYSIS_CONFIG?.emailjs || {};
  let emailjsInitialized = false;

  const ensureEmailjsInitialized = () => {
    if (emailjsInitialized) return;
    if (!window.emailjs) throw new Error("emailjs-unavailable");
    if (!emailjsConfig.publicKey) throw new Error("emailjs-not-configured");
    window.emailjs.init(emailjsConfig.publicKey);
    emailjsInitialized = true;
  };

  const buildGbpLink = () => {
    if (!state.selectedPlace?.id) return "";
    return `https://www.google.com/maps/place/?q=place_id:${state.selectedPlace.id}`;
  };

  const closeResults = () => {
    resultsPanel.hidden = true;
    businessSearch.setAttribute("aria-expanded", "false");
  };

  const clearResults = () => {
    resultsList.replaceChildren();
    closeResults();
  };

  const clearSelectedPlace = () => {
    state.selectedPlace = null;
    businessSearch.removeAttribute("data-place-selected");
  };

  const resetLocationFallback = () => {
    locationField.hidden = true;
    hideLocationButton.hidden = true;
    showLocationButton.hidden = false;
    businessLocation.value = "";
  };

  const loadMaps = () => {
    if (state.mapsPromise) return state.mapsPromise;

    const apiKey = getMapsApiKey();
    if (!apiKey) {
      state.mapsPromise = Promise.reject(new Error("missing-api-key"));
      state.mapsPromise.catch(() => {});
      return state.mapsPromise;
    }

    state.mapsPromise = new Promise((resolve, reject) => {
      if (window.google?.maps?.importLibrary) {
        if (state.mapsAuthFailed) {
          reject(new Error("maps-auth-error"));
          return;
        }
        resolve(window.google.maps);
        return;
      }

      const callbackName = `hsAgencyMapsReady${Date.now()}`;
      const script = document.createElement("script");
      const source = new URL("https://maps.googleapis.com/maps/api/js");
      let settled = false;

      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        callback(value);
      };

      const timeoutId = window.setTimeout(() => {
        window[callbackName] = () => {};
        finish(reject, new Error("maps-load-timeout"));
      }, 12000);

      source.searchParams.set("key", apiKey);
      source.searchParams.set("loading", "async");
      source.searchParams.set("v", "weekly");
      source.searchParams.set("callback", callbackName);

      window[callbackName] = () => {
        delete window[callbackName];
        if (state.mapsAuthFailed) {
          finish(reject, new Error("maps-auth-error"));
          return;
        }
        finish(resolve, window.google.maps);
      };

      script.src = source.toString();
      script.async = true;
      script.onerror = () => {
        delete window[callbackName];
        finish(reject, new Error("maps-load-error"));
      };
      document.head.append(script);
    });

    return state.mapsPromise;
  };

  const getPlacesLibrary = async () => {
    if (state.placesLibrary) return state.placesLibrary;
    const maps = await loadMaps();
    if (state.mapsAuthFailed) throw new Error("maps-auth-error");
    state.placesLibrary = await maps.importLibrary("places");
    return state.placesLibrary;
  };

  const startSession = async () => {
    const { AutocompleteSessionToken } = await getPlacesLibrary();
    state.sessionToken = new AutocompleteSessionToken();
  };

  const selectPlace = async (placePrediction) => {
    searchStatus.textContent = "Selezione dell'attività…";

    try {
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ["id"] });
      const selectedLabel = placePrediction.text.toString();

      state.selectedPlace = {
        id: place.id,
        label: selectedLabel
      };

      businessSearch.dataset.placeSelected = "true";
      businessSearch.value = selectedLabel;
      manualBusinessName.value = selectedLabel;
      searchStatus.textContent = `Attività selezionata: ${selectedLabel}`;
      clearResults();
      state.sessionToken = null;
    } catch (error) {
      clearSelectedPlace();
      searchStatus.textContent = "Non siamo riusciti a selezionare il risultato. Puoi inviare il nome manualmente.";
    }
  };

  const renderSuggestions = (suggestions) => {
    resultsList.replaceChildren();

    const predictions = suggestions
      .map((suggestion) => suggestion.placePrediction)
      .filter(Boolean)
      .slice(0, 6);

    if (!predictions.length) {
      closeResults();
      searchStatus.textContent = "Nessun risultato trovato. Puoi aggiungere la posizione o inviare il nome manualmente.";
      return;
    }

    predictions.forEach((prediction) => {
      const item = document.createElement("li");
      item.setAttribute("role", "option");

      const button = document.createElement("button");
      button.className = "autocomplete__option";
      button.type = "button";
      button.textContent = prediction.text.toString();
      button.addEventListener("click", () => selectPlace(prediction));

      item.appendChild(button);
      resultsList.appendChild(item);
    });

    resultsPanel.hidden = false;
    businessSearch.setAttribute("aria-expanded", "true");
    searchStatus.textContent = `${predictions.length} risultati trovati.`;
  };

  const searchBusinesses = async () => {
    const name = businessSearch.value.trim();
    const location = businessLocation.value.trim();
    const query = [name, location].filter(Boolean).join(", ");
    const currentRequestId = ++state.requestId;

    if (name.length < 3) {
      clearResults();
      searchStatus.textContent = "";
      state.sessionToken = null;
      return;
    }

    searchStatus.textContent = "Ricerca dell'attività in corso…";

    try {
      const { AutocompleteSuggestion } = await getPlacesLibrary();
      if (!state.sessionToken) await startSession();

      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        includedRegionCodes: ["it"],
        language: "it-IT",
        region: "it",
        sessionToken: state.sessionToken
      });

      if (currentRequestId !== state.requestId) return;
      renderSuggestions(suggestions);
    } catch (error) {
      if (currentRequestId !== state.requestId) return;
      clearResults();
      if (error.message === "missing-api-key") {
        searchStatus.textContent = "La ricerca Google non è configurata. Puoi inviare il nome manualmente.";
      } else if (error.message === "maps-auth-error") {
        searchStatus.textContent = "La ricerca Google non è autorizzata per questa pagina. Puoi inviare il nome manualmente.";
      } else if (error.message === "maps-load-error" || error.message === "maps-load-timeout") {
        searchStatus.textContent = "La ricerca Google non è disponibile in questo momento. Puoi inviare il nome manualmente.";
      } else {
        searchStatus.textContent = "Non siamo riusciti a completare la ricerca. Puoi inviare il nome manualmente.";
      }
    }
  };

  const scheduleSearch = () => {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(searchBusinesses, 350);
  };

  const setMode = (mode) => {
    state.mode = mode;
    const isManual = mode === "manual";

    googlePath.hidden = isManual;
    manualPath.hidden = !isManual;
    businessSearch.required = !isManual;
    businessSearch.disabled = isManual;
    businessLocation.disabled = isManual;
    manualBusinessName.required = isManual;
    manualBusinessName.disabled = !isManual;
    businessSector.required = isManual;
    businessSector.disabled = !isManual;
    resetLocationFallback();

    if (isManual) {
      manualBusinessName.value = manualBusinessName.value || businessSearch.value;
      state.sessionToken = null;
      clearResults();
      manualBusinessName.focus();
    } else {
      businessSearch.value = businessSearch.value || manualBusinessName.value;
      businessSearch.focus();
      if (businessSearch.value.trim().length >= 3) scheduleSearch();
    }
  };

  businessSearch.addEventListener("input", () => {
    if (state.selectedPlace) clearSelectedPlace();
    manualBusinessName.value = businessSearch.value;
    scheduleSearch();
  });

  businessSearch.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeResults();
      return;
    }

    if (event.key === "ArrowDown" && !resultsPanel.hidden) {
      const firstOption = resultsList.querySelector("button");
      if (firstOption) {
        event.preventDefault();
        firstOption.focus();
      }
    }
  });

  businessLocation.addEventListener("input", () => {
    clearSelectedPlace();
    scheduleSearch();
  });

  manualBusinessName.addEventListener("input", () => {
    businessSearch.value = manualBusinessName.value;
    clearSelectedPlace();
  });

  showLocationButton.addEventListener("click", () => {
    locationField.hidden = false;
    showLocationButton.hidden = true;
    hideLocationButton.hidden = false;
    businessLocation.focus();
    if (businessSearch.value.trim().length >= 3) scheduleSearch();
  });

  hideLocationButton.addEventListener("click", () => {
    resetLocationFallback();
    businessSearch.focus();
    if (businessSearch.value.trim().length >= 3) scheduleSearch();
  });

  document.getElementById("show-manual-path").addEventListener("click", () => setMode("manual"));
  document.getElementById("show-google-path").addEventListener("click", () => setMode("google"));

  document.addEventListener("click", (event) => {
    if (event.target instanceof Element && !event.target.closest(".autocomplete")) closeResults();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const firstName = document.getElementById("first-name").value.trim();
    const isManual = state.mode === "manual";
    const companyName = (isManual ? manualBusinessName.value : (state.selectedPlace?.label || businessSearch.value)).trim();
    const sector = businessSector.value.trim();
    const whatsapp = document.getElementById("phone").value.trim();

    const hasGbpLink = Boolean(state.selectedPlace?.id);
    const hasManualInfo = isManual && Boolean(sector) && Boolean(companyName);

    if (!whatsapp || (!hasGbpLink && !hasManualInfo)) {
      formStatus.textContent = "Inserisci WhatsApp e almeno l'attività trovata su Google oppure settore e nome attività.";
      formStatus.style.color = "var(--red-text)";
      return;
    }

    const templateParams = {
      gbp_link: buildGbpLink(),
      settore: sector,
      nome_attivita: companyName,
      whatsapp,
      nome_persona: firstName,
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

      try {
        sessionStorage.setItem("hsagencyLead", "pending");
      } catch (error) {
        // Il redirect deve continuare anche se lo storage non è disponibile.
      }

      window.location.assign("/contati/ringraziamento/grazie-local-seo-web.html");
    } catch (error) {
      formStatus.textContent = "Errore nell'invio. Riprova.";
      formStatus.style.color = "var(--red-text)";
      submitButton.disabled = false;
      submitButton.innerHTML = originalLabel;
    }
  });
})();
