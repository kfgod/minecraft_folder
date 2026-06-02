import { CONFIG } from '../config.js';

export function updateAppLayout(app) {
    const isMobile = window.innerWidth < CONFIG.MOBILE_BREAKPOINT;
    app.elements.body.classList.toggle(CONFIG.CSS_CLASSES.MOBILE_LAYOUT, isMobile);
    app.elements.body.classList.toggle(CONFIG.CSS_CLASSES.DESKTOP_LAYOUT, !isMobile);
    if (!isMobile) {
        app.closeNav();
        app.toggleFiltersPanel(false);
    }
}
