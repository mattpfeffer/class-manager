import { describe, expect, it } from 'vitest';

import { debreviate } from '../../../src/utils/debreviate';

describe('debreviate', () => {
    it('expands single values with a prefix', () => {
        expect(debreviate('2', 'p')).toEqual(['p-2']);
        expect(debreviate('sm:2', 'p')).toEqual(['sm:p-2']);
    });

    it('splits comma or space separated values', () => {
        expect(debreviate('2,4', 'p')).toEqual(['p-2', 'p-4']);
        expect(debreviate('sm:2 md:4', 'p')).toEqual(['sm:p-2', 'md:p-4']);
    });

    it('handles empty or undefined safely', () => {
        expect(debreviate(undefined, 'p')).toEqual([]);
        expect(debreviate('', 'p')).toEqual([]);
    });
});
