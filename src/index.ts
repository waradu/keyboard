import { detectOsInBrowser, isEditableElement, parseKeyString, parseKeyData } from "./helper";
import type { KeyData } from "./helper";
import {
  keys,
  modifiers,
  type KeyKey,
  type KeySequence,
  type KeyString,
  type KeyValue,
  type ModifierKey,
  type ModifierValue,
  type PlatformValue,
} from "./keys";
import type {
  Config,
  Handlers,
  KeyboardConfig,
  Handler,
  HandlerContext,
  Options,
  Os,
  Listener,
  SubscribeCallback,
  LayerOptions,
} from "./types";

/**
 * Create a keyboard listener.
 *
 * @param config Optional settings to configure the keyboard.
 */
export const useKeyboard = (config?: KeyboardConfig) => {
  config = {
    debug: false,
    stats: true,
    ...Object.fromEntries(Object.entries(config ?? {}).filter(([, v]) => v !== undefined)),
  };

  const instanceSignal = config.signal;
  let listeners: Handlers = [];
  let detectedPlatform: Os | null = config.platform ?? null;
  const disabledLayers = new Set<string>();
  const allLayers = new Set<string>();

  const pressedKeys = new Set<KeyValue>();
  const pressedModifiers = new Set<ModifierValue>();

  const log = (...text: string[]) => {
    if (config.debug) console.log(`<KEYBOARD>`, ...text);
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.isComposing) return;

    const k = event.key.toLowerCase();

    log(`pressed '${k}'`);

    if (modifiers[k as ModifierKey]) {
      pressedModifiers.add(modifiers[k as ModifierKey]);
      return;
    } else if (keys[k as KeyKey]) {
      pressedKeys.add(keys[k as KeyKey]);
    }

    const candidates = listeners.filter((l) => {
      for (let key of l.keys) {
        if (key == "any") return true;

        let platform: PlatformValue | undefined;

        if (key.includes(":")) {
          [platform, key] = key.split(":") as [PlatformValue, KeySequence];
        }

        if (platform) {
          if (platform === "linux" && detectedPlatform !== "linux") continue;
          if (platform === "win" && detectedPlatform !== "windows") continue;
          if (platform === "macos" && detectedPlatform !== "macos") continue;
          if (platform === "no-linux" && detectedPlatform === "linux") continue;
          if (platform === "no-win" && detectedPlatform === "windows") continue;
          if (platform === "no-macos" && detectedPlatform === "macos") continue;
        }

        let [k, ...mods] = key.split("_").reverse() as [KeyValue, ...ModifierValue[]];

        const pressedKeysArray = Array.from(pressedKeys);
        const firstKey = pressedKeysArray[pressedKeysArray.length - 1];
        if (k === "$num" && Number.isNaN(parseInt(firstKey!))) {
          continue;
        } else if (k !== "$num" && !Array.from(pressedKeys).includes(k)) {
          continue;
        }

        if (
          pressedModifiers.size !== mods.length ||
          !Array.from(pressedModifiers).every((modifier) => mods.includes(modifier))
        ) {
          continue;
        }

        const hasActiveLayer = l.config.layers?.some((layer) => !disabledLayers.has(layer));

        return hasActiveLayer ?? true;
      }

      return false;
    });

    if (candidates.length === 0) return;

    candidates.forEach(async (listener) => {
      const activeElement = document.activeElement;

      if (
        listener.config?.ignoreIfEditable &&
        activeElement &&
        activeElement instanceof Element &&
        isEditableElement(activeElement)
      )
        return;

      if (listener.config?.runIfFocused) {
        const run = listener.config?.runIfFocused;

        if (Array.isArray(run)) {
          if (
            !run.some((element) => {
              return element && document.activeElement && element == document.activeElement;
            })
          )
            return;
        }
      }

      if (listener.config?.prevent) event.preventDefault();
      if (listener.config?.stop === true) event.stopPropagation();
      if (listener.config?.stop === "immediate") event.stopImmediatePropagation();
      if (listener.config?.stop === "both") {
        event.stopPropagation();
        event.stopImmediatePropagation();
      }

      const pressedKeysArray = Array.from(pressedKeys);
      const pressedNumber = parseInt(pressedKeysArray[pressedKeysArray.length - 1]!);

      if (!listener.config.when) {
        return;
      } else if (typeof listener.config.when === "function") {
        try {
          const when = await listener.config.when();
          if (!when) return;
        } catch (e) {
          console.error(e);
          return;
        }
      }

      listener.handler({
        template: Number.isNaN(pressedNumber) ? undefined : pressedNumber,
        listener: listener,
        event: event,
      });

      if (config.stats) {
        listeners.forEach(async (l) => {
          if (l.id == listener.id) {
            l.stats.count += 1;
            l.stats.lastTrigger = new Date();
            return;
          }
        });
      }

      log(`handled '${listener.id}'`);

      if (listener.config?.once) unlisten(listener.id);
    });

    if (config.stats) notify();
  };

  const onKeyup = (event: KeyboardEvent): void => {
    if (event.isComposing) return;

    const k = event.key.toLowerCase();

    if (modifiers[k as ModifierKey]) {
      pressedModifiers.delete(modifiers[k as ModifierKey]);
    } else if (keys[k as KeyKey]) {
      pressedKeys.delete(keys[k as KeyKey]);
    }

    log(`released '${k}'`);
  };

  const onBlur = () => {
    pressedKeys.clear();
    pressedModifiers.clear();
    log("cleared due to blur");
  };

  const clear = (): void => {
    for (const l of listeners) l.off?.();
    listeners = [];
    pressedKeys.clear();
    pressedModifiers.clear();
    log(`cleared`);

    notify();
  };

  const stop = (): void => {
    if (typeof window !== "undefined" && typeof window.removeEventListener === "function") {
      window.removeEventListener("keydown", onKeydown);
      window.removeEventListener("keyup", onKeyup);
      window.removeEventListener("blur", onBlur);
    }

    log("stopped");
  };

  const destroy = (): void => {
    stop();
    clear();
  };

  const init = async (opts?: { signal?: AbortSignal }) => {
    stop();
    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("keydown", onKeydown);
      window.addEventListener("keyup", onKeyup);
      window.addEventListener("blur", onBlur);

      const abortSignal = opts?.signal ?? instanceSignal;
      if (abortSignal) {
        if (abortSignal.aborted) destroy();
        else abortSignal.addEventListener("abort", destroy, { once: true });
      }

      if (!detectedPlatform)
        detectOsInBrowser().then((res) => {
          if (["macos", "linux", "windows"].includes(res)) detectedPlatform = res;
          log("platform detected as:", res);
        });

      log("initialized");
    } else {
      log("ERROR: window was not found");
    }
  };

  const unlisten = (id: string) => {
    const index = listeners.findIndex((l) => l.id === id);
    if (index !== -1 && listeners[index]) {
      listeners[index].off();
      listeners.splice(index, 1);
      log(`removed: '${id}'`);
    }

    notify();
  };

  const listen = (options: Options | Options[]) => {
    if (!Array.isArray(options)) {
      options = [options];
    }

    options.forEach((option) => {
      if (option.config?.layers) {
        for (const layer of option.config.layers) {
          allLayers.add(layer);
        }
      }
    });

    const results = options
      .map((option) => {
        const cleanConfig = Object.fromEntries(
          Object.entries(option.config ?? {}).filter(([, v]) => v !== undefined),
        );

        const config: Config = {
          prevent: false,
          stop: false,
          ignoreIfEditable: false,
          once: false,
          when: true,
          ...cleanConfig,
        };

        if (!Array.isArray(option.keys)) {
          option.keys = [option.keys];
        }

        let keys = option.keys.map((key) => (typeof key === "string" ? key : parseKeyData(key)));

        if (keys.includes("any")) {
          keys = ["any"];
        }

        if (config?.signal?.aborted) return;

        const id = Math.random().toString(36).slice(2, 7);

        const onAbort = () => unlisten(id);
        if (config?.signal) config.signal.addEventListener("abort", onAbort, { once: true });

        const listener: Listener = {
          id,
          off: () => config.signal?.removeEventListener("abort", onAbort),

          keys: keys,
          handler: option.run,
          config: config,

          stats: {
            count: 0,
            lastTrigger: null,
          },
        };

        listeners.push(listener);

        notify();

        log(`added '${option.keys.join(", ")}' with id: '${id}'`);

        return { id, onAbort };
      })
      .filter((result) => !!result);

    return () => {
      results.forEach((result) => {
        if (config.signal) config.signal.removeEventListener("abort", result.onAbort);
        unlisten(result.id);
      });
    };
  };

  let subscribers: SubscribeCallback[] = [];

  const notify = () => {
    subscribers.forEach((cb) => cb([...listeners]));
  };

  const subscribe = (cb: SubscribeCallback) => {
    subscribers.push(cb);
    cb([...listeners]);
    return () => {
      subscribers = subscribers.filter((fn) => fn !== cb);
    };
  };

  const record = (cb: (sequence: KeySequence) => void) => {
    const handler = (event: KeyboardEvent) => {
      if (event.isComposing) return;

      const key = keys[event.key.toLowerCase() as KeyKey];
      if (!key || modifiers[event.key.toLowerCase() as ModifierKey]) return;

      const sequenceParts: ModifierValue[] = [];
      if (event.metaKey) sequenceParts.push(modifiers.meta);
      if (event.ctrlKey) sequenceParts.push(modifiers.control);
      if (event.altKey) sequenceParts.push(modifiers.alt);
      if (event.shiftKey) sequenceParts.push(modifiers.shift);

      const sequence = sequenceParts.length
        ? (`${sequenceParts.join("_")}_${key}` as KeySequence)
        : (key as KeySequence);

      cb(sequence);
    };

    if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }

    log("ERROR: window was not found");
    return () => {};
  };

  const layers = {
    /**
     * Create new keybind layer.
     */
    create: (layers: string | string[], layerOptions?: LayerOptions) => {
      const offs: (() => void)[] = [];

      if (!Array.isArray(layers)) {
        layers = [layers];
      }

      layerOptions = {
        enabled: true,
        ...layerOptions,
      };

      return {
        /**
         * Disable these layers
         */
        disable: () => {
          for (const layer of layers) {
            disabledLayers.add(layer);
          }
        },
        /**
         * Enable these layers
         */
        enable: () => {
          for (const layer of layers) {
            disabledLayers.delete(layer);
          }
        },
        /**
         * Enable these layers
         */
        toggle: () => {
          for (const layer of layers) {
            if (disabledLayers.has(layer)) {
              disabledLayers.delete(layer);
            } else {
              disabledLayers.add(layer);
            }
          }
        },
        /**
         * Create new listener.
         *
         * @param keys Key sequence to listen to.
         * @param handler Handler function.
         * @param config Optional settings to configure the listener.
         * @returns Unlisten function
         *
         * @example
         * ```ts
         * const unlisten = keyboard.listen([Key.Alt, Key.A], () => {
         *   message.value = "Alt + A key pressed";
         * });
         *
         * unlisten();
         * ```
         */
        listen: (options: Options | Options[]) => {
          if (!Array.isArray(options)) {
            options = [options];
          }

          options.forEach((option) => {
            if (!option.config) option.config = {};
            option.config.layers = [...(option.config.layers ?? []), ...layers];
          });

          if (!layerOptions.enabled) {
            for (const layer of layers) {
              disabledLayers.add(layer);
            }
          }

          const off = listen(options);
          offs.push(off);
          return off;
        },
        /**
         * Disables all listeners in layer.
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
        disabledLayers.delete(layer);
      }
    },
    /**
     * Disable all layers.
     */
    disable: (layers: string | string[]) => {
      if (!Array.isArray(layers)) {
        layers = [layers];
      }

      for (const layer of layers) {
        disabledLayers.add(layer);
      }
    },
    /**
     * Set active layers.
     */
    set: (layers: string | string[]) => {
      if (!Array.isArray(layers)) {
        layers = [layers];
      }

      disabledLayers.clear();

      for (const layer of allLayers) {
        if (layers.includes(layer)) continue;
        disabledLayers.add(layer);
      }
    },
    /**
     * Enable all layers.
     */
    all: () => {
      disabledLayers.clear();
    },
    /**
     * Disable all layers.
     */
    none: () => {
      for (const layer of allLayers) {
        disabledLayers.add(layer);
      }
    },
  };

  const exists = (sequence: KeyString) => {
    return listeners.some((listener) => listener.keys.includes(sequence));
  };

  return {
    /**
     * Initialize the keyboard. Call this when `window` is available (it will fail silently).
     * You can define listeners bevore initializing.
     */
    init,
    /**
     * Removes all event handlers.
     * To re-enable listening after calling this, call `init()` again.
     */
    stop,
    /**
     * Removes all event handlers and clears any stored key state.
     * Use this if you are not planning to re-enable listening with `init()` after.
     */
    destroy,
    /**
     * Clear all listeners.
     */
    clear,
    /**
     * Create new listener.
     *
     * @param keys Key sequence to listen to.
     * @param handler Handler function.
     * @param config Optional settings to configure the listener.
     * @returns Unlisten function
     *
     * @example
     * ```ts
     * const unlisten = keyboard.listen([Key.Alt, Key.A], () => {
     *   message.value = "Alt + A key pressed";
     * });
     *
     * unlisten();
     * ```
     */
    listen,
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
    subscribe,
    /**
     * Record pressed keys and emit them as a KeySequence.
     *
     * @param callback Receives each recorded sequence.
     * @returns Function to stop recording.
     */
    record,
    /**
     * Create and manage Layers.
     */
    layers,
    /**
     * Check if Key String listener already exists.
     */
    exists,
  };
};

export type {
  Config,
  KeyString,
  Options,
  Handler,
  Handlers,
  HandlerContext,
  Listener,
  KeySequence,
  KeyData,
  LayerOptions,
};
export { parseKeyString, parseKeyData };
