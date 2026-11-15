import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Utils } from '../js/utils.js';
import { loadMaterialGroupsData, normalizeMaterialGroupFile } from '../js/modules/material-groups/data.js';
import { getHeaderOffset } from '../js/ui/sticky-table-header.js';
import { createMaterialGroupSection } from '../js/modules/material-groups/table.js';
import { findAll, findByClass, flattenText, installDomStub } from './helpers/dom-stub.mjs';

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
            content: [{ name: 'Block Forms', groups: [{}] }],
        }],
        ['../minecraft_data/data/special/manual.json', {
            name: 'Manual Groups',
            groups: [{}],
        }],
    ]);

    Utils.fetchJSON = async (url) => responses.get(url);
    try {
        const data = await loadMaterialGroupsData();
        assert.deepEqual(data.content.map((item) => item.name), ['Block Forms', 'Manual Groups']);
    } finally {
        Utils.fetchJSON = originalFetchJSON;
    }
});

test('material groups: every table has labelled rows and columns, cells open like list cells', () => {
    installDomStub();
    const section = createMaterialGroupSection({
        name: 'Wood Forms',
        generated: 'woodsets',
        columns_order: ['log', 'door'],
        groups: [{
            group: 'oak',
            group_name: 'Oak',
            items: { log: { identifier: 'oak_log', name: 'Oak Log', imagePath: '/block/oak_log/latest.png', wiki: 'https://example.test' } },
        }, {
            group: 'birch',
            group_name: 'Birch',
            items: { door: { identifier: 'birch_door', name: 'Birch Door' } },
        }],
    }, 0, () => false);

    const headers = findAll(section, (node) => node.tagName === 'th').map((node) => node.textContent);
    assert.deepEqual(headers.slice(0, 3), ['Material', 'Log', 'Door']);
    const label = findByClass(section, 'material-group-row-label');
    assert.match(flattenText(label), /Oak/);
    assert.ok(findByClass(label, 'material-group-row-label-icon'));

    const element = findByClass(section, 'material-group-element');
    assert.equal(element.dataset.itemInfo, 'oak_log');
    assert.equal(element.dataset.tooltip, 'Oak Log');
    assert.ok(findByClass(section, 'material-group-empty'));
    assert.match(flattenText(findByClass(section, 'material-group-section-count')), /2 of 4 filled/);
});

test('material groups: header stays in place, follows the page, stops at the table end', () => {
    const table = { tableHeight: 1000, headerHeight: 50 };
    assert.equal(getHeaderOffset({ ...table, tableTop: 200 }), 0);
    assert.equal(getHeaderOffset({ ...table, tableTop: -300 }), 300);
    assert.equal(getHeaderOffset({ ...table, tableTop: -300, stickyTop: 60 }), 360);
    assert.equal(getHeaderOffset({ ...table, tableTop: -5000 }), 950);
});
