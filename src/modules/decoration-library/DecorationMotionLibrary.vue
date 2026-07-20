<template>
  <section class="decoration-library">
    <aside class="decoration-list panel">
      <header class="section-head">
        <div>
          <h2>装饰动效库</h2>
        </div>
        <small>系统内置</small>
      </header>

      <div class="section-tabs">
        <button
          v-for="section in decorationSections"
          :key="section"
          type="button"
          :class="{ active: activeSection === section }"
          @click="activeSection = section"
        >
          {{ section }}
        </button>
      </div>

      <el-scrollbar class="effect-scroll">
        <div class="effect-stack">
          <article
            v-for="effect in sectionEffects"
            :key="effect.id"
            class="effect-card"
            :class="{ active: currentEffect.id === effect.id }"
            @click="selectEffect(effect.id)"
          >
            <div class="effect-card-copy">
              <strong>{{ effect.name }}</strong>
              <p>{{ effect.scene }}</p>
            </div>
          </article>
        </div>
      </el-scrollbar>
    </aside>

    <main class="decoration-preview panel">
      <header class="section-head">
        <div>
          <h2>{{ currentEffect.name }}</h2>
        </div>
        <input ref="svgFileInput" class="hidden-file-input" type="file" accept=".svg,image/svg+xml" @change="handleSvgUpload" />
      </header>

      <div ref="previewCapture" class="preview-stage">
        <div class="generated-preview" v-html="previewMarkup"></div>
      </div>
    </main>

    <aside class="decoration-params panel">
      <header class="section-head">
        <div>
          <h2>参数编辑</h2>
        </div>
        <el-button size="small" @click="resetParams">重置</el-button>
      </header>

      <el-scrollbar class="param-scroll">
        <div class="param-stack">
          <div v-for="paramItem in currentEffect.editableParams" :key="paramItem.key" class="param-control">
            <label>
              <span>{{ paramItem.label }}</span>
              <small v-if="paramItem.unit">{{ paramItem.unit }}</small>
            </label>
            <template v-if="paramItem.type === 'color'">
              <div class="color-row">
                <el-color-picker v-model="params[paramItem.key]" />
                <el-input v-model="params[paramItem.key]" />
              </div>
            </template>
            <template v-else-if="paramItem.type === 'select'">
              <el-select v-model="params[paramItem.key]">
                <el-option v-for="option in paramItem.options" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
            </template>
            <template v-else>
              <div class="number-row">
                <el-slider
                  :model-value="Number(params[paramItem.key])"
                  :min="paramItem.min"
                  :max="paramItem.max"
                  :step="paramItem.step"
                  @input="params[paramItem.key] = Array.isArray($event) ? $event[0] : $event"
                />
                <el-input-number
                  :model-value="Number(params[paramItem.key])"
                  :min="paramItem.min"
                  :max="paramItem.max"
                  :step="paramItem.step"
                  controls-position="right"
                  @change="params[paramItem.key] = Number($event ?? params[paramItem.key])"
                />
              </div>
            </template>
          </div>
        </div>
      </el-scrollbar>
    </aside>

    <section class="decoration-export panel">
      <header class="section-head">
        <div>
          <h2>导出代码</h2>
        </div>
        <div class="export-actions">
          <el-button size="small" @click="downloadHtml">导出 HTML</el-button>
          <el-button type="primary" size="small" @click="copyCode">复制代码</el-button>
        </div>
      </header>
      <el-tabs v-model="activeExport">
        <el-tab-pane label="HTML + CSS" name="html">
          <CodeMirrorViewer :code="htmlCss" language="html" />
        </el-tab-pane>
        <el-tab-pane label="Vue Component" name="vue">
          <CodeMirrorViewer :code="vueCode" language="vue" />
        </el-tab-pane>
        <el-tab-pane label="JSON Config" name="json">
          <CodeMirrorViewer :code="jsonCode" language="json" />
        </el-tab-pane>
      </el-tabs>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { decorationEffects, decorationSections } from "@/data/decorationEffects";
