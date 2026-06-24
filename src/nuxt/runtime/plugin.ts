import { Keyboard } from "@waradu/keyboard";
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

import { vKeybind } from "./directives";

export default defineNuxtPlugin((nuxtApp) => {
  const {
    public: { keyboard: opts },
  } = useRuntimeConfig();

  nuxtApp.vueApp.directive("keybind", vKeybind);

  const keyboard = new Keyboard({
    debug: opts.debug,
    noInit: true,
  });

  nuxtApp.hook("app:mounted", () => {
    keyboard.init();
  });

  return {
    provide: {
      keyboard,
    },
  };
});
