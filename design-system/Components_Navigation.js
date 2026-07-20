export function moveSelection(direction) {
    activeIndex += direction;

    if (activeIndex < 0)
        activeIndex = items.length - 1;

    if (activeIndex >= items.length)
        activeIndex = 0;
}

//Keyboards
document.addEventListener("keydown", e => {

    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openPalette();
    }

    if (e.key === "Escape") {
        closePalette();
    }

});

//Theme
export function toggleTheme() {
    document.documentElement.classList.toggle("dark");
}

//Script
import "./components/palette.js";
import "./components/keyboard.js";
import "./components/navigation.js";
import "./components/theme.js";