import {
  generateDecorationCss,
  generateDecorationCompositionCss,
  generateDecorationHtmlCss,
  generateDecorationJson,
  generateDecorationMarkup,
  generateDecorationVue
} from "@/generators/decorationGenerator";
import type { DecorationSection } from "@/types/decoration";
import type { SvgFlowSource, SvgPreviewAsset } from "@/types/svgFlow";
import { SVG_FLOW_DRAFT_KEY, SVG_FLOW_LEGACY_DRAFT_KEY, SVG_FLOW_OPEN_KEY, createDefaultSvgFlowConfig, readSvgFlowFile, readSvgPreviewFile } from "@/utils/svgFlow";
import { useMyMotionStore } from "@/stores/myMotionStore";
import { createMotionArtifact } from "@/utils/motionArtifact";
import CodeMirrorViewer from "@/modules/icon-base-library/CodeMirrorViewer.vue";

const activeSection = ref<DecorationSection>("图标底座");
const activeEffectId = ref(decorationEffects[0].id);
const activeExport = ref<"html" | "vue" | "json">("html");
const params = reactive<Record<string, string | number>>({});
const svgSource = ref<SvgFlowSource>();
const importedSvg = ref<SvgPreviewAsset>();
const svgFileInput = ref<HTMLInputElement>();
const previewCapture = ref<HTMLElement>();
const motionStore = useMyMotionStore();

const sectionEffects = computed(() => decorationEffects.filter((effect) => effect.section === activeSection.value));
const currentEffect = computed(() => decorationEffects.find((effect) => effect.id === activeEffectId.value) ?? sectionEffects.value[0] ?? decorationEffects[0]);
const isSvgFlow = computed(() => currentEffect.value.generator === "svg-flow");

const cssCode = computed(() => generateDecorationCss(currentEffect.value, params));
const htmlCss = computed(() => generateDecorationHtmlCss(currentEffect.value, params, svgSource.value, importedSvg.value));
const vueCode = computed(() => generateDecorationVue(currentEffect.value, params, svgSource.value, importedSvg.value));
const jsonCode = computed(() => generateDecorationJson(currentEffect.value, params, svgSource.value, importedSvg.value));
const previewMarkup = computed(() => `<style>${cssCode.value}${generateDecorationCompositionCss(importedSvg.value)}</style>${generateDecorationMarkup(currentEffect.value, params, svgSource.value, importedSvg.value)}`);
const currentCode = computed(() => (activeExport.value === "vue" ? vueCode.value : activeExport.value === "json" ? jsonCode.value : htmlCss.value));

watch(activeSection, () => {
  activeEffectId.value = sectionEffects.value[0]?.id ?? decorationEffects[0].id;
});

watch(currentEffect, resetParams, { immediate: true });

watch([svgSource, params], () => {
  if (!isSvgFlow.value || !svgSource.value) return;
  localStorage.setItem(SVG_FLOW_DRAFT_KEY, JSON.stringify({ source: svgSource.value, config: { ...params } }));
}, { deep: true });

onMounted(() => {
  localStorage.removeItem(SVG_FLOW_LEGACY_DRAFT_KEY);
  motionStore.loadFromLocal();
  void restoreSvgFlow();
  window.addEventListener("datamotion:import-svg", triggerSvgImport);
  window.addEventListener("datamotion:save", saveFromToolbar);
  window.addEventListener("datamotion:export", downloadHtml);
});

onBeforeUnmount(() => {
  window.removeEventListener("datamotion:import-svg", triggerSvgImport);
  window.removeEventListener("datamotion:save", saveFromToolbar);
  window.removeEventListener("datamotion:export", downloadHtml);
});

function selectEffect(id: string): void {
  activeEffectId.value = id;
}

