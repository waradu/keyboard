import type { Handlers, KeybindShape, Keyboard } from "@waradu/keyboard";
import { useNuxtApp } from "nuxt/app";
import { getCurrentInstance, onBeforeUnmount, ref } from "vue";

interface KeyboardNuxtApp {
  $keyboard: Keyboard;
}

export const useKeybind = ((...args: Parameters<Keyboard["bind"]>) => {
  const { $keyboard } = useNuxtApp() as unknown as KeyboardNuxtApp;

  const vm = getCurrentInstance();
  const off = $keyboard.bind(...args);

  if (vm) {
    onBeforeUnmount(() => {
      off();
    });
  }

  return off;
}) as Keyboard["bind"];

export function useKeybindLayer(...args: Parameters<Keyboard["layers"]["create"]>) {
  const { $keyboard } = useNuxtApp() as unknown as KeyboardNuxtApp;

  const vm = getCurrentInstance();
  const layer = $keyboard.layers.create(...args);

  if (vm) {
    onBeforeUnmount(() => {
      layer.off();
    });
  }

  return layer;
}

export function useKeyboardInspector() {
  const { $keyboard } = useNuxtApp() as unknown as KeyboardNuxtApp;

  const allHandlers = ref<Handlers>([]);

  const unsubscribe = $keyboard.subscribe((handlers) => {
    allHandlers.value = handlers;
  });

  onBeforeUnmount(() => {
    unsubscribe?.();
  });

  return { handlers: allHandlers, unsubscribe };
}

export function useKeybindRecorder(cb: (sequence: KeybindShape) => void) {
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
