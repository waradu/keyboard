import type { KeyString } from "../src/keys";

// Should not have any typescript errors

[
  // Simple KeyString
  "control_x",

  // Complex KeyString
  "meta_control_alt_shift_arrow-up",

  // Single Key
  "c",

  // Platform
  "macos:x",

  // Templates
  "alt_$num",

  // Catch all
  "any",

  // @ts-expect-error empty string
  "",

  // @ts-expect-error `shift` comes after `alt`
  "shift_alt_y",

  // @ts-expect-error `key` is required
  "meta_control",

  // @ts-expect-error `lunix` is not a valid platform
  "lunix:x",

  // @ts-expect-error only one `key` at a time
  "xy",
] satisfies KeyString[];
