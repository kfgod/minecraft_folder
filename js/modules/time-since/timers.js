export function startTimeSinceTimers(root = document) {
    updateTimers(root);
    return setInterval(() => {
        updateTimers(root);
    }, 1000);
}

export function updateTimers(root = document) {
    const cards = root.querySelectorAll('.time-since-card-timer');

    cards.forEach((card) => {
        const releaseDateStr = card.getAttribute('data-release-date');
        if (!releaseDateStr) return;

        const releaseDate = new Date(releaseDateStr);
        const diff = new Date() - releaseDate;

        if (diff < 0) {
            const textElement = card.querySelector('.time-since-timer-text');
            if (textElement) textElement.textContent = 'Not yet released';
            return;
        }

        updateTimerCard(card, diff);
    });
}

function updateTimerCard(card, diff) {
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    const textElement = card.querySelector('.time-since-timer-text');

    if (textElement) {
        textElement.textContent = formatTimerParts({ years, months, days, hours, minutes, seconds });
    }
}

function formatTimerParts(partsByUnit) {
    const parts = [];
    ['years', 'months', 'days'].forEach((unit) => {
        const value = partsByUnit[unit];
        if (value > 0) parts.push(`${value} ${value === 1 ? unit.slice(0, -1) : unit}`);
    });

    parts.push(`${partsByUnit.hours} ${partsByUnit.hours === 1 ? 'hour' : 'hours'}`);
    parts.push(`${partsByUnit.minutes} ${partsByUnit.minutes === 1 ? 'minute' : 'minutes'}`);
    parts.push(`${partsByUnit.seconds} ${partsByUnit.seconds === 1 ? 'second' : 'seconds'}`);

    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;

    const lastPart = parts.pop();
    return `${parts.join(', ')} and ${lastPart}`;
}
