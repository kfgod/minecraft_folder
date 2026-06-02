import { createDefaultState } from './state/default-state.js';
import { getAppElements } from './dom/elements.js';
import { bootstrapApp } from './app/bootstrap.js';
import { createAppDependencies, createAppServices } from './app/composition.js';
import { installAppMethods } from './app/methods.js';
import { restoreInitialAppState } from './app/restore-state.js';
import { syncAppViewToggle } from './app/shell.js';

export class MinecraftUpdatesApp {
    constructor() {
        this.state = createDefaultState();

        this.elements = getAppElements();
        this.ctx = createAppDependencies(this);
        Object.assign(this, createAppServices(this, this.ctx));

        this.yearEntriesCache = null;
        this._releaseFocusTrap = null;
        this._releaseNavFocusTrap = null;
        this.pendingRestore = {
            detailTarget: null,
            compareVersionIds: null,
        };
        /** @type {HTMLElement | null} */
        this._navFocusReturnEl = null;

        restoreInitialAppState(this);
        syncAppViewToggle(this);
    }

}

installAppMethods(MinecraftUpdatesApp.prototype);

document.addEventListener('DOMContentLoaded', () => {
    bootstrapApp(MinecraftUpdatesApp);
});
