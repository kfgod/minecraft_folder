import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateFileIndex, validateUpdateChunk } from '../js/validate-data.js';

test('validate-data contract', () => {
    assert.equal(validateFileIndex(null).ok, false);
    assert.equal(validateFileIndex({ files: ['a.json'] }).ok, true);
    assert.equal(validateUpdateChunk({ added: {} }, 0).ok, true);
    assert.equal(validateUpdateChunk({}, 0).ok, false);
});
