export function showTooltip(tooltip, target, text) {
    if (!tooltip || !target || !text) return;

    if (text.includes('|health:')) {
        const [name, healthPart] = text.split('|health:');
        tooltip.replaceChildren(
            document.createTextNode(name),
            document.createElement('br'),
            createHealthText(healthPart),
        );
    } else {
        tooltip.textContent = text;
    }
    tooltip.style.display = 'block';

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 10;

    let left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
    if (left < padding) {
        left = padding;
    } else if (left + tooltipRect.width > window.innerWidth - padding) {
        left = window.innerWidth - tooltipRect.width - padding;
    }

    let top = targetRect.top - tooltipRect.height - 8;
    if (top < padding) {
        top = targetRect.bottom + 8;
        tooltip.classList.add('tooltip-below');
    } else {
        tooltip.classList.remove('tooltip-below');
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.classList.add('visible');
}

export function hideTooltip(tooltip) {
    if (!tooltip) return;
    tooltip.classList.remove('visible', 'tooltip-below');
    tooltip.style.display = 'none';
}

function createHealthText(healthPart) {
    const wrapper = document.createElement('span');
    wrapper.className = 'tooltip-health-text';

    const icon = document.createElement('img');
    icon.src = 'static/images/icons/health_icon.png';
    icon.alt = 'Health';
    icon.className = 'tooltip-health-icon';

    wrapper.append(icon, `×${healthPart}`);
    return wrapper;
}
