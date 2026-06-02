import { DOMManager } from '../../dom-manager.js';
import { ensureHtml2Canvas } from '../../cdn-loaders.js';
import { DOM_SELECTORS } from '../../constants/dom-classes.js';

export function takeElementScreenshot(element, {
    filename,
    backgroundColor = null,
    scale,
    hiddenSelector = DOM_SELECTORS.SCREENSHOT_BUTTON,
    errorLabel = 'Screenshot failed',
} = {}) {
    if (!element) return Promise.resolve();

    const hiddenElements = Array.from(element.querySelectorAll(hiddenSelector));
    hiddenElements.forEach((el) => DOMManager.setVisibility(el, false));

    return ensureHtml2Canvas()
        .then((html2canvas) =>
            html2canvas(element, {
                backgroundColor,
                useCORS: true,
                ...(scale ? { scale } : {}),
            })
        )
        .then((canvas) => {
            hiddenElements.forEach((el) => DOMManager.setVisibility(el, true));
            const link = DOMManager.createElement('a', {
                download: filename || `${element.id || 'screenshot'}.png`,
                href: canvas.toDataURL('image/png'),
            });
            link.click();
        })
        .catch((error) => {
            hiddenElements.forEach((el) => DOMManager.setVisibility(el, true));
            console.error(errorLabel, error);
        });
}

export function sanitizeScreenshotFilename(value) {
    return String(value || 'screenshot').replace(/[^a-z0-9_.-]/gi, '_');
}

export function buildCompareScreenshotFilename(version1, version2) {
    const name1 = version1?.release_version?.java || version1?.name || 'v1';
    const name2 = version2?.release_version?.java || version2?.name || 'v2';
    return sanitizeScreenshotFilename(`compare_${name1}_vs_${name2}.png`);
}
