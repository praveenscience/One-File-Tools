// ==========================================================
// components/palette.js
// ==========================================================

const palette = document.getElementById("palette");
const overlay = document.getElementById("paletteOverlay");
const input = document.getElementById("commandInput");
const openButton = document.getElementById("openPalette");

let isOpen = false;

/**
 * Opens the command palette.
 */
export function openPalette() {
    if (isOpen) return;

    isOpen = true;

    overlay.classList.remove("hidden");
    palette.classList.remove("hidden");

    requestAnimationFrame(() => {
        overlay.classList.add("open");
        palette.classList.add("open");
    });

    input.value = "";

    setTimeout(() => {
        input.focus();
    }, 50);

    input.dispatchEvent(new Event("input"));
}

/**
 * Closes the command palette.
 */
export function closePalette() {
    if (!isOpen) return;

    isOpen = false;

    overlay.classList.remove("open");
    palette.classList.remove("open");

    setTimeout(() => {
        overlay.classList.add("hidden");
        palette.classList.add("hidden");
    }, 180);

    input.blur();
}

/**
 * Toggle palette.
 */
export function togglePalette() {
    isOpen ? closePalette() : openPalette();
}

/**
 * Returns current state.
 */
export function paletteIsOpen() {
    return isOpen;
}

/**
 * Returns search input.
 */
export function getSearchInput() {
    return input;
}

/**
 * Returns results container.
 */
export function getResultsContainer() {
    return document.getElementById("results");
}

/**
 * Returns palette element.
 */
export function getPaletteElement() {
    return palette;
}

/**
 * Returns overlay.
 */
export function getOverlayElement() {
    return overlay;
}

/**
 * Clear search field.
 */
export function clearSearch() {
    input.value = "";
    input.dispatchEvent(new Event("input"));
}

/**
 * Update search text programmatically.
 */
export function setSearch(value) {
    input.value = value;
    input.dispatchEvent(new Event("input"));
}

/**
 * Focus search input.
 */
export function focusSearch() {
    input.focus();
}

/**
 * Event Listeners
 */

// Open button
openButton?.addEventListener("click", openPalette);

// Click outside closes
overlay?.addEventListener("click", closePalette);

// Prevent overlay click when interacting inside palette
palette?.addEventListener("click", (event) => {
    event.stopPropagation();
});

// Prevent form submission if Enter is pressed inside search
input?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
    }
});
