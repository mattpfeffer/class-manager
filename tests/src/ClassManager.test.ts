import { describe, expect, it } from 'vitest';

import { ClassManager } from '../../src/ClassManager';

describe('ClassManager', () => {
    it('extracts initial underscore-prefixed style props', () => {
        const manager = new ClassManager({
            _card: 'bg-white  text-sm'
        });

        expect(manager.get('card')).toBe('bg-white text-sm');
    });

    it('handles collisions, merges, and reductions safely', () => {
        const manager = new ClassManager({});

        manager.add('primary', 'md:p-2');
        manager.add('primary', 'md:p-4'); // should replace md:p-2

        manager.add('accent', ['text-blue-500', 'font-semibold']);
        manager.merge('primary', 'accent'); // target set was already initialized

        expect(manager.get('primary')).toBe('font-semibold md:p-4 text-blue-500');

        manager.reduce('primary', 'accent');

        expect(manager.get('primary')).toBe('md:p-4');
    });

    it('applies shorthand declarations and preserves underscored keys', () => {
        const manager = new ClassManager({});

        manager.declare({
            base: {
                p: ['2', '4'],
                m: null
            }
        });

        expect(manager.get('base')).toBe('p-4');

        const result = manager.get('base', 'missing');
        expect(result).toEqual({
            _base: 'p-4',
            _missing: ''
        });
    });

    it('returns a spreadable props object for a single key', () => {
        const manager = new ClassManager({
            _button: 'text-stone'
        });

        const { props } = manager.utils;

        expect(props('button')).toEqual({
            _button: 'text-stone'
        });
    });
});
