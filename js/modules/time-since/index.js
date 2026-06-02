/**
 * Time Since module for displaying time elapsed since last content updates.
 */
import { DOMManager } from '../../dom-manager.js';
import { renderStatusMessage } from '../../ui/status-view.js';
import { loadTimeSinceData } from './data.js';
import { renderTimeSinceView } from './view.js';
import { startTimeSinceTimers } from './timers.js';

export class TimeSinceManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.state = {
            timeSinceData: null,
            updateInterval: null,
        };
    }

    async ensureData() {
        if (!this.state.timeSinceData) {
            this.state.timeSinceData = await loadTimeSinceData();
        }
    }

    reset() {
        if (this.state.updateInterval) {
            clearInterval(this.state.updateInterval);
            this.state.updateInterval = null;
        }
        this.state.timeSinceData = null;
    }

    async render() {
        DOMManager.clearContainer(this.ctx.elements.navList);
        renderStatusMessage(this.ctx.elements.content, 'Loading time-since data...');

        try {
            await this.ensureData();
            renderTimeSinceView(this.ctx.elements.content, this.state.timeSinceData);
            this.restartTimerUpdates();
        } catch (error) {
            console.error('Error rendering time-since:', error);
            renderStatusMessage(this.ctx.elements.content, `Error loading time-since data: ${error.message}`, { error: true });
        }
    }

    restartTimerUpdates() {
        if (this.state.updateInterval) {
            clearInterval(this.state.updateInterval);
        }
        this.state.updateInterval = startTimeSinceTimers(this.ctx.elements.content);
    }
}
