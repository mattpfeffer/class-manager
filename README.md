# class-manager

A utility to help manage CSS classes and neatly generate class strings for elements and components. Useful when component-based frameworks (Svelte, Vue, etc.) are used with utility CSS frameworks like Tailwind — bring some sanity to the chaos.

## Why
- Reduce verbosity in component templates.
- Keep class string assembly predictable across components.
- Manage shorthand properties and dynamic classes without guesswork.

## Features
- Collision-aware add/merge/reduce/del helpers for clean class sets.
- Programmatic access with `get`.
- Style props for injecting classes on components.
- Template helpers for consistent slot/prop class access in markup.
- Declarative shorthand → full class expansion.
- Optional Vite plugin to generate a manifest (safelist).
- Supports both ESM and CommonJS.

## Install
```bash
# pnpm
pnpm add class-manager

# npm
npm install class-manager

# yarn
yarn add class-manager
```

## Core Usage
```js
import { ClassManager } from 'class-manager';

const _class = new ClassManager();

_class.add('card', 'shadow-md');   // class list, class, or classes[]

_class.get('card');                // "shadow-md ..."
```

### Template Output

#### Slots
Outputs the classlist for a given slot, with optional prepended classes.

```js
<script>
    const { slot } = _class.utils;
</script>

<div class={slot('card')}>
    <button class={slot('button', 'btn')}>Click me</button>
</div>
```

#### Props
Pass through for style props (see below). Useful when you want to pass a prop from a parent component directly to a child component.

```js
<script>
    const { slot, props } = _class.utils;
</script>

<div class={slot('card')}>
    <Button {...props('button', 'icon')}>Click me</Button>
</div>
```

### Style Props

Pass Svelte's `$$restProps` object (or framework equivalent) to the Class Manager instance and any prop you add that starts with an underscore (`_`) will have its classes automatically passed to the class list of the same name.

```html
<Card _button="bg-blue border-2" />
```

```js
import { ClassManager } from 'class-manager';

const _class = new ClassManager($$restProps);

_class.get('button');  // "bg-blue border-2 ..."
```

### Shorthand Props
Sometimes when you're working with frameworks like Tailwind CSS, some common classes can be repetitive to write. Use shorthand props instead.

Declare shorthand with `declare({ target: { prefix: value | value[] } })` in your component logic:

```js
export let width;

_class.declare({
  card: {
    w: width
  }
});
```

```js
<Card width="full md:16" /> // expands to "w-full md:w-16"
```
Comma-separated values are also allowed `width="full,md:16"`. Null/undefined values are ignored.


## Generate Safelists (optional Vite plugin)
Shorthand props and dynamic classes don't get picked up by treeshaking. Use the built in Vite plugin to generate a manifest of all shorthand classes that you can pass to any safelist (such as Tailwind config).

```js
// vite.config.js
import makeManifest from 'class-manager/manifest';

export default {
  plugins: [
    makeManifest({
      srcDir: 'src',         // where to scan (defaults to root/src)
      outDir: 'dist',        // where to write the manifest (defaults to root)
      filename: '.class.manifest',
      extensions: /\.svelte$/ // limit to these file types (defaults to .html), regex literal
    })
  ]
};
```

How it works:
- Finds `declare({ ... })` calls in your components.
- Collects usages of declared attributes in components and markup (including defaults).
- Expands the shorthand and writes them to the manifest.
