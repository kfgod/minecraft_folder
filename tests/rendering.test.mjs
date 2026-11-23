import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_MODES } from '../js/app-modes.js';
import { renderActiveModeView, renderCurrentView } from '../js/app/rendering.js';
import { findByClass, flattenText, installDomStub } from './helpers/dom-stub.mjs';

const FEATURE_MODES = [
    APP_MODES.STATS,
    APP_MODES.TIME_SINCE,
    APP_MODES.ITEM,
    APP_MODES.BIOME_CONTENT,
    APP_MODES.MATERIAL_GROUPS,
    APP_MODES.COMPARE,
];

/** The list page is on screen; the feature module of `mode` is loaded or still loading. */
function createApp(mode, { manager = null } = {}) {
    installDomStub();
    const content = document.createElement('div');
    const card = document.createElement('div');
    card.className = 'update-card';
    content.appendChild(card);
    const app = {
        state: { activeMode: mode },
        elements: { content },
        pendingRestore: {},
        featureManagers: {
            get: () => manager,
            ensure: () => (manager ? Promise.resolve(manager) : new Promise(() => {})),
        },
        render: () => renderCurrentView(app),
    };
    return app;
}

for (const [name, render] of Object.entries({ renderCurrentView, renderActiveModeView })) {
    test(`${name}: old list is gone before the feature module arrives`, () => {
        FEATURE_MODES.forEach((mode) => {
            const app = createApp(mode);
            void render(app);
            assert.equal(findByClass(app.elements.content, 'update-card'), null, mode);
            assert.match(flattenText(app.elements.content), /Loading/, mode);
        });
    });
}

test('renderCurrentView: a loaded feature renders without an extra loading state', async () => {
    let rendered = false;
    const app = createApp(APP_MODES.STATS, { manager: { render: async () => { rendered = true; } } });
    const pending = renderCurrentView(app);
    assert.doesNotMatch(flattenText(app.elements.content), /Loading/);
    await pending;
    assert.equal(rendered, true);
});
