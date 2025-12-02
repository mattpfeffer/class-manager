"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debreviate = debreviate;
/**
 * Expand shorthand tokens (e.g. "sm:p-2") into full class names with a prefix.
 */
function debreviate(prop, prefix) {
    const cleaned = prop?.replace(/,/g, ' ') ?? '';
    if (!cleaned)
        return [];
    const shorts = cleaned.split(' ');
    return shorts.map((short) => {
        return short.replace(/([\d\w-/]+):*([\d\w-/]*)/g, (match, a, b) => !b.length ? `${prefix}-${a}` : `${a}:${prefix}-${b}`);
    });
}
