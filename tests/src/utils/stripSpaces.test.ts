import { describe, expect, it } from 'vitest';

import { stripSpaces } from '../../../src/utils/stripSpaces.ts';

describe('stripSpaces', () => {
    it('condenses repeated whitespace to single spaces', () => {
        const input = 'class   name    with   gaps';
        expect(stripSpaces(input)).toBe('class name with gaps');
    });

    it('normalizes mixed whitespace characters', () => {
        const input = 'with \n multiple \t spaces';
        expect(stripSpaces(input)).toBe('with multiple spaces');
    });
});
