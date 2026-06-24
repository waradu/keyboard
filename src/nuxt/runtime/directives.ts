import type { Directive } from "vue";

import type { KeySequence } from "../../keys";
import type { Options } from "../../types";
import { useKeybind } from "./composables";

const KEY = Symbol("keybind");

type Modifiers = "prevent" | "stop";
type Arg = KeySequence;

type KeybindElement = HTMLElement & {
  [KEY]?: () => void;
};

function cleanup(el: KeybindElement) {
  el[KEY]?.();
  el[KEY] = undefined;
}

function register(
  el: KeybindElement,
  arg: Arg | undefined,
  modifiers: Partial<Record<Modifiers, boolean>>,
  run: Options["run"],
) {
  cleanup(el);
  if (!arg || typeof run !== "function") return;

  el[KEY] = useKeybind({
    keys: arg,
    run,
    config: {
      prevent: modifiers.prevent,
      stop: modifiers.stop,
      runIfFocused: [el],
    },
  });
}

export const vKeybind: Directive<HTMLElement, Options["run"], Modifiers, Arg> = {
  mounted(el, binding) {
    register(el, binding.arg, binding.modifiers, binding.value);
  },
  updated(el, binding) {
    register(el, binding.arg, binding.modifiers, binding.value);
  },
  unmounted(el) {
    cleanup(el);
  },
};
