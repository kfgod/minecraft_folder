import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';

const FOCUSABLE_SELECTOR = 'input:not([type="hidden"]), button:not([disabled]), a[href], select, textarea, [tabindex]:not([tabindex="-1"])';

export function focusFirstPanelControl(panel) {
    requestAnimationFrame(() => {
        panel?.querySelector(FOCUSABLE_SELECTOR)?.focus();
    });
}

export function attachPanelScrollGuards(app) {
    const scrollTargets = [app.elements.controlsPanel, app.elements.navPanel, app.elements.navList].filter(Boolean);
    if (scrollTargets.length === 0) return;

    const shouldBlockScroll = (element, deltaY) => {
        if (element.scrollHeight <= element.clientHeight) return false;
        const atTop = element.scrollTop <= 0;
        const atBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
        return (deltaY < 0 && atTop) || (deltaY > 0 && atBottom);
    };

    scrollTargets.forEach((element) => {
        element.addEventListener(
            'wheel',
            (event) => {
                if (!DOMManager.hasClass(app.elements.body, CONFIG.CSS_CLASSES.DESKTOP_LAYOUT)) return;
                if (shouldBlockScroll(element, event.deltaY)) event.preventDefault();
            },
            { passive: false }
        );
    });
}

export function toggleFiltersPanel(app, forceOpen = null) {
    if (!app.elements.body) return;
    const willOpen = forceOpen === null ? !app.elements.body.classList.contains('filters-open') : forceOpen;
    app.elements.body.classList.toggle('filters-open', willOpen);
    if (willOpen) focusFirstPanelControl(app.elements.controlsPanel);
}
