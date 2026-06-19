// oxlint-disable-next-line typescript/triple-slash-reference
/// <reference path="./index.d.ts" />

import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addImports,
} from "@nuxt/kit";
import type { Nuxt } from "@nuxt/schema";

export interface ModuleOptions {
  debug?: boolean | undefined;
  stats?: boolean | undefined;
}

export default defineNuxtModule<ModuleOptions>({
  meta: { name: "@waradu/keyboard/nuxt", configKey: "keyboard" },
  defaults: {
    debug: false,
    stats: true,
  },
  setup(options: ModuleOptions, nuxt: Nuxt) {
    const { resolve } = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.public.keyboard = {
      debug: options.debug ?? false,
      stats: options.stats ?? true,
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
