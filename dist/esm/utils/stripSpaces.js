/*
 * Strips duplicate spaces from strings
 */
export function stripSpaces(input) {
    return input.replace(/\s{2,99}/g, ' ');
}
