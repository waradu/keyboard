import type { Handlers, KeySequence, LayerOptions, Options, useKeyboard } from "@waradu/keyboard";
import { useNuxtApp } from "nuxt/app";
import { getCurrentInstance, onBeforeUnmount, ref } from "vue";

interface KeyboardNuxtApp {
  $keyboard: ReturnType<typeof useKeyboard>;
}

export function useKeybind(options: Options | Options[]) {
  const { $keyboard } = useNuxtApp() as unknown as KeyboardNuxtApp;

  const vm = getCurrentInstance();
  const off = $keyboard.listen(options);

  if (vm) {
    onBeforeUnmount(() => {
      off();
    });
  }

  return off;
}

export function useKeybindLayer(layers: string | string[], options?: LayerOptions) {
  const { $keyboard } = useNuxtApp() as unknown as KeyboardNuxtApp;

  const vm = getCurrentInstance();
  const layer = $keyboard.layers.create(layers, options);

  if (vm) {
    onBeforeUnmount(() => {
      layer.off();
    });
  }

  return layer;
}

export function useKeyboardInspector() {
  const { $keyboard } = useNuxtApp() as unknown as KeyboardNuxtApp;

  const listeners = ref<Handlers>([]);

  const unsubscribe = $keyboard.subscribe((handlers) => {
    listeners.value = handlers;
  });

  onBeforeUnmount(() => {
    unsubscribe?.();
  });

  return { listeners, unsubscribe };
}

export function useKeybindRecorder(cb: (sequence: KeySequence) => void) {
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
