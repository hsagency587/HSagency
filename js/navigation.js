document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".nav").forEach(function (nav) {
    const menuToggle = nav.querySelector(".nav__menuToggle");
    const dropdown = nav.querySelector(".nav__dropdown");
    const dropdownToggle = nav.querySelector(".nav__dropdownToggle");

    function closeDropdown() {
      if (!dropdown || !dropdownToggle) return;
      dropdown.classList.remove("is-open");
      dropdownToggle.setAttribute("aria-expanded", "false");
    }

    function closeMenu() {
      nav.classList.remove("is-menu-open");
      if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", "false");
      }
      closeDropdown();
    }

    if (menuToggle) {
      menuToggle.addEventListener("click", function () {
        const willOpen = !nav.classList.contains("is-menu-open");
        nav.classList.toggle("is-menu-open", willOpen);
        menuToggle.setAttribute("aria-expanded", String(willOpen));

        if (!willOpen) {
          closeDropdown();
        }
      });
    }

    if (dropdown && dropdownToggle) {
      dropdownToggle.addEventListener("click", function (event) {
        event.stopPropagation();
        const willOpen = !dropdown.classList.contains("is-open");
        dropdown.classList.toggle("is-open", willOpen);
        dropdownToggle.setAttribute("aria-expanded", String(willOpen));
      });
    }

    nav.querySelectorAll(".nav__center a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 980px)").matches) {
          closeMenu();
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target)) {
        closeMenu();
      } else if (dropdown && !dropdown.contains(event.target)) {
        closeDropdown();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;

      const dropdownWasOpen = dropdown && dropdown.classList.contains("is-open");
      const menuWasOpen = nav.classList.contains("is-menu-open");
      closeMenu();

      if (dropdownWasOpen && dropdownToggle) {
        dropdownToggle.focus();
      } else if (menuWasOpen && menuToggle) {
        menuToggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 980) {
        closeMenu();
      }
    });
  });
});
