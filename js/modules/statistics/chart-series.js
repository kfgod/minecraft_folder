/** Validated categorical palette, one step per theme (scripts of the dataviz checklist). */
export const SERIES_COLORS = Object.freeze({
    blue: { light: '#2a78d6', dark: '#3987e5' },
    orange: { light: '#eb6834', dark: '#d95926' },
    aqua: { light: '#1baf7a', dark: '#199e70' },
    yellow: { light: '#eda100', dark: '#c98500' },
    magenta: { light: '#e87ba4', dark: '#d55181' },
    green: { light: '#008300', dark: '#008300' },
    violet: { light: '#6250d6', dark: '#9085e9' },
    red: { light: '#e34948', dark: '#e66767' },
});

/**
 * Colors follow the category, never its rank. Eight hues cover ten categories:
 * the two smallest share a relative's hue and differ by a dashed line or a lighter bar.
 */
export const CHART_SERIES = [
    { key: 'blocks', label: 'Blocks', stateKey: 'showBlocks', hue: 'blue' },
    { key: 'items', label: 'Items', stateKey: 'showItems', hue: 'orange' },
    { key: 'mobs', label: 'Mobs', stateKey: 'showMobs', hue: 'aqua' },
    { key: 'mob_variants', label: 'Mob Variants', stateKey: 'showMobVariants', hue: 'aqua', variant: true },
    { key: 'advancements', label: 'Advancements', stateKey: 'showAdvancements', hue: 'yellow' },
    { key: 'effects', label: 'Effects', stateKey: 'showEffects', hue: 'magenta' },
    { key: 'biomes', label: 'Biomes', stateKey: 'showBiomes', hue: 'green' },
    { key: 'structures', label: 'Structures', stateKey: 'showStructures', hue: 'green', variant: true },
    { key: 'enchantments', label: 'Enchantments', stateKey: 'showEnchantments', hue: 'violet' },
    { key: 'paintings', label: 'Paintings', stateKey: 'showPaintings', hue: 'red' },
];
