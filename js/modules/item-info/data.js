import { CONFIG } from '../../config.js';
import { Utils } from '../../utils.js';

const RECIPES_URL = `${CONFIG.BASE_URL}/data/recipes`;

let indexPromise = null;
let index = null;
const itemCache = new Map();

/** Index of items that have recipe/tag data; loaded once in the background. */
export function loadItemIndex() {
    indexPromise ||= Utils.fetchJSON(`${RECIPES_URL}/index.json`)
        .then((data) => {
            index = { ...data, itemSet: new Set(data.items || []) };
            return index;
        })
        .catch((error) => {
            console.warn('Recipe index unavailable', error);
            indexPromise = null;
            return null;
        });
    return indexPromise;
}

/** Synchronous check so a click can decide between the dialog and the Wiki link. */
export function hasItemInfo(identifier) {
    return Boolean(index?.itemSet.has(stripNamespace(identifier)));
}

export function getItemIndex() {
    return index;
}

export function loadItemInfo(identifier) {
    const id = stripNamespace(identifier);
    if (!itemCache.has(id)) {
        const request = Utils.fetchJSON(`${RECIPES_URL}/items/${encodeURIComponent(id)}.json`);
        request.catch(() => itemCache.delete(id));
        itemCache.set(id, request);
    }
    return itemCache.get(id);
}

export function stripNamespace(identifier) {
    return String(identifier || '').replace(/^minecraft:/, '');
}

/** Tracked version that precedes `version`, for "between X and Y" hints over jar gaps. */
export function previousVersion(version) {
    const ids = (index?.versions || []).map((entry) => entry.id);
    const position = ids.indexOf(version);
    return position > 0 ? ids[position - 1] : null;
}
