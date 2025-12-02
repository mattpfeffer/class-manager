/*
 * Strips duplicate spaces from strings
 */

export function stripSpaces(input: string): string {
    return input.replace(/\s{2,99}/g, ' ');
}
