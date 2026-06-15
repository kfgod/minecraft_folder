import { APP_MODES } from '../../app-modes.js';
import { Utils } from '../../utils.js';

export function getCardViewModel(data, { isYearView, activeMode }) {
    const isYearContext = isYearView || data.type === 'year';
    const detailType = isYearContext ? 'year' : 'version';
    const title = isYearContext
        ? data.name || 'Untitled'
        : [data.release_version?.java || '', data.name || ''].filter(Boolean).join(' — ');
    const subtitle = isYearContext ? '' : getReleaseDateSubtitle(data.release_date);
    const statusBadge = isYearContext ? null : getReleaseStatusBadge(data.release_date);

    return {
        id: Utils.generateCardId(data),
        typeClass: data.type || '',
        title,
        subtitle,
        detailType,
        showClose: activeMode === APP_MODES.DETAIL,
        statusBadge: statusBadge?.label || '',
        statusBadgeType: statusBadge?.type || '',
        typeLabel: !isYearContext && data.type ? data.type : '',
        wiki: data.wiki || '',
    };
}

function getReleaseDateSubtitle(releaseDate) {
    if (!releaseDate) return 'no date';
    return Utils.formatDateForDisplay(releaseDate);
}

function getReleaseStatusBadge(releaseDate) {
    if (!releaseDate) return { label: 'announced', type: 'announced' };

    const parsedDate = Utils.parseDate(releaseDate);
    if (!parsedDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsedDate.getTime() > today.getTime()
        ? { label: 'Upcoming', type: 'upcoming' }
        : null;
}
