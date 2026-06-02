export function scrollToHashTarget(hash = window.location.hash, delay = 100) {
    if (!hash || hash.length <= 1) return false;

    const target = document.querySelector(hash);
    if (!target) return false;

    setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, delay);
    return true;
}

export function scrollToHashTargetWithRetry(hash = window.location.hash) {
    if (scrollToHashTarget(hash)) return;

    setTimeout(() => {
        scrollToHashTarget(hash);
    }, 500);
}
