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
  const businessAutocomplete = document.getElementById("business-autocomplete");
  const locationAutocomplete = document.getElementById("location-autocomplete");
  const locationResultsPanel = document.getElementById("location-results-panel");
  const locationResultsList = document.getElementById("location-results");
  const searchStatus = document.getElementById("search-status");
  const formStatus = document.getElementById("form-status");
  const submitButton = form.querySelector(".analysis-submit");
  const searchDebounceMs = 100;

  const state = {
    mode: "google",
    selectedPlace: null,
    sessionToken: null,
    placesLibrary: null,
    mapsPromise: null,
    mapsAuthFailed: false,
    searchTimer: null,
    requestId: 0,
    locationSessionToken: null,
    locationSearchTimer: null,
    locationRequestId: 0
  };

  const getMapsApiKey = () => {
    const configuredKey = window.HS_AGENCY_ANALYSIS_CONFIG?.googleMapsApiKey;
    const metaKey = document.querySelector('meta[name="google-maps-api-key"]')?.content;
    return String(configuredKey || metaKey || "").trim();
  };

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

  const buildGbpLink = () => {
    if (!state.selectedPlace?.id) return "";
    return `https://www.google.com/maps/place/?q=place_id:${state.selectedPlace.id}`;
  };

  const closeResults = () => {
    resultsPanel.hidden = true;
    businessSearch.setAttribute("aria-expanded", "false");
    businessSearch.removeAttribute("aria-activedescendant");

    resultsList.querySelectorAll(".autocomplete__option").forEach((option) => {
      option.setAttribute("aria-selected", "false");
    });
  };

  const clearResults = () => {
    resultsList.replaceChildren();
    closeResults();
  };

  const clearSelectedPlace = () => {
    state.selectedPlace = null;
    businessSearch.removeAttribute("data-place-selected");
  };

  const cancelPendingSearch = () => {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = null;
    state.requestId += 1;
  };

  const showManualFallback = (message) => {
    state.sessionToken = null;
    clearResults();
    searchStatus.textContent = message;
  };

  const previousGoogleAuthFailure = window.gm_authFailure;
  window.gm_authFailure = () => {
    state.mapsAuthFailed = true;
    cancelPendingSearch();
    showManualFallback("La ricerca Google non è disponibile. Puoi proseguire inserendo il nome manualmente.");
    if (typeof previousGoogleAuthFailure === "function") previousGoogleAuthFailure();
  };

  const resetLocationFallback = () => {
    locationField.hidden = true;
    hideLocationButton.hidden = true;
    showLocationButton.hidden = false;
    businessLocation.value = "";
    cancelPendingCitySearch();
    clearLocationResults();
  };

  const loadMaps = () => {
    if (state.mapsPromise) return state.mapsPromise;

    if (state.mapsAuthFailed) {
      return Promise.reject(new Error("maps-auth-error"));
    }

    const apiKey = getMapsApiKey();
    if (!apiKey) {
      return Promise.reject(new Error("missing-api-key"));
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
      const source = new URL("https://maps.googleapis.com/maps/api/js");
      const existingScript = Array.from(document.scripts).find((candidate) =>
        candidate.src.startsWith(source.origin + source.pathname)
      );
      const script = existingScript || document.createElement("script");
      let settled = false;
      let readinessTimer = null;

      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        window.clearInterval(readinessTimer);
        script.removeEventListener("load", handleExistingScriptLoad);
        script.removeEventListener("error", handleScriptError);
        callback(value);
      };

      const resolveWhenReady = () => {
        if (state.mapsAuthFailed) {
          finish(reject, new Error("maps-auth-error"));
        } else if (window.google?.maps?.importLibrary) {
          finish(resolve, window.google.maps);
        }
      };

      const handleExistingScriptLoad = () => resolveWhenReady();
      const handleScriptError = () => {
        delete window[callbackName];
        finish(reject, new Error("maps-load-error"));
      };

      const timeoutId = window.setTimeout(() => {
        window[callbackName] = () => {};
        finish(reject, new Error("maps-load-timeout"));
      }, 12000);

      source.searchParams.set("key", apiKey);
      source.searchParams.set("loading", "async");
      source.searchParams.set("v", "weekly");
      source.searchParams.set("callback", callbackName);

      if (existingScript) {
        script.addEventListener("load", handleExistingScriptLoad, { once: true });
        script.addEventListener("error", handleScriptError, { once: true });
        readinessTimer = window.setInterval(resolveWhenReady, 50);
      } else {
        window[callbackName] = () => {
          delete window[callbackName];
          resolveWhenReady();
        };

        script.src = source.toString();
        script.async = true;
        script.addEventListener("error", handleScriptError, { once: true });
        document.head.append(script);
      }
    });

    state.mapsPromise = state.mapsPromise.catch((error) => {
      state.mapsPromise = null;
      throw error;
    });

    return state.mapsPromise;
  };

  const getPlacesLibrary = async () => {
    if (state.placesLibrary) return state.placesLibrary;
    const maps = await loadMaps();
    if (state.mapsAuthFailed) throw new Error("maps-auth-error");
    state.placesLibrary = await maps.importLibrary("places");

    if (!state.placesLibrary.AutocompleteSuggestion || !state.placesLibrary.AutocompleteSessionToken) {
      throw new Error("places-new-api-unavailable");
    }

    return state.placesLibrary;
  };

  const predictionText = (value) => {
    if (!value) return "";
    return typeof value.toString === "function" ? value.toString().trim() : String(value).trim();
  };

  const getPredictionData = (prediction) => {
    const fullText = predictionText(prediction.text);
    const name = predictionText(prediction.mainText) || fullText;
    const address = predictionText(prediction.secondaryText);

    return {
      id: String(prediction.placeId || "").trim(),
      name,
      address,
      fullText
    };
  };

  const selectPlace = (placePrediction) => {
    cancelPendingSearch();
    const selected = getPredictionData(placePrediction);

    if (!selected.id || !selected.name) {
      clearSelectedPlace();
      showManualFallback("Non siamo riusciti a selezionare il risultato. Puoi inviare il nome manualmente.");
      return;
    }

    state.selectedPlace = {
      id: selected.id,
      label: selected.name,
      address: selected.address,
      text: selected.fullText
    };

    businessSearch.dataset.placeSelected = "true";
    businessSearch.value = selected.name;
    manualBusinessName.value = selected.name;
    searchStatus.textContent = selected.address
      ? `Attività selezionata: ${selected.name} — ${selected.address}`
      : `Attività selezionata: ${selected.name}`;
    clearResults();
    state.sessionToken = null;
  };

  const renderSuggestions = (suggestions) => {
    resultsList.replaceChildren();

    const predictions = (suggestions || [])
      .map((suggestion) => suggestion.placePrediction)
      .filter(Boolean)
      .slice(0, 6);

    if (!predictions.length) {
      closeResults();
      searchStatus.textContent = "Nessun risultato trovato. Puoi aggiungere la posizione o inviare il nome manualmente.";
      return;
    }

    predictions.forEach((prediction, index) => {
      const predictionData = getPredictionData(prediction);
      const item = document.createElement("li");
      item.setAttribute("role", "presentation");

      const button = document.createElement("button");
      button.id = `business-result-${index}`;
      button.className = "autocomplete__option";
      button.type = "button";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");

      const name = document.createElement("span");
      name.className = "autocomplete__optionName";
      name.textContent = predictionData.name;
      button.appendChild(name);

      if (predictionData.address) {
        const address = document.createElement("span");
        address.className = "autocomplete__optionAddress";
        address.textContent = predictionData.address;
        button.appendChild(address);
      }

      button.addEventListener("click", () => selectPlace(prediction));
      button.addEventListener("focus", () => {
        resultsList.querySelectorAll(".autocomplete__option").forEach((option) => {
          option.setAttribute("aria-selected", String(option === button));
        });
        businessSearch.setAttribute("aria-activedescendant", button.id);
      });

      item.appendChild(button);
      resultsList.appendChild(item);
    });

    resultsPanel.hidden = false;
    businessSearch.setAttribute("aria-expanded", "true");
    searchStatus.textContent = `${predictions.length} risultati trovati.`;
  };

  const searchBusinesses = async (currentRequestId) => {
    const name = businessSearch.value.trim();
    const location = businessLocation.value.trim();
    const query = [name, location].filter(Boolean).join(", ");

    if (!name) {
      clearResults();
      searchStatus.textContent = "";
      state.sessionToken = null;
      return;
    }

    searchStatus.textContent = "Ricerca dell'attività in corso…";

    try {
      const { AutocompleteSuggestion, AutocompleteSessionToken } = await getPlacesLibrary();
      if (currentRequestId !== state.requestId) return;
      if (!state.sessionToken) state.sessionToken = new AutocompleteSessionToken();

      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        includedPrimaryTypes: ["establishment"],
        includedRegionCodes: ["it"],
        language: "it-IT",
        region: "it",
        sessionToken: state.sessionToken
      });

      if (currentRequestId !== state.requestId) return;
      renderSuggestions(suggestions);
    } catch (error) {
      if (currentRequestId !== state.requestId) return;
      console.warn("Google Places search unavailable:", error);
      if (error.message === "missing-api-key") {
        showManualFallback("La ricerca Google non è configurata. Puoi proseguire inserendo il nome manualmente.");
      } else if (error.message === "maps-auth-error") {
        showManualFallback("La ricerca Google non è autorizzata per questa pagina. Puoi proseguire inserendo il nome manualmente.");
      } else if (error.message === "maps-load-error" || error.message === "maps-load-timeout") {
        showManualFallback("La ricerca Google non è disponibile in questo momento. Puoi proseguire inserendo il nome manualmente.");
      } else if (error.message === "places-new-api-unavailable") {
        showManualFallback("La ricerca Google non è disponibile. Puoi proseguire inserendo il nome manualmente.");
      } else {
        showManualFallback("Non siamo riusciti a completare la ricerca. Puoi proseguire inserendo il nome manualmente.");
      }
    }
  };

  const scheduleSearch = () => {
    window.clearTimeout(state.searchTimer);
    const currentRequestId = ++state.requestId;
    state.searchTimer = window.setTimeout(() => searchBusinesses(currentRequestId), searchDebounceMs);
  };

  const closeLocationResults = () => {
    locationResultsPanel.hidden = true;
    businessLocation.setAttribute("aria-expanded", "false");
    businessLocation.removeAttribute("aria-activedescendant");

    locationResultsList.querySelectorAll(".autocomplete__option").forEach((option) => {
      option.setAttribute("aria-selected", "false");
    });
  };

  const clearLocationResults = () => {
    locationResultsList.replaceChildren();
    closeLocationResults();
  };

  const cancelPendingCitySearch = () => {
    window.clearTimeout(state.locationSearchTimer);
    state.locationSearchTimer = null;
    state.locationRequestId += 1;
  };

  const selectCity = (cityPrediction) => {
    cancelPendingCitySearch();
    const selected = getPredictionData(cityPrediction);
    businessLocation.value = selected.fullText || selected.name;
    clearLocationResults();
    state.locationSessionToken = null;
    clearSelectedPlace();
    scheduleSearch();
  };

  const renderCitySuggestions = (suggestions) => {
    locationResultsList.replaceChildren();

    const predictions = (suggestions || [])
      .map((suggestion) => suggestion.placePrediction)
      .filter(Boolean)
      .slice(0, 6);

    if (!predictions.length) {
      closeLocationResults();
      return;
    }

    predictions.forEach((prediction, index) => {
      const predictionData = getPredictionData(prediction);
      const item = document.createElement("li");
      item.setAttribute("role", "presentation");

      const button = document.createElement("button");
      button.id = `location-result-${index}`;
      button.className = "autocomplete__option";
      button.type = "button";
      button.setAttribute("role", "option");
      button.setAttribute("aria-selected", "false");

      const name = document.createElement("span");
      name.className = "autocomplete__optionName";
      name.textContent = predictionData.name;
      button.appendChild(name);

      if (predictionData.address) {
        const address = document.createElement("span");
        address.className = "autocomplete__optionAddress";
        address.textContent = predictionData.address;
        button.appendChild(address);
      }

      button.addEventListener("click", () => selectCity(prediction));
      button.addEventListener("focus", () => {
        locationResultsList.querySelectorAll(".autocomplete__option").forEach((option) => {
          option.setAttribute("aria-selected", String(option === button));
        });
        businessLocation.setAttribute("aria-activedescendant", button.id);
      });

      item.appendChild(button);
      locationResultsList.appendChild(item);
    });

    locationResultsPanel.hidden = false;
    businessLocation.setAttribute("aria-expanded", "true");
  };

  const searchCities = async (currentRequestId) => {
    const city = businessLocation.value.trim();

    if (!city) {
      clearLocationResults();
      state.locationSessionToken = null;
      return;
    }

    try {
      const { AutocompleteSuggestion, AutocompleteSessionToken } = await getPlacesLibrary();
      if (currentRequestId !== state.locationRequestId) return;
      if (!state.locationSessionToken) state.locationSessionToken = new AutocompleteSessionToken();

      const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: city,
        includedPrimaryTypes: ["(cities)"],
        includedRegionCodes: ["it"],
        language: "it-IT",
        region: "it",
        sessionToken: state.locationSessionToken
      });

      if (currentRequestId !== state.locationRequestId) return;
      renderCitySuggestions(suggestions);
    } catch (error) {
      if (currentRequestId !== state.locationRequestId) return;
      console.warn("Google city search unavailable:", error);
      clearLocationResults();
      state.locationSessionToken = null;
    }
  };

  const scheduleCitySearch = () => {
    window.clearTimeout(state.locationSearchTimer);
    const currentRequestId = ++state.locationRequestId;
    state.locationSearchTimer = window.setTimeout(() => searchCities(currentRequestId), searchDebounceMs);
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
      cancelPendingSearch();
      clearResults();
      manualBusinessName.focus();
    } else {
      businessSearch.value = businessSearch.value || manualBusinessName.value;
      businessSearch.focus();
      if (businessSearch.value.trim()) scheduleSearch();
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

    const options = Array.from(resultsList.querySelectorAll(".autocomplete__option"));

    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && options.length) {
      if (resultsPanel.hidden) {
        resultsPanel.hidden = false;
        businessSearch.setAttribute("aria-expanded", "true");
      }

      const option = event.key === "ArrowDown" ? options[0] : options[options.length - 1];
      if (option) {
        event.preventDefault();
        option.focus();
      }
      return;
    }

    if (event.key === "Enter" && !resultsPanel.hidden && options.length) {
      event.preventDefault();
      options[0].click();
    }
  });

  resultsList.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;

    const options = Array.from(resultsList.querySelectorAll(".autocomplete__option"));
    const currentIndex = options.indexOf(event.target);
    if (currentIndex < 0) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeResults();
      businessSearch.focus();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      event.target.click();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      options[(currentIndex + 1) % options.length].focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (currentIndex === 0) {
        businessSearch.focus();
      } else {
        options[currentIndex - 1].focus();
      }
    }
  });

  businessLocation.addEventListener("input", () => {
    clearSelectedPlace();
    scheduleSearch();
    scheduleCitySearch();
  });

  businessLocation.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLocationResults();
      return;
    }

    const options = Array.from(locationResultsList.querySelectorAll(".autocomplete__option"));

    if ((event.key === "ArrowDown" || event.key === "ArrowUp") && options.length) {
      if (locationResultsPanel.hidden) {
        locationResultsPanel.hidden = false;
        businessLocation.setAttribute("aria-expanded", "true");
      }

      const option = event.key === "ArrowDown" ? options[0] : options[options.length - 1];
      if (option) {
        event.preventDefault();
        option.focus();
      }
      return;
    }

    if (event.key === "Enter" && !locationResultsPanel.hidden && options.length) {
      event.preventDefault();
      options[0].click();
    }
  });

  locationResultsList.addEventListener("keydown", (event) => {
    if (!(event.target instanceof HTMLButtonElement)) return;

    const options = Array.from(locationResultsList.querySelectorAll(".autocomplete__option"));
    const currentIndex = options.indexOf(event.target);
    if (currentIndex < 0) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeLocationResults();
      businessLocation.focus();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      event.target.click();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      options[(currentIndex + 1) % options.length].focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (currentIndex === 0) {
        businessLocation.focus();
      } else {
        options[currentIndex - 1].focus();
      }
    }
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
    if (businessSearch.value.trim()) scheduleSearch();
  });

  hideLocationButton.addEventListener("click", () => {
    resetLocationFallback();
    businessSearch.focus();
    if (businessSearch.value.trim()) scheduleSearch();
  });

  document.getElementById("show-manual-path").addEventListener("click", () => setMode("manual"));
  document.getElementById("show-google-path").addEventListener("click", () => setMode("google"));

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    if (!businessAutocomplete.contains(event.target)) closeResults();
    if (!locationAutocomplete.contains(event.target)) closeLocationResults();
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

    const hasBusinessInfo = isManual
      ? Boolean(companyName) && Boolean(sector)
      : Boolean(companyName);

    if (!whatsapp || !hasBusinessInfo) {
      formStatus.textContent = "Inserisci WhatsApp e il nome dell'attività. Nel percorso senza Profilo Google inserisci anche il settore.";
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

      const eventId = crypto.randomUUID();

      try {
        sessionStorage.setItem("hsagencyLead", JSON.stringify({ eventId }));
      } catch (error) {
        // Il redirect deve continuare anche se lo storage non è disponibile.
      }

      // Best-effort, non blocca il redirect oltre il timeout interno (800ms).
      await sendCapiLead(eventId, { whatsapp, sourceUrl: window.location.href });

      window.location.assign("/contati/ringraziamento/grazie-local-seo-web.html");
    } catch (error) {
      formStatus.textContent = "Errore nell'invio. Riprova.";
      formStatus.style.color = "var(--red-text)";
      submitButton.disabled = false;
      submitButton.innerHTML = originalLabel;
    }
  });
})();
