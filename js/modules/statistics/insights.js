/**
 * Derived statistics: summary numbers, release rhythm and update types.
 */
import { Utils } from '../../utils.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const TYPE_LABELS = { major: 'Major', drop: 'Drop', minor: 'Minor', hotfix: 'Hotfix' };
const EARLY_LABEL = 'Early development';

/** Real release day; a bare year or a missing date does not count. */
function exactDate(releaseDate) {
    if (!releaseDate || Utils.isYearOnly(releaseDate)) return null;
    return Utils.parseDate(releaseDate);
}

/** @param {Array<object>} versions - statistics rows in chronological order */
export function getReleaseGaps(versions) {
    const gaps = [];
    let previous = null;
    (versions || []).forEach((version) => {
        const date = exactDate(version.release_date);
        if (!date) return;
        if (previous) {
            gaps.push({
                version: version.version,
                name: version.name,
                previous: previous.version,
                days: Math.round((date - previous.date) / DAY_MS),
            });
        }
        previous = { version: version.version, date };
    });
    return gaps;
}

export function getMedian(values) {
    if (!values.length) return null;
    const sorted = values.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function getStatisticsSummary(versions, years) {
    const rows = versions || [];
    const biggest = rows.reduce((best, row) => (!best || row.counts.total > best.counts.total ? row : best), null);
    const yearList = (years || []).filter((row) => row.counts.total > 0).map((row) => row.year);
    return {
        total: rows.reduce((sum, row) => sum + row.counts.total, 0),
        versions: rows.length,
        years: yearList.length,
        firstYear: yearList.length ? Math.min(...yearList) : null,
        biggest,
        medianGap: getMedian(getReleaseGaps(rows).map((gap) => gap.days)),
    };
}

/**
 * Content per update type. The type lives on the update records, the counts on the statistics rows.
 * @returns {Array<{ label: string, updates: number, total: number, average: number }>} biggest average first
 */
export function getUpdateTypeSummary(versions, updates) {
    const typeByVersion = new Map((updates || []).map((update) => [update.release_version?.java, update.type]));
    const groups = new Map();
    (versions || []).forEach((row) => {
        const label = TYPE_LABELS[typeByVersion.get(row.version)] || EARLY_LABEL;
        const group = groups.get(label) || { label, updates: 0, total: 0 };
        group.updates += 1;
        group.total += row.counts.total;
        groups.set(label, group);
    });
    return [...groups.values()]
        .map((group) => ({ ...group, average: Math.round(group.total / group.updates) }))
        .sort((a, b) => b.average - a.average);
}
