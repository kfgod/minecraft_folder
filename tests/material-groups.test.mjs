import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Utils } from '../js/utils.js';
import { loadMaterialGroupsData, normalizeMaterialGroupFile } from '../js/modules/material-groups/data.js';

test('material groups: normalizes legacy and direct file formats', () => {
    assert.deepEqual(normalizeMaterialGroupFile(null), []);
    assert.deepEqual(normalizeMaterialGroupFile({ content: [{ name: 'Legacy' }] }), [{ name: 'Legacy' }]);
    assert.deepEqual(normalizeMaterialGroupFile({ name: 'Direct', groups: [] }), [{ name: 'Direct', groups: [] }]);
});

test('material groups: preserves file_index order from generated data', async () => {
    const originalFetchJSON = Utils.fetchJSON;
    const responses = new Map([
        ['../minecraft_data/data/special/file_index.json', {
            files: [
                'data/special/generated.json',
                'data/special/manual.json',
            ],
        }],
        ['../minecraft_data/data/special/generated.json', {
            content: [{ name: 'Generated Families', groups: [{}] }],
        }],
        ['../minecraft_data/data/special/manual.json', {
            name: 'Manual Groups',
            groups: [{}],
        }],
    ]);

    Utils.fetchJSON = async (url) => responses.get(url);
    try {
        const data = await loadMaterialGroupsData();
        assert.deepEqual(data.content.map((item) => item.name), ['Generated Families', 'Manual Groups']);
    } finally {
        Utils.fetchJSON = originalFetchJSON;
    }
});
