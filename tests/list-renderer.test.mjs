import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCardsInChunks, getVersionGapLabel } from '../js/ui/list-renderer.js';
import { CONFIG } from '../js/config.js';
import { SECTION_TYPES } from '../js/section-config.js';
import { findAll, installDomStub, TestElement } from './helpers/dom-stub.mjs';

test('version gap label counts skipped versions and days', () => {
    installDomStub();
    const versionOrder = new Map([
        ['1.21.4', 0],
        ['1.21.3', 1],
        ['1.21.2', 2],
    ]);

    assert.equal(
        getVersionGapLabel(
            { release_version: { java: '1.21.4' }, release_date: '2024-12-03' },
            { release_version: { java: '1.21.2' }, release_date: '2024-10-22' },
            versionOrder
        ),
        '1 version, 42 days between'
    );
    assert.equal(
        getVersionGapLabel(
            { release_version: { java: '1.21.4' }, release_date: '2024-12-03' },
            { release_version: { java: '1.21.2' }, release_date: '2024-10-22' },
            versionOrder,
            { showVersionGapCount: false }
        ),
        '42 days between'
    );
    assert.equal(
        getVersionGapLabel(
            { release_version: { java: '1.21.4' }, release_date: '2024-12-03' },
            { release_version: { java: '1.21.2' } },
            versionOrder
        ),
        '1 version, release date pending between'
    );
});

test('card list renderer inserts version gap dividers only during list filtering', () => {
    installDomStub();
    globalThis.DocumentFragment = class DocumentFragment extends TestElement {
        constructor() {
            super('#document-fragment');
        }
    };

    const allUpdates = [
        createUpdate('1.21.4', '2024-12-03'),
        createUpdate('1.21.3', '2024-10-23'),
        createUpdate('1.21.2', '2024-10-22'),
    ];
    const filteredUpdates = [allUpdates[0], allUpdates[2]];
    const cardRenderer = {
        createCard(item) {
            const card = document.createElement('div');
            card.className = 'update-card';
            card.textContent = item.release_version.java;
            return card;
        },
    };

    const unfilteredContent = document.createElement('div');
    renderCardsInChunks({
        app: createApp({ allUpdates, content: unfilteredContent, query: '' }),
        data: filteredUpdates,
        cardRenderer,
        afterRender: () => {},
    });
    assert.equal(findAll(unfilteredContent, hasVersionGapClass).length, 0);

    const filteredContent = document.createElement('div');
    renderCardsInChunks({
        app: createApp({ allUpdates, content: filteredContent, query: 'copper' }),
        data: filteredUpdates,
        cardRenderer,
        afterRender: () => {},
    });

    const dividers = findAll(filteredContent, hasVersionGapClass);
    assert.equal(dividers.length, 1);
    assert.equal(dividers[0].textContent, '1 version, 42 days between');

    const contentFilteredWithoutSearch = document.createElement('div');
    renderCardsInChunks({
        app: createApp({ allUpdates, content: contentFilteredWithoutSearch, query: '', showItems: false }),
        data: filteredUpdates,
        cardRenderer,
        afterRender: () => {},
    });

    const dayOnlyDividers = findAll(contentFilteredWithoutSearch, hasVersionGapClass);
    assert.equal(dayOnlyDividers.length, 1);
    assert.equal(dayOnlyDividers[0].textContent, '42 days between');
});

function createApp({ allUpdates, content, query, showItems = true }) {
    const visibilityState = Object.fromEntries(
        SECTION_TYPES.map((type) => [`show${toPascalCase(type)}`, true])
    );
    visibilityState.showMobVariants = true;

    return {
        state: {
            allUpdates,
            currentView: CONFIG.VIEWS.VERSIONS,
            ...visibilityState,
            showItems,
        },
        elements: { content },
        getSearchQuery: () => query,
    };
}

function createUpdate(version, releaseDate) {
    return {
        name: version,
        release_version: { java: version },
        release_date: releaseDate,
        added: {},
    };
}

function hasVersionGapClass(node) {
    return node.classList?.contains('version-gap-divider');
}

function toPascalCase(value) {
    return value
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
}
