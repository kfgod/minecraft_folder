import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCompareItemLabel, normalizeCompareSelections, renderCompareShell } from '../js/modules/compare/exports.js';
import { buildCompareScreenshotFilename, sanitizeScreenshotFilename } from '../js/modules/shared/screenshot-service.js';
import { findAll, installDomStub } from './helpers/dom-stub.mjs';

test('screenshot filenames are deterministic and safe', () => {
    assert.equal(sanitizeScreenshotFilename('a b/c.png'), 'a_b_c.png');
    assert.equal(
        buildCompareScreenshotFilename({ release_version: { java: '1.20.1' } }, { name: 'Fun Update!' }),
        'compare_1.20.1_vs_Fun_Update_.png'
    );
});

test('compare helpers normalize selections and preserve option labels', () => {
    installDomStub();
    const dataSource = [
        { name: 'One', release_version: { java: '1.0' } },
        { name: 'Two <unsafe>', release_version: { java: '2.0' } },
    ];
    assert.equal(getCompareItemLabel(dataSource[0], false), '1.0 — One');
    assert.equal(normalizeCompareSelections([{ name: 'One' }, null], dataSource)[0], dataSource[0]);

    const container = document.createElement('div');
    renderCompareShell(container, {
        dataSource,
        selections: [dataSource[1], null],
        isYearView: false,
    });
    const selectedOption = findAll(container, (node) => node.tagName === 'option').find((option) => option.selected);
    assert.equal(selectedOption.textContent, '2.0 — Two <unsafe>');
    assert.equal(selectedOption.selected, true);
});
