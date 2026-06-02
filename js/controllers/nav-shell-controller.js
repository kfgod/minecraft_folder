/**
 * Nav panel, overlays, content clicks, tooltips, resize, filters FAB.
 */
import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';
import { APP_MODES } from '../app-modes.js';
import { attachFocusTrap } from '../focus-trap.js';

/**
 * @param {*} app - MinecraftUpdatesApp
 */
export function attachNavShellController(app) {
    if (app.elements.filtersFab) {
        app.elements.filtersFab.addEventListener('click', () => {
            app.toggleFiltersPanel();
        });
    }
    if (app.elements.filtersOverlay) {
        app.elements.filtersOverlay.addEventListener('click', () => {
            app.toggleFiltersPanel(false);
        });
    }
    if (app.elements.navFab) {
        app.elements.navFab.addEventListener('click', () => {
            app.toggleNav();
        });
    }
    if (app.elements.navOverlay) {
        app.elements.navOverlay.addEventListener('click', () => {
            app.closeNav();
        });
    }

    if (app.elements.navToggleBtn) {
        app.elements.navToggleBtn.addEventListener('click', () => app.toggleNav());
    }
    if (app.elements.overlay) {
        app.elements.overlay.addEventListener('click', () => app.closeNav());
    }

    app.elements.navList.addEventListener('click', (e) => {
        const isMobile = DOMManager.hasClass(app.elements.body, CONFIG.CSS_CLASSES.MOBILE_LAYOUT);

        if (e.target.closest('a') && isMobile) {
            app.closeNav();
            return;
        }

        const statItem = e.target.closest('.nav-stat-item');
        if (statItem && app.state.activeMode === APP_MODES.DETAIL) {
            e.preventDefault();
            const sectionType = statItem.getAttribute('data-section-type');
            if (sectionType) {
                app.navigationManager.scrollToSection(sectionType);
            }
            if (isMobile) app.closeNav();
            return;
        }

        const versionNavBtn = e.target.closest('.nav-version-nav-btn');
        if (versionNavBtn && app.state.activeMode === APP_MODES.DETAIL) {
            e.preventDefault();
            const detailType = versionNavBtn.getAttribute('data-detail-type');
            const detailId = versionNavBtn.getAttribute('data-detail-id');
            if (detailType && detailId) {
                app.detailViewManager.open(detailType, detailId);
            }
            if (isMobile) app.closeNav();
        }
    });

    if (app.elements.navSearch) {
        app.elements.navSearch.addEventListener('input', () => {
            app.navigationManager.applyNavFilter(app.elements.navSearch.value);
        });
    }

    if (app.elements.navJump) {
        app.elements.navJump.addEventListener('change', (e) => {
            const targetId = e.target.value;
            if (!targetId) return;
            const link = app.elements.navList.querySelector(`a[href="#${targetId}"]`);
            if (link) {
                link.click();
            } else {
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
            e.target.value = '';
        });
    }

    const updateActive = Utils.debounce(() => app.updateActiveNavLink(), 80);
    window.addEventListener('scroll', updateActive, { passive: true });

    const resizeDebounce = Utils.debounce(() => app.updateLayout(), CONFIG.RESIZE_DEBOUNCE_DELAY);
    window.addEventListener('resize', resizeDebounce);

    if (app._releaseFocusTrap) {
        app._releaseFocusTrap();
    }
    app._releaseFocusTrap = attachFocusTrap(app.elements.controlsPanel, () =>
        DOMManager.hasClass(app.elements.body, 'filters-open')
    );

    if (app._releaseNavFocusTrap) {
        app._releaseNavFocusTrap();
    }
    app._releaseNavFocusTrap = attachFocusTrap(app.elements.navPanel, () => app.isNavOpen());
}
