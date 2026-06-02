import { Utils } from '../../utils.js';
import { filterAllContentTypes } from '../../data/filtering.js';

export function getDetailData(ctx, target) {
    if (!target) return null;
    if (target.type === 'year') {
        return ctx.queries.getYearEntries().find((entry) => Utils.generateCardId(entry) === target.id) || null;
    }
    return ctx.state.allUpdates.find((entry) => Utils.generateCardId(entry) === target.id) || null;
}

export function getFilteredDetailData(ctx, targetData) {
    const searchQuery = ctx.queries.getSearchQuery().toLowerCase();
    return {
        ...targetData,
        added: filterAllContentTypes(targetData, searchQuery, ctx.state.removeDuplicates),
    };
}
