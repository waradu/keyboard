import type { KeyString } from "../src/keys";

// Should not have any TypeScript errors

[
  // Simple KeyString
  "ctrl+x",

  // Complex KeyString
  "meta+ctrl+alt+shift+arrow-up",

  // Platform primary modifier
  "ctrl-cmd+shift+k",

  // Single Key
  "c",

  // Platform
  "macos:x",

  // Templates
  "alt+$num",

  // Catch all
  "$any",

  // @ts-expect-error empty string
  "",

  // @ts-expect-error `shift` comes after `alt`
  "shift+alt+y",

  // @ts-expect-error `key` is required
  "meta+ctrl",

  // @ts-expect-error `ctrl-cmd` cannot be mixed with `meta`
  "meta+ctrl-cmd+k",

  // @ts-expect-error `ctrl-cmd` cannot be mixed with `ctrl`
  "ctrl+ctrl-cmd+k",

  // @ts-expect-error `lunix` is not a valid platform
  "lunix:x",

  // @ts-expect-error only one `key` at a time
  "xy",
] satisfies KeyString[];
