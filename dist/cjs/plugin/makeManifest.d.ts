import type { Plugin, PluginOptions } from './types';
/**
 * Vite plugin that scans source files for `declare` shorthand mappings, expands
 * them against component defaults and usages, and writes a flat manifest of classes.
 */
export declare function makeManifest(options?: PluginOptions): Plugin;
export default makeManifest;