function resetParams(): void {
  Object.keys(params).forEach((key) => delete params[key]);
  Object.assign(params, currentEffect.value.defaultParams);
}

async function copyCode(): Promise<void> {
  await navigator.clipboard.writeText(currentCode.value);
  ElMessage.success("代码已复制");
}

async function handleSvgUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    if (isSvgFlow.value) {
      const [flowSource, previewAsset] = await Promise.all([readSvgFlowFile(file), readSvgPreviewFile(file)]);
      svgSource.value = flowSource;
      importedSvg.value = previewAsset;
      ElMessage.success("SVG 路径已读取");
    } else {
      importedSvg.value = await readSvgPreviewFile(file);
      try {
        svgSource.value = await readSvgFlowFile(file);
      } catch {
        // General previews accept SVGs that do not contain a flow-compatible primitive.
      }
      ElMessage.success("SVG 已导入当前装饰动效");
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "SVG 上传失败");
  } finally {
    input.value = "";
  }
}

function triggerSvgImport(): void {
  svgFileInput.value?.click();
}

async function saveFromToolbar(): Promise<void> {
  if (isSvgFlow.value) {
    if (svgSource.value) await saveSvgFlow();
    else ElMessage.info("请先导入 SVG");
    return;
  }

  try {
    const artifact = await createMotionArtifact({
      id: currentEffect.value.id,
      name: currentEffect.value.name,
      htmlCss: htmlCss.value,
      previewNode: previewCapture.value
    });
    motionStore.saveDecoration(currentEffect.value, { ...params }, artifact);
    ElMessage.success("已保存 HTML、预览图和名称");
  } catch {
    ElMessage.error("保存失败，无法生成当前动效预览图");
  }
}

async function saveSvgFlow(): Promise<void> {
  if (!svgSource.value) return;
  try {
    const artifact = await createMotionArtifact({
      id: "svg-flow-tool",
      name: "SVG流光工具",
      htmlCss: htmlCss.value,
      previewNode: previewCapture.value
    });
    motionStore.saveSvgFlow({
      source: svgSource.value,
      config: {
        ...createDefaultSvgFlowConfig(),
        ...params
      } as ReturnType<typeof createDefaultSvgFlowConfig>
    }, artifact);
    ElMessage.success("已保存 HTML、预览图和名称");
  } catch {
    ElMessage.error("保存失败，无法生成当前动效预览图");
  }
}

