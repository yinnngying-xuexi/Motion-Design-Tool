<template>
  <div ref="hostRef" class="code-mirror-host"></div>
</template>

<script setup lang="ts">
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { EditorState, Extension } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  code: string;
  language: "html" | "css" | "json" | "vue";
}>();

const hostRef = ref<HTMLElement | null>(null);
let view: EditorView | null = null;

function languageExtension(): Extension {
  if (props.language === "json") return json();
  if (props.language === "css") return css();
  return html();
}

function createView(): void {
  if (!hostRef.value) return;
  view?.destroy();
  view = new EditorView({
    parent: hostRef.value,
    state: EditorState.create({
      doc: props.code,
      extensions: [
        lineNumbers(),
        languageExtension(),
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": {
            height: "100%",
            color: "#ededed",
            backgroundColor: "#000000",
            fontSize: "12px"
          },
          ".cm-scroller": {
            fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Consolas, monospace"
          },
          ".cm-gutters": {
            backgroundColor: "#0a0a0a",
            color: "#8f8f8f",
            border: "none"
          },
          ".cm-activeLine": {
            backgroundColor: "rgba(0, 112, 243, 0.12)"
          },
          ".cm-activeLineGutter": {
            backgroundColor: "rgba(0, 112, 243, 0.12)"
          }
        })
      ]
    })
  });
}

onMounted(createView);

watch(
  () => [props.code, props.language] as const,
  () => createView()
);

onBeforeUnmount(() => {
  view?.destroy();
});
</script>

<style scoped>
.code-mirror-host {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
}
</style>
