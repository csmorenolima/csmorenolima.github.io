(() => {
    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function initFlipCards() {
        document.querySelectorAll(".flip-card").forEach((card) => {
            const toggle = () => {
                const isFlipped = card.classList.toggle("flipped");
                card.setAttribute("aria-pressed", String(isFlipped));
            };

            card.addEventListener("click", (event) => {
                if (event.target.closest(".portraitArrow, a, button")) return;
                toggle();
            });

            card.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                if (event.target.closest(".portraitArrow, a, button")) return;
                event.preventDefault();
                toggle();
            });
        });
    }

    function initPortraitCarousels() {
        const imagesByKey = {
            cyrenthos: [
                "../assets/soct-characters/Cyrenthos.png",
                "../assets/soct-characters/CyrenthosFemale.png"
            ],
            lumyrion: [
                "../assets/soct-characters/Lumyrion.png",
                "../assets/soct-characters/LumyrionArtifact.png"
            ]
        };

        const updateArrow = (arrow, index) => {
            const path = arrow.querySelector("path");
            if (!path) return;

            const showingSecondImage = index === 1;
            arrow.classList.toggle("carousel-arrow-left", showingSecondImage);
            arrow.classList.toggle("carousel-arrow-right", !showingSecondImage);
            path.setAttribute("d", showingSecondImage ? "M10 2L4 8l6 6" : "M6 2l6 6-6 6");
            arrow.setAttribute(
                "aria-label",
                showingSecondImage ? "Show primary character image" : "Show alternate character image"
            );
        };

        document.querySelectorAll("[data-portrait-carousel]").forEach((container) => {
            const key = container.dataset.portraitCarousel;
            const images = imagesByKey[key];
            const image = container.querySelector(".portraitImage");
            const arrow = container.querySelector(".portraitArrow");

            if (!images || !image || !arrow) return;

            let index = Math.max(0, images.indexOf(image.getAttribute("src") || ""));
            updateArrow(arrow, index);

            const advance = (event) => {
                event.preventDefault();
                event.stopPropagation();
                index = (index + 1) % images.length;
                image.src = images[index];
                updateArrow(arrow, index);
            };

            arrow.addEventListener("click", advance);
            arrow.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                advance(event);
            });
        });
    }

    function initMapModal() {
        const openButtons = document.querySelectorAll("[data-open-map]");
        const modal = document.getElementById("mapModal");
        const closeButton = document.getElementById("closeMapModal");
        const chronicleArrow = document.getElementById("chronicleArrow");
        const chronicleTitle = document.getElementById("chronicleHeader");

        if (!openButtons.length || !modal || !closeButton) return;

        let previouslyFocused = null;

        const openModal = () => {
            previouslyFocused = document.activeElement;
            modal.classList.add("active");
            modal.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            closeButton.focus();
        };

        const closeModal = () => {
            modal.classList.remove("active");
            modal.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
            if (previouslyFocused instanceof HTMLElement) {
                previouslyFocused.focus();
            }
        };

        openButtons.forEach((button) => button.addEventListener("click", openModal));
        closeButton.addEventListener("click", closeModal);

        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModal();
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && modal.classList.contains("active")) {
                closeModal();
            }
        });

        if (chronicleArrow && chronicleTitle) {
            const scrollToChronicle = () => {
                const content = chronicleTitle.closest(".map-modal-content");
                if (!content) return;
                content.scrollTo({
                    top: Math.max(chronicleTitle.offsetTop - 36, 0),
                    behavior: reducedMotion.matches ? "auto" : "smooth"
                });
            };

            chronicleArrow.addEventListener("click", scrollToChronicle);
            chronicleArrow.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                scrollToChronicle();
            });
        }
    }

    function initInteractiveMap() {
        const container = document.getElementById("map-regions-container");
        const mapImage = document.querySelector(".map-image");
        const tooltip = document.getElementById("map-tooltip");

        if (!container || !mapImage || !tooltip) return;

        const hideTooltip = () => {
            tooltip.style.display = "none";
            tooltip.style.opacity = "0";
            tooltip.replaceChildren();
        };

        const positionTooltip = (x, y) => {
            const margin = 16;
            const estimatedWidth = Math.min(320, window.innerWidth - margin * 2);
            const left = Math.min(x + 22, window.innerWidth - estimatedWidth - margin);
            const top = Math.min(y - 10, window.innerHeight - 230);
            tooltip.style.left = `${Math.max(margin, left)}px`;
            tooltip.style.top = `${Math.max(margin, top)}px`;
        };

        const showTooltip = (item, x, y, type, showLore = false) => {
            tooltip.replaceChildren();

            const name = document.createElement("strong");
            name.textContent = item.name || "Unknown region";
            tooltip.append(name);

            if (type === "creature" && item.danger) {
                const danger = document.createElement("span");
                danger.className = "map-danger";
                danger.textContent = `Danger: ${item.danger}`;
                tooltip.append(document.createElement("br"), danger);
            }

            const blurb = document.createElement("em");
            blurb.textContent = item.blurb || "";
            tooltip.append(document.createElement("br"), blurb);

            const prompt = document.createElement("span");
            prompt.className = "map-expand";
            prompt.textContent = showLore ? "Lore revealed" : "Select to reveal lore";
            tooltip.append(prompt);

            const lore = document.createElement("span");
            lore.className = `lore${showLore ? " is-visible" : ""}`;
            lore.textContent = item.lore || "";
            tooltip.append(lore);

            tooltip.style.display = "block";
            tooltip.style.opacity = "1";
            positionTooltip(x, y);
        };

        const renderRegions = (data) => {
            if (!mapImage.naturalWidth || !mapImage.naturalHeight) return;

            container.replaceChildren();
            const imageWidth = mapImage.naturalWidth;
            const imageHeight = mapImage.naturalHeight;

            const renderOverlay = (item, type) => {
                if (!item.coords) return;
                const [x, y, radius] = item.coords.split(",").map(Number);
                if (![x, y, radius].every(Number.isFinite)) return;

                const centreX = (x / imageWidth) * 100;
                const centreY = (y / imageHeight) * 100;
                const relativeRadius = (radius / imageWidth) * 100;

                const region = document.createElement("button");
                region.type = "button";
                region.className = type === "creature" ? "map-region creature-region" : "map-region";
                region.id = `${type}-${item.id}`;
                region.setAttribute("aria-label", `${item.name}: ${item.blurb || "View lore"}`);
                region.style.position = "absolute";
                region.style.left = `calc(${centreX}% - ${relativeRadius}%)`;
                region.style.top = `calc(${centreY}% - ${relativeRadius}%)`;
                region.style.width = `${relativeRadius * 2}%`;
                region.style.height = `${relativeRadius * 2}%`;

                let loreVisible = false;

                region.addEventListener("mouseenter", (event) => {
                    showTooltip(item, event.clientX, event.clientY, type, loreVisible);
                });
                region.addEventListener("mousemove", (event) => {
                    showTooltip(item, event.clientX, event.clientY, type, loreVisible);
                });
                region.addEventListener("mouseleave", hideTooltip);
                region.addEventListener("focus", () => {
                    const rect = region.getBoundingClientRect();
                    showTooltip(item, rect.right, rect.top, type, loreVisible);
                });
                region.addEventListener("blur", hideTooltip);
                region.addEventListener("click", (event) => {
                    loreVisible = true;
                    showTooltip(item, event.clientX || region.getBoundingClientRect().right, event.clientY || region.getBoundingClientRect().top, type, true);
                });

                container.append(region);

                if (item.effect) {
                    const effect = document.createElement("div");
                    const effectClass = item.effect === "corrupted"
                        ? "corrupted-flash"
                        : item.effect === "glow"
                            ? "aeyantis-glow"
                            : item.effect;

                    effect.className = `map-effect ${effectClass}`;
                    effect.style.position = "absolute";
                    effect.style.left = `calc(${centreX}% - ${relativeRadius * .9}%)`;
                    effect.style.top = `calc(${centreY}% - ${relativeRadius * .9}%)`;
                    effect.style.width = `${relativeRadius * 1.8}%`;
                    effect.style.height = `${relativeRadius * 1.8}%`;
                    effect.setAttribute("aria-hidden", "true");
                    container.append(effect);
                }
            };

            (data.regions || []).forEach((region) => renderOverlay(region, "region"));
            (data.creatures || []).forEach((creature) => renderOverlay(creature, "creature"));
        };

        fetch("../assets/map-interactive-data.json")
            .then((response) => {
                if (!response.ok) throw new Error(`Map data request failed: ${response.status}`);
                return response.json();
            })
            .then((data) => {
                const draw = () => renderRegions(data);
                if (mapImage.complete) draw();
                else mapImage.addEventListener("load", draw, { once: true });
                window.addEventListener("resize", draw, { passive: true });
            })
            .catch((error) => {
                console.warn("Interactive map could not be loaded.", error);
            });
    }

    function initFog() {
        const fog = document.getElementById("fog-bg");
        if (!fog) return;

        const fogSvgs = [
            `<svg class="fog-layer" data-layer="0" viewBox="0 0 1600 420" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs><filter id="soct-blur-1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="32"/></filter></defs>
                <path d="M0 320 Q400 200 800 320 T1600 320 Q1400 420 800 400 Q200 380 0 320Z" fill="white" filter="url(#soct-blur-1)"/>
            </svg>`,
            `<svg class="fog-layer" data-layer="1" viewBox="0 0 1400 340" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs><filter id="soct-blur-2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="20"/></filter></defs>
                <path d="M0 220 Q350 120 700 220 T1400 220 Q1200 340 700 320 Q200 300 0 220Z" fill="white" filter="url(#soct-blur-2)"/>
            </svg>`,
            `<svg class="fog-layer" data-layer="2" viewBox="0 0 900 180" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs><filter id="soct-blur-3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter></defs>
                <path d="M0 120 Q200 60 450 120 T900 120 Q800 180 450 170 Q100 160 0 120Z" fill="white" filter="url(#soct-blur-3)"/>
            </svg>`
        ];

        fog.innerHTML = fogSvgs.join("");
        const layers = [...fog.querySelectorAll(".fog-layer")];

        if (reducedMotion.matches) {
            layers.forEach((layer, index) => {
                layer.style.opacity = String(.11 + index * .045);
                layer.style.transform = `translate3d(0, ${index * 90 - 90}px, 0)`;
            });
            return;
        }

        const parameters = [
            { baseY: -100, speed: .065, ampX: 260, ampY: 25, opacity: .12, opacityAmp: .055, opacitySpeed: .2, scrollRange: 80 },
            { baseY: -10, speed: -.082, ampX: 300, ampY: 35, opacity: .16, opacityAmp: .065, opacitySpeed: .25, scrollRange: 120 },
            { baseY: 90, speed: .105, ampX: 220, ampY: 40, opacity: .2, opacityAmp: .075, opacitySpeed: .31, scrollRange: 160 }
        ];

        let start = 0;
        let scrollY = window.scrollY;

        window.addEventListener("scroll", () => {
            scrollY = window.scrollY;
        }, { passive: true });

        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const seconds = (timestamp - start) / 1000;
            const maximumScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            const scrollProgress = scrollY / maximumScroll;

            layers.forEach((layer, index) => {
                const p = parameters[index];
                const x = Math.sin(seconds * p.speed + index) * p.ampX;
                const yWave = Math.cos(seconds * p.speed * .7 + index) * p.ampY;
                const y = p.baseY + yWave - scrollProgress * p.scrollRange;
                const opacity = p.opacity + Math.abs(Math.sin(seconds * p.opacitySpeed + index)) * p.opacityAmp;

                layer.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                layer.style.opacity = opacity.toFixed(3);
            });

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    document.addEventListener("DOMContentLoaded", () => {
        initFlipCards();
        initPortraitCarousels();
        initMapModal();
        initInteractiveMap();
        initFog();
    });
})();
