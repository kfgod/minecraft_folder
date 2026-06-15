import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APP_MODES } from '../js/app-modes.js';
import { CONFIG } from '../js/config.js';
import { createCardSubtitleElement, createGridItemElement, getCardViewModel } from '../js/modules/card/exports.js';
import { findAll, findByClass, installDomStub } from './helpers/dom-stub.mjs';

test('card view model: builds version and year variants', () => {
    installDomStub();
    const versionModel = getCardViewModel(
        {
            name: 'Trails',
            release_version: { java: '1.20' },
            release_date: '2023-06-07',
            type: 'major',
            wiki: 'https://example.test',
        },
        { isYearView: false, activeMode: APP_MODES.LIST }
    );
    assert.equal(versionModel.title, '1.20 — Trails');
    assert.equal(versionModel.detailType, 'version');
    assert.equal(findByClass(createCardSubtitleElement(versionModel), 'card-subtitle-link').textContent, 'wiki');

    const yearModel = getCardViewModel({ name: '2024', type: 'year' }, { isYearView: true, activeMode: APP_MODES.DETAIL });
    assert.equal(yearModel.title, '2024');
    assert.equal(yearModel.detailType, 'year');
    assert.equal(yearModel.showClose, true);
});

test('grid item renderer: renders specialized item types', () => {
    installDomStub();

    const enchantment = createGridItemElement({ name: 'Sharpness', identifier: 'sharpness' }, 'enchantments');
    assert.match(enchantment.className, /ench-cell/);
    assert.equal(findByClass(enchantment, 'ench-icon').src, CONFIG.ENCHANTMENT_ICON);

    const mob = createGridItemElement(
        { name: 'Zombie', identifier: 'zombie', meta: { health: 20 }, wiki: 'https://example.test' },
        'mobs'
    );
    assert.equal(mob.dataset.tooltip, 'Zombie|health:10');
    assert.match(mob.className, /clickable-card/);
});

test('grid item renderer: renders mob egg overlays and baby variant image', () => {
    installDomStub();

    const mob = createGridItemElement(
        {
            name: 'Pig',
            identifier: 'pig',
            meta: {
                babyImagePath: '/mob/pig/baby/latest.png',
                spawn_egg: {
                    name: 'Pig Spawn Egg',
                    imagePath: '/item/pig_spawn_egg/latest.png',
                },
            },
        },
        'mobs'
    );
    const variant = createGridItemElement(
        {
            name: 'Cold Pig',
            identifier: 'cold_pig',
            meta: {
                parent_mob: {
                    name: 'Pig',
                    imagePath: '/mob/pig/latest.png',
                },
                spawn_egg: {
                    name: 'Pig Spawn Egg',
                    imagePath: '/item/pig_spawn_egg/latest.png',
                },
            },
        },
        'mob_variants'
    );

    assert.ok(findByClass(mob, 'mob-card-spawn-egg-right'));
    assert.ok(findByClass(variant, 'mob-card-spawn-egg-right'));
    assert.ok(findByClass(variant, 'mob-card-parent-left'));
    assert.equal(findByClass(mob, 'mob-baby-render').src, `${CONFIG.IMAGE_BASE_PATH}/mob/pig/baby/latest.png`);
    assert.equal(findAll(variant, (node) => node.classList?.contains('mob-egg')).length, 1);
});
