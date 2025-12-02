export interface PluginOptions {
    /*
     * Where source files are located relative to the Vite root.
     * Defaults to the Vite root + src/.
     */
    srcDir?: string;

    /**
     * Where to write the manifest file relative to the Vite root.
     * Defaults to the configured `build.outDir`.
     */
    outDir?: string;

    /**
     * File name to emit for the manifest.
     * Defaults to '.class.manifest'.
     */
    filename?: string;

    /*
     * Extensions of files to scan for class usage.
     * Defaults to /\.html$/.
     */
    extensions?: RegExp | RegExp[];
}

// Shorthand prefix -> attribute name(s)
export type Declarations = Record<string, string | string[]>;

// Minimal shapes to avoid pulling in Vite types during CJS build.
export type ResolvedConfig = { root: string; build: { outDir: string } };
export type Plugin = {
    name: string;
    apply?: 'serve' | 'build';
    configResolved?(config: ResolvedConfig): void;
    buildStart?(): void | Promise<void>;
};
