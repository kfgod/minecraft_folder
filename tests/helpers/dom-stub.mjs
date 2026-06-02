export function installDomStub() {
    globalThis.document = {
        createElement: (tagName) => new TestElement(tagName),
        createTextNode: (text) => new TestText(text),
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
    };
}

export class TestElement {
    constructor(tagName) {
        this.tagName = tagName;
        this.children = [];
        this.dataset = {};
        this.attributes = {};
        this.className = '';
        this.textContent = '';
        this.id = '';
        this.selected = false;
        this.value = '';
        this.style = {};
        this.parentElement = null;
        this.eventListeners = {};
        this.classList = createClassList(this);
    }

    append(...children) {
        children.forEach((child) => this.appendChild(child));
    }

    appendChild(child) {
        if (typeof child === 'string') {
            const text = new TestText(child);
            text.parentElement = this;
            this.children.push(text);
            return child;
        }
        child.parentElement = this;
        this.children.push(child);
        return child;
    }

    replaceChildren(...children) {
        this.children = [];
        this.append(...children);
    }

    setAttribute(name, value) {
        this.attributes[name] = String(value);
        if (name === 'id') this.id = String(value);
        if (name === 'class') this.className = String(value);
    }

    getAttribute(name) {
        if (name === 'id') return this.id;
        if (name === 'class') return this.className;
        if (name.startsWith('data-')) {
            return this.dataset[toDatasetKey(name.slice(5))];
        }
        return this.attributes[name] ?? null;
    }

    addEventListener(type, handler) {
        this.eventListeners[type] ||= [];
        this.eventListeners[type].push(handler);
    }

    dispatchEvent(event) {
        event.target ||= this;
        for (const handler of this.eventListeners[event.type] || []) {
            handler(event);
        }
    }

    click() {
        this.dispatchEvent({ type: 'click', target: this });
    }

    querySelector(selector) {
        return findAll(this, (node) => matchesSelector(node, selector))[0] || null;
    }

    querySelectorAll(selector) {
        return findAll(this, (node) => matchesSelector(node, selector));
    }

    closest(selector) {
        let current = this;
        while (current) {
            if (matchesSelector(current, selector)) return current;
            current = current.parentElement;
        }
        return null;
    }

    insertRow() {
        const row = new TestElement('tr');
        this.appendChild(row);
        return row;
    }

    insertCell() {
        const cell = new TestElement('td');
        this.appendChild(cell);
        return cell;
    }

    getBoundingClientRect() {
        return this.rect || { left: 0, top: 0, width: 100, height: 20 };
    }

    remove() {
        if (!this.parentElement) return;
        this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
        this.parentElement = null;
    }
}

class TestText {
    constructor(text) {
        this.textContent = text;
        this.children = [];
        this.parentElement = null;
    }
}

export function findByClass(root, className) {
    if (root.className?.split(' ').includes(className)) return root;
    for (const child of root.children || []) {
        const found = findByClass(child, className);
        if (found) return found;
    }
    return null;
}

export function findAll(root, predicate, results = []) {
    if (predicate(root)) results.push(root);
    for (const child of root.children || []) {
        findAll(child, predicate, results);
    }
    return results;
}

export function flattenText(root) {
    return [root.textContent || '', ...(root.children || []).map(flattenText)].join('');
}

function createClassList(element) {
    const getClasses = () => new Set((element.className || '').split(/\s+/).filter(Boolean));
    const setClasses = (classes) => {
        element.className = [...classes].join(' ');
    };
    return {
        add: (...names) => {
            const classes = getClasses();
            names.forEach((name) => classes.add(name));
            setClasses(classes);
        },
        remove: (...names) => {
            const classes = getClasses();
            names.forEach((name) => classes.delete(name));
            setClasses(classes);
        },
        toggle: (name, force) => {
            const classes = getClasses();
            const shouldAdd = force === undefined ? !classes.has(name) : Boolean(force);
            if (shouldAdd) classes.add(name);
            else classes.delete(name);
            setClasses(classes);
            return shouldAdd;
        },
        contains: (name) => getClasses().has(name),
    };
}

function matchesSelector(node, selector) {
    if (!node || !selector) return false;
    if (selector.includes(' ')) {
        const parts = selector.trim().split(/\s+/);
        const last = parts.pop();
        if (!matchesSelector(node, last)) return false;
        return parts.every((part) => hasAncestor(node, part));
    }

    const attrMatch = selector.match(/^\.([A-Za-z_-][\w-]*)\[data-([A-Za-z_-][\w-]*)="([^"]+)"\]$/);
    if (attrMatch) {
        const [, className, dataName, value] = attrMatch;
        return hasClass(node, className) && node.dataset[toDatasetKey(dataName)] === value;
    }

    if (selector.startsWith('.')) return hasClass(node, selector.slice(1));
    if (selector.startsWith('#')) return node.id === selector.slice(1);
    return String(node.tagName || '').toLowerCase() === selector.toLowerCase();
}

function hasAncestor(node, selector) {
    let current = node.parentElement;
    while (current) {
        if (matchesSelector(current, selector)) return true;
        current = current.parentElement;
    }
    return false;
}

function hasClass(node, className) {
    return node.className?.split(/\s+/).includes(className);
}

function toDatasetKey(name) {
    return name.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
}
