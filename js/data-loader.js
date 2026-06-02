/**
 * Load and sort Minecraft update JSON chunks (static files, no server).
 */
import { Utils } from './utils.js';
import { CONFIG } from './config.js';
import { validateFileIndex, validateUpdateChunk } from './validate-data.js';

/**
 * @returns {Promise<Array<object>>}
 */
export async function loadSortedUpdates() {
    const indexFilePath = CONFIG.BASE_URL + CONFIG.INDEX_FILE_PATH;
    const indexData = await Utils.fetchJSON(indexFilePath);
    const indexCheck = validateFileIndex(indexData);
    if (!indexCheck.ok) {
        throw new Error(indexCheck.error || 'Invalid file index');
    }
    const fetchPromises = indexData.files.map((file) => Utils.fetchJSON(CONFIG.BASE_URL + '/' + file));
    const updatesData = await Promise.all(fetchPromises);
    updatesData.forEach((chunk, i) => {
        const chunkCheck = validateUpdateChunk(chunk, i);
        if (!chunkCheck.ok) {
            throw new Error(chunkCheck.error || 'Invalid update chunk');
        }
    });

    return updatesData.sort((a, b) => {
        if (a.release_date === null && b.release_date !== null) return -1;
        if (a.release_date !== null && b.release_date === null) return 1;
        if (a.release_date === null && b.release_date === null) return 0;

        const aIsYearOnly = Utils.isYearOnly(a.release_date);
        const bIsYearOnly = Utils.isYearOnly(b.release_date);

        if (aIsYearOnly && !bIsYearOnly) return -1;
        if (!aIsYearOnly && bIsYearOnly) return 1;
        if (aIsYearOnly && bIsYearOnly) {
            return parseInt(b.release_date, 10) - parseInt(a.release_date, 10);
        }

        const dateA = Utils.parseDate(a.release_date);
        const dateB = Utils.parseDate(b.release_date);
        if (!dateA && !dateB) return 0;
        if (!dateA) return -1;
        if (!dateB) return 1;
        return dateB - dateA;
    });
}
