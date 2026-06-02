/**
 * Card renderer module for creating update cards.
 */
import { DOMManager } from '../../dom-manager.js';
import { SECTION_META, SECTION_TYPES } from '../../section-config.js';
import { APP_MODES } from '../../app-modes.js';
import { DOM_CLASSES } from '../../constants/dom-classes.js';
import { createGridSectionElement, createNotableChangesSectionElement } from './sections.js';
import { createCardHeaderElement, createCardSubtitleElement } from './header.js';
import { getCardViewModel } from './view-model.js';
import { takeElementScreenshot } from '../shared/screenshot-service.js';

export class CardRenderer {
    constructor(ctx) {
        this.ctx = ctx;
    }

    createCard(data) {
        const model = getCardViewModel(data, {
            isYearView: this.ctx.queries.isYearView(),
            activeMode: this.ctx.state.activeMode,
        });
        const card = DOMManager.createElement('div', {
            id: model.id,
            className: `${DOM_CLASSES.UPDATE_CARD} ${model.typeClass}`,
        });

        const subtitle = createCardSubtitleElement(model);
        card.append(
            createScreenshotButton(),
            createCardHeaderElement(model),
            ...(subtitle ? [subtitle] : []),
            ...this.renderContent(data),
        );
        return card;
    }

    renderContent(data) {
        const sections = [];

        SECTION_TYPES.forEach((type) => {
            const meta = SECTION_META[type];
            const stateKey = meta?.stateKey;
            const items = data.added?.[type];
            if (!stateKey || !this.ctx.state[stateKey]) return;
            if (!Array.isArray(items) || items.length === 0) return;

            const label = meta?.label || type;
            sections.push(createGridSectionElement(items, `${label} (${items.length})`, type));
        });

        const showNotable =
            data.notable_changes &&
            (this.ctx.state.activeMode === APP_MODES.DETAIL || this.ctx.state.showNotableChanges);
        if (showNotable) {
            const notableSection = createNotableChangesSectionElement(data.notable_changes);
            if (notableSection) {
                sections.push(notableSection);
            }
        }

        return sections;
    }

    takeScreenshot(cardElement) {
        void takeElementScreenshot(cardElement, {
            filename: `${cardElement.id}.png`,
            backgroundColor: null,
            errorLabel: 'Screenshot failed:',
        });
    }
}

function createScreenshotButton() {
    const button = document.createElement('button');
    button.className = DOM_CLASSES.SCREENSHOT_BUTTON;
    button.setAttribute('aria-label', 'Save as image');

    const icon = document.createElement('img');
    icon.src = 'static/images/icons/save_image.svg';
    icon.alt = '';
    button.appendChild(icon);
    return button;
}
