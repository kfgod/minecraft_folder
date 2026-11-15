import { CONFIG } from '../../config.js';
import { Utils } from '../../utils.js';

export async function loadBiomeContentData() {
    const index = await Utils.fetchJSON(`${CONFIG.BASE_URL}/data/biome_content/file_index.json`);
    return Promise.all((index.files || []).map((path) => Utils.fetchJSON(`${CONFIG.BASE_URL}/${path}`)));
}
