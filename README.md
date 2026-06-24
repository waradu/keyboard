# Keyboard Manager

A keyboard manager compatible with TypeScript and Nuxt.

[![validate](https://github.com/Waradu/keyboard/actions/workflows/validate.yml/badge.svg)](https://github.com/Waradu/keyboard/actions/workflows/validate.yml)

- [Install](#install)
- [Get Started](#get-started)
- [Nuxt](#nuxt)
- [Usage](#usage)
- [Key Strings](#key-strings)
- [Handler](#handler)
- [Layers](#layers)
- [Config](#config)
- [Directives](#directives)
- [Changes](#changes)
- [Development](#development)
- [Examples](#examples)

## Install

```bash
bun install @waradu/keyboard
```

## Get Started

Create a keyboard instance and bind a shortcut:

```ts
import { Keyboard } from "@waradu/keyboard";

const keyboard = new Keyboard();

const off = keyboard.bind({
  keys: "ctrl+k",
  run({ event }) {
    console.log("pressed", event.key);
  },
});

off();
```

`Keyboard` initializes itself when `window` is available. If you create an instance before `window` exists, call `keyboard.init()` later.

## Nuxt

Add the Nuxt module to `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ["@waradu/keyboard/nuxt"],
});
```

The module provides `$keyboard`, auto-imports composables, registers directives and initializes the keyboard on `app:mounted`.

```ts
const off = useKeybind({
  keys: "a",
  run() {
    console.log("A key pressed");
  },
});
```

`useKeybind` mirrors `keyboard.bind` and automatically removes the binding when the component unmounts.

```ts
useKeybind([
  {
    keys: "ctrl+z",
    run() {
      console.log("undo");
    },
  },
  {
    keys: "ctrl+shift+z",
    run() {
      console.log("redo");
    },
  },
]);
```

Create a layer in Nuxt:

```ts
const editor = useKeybindLayer("editor");

editor.bind({
  keys: "escape",
  run() {
    editor.disable();
  },
});
```

Inspect active handlers:

```ts
const { handlers, unsubscribe } = useKeyboardInspector();

console.log(handlers.value);
unsubscribe();
```

Record keybind shapes:

```ts
const stop = useKeybindRecorder((sequence) => {
  console.log(sequence);
});

stop();
```

Access the provided instance directly:

```ts
const { $keyboard } = useNuxtApp();

$keyboard.destroy();
```

The module accepts a `debug` option:

```ts
export default defineNuxtConfig({
  modules: ["@waradu/keyboard/nuxt"],
  keyboard: {
    debug: true,
  },
});
```

## Usage

### Bind One Handler

```ts
const off = keyboard.bind({
  keys: ["ctrl+y", "ctrl+shift+z"],
  run() {
    console.log("redo");
  },
  config: {
    prevent: true,
  },
});

off();
```

`keys` can be a single key string, a keybind shape, or an array of both.

```ts
keyboard.bind({
  keys: {
    platform: "macos",
    key: "a",
    modifiers: {
      alt: true,
    },
  },
  run() {},
});
```

### Bind Multiple Handlers

```ts
keyboard.bind([
  {
    keys: "ctrl+z",
    run() {
      console.log("undo");
    },
  },
  {
    keys: "ctrl+shift+z",
    run() {
      console.log("redo");
    },
  },
]);
```

You can pass shared config as the second argument:

```ts
keyboard.bind(
  [
    {
      keys: "ctrl+s",
      run() {
        console.log("save");
      },
    },
  ],
  {
    prevent: true,
  },
);
```

### Inspect Handlers

```ts
const unsubscribe = keyboard.subscribe((handlers) => {
  console.log("active handlers", handlers);
});

unsubscribe();
```

### Record Keybinds

```ts
const stop = keyboard.record((sequence) => {
  console.log(sequence);
  // { key: "k", modifiers: { meta: true, ctrl: false, ctrlCmd: false, alt: false, shift: true } }
});

stop();
```

### Parse Key Strings

```ts
import { parseKeyString } from "@waradu/keyboard";

parseKeyString("meta+shift+k");
// { key: "k", modifiers: { meta: true, ctrl: false, ctrlCmd: false, alt: false, shift: true } }

parseKeyString("macos:meta+k");
// { platform: "macos", key: "k", modifiers: { meta: true, ctrl: false, ctrlCmd: false, alt: false, shift: false } }

parseKeyString("unknown+k");
// undefined
```

## Key Strings

Key strings describe the key and modifiers that must be active for a handler to run.

The structure is:

```txt
(platform:)?(meta+)?(ctrl+)?(ctrl-cmd+)?(alt+)?(shift+)?key
```

Special keys:

- `$any`: match any key
- `$num`: match any number key and expose it as `context.template`

Platform prefixes:

- `macos`
- `win`
- `linux`
- `no-macos`
- `no-win`
- `no-linux`

The modifier order is fixed: `meta`, `ctrl`, `ctrl-cmd`, `alt`, `shift`, then the key.

`ctrl-cmd` maps to Cmd (`meta`) on macOS and Ctrl (`ctrl`) on other platforms.
It can be combined with `alt` and `shift`, but not with `meta` or `ctrl`.
In `KeybindShape` / `CreateKeybindShape` objects, the same modifier field is named `ctrlCmd`.

Examples:

- `"ctrl+x"`: valid
- `"ctrl-cmd+k"`: valid
- `"ctrl-cmd+shift+k"`: valid
- `"meta+ctrl+alt+shift+arrow-up"`: valid
- `"c"`: valid
- `"macos:x"`: valid
- `"alt+$num"`: valid
- `"$any"`: valid
- `""`: invalid
- `"shift+alt+y"`: invalid, because `shift` comes after `alt`
- `"meta+ctrl"`: invalid, because the key is missing
- `"meta+ctrl-cmd+k"`: invalid, because `ctrl-cmd` cannot be mixed with `meta` or `ctrl`
- `"lunix:x"`: invalid platform
- `"xy"`: invalid, because only one key can be used

## Handler

The handler receives a context object:

```ts
keyboard.bind({
  keys: "enter",
  run(context) {
    context.event;
    context.handler;
    context.template;
  },
});
```

Context fields:

- `context.event`: the original `KeyboardEvent`
- `context.handler`: the registered handler
- `context.template`: the matched template value, currently used by `$num`

Handler return values are ignored.

## Layers

Layers group handlers so they can be enabled or disabled together.

```ts
const editor = keyboard.layers.create("editor");

editor.bind({
  keys: "escape",
  run() {
    console.log("escape in editor layer");
  },
});

editor.disable();
editor.enable();
editor.toggle();
editor.off();
```

Create a disabled layer:

```ts
const modal = keyboard.layers.create("modal", true);
```

Manage layers globally:

```ts
keyboard.layers.enable("editor");
keyboard.layers.disable(["modal", "editor"]);
keyboard.layers.set("modal");
keyboard.layers.all();
keyboard.layers.none();
```

You can also assign layers directly through config:

```ts
keyboard.bind({
  keys: "escape",
  run() {},
  config: {
    layers: ["modal"],
  },
});
```

## Config

Keyboard-level config:

```ts
const keyboard = new Keyboard({
  debug: true,
  platform: "macos",
  signal: abortController.signal,
});
```

Handler config:

```ts
keyboard.bind({
  keys: "enter",
  run() {},
  config: {
    once: true,
    ignoreIfEditable: true,
    runIfFocused: [document.getElementById("email")],
    prevent: true,
    stop: true,
    when: true,
    signal: abortController.signal,
  },
});
```

Available handler config:

- `once`: remove the handler after the first run
- `ignoreIfEditable`: skip while an editable element is focused
- `runIfFocused`: only run if one of the provided elements is focused
- `prevent`: call `event.preventDefault()`
- `stop`: call `stopPropagation`, `stopImmediatePropagation`, or both
- `when`: boolean or predicate that controls whether the handler runs
- `layers`: layer names assigned to the handler
- `signal`: abort signal that removes the handler

`stop` accepts:

- `true`: call `event.stopPropagation()`
- `"immediate"`: call `event.stopImmediatePropagation()`
- `"both"`: call both propagation methods

## Directives

Directives are Nuxt-only. Pass the handler to `v-keybind` and use the directive arg as the key sequence.

```html
<input
  type="text"
  v-keybind:enter="
    () => {
      console.log('Hello, directive!');
    }
  "
/>
```

Put keyboard modifiers in the key sequence. `prevent` and `stop` are directive modifiers:

```html
<input type="text" v-keybind:ctrl+shift+enter.prevent.stop="onEnter" />
```

Use `ctrl-cmd` in the key sequence for the cross-platform Cmd/Ctrl key:

```html
<input type="text" v-keybind:ctrl-cmd+k="openCommandPalette" />
```

For platform-aware or multi-key bindings, use `useKeybind`.

The directive automatically limits the handler to that focused element.

## Changes

### v9.0.0

Rewrite started in `552b0f14cd5e71ccdf08d1e74d42da58115f70b9`.

- Replaced `useKeyboard()` with the `Keyboard` class
- Renamed `keyboard.listen` to `keyboard.bind`
- Changed key-string separators from `_` to `+`
- Changed catch-all key from `any` to `$any`
- Changed keybind data to `KeybindShape` / `CreateKeybindShape`
- Removed `parseKeyData`
- Added automatic initialization when `window` is available
- Kept Nuxt module support with `useKeybind`, `useKeybindLayer`, `useKeyboardInspector`, `useKeybindRecorder`, and `v-keybind`

### v8 -> v9

- Fixed run return type by ignoring it
- Changed separator from `_` to `+`
- Better and faster OS detection
- Removed stats

### v7.4 -> v8

- Added `parseKeyData` to parse key data into a key string
- Renamed `FormattedKeySequence` to `KeyData`
- `KeyData` can now also be used to define keys
- Changed `KeyData` format

### v7.3 -> v7.4

- Added `keyboard.exists` to check if a key-string handler already exists
- Added `config.when` to control whether a handler runs

### v7.2 -> v7.3

- Added `keyboard.layers` to create and manage layers
- Added Nuxt-only `useKeybindLayer` composable

### v7.1 -> v7.2

- Added `keyboard.subscribe` for inspecting active handlers
- Added `keyboard.record` to record a keybind
- Added `parseKeyString` to parse a key string into key data
- Added Nuxt-only `useKeyboardInspector` and `useKeybindRecorder`

### v7 -> v7.1

- Added `v-keybind` and `v-run` directives
- Allowed passing a single sequence as the `keys` argument instead of requiring an array

## Development

You need [Bun](https://bun.sh).

```bash
bun install
```

Commands:

- `bun test`: run tests
- `bunx tsc --noEmit`: run type checking
- `bun run lint`: run linting
- `bun run format`: format files
- `bun run format:check`: check formatting
- `bun playground:prepare`: install playground dependencies
- `bun playground`: start the playground

## Examples

Catch any key press:

```ts
keyboard.bind({
  keys: "$any",
  run(ctx) {
    console.log("Key pressed:", ctx.event.key);
  },
});
```

Run only when an input is focused:

```ts
const input = document.getElementById("myInput");

keyboard.bind({
  keys: "enter",
  run() {
    console.log("Enter pressed while input is focused");
  },
  config: {
    runIfFocused: [input],
  },
});
```

Prevent default behavior:

```ts
keyboard.bind({
  keys: "ctrl+r",
  run() {
    console.log("Refresh prevented");
  },
  config: {
    prevent: true,
  },
});
```

Run a handler only once:

```ts
keyboard.bind({
  keys: "escape",
  run() {
    console.log("Escape pressed once");
  },
  config: {
    once: true,
  },
});
```

Platform-aware undo and redo:

```ts
keyboard.bind([
  {
    // With ctr-cmd
    keys: "ctrl-cmd+z",
    run() {
      console.log("undo");
    },
  },
  {
    // Manually
    keys: ["no-macos:ctrl+shift+z", "macos:meta+shift+z"],
    run() {
      console.log("redo");
    },
  },
]);
```

Catch Alt plus any number:

```ts
keyboard.bind({
  keys: "alt+$num",
  run(ctx) {
    console.log("Number pressed:", ctx.template);
  },
});
```
