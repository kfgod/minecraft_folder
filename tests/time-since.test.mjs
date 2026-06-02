import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate } from '../js/modules/time-since/cards.js';
import { renderTimeSinceView } from '../js/modules/time-since/view.js';
import { flattenText, installDomStub } from './helpers/dom-stub.mjs';

test('time since view: formats dates and sorts content newest first', () => {
    installDomStub();
    assert.equal(formatDate('2024-02-03'), 'February 3, 2024');
    assert.equal(formatDate('not-a-date'), 'not-a-date');

    const container = document.createElement('div');
    renderTimeSinceView(container, {
        last_block: {
            release_date: '2020-01-01',
            version: '1',
            element: { name: 'Old Block' },
        },
        last_item: {
            release_date: '2022-01-01',
            version: '2',
            element: { name: 'New Item' },
        },
    });

    const text = flattenText(container);
    assert.ok(text.indexOf('New Item') < text.indexOf('Old Block'));
});
