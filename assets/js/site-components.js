(() => {
  "use strict";

  // Adds consistent keyboard + swipe navigation without replacing page-specific state logic.
  document.querySelectorAll(".carousel--insight").forEach((carousel) => {
    if (!carousel.hasAttribute("tabindex")) carousel.tabIndex = 0;
    const prev = carousel.querySelector(".carousel__button--prev");
    const next = carousel.querySelector(".carousel__button--next");
    if (!prev || !next) return;

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); prev.click(); }
      if (event.key === "ArrowRight") { event.preventDefault(); next.click(); }
    });

    let startX = null;
    carousel.addEventListener("pointerdown", (event) => { startX = event.clientX; }, { passive: true });
    carousel.addEventListener("pointerup", (event) => {
      if (startX === null) return;
      const delta = event.clientX - startX;
      startX = null;
      if (Math.abs(delta) < 45) return;
      (delta > 0 ? prev : next).click();
    }, { passive: true });
  });

  // Landing project rails keep their own per-row controls.
  // Their page scripts handle disabled states; shared JS must not hide or restyle them.

  // Normalise Escape-close behaviour across custom lightboxes.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const configs = [
      [".dm-lightbox.is-open", "is-open"],
      [".brightup-lightbox.is-open", "is-open"],
      [".gallery-lightbox-overlay.is-open", "is-open"],
      [".hc-lightbox.open", "open"],
      [".s360-lightbox.is-open", "is-open"]
    ];
    for (const [selector, cls] of configs) {
      const overlay = document.querySelector(selector);
      if (overlay) {
        overlay.classList.remove(cls);
        overlay.setAttribute("aria-hidden", "true");
      }
    }
  });
})();
