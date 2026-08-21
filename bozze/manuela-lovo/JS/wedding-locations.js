(function () {
  "use strict";

  var section = document.querySelector("[data-wedding-locations]");

  if (!section) {
    return;
  }

  var tabs = Array.prototype.slice.call(section.querySelectorAll("[data-location-index]"));
  var panels = Array.prototype.slice.call(section.querySelectorAll("[data-location-panel]"));
  var photoStage = section.querySelector(".wedding-location-photos");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var locationKeys = ["lucedio", "cicogne", "valentina", "varese", "monferrato"];
  var activeIndex = 0;
  var rotationTimer = null;

  function selectLocation(index, moveFocus) {
    if (index < 0 || index >= tabs.length) {
      return;
    }

    activeIndex = index;

    tabs.forEach(function (tab, tabIndex) {
      var isActive = tabIndex === activeIndex;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    panels.forEach(function (panel, panelIndex) {
      var isActive = panelIndex === activeIndex;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", String(!isActive));
    });

    if (photoStage) {
      photoStage.setAttribute("data-active-location", locationKeys[activeIndex]);
    }

    if (moveFocus) {
      tabs[activeIndex].focus();
    }
  }

  function stopRotation() {
    if (rotationTimer !== null) {
      window.clearInterval(rotationTimer);
      rotationTimer = null;
    }
  }

  function startRotation() {
    stopRotation();

    if (reducedMotion.matches || document.hidden) {
      return;
    }

    rotationTimer = window.setInterval(function () {
      selectLocation((activeIndex + 1) % tabs.length, false);
    }, 4000);
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      selectLocation(index, false);
      startRotation();
    });

    tab.addEventListener("keydown", function (event) {
      var nextIndex = activeIndex;

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        nextIndex = (activeIndex + 1) % tabs.length;
      } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        nextIndex = (activeIndex - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      selectLocation(nextIndex, true);
      startRotation();
    });
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopRotation();
    } else {
      startRotation();
    }
  });

  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", startRotation);
  } else if (typeof reducedMotion.addListener === "function") {
    reducedMotion.addListener(startRotation);
  }

  selectLocation(0, false);
  startRotation();
}());
