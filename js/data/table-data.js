import { Utils } from '../utils.js';

export function getAllNames(updates, contentTypes) {
    const allNames = updates.flatMap((update) =>
        contentTypes.flatMap((type) =>
            update.added?.[type]?.map((item) => item.name) || []
        )
    );
    return [...new Set(allNames)].sort((a, b) => a.length - b.length);
}

export function getAllNamesByProperty(updates, contentTypes, property = 'name') {
    const get = (obj) => (obj && typeof obj[property] === 'string' ? obj[property] : '');
    const allNames = updates
        .flatMap((update) =>
            contentTypes.flatMap((type) =>
                update.added?.[type]?.map(get) || []
            )
        )
        .filter(Boolean);

    return [...new Set(allNames)].sort((a, b) => a.length - b.length);
}

export function getVersionsTableData(updates) {
    return updates.map((update) => {
        const releaseDate = update.release_date;
        const parsed = Utils.parseDate(releaseDate);
        const isYearOnly = Utils.isYearOnly(releaseDate);
        const items = update.added?.items?.length || 0;
        const blocks = update.added?.blocks?.length || 0;
        const mobs = update.added?.mobs?.length || 0;
        const effects = update.added?.effects?.length || 0;
        return {
            name: update.name || 'N/A',
            version: update.release_version?.java || 'N/A',
            items,
            blocks,
            mobs,
            effects,
            total: items + blocks + mobs + effects,
            _release_date: releaseDate,
            _is_year_only: !!isYearOnly,
            _date_value: parsed ? parsed.getTime() : null,
        };
    });
}

export function getYearsTableData(updates, contentTypes) {
    const byYear = updates.reduce((acc, update) => {
        const parsedDate = Utils.parseDate(update.release_date);
        const year = parsedDate ? parsedDate.getFullYear() : null;
        if (!year) return acc;

        if (!acc[year]) {
            acc[year] = contentTypes.reduce((obj, type) => {
                obj[type] = 0;
                return obj;
            }, {});
        }

        contentTypes.forEach((type) => {
            acc[year][type] += update.added?.[type]?.length || 0;
        });
        return acc;
    }, {});

    return Object.keys(byYear).map((year) => {
        const yearData = byYear[year];
        const total = contentTypes.reduce((sum, type) => sum + yearData[type], 0);
        return { year: parseInt(year), ...yearData, total };
    });
}

export function sortData(data, column, direction) {
    const dir = direction === 'asc' ? 1 : -1;
    return data.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        if (column === 'name') {
            const aNa = valA === 'N/A' ? 1 : 0;
            const bNa = valB === 'N/A' ? 1 : 0;
            if (aNa !== bNa) return aNa - bNa;
            return dir * String(valA).localeCompare(String(valB), undefined, { numeric: true });
        }

        if (column === 'version') {
            const rank = (row) => {
                if (row._release_date === null) return 0;
                if (row._is_year_only) return 1;
                return 2;
            };
            const rA = rank(a);
            const rB = rank(b);
            if (rA !== rB) return rA - rB;

            const dA = a._date_value;
            const dB = b._date_value;
            if (dA === null && dB === null) return 0;
            if (dA === null) return -1;
            if (dB === null) return 1;
            return dir * (dA - dB);
        }

        const comparison =
            typeof valA === 'string'
                ? String(valA).localeCompare(String(valB), undefined, { numeric: true })
                : valA - valB;
        return dir * comparison;
    });
}
