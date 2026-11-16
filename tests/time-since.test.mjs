import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatVersionsSince } from '../js/modules/time-since/cards.js';
import { getListTarget, renderTimeSinceView } from '../js/modules/time-since/view.js';
import { getElapsedParts } from '../js/modules/time-since/timers.js';
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

test('time since view: renders food card', () => {
    installDomStub();
    const container = document.createElement('div');
    renderTimeSinceView(container, {
        last_food: {
            release_date: '2021-06-08',
            version: '1.17',
            element: { name: 'Glow Berries' },
        },
    });
    const text = flattenText(container);
    assert.ok(text.includes('Food'));
    assert.ok(text.includes('Glow Berries'));
});

test('time since view: content cards open the list with a tag or a single section', () => {
    assert.deepEqual(
        getListTarget({ tag: 'kind:smithing_template', sections: ['blocks', 'items'] }),
        { search: '#kind:smithing_template', sections: ['showBlocks', 'showItems'] },
    );
    assert.deepEqual(getListTarget({ section: 'mobs' }), { search: '', sections: ['showMobs'] });
    assert.deepEqual(
        getListTarget({ dataTag: true, sections: ['blocks', 'items'] }, { tag: 'wood:pale_oak' }),
        { search: '#wood:pale_oak', sections: ['showBlocks', 'showItems'] },
    );
});

test('time since view: content cards show how many versions came out since', () => {
    assert.equal(formatVersionsSince(0), 'No versions since');
    assert.equal(formatVersionsSince(1), '1 version since');
    assert.equal(formatVersionsSince(13), '13 versions since');

    installDomStub();
    const container = document.createElement('div');
    renderTimeSinceView(container, {
        last_food: { release_date: '2021-06-08', version: '1.17', element: { name: 'Glow Berries' }, versions_since: 19 },
    });
    assert.ok(flattenText(container).includes('19 versions since'));
});

test('time since timer: elapsed parts follow the calendar', () => {
    assert.deepEqual(
        getElapsedParts(new Date(2024, 5, 13, 8, 0, 0), new Date(2026, 9, 16, 10, 31, 17)),
        { years: 2, months: 4, days: 3, hours: 2, minutes: 31, seconds: 17 },
    );
    // A month end clamps instead of overflowing into the next month.
    assert.deepEqual(
        getElapsedParts(new Date(2026, 0, 31), new Date(2026, 2, 1)),
        { years: 0, months: 1, days: 1, hours: 0, minutes: 0, seconds: 0 },
    );
    assert.equal(getElapsedParts(new Date(2026, 0, 20), new Date(2026, 1, 19)).months, 0);
});
