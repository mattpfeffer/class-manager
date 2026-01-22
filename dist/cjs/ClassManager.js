"use strict";
/*
 * Neatly generate class strings from a defined list
 *
 * Useful when component based frameworks are used with CSS frameworks like Tailwind.
 * Bring some sanity to the Chaos.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassManager = void 0;
const utils_1 = require("./utils");
class ClassManager {
    /* Properties */
    #props;
    #shorthand;
    #register;
    /* Constructor */
    constructor(props, ...more) {
        this.#register = {};
        this.#shorthand = null;
        const combined = [props, ...more].reduce((accumulator, current) => ({ ...accumulator, ...current }), {});
        props && this.#extract(combined);
        this.#props = combined;
    }
    /* Getters/Setters */
    // Helpers for working with class strings in component templates
    get utils() {
        const slot = (key, prepend, fallback) => {
            const output = this.get(key) ?? fallback;
            return prepend ? (0, utils_1.stripSpaces)(`${prepend} ${output}`) : output;
        };
        const props = (...keys) => {
            if (keys.length === 1) {
                const key = keys[0];
                return { [`_${key}`]: this.get(key) };
            }
            return this.get(...keys);
        };
        return { slot, props };
    }
    /* Helper Methods */
    // Extract classes from exisiting style props during instantiation
    #extract(props) {
        const styleProps = Object.entries(props).filter((entry) => entry[0].startsWith('_') && typeof entry[1] === 'string');
        styleProps.forEach(([name, value]) => {
            const classes = new Set(value.split(' ').filter(Boolean));
            const entry = Symbol.for(name);
            this.#store(entry, [...classes]);
        });
    }
    // Stores a class set in the regsiter, overwrites existing entry
    #store(entry, classes) {
        this.#register[entry] = [...classes];
        this.#register[entry].sort();
    }
    // Get the symbol for a corresponding class set
    #getSymbol(label) {
        return Symbol.for(`_${label}`);
    }
    // Generate a single class string from the register
    #getString(set) {
        const entry = Symbol.for(`_${set}`);
        return entry in this.#register ? this.#register[entry].join(' ') : '';
    }
    // Check for a collision with an existing class
    // If a match occurs, removes superseded class. The later addition
    // takes precedence so order is important.
    #removeCollisions(name, set) {
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
    debreviate(prop, prefix) {
        return (0, utils_1.debreviate)(prop, prefix);
    }
    /* Core Methods */
    // Add a class or an array of classes to a specified set
    add(set, name) {
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
    del(set, name) {
        const entry = this.#getSymbol(set);
        !(entry in this.#register) && (this.#register[entry] = []);
        const existing = this.#register[entry] ?? [];
        this.#register[entry] = existing.filter((item) => name !== item);
    }
    // Merge a group of style props into a target set
    merge(set, ...props) {
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
    reduce(set, ...props) {
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
    get(...set) {
        if (set.length === 1) {
            return this.#getString(set[0]);
        }
        if (set.length > 1) {
            const entries = set.map((key) => [`_${key}`, this.#getString(key)]);
            return Object.fromEntries(entries);
        }
        const classStrings = {};
        Object.getOwnPropertySymbols(this.#register).forEach((entry) => {
            const key = Symbol.keyFor(entry);
            if (!key)
                return;
            classStrings[key] = (this.#register[entry] ?? []).join(' ');
        });
        return classStrings;
    }
    // Declare shorthand properties and which class sets they should be applied to
    declare(map) {
        const declared = { ...(this.#shorthand ?? {}), ...map };
        Object.entries(declared).forEach(([target, meta]) => {
            if (!meta || typeof meta !== 'object')
                return;
            Object.entries(meta).forEach(([prefix, value]) => {
                if (!value)
                    return;
                const source = Array.isArray(value) ? value.join(' ') : value;
                const classes = this.debreviate(source, prefix);
                this.add(target, classes);
            });
        });
        this.#shorthand = declared;
    }
}
exports.ClassManager = ClassManager;
