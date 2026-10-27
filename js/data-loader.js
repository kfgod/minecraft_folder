/**
 * Load and sort Minecraft update JSON chunks (static files, no server).
 */
import { Utils } from './utils.js';
import { CONFIG } from './config.js';
import { validateFileIndex, validateUpdateChunk } from './validate-data.js';

/**
 * Loads every chunk listed in the index. A chunk that fails to download or
 * validate is skipped and reported, so one bad file does not hide the others.
 * @returns {Promise<{ updates: Array<object>, failedFiles: Array<{ file: string, error: string }> }>}
 */
export async function loadSortedUpdates() {
    const indexFilePath = CONFIG.BASE_URL + CONFIG.INDEX_FILE_PATH;
    const indexData = await Utils.fetchJSON(indexFilePath);
    const indexCheck = validateFileIndex(indexData);
    if (!indexCheck.ok) {
        throw new Error(indexCheck.error || 'Invalid file index');
    }
    const results = await Promise.allSettled(
        indexData.files.map((file) => Utils.fetchJSON(CONFIG.BASE_URL + '/' + file))
    );

    const updates = [];
    const failedFiles = [];
    results.forEach((result, i) => {
        const file = indexData.files[i];
        if (result.status === 'rejected') {
            failedFiles.push({ file, error: result.reason?.message || String(result.reason) });
            return;
        }
        const chunkCheck = validateUpdateChunk(result.value, i);
        if (!chunkCheck.ok) {
            failedFiles.push({ file, error: chunkCheck.error || 'Invalid update chunk' });
            return;
        }
        updates.push(result.value);
    });

    if (!updates.length && failedFiles.length) {
        throw new Error(`All ${failedFiles.length} data files failed to load (first: ${failedFiles[0].error})`);
    }
    failedFiles.forEach(({ file, error }) => console.warn(`Skipped ${file}: ${error}`));

    return { updates: sortUpdates(updates), failedFiles };
}

/**
 * Newest first; undated (announced) entries on top, then year-only dates.
 * @param {Array<object>} updatesData
 */
export function sortUpdates(updatesData) {
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
