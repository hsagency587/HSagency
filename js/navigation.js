document.addEventListener("DOMContentLoaded", function () {
  const mobile = window.matchMedia("(max-width: 1239px)");

  document.querySelectorAll(".nav").forEach(function (nav) {
    const menuToggle = nav.querySelector(".nav__menuToggle");
    const menuLabel = nav.querySelector(".nav__menuLabel");
    const dropdowns = Array.from(nav.querySelectorAll(".nav__dropdown"));

    function setDropdown(dropdown, open) {
      dropdown.classList.toggle("is-open", open);
      dropdown.querySelector(".nav__dropdownToggle").setAttribute("aria-expanded", String(open));
    }

    function closeDropdowns(except) {
      dropdowns.forEach(function (dropdown) {
        if (dropdown !== except) setDropdown(dropdown, false);
      });
    }

    function toggleDropdown(dropdown) {
      const willOpen = !dropdown.classList.contains("is-open");
      closeDropdowns(dropdown);
      setDropdown(dropdown, willOpen);
    }

    function setMenu(open) {
      nav.classList.toggle("is-menu-open", open);
      if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", String(open));
      }
      if (menuLabel) {
        menuLabel.textContent = open ? "Chiudi" : "Menu";
      }
      if (!open) {
        closeDropdowns();
      }
    }

    if (menuToggle) {
      menuToggle.addEventListener("click", function () {
        setMenu(!nav.classList.contains("is-menu-open"));
      });
    }

    dropdowns.forEach(function (dropdown) {
      const toggle = dropdown.querySelector(".nav__dropdownToggle");
      const pathLink = dropdown.querySelector(".nav__pathLink");

      toggle.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleDropdown(dropdown);
      });

      // Telefono: "Servizi" apre la lista dei servizi invece di portare alla home
      if (pathLink) {
        pathLink.addEventListener("click", function (event) {
          if (!mobile.matches) return;
          event.preventDefault();
          event.stopPropagation();
          toggleDropdown(dropdown);
        });
      }

      // Desktop: la tendina aperta con la freccia si chiude quando mouse o fuoco escono
      dropdown.addEventListener("mouseleave", function () {
        if (!mobile.matches) setDropdown(dropdown, false);
      });
      dropdown.addEventListener("focusout", function (event) {
        if (!mobile.matches && !dropdown.contains(event.relatedTarget)) setDropdown(dropdown, false);
      });
    });

    nav.querySelectorAll(".nav__center a:not(.nav__pathLink)").forEach(function (link) {
      link.addEventListener("click", function () {
        if (mobile.matches) {
          setMenu(false);
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target)) {
        setMenu(false);
      } else {
        closeDropdowns(dropdowns.find(function (dropdown) {
          return dropdown.contains(event.target);
        }));
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;

      const openDropdown = dropdowns.find(function (dropdown) {
        return dropdown.classList.contains("is-open");
      });
      const menuWasOpen = nav.classList.contains("is-menu-open");
      if (!openDropdown && !menuWasOpen) return;

      if (openDropdown) {
        setDropdown(openDropdown, false);
        openDropdown.querySelector(".nav__dropdownToggle").focus();
      } else if (menuToggle) {
        setMenu(false);
        menuToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (!mobile.matches) {
        setMenu(false);
      }
    });
  });
});
