/**
 * Keep keyboard focus inside a panel when it is open (a11y).
 */

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @param {HTMLElement} root - container to trap focus within
 * @param {() => boolean} isActive - whether trap should intercept Tab
 * @returns {() => void} cleanup
 */
export function attachFocusTrap(root, isActive) {
    if (!root) {
        return () => {};
    }
    const onKeydown = (e) => {
        if (e.key !== 'Tab' || !isActive() || !root.isConnected) return;

        const focusables = Array.from(root.querySelectorAll(FOCUSABLE)).filter(
            (el) => el.offsetParent !== null || el === document.activeElement
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
            if (active === first || !root.contains(active)) {
                e.preventDefault();
                last.focus();
            }
        } else if (active === last || !root.contains(active)) {
            e.preventDefault();
            first.focus();
        }
    };

    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
}
