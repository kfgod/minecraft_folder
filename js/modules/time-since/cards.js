const CONTENT_LABELS = {
    block: 'Block',
    item: 'Item',
    mob: 'Mob',
    mob_variant: 'Mob Variant',
    advancement: 'Advancement',
    biome: 'Biome',
    painting: 'Painting',
    effect: 'Effect',
    enchantment: 'Enchantment',
    structure: 'Structure',
};

export function createVersionCard(type, versionData) {
    const typeLabel = type === 'drop' ? 'Drop Update' : 'Major Update';
    const card = createCardContainer({
        href: versionData.wiki || '',
        className: `time-since-card-${type}`,
        id: `time-since-${type}`,
    });

    const header = createCardHeader([
        createCardTitle(typeLabel),
        versionData.name ? createCardName(versionData.name) : null,
        createCardVersion(versionData.version),
    ]);

    card.append(
        header,
        createDateLine(versionData.release_date),
        createTimer(versionData.release_date),
    );
    return card;
}

export function createContentCard(type, data) {
    const element = data.element || {};
    const versionName = data.version_name || '';
    const version = data.version || '';
    const elementName = element.name || 'Unknown';

    const card = createCardContainer({
        href: element.wiki || '',
        className: `time-since-card-${type}`,
        id: `time-since-${type}`,
    });

    const versionLabel = versionName ? `${versionName} (${version})` : version;
    const header = createCardHeader([
        createCardTitle(CONTENT_LABELS[type] || type),
        createCardName(elementName),
        createCardVersion(versionLabel),
    ]);

    card.append(
        header,
        createDateLine(data.release_date),
        createTimer(data.release_date),
    );
    return card;
}

function createTimer(releaseDate) {
    const timer = document.createElement('div');
    timer.className = 'time-since-card-timer';
    timer.dataset.releaseDate = releaseDate || '';

    const text = document.createElement('div');
    text.className = 'time-since-timer-text';
    text.textContent = 'Loading...';

    timer.appendChild(text);
    return timer;
}

function createCardContainer({ href, className, id }) {
    const card = document.createElement(href ? 'a' : 'div');
    if (href) {
        card.href = href;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
    }
    card.className = `time-since-card ${className}`;
    card.id = id;
    return card;
}

function createCardHeader(children) {
    const header = document.createElement('div');
    header.className = 'time-since-card-header';
    children.filter(Boolean).forEach((child) => header.appendChild(child));
    return header;
}

function createCardTitle(value) {
    const title = document.createElement('h2');
    title.className = 'time-since-card-title';
    title.textContent = value;
    return title;
}

function createCardName(value) {
    const name = document.createElement('div');
    name.className = 'time-since-card-name';
    name.textContent = value;
    return name;
}

function createCardVersion(value) {
    const version = document.createElement('div');
    version.className = 'time-since-card-version';
    version.textContent = value;
    return version;
}

function createDateLine(releaseDate) {
    const line = document.createElement('div');
    line.className = 'time-since-card-date';
    line.textContent = `Released: ${formatDate(releaseDate)}`;
    return line;
}

export function formatDate(dateString) {
    if (!dateString) return 'Unknown';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
