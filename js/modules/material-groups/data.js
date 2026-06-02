import { Utils } from '../../utils.js';
import { CONFIG } from '../../config.js';

export async function loadMaterialGroupsData() {
    try {
        const fileIndex = await Utils.fetchJSON(CONFIG.BASE_URL + '/data/special/file_index.json');
        if (!fileIndex?.files?.length) {
            throw new Error('No files found in file index');
        }

        const fileDataArray = await Promise.all(
            fileIndex.files.map((filePath) =>
                Utils.fetchJSON(CONFIG.BASE_URL + '/' + filePath).catch((error) => {
                    console.warn(`Failed to load ${filePath}:`, error);
                    return null;
                })
            )
        );

        return {
            content: fileDataArray.flatMap(normalizeMaterialGroupFile),
        };
    } catch (error) {
        console.error('Error loading material groups data:', error);
        throw new Error(`Failed to load material groups data: ${error.message}`);
    }
}

export function normalizeMaterialGroupFile(fileData) {
    if (!fileData) return [];
    if (fileData.content && Array.isArray(fileData.content)) return fileData.content;
    if (fileData.name && fileData.groups) return [fileData];
    return [];
}
