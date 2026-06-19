# Keyboard Manager

A simple yet powerful keybind manager compatible with vanilla and nuxt js.

[![testing](https://github.com/Waradu/keyboard/actions/workflows/testing.yml/badge.svg)](https://github.com/Waradu/keyboard/actions/workflows/testing.yml)

- [Install](#install)
- [Get Started](#get-started)
- [Nuxt](#nuxt)
- [Usage](#usage)
- [Key Sequence](#key-sequence)
- [Handler](#handler)
- [Layers](#layers)
- [Config](#config)
- [Directives (Nuxt)](#directives)
- [Changes](#changes)
- [Development](#development)
- [Examples](#examples)

## Install

```bash
bun install @waradu/keyboard
```

## Get Started

Start by importing `useKeyboard` and create a new keyboard instance.

```ts
import { useKeyboard } from "@waradu/keyboard";

const keyboard = useKeyboard();
```

## Nuxt

Nuxt users can use the built-in module that automatically creates and initializes a keyboard instance. It also cleans up listeners when the component unmounts.

First add the package to the modules in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ["@waradu/keyboard/nuxt"],
});
```

And then use it like this:

```ts
useKeybind({
  keys: ["a"],
  run() {
    console.log("A key pressed");
  },
});
```

You can also use [directives](#directives) if you want.

It is also possible to set up your own composable and plugin for more control. Just copy the templates from the links below and skip adding `@waradu/keyboard/nuxt` to your `nuxt.config.ts`:

- [Plugin](https://github.com/Waradu/keyboard/blob/main/src/nuxt/runtime/plugin.ts)
- [Composable](https://github.com/Waradu/keyboard/blob/main/src/nuxt/runtime/composables.ts)

You can also use the helper composable which returns a `ref` that stays in sync with `$keyboard.subscribe`:

```ts
const { listeners, unsubscribe } = useKeyboardInspector(); // auto unsubscribes on unmount
```

To record sequences in Nuxt, use the helper that wraps `keyboard.record` and cleans up on unmount:

```ts
// auto stops on unmount
const stop = useKeybindRecorder((sequence) => {
  console.log("pressed", sequence); // e.g. "control_shift_k"
});
```

If you need to access the useKeyboard instance use the Nuxt plugin.

```ts
const { $keyboard } = useNuxtApp();

$keyboard.destroy();
```

## Usage

Do not forget to call `keyboard.init();` once window is available.

A listener can be really simple. You just need one or more [key sequences](#key-sequence), a [handler](#handler) and the [config](#config) (optional).

```ts
const unlisten = keyboard.listen({
  keys: ["control_y", "control_shift_z"], // key sequences
  run() {
    // handler
    console.log("redo");
  },
  config: {
    // config
  },
});

// with key data
keyboard.listen({
  keys: [
    {
      key: "a",
      modifiers: ["alt"],
      platform: "macos",
    },
  ],
  run() {},
});
```

`keyboard.listen` returns a unlisten function that can be called to remove the listener.

```ts
const unlisten = keyboard.listen(...);
unlisten();
```

You can inspect all active listeners by subscribing:

```ts
const { listeners, unsubscribe } = keyboard.subscribe((handlers) => {
  console.log("changed", handlers);
});

console.log("current listeners", listeners);
unsubscribe();
```

You can also record key sequences to help users configure shortcuts:

```ts
const stop = keyboard.record((sequence) => {
  console.log("pressed", sequence); // e.g. "control_shift_k"
});

stop();
```

Parse a key string into parts:

```ts
import { parseKeyString } from "@waradu/keyboard";

parseKeyString("meta_shift_k");
// { modifiers: ["meta", "shift"], key: "k" }

parseKeyString("macos:meta_k");
// { platform: "macos", modifiers: ["meta"], key: "k" }

// invalid strings return undefined
parseKeyString("unknown_mod_k"); // undefined
```

Or reverse:

```ts
import { parseKeyData } from "@waradu/keyboard";

parseKeyData({ modifiers: ["meta", "shift"], key: "k" });
// "meta_shift_k"

parseKeyData({ platform: "macos", modifiers: ["meta"], key: "k" });
// "macos:meta_k"
```

It is also possible to define multiple keybinds in one `listen` call.

```ts
keyboard.listen([
  {
    keys: ["control_z"],
    run() {
      console.log("undo");
    },
  },
  {
    keys: ["control_shift_z"],
    run() {
      console.log("redo");
    },
  },
]);
```

## Key Sequence

Key sequences are just strings of characters defining the key that needs to be pressed to activate the listener. A listener can have multiple key sequences.

**Details:**

The structure looks like this (`?` = optional, `!` = required):
`"(platform:)?(meta_)?(control_)?(alt_)?(shift_)?(key)!"` or `"any"`

- `platform`: Optionally include or exclude certain platforms, for example `macos` or `no-linux`. **(experimental)**
- `modifiers`: Keys like `control` or `shift`. They have a fixed order but are optional.
- `key`: The actual key. Supports letters, numbers, symbols, templates and more (`f4`, `dollar`, `arrow-up`, `$num` etc.). This part is required. If you notice a missing character or symbol you need, please open an issue.

Meta is the equivalent of `windows key` on windows or `cmd` on macos.
The order is fixed, the `key` will always come last, `control` always after `meta` etc. The modifiers are not required.

Platform detection is not always reliable. Use it at your own risk, or create your own platform detector and set it through the [config](#config).

**Patterns:**

Currently there is only one template:

- `$num`: Match any number

**Examples:**

Some examples to get a better understanding:

- `"control_x"`: ✅
- `"meta_control_alt_shift_arrow-up"`: ✅
- `"c"`: ✅
- `"macos:x"`: ✅
- `"$num"`: ✅ (number pattern)
- `"any"`: ✅ (catch all)
- `""`: ❌ (empty string)
- `"shift_alt_y"`: ❌ (`shift` comes after `alt`)
- `"meta_control"`: ❌ (`key` is required)
- `"lunix:x"`: ❌ (`lunix` is not a valid platform)
- `"xy"`: ❌ (only one `key` at a time)

## Handler

The handler is a function that runs when the key sequence is pressed. It can be written in multiple ways.

```ts
keyboard.listen({
  ...
  run(context) { ... } // object method (preferred)
  run: (context) => { ... } // arrow function
  run: function (context) { ... } // function expression
  run: handleEvent // external function
  ...
});
```

### Context parameter

- `context.event`: The unchanged event from the event listener
- `context.listener`: The listener
- `context.template`: The result of the template if matched

## Layers

Layers are used to toggle multiple keybinds together.

```ts
// can also be a list like ["editor", "anotherlayer"]
const editor = keyboard.layers.create("editor", {
  enabled: true, // enabled by default
});

// these only apply to the layers defined above
editor.disable(); // disable the layer(s)
editor.enable(); // enable the layer(s)
editor.toggle(); // toggles each layer individually
editor.listen(...); // the same as keyboard.listen
editor.off(); // disables all listeners
```

You can also manage layers globally.

```ts
keyboard.layers.enable("editor");
keyboard.layers.disable(["anotherlayer", "editor"]);
keyboard.layers.set("anotherlayer"); // Only enable these and disable every other layers
keyboard.layers.all(); // Enable all layers
keyboard.layers.none(); // Disable all layers
```

in Nuxt there is a `useKeybindLayer` composable that auto unlistens on unmount.

## Config

You can set your own platform and skip the built-in detection from `keyboard.init`. Just pass one of these values as the `platform` option: "macos" | "linux" | "windows" | "unknown". This is needed for the [key sequences](#key-sequence) platform prefix.

```ts
const detectedPlatform = await yourOwnPlatformDetection();

const keyboard = useKeyboard({
  platform: detectedPlatform,
});
```

Each listener can also be configure separately. All keys are optional.

```ts
const emailInput = document.getElementById("emailInput"); // Normal
const passwordInput = useTemplateRef("passwordInput"); // Nuxt

keyboard.listen({
  ...
  config: {
    // Remove the listener after one run.
    once: true,

    // Ignore the listener if any text element like input is focused.
    ignoreIfEditable: true,

    // A list of elements which one has to be focused for the listener to run.
    // The DOM needs to be ready ("DOMContentLoaded" or onMounted (nuxt)).
    runIfFocused: [emailInput, passwordInput],

    // Call preventDefault() before run.
    prevent: true,

    // Call stopPropagation() before run. (use "immediate" for stopImmediatePropagation() and "both" for both).
    stop: true,

    // Boolean value or predicate function before each run whether the listener should run.
    when: true,
  }
});
```

Also you can pass a `signal` to the config or the useKeyboard to abort them with a `signal`.

## Directives

This is Nuxt only.

Add a keybind listener to any element by combining `v-keybind` and `v-run` on the same element.

```html
<input
  type="text"
  v-keybind="'enter'"
  v-run="
    () => {
      console.log('Hello, Directive!');
    }
  "
/>
```

You can also use modifiers to prevent the default browser behavior and/or run the handler only once:

```html
<input type="text" v-keybind.prevent.once="'enter'" v-run="onEnter" />
```

Both `v-keybind` and `v-run` must be defined on the same element. If one of them is missing, the keybind will not be registered.

The function passed to `v-run` behaves the same as the `run` callback in `keyboard.listen` or `useKeybind` (Nuxt). This means you can also use the `HandlerContext` parameter:

```html
<input
  type="text"
  v-keybind="['no-macos:control_$num', 'macos:meta_$num']"
  v-run="
    (ctx: HandlerContext) => {
      console.log(ctx.template);
    }
  "
/>
```

## Changes

### v8 -> v9

- Fixed run return type by ignoring it
- Changed seperator from "\_" to "+"
- Better and faster os detection
- Removed stats

### v7.4 -> v8

- Added `parseKeyData` to parse a key data into a key string
- Renamed `FormattedKeySequence` to `KeyData`
- `KeyData` can now also be used to define keys
- Changed `KeyData` format

### v7.3 -> v7.4

- Added `keyboard.exists` to check if a Key String listener already exists.
- Added `config.when` to control whether a listener runs, using either a boolean or a predicate function.

### v7.2 -> v7.3

- Added `keyboard.layers` to create and manage layers
- Added Nuxt-only `useKeybindLayer` composable

### v7.1 -> v7.2

- Added `keyboard.subscribe` for inspecting active listeners
- Added `keyboard.record` to record a key sequence
- Added `parseKeyString` to parse a key string into key data
- Added Nuxt-only `useKeyboardInspector` and `useKeybindRecorder` helper

### v7 -> v7.1 Directives

- Added `v-keybind` and `v-run` directives
- Allow passing a single sequence as the `keys` argument instead of requiring an array

### v6.2 -> v7 Key Templates

- Added `context` to handler
- `$num` key template
- Fixed a bug that ignored the order of key presses
- `any` will no longer trigger when a modifier is pressed

### v5 -> v6 Platform-specific keybinds

- Use `e.key` instead of `e.code`
- Support multiple keybinds per listener
- No longer need to use `Key.*`
- Rewrite `runIfFocused` to allow multiple targets
- Ignore `event.isComposing` and Dead keys
- Remove `ignoreCase`
- Platform specific keybinds.
- Restructure

## Development

You need [bun](https://bun.sh).

1. `bun install`
2. 👍

Start Playground:

1. `bun playground:prepare`
2. `bun playground`
3. 👍

Commands:

- `bun test`: run tests
- `bun test-types`: run type tests
- `bun playground`: start playground

## Examples

Catch any key press:

```ts
keyboard.listen({
  keys: ["any"],
  run(ctx) {
    console.log("Key pressed:", ctx.event.key);
  },
});
```

Run only when an input is focused:

```ts
const input = document.getElementById("myInput");
keyboard.listen({
  keys: ["enter"],
  run() {
    console.log("Enter pressed while input is focused");
  },
  config: {
    runIfFocused: [input],
  },
});
```

Prevent default behavior (disable refresh with Ctrl+R):

```ts
keyboard.listen({
  keys: ["control_r"],
  run() {
    console.log("Refresh prevented!");
  },
  config: {
    prevent: true,
  },
});
```

Run a listener only once:

```ts
keyboard.listen({
  keys: ["escape"],
  run() {
    console.log("Escape pressed, this will only log once.");
  },
  config: {
    once: true,
  },
});
```

Platform aware undo/redo:

```ts
keyboard.listen([
  {
    keys: ["no-macos:control_z", "macos:meta_z"],
    run() {
      console.log("undo");
    },
  },
  {
    keys: ["no-macos:control_shift_z", "macos:meta_shift_z"],
    run() {
      console.log("redo");
    },
  },
]);
```

Catch alt with any number:

```ts
keyboard.listen({
  keys: ["alt_$num"],
  run(ctx) {
    console.log("Key pressed:", ctx.template!); // 0..9
  },
});
```
