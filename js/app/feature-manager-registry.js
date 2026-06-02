import { APP_MODES } from '../app-modes.js';

const FEATURE_DEFINITIONS = {
    statistics: {
        mode: APP_MODES.STATS,
        load: async () => {
            const { StatisticsManager } = await import('../modules/statistics/index.js');
            return StatisticsManager;
        },
    },
    compare: {
        mode: APP_MODES.COMPARE,
        load: async () => {
            const { CompareManager } = await import('../modules/compare/index.js');
            return CompareManager;
        },
    },
    timeSince: {
        mode: APP_MODES.TIME_SINCE,
        load: async () => {
            const { TimeSinceManager } = await import('../modules/time-since/index.js');
            return TimeSinceManager;
        },
    },
    materialGroups: {
        mode: APP_MODES.MATERIAL_GROUPS,
        load: async () => {
            const { MaterialGroupsManager } = await import('../modules/material-groups/index.js');
            return MaterialGroupsManager;
        },
    },
};

export class FeatureManagerRegistry {
    constructor(ctx) {
        this.ctx = ctx;
        this.instances = new Map();
    }

    get(key) {
        return this.instances.get(key) || null;
    }

    async ensure(key) {
        if (!FEATURE_DEFINITIONS[key]) {
            throw new Error(`Unknown feature manager: ${key}`);
        }
        if (!this.instances.has(key)) {
            const Manager = await FEATURE_DEFINITIONS[key].load();
            this.instances.set(key, new Manager(this.ctx));
        }
        return this.instances.get(key);
    }

    resetMode(previousMode, nextMode) {
        Object.entries(FEATURE_DEFINITIONS).forEach(([key, definition]) => {
            if (previousMode === definition.mode && nextMode !== definition.mode) {
                this.instances.get(key)?.reset?.();
            }
        });
    }
}
