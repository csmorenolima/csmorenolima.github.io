(() => {
  "use strict";
  const mobileButton = document.querySelector(".mobile-menu-btn");
  const navLinks = document.querySelector(".nav-links");
  const dropdown = document.querySelector(".nav-projects-dropdown");
  const dropdownButton = document.querySelector(".dropdown-toggle");
  const dropdownMenu = document.querySelector(".dropdown-menu");

  const closeMobile = () => {
    if (!mobileButton || !navLinks) return;
    navLinks.classList.remove("is-open");
    mobileButton.setAttribute("aria-expanded", "false");
    mobileButton.setAttribute("aria-label", "Open navigation menu");
  };
  const closeDropdown = () => {
    if (!dropdown || !dropdownButton) return;
    dropdown.classList.remove("is-open");
    dropdownButton.setAttribute("aria-expanded", "false");
  };

  if (mobileButton && navLinks) {
    mobileButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = navLinks.classList.toggle("is-open");
      mobileButton.setAttribute("aria-expanded", String(open));
      mobileButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    });
  }

  if (dropdown && dropdownButton && dropdownMenu) {
    dropdownButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const open = dropdown.classList.toggle("is-open");
      dropdownButton.setAttribute("aria-expanded", String(open));
    });
    dropdownMenu.addEventListener("click", (event) => event.stopPropagation());
  }

  document.addEventListener("click", () => { closeDropdown(); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { closeDropdown(); closeMobile(); }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) closeMobile();
  }, { passive: true });

  document.querySelectorAll("#current-year").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
