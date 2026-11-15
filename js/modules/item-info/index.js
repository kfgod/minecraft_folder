/**
 * Item page: recipes, "used in" and tags of a block or item, shown in place of
 * the update list (mode=item&item=<id>), so browser Back/Forward move between pages.
 */
import { loadItemIndex, loadItemInfo, stripNamespace } from './data.js';
import { advanceSlots, renderItemPage, renderItemPageLoading } from './view.js';

export { hasItemInfo, loadItemIndex } from './data.js';

const CYCLE_INTERVAL_MS = 1200;
const DEFAULT_TITLE = document.title;

export class ItemPageManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.timer = null;
        this.requestId = 0;
    }

    reset() {
        this.requestId += 1;
        clearInterval(this.timer);
        this.timer = null;
        document.title = DEFAULT_TITLE;
    }

    async render() {
        this.reset();
        const requestId = this.requestId;
        const { content, navList } = this.ctx.elements;
        const id = stripNamespace(this.ctx.state.itemTarget);
        navList?.replaceChildren();
        renderItemPageLoading(content, id);
        try {
            const [info, index] = await Promise.all([loadItemInfo(id), loadItemIndex()]);
            if (requestId !== this.requestId) return;
            renderItemPage(content, info, index, { canGoBack: (window.history.state?.itemDepth || 0) >= 1 });
            document.title = `${info.name || id} — Minecraft Updates Explorer`;
            if (content.querySelector('.recipe-slot[data-cycle]')) {
                this.timer = setInterval(() => advanceSlots(content), CYCLE_INTERVAL_MS);
            }
        } catch (error) {
            if (requestId !== this.requestId) return;
            renderItemPageLoading(content, id, `No recipes or tags for minecraft:${id} (${error.message}).`);
        }
    }
}
