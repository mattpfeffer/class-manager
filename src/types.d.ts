/*
 * Companion types for the ClassManager class
 */

/* Core */

interface Props {
    [index: string]: string | undefined;
}

type Declarations = Record<string, Record<string, string | string[] | null | undefined>>;

export { Props, Declarations };
