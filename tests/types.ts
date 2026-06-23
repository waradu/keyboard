import type { KeyString } from "../src/keys";

// Should not have any typescript errors

[
  // Simple KeyString
  "control+x",

  // Complex KeyString
  "meta+control+alt+shift+arrow-up",

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
  "meta+control",

  // @ts-expect-error `lunix` is not a valid platform
  "lunix:x",

  // @ts-expect-error only one `key` at a time
  "xy",
] satisfies KeyString[];
