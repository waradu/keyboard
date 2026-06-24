import type { Options, KeyValue } from "@waradu/keyboard";
import type { Directive } from "vue";

import { useKeybind } from "./composables";

const KEY = Symbol("keybind");

type KeybindDirectiveModifier = "alt" | "ctrl" | "meta" | "ctrl-cmd" | "once" | "prevent" | "shift";

type KeybindElement = HTMLElement & {
  [KEY]?: () => void;
};

function cleanup(el: KeybindElement) {
  el[KEY]?.();
  el[KEY] = undefined;
}

function register(
  el: KeybindElement,
  arg: KeyValue | undefined,
  modifiers: Record<string, boolean>,
  run: Options["run"],
) {
  cleanup(el);
  if (!arg || typeof run !== "function") return;

  el[KEY] = useKeybind({
    keys: {
      key: arg,
      modifiers: {
        alt: modifiers.alt,
        ctrl: modifiers.ctrl,
        ctrlCmd: modifiers["ctrl-cmd"],
        meta: modifiers.meta,
        shift: modifiers.shift,
      },
    },
    run,
    config: {
      prevent: modifiers.prevent,
      once: modifiers.once,
      runIfFocused: [el],
    },
  });
}

export const vKeybind: Directive<HTMLElement, Options["run"], KeybindDirectiveModifier, KeyValue> =
  {
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
