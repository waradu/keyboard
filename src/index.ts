import { merge, detectOsInBrowser, isEditableElement } from "./helper";
import { Keybind } from "./keybind";
import {
  ANYKEY,
  keys,
  type KeyKey,
  type KeySequence,
  type KeyString,
  type KeyValue,
  type ModifierValue,
} from "./keys";
import type {
  KeyboardConfig,
  Config,
  Handler,
  Handlers,
  SubscribeCallback,
  Options,
  KeybindShape,
  HandlerContext,
  OptionsKeys,
} from "./types";

export class Keyboard {
  private handlers: Handlers = [];
  private allLayers = new Set<string>();
  private disabledLayers = new Set<string>();
  private subscribers: SubscribeCallback[] = [];
  private pressed = new Set<KeyValue>();
  private abortSignalListeners?: AbortController;
  ready: boolean = false;
  paused: boolean = false;

  constructor(private config: KeyboardConfig = {}) {
    if (!config.noInit) this.init();
  }

  private log(...data: any[]) {
    if (this.config.debug) console.log("<KEYBOARD>", ...data);
  }

  private onKeydown = (event: KeyboardEvent) => {
    if (this.paused) return;
    if (event.isComposing) return;

    const eventKey = event.key.toLowerCase();
    const key = keys[eventKey as KeyKey];

    if (key) {
      this.pressed.add(key);
      this.log(`pressed '${key}'`);
    }

    const candidates = this.handlers.filter((handler) => {
      for (const key of handler.keys) {
        const browserPlatform = this.config.platform ?? detectOsInBrowser();

        if (key.platform) {
          if (key.platform === "linux" && browserPlatform !== "linux") continue;
          if (key.platform === "win" && browserPlatform !== "windows") continue;
          if (key.platform === "macos" && browserPlatform !== "macos") continue;
          if (key.platform === "no-linux" && browserPlatform === "linux") continue;
          if (key.platform === "no-win" && browserPlatform === "windows") continue;
          if (key.platform === "no-macos" && browserPlatform === "macos") continue;
        }

        if (key.key !== ANYKEY) {
          const pressedArray = Array.from(this.pressed);
          const firstKey = pressedArray[pressedArray.length - 1];

          if (!firstKey) continue;

          if (key.key === "$num" && Number.isNaN(parseInt(firstKey!))) {
            continue;
          } else if (key.key !== "$num" && firstKey !== key.key) {
            continue;
          }

          if (key.modifiers.shift !== event.shiftKey) continue;
          if (key.modifiers.alt !== event.altKey) continue;
          const ctrlCmd = key.modifiers.ctrlCmd;
          const expectsCtrl = key.modifiers.ctrl || (ctrlCmd && browserPlatform !== "macos");
          const expectsMeta = key.modifiers.meta || (ctrlCmd && browserPlatform === "macos");
          if (expectsCtrl !== event.ctrlKey) continue;
          if (expectsMeta !== event.metaKey) continue;
        }

        if (!handler.config.layers || handler.config.layers.length === 0) return true;

        return handler.config.layers.some((layer) => !this.disabledLayers.has(layer));
      }

      return false;
    });

    if (candidates.length === 0) return;

    candidates.forEach((handler) => {
      const activeElement = document.activeElement;

      if (
        handler.config?.ignoreIfEditable &&
        activeElement &&
        activeElement instanceof Element &&
        isEditableElement(activeElement)
      )
        return;

      if (handler.config?.runIfFocused) {
        const run = handler.config?.runIfFocused;

        if (Array.isArray(run)) {
          if (
            !run.some((element) => {
              return element && document.activeElement && element === document.activeElement;
            })
          )
            return;
        }
      }

      if (!handler.config.when) {
        return;
      } else if (typeof handler.config.when === "function") {
        try {
          const when = handler.config.when();
          if (!when) return;
        } catch (e) {
          console.error(e);
          return;
        }
      }

      if (handler.config?.prevent) event.preventDefault();
      if (handler.config?.stop === true) event.stopPropagation();
      if (handler.config?.stop === "immediate") event.stopImmediatePropagation();
      if (handler.config?.stop === "both") {
        event.stopPropagation();
        event.stopImmediatePropagation();
      }

      const pressedKeysArray = Array.from(this.pressed);
      const pressedNumber = parseInt(pressedKeysArray[pressedKeysArray.length - 1]!);

      handler.handler({
        template: Number.isNaN(pressedNumber) ? undefined : pressedNumber,
        handler,
        event,
      });

      this.log(`handled '${handler.id}'`);

      if (handler.config?.once) this.unbind(handler.id);
    });
  };

