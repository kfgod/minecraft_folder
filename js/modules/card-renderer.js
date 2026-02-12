/**
 * Card renderer module for creating update cards and grid sections
 */
import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';
import { DataManager } from '../data-manager.js';
import { DOMManager } from '../dom-manager.js';
import { SECTION_META } from '../section-config.js';

export class CardRenderer {
    constructor(app) {
        this.app = app;
    }

    createCard(data) {
        const card = DOMManager.createElement('div', {
            id: Utils.generateCardId(data),
            className: `update-card ${data.type || ''}`,
        });

        let cardTitle = '';
        let subtitle = '';
        const isYearContext = this.app.isYearView() || data.type === 'year';
        const detailType = isYearContext ? 'year' : 'version';
        const cardId = card.id;

        if (!isYearContext) {
            const version = data.release_version?.java || '';
            const name = data.name || '';
            cardTitle = [version, name].filter(Boolean).join(' — ');
            subtitle = Utils.formatDateForDisplay(data.release_date);
        } else {
            cardTitle = data.name || 'Untitled';
        }

        const titleContent = this.app.state.isDetailMode
            ? cardTitle
            : `<button type="button" class="detail-link" data-detail-type="${detailType}" data-detail-id="${cardId}">${cardTitle}</button>`;
        const titleTag = `<h1>${titleContent}</h1>`;
        const subtitleParts = [];
        if (subtitle) {
            subtitleParts.push(`<span class="card-subtitle-text">${subtitle}</span>`);
        }
        // Add type for version cards (not for year cards)
        if (!isYearContext && data.type) {
            subtitleParts.push(`<span class="card-subtitle-text">${data.type}</span>`);
        }
        if (data.wiki) {
            subtitleParts.push(
                `<a href="${data.wiki}" class="card-subtitle-link" target="_blank" rel="noopener noreferrer">wiki</a>`
            );
        }
        const subtitleRow = subtitleParts.length
            ? `<div class="card-subtitle-row">${subtitleParts.join(
                  '<span class="card-subtitle-separator">|</span>'
              )}</div>`
            : '';
        const closeBtnHtml = this.app.state.isDetailMode
            ? `<button type="button" class="detail-close-btn" aria-label="Close detail">
                    <img src="static/images/icons/arrow.backward.svg" alt="Back">
               </button>`
            : '';
        const headerEndCap = this.app.state.isDetailMode ? '<span class="detail-header-spacer"></span>' : '';
        const headerClass = this.app.state.isDetailMode ? 'card-header-row detail-header' : 'card-header-row';
        const headerTag = `<div class="${headerClass}">${closeBtnHtml}${titleTag}${headerEndCap}</div>`;

        let contentHtml = '';
        DataManager.CONTENT_TYPES.forEach((type) => {
            const meta = SECTION_META[type];
            const stateKey = meta?.stateKey;
            const items = data.added?.[type];
            if (!stateKey || !this.app.state[stateKey]) return;
            if (!Array.isArray(items) || items.length === 0) return;
            const label = meta?.label || type;
            contentHtml += this.createGridSection(items, `${label} (${items.length})`, type);
        });

        const screenshotBtn = `<button class="screenshot-btn" aria-label="Save as image"><img src="static/images/icons/save_image.svg" alt=""></button>`;
        card.innerHTML = `${screenshotBtn}${headerTag}${subtitleRow}${contentHtml}`;
        return card;
    }

