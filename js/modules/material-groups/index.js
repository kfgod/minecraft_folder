/**
 * Material Groups module for displaying tiered material groups.
 */
import { DOMManager } from '../../dom-manager.js';
import { renderStatusMessage } from '../../ui/status-view.js';
import { loadMaterialGroupsData } from './data.js';
import { renderMaterialGroupsView } from './view.js';
import { attachStickyTableHeaders } from '../../ui/sticky-table-header.js';
import { MATERIAL_GROUPS_CLASSES } from './constants.js';
import { attachMaterialGroupToggleHandlers } from './controller.js';

export class MaterialGroupsManager {
    constructor(ctx) {
        this.ctx = ctx;
        this.state = {
            materialGroupsData: null,
        };
        this.detachStickyHeaders = null;
    }

    async ensureData() {
        if (!this.state.materialGroupsData) {
            this.state.materialGroupsData = await loadMaterialGroupsData();
        }
    }

    reset() {
        this.state.materialGroupsData = null;
        this.detachStickyHeaders?.();
        this.detachStickyHeaders = null;
    }

    async render() {
        DOMManager.clearContainer(this.ctx.elements.navList);
        renderStatusMessage(this.ctx.elements.content, 'Loading material groups data...');

        try {
            await this.ensureData();
            renderMaterialGroupsView(this.ctx.elements.content, this.state.materialGroupsData, {
                isSectionCollapsed: (sectionId) => this.isSectionCollapsed(sectionId),
            });
            attachMaterialGroupToggleHandlers(this.ctx.elements.content, {
                setSectionCollapsed: (sectionId, collapsed) => this.setSectionCollapsed(sectionId, collapsed),
            });
            this.detachStickyHeaders?.();
            this.detachStickyHeaders = attachStickyTableHeaders(this.ctx.elements.content, `.${MATERIAL_GROUPS_CLASSES.TABLE_WRAPPER}`);
        } catch (error) {
            console.error('Error rendering material groups:', error);
            renderStatusMessage(this.ctx.elements.content, `Error loading material groups data: ${error.message}`, { error: true });
        }
    }

    isSectionCollapsed(sectionId) {
        return localStorage.getItem(this.getStorageKey(sectionId)) === 'true';
    }

    setSectionCollapsed(sectionId, collapsed) {
        const storageKey = this.getStorageKey(sectionId);
        if (collapsed) {
            localStorage.setItem(storageKey, 'true');
        } else {
            localStorage.removeItem(storageKey);
        }
    }

    getStorageKey(sectionId) {
        return `material-group-collapsed-${sectionId}`;
    }
}
