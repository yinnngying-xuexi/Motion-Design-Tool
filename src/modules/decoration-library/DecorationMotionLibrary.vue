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
            <div class="effect-thumb" :class="effect.previewType">
              <span></span>
            </div>
            <div>
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
        <el-tag effect="dark">{{ currentEffect.section }}</el-tag>
      </header>

      <div class="preview-stage">
        <div class="generated-preview" v-html="previewMarkup"></div>
      </div>

      <div class="effect-meta">
        <div>
          <span>说明</span>
          <p>{{ currentEffect.description }}</p>
        </div>
        <div>
          <span>推荐场景</span>
          <p>{{ currentEffect.scene }}</p>
        </div>
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
        <el-button type="primary" @click="copyCode">复制</el-button>
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
import { computed, reactive, ref, watch } from "vue";
import { decorationEffects, decorationSections } from "@/data/decorationEffects";
import {
  generateDecorationCss,
  generateDecorationHtmlCss,
  generateDecorationJson,
  generateDecorationMarkup,
  generateDecorationVue
} from "@/generators/decorationGenerator";
import type { DecorationSection } from "@/types/decoration";
import CodeMirrorViewer from "@/modules/icon-base-library/CodeMirrorViewer.vue";

const activeSection = ref<DecorationSection>("图标底座");
const activeEffectId = ref(decorationEffects[0].id);
const activeExport = ref<"html" | "vue" | "json">("html");
const params = reactive<Record<string, string | number>>({});

const sectionEffects = computed(() => decorationEffects.filter((effect) => effect.section === activeSection.value));
const currentEffect = computed(() => decorationEffects.find((effect) => effect.id === activeEffectId.value) ?? sectionEffects.value[0] ?? decorationEffects[0]);

const cssCode = computed(() => generateDecorationCss(currentEffect.value, params));
const htmlCss = computed(() => generateDecorationHtmlCss(currentEffect.value, params));
const vueCode = computed(() => generateDecorationVue(currentEffect.value, params));
const jsonCode = computed(() => generateDecorationJson(currentEffect.value, params));
const previewMarkup = computed(() => `<style>${cssCode.value}</style>${generateDecorationMarkup(currentEffect.value)}`);
const currentCode = computed(() => (activeExport.value === "vue" ? vueCode.value : activeExport.value === "json" ? jsonCode.value : htmlCss.value));

watch(activeSection, () => {
  activeEffectId.value = sectionEffects.value[0]?.id ?? decorationEffects[0].id;
});

watch(currentEffect, resetParams, { immediate: true });

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
</script>

<style scoped>
.decoration-library {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 330px minmax(520px, 1fr) 340px;
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
  gap: 10px;
  padding-right: 8px;
}

.decoration-preview {
  grid-area: preview;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
}

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
  font-size: 24px;
}

.section-head small {
  color: var(--dm-secondary);
}

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
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 12px;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-md);
  padding: 12px;
  background: var(--dm-surface-raised);
  cursor: pointer;
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
  color: var(--dm-primary);
}

.effect-card p {
  margin: 5px 0 0;
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
