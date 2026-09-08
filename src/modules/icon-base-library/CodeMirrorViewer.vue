<template>
  <div ref="hostRef" class="code-mirror-host"></div>
</template>

<script setup lang="ts">
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState, Extension } from "@codemirror/state";
import { EditorView, lineNumbers } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps<{
  code: string;
  language: "html" | "css" | "json" | "vue";
}>();

const hostRef = ref<HTMLElement | null>(null);
let view: EditorView | null = null;

const dataMotionHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#6f7782", fontStyle: "italic" },
  { tag: [tags.keyword, tags.controlKeyword, tags.definitionKeyword], color: "#c792ea" },
  { tag: [tags.tagName, tags.typeName, tags.className, tags.namespace], color: "#82aaff" },
  { tag: [tags.attributeName, tags.propertyName, tags.labelName], color: "#ffcb6b" },
  { tag: [tags.string, tags.special(tags.string)], color: "#c3e88d" },
  { tag: [tags.number, tags.bool, tags.null], color: "#f78c6c" },
  { tag: [tags.function(tags.variableName), tags.definition(tags.variableName)], color: "#89ddff" },
  { tag: [tags.variableName, tags.name], color: "#e8e8e8" },
  { tag: [tags.operator, tags.punctuation, tags.bracket], color: "#89a7c2" },
  { tag: [tags.meta, tags.processingInstruction], color: "#7ab8ff" },
  { tag: [tags.regexp, tags.escape], color: "#f07178" },
  { tag: [tags.heading, tags.strong], color: "#ffffff", fontWeight: "600" },
  { tag: tags.invalid, color: "#ff6b6b", textDecoration: "underline wavy" }
]);

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
        syntaxHighlighting(dataMotionHighlightStyle),
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
            backgroundColor: "rgba(255, 255, 255, 0.07)"
          },
          ".cm-activeLineGutter": {
            backgroundColor: "rgba(255, 255, 255, 0.07)"
          },
          ".cm-selectionBackground, ::selection": {
            backgroundColor: "rgba(0, 112, 243, 0.3) !important"
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
