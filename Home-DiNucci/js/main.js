(() => {
  "use strict";

  document.documentElement.classList.add("has-js");

  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionPreference.matches;

  /* Header e menu desktop */
  const header = document.querySelector("#site-header");
  const setHeaderState = () => header?.classList.toggle("is-scrolled", window.scrollY > 18);
  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  const desktopDropdownTriggers = [...document.querySelectorAll(".nav-dropdown__trigger")];
  const closeDesktopDropdowns = (except = null) => {
    desktopDropdownTriggers.forEach((trigger) => {
      if (trigger !== except) trigger.setAttribute("aria-expanded", "false");
    });
  };

  desktopDropdownTriggers.forEach((trigger) => {
    const dropdown = trigger.closest(".nav-dropdown");

    trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const willOpen = trigger.getAttribute("aria-expanded") !== "true";
      closeDesktopDropdowns(trigger);
      trigger.setAttribute("aria-expanded", String(willOpen));
    });

    trigger.addEventListener("focus", () => {
      closeDesktopDropdowns(trigger);
      trigger.setAttribute("aria-expanded", "true");
    });

    dropdown?.addEventListener("mouseenter", () => {
      closeDesktopDropdowns(trigger);
      trigger.setAttribute("aria-expanded", "true");
    });

    dropdown?.addEventListener("mouseleave", () => {
      if (!dropdown.contains(document.activeElement)) trigger.setAttribute("aria-expanded", "false");
    });

    dropdown?.addEventListener("focusout", (event) => {
      if (!dropdown.contains(event.relatedTarget)) trigger.setAttribute("aria-expanded", "false");
    });

    trigger.nextElementSibling?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => trigger.setAttribute("aria-expanded", "false"));
    });
  });

  document.addEventListener("click", () => closeDesktopDropdowns());

  /* Menu mobile */
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector("#mobile-menu");
  let mobileMenuReturnFocus = null;

  const closeMobileMenu = (restoreFocus = true) => {
    if (!menuToggle || !mobileMenu) return;
    const wasOpen = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Apri il menu");
    mobileMenu.hidden = true;
    document.body.classList.remove("menu-open");

    mobileMenu.querySelectorAll(".mobile-submenu-trigger").forEach((trigger) => {
      trigger.setAttribute("aria-expanded", "false");
      if (trigger.nextElementSibling) trigger.nextElementSibling.hidden = true;
    });

    if (wasOpen && restoreFocus && mobileMenuReturnFocus instanceof HTMLElement) {
      mobileMenuReturnFocus.focus({ preventScroll: true });
    }
  };

  menuToggle?.addEventListener("click", () => {
    const willOpen = menuToggle.getAttribute("aria-expanded") !== "true";
    if (!willOpen) {
      closeMobileMenu();
      return;
    }

    mobileMenuReturnFocus = document.activeElement;
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Chiudi il menu");
    mobileMenu.hidden = false;
    document.body.classList.add("menu-open");
    window.requestAnimationFrame(() => mobileMenu.querySelector("button, a")?.focus());
  });

  document.addEventListener("click", (event) => {
    if (
      menuToggle?.getAttribute("aria-expanded") !== "true" ||
      !mobileMenu ||
      mobileMenu.contains(event.target) ||
      menuToggle.contains(event.target)
    ) return;

    closeMobileMenu(false);
  });

  document.querySelectorAll(".mobile-submenu-trigger").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const submenu = trigger.nextElementSibling;
      const willOpen = trigger.getAttribute("aria-expanded") !== "true";

      document.querySelectorAll(".mobile-submenu-trigger").forEach((other) => {
        if (other === trigger) return;
        other.setAttribute("aria-expanded", "false");
        if (other.nextElementSibling) other.nextElementSibling.hidden = true;
      });

      trigger.setAttribute("aria-expanded", String(willOpen));
      if (submenu) submenu.hidden = !willOpen;
    });
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMobileMenu()));
  document.querySelectorAll(".brand, .mobile-catalog").forEach((link) => {
    link.addEventListener("click", () => {
      if (menuToggle?.getAttribute("aria-expanded") === "true") closeMobileMenu(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const activeDropdown = document.activeElement?.closest?.(".nav-dropdown");
      const activeTrigger = activeDropdown?.querySelector(".nav-dropdown__trigger");
      closeDesktopDropdowns();
      if (activeTrigger) {
        activeTrigger.focus({ preventScroll: true });
        activeTrigger.setAttribute("aria-expanded", "false");
      }
      closeMobileMenu();
      return;
    }

    if (event.key !== "Tab" || menuToggle?.getAttribute("aria-expanded") !== "true" || !mobileMenu) return;
    const menuFocusables = [...mobileMenu.querySelectorAll("button:not([disabled]), a[href]")]
      .filter((element) => !element.closest("[hidden]"));
    const brand = document.querySelector(".site-header .brand");
    const mobileCatalog = document.querySelector(".mobile-catalog");
    const focusable = [menuToggle, brand, mobileCatalog, ...menuFocusables]
      .filter((element) => element instanceof HTMLElement && window.getComputedStyle(element).display !== "none");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1020) closeMobileMenu(false);
  });

  /* Entrate: si riattivano a ogni nuovo passaggio nella visuale */
  const earlyRevealElements = [...document.querySelectorAll(".duo-section .reveal, .duo-section .reveal-photo--rise")];
  const revealElements = [...document.querySelectorAll(".reveal, .reveal-photo")]
    .filter((element) => !earlyRevealElements.includes(element));
  const fadeSections = [...document.querySelectorAll(".fade-section")];

  if (reducedMotion || !("IntersectionObserver" in window)) {
    earlyRevealElements.forEach((element) => element.classList.add("is-visible"));
    revealElements.forEach((element) => element.classList.add("is-visible"));
    fadeSections.forEach((section) => section.classList.add("section-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          window.requestAnimationFrame(() => entry.target.classList.add("is-visible"));
          if (entry.target.matches(".catalog-exhibitor")) revealObserver.unobserve(entry.target);
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -4%" });

    revealElements.forEach((element) => revealObserver.observe(element));

    const earlyRevealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          window.requestAnimationFrame(() => entry.target.classList.add("is-visible"));
        } else {
          entry.target.classList.remove("is-visible");
        }
      });
    }, { threshold: 0.02, rootMargin: "0px 0px 10% 0px" });

    earlyRevealElements.forEach((element) => earlyRevealObserver.observe(element));

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle("section-visible", entry.isIntersecting));
    }, { threshold: 0.08 });

    fadeSections.forEach((section) => sectionObserver.observe(section));
  }

  /* Hero: sei categorie, cambio ogni 2,5 secondi */
  const heroSlides = [...document.querySelectorAll(".hero-slide")];
  let heroIndex = 0;
  let heroTimer;

  const showHeroSlide = (nextIndex) => {
    if (!heroSlides.length) return;
    heroIndex = (nextIndex + heroSlides.length) % heroSlides.length;
    heroSlides.forEach((slide, index) => slide.classList.toggle("is-active", index === heroIndex));
  };

  const restartHeroTimer = () => {
    window.clearInterval(heroTimer);
    if (reducedMotion || heroSlides.length < 2) return;
    heroTimer = window.setInterval(() => showHeroSlide(heroIndex + 1), 2500);
  };

  restartHeroTimer();

  /* In mobile allinea il bordo superiore della foto a quello dei CTA. */
  const hero = document.querySelector(".hero");
  const heroActions = document.querySelector(".hero__actions");
  const heroAside = document.querySelector(".hero__aside");
  let heroAsideFrame;

  const syncMobileHeroAsideTop = () => {
    if (!hero || !heroActions || !heroAside) return;

    window.cancelAnimationFrame(heroAsideFrame);
    heroAsideFrame = window.requestAnimationFrame(() => {
      if (window.innerWidth > 780) {
        heroAside.style.removeProperty("--hero-mobile-aside-top");
        return;
      }

      const heroTop = hero.getBoundingClientRect().top;
      const actionsTop = heroActions.getBoundingClientRect().top;
      heroAside.style.setProperty("--hero-mobile-aside-top", `${Math.round(actionsTop - heroTop)}px`);
    });
  };

  syncMobileHeroAsideTop();
  document.fonts?.ready?.then(syncMobileHeroAsideTop);
  window.addEventListener("load", syncMobileHeroAsideTop, { once: true });
  window.addEventListener("resize", syncMobileHeroAsideTop, { passive: true });

  /* Informazioni finanziamento */
  const setFinanceState = (wrap, open) => {
    const button = wrap.querySelector(".finance-note");
    const text = document.querySelector(`#${button?.getAttribute("aria-controls")}`);
    wrap.classList.toggle("is-open", open);
    if (button) {
      if (!button.dataset.closedLabel) button.dataset.closedLabel = button.getAttribute("aria-label") || "Mostra le informazioni sul finanziamento";
      button.setAttribute("aria-expanded", String(open));
      button.setAttribute("aria-label", open ? button.dataset.closedLabel.replace(/^Mostra/, "Nascondi") : button.dataset.closedLabel);
    }
    text?.setAttribute("aria-hidden", String(!open));
  };

  const financeHoverQuery = window.matchMedia("(min-width: 781px) and (hover: hover) and (pointer: fine)");

  document.querySelectorAll(".finance-wrap").forEach((wrap) => {
    const button = wrap.querySelector(".finance-note");
    button?.addEventListener("pointerdown", () => {
      if (financeHoverQuery.matches) {
        button.dataset.pointerWasOpen = button.getAttribute("aria-expanded") || "false";
      }
    });
    button?.addEventListener("click", () => {
      if (!financeHoverQuery.matches) {
        delete button.dataset.pointerWasOpen;
        setFinanceState(wrap, button.getAttribute("aria-expanded") !== "true");
        return;
      }
      const wasOpen = button.dataset.pointerWasOpen;
      delete button.dataset.pointerWasOpen;
      setFinanceState(wrap, wasOpen ? wasOpen !== "true" : button.getAttribute("aria-expanded") !== "true");
    });
    button?.addEventListener("mouseenter", () => {
      if (financeHoverQuery.matches) setFinanceState(wrap, true);
    });
    button?.addEventListener("mouseleave", () => {
      if (financeHoverQuery.matches && !wrap.contains(document.activeElement)) setFinanceState(wrap, false);
    });
    wrap.addEventListener("focusin", () => {
      if (financeHoverQuery.matches) setFinanceState(wrap, true);
    });
    wrap.addEventListener("focusout", (event) => {
      if (financeHoverQuery.matches && !wrap.contains(event.relatedTarget)) setFinanceState(wrap, false);
    });
  });

  /* Cinque immagini della storia, senza selettore */
  const storySlides = [...document.querySelectorAll(".story-slide")];
  const storyPlay = document.querySelector("#story-play");
  let storyIndex = 0;
  let storyTimer;
  let storyPaused = false;

  const showStorySlide = (nextIndex) => {
    if (!storySlides.length) return;
    storyIndex = (nextIndex + storySlides.length) % storySlides.length;
    storySlides.forEach((slide, index) => {
      const active = index === storyIndex;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
  };

  const restartStoryTimer = () => {
    window.clearInterval(storyTimer);
    if (reducedMotion || storyPaused || storySlides.length < 2) return;
    storyTimer = window.setInterval(() => showStorySlide(storyIndex + 1), 4500);
  };

  storyPlay?.addEventListener("click", () => {
    storyPaused = !storyPaused;
    storyPlay.setAttribute("aria-pressed", String(storyPaused));
    storyPlay.setAttribute("aria-label", storyPaused ? "Riprendi le immagini della storia" : "Metti in pausa le immagini della storia");
    if (storyPaused) window.clearInterval(storyTimer);
    else restartStoryTimer();
  });

  if (reducedMotion && storyPlay) {
    storyPlay.hidden = true;
    storyPlay.disabled = true;
  }

  showStorySlide(0);
  restartStoryTimer();

  /* Catalogo: sei espositori indipendenti, senza autoplay */
  const catalogExhibitors = [...document.querySelectorAll("[data-catalog-exhibitor]")];

  const getCatalogItemsPerView = () => {
    if (window.innerWidth <= 520) return 2;
    if (window.innerWidth <= 1020) return 2;
    return 3;
  };

  const catalogDragSensitivity = 1.45;
  const catalogWheelSensitivity = 1.25;

  const catalogControllers = catalogExhibitors.map((exhibitor) => {
    const viewport = exhibitor.querySelector("[data-catalog-viewport]");
    const cards = [...exhibitor.querySelectorAll(".product-card")];
    const status = exhibitor.querySelector("[data-catalog-status]");
    const progress = exhibitor.querySelector("[data-catalog-progress]");
    let firstVisible = 0;
    let scrollFrame;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let isDragging = false;
    let didDrag = false;

    const updateControls = () => {
      const visible = getCatalogItemsPerView();
      const maximum = Math.max(0, cards.length - visible);
      firstVisible = Math.min(firstVisible, maximum);
      const lastVisible = Math.min(cards.length, firstVisible + visible);

      if (status) status.textContent = `${firstVisible + 1}–${lastVisible} di ${cards.length}`;
      if (progress && viewport) {
        const maximumScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        const scrollProgress = maximumScroll ? Math.min(1, Math.max(0, viewport.scrollLeft / maximumScroll)) : 1;
        const visibleRatio = viewport.scrollWidth ? Math.min(1, viewport.clientWidth / viewport.scrollWidth) : 1;
        const completion = visibleRatio + scrollProgress * (1 - visibleRatio);
        progress.style.width = `${completion * 100}%`;
      }
      exhibitor.querySelector(".catalog-rail")?.classList.toggle("is-static", cards.length <= visible);
    };

    const goTo = (nextIndex, announce = true, immediate = false) => {
      const visible = getCatalogItemsPerView();
      const maximum = Math.max(0, cards.length - visible);
      firstVisible = Math.max(0, Math.min(nextIndex, maximum));
      const target = cards[firstVisible];

      if (viewport && target) {
        viewport.scrollTo({
          left: target.offsetLeft - (cards[0]?.offsetLeft || 0),
          behavior: immediate || reducedMotion ? "auto" : "smooth"
        });
      }

      updateControls();
      if (!announce && status) status.setAttribute("aria-live", "off");
      window.requestAnimationFrame(() => status?.removeAttribute("aria-live"));
    };

    viewport?.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      goTo(firstVisible + direction * getCatalogItemsPerView());
    });

    viewport?.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      isDragging = true;
      didDrag = false;
      dragStartX = event.clientX;
      dragStartScroll = viewport.scrollLeft;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture?.(event.pointerId);
    });

    viewport?.addEventListener("pointermove", (event) => {
      if (!isDragging) return;
      const distance = event.clientX - dragStartX;
      if (Math.abs(distance) > 4) didDrag = true;
      viewport.scrollLeft = dragStartScroll - distance * catalogDragSensitivity;
    });

    const finishCatalogDrag = (event) => {
      if (!isDragging) return;
      isDragging = false;
      viewport.classList.remove("is-dragging");
      if (viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    };

    viewport?.addEventListener("pointerup", finishCatalogDrag);
    viewport?.addEventListener("pointercancel", finishCatalogDrag);
    viewport?.addEventListener("click", (event) => {
      if (!didDrag) return;
      event.preventDefault();
      didDrag = false;
    }, true);

    viewport?.addEventListener("wheel", (event) => {
      const hasHorizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY);
      if (!hasHorizontalIntent && !event.shiftKey) return;
      const distance = event.shiftKey ? event.deltaY : event.deltaX;
      if (!distance) return;
      event.preventDefault();
      viewport.scrollLeft += distance * catalogWheelSensitivity;
    }, { passive: false });

    viewport?.addEventListener("scroll", () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        if (!cards.length || !viewport) return;
        let closest = 0;
        let distance = Number.POSITIVE_INFINITY;
        cards.forEach((card, index) => {
          const nextDistance = Math.abs((card.offsetLeft - (cards[0]?.offsetLeft || 0)) - viewport.scrollLeft);
          if (nextDistance < distance) {
            distance = nextDistance;
            closest = index;
          }
        });
        firstVisible = Math.min(closest, Math.max(0, cards.length - getCatalogItemsPerView()));
        updateControls();
      });
    }, { passive: true });

    goTo(0, false, true);
    return { refresh: () => goTo(firstVisible, false, true) };
  });

  /* Su mobile lo zoom segue in modo continuo la posizione del pannello nello schermo. */
  const mobileCatalogFocusQuery = window.matchMedia("(max-width: 780px)");
  let mobileCatalogFocusFrame;
  let mobileFocusedExhibitor = null;
  let mobileFocusedDuoPanel = null;
  let catalogMobileModeActive = false;
  const duoPanels = [...document.querySelectorAll(".duo-panel")];
  const catalogFocusTargets = catalogExhibitors.map((exhibitor) => ({
    exhibitor,
    target: exhibitor.querySelector(".catalog-rail") || exhibitor,
    figure: exhibitor.querySelector(".product-card figure")
  }));

  const updateMobileCatalogFocus = () => {
    window.cancelAnimationFrame(mobileCatalogFocusFrame);
    mobileCatalogFocusFrame = window.requestAnimationFrame(() => {
      if (!mobileCatalogFocusQuery.matches) {
        if (catalogMobileModeActive) {
          catalogExhibitors.forEach((exhibitor) => {
            exhibitor.classList.remove("is-mobile-focus");
            exhibitor.style.removeProperty("--catalog-image-scale");
            exhibitor.style.removeProperty("--catalog-figure-scale");
            exhibitor.style.removeProperty("--catalog-product-cut");
          });
          catalogMobileModeActive = false;
        }
        mobileFocusedDuoPanel?.classList.remove("is-mobile-focus");
        mobileFocusedExhibitor = null;
        mobileFocusedDuoPanel = null;
        return;
      }

      catalogMobileModeActive = true;
      const focusTop = window.innerHeight * 0.26;
      const focusBottom = window.innerHeight * 0.74;
      const viewportCenter = window.innerHeight / 2;
      const catalogMetrics = catalogFocusTargets.map(({ exhibitor, target, figure }) => {
        const targetRect = target.getBoundingClientRect();
        const cardRect = figure?.parentElement?.getBoundingClientRect() || targetRect;
        const figureHeight = figure?.offsetHeight || targetRect.height;
        const figureWidth = figure?.offsetWidth || targetRect.width || 1;
        const figureRect = {
          top: cardRect.top,
          bottom: cardRect.top + figureHeight,
          height: figureHeight
        };
        return {
          exhibitor,
          figureRect,
          figureWidth
        };
      });
      const duoMetrics = duoPanels.map((panel) => ({
        panel,
        rect: panel.getBoundingClientRect()
      }));
      let focusedExhibitor = null;
      let greatestProgress = 0;
      const catalogCenter = window.innerHeight / 2;
      const fullOpenHold = Math.min(32, Math.max(22, window.innerHeight * 0.032));
      const smoothProgress = (progress) => progress * progress * (3 - 2 * progress);
      const figureCenters = catalogMetrics.map(({ figureRect }) => {
        return (figureRect.top + figureRect.bottom) / 2;
      });

      catalogMetrics.forEach(({ exhibitor, figureRect, figureWidth }, index) => {
        const figureCenter = figureCenters[index];
        const fullyVisibleCenter = window.innerHeight - figureRect.height / 2;
        let easedProgress = 0;

        if (figureCenter <= fullyVisibleCenter && figureCenter >= catalogCenter) {
          const openingDistance = Math.max(1, fullyVisibleCenter - catalogCenter);
          const openingProgress = Math.max(0, Math.min(1, (fullyVisibleCenter - figureCenter) / openingDistance));
          easedProgress = smoothProgress(openingProgress);
        } else if (figureCenter < catalogCenter && figureCenter >= catalogCenter - fullOpenHold) {
          easedProgress = 1;
        } else if (figureCenter < catalogCenter - fullOpenHold) {
          const adjacentDistance = index < figureCenters.length - 1
            ? figureCenters[index + 1] - figureCenter
            : figureCenter - (figureCenters[index - 1] || figureCenter - window.innerHeight * 0.42);
          const closingDistance = Math.max(80, (adjacentDistance - fullOpenHold) / 0.83);
          const travelledAfterHold = catalogCenter - fullOpenHold - figureCenter;
          const closingProgress = Math.max(0, Math.min(1, 1 - travelledAfterHold / closingDistance));
          easedProgress = smoothProgress(closingProgress);
        }

        const imageScale = 1.08 + easedProgress * 0.12;
        const figureScale = 1 + (12 / figureWidth) * easedProgress;
        const productCut = 18 * (1 - easedProgress);

        exhibitor.style.setProperty("--catalog-image-scale", imageScale.toFixed(4));
        exhibitor.style.setProperty("--catalog-figure-scale", figureScale.toFixed(4));
        exhibitor.style.setProperty("--catalog-product-cut", `${productCut.toFixed(2)}px`);

        if (easedProgress > greatestProgress) {
          focusedExhibitor = exhibitor;
          greatestProgress = easedProgress;
        }
      });

      if (focusedExhibitor !== mobileFocusedExhibitor) {
        mobileFocusedExhibitor?.classList.remove("is-mobile-focus");
        focusedExhibitor?.classList.add("is-mobile-focus");
        mobileFocusedExhibitor = focusedExhibitor;
      }

      let focusedDuoPanel = null;
      let greatestDuoOverlap = 0;
      let closestDuoToCenter = Number.POSITIVE_INFINITY;

      duoMetrics.forEach(({ panel, rect }) => {
        const overlap = Math.max(0, Math.min(rect.bottom, focusBottom) - Math.max(rect.top, focusTop));
        const distanceFromCenter = Math.abs((rect.top + rect.bottom) / 2 - viewportCenter);

        if (overlap > greatestDuoOverlap || (overlap === greatestDuoOverlap && overlap > 0 && distanceFromCenter < closestDuoToCenter)) {
          focusedDuoPanel = panel;
          greatestDuoOverlap = overlap;
          closestDuoToCenter = distanceFromCenter;
        }
      });

      if (focusedDuoPanel !== mobileFocusedDuoPanel) {
        mobileFocusedDuoPanel?.classList.remove("is-mobile-focus");
        focusedDuoPanel?.classList.add("is-mobile-focus");
        mobileFocusedDuoPanel = focusedDuoPanel;
      }
    });
  };

  window.addEventListener("scroll", updateMobileCatalogFocus, { passive: true });
  window.addEventListener("resize", updateMobileCatalogFocus, { passive: true });
  mobileCatalogFocusQuery.addEventListener?.("change", updateMobileCatalogFocus);
  updateMobileCatalogFocus();

  document.querySelectorAll("[data-catalog-jump]").forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.querySelector(`#catalog-${link.dataset.catalogJump}`);
      target?.classList.add("is-visible");
    });
  });

  /* Recensioni miste: scorrimento continuo e lettura estesa senza alzare la sezione. */
  const reviewsCarousel = document.querySelector("[data-review-carousel]");
  const reviewsTrack = document.querySelector("[data-review-track]");
  const reviewCards = [...(reviewsTrack?.querySelectorAll(".google-review-card") || [])];
  const reviewReader = document.querySelector("[data-review-reader]");
  const reviewReaderTitle = reviewReader?.querySelector("[data-review-reader-title]");
  const reviewReaderSource = reviewReader?.querySelector("[data-review-reader-source]");
  const reviewReaderMeta = reviewReader?.querySelector("[data-review-reader-meta]");
  const reviewReaderText = reviewReader?.querySelector("[data-review-reader-text]");
  const reviewsMobileQuery = window.matchMedia("(max-width: 780px)");
  const reviewAutoScrollSpeed = 62;
  const reviewLongPressDelay = 2000;
  let reviewsResumeTimer;
  let reviewsAutoFrame;
  let reviewsAutoTimestamp;
  let reviewLongPressTimer;
  let reviewClickGuardTimer;
  let reviewPointerId = null;
  let reviewPointerStartX = 0;
  let reviewPointerStartY = 0;
  let reviewPointerActive = false;
  let reviewLongPressActive = false;
  let suppressReviewClick = false;
  let reviewReaderTrigger;
  let reviewReaderCard;

  if (reviewReader && reviewReader.parentElement !== document.body) {
    document.body.append(reviewReader);
  }

  reviewCards.forEach((card) => {
    const authorElement = card.querySelector(".google-review-card__head strong");
    const metaElement = card.querySelector(".google-review-card__head small");
    if (!authorElement || !metaElement) return;

    const source = authorElement.textContent.trim();
    const [author, ...dateParts] = metaElement.textContent.trim().split(/\s*\u00b7\s*/);
    const date = dateParts.join(" \u00b7 ");

    authorElement.textContent = author;
    metaElement.textContent = [source, date].filter(Boolean).join(" \u00b7 ");
  });

  const pauseReviews = () => {
    window.clearTimeout(reviewsResumeTimer);
    reviewsCarousel?.classList.add("is-paused");
  };

  const resumeReviews = (delay = 900, force = false) => {
    window.clearTimeout(reviewsResumeTimer);
    reviewsResumeTimer = window.setTimeout(() => {
      if (reviewsCarousel?.classList.contains("has-open-review")) return;
      if (!force && reviewsCarousel?.contains(document.activeElement)) return;
      reviewsCarousel?.classList.remove("is-paused");
    }, delay);
  };

  const normalizeReviewScroll = () => {
    if (!reviewsCarousel || !reviewsTrack || !reviewsMobileQuery.matches) return;
    const loopWidth = reviewsTrack.scrollWidth / 2;
    if (!loopWidth) return;
    while (reviewsCarousel.scrollLeft >= loopWidth) reviewsCarousel.scrollLeft -= loopWidth;
  };

  const runReviewsAutoScroll = (timestamp) => {
    if (reviewsAutoTimestamp === undefined) reviewsAutoTimestamp = timestamp;
    const elapsed = Math.min(timestamp - reviewsAutoTimestamp, 64);
    reviewsAutoTimestamp = timestamp;

    if (
      reviewsMobileQuery.matches &&
      !reducedMotion &&
      !document.hidden &&
      !reviewPointerActive &&
      !reviewsCarousel?.classList.contains("is-paused")
    ) {
      reviewsCarousel.scrollLeft += reviewAutoScrollSpeed * (elapsed / 1000);
      normalizeReviewScroll();
    }

    reviewsAutoFrame = window.requestAnimationFrame(runReviewsAutoScroll);
  };

  const restartReviewsAutoScroll = () => {
    window.cancelAnimationFrame(reviewsAutoFrame);
    reviewsAutoTimestamp = undefined;
    if (!reviewsMobileQuery.matches || reducedMotion || document.hidden || !reviewsCarousel) return;
    reviewsAutoFrame = window.requestAnimationFrame(runReviewsAutoScroll);
  };

  const stopReviewsAutoScroll = () => {
    window.cancelAnimationFrame(reviewsAutoFrame);
    reviewsAutoFrame = undefined;
    reviewsAutoTimestamp = undefined;
  };

  const syncReviewsMode = () => {
    if (!reviewsCarousel) return;
    reviewsCarousel.scrollLeft = 0;
    restartReviewsAutoScroll();
  };

  const positionReviewReader = (card) => {
    if (!reviewReader || !card) return;
    const cardRect = card.getBoundingClientRect();
    const viewportGutter = 12;
    const width = Math.min(cardRect.width, window.innerWidth - viewportGutter * 2);
    const left = Math.min(
      Math.max(cardRect.left, viewportGutter),
      window.innerWidth - width - viewportGutter
    );

    reviewReader.style.setProperty("--review-reader-top", `${cardRect.bottom + window.scrollY + 8}px`);
    reviewReader.style.setProperty("--review-reader-left", `${left + window.scrollX}px`);
    reviewReader.style.setProperty("--review-reader-width", `${width}px`);
  };

  reviewCards.forEach((card) => {
    const review = card.querySelector("[data-review-text]");
    if (!review) return;

    if (card.dataset.reviewTitle) {
      const cardTitle = document.createElement("h3");
      cardTitle.className = "google-review-card__title";
      cardTitle.textContent = card.dataset.reviewTitle;
      review.insertAdjacentElement("beforebegin", cardTitle);
    }

    const fullText = review.textContent.trim().replace(/\s+/g, " ");
    review.textContent = fullText;
    review.dataset.fullText = fullText;

    const moreButton = document.createElement("button");
    moreButton.className = "review-more";
    moreButton.type = "button";
    moreButton.textContent = "Leggi tutto";
    moreButton.hidden = true;
    moreButton.setAttribute("aria-controls", "review-reader");
    moreButton.setAttribute("aria-expanded", "false");
    review.insertAdjacentElement("afterend", moreButton);
  });

  const openReviewReader = (card, trigger) => {
    if (!reviewReader || !card || !trigger) return;
    const author = card.querySelector(".google-review-card__head strong")?.textContent.trim() || "Esperienza del cliente";
    const meta = card.querySelector(".google-review-card__head small")?.textContent.trim() || "Recensione";
    const [source, ...dateParts] = meta.split(/\s*\u00b7\s*/);
    const date = dateParts.join(" \u00b7 ");
    const rating = card.querySelector(".google-review-card__head i")?.textContent.trim();
    const fullText = card.querySelector("[data-review-text]")?.dataset.fullText || "";

    if (reviewReaderSource) reviewReaderSource.textContent = rating && rating !== "—" ? `${source} · ${rating} su 5` : source;
    if (reviewReaderTitle) reviewReaderTitle.textContent = card.dataset.reviewTitle || `Recensione di ${author}`;
    if (reviewReaderMeta) reviewReaderMeta.textContent = [author, date].filter(Boolean).join(" · ");
    if (reviewReaderText) {
      reviewReaderText.textContent = fullText;
      reviewReaderText.scrollTop = 0;
    }

    reviewReaderTrigger?.setAttribute("aria-expanded", "false");
    reviewReaderTrigger = trigger;
    reviewReaderCard = card;
    reviewReaderTrigger.setAttribute("aria-expanded", "true");
    pauseReviews();
    positionReviewReader(card);
    reviewReader.hidden = false;
    reviewsCarousel?.classList.add("has-open-review");
    reviewReader.querySelector("[data-review-reader-close]")?.focus({ preventScroll: true });
  };

  const closeReviewReader = ({ restoreFocus = true } = {}) => {
    if (!reviewReader || reviewReader.hidden) return;
    reviewReader.hidden = true;
    reviewsCarousel?.classList.remove("has-open-review");
    reviewReaderTrigger?.setAttribute("aria-expanded", "false");

    if (restoreFocus && reviewReaderTrigger?.isConnected && !reviewReaderTrigger.closest("[data-review-clone]")) {
      reviewReaderTrigger.focus({ preventScroll: true });
    } else if (restoreFocus) {
      reviewsCarousel?.focus({ preventScroll: true });
    } else if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    reviewReaderTrigger = null;
    reviewReaderCard = null;
    resumeReviews(350);
  };

  reviewsTrack?.addEventListener("click", (event) => {
    const trigger = event.target.closest(".review-more");
    if (!trigger) return;
    openReviewReader(trigger.closest(".google-review-card"), trigger);
  });

  const updateReviewOverflow = () => {
    reviewsTrack?.querySelectorAll(".google-review-card").forEach((card) => {
      const review = card.querySelector("[data-review-text]");
      const moreButton = card.querySelector(".review-more");
      if (!review || !moreButton) return;
      moreButton.hidden = review.scrollHeight <= review.clientHeight + 1;
    });
  };

  if (reviewsTrack && reviewCards.length) {
    reviewsTrack.style.setProperty("--review-duration", `${Math.max(42, reviewCards.length * 5)}s`);

    reviewCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.removeAttribute("aria-label");
      clone.dataset.reviewClone = "true";
      clone.querySelectorAll("a, button").forEach((control) => { control.tabIndex = -1; });
      reviewsTrack.appendChild(clone);
    });

    window.requestAnimationFrame(updateReviewOverflow);
    document.fonts?.ready?.then(updateReviewOverflow);
    window.addEventListener("resize", () => {
      updateReviewOverflow();
      if (reviewReaderCard && reviewReader && !reviewReader.hidden) positionReviewReader(reviewReaderCard);
    }, { passive: true });

    restartReviewsAutoScroll();
  }

  reviewsMobileQuery.addEventListener?.("change", syncReviewsMode);
  reviewsCarousel?.addEventListener("focusin", () => {
    if (reviewsMobileQuery.matches && reviewPointerActive) return;
    pauseReviews();
  });
  reviewsCarousel?.addEventListener("focusout", (event) => {
    if (reviewsCarousel.contains(event.relatedTarget)) return;
    resumeReviews();
  });
  reviewsCarousel?.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary) return;

    if (!reviewsMobileQuery.matches || event.pointerType === "mouse") {
      pauseReviews();
      return;
    }

    window.clearTimeout(reviewLongPressTimer);
    window.clearTimeout(reviewClickGuardTimer);
    suppressReviewClick = false;
    reviewPointerId = event.pointerId;
    reviewPointerStartX = event.clientX;
    reviewPointerStartY = event.clientY;
    reviewPointerActive = true;
    reviewLongPressActive = false;
    reviewLongPressTimer = window.setTimeout(() => {
      if (!reviewPointerActive) return;
      reviewLongPressActive = true;
      suppressReviewClick = true;
      pauseReviews();
    }, reviewLongPressDelay);
  });

  reviewsCarousel?.addEventListener("pointermove", (event) => {
    if (!reviewPointerActive || event.pointerId !== reviewPointerId) return;
    const movedX = event.clientX - reviewPointerStartX;
    const movedY = event.clientY - reviewPointerStartY;
    if (Math.hypot(movedX, movedY) > 10) window.clearTimeout(reviewLongPressTimer);
  });

  const finishReviewPointer = (event) => {
    if (!reviewsMobileQuery.matches || event.pointerType === "mouse") {
      resumeReviews(300);
      return;
    }
    if (event.pointerId !== reviewPointerId) return;

    window.clearTimeout(reviewLongPressTimer);
    reviewPointerActive = false;
    reviewPointerId = null;
    normalizeReviewScroll();
    if (reviewLongPressActive) {
      resumeReviews(120, true);
      reviewClickGuardTimer = window.setTimeout(() => { suppressReviewClick = false; }, 500);
    }
    reviewLongPressActive = false;
  };

  reviewsCarousel?.addEventListener("pointerup", finishReviewPointer);
  reviewsCarousel?.addEventListener("pointercancel", finishReviewPointer);
  reviewsCarousel?.addEventListener("click", (event) => {
    if (!suppressReviewClick) return;
    suppressReviewClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  reviewReader?.querySelector("[data-review-reader-close]")?.addEventListener("click", (event) => {
    closeReviewReader({ restoreFocus: event.detail === 0 });
  });
  document.addEventListener("pointerdown", (event) => {
    if (!reviewReader || reviewReader.hidden || reviewReader.contains(event.target)) return;
    closeReviewReader({ restoreFocus: false });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !reviewReader?.hidden) closeReviewReader();
  });

  /* Timeline Novara: quattro tappe, passaggio ogni 12 secondi */
  const timelineData = [
    {
      titleLead: "Le origini",
      titleEmphasis: "a Novara",
      image: "images/logo-storico.jpg",
      alt: "Il logo storico della Gioielleria Di Nucci",
      caption: "Le origini · Corso Cavour",
      description: "Nel dopoguerra Pacifico e Giulia diventano un punto di riferimento per l'oreficeria e l'argenteria piemontese, con sede in Corso Cavour 11.",
      position: "12.5%",
      photoLeft: "0px",
      descriptionSide: "right",
      contain: true,
      enterFrom: "left"
    },
    {
      titleLead: "La gioielleria",
      titleEmphasis: "di famiglia",
      image: "images/fedi-hero.jpg",
      alt: "Fedi in oro, simbolo della vendita al dettaglio",
      caption: "Il passaggio alla vendita al dettaglio",
      description: "A metà degli anni '70 la famiglia lascia l'attività di grossista e apre la Gioielleria-Argenteria Di Nucci in Viale Roma, dove resterà per 45 anni.",
      position: "37.5%",
      photoLeft: "7.35%",
      descriptionSide: "right",
      contain: false,
      enterFrom: "left"
    },
    {
      titleLead: "La terza",
      titleEmphasis: "generazione",
      image: "images/artigianalita.jpg",
      alt: "Lavorazione artigianale di un anello",
      caption: "L'ingresso della terza generazione",
      description: "Nel 2000 Giorgia entra in gioielleria e raccoglie un patrimonio fatto di onestà, professionalità, serietà e competenza.",
      position: "62.5%",
      photoLeft: "calc(92.65% - var(--timeline-photo-width))",
      descriptionSide: "left",
      contain: false,
      enterFrom: "left"
    },
    {
      titleLead: "Il ritorno in centro a",
      titleEmphasis: "Novara",
      image: "images/negozio-2.png",
      alt: "Il banco azzurro della sede di Corso Cavour",
      caption: "2018 · Il ritorno in Corso Cavour",
      description: "Nel settembre 2018 la gioielleria torna dove tutto ha avuto origine: la nuova sede apre in Corso Cavour 10C, nel cuore di Novara.",
      position: "87.5%",
      photoLeft: "calc(100% - var(--timeline-photo-width))",
      descriptionSide: "left",
      contain: false,
      enterFrom: "right"
    }
  ];

  const timelineSteps = [...document.querySelectorAll(".timeline-step")];
  const timelineSection = document.querySelector(".novara-section");
  const timelineImage = document.querySelector("#timeline-image");
  const timelineCaption = document.querySelector("#timeline-caption");
  const timelineDescription = document.querySelector("#timeline-description");
  const timelineFeature = document.querySelector(".timeline-feature");
  const timelineVisual = document.querySelector("#timeline-visual");
  const timelineTitleLead = document.querySelector("#timeline-title-lead");
  const timelineTitleEmphasis = document.querySelector("#timeline-title-emphasis");
  const timelineProgress = document.querySelector(".timeline__line i");
  const timelineScroller = document.querySelector(".timeline");
  let timelineIndex = 0;
  let timelineTimer;
  let timelineTransitionTimer;

  const syncTimelineNarrativeTop = () => {
    if (!timelineFeature || !timelineVisual || !timelineImage || window.innerWidth <= 780) {
      timelineFeature?.style.removeProperty("--timeline-narrative-top");
      return;
    }

    const imageTop = timelineVisual.offsetTop + timelineImage.offsetTop;
    timelineFeature.style.setProperty("--timeline-narrative-top", `${imageTop}px`);
  };

  const showTimeline = (nextIndex, restart = false, immediate = false) => {
    const targetIndex = (nextIndex + timelineData.length) % timelineData.length;
    const data = timelineData[targetIndex];
    timelineIndex = targetIndex;
    window.clearTimeout(timelineTransitionTimer);

    timelineSteps.forEach((step, index) => {
      const active = index === targetIndex;
      step.classList.toggle("is-active", active);
      step.setAttribute("aria-pressed", String(active));
    });

    timelineSection?.style.setProperty("--timeline-position", data.position);
    timelineSection?.style.setProperty("--timeline-photo-left", data.photoLeft);
    timelineFeature?.classList.toggle("is-description-left", data.descriptionSide === "left");
    timelineFeature?.classList.toggle("is-description-right", data.descriptionSide !== "left");
    timelineFeature?.classList.toggle("is-mobile-reversed", targetIndex % 2 === 1);
    window.requestAnimationFrame(syncTimelineNarrativeTop);
    if (timelineProgress) timelineProgress.style.width = `${(targetIndex * 25) + 12.5}%`;
    timelineDescription?.classList.add("is-changing");

    if (timelineScroller && window.innerWidth <= 780) {
      const activeStep = timelineSteps[targetIndex];
      const targetLeft = activeStep.offsetLeft + activeStep.offsetWidth / 2 - timelineScroller.clientWidth / 2;
      timelineScroller.scrollTo({ left: Math.max(0, targetLeft), behavior: immediate || reducedMotion ? "auto" : "smooth" });
    }

    const updateContent = () => {
      if (timelineTitleLead) timelineTitleLead.textContent = data.titleLead;
      if (timelineTitleEmphasis) timelineTitleEmphasis.textContent = data.titleEmphasis;
      if (timelineDescription) {
        timelineDescription.textContent = data.description;
        timelineDescription.classList.remove("is-changing");
      }
      if (timelineCaption) timelineCaption.textContent = data.caption;
      if (timelineImage) {
        timelineImage.classList.remove("from-left", "from-right", "fit-contain");
        timelineImage.src = data.image;
        timelineImage.alt = data.alt;
        timelineImage.classList.toggle("fit-contain", data.contain);
        void timelineImage.offsetWidth;
        if (!immediate && !reducedMotion) timelineImage.classList.add(data.enterFrom === "right" ? "from-right" : "from-left");
      }
    };

    if (immediate || reducedMotion) updateContent();
    else timelineTransitionTimer = window.setTimeout(updateContent, 190);

    if (restart) restartTimelineTimer();
  };

  const restartTimelineTimer = () => {
    window.clearInterval(timelineTimer);
    if (reducedMotion || timelineData.length < 2) return;
    timelineTimer = window.setInterval(() => showTimeline(timelineIndex + 1), 12000);
  };

  timelineSteps.forEach((step) => {
    step.addEventListener("click", () => showTimeline(Number(step.dataset.timelineIndex), true));
  });

  showTimeline(0, false, true);
  restartTimelineTimer();

  /* Contatti: tre fotografie alternate */
  const contactBackgrounds = [...document.querySelectorAll(".contact-bg")];
  const contactIndicators = [...document.querySelectorAll(".contact-slides-indicator span")];
  let contactIndex = 0;
  let contactTimer;

  const showContactBackground = (nextIndex) => {
    if (!contactBackgrounds.length) return;
    contactIndex = (nextIndex + contactBackgrounds.length) % contactBackgrounds.length;
    contactBackgrounds.forEach((image, index) => image.classList.toggle("is-active", index === contactIndex));
    contactIndicators.forEach((indicator, index) => indicator.classList.toggle("is-active", index === contactIndex));
  };

  const restartContactTimer = () => {
    window.clearInterval(contactTimer);
    if (reducedMotion || contactBackgrounds.length < 2) return;
    contactTimer = window.setInterval(() => showContactBackground(contactIndex + 1), 5200);
  };

  restartContactTimer();

  /* Sospende gli automatismi quando la pagina non è visibile. */
  const stopAutomaticMotion = () => {
    [heroTimer, storyTimer, timelineTimer, contactTimer].forEach((timer) => window.clearInterval(timer));
    stopReviewsAutoScroll();
    window.clearTimeout(reviewsResumeTimer);
    window.clearTimeout(reviewLongPressTimer);
    window.clearTimeout(timelineTransitionTimer);
    showTimeline(timelineIndex, false, true);
  };

  const startAutomaticMotion = () => {
    restartHeroTimer();
    restartStoryTimer();
    restartReviewsAutoScroll();
    restartTimelineTimer();
    restartContactTimer();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutomaticMotion();
    else if (!reducedMotion) startAutomaticMotion();
  });

  motionPreference.addEventListener?.("change", (event) => {
    reducedMotion = event.matches;
    if (storyPlay) {
      storyPlay.hidden = reducedMotion;
      storyPlay.disabled = reducedMotion;
    }

    if (reducedMotion) {
      stopAutomaticMotion();
      document.querySelectorAll(".reveal, .reveal-photo").forEach((element) => element.classList.add("is-visible"));
      document.querySelectorAll(".fade-section").forEach((section) => section.classList.add("section-visible"));
    } else if (!document.hidden) {
      startAutomaticMotion();
    }

    catalogControllers.forEach((controller) => controller.refresh());
  });

  /* Mantiene allineati gli espositori quando cambia il breakpoint. */
  let resizeTimer;
  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      catalogControllers.forEach((controller) => controller.refresh());
      normalizeReviewScroll();
      syncTimelineNarrativeTop();
    }, 140);
  });

  const year = document.querySelector("#current-year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
