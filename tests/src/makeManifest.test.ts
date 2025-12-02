import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { makeManifest } from '../../src/plugin/makeManifest';

const MANIFEST_NAME = '.class.manifest';

function runPlugin(root: string, overrides: Partial<Parameters<typeof makeManifest>[0]> = {}) {
    const plugin = makeManifest({
        srcDir: root,
        outDir: root,
        extensions: /\.svelte$/,
        ...overrides
    });

    plugin.configResolved?.({ root, build: { outDir: root } });
    return plugin.buildStart?.();
}

function readManifest(root: string): Set<string> {
    const contents = readFileSync(join(root, MANIFEST_NAME), 'utf8');
    return new Set(contents.split('\n').filter(Boolean));
}

describe('Manifest Plugin', () => {
    it('expands shorthand from declarations, defaults, and usage', async () => {
        const root = mkdtempSync(join(tmpdir(), 'manifest-test-'));
        try {
            // Component with declaration, defaults, and usage in another file.
            writeFileSync(
                join(root, 'Icon.svelte'),
                `
                <script>
                export let variant = 'envelope';
                export let type = 'solid';
                const icon = 'icon';
                _class.declare({ icon: { icon: [variant, type] } });
                </script>
                `
            );

            writeFileSync(
                join(root, 'Page.svelte'),
                `<Icon variant="mail" type="outline" />`
            );

            await runPlugin(root);

            const classes = readManifest(root);
            expect(classes).toEqual(
                new Set(['icon-envelope', 'icon-solid', 'icon-mail', 'icon-outline'])
            );
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('supports multiple attributes sharing a prefix', async () => {
        const root = mkdtempSync(join(tmpdir(), 'manifest-test-'));
        try {
            writeFileSync(
                join(root, 'Image.svelte'),
                `
                <script>
                export let fit = 'cover';
                export let position = 'center';
                _class.declare({ image: { object: [fit, position] } });
                </script>
                `
            );

            await runPlugin(root);

            const classes = readManifest(root);
            expect(classes).toEqual(new Set(['object-cover', 'object-center']));
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('dedupes defaults and props across files', async () => {
        const root = mkdtempSync(join(tmpdir(), 'manifest-test-'));
        try {
            writeFileSync(
                join(root, 'Banner.svelte'),
                `
                <script>
                export let width = 'full';
                _class.declare({ banner: { w: width } });
                </script>
                `
            );

            writeFileSync(join(root, 'Use.svelte'), `<Banner width="full" />`);

            await runPlugin(root);

            const classes = readManifest(root);
            expect(classes).toEqual(new Set(['w-full']));
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('ignores non-string defaults and malformed declarations safely', async () => {
        const root = mkdtempSync(join(tmpdir(), 'manifest-test-'));
        try {
            writeFileSync(
                join(root, 'Bad.svelte'),
                `
                <script>
                export let width = 10;
                _class.declare({ bad: { w: width, m: [unknownVar] } });
                </script>
                `
            );

            await runPlugin(root);

            const classes = readManifest(root);
            expect(classes).toEqual(new Set());
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('scopes prefixes per component when names overlap', async () => {
        const root = mkdtempSync(join(tmpdir(), 'manifest-test-'));
        try {
            writeFileSync(
                join(root, 'Alpha.svelte'),
                `<script>_class.declare({ box: { p: padding } });</script>`
            );
            writeFileSync(
                join(root, 'Beta.svelte'),
                `<script>_class.declare({ box: { p: pad } });</script>`
            );
            writeFileSync(
                join(root, 'Use.svelte'),
                `<Alpha padding="2" /><Beta pad="4" />`
            );

            await runPlugin(root);

            const classes = readManifest(root);
            expect(classes).toEqual(new Set(['p-2', 'p-4']));
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('produces an empty manifest when no matches are found', async () => {
        const root = mkdtempSync(join(tmpdir(), 'manifest-test-'));
        try {
            writeFileSync(join(root, 'Empty.svelte'), `<div>No declare</div>`);

            await runPlugin(root);

            const classes = readManifest(root);
            expect(classes).toEqual(new Set());
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('respects explicit srcDir/outDir options', async () => {
        const root = mkdtempSync(join(tmpdir(), 'manifest-test-'));
        try {
            const srcDir = join(root, 'src');
            const outDir = join(root, 'out');
            // minimal structure
            mkdirSync(srcDir, { recursive: true });
            mkdirSync(outDir, { recursive: true });

            writeFileSync(
                join(srcDir, 'Card.svelte'),
                `<script>_class.declare({ card: { p: pad } });</script><Card pad="2" />`
            );

            await runPlugin(srcDir, { srcDir, outDir });

            const classes = readManifest(outDir);
            expect(classes).toEqual(new Set(['p-2']));
        } finally {
            rmSync(root, { recursive: true, force: true });
        }
    });
});
