/* Striscia loghi: scorre sempre da sola e non si ferma mai.
   Si può trascinare con il dito o con la rotella: si sposta e continua a scorrere da lì.
   La lista è duplicata: arrivati a metà si torna all'inizio senza salti. */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".logo-strip__viewport").forEach((viewport) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const speed = 0.35; // px per frame
    const track = viewport.querySelector(".logo-strip__track");
    let copies = 0;
    let position = viewport.scrollLeft;

    // Su schermi larghi la lista deve essere lunga almeno il doppio della striscia:
    // si duplica tutta, così metà lista resta sempre identica all'altra metà.
    const fill = () => {
      if (!track || copies >= 4 || track.scrollWidth / 2 >= viewport.clientWidth + 40) return;
      Array.from(track.children).forEach((item) => {
        const copy = item.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.querySelectorAll("a").forEach((a) => a.setAttribute("tabindex", "-1"));
        copy.querySelectorAll("img").forEach((img) => img.setAttribute("alt", ""));
        track.append(copy);
      });
      copies += 1;
    };

    // Con il mouse: si trascina tenendo premuto, poi riprende a scorrere da lì.
    let dragX = null;
    let moved = 0;
    viewport.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragX = event.clientX;
      moved = 0;
      viewport.classList.add("is-dragging");
    });
    window.addEventListener("pointermove", (event) => {
      if (dragX === null) return;
      const dx = event.clientX - dragX;
      dragX = event.clientX;
      moved += Math.abs(dx);
      viewport.scrollLeft -= dx;
    });
    window.addEventListener("pointerup", () => {
      if (dragX === null) return;
      dragX = null;
      viewport.classList.remove("is-dragging");
    });
    // dopo un trascinamento il rilascio non apre il link sotto il mouse
    viewport.addEventListener("click", (event) => {
      if (moved > 5) event.preventDefault();
      moved = 0;
    }, true);
    viewport.addEventListener("dragstart", (event) => event.preventDefault());

    const loop = () => {
      if (viewport.clientWidth > 0 && !document.hidden) {
        fill();
        const half = viewport.scrollWidth / 2;
        if (half > viewport.clientWidth) {
          // se l'utente ha spostato la striscia, si riparte dalla sua posizione
          if (Math.abs(viewport.scrollLeft - position) > 1.5) position = viewport.scrollLeft;
          position += speed;
          if (position >= half) position -= half;
          if (position < 1) position += half;
          viewport.scrollLeft = position;
        }
      }
      window.requestAnimationFrame(loop);
    };
    window.requestAnimationFrame(loop);
  });
});
