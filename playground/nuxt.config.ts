import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: ["../src/nuxt/module"],
  devtools: { enabled: true },
  compatibilityDate: "2025-12-03",
});
