/**
 * Card renderer module for creating update cards and grid sections
 */
import { Utils } from '../utils.js';
import { CONFIG } from '../config.js';
import { DOMManager } from '../dom-manager.js';

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
        const isYearContext = this.app.state.currentView === CONFIG.VIEWS.YEARS || data.type === 'year';
        const detailType = isYearContext ? 'year' : 'version';
        const cardId = card.id;

        if (!isYearContext) {
            const version = data.release_version?.java || '';
            const name = data.name || '';
            cardTitle = [version, name].filter(Boolean).join(' — ');
            subtitle = Utils.formatDateForDisplay(data.release_date);
        } else {
            cardTitle = data.name || data.display_name || 'Untitled';
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
        if (this.app.state.showBlocks && Array.isArray(data.added?.blocks) && data.added.blocks.length > 0) {
            contentHtml += this.createGridSection(data.added.blocks, `Blocks (${data.added.blocks.length})`, 'blocks');
        }
        if (this.app.state.showItems && Array.isArray(data.added?.items) && data.added.items.length > 0) {
            contentHtml += this.createGridSection(data.added.items, `Items (${data.added.items.length})`, 'items');
        }
        if (this.app.state.showMobs && Array.isArray(data.added?.mobs) && data.added.mobs.length > 0) {
            contentHtml += this.createGridSection(data.added.mobs, `Mobs (${data.added.mobs.length})`, 'mobs');
        }
        if (
            this.app.state.showMobVariants &&
            Array.isArray(data.added?.mob_variants) &&
            data.added.mob_variants.length > 0
        ) {
            contentHtml += this.createGridSection(
                data.added.mob_variants,
                `Mob Variants (${data.added.mob_variants.length})`,
                'mob_variants'
            );
        }
        if (this.app.state.showEffects && Array.isArray(data.added?.effects) && data.added.effects.length > 0) {
            contentHtml += this.createGridSection(
                data.added.effects,
                `Effects (${data.added.effects.length})`,
                'effects'
            );
        }
        if (
            this.app.state.showEnchantments &&
            Array.isArray(data.added?.enchantments) &&
            data.added.enchantments.length > 0
        ) {
            contentHtml += this.createGridSection(
                data.added.enchantments,
                `Enchantments (${data.added.enchantments.length})`,
                'enchantments'
            );
        }
        if (
            this.app.state.showAdvancements &&
            Array.isArray(data.added?.advancements) &&
            data.added.advancements.length > 0
        ) {
            contentHtml += this.createGridSection(
                data.added.advancements,
                `Advancements (${data.added.advancements.length})`,
                'advancements'
            );
        }
        if (this.app.state.showPaintings && Array.isArray(data.added?.paintings) && data.added.paintings.length > 0) {
            contentHtml += this.createGridSection(
                data.added.paintings,
                `Paintings (${data.added.paintings.length})`,
                'paintings'
            );
        }
        if (this.app.state.showBiomes && Array.isArray(data.added?.biomes) && data.added.biomes.length > 0) {
            contentHtml += this.createGridSection(data.added.biomes, `Biomes (${data.added.biomes.length})`, 'biomes');
        }

        const screenshotBtn = `<button class="screenshot-btn" aria-label="Save as image"><img src="static/images/icons/save_image.svg" alt=""></button>`;
        card.innerHTML = `${screenshotBtn}${headerTag}${subtitleRow}${contentHtml}`;
        return card;
    }

    createGridSection(items, title, sectionType) {
        const resolveIconPath = (itemValue) => {
            if (!itemValue) return null;
            const imageBasePath = CONFIG.BASE_URL + CONFIG.IMAGE_BASE_PATH;

            if (typeof itemValue === 'string') {
                const trimmed = itemValue.trim().replace(/^\/+/, '');
                if (!trimmed) {
                    return null;
                }
                if (trimmed.includes('/')) {
                    return `${imageBasePath}/${trimmed}/latest.png`;
                }
                return `${imageBasePath}/item/${trimmed}/latest.png`;
            }

            const type = itemValue.element_type || 'item';
            const identifier = itemValue.identifier || itemValue.minecraft_identifier;

            if (identifier) {
                return `${imageBasePath}/${type}/${identifier}/latest.png`;
            }
            return null;
        };

        const itemsHtml = items.map((item) => {
            const identifier = item.identifier || item.minecraft_identifier;

            if (sectionType === 'mobs' || sectionType === 'mob_variants') {
                const name = item.display_name || item.name || identifier;
                const mobType = item.element_type || 'mob';

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
                const mobImagePath = resolveIconPath(item);
                const mobImageTag = `<img class="mob-render" src="${mobImagePath}" loading="lazy">`;

                let eggTag = '';
                if (sectionType !== 'mob_variants' && item.meta && item.meta.spawn_egg) {
                    const spawnEgg = item.meta.spawn_egg;
                    const spawnEggImagePath = resolveIconPath(spawnEgg);
                    const eggName = spawnEgg.display_name || spawnEgg.name || 'Spawn Egg';
                    eggTag = `<span class="tooltip-wrapper" data-tooltip="${eggName}"><a href="${spawnEgg.wiki}" target="_blank" rel="noopener noreferrer" class="mob-egg-link"><img class="inv-img mob-egg" src="${spawnEggImagePath}" loading="lazy" onerror="this.parentElement.parentElement.parentElement.remove()"></a></span>`;
                }

                let parentMobTag = '';
                if (item.meta && item.meta.parent_mob) {
                    const parentMob = item.meta.parent_mob;
                    const parentImagePath = resolveIconPath(parentMob);
                    const parentName = parentMob.display_name || parentMob.name;
                    const parentWiki = parentMob.wiki || '';
                    if (parentWiki) {
                        parentMobTag = `<span class="tooltip-wrapper" data-tooltip="${parentName}"><a href="${parentWiki}" target="_blank" rel="noopener noreferrer"><img class="mob-parent-icon" src="${parentImagePath}" loading="lazy"></a></span>`;
                    } else {
                        parentMobTag = `<span class="tooltip-wrapper" data-tooltip="${parentName}"><img class="mob-parent-icon" src="${parentImagePath}" loading="lazy"></span>`;
                    }
                }

                const cardInner = `
                    <div class="mob-card">
                        ${parentMobTag ? `<div class="mob-card__parent">${parentMobTag}</div>` : ''}
                        <div class="mob-card__image">${mobImageTag}</div>
                        <div class="mob-card__egg">${eggTag}</div>
                    </div>
                `;

                const wikiAttr = item.wiki ? ` data-wiki="${item.wiki}"` : '';
                return `<div class="grid-item mob-cell clickable-card" data-tooltip="${tooltipContent}" data-identifier="${identifier}" data-element-type="${mobType}"${wikiAttr}>${cardInner}</div>`;
            }

            if (sectionType === 'enchantments') {
                const name = item.display_name || item.name || identifier;
                const enchIconTag = `<img class="inv-img ench-icon" src="${CONFIG.ENCHANTMENT_ICON}" loading="lazy">`;
                const enchInner = `
                    <div class="ench-cell-inner">${enchIconTag}<span class="ench-name">${name}</span></div>
                `;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${enchInner}</a>`
                    : enchInner;
                return `<div class="grid-item ench-cell" data-tooltip="${name}" data-identifier="${identifier}" data-element-type="enchantment">${wrapped}</div>`;
            }

            if (sectionType === 'advancements') {
                const name = item.display_name || item.name || identifier;
                const iconPath = resolveIconPath(item.meta?.icon);
                const iconContent = iconPath
                    ? `<img class="advancement-icon" src="${iconPath}" loading="lazy" alt="">`
                    : `<span class="advancement-icon advancement-icon--placeholder"></span>`;
                const inner = `
                    <div class="advancement-cell__content">
                        ${iconContent}
                        <span class="advancement-name">${name}</span>
                    </div>
                `;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${inner}</a>`
                    : inner;
                return `<div class="grid-item advancement-cell" data-tooltip="${name}" data-identifier="${identifier}" data-element-type="advancement">${wrapped}</div>`;
            }

            if (sectionType === 'paintings') {
                const name = item.display_name || item.name || identifier;
                const paintingImagePath = resolveIconPath(item);
                const imageTag = `<img class="inv-img" src="${paintingImagePath}" loading="lazy">`;
                const inner = `<div class="painting-cell__image">${imageTag}</div>`;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${inner}</a>`
                    : inner;
                return `<div class="grid-item painting-cell" data-tooltip="${name}" data-identifier="${identifier}" data-element-type="painting">${wrapped}</div>`;
            }

            if (sectionType === 'biomes') {
                const name = item.display_name || item.name || identifier;
                const imageSrc = resolveIconPath(item);
                const imageTag = `<img class="inv-img" src="${imageSrc}" loading="lazy">`;
                const inner = `<div class="biome-cell__image">${imageTag}</div>`;
                const wrapped = item.wiki
                    ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${inner}</a>`
                    : inner;
                return `<div class="grid-item biome-cell" data-tooltip="${name}" data-identifier="${identifier}" data-element-type="biome">${wrapped}</div>`;
            }

            // Default rendering for blocks/items/effects
            const elementType = item.element_type || 'item';
            const displayName = item.display_name || item.name;
            const imagePath = resolveIconPath(item);
            const imageTag = `<img class="inv-img" src="${imagePath}" loading="lazy">`;
            const itemContent = item.wiki
                ? `<a href="${item.wiki}" target="_blank" rel="noopener noreferrer">${imageTag}</a>`
                : imageTag;
            return `<div class="grid-item" data-tooltip="${displayName}" data-identifier="${identifier}" data-element-type="${elementType}">${itemContent}</div>`;
        });

        if (
            sectionType !== 'effects' &&
            sectionType !== 'mobs' &&
            sectionType !== 'mob_variants' &&
            sectionType !== 'enchantments' &&
            sectionType !== 'advancements' &&
            sectionType !== 'paintings' &&
            sectionType !== 'biomes'
        ) {
            const remainder = items.length % CONFIG.COLUMNS_COUNT;
            const placeholdersNeeded = remainder === 0 ? 0 : CONFIG.COLUMNS_COUNT - remainder;
            if (placeholdersNeeded > 0) {
                const placeholderContent = `<img class="inv-img" src="${CONFIG.PLACEHOLDER_IMAGE}" alt="">`;
                const placeholder = `<div class="grid-item">${placeholderContent}</div>`;
                for (let i = 0; i < placeholdersNeeded; i++) {
                    itemsHtml.push(placeholder);
                }
            }
        }

        let gridClass = 'element-grid';
        if (sectionType === 'effects') {
            gridClass = 'element-grid effects-grid';
        } else if (sectionType === 'mobs' || sectionType === 'mob_variants') {
            gridClass = 'element-grid mobs-grid';
        } else if (sectionType === 'enchantments') {
            gridClass = 'element-grid enchantments-grid';
        } else if (sectionType === 'advancements') {
            gridClass = 'element-grid advancements-grid';
        } else if (sectionType === 'paintings') {
            gridClass = 'element-grid paintings-grid';
        } else if (sectionType === 'biomes') {
            gridClass = 'element-grid biomes-grid';
        }
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
        }).then((canvas) => {
            if (screenshotButton) DOMManager.setVisibility(screenshotButton, true);
            const link = DOMManager.createElement('a', {
                download: `${cardElement.id}.png`,
                href: canvas.toDataURL('image/png'),
            });
            link.click();
        });
    }
}

