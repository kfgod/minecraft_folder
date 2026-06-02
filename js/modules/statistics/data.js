import { Utils } from '../../utils.js';
import { CONFIG } from '../../config.js';

export async function loadStatisticsBundle() {
    try {
        const [versionsStats, yearsStats, namesStats] = await Promise.all([
            Utils.fetchJSON(CONFIG.BASE_URL + '/data/statistics/by_versions.json'),
            Utils.fetchJSON(CONFIG.BASE_URL + '/data/statistics/by_years.json'),
            Utils.fetchJSON(CONFIG.BASE_URL + '/data/statistics/names.json'),
        ]);
        return { versionsStats, yearsStats, namesStats };
    } catch (error) {
        throw new Error(`Failed to load statistics: ${error.message}`);
    }
}
