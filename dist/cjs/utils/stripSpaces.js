"use strict";
/*
 * Strips duplicate spaces from strings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripSpaces = stripSpaces;
function stripSpaces(input) {
    return input.replace(/\s{2,99}/g, ' ');
}
