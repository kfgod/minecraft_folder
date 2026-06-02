import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS_DIR = path.join(ROOT_DIR, 'js');
const IMPORT_PATTERN = /(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?['"](\.[^'"]+)['"]/g;

async function listJsFiles(dir) {
    const entries = await readdir(dir);
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const info = await stat(fullPath);

        if (info.isDirectory()) {
            files.push(...await listJsFiles(fullPath));
            continue;
        }

        if (entry.endsWith('.js')) {
            files.push(fullPath);
        }
    }

    return files;
}

function normalizeImportPath(fromFile, importPath) {
    const absolute = path.resolve(path.dirname(fromFile), importPath);
    return absolute.endsWith('.js') ? absolute : `${absolute}.js`;
}

function formatCycle(cycle) {
    return cycle
        .map((filePath) => path.relative(ROOT_DIR, filePath))
        .join(' -> ');
}

test('module graph has no static import cycles', async () => {
    const files = await listJsFiles(JS_DIR);
    const fileSet = new Set(files);
    const graph = new Map(files.map((file) => [file, []]));

    for (const file of files) {
        const source = await readFile(file, 'utf8');
        const imports = [...source.matchAll(IMPORT_PATTERN)]
            .map((match) => normalizeImportPath(file, match[1]))
            .filter((target) => fileSet.has(target));

        graph.set(file, imports);
    }

    const visiting = new Set();
    const visited = new Set();
    const stack = [];
    const cycles = [];

    function visit(file) {
        if (visited.has(file)) {
            return;
        }

        if (visiting.has(file)) {
            cycles.push(stack.slice(stack.indexOf(file)).concat(file));
            return;
        }

        visiting.add(file);
        stack.push(file);

        for (const dependency of graph.get(file) ?? []) {
            visit(dependency);
        }

        stack.pop();
        visiting.delete(file);
        visited.add(file);
    }

    for (const file of files) {
        visit(file);
    }

    assert.deepEqual(cycles.map(formatCycle), []);
});
