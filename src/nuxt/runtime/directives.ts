import type { Options } from "@waradu/keyboard";
import type { Directive } from "vue";

import { useKeybind } from "./composables";

const KEY = Symbol("keybind-run");

type SharedState = {
  run?: Options["run"];
  keys?: Options["keys"];
  off?: () => void;
  modifiers?: {
    prevent?: boolean;
    once?: boolean;
  };
  registered?: boolean;
};

function tryRegister(el: HTMLElement, shared: SharedState) {
  if (!shared.run || !shared.keys || shared.registered || !el) return;

  shared.off = useKeybind({
    keys: shared.keys,
    run: shared.run,
    config: {
      prevent: shared.modifiers?.prevent,
      once: shared.modifiers?.once,
      runIfFocused: [el],
    },
  });

  shared.registered = true;
}

function cleanup(el: HTMLElement) {
  const shared: SharedState | undefined = (el as any)[KEY];

  shared?.off?.();
  if (shared) {
    shared.registered = false;
    shared.off = undefined;
  }
}

export const vKeybind: Directive<HTMLElement, Options["keys"], "prevent" | "once"> = {
  mounted(el, binding) {
    const shared: SharedState = (el as any)[KEY] ?? ((el as any)[KEY] = {});

    shared.modifiers = { ...binding.modifiers };
    shared.keys = binding.value;

    tryRegister(el, shared);
  },
  unmounted(el) {
    cleanup(el);
  },
};

export const vRun: Directive<HTMLElement, Options["run"]> = {
  mounted(el, binding) {
    const shared: SharedState = (el as any)[KEY] ?? ((el as any)[KEY] = {});

    shared.run = binding.value;

    tryRegister(el, shared);
  },
  unmounted(el) {
    cleanup(el);
  },
};
