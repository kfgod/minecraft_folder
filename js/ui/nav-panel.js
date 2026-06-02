import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';
import { focusFirstPanelControl } from './panels.js';

export function isNavOpen(app) {
    return (
        DOMManager.hasClass(app.elements.body, 'nav-open') ||
        DOMManager.hasClass(app.elements.navPanel, CONFIG.CSS_CLASSES.VISIBLE)
    );
}

export function openNav(app) {
    const active = document.activeElement;
    if (
        active instanceof HTMLElement &&
        app.elements.navPanel &&
        !app.elements.navPanel.contains(active)
    ) {
        app._navFocusReturnEl = active;
    } else {
        app._navFocusReturnEl = null;
    }

    if (DOMManager.hasClass(app.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT)) {
        DOMManager.addClass(app.elements.body, 'nav-open');
        if (app.elements.navOverlay) {
            DOMManager.addClass(app.elements.navOverlay, CONFIG.CSS_CLASSES.VISIBLE);
        }
    } else {
        DOMManager.addClass(app.elements.navPanel, CONFIG.CSS_CLASSES.VISIBLE);
        DOMManager.addClass(app.elements.overlay, CONFIG.CSS_CLASSES.VISIBLE);
        DOMManager.setAttribute(app.elements.navToggleBtn, 'aria-expanded', 'true');
    }

    focusFirstPanelControl(app.elements.navPanel);
}

export function closeNav(app) {
    const wasOpen = isNavOpen(app);

    DOMManager.removeClass(app.elements.body, 'nav-open');
    if (app.elements.navOverlay) {
        DOMManager.removeClass(app.elements.navOverlay, CONFIG.CSS_CLASSES.VISIBLE);
    }
    DOMManager.removeClass(app.elements.navPanel, CONFIG.CSS_CLASSES.VISIBLE);
    DOMManager.removeClass(app.elements.overlay, CONFIG.CSS_CLASSES.VISIBLE);
    DOMManager.setAttribute(app.elements.navToggleBtn, 'aria-expanded', 'false');

    if (!wasOpen) {
        app._navFocusReturnEl = null;
        return;
    }

    const returnTarget = app._navFocusReturnEl;
    app._navFocusReturnEl = null;
    const fallback =
        DOMManager.hasClass(app.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT)
            ? app.elements.navFab
            : app.elements.navToggleBtn;

    if (returnTarget && returnTarget.isConnected) {
        returnTarget.focus();
    } else {
        fallback?.focus();
    }
}
