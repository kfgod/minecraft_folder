import { Utils } from '../../utils.js';
import { CONFIG } from '../../config.js';

export async function loadTimeSinceData() {
    try {
        return await Utils.fetchJSON(CONFIG.BASE_URL + '/data/statistics/time_since.json');
    } catch (error) {
        console.error('Error loading time-since data:', error);
        throw new Error(`Failed to load time-since data: ${error.message}`);
    }
}
