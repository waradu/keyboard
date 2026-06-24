import { defineNuxtModule, addPlugin, createResolver, addImports } from "@nuxt/kit";
import type { Nuxt } from "@nuxt/schema";

import type { Keyboard } from "..";
import type { vKeybind } from "./runtime/directives";

export interface ModuleOptions {
  debug?: boolean | undefined;
}

export default defineNuxtModule<ModuleOptions>({
  meta: { name: "@waradu/keyboard/nuxt", configKey: "keyboard" },
  defaults: {
    debug: false,
  },
  setup(options: ModuleOptions, nuxt: Nuxt) {
    const { resolve } = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.public.keyboard = {
      debug: options.debug ?? false,
    };

    addPlugin({
      src: resolve("./runtime/plugin"),
    });

    addImports({
      as: "useKeybind",
      name: "useKeybind",
      from: resolve("./runtime/composables"),
    });

    addImports({
      as: "useKeybindLayer",
      name: "useKeybindLayer",
      from: resolve("./runtime/composables"),
    });

    addImports({
      as: "useKeyboardInspector",
      name: "useKeyboardInspector",
      from: resolve("./runtime/composables"),
    });

    addImports({
      as: "useKeybindRecorder",
      name: "useKeybindRecorder",
      from: resolve("./runtime/composables"),
    });
  },
});

declare module "nuxt/app" {
  interface NuxtApp {
    $keyboard: Keyboard;
  }
}

declare module "vue" {
  interface GlobalDirectives {
    vKeybind: typeof vKeybind;
  }
}

declare module "nuxt/schema" {
  interface PublicRuntimeConfig {
    keyboard: Partial<ModuleOptions>;
  }
}