    createGridSection(items, title, sectionType) {
        const itemsHtml = items.map((item) => {
            const identifier = item.identifier;

            if (sectionType === 'mobs' || sectionType === 'mob_variants') {
                const name = item.name;

                let tooltipContent = name;
                let healthValue = null;

                if (item.meta && item.meta.health !== undefined) {
                    healthValue = item.meta.health;
                } else if (item.meta && item.meta.parent_mob && item.meta.parent_mob.health !== undefined) {
                    healthValue = item.meta.parent_mob.health;
                }

                if (healthValue !== null) {
                    const healthInHearts = healthValue / 2;
                    tooltipContent = `${name}|health:${healthInHearts}`;
                }
                const mobImagePath = Utils.resolveImagePath(item);
                const mobImageTag = `<img class="mob-render" src="${mobImagePath}" loading="lazy">`;

                let eggTag = '';
                if (sectionType !== 'mob_variants' && item.meta && item.meta.spawn_egg) {
                    const spawnEgg = item.meta.spawn_egg;
                    const spawnEggImagePath = Utils.resolveImagePath(spawnEgg);
                    const eggName = spawnEgg.name;
                    eggTag = `<span class="tooltip-wrapper" data-tooltip="${eggName}"><a href="${spawnEgg.wiki}" target="_blank" rel="noopener noreferrer" class="mob-egg-link"><img class="inv-img mob-egg" src="${spawnEggImagePath}" loading="lazy" onerror="this.parentElement.parentElement.parentElement.remove()"></a></span>`;
                }

                let parentMobTag = '';
                if (item.meta && item.meta.parent_mob) {
                    const parentMob = item.meta.parent_mob;
                    const parentImagePath = Utils.resolveImagePath(parentMob);
                    const parentName = parentMob.name;
                    const parentWiki = parentMob.wiki || '';
                    if (parentWiki) {
                        parentMobTag = `<span class="tooltip-wrapper" data-tooltip="${parentName}"><a href="${parentWiki}" target="_blank" rel="noopener noreferrer"><img class="mob-parent-icon" src="${parentImagePath}" loading="lazy"></a></span>`;
                    } else {
                        parentMobTag = `<span class="tooltip-wrapper" data-tooltip="${parentName}"><img class="mob-parent-icon" src="${parentImagePath}" loading="lazy"></span>`;
                    }
                }

                const cardInner = `
                    <div class="mob-card">
                        ${parentMobTag ? `<div class="mob-card-parent">${parentMobTag}</div>` : ''}
                        <div class="mob-card-image">${mobImageTag}</div>
                        <div class="mob-card-egg">${eggTag}</div>
                    </div>
                `;

                const wikiAttr = item.wiki ? ` data-wiki="${item.wiki}"` : '';
                return `<div class="grid-item mob-cell clickable-card" data-tooltip="${tooltipContent}" data-identifier="${identifier}"${wikiAttr}>${cardInner}</div>`;
            }

            if (sectionType === 'enchantments') {
                const name = item.name;
                const enchIconTag = `<img class="inv-img ench-icon" src="${CONFIG.ENCHANTMENT_ICON}" loading="lazy">`;
                const enchInner = `
                    <div class="ench-cell-inner">${enchIconTag}<span class="ench-name">${name}</span></div>
                `;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${enchInner}</a>`
                    : enchInner;
                return `<div class="grid-item ench-cell" data-tooltip="${name}" data-identifier="${identifier}">${wrapped}</div>`;
            }

            if (sectionType === 'advancements') {
                const name = item.name;
                const iconPath = Utils.resolveImagePath(item.meta?.icon);
                const iconContent = iconPath
                    ? `<img class="advancement-icon" src="${iconPath}" loading="lazy" alt="">`
                    : `<span class="advancement-icon advancement-icon-placeholder"></span>`;
                const inner = `
                    <div class="advancement-cell-content">
                        ${iconContent}
                        <span class="advancement-name">${name}</span>
                    </div>
                `;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${inner}</a>`
                    : inner;
                return `<div class="grid-item advancement-cell" data-tooltip="${name}" data-identifier="${identifier}">${wrapped}</div>`;
            }

            if (sectionType === 'paintings') {
                const name = item.name;
                const paintingImagePath = Utils.resolveImagePath(item);
                const imageTag = `<img class="inv-img" src="${paintingImagePath}" loading="lazy">`;
                const inner = `<div class="painting-cell-image">${imageTag}</div>`;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${inner}</a>`
                    : inner;
                return `<div class="grid-item painting-cell" data-tooltip="${name}" data-identifier="${identifier}">${wrapped}</div>`;
            }

            if (sectionType === 'biomes') {
                const name = item.name;
                const imageSrc = Utils.resolveImagePath(item);
                const imageTag = `<img class="inv-img" src="${imageSrc}" loading="lazy">`;
                const inner = `<div class="biome-cell-image">${imageTag}</div>`;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${inner}</a>`
                    : inner;
                return `<div class="grid-item biome-cell" data-tooltip="${name}" data-identifier="${identifier}">${wrapped}</div>`;
            }

            // Default rendering for blocks/items/effects
            const displayName = item.name;
            const imagePath = Utils.resolveImagePath(item);
            const imageTag = `<img class="inv-img" src="${imagePath}" loading="lazy">`;
            const itemContent = item.wiki
                ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${imageTag}</a>`
                : imageTag;
            return `<div class="grid-item" data-tooltip="${displayName}" data-identifier="${identifier}">${itemContent}</div>`;
        });

        const meta = SECTION_META[sectionType];
        if (meta?.usePlaceholders) {
            const remainder = items.length % CONFIG.COLUMNS_COUNT;
            const placeholdersNeeded = remainder === 0 ? 0 : CONFIG.COLUMNS_COUNT - remainder;
            if (placeholdersNeeded > 0) {
                const placeholder = `<div class="grid-item"></div>`;
                for (let i = 0; i < placeholdersNeeded; i++) {
                    itemsHtml.push(placeholder);
                }
            }
        }

        const gridClass = meta?.gridClass ? `element-grid ${meta.gridClass}` : 'element-grid';
        return `
            <div class="card-section" data-section="${sectionType}">
                <div class="section-title" role="button" tabindex="0" aria-expanded="true">${title}</div>
                <div class="${gridClass}">${itemsHtml.join('')}</div>
            </div>
        `;
    }

    /**
     * Take a screenshot of a card element
     * Uses html2canvas library to capture the card as an image
     * @param {HTMLElement} cardElement - The card element to screenshot
     */
    takeScreenshot(cardElement) {
        const screenshotButton = cardElement.querySelector('.screenshot-btn');
        if (screenshotButton) DOMManager.setVisibility(screenshotButton, false);

        html2canvas(cardElement, {
            backgroundColor: null,
            useCORS: true,
        })
            .then((canvas) => {
                if (screenshotButton) DOMManager.setVisibility(screenshotButton, true);
                const link = DOMManager.createElement('a', {
                    download: `${cardElement.id}.png`,
                    href: canvas.toDataURL('image/png'),
                });
                link.click();
            })
            .catch((error) => {
                if (screenshotButton) DOMManager.setVisibility(screenshotButton, true);
                console.error('Screenshot failed:', error);
            });
    }
}

