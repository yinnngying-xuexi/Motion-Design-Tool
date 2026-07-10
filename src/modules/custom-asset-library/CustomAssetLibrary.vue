<template>
  <section class="custom-asset-library">
    <aside class="asset-list panel">
      <header class="section-head">
        <div>
          <h2>自定义素材库</h2>
        </div>
        <el-upload accept=".css,text/css" :show-file-list="false" :before-upload="handleCssUpload">
          <el-button type="primary">上传 CSS</el-button>
        </el-upload>
      </header>

      <div class="paste-box">
        <el-input v-model="templateName" placeholder="模板名称" />
        <el-input v-model="cssDraft" type="textarea" :rows="8" placeholder="粘贴变量化 CSS 模板，例如 :root { --motion-color: #0070F3; }" />
        <el-button :disabled="!cssDraft.trim()" @click="createFromDraft">保存为素材</el-button>
      </div>

      <el-scrollbar class="asset-scroll">
        <div class="asset-stack">
          <article
            v-for="asset in assets"
            :key="asset.id"
            class="asset-card"
            :class="{ active: asset.id === currentAssetId }"
            @click="selectAsset(asset.id)"
          >
            <div>
              <strong>{{ asset.name }}</strong>
              <p>{{ asset.variables.length }} 个可调变量</p>
            </div>
            <el-button size="small" text @click.stop="deleteAsset(asset.id)">删除</el-button>
          </article>
        </div>
      </el-scrollbar>
    </aside>

    <main class="asset-preview panel">
      <header class="section-head">
        <div>
          <h2>{{ currentAsset?.name ?? "等待上传 CSS" }}</h2>
        </div>
        <el-tag effect="dark">用户上传</el-tag>
      </header>

      <div class="preview-stage">
        <div v-if="currentAsset" class="preview-host" v-html="previewMarkup"></div>
        <div v-else class="empty-state">
          <strong>上传或粘贴 CSS 模板</strong>
          <p>第一版支持变量化 CSS。建议模板使用 `.custom-asset-target` 作为预览选择器。</p>
        </div>
      </div>

      <div class="template-rule">
        <span>模板规则</span>
        <p>系统会读取 CSS 中的自定义变量，例如 <code>--motion-color: #0070F3;</code>，并将变量映射为右侧参数控件。</p>
      </div>
    </main>

    <aside class="asset-params panel">
      <header class="section-head">
        <div>
          <h2>参数编辑</h2>
        </div>
        <el-button size="small" :disabled="!currentAsset" @click="resetVariables">重置</el-button>
      </header>

      <el-scrollbar class="param-scroll">
        <div v-if="currentAsset && currentAsset.variables.length" class="param-stack">
          <div v-for="variable in currentAsset.variables" :key="variable.name" class="param-control">
            <label>
              <span>{{ variable.name }}</span>
              <small v-if="variable.unit">{{ variable.unit }}</small>
            </label>

            <div v-if="variable.type === 'color'" class="color-row">
              <el-color-picker v-model="variableValues[variable.name]" />
              <el-input v-model="variableValues[variable.name]" />
            </div>

            <div v-else-if="variable.type === 'number'" class="number-row">
              <el-slider
                :model-value="toNumber(variableValues[variable.name])"
                :min="numberRange(variable).min"
                :max="numberRange(variable).max"
                :step="numberRange(variable).step"
                @input="updateNumberVariable(variable.name, $event, variable.unit)"
              />
              <el-input v-model="variableValues[variable.name]" />
            </div>

            <el-input v-else v-model="variableValues[variable.name]" />
          </div>
        </div>

        <div v-else class="empty-state compact">
          <strong>暂无可调变量</strong>
          <p>请上传包含 CSS 变量的模板。</p>
        </div>
      </el-scrollbar>
    </aside>

    <section class="asset-export panel">
      <header class="section-head">
        <div>
          <h2>导出代码</h2>
        </div>
        <el-button type="primary" :disabled="!currentAsset" @click="copyCode">复制</el-button>
      </header>

      <el-tabs v-model="activeExport">
        <el-tab-pane label="HTML + CSS" name="html">
          <CodeMirrorViewer :code="htmlCssCode" language="html" />
        </el-tab-pane>
        <el-tab-pane label="CSS" name="css">
          <CodeMirrorViewer :code="currentCss" language="css" />
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
import type { UploadRawFile } from "element-plus";
import { computed, onMounted, reactive, ref, watch } from "vue";
import type { CssVariableParam } from "@/types/decoration";
import CodeMirrorViewer from "@/modules/icon-base-library/CodeMirrorViewer.vue";

