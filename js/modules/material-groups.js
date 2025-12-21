/**
 * Material Groups module for displaying tiered material groups in horizontal scrolling tables
 */
import { Utils } from '../utils.js';
import { DOMManager } from '../dom-manager.js';
import { CONFIG } from '../config.js';

export class MaterialGroupsManager {
    constructor(app) {
        this.app = app;
        this.state = {
            materialGroupsData: null,
        };
    }

    async ensureData() {
        if (this.state.materialGroupsData) {
            return;
        }

        try {
            const materialGroupsData = await Utils.fetchJSON(CONFIG.BASE_URL + '/' + 'data/statistics/special.json');
            this.state.materialGroupsData = materialGroupsData;
        } catch (error) {
            console.error('Error loading material groups data:', error);
            throw new Error(`Failed to load material groups data: ${error.message}`);
        }
    }

    reset() {
        this.state.materialGroupsData = null;
    }

    async render() {
        DOMManager.clearContainer(this.app.elements.navList);
        this.app.elements.content.innerHTML = '<p class="empty-state">Loading material groups data...</p>';

        try {
            await this.ensureData();

            const template = this.buildTemplate();
            this.app.elements.content.innerHTML = template;
            
            // Добавляем обработчики событий для заголовков
            this.attachSectionToggleHandlers();
        } catch (error) {
            console.error('Error rendering material groups:', error);
            this.app.elements.content.innerHTML = `<p class="empty-state" style="color: red;">Error loading material groups data: ${error.message}</p>`;
        }
    }

    attachSectionToggleHandlers() {
        const titles = document.querySelectorAll('.material-group-section-title');
        titles.forEach(title => {
            title.addEventListener('click', () => {
                const sectionId = title.getAttribute('data-section-id');
                if (!sectionId) return;

                const section = document.querySelector(`.material-group-section[data-section-id="${sectionId}"]`);
                const container = section?.querySelector('.material-group-table-container');
                
                if (!section || !container) return;

                const isCollapsed = container.classList.contains('collapsed');
                
                if (isCollapsed) {
                    container.classList.remove('collapsed');
                    title.classList.remove('collapsed');
                    this.setSectionCollapsed(sectionId, false);
                } else {
                    container.classList.add('collapsed');
                    title.classList.add('collapsed');
                    this.setSectionCollapsed(sectionId, true);
                }
            });
        });
    }

    isSectionCollapsed(sectionId) {
        const storageKey = `material-group-collapsed-${sectionId}`;
        const stored = localStorage.getItem(storageKey);
        return stored === 'true';
    }

    setSectionCollapsed(sectionId, collapsed) {
        const storageKey = `material-group-collapsed-${sectionId}`;
        if (collapsed) {
            localStorage.setItem(storageKey, 'true');
        } else {
            localStorage.removeItem(storageKey);
        }
    }

    buildTemplate() {
        const content = this.state.materialGroupsData?.content || [];
        // Фильтруем элементы с groups (tiered группы определяются по наличию groups)
        const items = content.filter(item => item.groups && Array.isArray(item.groups) && item.groups.length > 0);

        if (items.length === 0) {
            return '<p class="empty-state">No material groups found.</p>';
        }

        let html = '<div class="material-groups-container">';
        html += '<h1 class="material-groups-title">Material Groups</h1>';

        for (let i = 0; i < items.length; i++) {
            html += this.buildGroup(items[i], i);
        }

        html += '</div>';
        return html;
    }

    buildGroup(item, index) {
        const groups = item.groups || [];
        if (groups.length === 0) {
            return '';
        }

        // Сохраняем порядок элементов из JSON
        // Берем порядок из первой группы, затем добавляем недостающие из других групп
        const itemKeysOrder = [];
        const seenKeys = new Set();
        
        // Сначала добавляем ключи из всех групп в порядке их появления
        for (const group of groups) {
            const items = group.items || {};
            for (const key of Object.keys(items)) {
                if (!seenKeys.has(key)) {
                    itemKeysOrder.push(key);
                    seenKeys.add(key);
                }
            }
        }

        if (itemKeysOrder.length === 0) {
            return '';
        }

        // Создаем уникальный идентификатор для секции
        const sectionId = `material-group-${index}`;
        const sectionName = item.name || `Group ${index + 1}`;
        
        // Проверяем сохраненное состояние
        const isCollapsed = this.isSectionCollapsed(sectionId);

        let html = `<div class="material-group-section" data-section-id="${sectionId}">`;
        html += `<h2 class="material-group-section-title ${isCollapsed ? 'collapsed' : ''}" data-section-id="${sectionId}">${sectionName}</h2>`;

        // Создаем одну таблицу для всех подгрупп
        html += `<div class="material-group-table-container ${isCollapsed ? 'collapsed' : ''}">`;
        html += `<div class="material-group-table-wrapper">`;
        html += `<table class="material-group-table">`;
        html += `<tbody>`;
        
        // Каждая группа - это одна строка в таблице
        for (const group of groups) {
            html += this.buildGroupRow(group, itemKeysOrder);
        }
        
        html += `</tbody>`;
        html += `</table>`;
        html += `</div>`;
        html += `</div>`;
        html += `</div>`;

        return html;
    }

    buildGroupRow(group, allItemKeys) {
        const material = group.material || {};
        const items = group.items || {};

        let html = `<tr>`;
        
        // Колонка с material (sticky)
        html += `<td class="material-group-table-cell material-group-table-cell--material">`;
        html += this.buildElementCell(material);
        html += `</td>`;
        
        // Колонки с items (всегда в одном порядке)
        for (const itemKey of allItemKeys) {
            const item = items[itemKey];
            html += `<td class="material-group-table-cell">`;
            if (item) {
                html += this.buildElementCell(item);
            } else {
                html += '<span class="material-group-empty">—</span>';
            }
            html += `</td>`;
        }
        
        html += `</tr>`;
        return html;
    }

    buildElementCell(element) {
        if (!element || typeof element !== 'object') {
            return '<span class="material-group-empty">—</span>';
        }

        const identifier = element.identifier || element.minecraft_identifier || '';
        const name = element.display_name || element.name || identifier;
        const wiki = element.wiki || '';
        const elementType = element.element_type || 'item';

        // Определяем путь к изображению
        const imagePath = this.resolveImagePath(identifier, elementType);

        let html = '<div class="material-group-element">';
        
        // Изображение (с ссылкой на wiki если есть)
        html += `<div class="material-group-element-image">`;
        if (wiki) {
            html += `<a href="${wiki}" target="_blank" rel="noopener noreferrer">`;
            html += `<img src="${imagePath}" alt="${name}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_IMAGE}'">`;
            html += `</a>`;
        } else {
            html += `<img src="${imagePath}" alt="${name}" loading="lazy" onerror="this.src='${CONFIG.PLACEHOLDER_IMAGE}'">`;
        }
        html += `</div>`;
        
        html += `</div>`;
        return html;
    }

    resolveImagePath(identifier, elementType) {
        if (!identifier) {
            return CONFIG.PLACEHOLDER_IMAGE;
        }
        const imageBasePath = CONFIG.BASE_URL + CONFIG.IMAGE_BASE_PATH;
        // Формируем путь к изображению в формате проекта
        return `${imageBasePath}/${elementType}/${identifier}/latest.png`;
    }
}

