import type { Keyboard } from "@waradu/keyboard";

import type { ModuleOptions } from "./index";
import type { vKeybind } from "./runtime/directives";
export * from "./index";

declare module "nuxt/app" {
  interface NuxtApp {
    $keyboard: Keyboard;
  }
}

declare module "#app" {
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
