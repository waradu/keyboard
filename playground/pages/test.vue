<template>
  <div>TEST</div>
  <NuxtLink to="/">index</NuxtLink>
  <pre>Info: ctrl/cmd + r to reload page is prevent as an example on this page.</pre>
  <input
    type="text"
    v-keybind="'enter'"
    v-run="
      () => {
        console.log('Hello, Directive!');
      }
    "
  />
</template>

<script setup lang="ts">
useKeybind([
  {
    keys: ["a"],
    run() {
      console.log("RUN BA");
    },
  },
  {
    keys: ["control+b"],
    run() {
      console.log("RUN BB");
    },
  },
]);

useKeybind({
  keys: ["control+r", "meta+r"],
  run() {
    console.log("Refresh prevented!");
  },
  config: {
    prevent: true,
  },
});

useKeybind({
  keys: ["escape"],
  run() {
    console.log("Escape pressed, this will only log once.");
  },
  config: {
    once: true,
  },
});

useKeybind([
  {
    keys: ["macos:meta+x"],
    run() {
      console.log("Hello from 'macos'.");
    },
  },
  {
    keys: ["win:control+x"],
    run() {
      console.log("Hello from 'windows'.");
    },
  },
  {
    keys: ["linux:control+x"],
    run() {
      console.log("Hello from 'linux'.");
    },
  },
]);

const editor = useKeybindLayer("editor");

editor.listen({
  keys: "y",
  run() {
    console.log("Editor layer");
  },
});

useKeybind({
  keys: "control+y",
  run() {
    editor.toggle();
    console.log("Editor layer toggled");
  },
});

onMounted(() => {
  window.addEventListener("keydown", (e) => {
    console.log("KEY:", e.key, "CODE:", e.code);
  });
});
</script>
