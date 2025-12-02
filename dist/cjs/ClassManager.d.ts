import type { Declarations, Props } from './types';
declare class ClassManager {
    #private;
    constructor(props: Props, ...more: Props[]);
    get utils(): {
        slot: (key: string, prepend?: string, fallback?: string) => string;
        props: <T extends string>(...keys: T[]) => Record<`_${T}`, string>;
    };
    debreviate(prop: string | undefined, prefix: string): string[];
    add(set: string, name: string | string[]): void;
    del(set: string, name: string): void;
    merge(set: string, ...props: string[]): void;
    reduce(set: string, ...props: string[]): void;
    get(): Record<string, string>;
    get<T extends string>(set: T): string;
    get<T extends string>(...set: T[]): Record<`_${T}`, string>;
    declare(map: Declarations): void;
}
export { ClassManager };
