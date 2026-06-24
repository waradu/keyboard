import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "src/index",
    "src/nuxt/index",
    {
      builder: "mkdist",
      input: "src/nuxt/runtime",
      outDir: "dist/nuxt/runtime",
    },
  ],
  declaration: "node16",
  clean: true,
  externals: ["@nuxt/kit", "@nuxt/schema", "nuxt/app", "vue"],
});