  private onKeyup = (event: KeyboardEvent) => {
    if (event.isComposing) return;

    const eventKey = event.key.toLowerCase();
    const key = keys[eventKey as KeyKey];
    this.pressed.delete(event.key as KeyValue);

    if (key) {
      this.pressed.delete(key);
      this.log(`released '${key}'`);
    }
  };

  private onBlur = () => {
    this.pressed.clear();
    this.log("cleared due to blur");
  };

  /**
   * Clear all listeners.
   */
  clear() {
    while (this.handlers.length > 0) {
      const handler = this.handlers[0];
      if (!handler) break;
      handler.off();
    }
    this.handlers.length = 0;
    this.allLayers.clear();
    this.disabledLayers.clear();
    this.pressed.clear();
    this.log(`cleared`);

    this.notify();
  }

  /**
   * Removes all event handlers.
   * To re-enable listening after calling this, call `init()` again.
   */
  stop() {
    this.abortSignalListeners?.abort();
    this.abortSignalListeners = undefined;

    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.onKeydown);
      window.removeEventListener("keyup", this.onKeyup);
      window.removeEventListener("blur", this.onBlur);
      this.pressed.clear();

      this.ready = false;

      this.log("stopped");
    }
  }

  /**
   * Removes all event handlers and clears any stored key state.
   * Use this if you are not planning to re-enable listening with `init()` after.
   */
  destroy() {
    this.stop();
    this.clear();
  }

  /**
   * Temporarily pause listener
   */
  pause() {
    this.paused = true;
  }

  /**
   * Resume listener
   */
  resume() {
    this.paused = false;
  }

  /**
   * Toggle paused state
   */
  toggle() {
    this.paused = !this.paused;
  }

  /**
   * Initialize the keyboard. Call this when `window` is available (it will fail silently).
   * You can define listeners before initializing.
   */
  async init(opts?: { signal?: AbortSignal }) {
    this.stop();

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.onKeydown);
      window.addEventListener("keyup", this.onKeyup);
      window.addEventListener("blur", this.onBlur);

      this.ready = true;

      const configSignal = this.config.signal;
      const initSignal = opts?.signal;

      if (configSignal?.aborted || initSignal?.aborted) {
        this.destroy();
        return;
      }

      if (configSignal || initSignal) {
        this.abortSignalListeners = new AbortController();

        if (configSignal) {
          configSignal.addEventListener("abort", () => this.destroy(), {
            once: true,
            signal: this.abortSignalListeners.signal,
          });
        }

        if (initSignal && initSignal !== configSignal) {
          initSignal.addEventListener("abort", () => this.destroy(), {
            once: true,
            signal: this.abortSignalListeners.signal,
          });
        }
      }

      this.log("initialized");
    } else {
      this.log("ERROR: window was not found to initialize");
    }
  }

  /**
   * Create new handler.
   *
   * @param handler Handler options.
   * @returns Unlisten function
   *
   * @example
   * ```ts
   * keyboard.bind({
   *   keys: "alt+a",
   *   run() {
   *     console.log("Alt + A key pressed");
   *   }
   * });
   * ```
   */
  bind(handler: Options): () => void;
  /**
   * Create new handlers.
   *
   * @param options Multiple handlers with options.
   * @param config The config that gets applied to all handlers.
   * @returns Unlisten function
   *
   * @example
   * ```ts
   * keyboard.bind([
   *   {
   *     keys: "alt+a",
   *     run() {
   *       console.log("Alt + A key pressed");
   *     }
   *   },
   *   {
   *     keys: "alt+b",
   *     run() {
   *       console.log("Alt + B key pressed");
   *     }
   *   },
   * ]);
   * ```
   */
  bind(handlers: Options[], config?: Config): () => void;
  bind(options: Options | Options[], config: Config = {}): () => void {
    if (!Array.isArray(options)) {
      options = [options];
    }

    let layers: string[] = [...(config.layers ?? [])];

    for (const option of options) {
      layers = [...layers, ...(option.config?.layers ?? [])];
    }

    layers.forEach((layer) => this.allLayers.add(layer));

    const results = options.map((option) => {
      const local = merge<Config>(option.config, config, {
        prevent: false,
        stop: false,
        ignoreIfEditable: false,
        once: false,
        when: true,
      });

      local.layers = [...(local.layers ?? []), ...(config.layers ?? [])];

      if (local.signal?.aborted) return;

      if (!Array.isArray(option.keys)) {
        option.keys = [option.keys];
      }

      let keys = option.keys.map((key) => Keybind.from(key)).filter((k) => !!k);

      const id = Math.random().toString(36).slice(2, 7);

      const off = () => {
        const index = this.handlers.findIndex((handler) => handler.id === id);
        if (index === -1) return;

        this.handlers.splice(index, 1);
        local.signal?.removeEventListener("abort", off);
        this.log(`removed: '${id}'`);
        this.notify();
      };
      if (local?.signal) local.signal.addEventListener("abort", off, { once: true });

      const handler: Handler = {
        id,
        off,
        keys: keys,
        handler: option.run,
        config: local,
      };

      this.handlers.push(handler);

      this.log(`added '${option.keys.join(", ")}' with id: '${id}'`);

      return { id, off };
    });

    this.notify();

    return () => {
      results.forEach((result) => result?.off());
    };
  }

  unbind(id: string) {
    this.handlers.find((handler) => handler.id === id)?.off();
  }

  private notify() {
    this.subscribers.forEach((cb) => cb([...this.handlers]));
  }

  /**
   * Subscribe to changes of all registered keyboard listeners.
   *
   * The callback is called:
   * - once immediately with the current listeners
   * - on every add/remove/clear of listeners
   *
   * @param callback Receives the current list of listeners on each change.
   * @returns Function to unsubscribe from further updates.
   */
  subscribe(cb: SubscribeCallback) {
    this.subscribers.push(cb);
    cb([...this.handlers]);
    return () => {
      this.subscribers = this.subscribers.filter((fn) => fn !== cb);
    };
  }

  /**
   * Check if Key String listener already exists.
   */
  exists(sequence: OptionsKeys) {
    const shape = Keybind.from(sequence);
    if (!shape) return false;

    return this.handlers.some((handler) => {
      for (const key of handler.keys) {
        if (key.equals(shape)) return true;
      }

      return false;
    });
  }

  /**
   * Record pressed keys and emit them as a Keybind.
   *
   * @param callback Receives each recorded keybind.
   * @returns Function to stop recording.
   */
  record(cb: (keybind: Keybind) => void) {
    const handler = (event: KeyboardEvent): Keybind | undefined => {
      if (event.isComposing) return;

      const eventKey = event.key.toLowerCase();
      const key = keys[eventKey as KeyKey];

      if (!key) return;

      cb(
        Keybind.fromShape({
          key,
          modifiers: {
            shift: event.shiftKey,
            alt: event.altKey,
            ctrl: event.ctrlKey,
            ctrlCmd: false,
            meta: event.metaKey,
          },
        }),
      );
    };

    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }

    this.log("ERROR: window was not found for recording");
    return () => {};
  }

  layers = {
    /**
     * Create new keybind layer.
     */
    create: (layer: string, disabled?: boolean) => {
      const offs: (() => void)[] = [];

      this.allLayers.add(layer);
      if (disabled) this.disabledLayers.add(layer);

      return {
        /**
         * Disable this layer
         */
        disable: () => {
          this.disabledLayers.add(layer);
        },
        /**
         * Enable this layer
         */
        enable: () => {
          this.disabledLayers.delete(layer);
        },
        /**
         * Enable this layer
         */
        toggle: () => {
          if (this.disabledLayers.has(layer)) {
            this.disabledLayers.delete(layer);
          } else {
            this.disabledLayers.add(layer);
          }
        },
        bind: ((...args: Parameters<typeof this.bind>) => {
          const config = { ...args[1] };
          if (!config.layers) config.layers = [];
          config.layers.push(layer);

          const binding = this.bind(args[0], config);
          offs.push(binding);
          return binding;
        }) as typeof this.bind,
        /**
         * Disables all listeners in this layer.
         */
        off: () => {
          for (const off of offs) {
            off();
          }
        },
      };
    },
    /**
     * Enable specific layers.
     */
    enable: (layers: string | string[]) => {
      if (!Array.isArray(layers)) {
        layers = [layers];
      }

      for (const layer of layers) {
        this.disabledLayers.delete(layer);
      }
    },
    /**
     * Disable specific layers.
     */
    disable: (layers: string | string[]) => {
      if (!Array.isArray(layers)) {
        layers = [layers];
      }

      for (const layer of layers) {
        this.disabledLayers.add(layer);
      }
    },
    /**
     * Set active layers.
     */
    set: (layers: string | string[]) => {
      if (!Array.isArray(layers)) {
        layers = [layers];
      }

      this.disabledLayers.clear();

      for (const layer of this.allLayers) {
        if (layers.includes(layer)) continue;
        this.disabledLayers.add(layer);
      }
    },
    /**
     * Enable all layers.
     */
    all: () => {
      this.disabledLayers.clear();
    },
    /**
     * Disable all layers.
     */
    none: () => {
      for (const layer of this.allLayers) {
        this.disabledLayers.add(layer);
      }
    },
  };
}

export type {
  Config,
  KeyString,
  Options,
  Handler,
  Handlers,
  HandlerContext,
  KeySequence,
  KeybindShape,
  KeyValue,
  ModifierValue,
  OptionsKeys,
};
export { Keybind };
