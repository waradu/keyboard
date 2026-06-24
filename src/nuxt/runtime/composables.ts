import { useNuxtApp } from "nuxt/app";
import { getCurrentInstance, onBeforeUnmount, ref } from "vue";
import type { Ref } from "vue";

import type { Keybind } from "../../keybind";
import type { Keyboard } from "../../keyboard";
import type { Handlers } from "../../types";

export const useKeybind = ((...args: Parameters<Keyboard["bind"]>) => {
  const { $keyboard } = useNuxtApp();

  const vm = getCurrentInstance();
  const off = $keyboard.bind(...args);

  if (vm) {
    onBeforeUnmount(() => {
      off();
    });
  }

  return off;
}) as Keyboard["bind"];

export function useKeybindLayer(
  ...args: Parameters<Keyboard["layers"]["create"]>
): ReturnType<Keyboard["layers"]["create"]> {
  const { $keyboard } = useNuxtApp();

  const vm = getCurrentInstance();
  const layer = $keyboard.layers.create(...args);

  if (vm) {
    onBeforeUnmount(() => {
      layer.off();
    });
  }

  return layer;
}

export function useKeyboardInspector(): {
  handlers: Ref<Handlers>;
  unsubscribe: () => unknown;
} {
  const { $keyboard } = useNuxtApp();

  const allHandlers = ref<Handlers>([]);

  const unsubscribe = $keyboard.subscribe((handlers) => {
    allHandlers.value = handlers;
  });

  const vm = getCurrentInstance();

  if (vm) {
    onBeforeUnmount(() => {
      unsubscribe?.();
    });
  }

  return { handlers: allHandlers, unsubscribe };
}

export function useKeybindRecorder(cb: (keybind: Keybind) => void) {
  const { $keyboard } = useNuxtApp();

  const vm = getCurrentInstance();
  const off = $keyboard.record(cb);

  if (vm) {
    onBeforeUnmount(() => {
      off();
    });
  }

  return off;
}
