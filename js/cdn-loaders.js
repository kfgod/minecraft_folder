/**
 * Lazy-load third-party scripts (pinned versions) for GitHub Pages static hosting.
 */

const CHART_URL = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
const CHART_INTEGRITY =
    'sha384-9nhczxUqK87bcKHh20fSQcTGD4qq5GhayNYSYWqwBkINBhOfQLg/P5HG5lF1urn4';
const HTML2CANVAS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const HTML2CANVAS_INTEGRITY =
    'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H';

let chartPromise = null;
let html2canvasPromise = null;

function injectScript(src, integrity = null) {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[data-cdn-src="${src}"]`);
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)));
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.dataset.cdnSrc = src;
        if (integrity) {
            s.integrity = integrity;
            s.crossOrigin = 'anonymous';
        }
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });
}

/**
 * @returns {Promise<typeof Chart | undefined>}
 */
export function ensureChartJs() {
    if (typeof globalThis.Chart !== 'undefined') {
        return Promise.resolve(globalThis.Chart);
    }
    if (!chartPromise) {
        chartPromise = injectScript(CHART_URL, CHART_INTEGRITY).then(() => globalThis.Chart);
    }
    return chartPromise;
}

/**
 * @returns {Promise<typeof html2canvas>}
 */
export function ensureHtml2Canvas() {
    if (typeof globalThis.html2canvas !== 'undefined') {
        return Promise.resolve(globalThis.html2canvas);
    }
    if (!html2canvasPromise) {
        html2canvasPromise = injectScript(HTML2CANVAS_URL, HTML2CANVAS_INTEGRITY).then(() =>
            globalThis.html2canvas
        );
    }
    return html2canvasPromise;
}
