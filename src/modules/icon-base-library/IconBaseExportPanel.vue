<template>
  <section class="export-panel">
    <header class="export-head">
      <div>
        <h2>代码导出</h2>
      </div>
      <el-button type="primary" size="small" :disabled="!asset" @click="copyCurrent">复制</el-button>
    </header>

    <el-empty v-if="!asset" description="选择素材后生成导出代码" />

    <el-tabs v-else v-model="activeTab" class="export-tabs">
      <el-tab-pane label="HTML + CSS" name="html">
        <CodeMirrorViewer :code="htmlCss" language="html" />
      </el-tab-pane>
      <el-tab-pane label="Vue Component" name="vue">
        <CodeMirrorViewer :code="vueComponent" language="vue" />
      </el-tab-pane>
      <el-tab-pane label="JSON Config" name="json">
        <CodeMirrorViewer :code="jsonConfig" language="json" />
      </el-tab-pane>
    </el-tabs>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, ref } from "vue";
import {
  generateIconBaseHtmlCss,
  generateIconBaseJsonConfig,
  generateIconBaseVueComponent
} from "@/generators/iconBaseGenerator";
import type { IconBaseAsset } from "@/types/iconBase";
import CodeMirrorViewer from "./CodeMirrorViewer.vue";

const props = defineProps<{
  asset: IconBaseAsset | null;
}>();

const activeTab = ref<"html" | "vue" | "json">("html");

const htmlCss = computed(() => (props.asset ? generateIconBaseHtmlCss(props.asset) : ""));
const vueComponent = computed(() => (props.asset ? generateIconBaseVueComponent(props.asset) : ""));
const jsonConfig = computed(() => (props.asset ? generateIconBaseJsonConfig(props.asset) : ""));

const currentCode = computed(() => {
  if (activeTab.value === "vue") return vueComponent.value;
  if (activeTab.value === "json") return jsonConfig.value;
  return htmlCss.value;
});

async function copyCurrent(): Promise<void> {
  if (!props.asset) return;
  await navigator.clipboard.writeText(currentCode.value);
  ElMessage.success("代码已复制");
}
</script>

<style scoped>
.export-panel {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
  min-height: 0;
}

.export-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.export-head span {
  color: var(--dm-secondary);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.export-head h2 {
  margin: 0;
  color: #f1fbff;
  font-size: 18px;
  line-height: 1.3;
}

.export-tabs {
  min-height: 0;
}

.export-tabs :deep(.el-tabs__content) {
  height: calc(100% - 54px);
}

.export-tabs :deep(.el-tab-pane) {
  height: 100%;
}
</style>
