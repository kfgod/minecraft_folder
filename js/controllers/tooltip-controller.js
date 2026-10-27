import { showTooltip, hideTooltip } from '../ui/tooltip.js';

export function attachTooltipController(app) {
    let currentTooltipItem = null;

    app.elements.content.addEventListener('pointerover', (e) => {
        const tooltipItem = e.target.closest('.grid-item, .tooltip-wrapper');
        if (tooltipItem && tooltipItem !== currentTooltipItem) {
            const tooltipText = tooltipItem.dataset.tooltip;
            if (tooltipText) {
                currentTooltipItem = tooltipItem;
                showTooltip(app.elements.tooltip, tooltipItem, tooltipText);
            }
        }
    });

    app.elements.content.addEventListener('pointerout', (e) => {
        const tooltipItem = e.target.closest('.grid-item, .tooltip-wrapper');
        if (tooltipItem && !tooltipItem.contains(e.relatedTarget)) {
            if (currentTooltipItem === tooltipItem) {
                currentTooltipItem = null;
                hideTooltip(app.elements.tooltip);
            }
        }
    });

    // Keyboard users get the same name/health tooltip on focus.
    app.elements.content.addEventListener('focusin', (e) => {
        const tooltipItem = e.target.closest('.grid-item, .tooltip-wrapper');
        const tooltipText = tooltipItem?.dataset.tooltip;
        if (!tooltipText) return;
        currentTooltipItem = tooltipItem;
        showTooltip(app.elements.tooltip, tooltipItem, tooltipText);
    });

    app.elements.content.addEventListener('focusout', (e) => {
        if (!currentTooltipItem || currentTooltipItem.contains(e.relatedTarget)) return;
        currentTooltipItem = null;
        hideTooltip(app.elements.tooltip);
    });

    window.addEventListener(
        'scroll',
        () => {
            if (!currentTooltipItem) return;
            const tooltipText = currentTooltipItem.dataset.tooltip;
            if (tooltipText) {
                showTooltip(app.elements.tooltip, currentTooltipItem, tooltipText);
            }
        },
        { passive: true }
    );

    window.addEventListener(
        'touchmove',
        () => {
            if (currentTooltipItem) {
                currentTooltipItem = null;
                hideTooltip(app.elements.tooltip);
            }
        },
        { passive: true }
    );
}