interface CustomCssAsset {
  id: string;
  name: string;
  css: string;
  variables: CssVariableParam[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "visual-motion-custom-css-assets";
const defaultDraft = `:root {
  --motion-size: 140px;
  --motion-color: #0070F3;
  --motion-duration: 2.4s;
  --motion-glow: 24px;
}

.custom-asset-target {
  width: var(--motion-size);
  height: calc(var(--motion-size) * 0.55);
  border: 1px solid var(--motion-color);
  box-shadow: 0 0 var(--motion-glow) var(--motion-color);
  animation: customAssetPulse var(--motion-duration) ease-in-out infinite;
}

@keyframes customAssetPulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.04); }
}`;

const assets = ref<CustomCssAsset[]>([]);
const currentAssetId = ref("");
const templateName = ref("自定义 CSS 模板");
const cssDraft = ref(defaultDraft);
const activeExport = ref<"html" | "css" | "json">("html");
const variableValues = reactive<Record<string, string>>({});

const currentAsset = computed(() => assets.value.find((asset) => asset.id === currentAssetId.value) ?? null);
const currentCss = computed(() => {
  if (!currentAsset.value) return "";
  return applyVariableValues(currentAsset.value.css, variableValues);
});
const previewClass = computed(() => findPreviewClass(currentCss.value));
const previewMarkup = computed(() => `<style>${currentCss.value}</style><div class="${previewClass.value}"></div>`);
const htmlCssCode = computed(() => {
  if (!currentAsset.value) return "";
  return `<div class="${previewClass.value}"></div>

<style>
${currentCss.value}
</style>`;
});
const jsonCode = computed(() => {
  if (!currentAsset.value) return "";
  return JSON.stringify(
    {
      id: currentAsset.value.id,
      name: currentAsset.value.name,
      variables: variableValues,
      css: currentCss.value
    },
    null,
    2
  );
});
const currentCode = computed(() => (activeExport.value === "json" ? jsonCode.value : activeExport.value === "css" ? currentCss.value : htmlCssCode.value));

onMounted(loadAssets);

watch(currentAsset, () => {
  resetVariables();
});

watch(
  variableValues,
  () => {
    if (currentAsset.value) {
      currentAsset.value.variables = currentAsset.value.variables.map((variable) => ({
        ...variable,
        value: variableValues[variable.name] ?? variable.value
      }));
      currentAsset.value.updatedAt = new Date().toISOString();
    }
    saveAssets();
  },
  { deep: true }
);

function createFromDraft(): void {
  if (!cssDraft.value.trim()) return;
  addAsset(templateName.value.trim() || "自定义 CSS 模板", cssDraft.value);
  ElMessage.success("CSS 模板已保存");
}

function handleCssUpload(file: UploadRawFile): boolean {
  const validType = file.name.toLowerCase().endsWith(".css") || file.type === "text/css";
  if (!validType) {
    ElMessage.error("请上传 CSS 文件");
    return false;
  }

  const reader = new FileReader();
  reader.onload = () => {
    addAsset(file.name.replace(/\.css$/i, ""), String(reader.result ?? ""));
    ElMessage.success("CSS 模板已上传");
  };
  reader.readAsText(file);
  return false;
}

function addAsset(name: string, css: string): void {
  const now = new Date().toISOString();
  const asset: CustomCssAsset = {
    id: `custom-css-${Date.now()}`,
    name,
    css,
    variables: parseCssVariables(css),
    createdAt: now,
    updatedAt: now
  };
  assets.value.unshift(asset);
  currentAssetId.value = asset.id;
  saveAssets();
}

function selectAsset(id: string): void {
  currentAssetId.value = id;
}

function deleteAsset(id: string): void {
  const nextAssets = assets.value.filter((asset) => asset.id !== id);
  assets.value = nextAssets;
  if (currentAssetId.value === id) {
    currentAssetId.value = nextAssets[0]?.id ?? "";
  }
  saveAssets();
}

function resetVariables(): void {
  Object.keys(variableValues).forEach((key) => delete variableValues[key]);
  currentAsset.value?.variables.forEach((variable) => {
    variableValues[variable.name] = variable.value;
  });
}

function updateNumberVariable(name: string, value: number | number[], unit: string): void {
  const nextValue = Array.isArray(value) ? value[0] : value;
  variableValues[name] = `${nextValue}${unit}`;
}

function parseCssVariables(css: string): CssVariableParam[] {
  const matches = css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g);
  return Array.from(matches).map((match) => {
    const value = match[2].trim();
    const numberMatch = value.match(/^(-?\d+(?:\.\d+)?)(px|s|ms|rem|em|%|deg)?$/);
    const isColor = /^#|^rgb|^hsl/i.test(value);
    return {
      name: `--${match[1]}`,
      value,
      type: isColor ? "color" : numberMatch ? "number" : "text",
      unit: numberMatch?.[2] ?? "",
      numericValue: numberMatch ? Number(numberMatch[1]) : 0
    };
  });
}

function applyVariableValues(css: string, values: Record<string, string>): string {
  return css.replace(/(--[\w-]+\s*:\s*)([^;]+)(;)/g, (full, prefix: string, raw: string, suffix: string) => {
    const name = prefix.trim().replace(":", "");
    return `${prefix}${values[name] ?? raw.trim()}${suffix}`;
  });
}

function findPreviewClass(css: string): string {
  return css.match(/\.([_a-zA-Z][\w-]*)/)?.[1] ?? "custom-asset-target";
}

function toNumber(value: string): number {
  return Number(String(value).match(/-?\d+(?:\.\d+)?/)?.[0] ?? 0);
}

function numberRange(variable: CssVariableParam): { min: number; max: number; step: number } {
  if (variable.unit === "s") return { min: 0.2, max: 10, step: 0.1 };
  if (variable.unit === "ms") return { min: 100, max: 8000, step: 50 };
  if (variable.unit === "deg") return { min: -360, max: 360, step: 1 };
  if (variable.unit === "%") return { min: 0, max: 100, step: 1 };
  return { min: 0, max: Math.max(240, variable.numericValue * 3), step: 1 };
}

function saveAssets(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets.value));
}

