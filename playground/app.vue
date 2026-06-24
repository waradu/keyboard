<template>
  <NuxtPage />
  <footer>
    <span>Active listeners:</span>
    <ClientOnly>
      <div v-for="(handler, i) in handlers" style="display: flex; align-items: center; gap: 8px">
        <pre>{{ handler.id }}:</pre>
        <template v-for="(sequence, j) in formattedHandlers[i]!">
          <span v-if="j > 0">|</span>
          <span v-if="sequence.platform"> {{ sequence.platform }}: </span>
          <span>
            {{ sequence.toLocalReadable().join(" + ") }}
          </span>
        </template>
        <span>{{ handler.config.once ? "(once)" : "" }}</span>
        <span>{{
          handler.config.layers?.length ? `(layer: ${handler.config.layers.join(", ")})` : ""
        }}</span>
      </div>
    </ClientOnly>
  </footer>
</template>

<script lang="ts" setup>
const { handlers } = useKeyboardInspector();

const formattedHandlers = computed(() => {
  return handlers.value.map((handler) => {
    return handler.keys;
  });
});
</script>

<style>
html {
  font-family: sans-serif;
}

footer {
  margin-top: 40px;
}
</style>
