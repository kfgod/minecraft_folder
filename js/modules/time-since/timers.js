import { Utils } from '../../utils.js';

const UNITS = ['years', 'months', 'days', 'hours', 'minutes', 'seconds'];
const FULL_LABELS = {
    years: ['year', 'years'],
    months: ['month', 'months'],
    days: ['day', 'days'],
    hours: ['hour', 'hours'],
    minutes: ['minute', 'minutes'],
    seconds: ['second', 'seconds'],
};
const SHORT_LABELS = { years: 'y', months: 'mo', days: 'd', hours: 'h', minutes: 'm', seconds: 's' };
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function startTimeSinceTimers(root = document) {
    updateTimers(root);
    return setInterval(() => {
        updateTimers(root);
    }, 1000);
}

export function updateTimers(root = document) {
    const timers = root.querySelectorAll('.time-since-card-timer');

    timers.forEach((timer) => {
        const releaseDate = Utils.parseDate(timer.dataset.releaseDate);
        if (!releaseDate) return;

        const now = new Date();
        if (now < releaseDate) {
            renderMessage(timer, 'Not yet released');
            return;
        }
        renderUnits(timer, getElapsedParts(releaseDate, now));
    });
}

/** Calendar difference: whole months first, the remainder as days and time. */
export function getElapsedParts(from, to) {
    let totalMonths = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
    if (addMonths(from, totalMonths) > to) totalMonths -= 1;

    const rest = to - addMonths(from, totalMonths);
    return {
        years: Math.floor(totalMonths / 12),
        months: totalMonths % 12,
        days: Math.floor(rest / DAY),
        hours: Math.floor(rest / HOUR) % 24,
        minutes: Math.floor(rest / MINUTE) % 60,
        seconds: Math.floor(rest / SECOND) % 60,
    };
}

function addMonths(date, months) {
    const result = new Date(date);
    const day = result.getDate();
    result.setDate(1);
    result.setMonth(result.getMonth() + months);
    const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
    result.setDate(Math.min(day, lastDay));
    return result;
}

function renderMessage(timer, message) {
    delete timer.dataset.units;
    const text = document.createElement('div');
    text.className = 'time-since-timer-text';
    text.textContent = message;
    timer.replaceChildren(text);
}

function renderUnits(timer, parts) {
    // Leading empty units are hidden; hours, minutes and seconds always stay.
    const firstVisible = UNITS.findIndex((unit, index) => parts[unit] > 0 || index >= 3);
    const visible = UNITS.slice(firstVisible);
    const key = visible.join(' ');
    if (timer.dataset.units !== key) {
        timer.dataset.units = key;
        timer.replaceChildren(...visible.map(createUnit));
    }

    const compact = 'compact' in timer.dataset;
    [...timer.children].forEach((element) => {
        const unit = element.dataset.unit;
        const value = parts[unit];
        const [valueElement, labelElement] = element.children;
        valueElement.textContent = UNITS.indexOf(unit) >= 3 ? String(value).padStart(2, '0') : String(value);
        labelElement.textContent = compact ? SHORT_LABELS[unit] : FULL_LABELS[unit][value === 1 ? 0 : 1];
    });
}

function createUnit(unit) {
    const element = document.createElement('div');
    element.className = 'time-since-unit';
    element.dataset.unit = unit;
    const value = document.createElement('span');
    value.className = 'time-since-unit-value';
    const label = document.createElement('span');
    label.className = 'time-since-unit-label';
    element.append(value, label);
    return element;
}
