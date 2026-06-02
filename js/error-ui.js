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
