import type { Keybind } from "./keybind";
import type { AnyKey, KeyString, KeyValue, ModifierValue, PlatformValue } from "./keys";

export type Os = "macos" | "linux" | "windows" | "unknown";

export interface KeyboardConfig {
  /**
   * Print debug messages.
   * @default false
   */
  debug?: boolean;

  /**
   * Platform of the user. Set this manually to override automatic detection.
   * If not set, the package will try to detect the platform itself.
   */
  platform?: Os;

  /**
   * Disable the automatic initialization attempt if window is available.
   */
  noInit?: boolean;

  signal?: AbortSignal;
}

export interface KeybindShape {
  platform?: PlatformValue;
  modifiers: Record<ModifierValue, boolean>;
  key: KeyValue | AnyKey;
}

export interface CreateKeybindShape {
  platform?: PlatformValue;
  modifiers?: Partial<Record<ModifierValue, boolean>>;
  key: KeyValue | AnyKey;
}

export interface HandlerContext {
  template?: number;
  handler: Handler;
  event: KeyboardEvent;
}

export interface Config {
  /**
   * Prevent default.
   * @default false
   */
  prevent?: boolean;
  /**
   * Stop propagation.
   * Note: this won't prevent other keyboard listeners on the same instance. You have to handle this yourself.
   *
   * Possible values:
   * - `true`:
   *   Calls `event.stopPropagation()`, preventing the event from reaching parent targets but allowing any remaining listeners on this same element to run.
   * - `"immediate"`:
   *   Calls `event.stopImmediatePropagation()`, preventing any further listeners on this same element and parents from running.
   * - `"both"`:
   *   Stop *immediate* propagation (no further listeners on this same target)
   *   **and** prevent any propagation to parent targets.
   *
   * @default false
   */
  stop?: "immediate" | "both" | boolean;
  /**
   * Ignore listener if the user currently is in an editable element like input or textarea.
   * @default false
   */
  ignoreIfEditable?: boolean;
  /**
   * Only run listener if one of the `runIfFocused` elements is focused.
   *
   * **IMPORTANT**: if runIfFocused is an empty list the listener will not run.
   * @example
   * ```ts
   * { ... } // listener will run,
   * { ..., runIfFocused: [element, element] } // listener will run if one of the elements is focused
   * { ..., runIfFocused: [] } // listener will not run!
   * ```
   */
  runIfFocused?: (HTMLElement | null | undefined)[];
  /**
   * Only listen once and then remove the listener.
   * @default false
   */
  once?: boolean;
  /**
   * Keybind layer.
   * Prefer the use of `keyboard.layer` or `useKeybindLayer` (nuxt) to group listeners into layers.
   */
  layers?: string[];
  /**
   * Boolish value or predicate function before each run whether the listener should run.
   */
  when?: unknown | (() => unknown);

  signal?: AbortSignal;
}

export type HandlerFunc = (context: HandlerContext) => unknown;

export interface Handler {
  id: string;
  off: () => unknown;

  keys: Keybind[];
  handler: HandlerFunc;
  config: Config;
}

export type Handlers = Handler[];

export type OptionsKeys = KeyString | CreateKeybindShape | Keybind;

export interface Options {
  keys: OptionsKeys | OptionsKeys[];
  run: HandlerFunc;
  config?: Config;
}

export type SubscribeCallback = (handlers: Handlers) => unknown;
