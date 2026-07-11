(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  const menuToggle = document.querySelector(".menu-toggle");
  const headerBrand = document.querySelector(".site-header .brand");
  const headerPhone = document.querySelector(".header-phone");
  const navLinks = Array.from(document.querySelectorAll(".site-nav a"));

  const updateScrollUI = () => {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

    header?.classList.toggle("is-scrolled", scrollTop > 24);

    if (progress) {
      const amount = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;
      progress.style.transform = `scaleX(${amount})`;
    }
  };

  updateScrollUI();
  window.addEventListener("scroll", updateScrollUI, { passive: true });

  if (menuToggle) {
    const closeMenu = (restoreFocus = false) => {
      document.body.classList.remove("menu-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Apri menu");
      if (restoreFocus) menuToggle.focus();
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = !document.body.classList.contains("menu-open");
      document.body.classList.toggle("menu-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Chiudi menu" : "Apri menu");

      if (isOpen) {
        window.requestAnimationFrame(() => navLinks[0]?.focus());
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => closeMenu(window.innerWidth <= 1050));
    });

    headerBrand?.addEventListener("click", () => closeMenu());
    headerPhone?.addEventListener("click", () => closeMenu());

    window.addEventListener("keydown", (event) => {
      if (!document.body.classList.contains("menu-open")) return;

      if (event.key === "Escape") {
        closeMenu(true);
        return;
      }

      if (event.key === "Tab") {
        const focusableItems = [
          ...(headerBrand ? [headerBrand] : []),
          ...navLinks,
          ...(headerPhone ? [headerPhone] : []),
          menuToggle
        ];
        const firstItem = focusableItems[0];
        const lastItem = focusableItems[focusableItems.length - 1];

        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault();
          lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault();
          firstItem.focus();
        }
      }
    });

    window.addEventListener(
      "resize",
      () => {
        if (window.innerWidth > 1050 && document.body.classList.contains("menu-open")) {
          closeMenu();
        }
      },
      { passive: true }
    );
  }

  const reveals = document.querySelectorAll(".reveal");

  if (reducedMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7%" }
    );

    reveals.forEach((element) => revealObserver.observe(element));
  }

  const rotatingLabel = document.querySelector("[data-rotating-label]");
  if (rotatingLabel && !reducedMotion) {
    const labels = (rotatingLabel.dataset.labels || "")
      .split("|")
      .map((label) => label.trim())
      .filter(Boolean);
    let activeLabel = 0;

    if (labels.length > 1) {
      window.setInterval(() => {
        activeLabel = (activeLabel + 1) % labels.length;
        rotatingLabel.animate(
          [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-0.5rem)", offset: 0.45 },
            { opacity: 0, transform: "translateY(0.5rem)", offset: 0.5 },
            { opacity: 1, transform: "translateY(0)" }
          ],
          { duration: 600, easing: "cubic-bezier(.22,1,.36,1)" }
        );
        window.setTimeout(() => {
          rotatingLabel.textContent = labels[activeLabel];
        }, 300);
      }, 2600);
    }
  }

  const tabLists = document.querySelectorAll("[role='tablist']");
  tabLists.forEach((tabList) => {
    const tabs = Array.from(tabList.querySelectorAll("[role='tab']"));
    const panels = tabs
      .map((tab) => document.getElementById(tab.getAttribute("aria-controls")))
      .filter(Boolean);

    const activateTab = (nextTab, moveFocus = true) => {
      tabs.forEach((tab) => {
        const selected = tab === nextTab;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });

      panels.forEach((panel) => {
        panel.hidden = panel.id !== nextTab.getAttribute("aria-controls");
      });

      if (moveFocus) nextTab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activateTab(tab, false));
      tab.addEventListener("keydown", (event) => {
        let nextIndex = null;

        if (event.key === "ArrowDown" || event.key === "ArrowRight") {
          nextIndex = (index + 1) % tabs.length;
        } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        }

        if (nextIndex !== null) {
          event.preventDefault();
          activateTab(tabs[nextIndex]);
        }
      });
    });

    document.querySelectorAll("[data-service-tab]").forEach((link) => {
      const targetTab = tabs.find((tab) => tab.id === link.dataset.serviceTab);
      if (!targetTab) return;

      link.addEventListener("click", () => activateTab(targetTab, false));
    });
  });

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
})();
