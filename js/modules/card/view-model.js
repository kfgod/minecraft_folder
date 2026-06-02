import { APP_MODES } from '../../app-modes.js';
import { Utils } from '../../utils.js';

export function getCardViewModel(data, { isYearView, activeMode }) {
    const isYearContext = isYearView || data.type === 'year';
    const detailType = isYearContext ? 'year' : 'version';
    const title = isYearContext
        ? data.name || 'Untitled'
        : [data.release_version?.java || '', data.name || ''].filter(Boolean).join(' — ');
    const subtitle = isYearContext ? '' : Utils.formatDateForDisplay(data.release_date);

    return {
        id: Utils.generateCardId(data),
        typeClass: data.type || '',
        title,
        subtitle,
        detailType,
        showClose: activeMode === APP_MODES.DETAIL,
        typeLabel: !isYearContext && data.type ? data.type : '',
        wiki: data.wiki || '',
    };
}
