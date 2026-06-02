import { CONFIG } from '../../config.js';

export const CHART_SERIES = [
    {
        key: 'blocks',
        label: 'Blocks',
        stateKey: 'showBlocks',
        borderColor: CONFIG.CHART_COLORS.BLOCKS,
        backgroundColor: CONFIG.CHART_COLORS.BLOCKS_BG,
    },
    {
        key: 'items',
        label: 'Items',
        stateKey: 'showItems',
        borderColor: CONFIG.CHART_COLORS.ITEMS,
        backgroundColor: CONFIG.CHART_COLORS.ITEMS_BG,
    },
    {
        key: 'mobs',
        label: 'Mobs',
        stateKey: 'showMobs',
        borderColor: CONFIG.CHART_COLORS.MOBS,
        backgroundColor: CONFIG.CHART_COLORS.MOBS_BG,
    },
    {
        key: 'effects',
        label: 'Effects',
        stateKey: 'showEffects',
        borderColor: CONFIG.CHART_COLORS.EFFECTS,
        backgroundColor: CONFIG.CHART_COLORS.EFFECTS_BG,
    },
    {
        key: 'biomes',
        label: 'Biomes',
        stateKey: 'showBiomes',
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74, 222, 128, 0.1)',
    },
    {
        key: 'enchantments',
        label: 'Enchantments',
        stateKey: 'showEnchantments',
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
    },
    {
        key: 'advancements',
        label: 'Advancements',
        stateKey: 'showAdvancements',
        borderColor: CONFIG.CHART_COLORS.ADVANCEMENTS,
        backgroundColor: CONFIG.CHART_COLORS.ADVANCEMENTS_BG,
    },
    {
        key: 'structures',
        label: 'Structures',
        stateKey: 'showStructures',
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
    },
];
