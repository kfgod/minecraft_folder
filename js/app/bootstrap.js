import { refreshUrlSessionFromLocation } from '../url-state.js';

export function bootstrapApp(AppClass) {
    const app = new AppClass();
    refreshUrlSessionFromLocation();

    app.init().then(() => {
        app.updateURL(false);
        app.handleHashScrollWithRetry();
    });

    window.addEventListener('popstate', () => {
        void app.onPopStateNavigation();
    });

    return app;
}
