/*
 * Neatly generate class strings from a defined list
 *
 * Useful when component based frameworks are used with CSS frameworks like Tailwind.
 * Bring some sanity to the Chaos.
 */

import type { Declarations, Props } from './types';

import { debreviate, stripSpaces } from './utils';

class ClassManager {
    /* Properties */

    #props: Props;
    #shorthand: Declarations | null;

    #register: Record<symbol, string[]>;

    /* Constructor */

    constructor(props: Props, ...more: Props[]) {
        this.#register = {};
        this.#shorthand = null;

        const combined = [props, ...more].reduce(
            (accumulator, current) => ({ ...accumulator, ...current }),
            {} as Props
        );

        props && this.#extract(combined);

        this.#props = combined;
    }

    /* Getters/Setters */

    // Helpers for working with class strings in component templates
    get utils() {
        const slot = (key: string, prepend?: string, fallback?: string) => {
            const output = (this.get(key) as string) ?? fallback;
            return prepend ? stripSpaces(`${prepend} ${output}`) : output;
        };

        const props = <T extends string>(...keys: T[]) => this.get(...keys);

        return { slot, props };
    }

    /* Helper Methods */

    // Extract classes from exisiting style props during instantiation
    #extract(props: Props) {
        const styleProps = Object.entries(props).filter(
            (entry): entry is [string, string] =>
                entry[0].startsWith('_') && typeof entry[1] === 'string'
        );

        styleProps.forEach(([name, value]) => {
            const classes = new Set(value.split(' ').filter(Boolean));

            const entry = Symbol.for(name);
            this.#store(entry, [...classes]);
        });
    }

    // Stores a class set in the regsiter, overwrites existing entry
    #store(entry: symbol, classes: string[]) {
        this.#register[entry] = [...classes];
        this.#register[entry].sort();
    }

    // Get the symbol for a corresponding class set
    #getSymbol(label: string) {
        return Symbol.for(`_${label}`);
    }

    // Generate a single class string from the register
    #getString(set: string) {
        const entry = Symbol.for(`_${set}`);
        return entry in this.#register ? this.#register[entry].join(' ') : '';
    }

    // Check for a collision with an existing class

    // If a match occurs, removes superseded class. The later addition
    // takes precedence so order is important.
    #removeCollisions(name: string, set: Set<string>) {
        const mask = /(.*)-(?:([\d\w]{1,3}|\[[%\w]{1,3}\]))$/;

        set.forEach((item) => {
            // Matched...
            const onName = name.match(mask);
            const onItem = item.match(mask);

            if (onName && onItem) {
                onName[1] === onItem[1] && set.delete(item);
            }
        });
    }

    // Transform shorthand prop values into full classes
    debreviate(prop: string | undefined, prefix: string): string[] {
        return debreviate(prop, prefix);
    }

    /* Core Methods */

    // Add a class or an array of classes to a specified set
    add(set: string, name: string | string[]) {
        const entry = this.#getSymbol(set);
        !(entry in this.#register) && (this.#register[entry] = []);

        if (name.length) {
            const classes = new Set(this.#register[entry]);
            const additions = typeof name === 'string' ? [name] : name;

            additions.forEach((name) => {
                this.#removeCollisions(name, classes);
                classes.add(name);
            });

            this.#store(entry, [...classes]);
        }
    }

    // Remove a class from a specified set of classes
    del(set: string, name: string) {
        const entry = this.#getSymbol(set);
        !(entry in this.#register) && (this.#register[entry] = []);

        const existing = this.#register[entry] ?? [];
        this.#register[entry] = existing.filter((item) => name !== item);
    }

    // Merge a group of style props into a target set
    merge(set: string, ...props: string[]) {
        const entry = this.#getSymbol(set);
        !(entry in this.#register) && (this.#register[entry] = []);

        const classes = new Set(this.#register[entry]);

        props.forEach((propKey) => {
            const symbol = this.#getSymbol(propKey);
            !(symbol in this.#register) && (this.#register[symbol] = []);

            const mergeWith = this.#register[symbol] ?? [];

            mergeWith.forEach((name) => {
                this.#removeCollisions(name, classes);
                classes.add(name);
            });
        });

        this.#store(entry, [...classes]);
    }

    // Remove a group of style props from a target set (opposite of union)
    reduce(set: string, ...props: string[]) {
        const entry = this.#getSymbol(set);
        !(entry in this.#register) && (this.#register[entry] = []);

        const classes = new Set(this.#register[entry]);

        props.forEach((propKey) => {
            const symbol = this.#getSymbol(propKey);
            !(symbol in this.#register) && (this.#register[symbol] = []);

            const mergeWith = this.#register[symbol] ?? [];

            mergeWith.forEach((name) => {
                classes.delete(name);
            });
        });

        this.#store(entry, [...classes]);
    }

    // Generate and retrieve either a class string or set class strings
    get(): Record<string, string>;
    get<T extends string>(set: T): string;
    get<T extends string>(...set: T[]): Record<`_${T}`, string>;
    get(...set: string[]): string | Record<string, string> {
        if (set.length === 1) {
            return this.#getString(set[0]!);
        }

        if (set.length > 1) {
            const entries = set.map((key) => [`_${key}`, this.#getString(key)]);
            return Object.fromEntries(entries) as Record<string, string>;
        }

        const classStrings: Record<string, string> = {};

        Object.getOwnPropertySymbols(this.#register).forEach((entry) => {
            const key = Symbol.keyFor(entry);
            if (!key) return;
            classStrings[key] = (this.#register[entry] ?? []).join(' ');
        });

        return classStrings;
    }

    // Declare shorthand properties and which class sets they should be applied to
    declare(map: Declarations) {
        const declared: Declarations = { ...(this.#shorthand ?? {}), ...map };

        Object.entries(declared).forEach(([target, meta]) => {
            if (!meta || typeof meta !== 'object') return;
            Object.entries(meta).forEach(([prefix, value]) => {
                if (!value) return;
                const source = Array.isArray(value) ? value.join(' ') : value;
                const classes = this.debreviate(source, prefix);
                this.add(target, classes);
            });
        });

        this.#shorthand = declared;
    }
}

export { ClassManager };
