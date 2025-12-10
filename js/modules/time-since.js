/**
 * Time Since module for displaying time elapsed since last drop and major updates
 */
import { Utils } from '../utils.js';
import { DOMManager } from '../dom-manager.js';

export class TimeSinceManager {
    constructor(app) {
        this.app = app;
        this.state = {
            timeSinceData: null,
            updateInterval: null,
        };
    }

    async ensureData() {
        if (this.state.timeSinceData) {
            return;
        }

        try {
            const timeSinceData = await Utils.fetchJSON('data/statistics/time_since.json');
            this.state.timeSinceData = timeSinceData;
        } catch (error) {
            console.error('Error loading time-since data:', error);
            throw new Error(`Failed to load time-since data: ${error.message}`);
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
        DOMManager.clearContainer(this.app.elements.navList);
        this.app.elements.content.innerHTML = '<p class="empty-state">Loading time-since data...</p>';

        try {
            await this.ensureData();

            const template = this.buildTemplate();
            this.app.elements.content.innerHTML = template;

            // Start updating timers
            this.startTimerUpdates();
        } catch (error) {
            console.error('Error rendering time-since:', error);
            this.app.elements.content.innerHTML = `<p class="empty-state" style="color: red;">Error loading time-since data: ${error.message}</p>`;
        }
    }

    buildTemplate() {
        const { last_drop, last_major, last_block, last_item, last_mob, last_advancement, last_biome, last_painting, last_effect, last_mob_variant } = this.state.timeSinceData || {};

        return `
            <div class="time-since-container">
                <h1 class="time-since-title">Time Since Last Update</h1>
                <div class="time-since-cards time-since-cards--versions">
                    ${last_drop ? this.buildCard('drop', last_drop) : ''}
                    ${last_major ? this.buildCard('major', last_major) : ''}
                </div>
                <h2 class="time-since-subtitle">Time Since Last Content</h2>
                <div class="time-since-cards time-since-cards--content">
                    ${last_block ? this.buildContentCard('block', last_block) : ''}
                    ${last_item ? this.buildContentCard('item', last_item) : ''}
                    ${last_mob ? this.buildContentCard('mob', last_mob) : ''}
                    ${last_mob_variant ? this.buildContentCard('mob_variant', last_mob_variant) : ''}
                    ${last_advancement ? this.buildContentCard('advancement', last_advancement) : ''}
                    ${last_biome ? this.buildContentCard('biome', last_biome) : ''}
                    ${last_painting ? this.buildContentCard('painting', last_painting) : ''}
                    ${last_effect ? this.buildContentCard('effect', last_effect) : ''}
                </div>
            </div>
        `;
    }

    buildCard(type, versionData) {
        const typeLabel = type === 'drop' ? 'Drop Update' : 'Major Update';
        const typeClass = `time-since-card--${type}`;
        const releaseDate = versionData.release_date;
        const cardId = `time-since-${type}`;
        const wikiUrl = versionData.wiki || '';

        if (wikiUrl) {
            return `
                <a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" class="time-since-card ${typeClass}" id="${cardId}">
                    <div class="time-since-card__header">
                        <h2 class="time-since-card__title">${typeLabel}</h2>
                        ${versionData.name ? `<div class="time-since-card__name">${versionData.name}</div>` : ''}
                        <div class="time-since-card__version">${versionData.version}</div>
                    </div>
                    <div class="time-since-card__date">
                        Released: ${releaseDate}
                    </div>
                    <div class="time-since-card__timer" data-release-date="${versionData.release_date_parsed}">
                        <div class="time-since-timer-text">Loading...</div>
                    </div>
                </a>
            `;
        }

        return `
            <div class="time-since-card ${typeClass}" id="${cardId}">
                <div class="time-since-card__header">
                    <h2 class="time-since-card__title">${typeLabel}</h2>
                    ${versionData.name ? `<div class="time-since-card__name">${versionData.name}</div>` : ''}
                    <div class="time-since-card__version">${versionData.version}</div>
                </div>
                <div class="time-since-card__date">
                    Released: ${releaseDate}
                </div>
                <div class="time-since-card__timer" data-release-date="${versionData.release_date_parsed}">
                    <div class="time-since-timer-text">Loading...</div>
                </div>
            </div>
        `;
    }

    buildContentCard(type, data) {
        const typeLabels = {
            'block': 'Block',
            'item': 'Item',
            'mob': 'Mob',
            'mob_variant': 'Mob Variant',
            'advancement': 'Advancement',
            'biome': 'Biome',
            'painting': 'Painting',
            'effect': 'Effect'
        };
        const typeLabel = typeLabels[type] || type;
        const typeClass = `time-since-card--${type}`;
        const element = data.element || {};
        const versionName = data.version_name || '';
        const version = data.version || '';
        const releaseDate = data.release_date;
        const elementName = element.display_name || element.name || 'Unknown';
        const elementWiki = element.wiki || '';
        const cardId = `time-since-${type}`;

        if (elementWiki) {
            return `
                <a href="${elementWiki}" target="_blank" rel="noopener noreferrer" class="time-since-card ${typeClass}" id="${cardId}">
                    <div class="time-since-card__header">
                        <h2 class="time-since-card__title">${typeLabel}</h2>
                        <div class="time-since-card__name">${elementName}</div>
                        ${versionName ? `<div class="time-since-card__version">${versionName} (${version})</div>` : `<div class="time-since-card__version">${version}</div>`}
                    </div>
                    <div class="time-since-card__date">
                        Released: ${releaseDate}
                    </div>
                    <div class="time-since-card__timer" data-release-date="${data.release_date_parsed}">
                        <div class="time-since-timer-text">Loading...</div>
                    </div>
                </a>
            `;
        }

        return `
            <div class="time-since-card ${typeClass}" id="${cardId}">
                <div class="time-since-card__header">
                    <h2 class="time-since-card__title">${typeLabel}</h2>
                    <div class="time-since-card__name">${elementName}</div>
                    ${versionName ? `<div class="time-since-card__version">${versionName} (${version})</div>` : `<div class="time-since-card__version">${version}</div>`}
                </div>
                <div class="time-since-card__date">
                    Released: ${releaseDate}
                </div>
                <div class="time-since-card__timer" data-release-date="${data.release_date_parsed}">
                    <div class="time-since-timer-text">Loading...</div>
                </div>
            </div>
        `;
    }

    startTimerUpdates() {
        // Update immediately
        this.updateTimers();

        // Update every second
        this.state.updateInterval = setInterval(() => {
            this.updateTimers();
        }, 1000);
    }

    updateTimers() {
        const cards = document.querySelectorAll('.time-since-card__timer');
        
        cards.forEach((card) => {
            const releaseDateStr = card.getAttribute('data-release-date');
            if (!releaseDateStr) return;

            const releaseDate = new Date(releaseDateStr);
            const now = new Date();
            const diff = now - releaseDate;

            if (diff < 0) {
                // Future date
                const textElement = card.querySelector('.time-since-timer-text');
                if (textElement) {
                    textElement.textContent = 'Not yet released';
                }
                return;
            }

            // Calculate time difference
            const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
            const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
            const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            this.updateTimerCard(card, years, months, days, hours, minutes, seconds);
        });
    }

    updateTimerCard(card, years, months, days, hours, minutes, seconds) {
        const parts = [];
        
        // Add years if > 0
        if (years > 0) {
            parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
        }
        
        // Add months if > 0
        if (months > 0) {
            parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
        }
        
        // Add days if > 0
        if (days > 0) {
            parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
        }
        
        // Always add hours, minutes, and seconds
        parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
        parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
        parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
        
        // Format: "X, Y, Z and W"
        let formatted = '';
        if (parts.length === 1) {
            formatted = parts[0];
        } else if (parts.length === 2) {
            formatted = `${parts[0]} and ${parts[1]}`;
        } else {
            const lastPart = parts.pop();
            formatted = `${parts.join(', ')} and ${lastPart}`;
        }
        
        const textElement = card.querySelector('.time-since-timer-text');
        if (textElement) {
            textElement.textContent = formatted;
        }
    }
}

