import { showTooltip, hideTooltip } from '../ui/tooltip.js';

export function attachTooltipController(app) {
    let currentTooltipItem = null;

    const clearTooltip = () => {
        currentTooltipItem = null;
        hideTooltip(app.elements.tooltip);
    };

    // A tap or click acts on the cell (and may replace it, so pointerout never fires).
    app.elements.content.addEventListener('click', clearTooltip, true);

    app.elements.content.addEventListener('pointerover', (e) => {
        // Touch has no hover: the tap itself must not leave a tooltip behind.
        if (e.pointerType === 'touch') return;
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

    // Keyboard users get the same name/health tooltip on focus; focus from a tap or click does not count.
    app.elements.content.addEventListener('focusin', (e) => {
        if (!e.target.matches?.(':focus-visible')) return;
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
