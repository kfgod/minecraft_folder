import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMaterialGroupFile } from '../js/modules/material-groups/data.js';

test('material groups: normalizes legacy and direct file formats', () => {
    assert.deepEqual(normalizeMaterialGroupFile(null), []);
    assert.deepEqual(normalizeMaterialGroupFile({ content: [{ name: 'Legacy' }] }), [{ name: 'Legacy' }]);
    assert.deepEqual(normalizeMaterialGroupFile({ name: 'Direct', groups: [] }), [{ name: 'Direct', groups: [] }]);
});
