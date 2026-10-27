import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Utils } from '../js/utils.js';

test('Utils.parseDate: data, ISO and year-only formats are local dates', () => {
    const long = Utils.parseDate('June 7, 2023');
    assert.deepEqual([long.getFullYear(), long.getMonth(), long.getDate()], [2023, 5, 7]);
    const iso = Utils.parseDate('2024-01-01');
    assert.deepEqual([iso.getFullYear(), iso.getMonth(), iso.getDate()], [2024, 0, 1]);
    const yearOnly = Utils.parseDate('2026');
    assert.deepEqual([yearOnly.getFullYear(), yearOnly.getMonth(), yearOnly.getDate()], [2026, 11, 31]);
    assert.equal(Utils.parseDate(''), null);
    assert.equal(Utils.parseDate('not a date'), null);
});

test('Utils.generateCardId: stable without name or version', () => {
    assert.equal(Utils.generateCardId({}), Utils.generateCardId({}));
    assert.equal(Utils.generateCardId({ name: '1.20' }), 'id-1-20');
});
