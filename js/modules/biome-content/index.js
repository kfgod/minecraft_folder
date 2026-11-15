import { APP_MODES } from '../../app-modes.js';
import { renderStatusMessage } from '../../ui/status-view.js';
import { loadBiomeContentData } from './data.js';
import { renderBiomeContentView } from './view.js';

export class BiomeContentManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.data = null;
        this.generation = 0;
    }

    reset() {
        this.generation += 1;
    }

    async render() {
        const generation = ++this.generation;
        const isCurrent = () => generation === this.generation && this.ctx.state.activeMode === APP_MODES.BIOME_CONTENT;
        this.ctx.elements.navList.replaceChildren();
        renderStatusMessage(this.ctx.elements.content, 'Loading biome content...');
        try {
            this.data = this.data || await loadBiomeContentData();
            if (isCurrent()) renderBiomeContentView(this.ctx.elements.content, this.data);
        } catch (error) {
            if (isCurrent()) {
                renderStatusMessage(this.ctx.elements.content, `Error loading biome content: ${error.message}`, { error: true });
            }
        }
    }
}
