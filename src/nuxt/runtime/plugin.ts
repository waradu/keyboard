import { Keyboard } from "@waradu/keyboard";
import { defineNuxtPlugin, useRuntimeConfig } from "nuxt/app";

import type { ModuleOptions } from "../index";
import { vKeybind, vRun } from "./directives";

export default defineNuxtPlugin((nuxtApp) => {
  const {
    public: { keyboard: opts },
  } = useRuntimeConfig();

  nuxtApp.vueApp.directive("run", vRun);
  nuxtApp.vueApp.directive("keybind", vKeybind);

  const keyboard = new Keyboard({
    debug: (opts as ModuleOptions).debug,
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
