import { parseKeyData } from "../src/helper";
import type { KeyString } from "../src/keys";
import type {
  Config,
  Handlers,
  KeyboardConfig,
  Listener,
  Options,
  SubscribeCallback,
} from "../src/types";
import { merge } from "./helper";

export class Keyboard {
  private handlers: Handlers = [];
  private layers = new Set<string>();
  private subscribers: SubscribeCallback[] = [];

  private pressed = new Set<string>();

  constructor(private config: KeyboardConfig = {}) {}

  private log(...data: any[]) {
    if (this.config.debug) console.log("<KEYBOARD>", ...data);
  }

  private onKeydown(event: KeyboardEvent) {
    if (event.isComposing) return;
    this.pressed.delete(event.key);
    this.log(`pressed '${event.key}'`);
  }

  private onKeyup(event: KeyboardEvent) {
    if (event.isComposing) return;
    this.pressed.delete(event.key);
    this.log(`released '${event.key}'`);
  }

  private onBlur() {
    this.pressed.clear();
    this.log("cleared due to blur");
  }

  /**
   * Clear all listeners.
   */
  clear() {
    for (const handler of this.handlers) handler.off?.();
    this.handlers.length = 0;
    this.pressed.clear();
    this.log(`cleared`);

    this.notify();
  }

  /**
   * Removes all event handlers.
   * To re-enable listening after calling this, call `init()` again.
   */
  stop() {
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", this.onKeydown);
      window.removeEventListener("keyup", this.onKeyup);
      window.removeEventListener("blur", this.onBlur);

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
   * Initialize the keyboard. Call this when `window` is available (it will fail silently).
   * You can define listeners bevore initializing.
   */
  async init(opts?: { signal?: AbortSignal }) {
    this.stop();

    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.onKeydown);
      window.addEventListener("keyup", this.onKeyup);
      window.addEventListener("blur", this.onBlur);

      const abortSignal = opts?.signal ?? this.config.signal;
      if (abortSignal) {
        if (abortSignal.aborted) this.destroy();
        else abortSignal.addEventListener("abort", this.destroy, { once: true });
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
   * @param config The config that gets applied to all handler.
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

    for (const option of options) option.config?.layers?.map(this.layers.add);

    const results = options.map((option) => {
      const local = merge<Config>(option.config, config, {
        prevent: false,
        stop: false,
        ignoreIfEditable: false,
        once: false,
        when: true,
      });

      if (local.signal?.aborted) return;

      if (!Array.isArray(option.keys)) {
        option.keys = [option.keys];
      }

      let keys = option.keys.map((key) => (typeof key === "string" ? key : parseKeyData(key)));

      if (keys.includes("any")) {
        keys = ["any"];
      }

      const id = Math.random().toString(36).slice(2, 7);

      const onAbort = () => {
        this.unbind(id);
        local.signal?.removeEventListener("abort", onAbort);
      };
      if (local?.signal) local.signal.addEventListener("abort", onAbort, { once: true });

      const handler: Listener = {
        id,
        off: onAbort,
        keys: keys,
        handler: option.run,
        config: local,
      };

      this.handlers.push(handler);

      this.log(`added '${option.keys.join(", ")}' with id: '${id}'`);

      return { id, onAbort };
    });

    this.notify();

    return () => {
      results.forEach((result) => result?.onAbort());
    };
  }

  unbind(id: string) {
    const index = this.handlers.findIndex((l) => l.id === id);
    if (index !== -1 && this.handlers[index]) {
      this.handlers[index].off();
      this.handlers.splice(index, 1);
      this.log(`removed: '${id}'`);
      this.notify();
    }
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
  exists(sequence: KeyString) {
    return this.handlers.some((handler) => handler.keys.includes(sequence));
  }
}
