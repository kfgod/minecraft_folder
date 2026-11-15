/**
 * Keeps a table header visible during page scroll. Tables that scroll horizontally
 * make CSS sticky stick to their own box, so the header is shifted from here through
 * the --sticky-header-offset property of the scrolling wrapper.
 */

/** How far the header must shift down to stay visible while its table passes under the top edge. */
export function getHeaderOffset({ tableTop, tableHeight, headerHeight, stickyTop = 0 }) {
    return Math.max(0, Math.min(stickyTop - tableTop, tableHeight - headerHeight));
}

/**
 * @param {HTMLElement} root
 * @param {string} wrapperSelector - scrolling box around each table
 * @returns {() => void} cleanup
 */
export function attachStickyTableHeaders(root, wrapperSelector) {
    let frame = null;
    const update = () => {
        frame = null;
        const topBar = document.querySelector('.mobile-top-bar');
        // The mobile search bar may scroll away, then its bottom edge is above the viewport.
        const stickyTop = Math.max(0, topBar?.getBoundingClientRect().bottom || 0);
        root.querySelectorAll(wrapperSelector).forEach((wrapper) => {
            const table = wrapper.querySelector('table');
            const header = table?.querySelector('thead');
            if (!header) return;
            const { top, height } = table.getBoundingClientRect();
            const offset = getHeaderOffset({
                tableTop: top,
                tableHeight: height,
                headerHeight: header.getBoundingClientRect().height,
                stickyTop,
            });
            wrapper.style.setProperty('--sticky-header-offset', `${offset}px`);
        });
    };
    const schedule = () => {
        if (frame === null) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Collapsing a section moves the tables below it without a scroll event.
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(root);
    update();
    return () => {
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        resizeObserver.disconnect();
        if (frame !== null) cancelAnimationFrame(frame);
    };
}