function downloadHtml(): void {
  const documentCode = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SVG流光工具</title>
<style>body { margin: 0; padding: 24px; background: #000; }</style>
</head>
<body>
${htmlCss.value}
</body>
</html>`;
  const blob = new Blob([documentCode], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${svgSource.value?.fileName.replace(/\.svg$/i, "") || "svg-flow"}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
  ElMessage.success("HTML 文件已导出");
}

async function restoreSvgFlow(): Promise<void> {
  const raw = localStorage.getItem(SVG_FLOW_OPEN_KEY) ?? localStorage.getItem(SVG_FLOW_DRAFT_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw) as { source?: SvgFlowSource; config?: Record<string, string | number> };
    if (!saved.source || !saved.config) return;
    activeSection.value = "线性流光";
    await nextTick();
    activeEffectId.value = "svg-flow-tool";
    await nextTick();
    svgSource.value = saved.source;
    Object.assign(params, createDefaultSvgFlowConfig(), saved.config);
    localStorage.removeItem(SVG_FLOW_OPEN_KEY);
  } catch {
    localStorage.removeItem(SVG_FLOW_OPEN_KEY);
  }
}
</script>

<style scoped>
.decoration-library {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 340px minmax(440px, 1fr) 340px;
  grid-template-rows: minmax(0, 1fr) minmax(220px, 32vh);
  grid-template-areas:
    "list preview params"
    "list export export";
  gap: 10px;
}

.panel {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  background: var(--dm-surface-soft);
  padding: 16px;
  box-shadow: inset 0 0 0 1px rgba(0, 112, 243, 0.02);
}

.decoration-list {
  grid-area: list;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 14px;
  align-content: start;
  overflow: hidden;
}

.effect-scroll {
  min-height: 0;
}

.effect-stack {
  display: grid;
  gap: 8px;
  padding-right: 8px;
}

.decoration-preview {
  grid-area: preview;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
}

.hidden-file-input { display: none; }

.decoration-params {
  grid-area: params;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
}

.decoration-export {
  grid-area: export;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 12px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.section-head span,
.effect-meta span {
  color: var(--dm-secondary);
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 0.75rem;
}

.section-head h2 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 18px;
  line-height: 1.3;
}

.section-head small {
  color: var(--dm-secondary);
}

.preview-actions,
.export-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex: 0 0 auto;
}

.svg-import-button {
  height: 32px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid var(--dm-hairline-strong);
  border-radius: var(--dm-radius-md);
  background: var(--dm-control);
  color: var(--dm-primary);
  font-size: 12px;
  cursor: pointer;
}

.svg-import-button:hover { border-color: var(--dm-secondary); }
.svg-import-button input { display: none; }

.section-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.section-tabs button {
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-md);
  background: var(--dm-surface-raised);
  color: var(--dm-secondary);
  padding: 9px;
  cursor: pointer;
}

.section-tabs button.active {
  border-color: var(--dm-tertiary);
  color: var(--dm-primary);
  background: rgba(0, 112, 243, 0.12);
}

.effect-card {
  min-width: 0;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-md);
  padding: 10px 12px;
  background: var(--dm-surface-raised);
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease;
}

.effect-card:hover:not(.active) {
  border-color: var(--dm-secondary);
}

.effect-card.active {
  border-color: var(--dm-tertiary);
  background: rgba(0, 112, 243, 0.11);
  box-shadow: inset 0 0 24px rgba(0, 112, 243, 0.045);
}

.effect-thumb {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-md);
  background: #05080c;
}

.effect-thumb span {
  width: 28px;
  height: 28px;
  border: 1px solid var(--dm-tertiary);
  border-radius: 999px;
  box-shadow: 0 0 12px var(--dm-tertiary);
}

.effect-thumb.linear-flow span {
  position: relative;
  width: 34px;
  height: 8px;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.effect-thumb.particle-base span {
  position: relative;
  width: 36px;
  height: 16px;
  border: 1px dashed var(--dm-tertiary);
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 0 10px rgba(0, 112, 243, 0.72);
  animation: particleBaseThumb 2.4s linear infinite;
}

.effect-thumb.comet-flow span {
  position: relative;
  width: 36px;
  height: 14px;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.effect-thumb.comet-flow span::before {
  content: "";
  position: absolute;
  left: 0;
  top: 1px;
  width: 100%;
  height: 9px;
  border-bottom: 1px solid var(--dm-tertiary);
  border-radius: 0 0 45% 45%;
  opacity: 0.38;
}

.effect-thumb.comet-flow span::after {
  content: "";
  position: absolute;
  left: 0;
  top: 7px;
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: var(--dm-on-primary);
  box-shadow: -6px 0 7px #55e6ff, 0 0 8px #55e6ff;
  animation: thumbCometFlow 2.8s linear infinite;
}

.effect-thumb.svg-flow span {
  position: relative;
  width: 36px;
  height: 18px;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.effect-thumb.svg-flow span::before {
  content: "";
  position: absolute;
  inset: 6px 0 auto;
  height: 7px;
  border-top: 1px solid var(--dm-secondary);
  border-radius: 50%;
  opacity: 0.65;
}

.effect-thumb.svg-flow span::after {
  content: "";
  position: absolute;
  top: 5px;
  left: -4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--dm-on-primary);
  box-shadow: -8px 0 8px var(--dm-tertiary), 0 0 8px var(--dm-tertiary);
  animation: thumbLinearFlow 2.2s linear infinite;
}

@keyframes thumbCometFlow {
  from { transform: translateX(-4px); opacity: 0; }
  12%, 82% { opacity: 1; }
  to { transform: translateX(40px); opacity: 0; }
}

.effect-thumb.particle-base span::before,
.effect-thumb.particle-base span::after {
  content: "";
  position: absolute;
  border-radius: 50%;
}

.effect-thumb.particle-base span::before {
  inset: 4px 7px;
  border: 1px solid var(--dm-tertiary);
}

.effect-thumb.particle-base span::after {
  left: 50%;
  top: -6px;
  width: 3px;
  height: 3px;
  background: var(--dm-on-primary);
  box-shadow:
    -12px 4px 5px var(--dm-tertiary),
    10px 7px 5px var(--dm-tertiary),
    4px -4px 6px var(--dm-tertiary);
}

@keyframes particleBaseThumb {
  from { transform: rotateY(0deg); }
  to { transform: rotateY(360deg); }
}

.effect-thumb.linear-flow span::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 4px;
  height: 1px;
  background: var(--dm-tertiary);
  opacity: 0.32;
}

.effect-thumb.linear-flow span::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 0;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: var(--dm-on-primary);
  box-shadow: 0 0 8px var(--dm-tertiary), -7px 0 6px var(--dm-tertiary);
  animation: thumbLinearFlow 1.8s linear infinite;
}

@keyframes thumbLinearFlow {
  from { transform: translateX(-5px); opacity: 0; }
  12%, 88% { opacity: 1; }
  to { transform: translateX(38px); opacity: 0; }
}

.effect-thumb.scan span {
  width: 34px;
  height: 22px;
  border-radius: 0;
}

.effect-thumb.border-glow span {
  width: 34px;
  height: 22px;
  border-radius: 3px;
}

.effect-card strong {
  display: block;
  color: var(--dm-primary);
  font-size: 14px;
  line-height: 1.35;
  font-weight: 600;
}

.effect-card p {
  margin: 3px 0 0;
  color: var(--dm-secondary);
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.effect-card.active strong {
  color: var(--dm-primary);
}

.effect-card.active p {
  color: var(--dm-secondary);
}

.preview-stage {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 0;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  background: #020406;
  box-shadow: inset 0 0 40px rgba(0, 112, 243, 0.035);
}

.active-svg-name {
  position: absolute;
  z-index: 2;
  top: 14px;
  left: 14px;
  max-width: calc(100% - 28px);
  overflow: hidden;
  padding: 6px 9px;
  border: 1px solid var(--dm-hairline-strong);
  border-radius: var(--dm-radius-md);
  background: rgba(10, 10, 10, 0.9);
  color: var(--dm-secondary);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.generated-preview {
  display: grid;
  place-items: center;
  min-width: 280px;
  min-height: 0;
}

.effect-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.effect-meta div {
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  padding: 12px;
  background: var(--dm-surface-raised);
}

.effect-meta p {
  margin: 6px 0 0;
  color: var(--dm-primary);
}

.param-scroll {
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.param-scroll :deep(.el-scrollbar__view) {
  width: 100%;
  min-width: 0;
}

.param-stack {
  display: grid;
  gap: 14px;
}

.param-control {
  display: grid;
  gap: 8px;
}

.param-control label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--dm-secondary);
  font-size: 12px;
}

.param-control label small {
  color: var(--dm-secondary);
  font-family: "Geist Mono", ui-monospace, monospace;
}

.number-row {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 92px;
  gap: 10px;
  align-items: center;
}

.number-row > * {
  min-width: 0;
}

.number-row :deep(.el-input-number) {
  width: 92px;
  max-width: 92px;
}

.color-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.decoration-export :deep(.el-tabs) {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
}

.decoration-export :deep(.el-tabs__content),
.decoration-export :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