function loadAssets(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    assets.value = JSON.parse(raw) as CustomCssAsset[];
    currentAssetId.value = assets.value[0]?.id ?? "";
  } catch {
    assets.value = [];
  }
}

async function copyCode(): Promise<void> {
  if (!currentAsset.value) return;
  await navigator.clipboard.writeText(currentCode.value);
  ElMessage.success("代码已复制");
}
</script>

<style scoped>
.custom-asset-library {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 340px minmax(520px, 1fr) 340px;
  grid-template-rows: minmax(0, 1fr) minmax(190px, 27vh);
  grid-template-areas:
    "list preview params"
    "list export export";
  gap: 14px;
}

.panel {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  background: var(--dm-surface-soft);
  padding: 20px;
  box-shadow: inset 0 0 0 1px rgba(0, 112, 243, 0.02);
}

.asset-list {
  grid-area: list;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 14px;
}

.asset-preview {
  grid-area: preview;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
}

.asset-params {
  grid-area: params;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
}

.asset-export {
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
.template-rule span {
  color: var(--dm-secondary);
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 0.75rem;
}

.section-head h2 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 24px;
}

.paste-box {
  display: grid;
  gap: 10px;
}

.asset-scroll,
.param-scroll {
  width: 100%;
  min-height: 0;
  overflow: hidden;
}

.asset-scroll :deep(.el-scrollbar__view),
.param-scroll :deep(.el-scrollbar__view) {
  width: 100%;
  min-width: 0;
}

.asset-stack,
.param-stack {
  display: grid;
  gap: 10px;
}

.asset-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  padding: 12px;
  background: var(--dm-surface-raised);
  cursor: pointer;
}

.asset-card.active {
  border-color: var(--dm-tertiary);
  background: rgba(0, 112, 243, 0.11);
  box-shadow: inset 0 0 24px rgba(0, 112, 243, 0.045);
}

.asset-card strong {
  color: var(--dm-primary);
}

.asset-card p {
  margin: 4px 0 0;
  color: var(--dm-secondary);
  font-size: 12px;
}

.preview-stage {
  display: grid;
  place-items: center;
  min-height: 0;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  background: #020406;
  box-shadow: inset 0 0 40px rgba(0, 112, 243, 0.035);
}

.preview-host {
  display: grid;
  place-items: center;
  min-width: 300px;
  min-height: 0;
}

.template-rule {
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  padding: 12px;
  background: var(--dm-surface-raised);
}

.template-rule p,
.empty-state p {
  margin: 6px 0 0;
  color: var(--dm-secondary);
}

.template-rule code {
  color: var(--dm-primary);
  font-family: "Geist Mono", ui-monospace, monospace;
}

.empty-state {
  max-width: 360px;
  text-align: center;
}

.empty-state strong {
  color: var(--dm-primary);
}

.empty-state.compact {
  padding: 32px 0;
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

.param-control label span,
.param-control label small {
  font-family: "Geist Mono", ui-monospace, monospace;
}

.number-row {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 116px;
  gap: 10px;
  align-items: center;
}

.number-row > * {
  min-width: 0;
}

.color-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.asset-export :deep(.el-tabs) {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
}

.asset-export :deep(.el-tabs__content),
.asset-export :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
