/**
 * @param {HTMLElement} container
 * @param {string} message
 * @param {() => void | Promise<void>} onRetry
 */
export function showLoadError(container, message, onRetry) {
    if (!container) return;

    const panel = document.createElement('div');
    panel.className = 'app-error-panel';
    panel.setAttribute('role', 'alert');

    const text = document.createElement('p');
    text.className = 'app-error-text';
    text.textContent = message;

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'secondary-button app-error-retry';
    retry.id = 'app-error-retry';
    retry.textContent = 'Retry';
    retry.addEventListener('click', () => {
        onRetry();
    });

    panel.append(text, retry);
    container.replaceChildren(panel);
}

const PARTIAL_WARNING_ID = 'app-partial-load-warning';

export function clearPartialLoadWarning() {
    document.getElementById(PARTIAL_WARNING_ID)?.remove();
}

/**
 * Non-blocking banner shown above the content when some data files failed.
 * Lives outside the content container so re-renders do not remove it.
 * @param {HTMLElement} content
 * @param {Array<{ file: string, error: string }>} failedFiles
 * @param {() => void | Promise<void>} onRetry
 */
export function showPartialLoadWarning(content, failedFiles, onRetry) {
    if (!content?.parentNode) return;
    clearPartialLoadWarning();

    const panel = document.createElement('div');
    panel.id = PARTIAL_WARNING_ID;
    panel.className = 'app-error-panel app-warning-panel';
    panel.setAttribute('role', 'status');

    const text = document.createElement('p');
    text.className = 'app-error-text';
    const names = failedFiles.map(({ file }) => file.split('/').pop().replace(/\.json$/, ''));
    text.textContent = `Some versions could not be loaded and are not shown: ${names.join(', ')}.`;

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'secondary-button app-error-retry';
    retry.textContent = 'Retry';
    retry.addEventListener('click', () => {
        clearPartialLoadWarning();
        onRetry();
    });

    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.className = 'secondary-button';
    dismiss.textContent = 'Dismiss';
    dismiss.addEventListener('click', clearPartialLoadWarning);

    panel.append(text, retry, dismiss);
    content.parentNode.insertBefore(panel, content);
}
