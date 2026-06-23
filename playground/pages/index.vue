<template>
  <div>INDEX</div>
  <NuxtLink to="/test">test</NuxtLink>
  <br />
  <input type="text" ref="textInput" />
</template>

<script setup lang="ts">
useKeybind([
  {
    keys: ["a"],
    run() {
      console.log("RUN AA");
    },
  },
  {
    keys: ["ctrl+b"],
    run() {
      console.log("RUN AB");
    },
  },
]);

useKeybind([
  {
    keys: ["no-macos:ctrl+z", "macos:meta+z"],
    run() {
      console.log("undo");
    },
  },
  {
    keys: ["no-macos:ctrl+shift+z", "macos:meta+shift+z"],
    run() {
      console.log("redo");
    },
  },
]);

useKeybind({
  keys: ["alt+$num"],
  run(ctx) {
    console.log("Number:", ctx.template);
  },
});

const textInput = useTemplateRef("textInput");

onMounted(() => {
  useKeybind({
    keys: ["enter"],
    run() {
      console.log("Enter pressed while input is focused");
    },
    config: {
      runIfFocused: [textInput.value],
    },
  });
});
</script>
