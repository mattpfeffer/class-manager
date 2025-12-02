"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeManifest = makeManifest;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const glob_1 = require("glob");
const debreviate_js_1 = require("../utils/debreviate.js");
/**
 * Vite plugin that scans source files for `declare` shorthand mappings, expands
 * them against component defaults and usages, and writes a flat manifest of classes.
 */
function makeManifest(options = {}) {
    const filename = options.filename ?? '.class.manifest';
    let srcDir = options.srcDir;
    let outDir = options.outDir;
    let extensions = options.extensions ?? /\.html$/;
    return {
        name: 'class-manager:manifest',
        apply: 'build',
        configResolved(config) {
            const root = config.root ?? process.cwd();
            srcDir = srcDir ?? (0, path_1.join)(root, 'src');
            outDir = outDir ?? root;
        },
        async buildStart() {
            const paths = getPaths(srcDir, extensions);
            const declarations = findDeclarations(paths);
            const defaults = findDefaults(paths);
            const props = findProps(paths, declarations);
            const classes = extractClasses(declarations, defaults, props);
            const filePath = (0, path_1.join)(outDir, filename);
            await (0, promises_1.mkdir)((0, path_1.dirname)(filePath), { recursive: true });
            await (0, promises_1.writeFile)(filePath, [...classes].join('\n'), 'utf8');
        }
    };
}
/* Helpers */
// Get file paths for matching files.
function getPaths(dir, ext) {
    if (!dir)
        return [];
    const patterns = Array.isArray(ext) ? ext : [ext];
    const paths = glob_1.glob.sync(`${dir}/**/*`, { nodir: true });
    return paths.filter((path) => patterns.some((regex) => regex.test(path)));
}
// Find declare() object literals and return prefix -> attribute names for each component.
function findDeclarations(paths) {
    const declarations = new Map();
    const signature = /declare\(\s*(\{[\s\S]*?\})\s*\)/g;
    paths.forEach((path) => {
        const data = (0, fs_1.readFileSync)(path, { encoding: 'utf8' });
        const component = getComponentName(path);
        for (const match of data.matchAll(signature)) {
            const raw = match[1];
            if (!raw)
                continue;
            const parsed = parseDeclarations(raw);
            const existing = declarations.get(component) ?? {};
            Object.entries(parsed).forEach(([prefix, attr]) => {
                const names = Array.isArray(attr) ? attr : [attr];
                names.forEach((name) => {
                    if (!name)
                        return;
                    const current = existing[prefix] ?? [];
                    if (!current.includes(name))
                        current.push(name);
                    existing[prefix] = current;
                });
            });
            if (Object.keys(existing).length) {
                declarations.set(component, existing);
            }
        }
    });
    return declarations;
}
// Best-effort object literal parser for declare() argument.
function parseDeclarations(raw) {
    try {
        // eslint-disable-next-line no-new-func
        return Function(`"use strict"; return (${raw});`)();
    }
    catch {
        // Fallback: best-effort parse of identifier mappings like { outer: { w: width } }
        const output = {};
        const topLevel = raw.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*\{([^}]*)\}/g);
        for (const [, target, body] of topLevel) {
            if (!target || !body)
                continue;
            const pairs = body.matchAll(/([A-Za-z_$][\w$]*)\s*:\s*(\[[^\]]+?\]|[A-Za-z_$][\w$]*)/g);
            for (const [, key, value] of pairs) {
                if (!key || !value)
                    continue;
                const entries = value.startsWith('[') && value.endsWith(']')
                    ? value
                        .slice(1, -1)
                        .split(',')
                        .map((v) => v.trim())
                        .filter(Boolean)
                    : [value];
                entries.forEach((entry) => {
                    if (!output[key]) {
                        output[key] = [entry];
                    }
                    else if (Array.isArray(output[key])) {
                        if (!output[key].includes(entry)) {
                            output[key].push(entry);
                        }
                    }
                    else if (output[key] !== entry) {
                        output[key] = [output[key], entry];
                    }
                });
            }
        }
        return output;
    }
}
// Find default prop values (string literals) exported from component files.
function findDefaults(paths) {
    const defaults = new Map();
    paths.forEach((path) => {
        const data = (0, fs_1.readFileSync)(path, { encoding: 'utf8' });
        const component = getComponentName(path);
        const parsed = parseDefaults(data);
        if (Object.keys(parsed).length) {
            defaults.set(component, parsed);
        }
    });
    return defaults;
}
// Find shorthand prop usages on component tags and return values keyed by component/attribute.
function findProps(paths, declarations) {
    const props = new Map();
    paths.forEach((path) => {
        const data = (0, fs_1.readFileSync)(path, { encoding: 'utf8' });
        declarations.forEach((meta, component) => {
            Object.values(meta)
                .flat()
                .forEach((attrName) => {
                if (!attrName)
                    return;
                const attrPattern = new RegExp(`<${component}\\b[^>]*?${attrName}\\s*=\\s*["']([\\w\\s:/-]+)["']`, 'g');
                for (const match of data.matchAll(attrPattern)) {
                    const value = match[1];
                    if (!value)
                        continue;
                    const record = props.get(component) ?? {};
                    record[attrName] = [...(record[attrName] ?? []), value];
                    props.set(component, record);
                }
            });
        });
    });
    return props;
}
// Expand shorthand values into classes using declarations and provided value maps.
function extractClasses(declarations, ...sources) {
    const classes = new Set();
    declarations.forEach((meta, component) => {
        Object.entries(meta).forEach(([prefix, attrs]) => {
            const attrNames = Array.isArray(attrs) ? attrs : [attrs];
            attrNames.forEach((attrName) => {
                sources.forEach((source) => {
                    const values = source.get(component)?.[attrName];
                    if (!values)
                        return;
                    const list = Array.isArray(values) ? values : [values];
                    list.forEach((val) => {
                        (0, debreviate_js_1.debreviate)(val, prefix).forEach((cls) => classes.add(cls));
                    });
                });
            });
        });
    });
    return classes;
}
// Parse default prop initialisers (string literals).
function parseDefaults(source) {
    const defaults = {};
    const pattern = /export\s+(?:let|const)\s+([A-Za-z_$][\w$]*)(?:\s*:\s*[^=]+)?\s*=\s*['"]([^'"]+)['"]/g;
    for (const match of source.matchAll(pattern)) {
        const [, name, value] = match;
        if (!name || !value)
            continue;
        defaults[name] = value;
    }
    return defaults;
}
// Get component name (file stem) from a path.
function getComponentName(path) {
    const base = path.split(/[\\/]/).pop() ?? '';
    const name = base.replace(/\.[^/.]+$/, '');
    // Astro/Svelte components can be PascalCase; keep original casing.
    return name;
}
exports.default = makeManifest;
