/* Carosello testimonial: filtro per gruppo, frecce, scorrimento automatico leggero.
   Le card sono tutte nel codice: il JavaScript le mostra e le nasconde soltanto. */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-testimonials]").forEach((root) => {
    const track = root.querySelector(".testimonials__track");
    const items = Array.from(track.children);
    const chips = root.querySelectorAll("[data-filter]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const group = chip.dataset.filter;
        chips.forEach((other) => other.setAttribute("aria-pressed", String(other === chip)));
        items.forEach((item) => {
          item.hidden = group !== "tutti" && !item.dataset.groups.split(" ").includes(group);
        });
        track.scrollLeft = 0;
      });
    });

    const step = () => {
      const visible = items.find((item) => !item.hidden);
      return visible ? visible.getBoundingClientRect().width + 18 : 300;
    };
    const move = (direction) => {
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      const atStart = track.scrollLeft <= 4;
      if (direction > 0 && atEnd) track.scrollLeft = 0;
      else if (direction < 0 && atStart) track.scrollLeft = track.scrollWidth;
      else track.scrollBy({ left: direction * step() });
    };

    // Card tutte alte uguali da chiuse; "Leggi tutta" allarga solo la card della recensione.
    const cards = items.map((item) => item.querySelector(".t-card")).filter(Boolean);
    const equalize = () => {
      track.style.removeProperty("--t-card-h");
      const closed = cards.filter((card) => !card.querySelector(".t-card__review.is-open"));
      const tallest = Math.max(0, ...closed.map((card) => card.getBoundingClientRect().height));
      if (tallest) track.style.setProperty("--t-card-h", `${Math.ceil(tallest)}px`);
    };
    root.querySelectorAll(".t-card__more").forEach((button) => {
      button.addEventListener("click", () => {
        const review = button.closest(".t-card__review");
        const open = review.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(open));
        button.querySelector("span").textContent = open ? "Chiudi" : "Leggi tutta";
      });
    });
    equalize();
    window.addEventListener("resize", equalize);
    window.addEventListener("load", equalize);
    if (document.fonts) document.fonts.ready.then(equalize);

    const arrows = root.querySelectorAll("[data-move]");
    arrows.forEach((button) => {
      button.addEventListener("click", () => move(Number(button.dataset.move)));
    });
    // le frecce servono solo se le card non stanno tutte nello spazio
    const toggleArrows = () => {
      const overflow = track.scrollWidth > track.clientWidth + 4;
      arrows.forEach((button) => { button.hidden = !overflow; });
      // se le card stanno tutte nello spazio (es. un solo caso) restano al centro, senza sfumature
      root.classList.toggle("is-static", !overflow);
    };
    toggleArrows();
    window.addEventListener("resize", toggleArrows);
    window.addEventListener("load", toggleArrows);

    if (reduceMotion) return;
    let paused = false;
    ["mouseenter", "focusin", "touchstart"].forEach((name) =>
      root.addEventListener(name, () => { paused = true; }, { passive: true }));
    ["mouseleave", "focusout"].forEach((name) =>
      root.addEventListener(name, () => { paused = false; }));
    window.setInterval(() => {
      if (!paused && !document.hidden && track.scrollWidth > track.clientWidth) move(1);
    }, 6000);
  });
});
