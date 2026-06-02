/**
 * Lightweight runtime checks for fetched JSON (static data pipeline).
 */

/**
 * @param {*} data
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateFileIndex(data) {
    if (!data || typeof data !== 'object') {
        return { ok: false, error: 'file_index: not an object' };
    }
    if (!Array.isArray(data.files)) {
        return { ok: false, error: 'file_index: missing files array' };
    }
    if (!data.files.length) {
        return { ok: false, error: 'file_index: files array is empty' };
    }
    for (let i = 0; i < data.files.length; i++) {
        const f = data.files[i];
        if (typeof f !== 'string' || !f.trim()) {
            return { ok: false, error: `file_index: invalid files[${i}]` };
        }
    }
    return { ok: true };
}

/**
 * @param {*} entry
 * @param {number} index
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateUpdateChunk(entry, index) {
    if (!entry || typeof entry !== 'object') {
        return { ok: false, error: `update chunk [${index}]: not an object` };
    }
    if (!('added' in entry)) {
        return { ok: false, error: `update chunk [${index}]: missing added` };
    }
    return { ok: true };
}
