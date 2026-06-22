<template>
  <NuxtPage />
  <footer>
    <span>Active listeners:</span>
    <ClientOnly>
      <div v-for="(listener, i) in listeners" style="display: flex; align-items: center; gap: 8px">
        <pre>{{ listener.id }}:</pre>
        <template v-for="(sequence, j) in formattedListeners[i]!">
          <span v-if="sequence.platform"> {{ sequence.platform }}: </span>
          <template
            v-if="
              Object.entries(sequence.modifiers)
                .filter((seq) => seq[1])
                .map((seq) => seq[0]).length
            "
          >
            <span>
              {{
                Object.entries(sequence.modifiers)
                  .filter((seq) => seq[1])
                  .map((seq) => seq[0])
                  .join(" + ")
              }}
            </span>
            +
          </template>
          <span>{{ sequence.key }}</span>
          <span v-if="j < formattedListeners[i]!.length - 1">|</span>
        </template>
        <span>{{ listener.config.once ? "(once)" : "" }}</span>
        <span>{{
          listener.config.layers ? `(layer: ${listener.config.layers.join(", ")})` : ""
        }}</span>
      </div>
    </ClientOnly>
  </footer>
</template>

<script lang="ts" setup>
import { parseKeyString } from "../src";

const { listeners } = useKeyboardInspector();

const formattedListeners = computed(() => {
  return listeners.value.map((l) => {
    return l.keys.map((k) => parseKeyString(k)).filter((k) => !!k);
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
