import type { KeyData } from "./helper";
import type { KeyString } from "./keys";

export interface HandlerContext {
  template?: number;
  listener: Listener;
  event: KeyboardEvent;
}

export type Handler = (context: HandlerContext) => unknown;

export interface Config {
  /**
   * Prevent default.
   * @default false
   */
  prevent?: boolean;
  /**
   * Stop propagation.
   * Note: this won't prevent other keyboard listeners on the same instance. You have to handle this youself.
   *
   * Possible values:
   * - `true`:
   *   Calls `event.stopPropagation()`, preventing the event from reaching parent targets but allowing any remaining listeners on this same element to run.
   * - `"immediate"`:
   *   Calls `event.stopImmediatePropagation()`, preventing any further listeners on this same element from running, but still allowing the event to bubble to parent targets.
   * - `"both"`:
   *   Stop *immediate* propagation (no further listeners on this same target)
   *   **and** prevent any propagation to parent targets.
   *
   * @default false
   */
  stop?: "immediate" | "both" | boolean;
  /**
   * Ignore listener if the user currently is in a editable element like input or textarea.
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
   * Boolean value or predicate function before each run whether the listener should run.
   */
  when?: boolean | (() => boolean | Promise<boolean>);

  signal?: AbortSignal;
}

export type Os = "macos" | "linux" | "windows" | "unknown";

export interface KeyboardConfig {
  /**
   * Print debug messages.
   * @default false
   */
  debug?: boolean;

  /**
   * Collect listener statistics, disable for minimal performance improvements.
   * @default true
   */
  stats?: boolean;

  /**
   * Platform of the user. Set this manually to override automatic detection.
   * If not set, `keyboard.init` will try to detect the platform itself.
   */
  platform?: Os;

  signal?: AbortSignal;
}

export interface LayerOptions {
  enabled?: boolean;
}

export interface ListenerStats {
  count: number;
  lastTrigger: Date | null;
}

export interface Listener {
  id: string;
  off: () => unknown;

  keys: KeyString[];
  handler: Handler;
  config: Config;

  stats: ListenerStats;
}

export type Handlers = Listener[];

export interface Options {
  keys: KeyString | KeyData | (KeyString | KeyData)[];
  run: Handler;
  config?: Config;
}

export type SubscribeCallback = (handlers: Handlers) => unknown;
