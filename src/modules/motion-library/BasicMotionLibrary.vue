<template>
  <section class="motion-library">
    <aside class="motion-sidebar panel">
      <header class="library-head">
        <div>
          <h2>{{ activeCategory === "全部" ? "基础动效" : activeCategory }}</h2>
        </div>
        <small>{{ filteredMotions.length }} / {{ basicMotions.length }}</small>
      </header>

      <div class="category-tabs">
        <button
          v-for="category in categories"
          :key="category"
          type="button"
          :class="{ active: activeCategory === category }"
          @click="activeCategory = category"
        >
          {{ category }}
        </button>
      </div>

      <el-scrollbar class="motion-list-scroll">
        <div class="motion-list">
          <article
            v-for="motion in filteredMotions"
            :key="motion.id"
            class="motion-card"
            :class="{ active: selectedMotion.id === motion.id }"
            @click="selectedMotionId = motion.id"
          >
            <div class="motion-thumb">
              <MotionPreviewVisual
                :motion-id="motion.id"
                :alt="`${motion.name}缩略预览`"
                :playing="selectedMotion.id === motion.id"
                :duration="motion.duration"
                :iteration="motion.iteration"
                :timing-function="motion.timingFunction"
                color="#0070F3"
                :glow="8"
              />
            </div>
            <div class="motion-card-copy">
              <strong>{{ motion.name }}</strong>
              <p>{{ motion.duration }}s · {{ motion.scene }}</p>
            </div>
          </article>
        </div>
      </el-scrollbar>
    </aside>

    <main class="motion-preview-panel panel">
      <header class="motion-workspace-head">
        <div class="motion-title-copy">
          <div class="motion-title-line">
            <h2>{{ selectedMotion.name }}</h2>
            <span>{{ selectedMotion.id === "fade-in" ? "Fade In" : selectedMotion.category }}</span>
          </div>
          <p>{{ selectedMotion.description }}</p>
        </div>
        <input ref="svgFileInput" class="hidden-file-input" type="file" accept=".svg,image/svg+xml" @change="handleSvgUpload" />
      </header>

      <div class="motion-view-toolbar">
        <div class="motion-view-tabs" role="tablist" aria-label="中间展示视图">
          <button
            type="button"
            role="tab"
            :aria-selected="activeWorkspaceView === 'preview'"
            :class="{ active: activeWorkspaceView === 'preview' }"
            @click="activeWorkspaceView = 'preview'"
          >
            动效预览
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeWorkspaceView === 'code'"
            :class="{ active: activeWorkspaceView === 'code' }"
            @click="activeWorkspaceView = 'code'"
          >
            代码展示
          </button>
        </div>
        <div class="workspace-actions">
          <el-button size="small" @click="triggerSvgImport">
            <el-icon><Upload /></el-icon>
            导入动效
          </el-button>
          <el-button size="small" @click="downloadHtml">导出 HTML</el-button>
          <el-button class="dm-blue-action" type="primary" size="small" @click="copyCode">复制代码</el-button>
        </div>
      </div>

      <div class="motion-workspace-content">
        <section
          v-show="activeWorkspaceView === 'preview'"
          ref="previewCapture"
          class="motion-stage"
          :class="{ paused: !previewPlaying }"
          :key="`${selectedMotion.id}-${previewKey}`"
          role="tabpanel"
        >
          <div
            v-if="svgAsset"
            class="screen-card imported-svg-only"
            :class="[`preview-${selectedMotion.previewType}`, `motion-${selectedMotion.id}`]"
            :style="previewStyle"
          >
            <span v-if="selectedMotion.previewType === 'ripple'" class="ripple" :style="rippleStyle"></span>
            <span v-if="selectedMotion.previewType === 'scan'" class="scan-line" :style="scanStyle"></span>
            <div class="imported-svg" v-html="svgAsset.markup"></div>
          </div>
          <MotionPreviewVisual
            v-else
            class="editor-motion-visual"
            :motion-id="selectedMotion.id"
            :alt="`${selectedMotion.name}动效预览`"
            :playing="previewPlaying"
            :duration="motionConfig.duration"
            :delay="motionConfig.delay"
            :iteration="motionConfig.iteration"
            :timing-function="motionConfig.timingFunction"
            :direction="motionConfig.direction"
            :color="motionConfig.color"
            :opacity="motionConfig.opacity"
            :translate-x="motionConfig.translateX"
            :translate-y="motionConfig.translateY"
            :scale="motionConfig.scale"
            :rotate="motionConfig.rotate"
            :blur="motionConfig.blur"
            :shadow="motionConfig.shadow"
            :glow="motionConfig.glow"
            :loop-speed="motionConfig.loopSpeed"
            :blink-frequency="motionConfig.blinkFrequency"
            :border-width="motionConfig.borderWidth"
            :amplitude="motionConfig.amplitude"
            :scan-speed="motionConfig.scanSpeed"
            :ripple-radius="motionConfig.rippleRadius"
          />
        </section>

        <section v-show="activeWorkspaceView === 'code'" class="motion-export" role="tabpanel">
          <CodeMirrorViewer :code="htmlCssCode" language="html" />
        </section>
      </div>
    </main>

    <aside class="motion-info panel">
      <header class="library-head param-head">
        <div>
          <h2>参数设置</h2>
        </div>
        <el-button size="small" @click="resetConfig">重置</el-button>
      </header>

      <el-scrollbar class="param-scroll">
        <div class="param-section">
          <h3>基础参数</h3>
          <NumberControl label="动效时长 duration" v-model="motionConfig.duration" :min="0.1" :max="10" :step="0.1" unit="s" />
          <NumberControl label="延迟时间 delay" v-model="motionConfig.delay" :min="0" :max="5" :step="0.1" unit="s" />
          <FieldBlock label="播放次数 iteration-count">
            <el-select v-model="motionConfig.iteration">
              <el-option label="1 次" value="1" />
              <el-option label="2 次" value="2" />
              <el-option label="3 次" value="3" />
              <el-option label="无限循环" value="infinite" />
            </el-select>
          </FieldBlock>
          <FieldBlock label="播放方向 direction">
            <el-select v-model="motionConfig.direction">
              <el-option label="normal" value="normal" />
              <el-option label="reverse" value="reverse" />
              <el-option label="alternate" value="alternate" />
              <el-option label="alternate-reverse" value="alternate-reverse" />
            </el-select>
          </FieldBlock>
          <FieldBlock label="缓动曲线 timing-function">
            <el-select v-model="motionConfig.timingFunction">
              <el-option label="linear" value="linear" />
              <el-option label="ease" value="ease" />
              <el-option label="ease-in" value="ease-in" />
              <el-option label="ease-out" value="ease-out" />
              <el-option label="ease-in-out" value="ease-in-out" />
            </el-select>
          </FieldBlock>
          <NumberControl label="透明度 opacity" v-model="motionConfig.opacity" :min="0.1" :max="1" :step="0.05" />
          <NumberControl label="横向位移 translateX" v-model="motionConfig.translateX" :min="-160" :max="160" :step="1" unit="px" />
          <NumberControl label="纵向位移 translateY" v-model="motionConfig.translateY" :min="-160" :max="160" :step="1" unit="px" />
          <NumberControl label="缩放 scale" v-model="motionConfig.scale" :min="0.2" :max="2.5" :step="0.05" />
          <NumberControl label="旋转 rotate" v-model="motionConfig.rotate" :min="-360" :max="360" :step="1" unit="deg" />
          <NumberControl label="模糊 blur" v-model="motionConfig.blur" :min="0" :max="24" :step="1" unit="px" />
          <NumberControl label="阴影 shadow" v-model="motionConfig.shadow" :min="0" :max="64" :step="1" unit="px" />
        </div>

        <div class="param-section">
          <h3>动效细节</h3>
          <NumberControl label="发光强度 glow" v-model="motionConfig.glow" :min="0" :max="64" :step="1" unit="px" />
          <NumberControl label="闪烁频率" v-model="motionConfig.blinkFrequency" :min="0.2" :max="8" :step="0.1" unit="Hz" />
          <NumberControl label="循环速度" v-model="motionConfig.loopSpeed" :min="0.2" :max="4" :step="0.1" />
          <NumberControl label="动效幅度" v-model="motionConfig.amplitude" :min="0" :max="100" :step="1" />
          <FieldBlock label="颜色 color">
            <div class="color-row">
              <el-color-picker v-model="motionConfig.color" />
              <el-input v-model="motionConfig.color" />
            </div>
          </FieldBlock>
          <NumberControl label="边框宽度 border-width" v-model="motionConfig.borderWidth" :min="0" :max="12" :step="1" unit="px" />
          <NumberControl label="扫描线速度" v-model="motionConfig.scanSpeed" :min="0.2" :max="8" :step="0.1" unit="s" />
          <NumberControl label="扩散半径" v-model="motionConfig.rippleRadius" :min="20" :max="260" :step="1" unit="px" />
        </div>
      </el-scrollbar>
    </aside>

  </section>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import { computed, defineComponent, h, onBeforeUnmount, onMounted, reactive, ref, resolveComponent, watch } from "vue";
import { basicMotions } from "@/data/basicMotions";
import {
  generateBasicMotionHtmlCss,
  type BasicMotionConfig
} from "@/generators/basicMotionGenerator";
import { useMyMotionStore } from "@/stores/myMotionStore";
import type { MotionCategory } from "@/types/motion";
import type { SvgPreviewAsset } from "@/types/svgFlow";
import { readSvgPreviewFile } from "@/utils/svgFlow";
import { createMotionArtifact } from "@/utils/motionArtifact";
import CodeMirrorViewer from "@/modules/icon-base-library/CodeMirrorViewer.vue";
import MotionPreviewVisual from "@/modules/motion-library/MotionPreviewVisual.vue";

type MotionEditorConfig = BasicMotionConfig;

const props = defineProps<{ initialMotionId?: string }>();
const store = useMyMotionStore();
const keyword = ref("");
const activeCategory = ref<"全部" | MotionCategory>("全部");
const selectedMotionId = ref(basicMotions.some((motion) => motion.id === props.initialMotionId) ? props.initialMotionId! : basicMotions[0].id);
const previewKey = ref(0);
const previewPlaying = ref(true);
const previewCapture = ref<HTMLElement>();
const svgAsset = ref<SvgPreviewAsset>();
const svgFileInput = ref<HTMLInputElement>();
const activeWorkspaceView = ref<"preview" | "code">("preview");

const categories = computed(() => ["全部", ...new Set(basicMotions.map((motion) => motion.category))] as Array<"全部" | MotionCategory>);

const filteredMotions = computed(() =>
  basicMotions.filter((motion) => {
    const matchesCategory = activeCategory.value === "全部" || motion.category === activeCategory.value;
    const query = keyword.value.trim();
    const matchesKeyword = !query || motion.name.includes(query) || motion.scene.includes(query);
    return matchesCategory && matchesKeyword;
  })
);

const selectedMotion = computed(() => basicMotions.find((motion) => motion.id === selectedMotionId.value) ?? basicMotions[0]);
const motionConfig = reactive<MotionEditorConfig>(createDefaultConfig());
const htmlCssCode = computed(() => generateBasicMotionHtmlCss(selectedMotion.value, motionConfig, svgAsset.value));

const previewStyle = computed(() => ({
  opacity: motionConfig.opacity,
  transform: `translate(${motionConfig.translateX}px, ${motionConfig.translateY}px) scale(${motionConfig.scale}) rotate(${motionConfig.rotate}deg)`,
  filter: `blur(${motionConfig.blur}px)`,
  borderWidth: `${motionConfig.borderWidth}px`,
  borderColor: motionConfig.color,
  boxShadow: `0 0 ${motionConfig.shadow}px rgba(0,0,0,0.8), 0 0 ${motionConfig.glow}px ${motionConfig.color}`,
  color: motionConfig.color,
  animationDuration: `${selectedMotion.value.previewType === "blink" ? 1 / motionConfig.blinkFrequency : motionConfig.duration / motionConfig.loopSpeed}s`,
  animationDelay: `${motionConfig.delay}s`,
  animationIterationCount: motionConfig.iteration,
  animationTimingFunction: motionConfig.timingFunction,
  animationDirection: motionConfig.direction,
  "--motion-color": motionConfig.color,
  "--motion-amplitude": `${motionConfig.amplitude}px`
}));

const rippleStyle = computed(() => ({
  width: `${motionConfig.rippleRadius}px`,
  height: `${motionConfig.rippleRadius}px`,
  borderColor: motionConfig.color,
  animationDuration: `${motionConfig.duration / motionConfig.loopSpeed}s`,
  animationDelay: `${motionConfig.delay}s`,
  animationIterationCount: motionConfig.iteration,
  animationTimingFunction: motionConfig.timingFunction,
  animationDirection: motionConfig.direction
}));

const scanStyle = computed(() => ({
  background: motionConfig.color,
  animationDuration: `${motionConfig.scanSpeed}s`,
  animationDelay: `${motionConfig.delay}s`,
  animationIterationCount: motionConfig.iteration,
  animationTimingFunction: motionConfig.timingFunction,
  animationDirection: motionConfig.direction
}));

onMounted(() => {
  store.loadFromLocal();
  window.addEventListener("datamotion:import-svg", triggerSvgImport);
  window.addEventListener("datamotion:save", saveSelected);
  window.addEventListener("datamotion:export", downloadHtml);
  window.addEventListener("datamotion:search", handleGlobalSearch);
});

onBeforeUnmount(() => {
  window.removeEventListener("datamotion:import-svg", triggerSvgImport);
  window.removeEventListener("datamotion:save", saveSelected);
  window.removeEventListener("datamotion:export", downloadHtml);
  window.removeEventListener("datamotion:search", handleGlobalSearch);
});

watch(selectedMotionId, () => {
  resetConfig();
});

function createDefaultConfig(): MotionEditorConfig {
  return {
    duration: selectedMotion.value?.duration ?? 1.2,
    delay: 0,
    iteration: selectedMotion.value?.iteration === "3" ? "3" : selectedMotion.value?.iteration === "1" ? "1" : "infinite",
    direction: "normal",
    timingFunction: (selectedMotion.value?.timingFunction as MotionEditorConfig["timingFunction"]) ?? "ease-in-out",
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
    rotate: 0,
    blur: 0,
    shadow: 24,
    glow: 18,
    blinkFrequency: 1,
    loopSpeed: 1,
    amplitude: 24,
    color: "#0070F3",
    borderWidth: 1,
    scanSpeed: 1.8,
    rippleRadius: 96
  };
}

function resetConfig(): void {
  Object.assign(motionConfig, createDefaultConfig());
  previewKey.value += 1;
  previewPlaying.value = true;
}

function handleGlobalSearch(event: Event): void {
  keyword.value = (event as CustomEvent<string>).detail ?? "";
}

async function saveSelected(): Promise<void> {
  try {
    const existed = store.savedMotions.some((motion) => motion.id === selectedMotion.value.id);
    const artifact = await createMotionArtifact({
      id: selectedMotion.value.id,
      name: selectedMotion.value.name,
      htmlCss: htmlCssCode.value,
      previewNode: previewCapture.value
    });
    store.saveMotion(selectedMotion.value, artifact);
    ElMessage.success(existed ? "已更新我的动效（HTML、预览图和名称）" : "已保存 HTML、预览图和名称");
  } catch {
    ElMessage.error("保存失败，无法生成当前动效预览图");
  }
}

function triggerSvgImport(): void {
  svgFileInput.value?.click();
}

async function handleSvgUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    svgAsset.value = await readSvgPreviewFile(file);
    ElMessage.success("SVG 已导入并应用当前动效");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "SVG 导入失败");
  } finally {
    input.value = "";
  }
}

async function copyCode(): Promise<void> {
  await navigator.clipboard.writeText(htmlCssCode.value);
  ElMessage.success("代码已复制");
}

function downloadHtml(): void {
  const code = `<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${selectedMotion.value.name}</title>\n<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#000}</style>\n</head>\n<body>\n${htmlCssCode.value}\n</body>\n</html>`;
  const url = URL.createObjectURL(new Blob([code], { type: "text/html;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${selectedMotion.value.id}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
  ElMessage.success("HTML 文件已导出");
}

const FieldBlock = defineComponent({
  props: {
    label: { type: String, required: true }
  },
  setup(props, { slots }) {
    return () =>
      h("label", { class: "field-block" }, [
        h("span", props.label),
        slots.default?.()
      ]);
  }
});

const NumberControl = defineComponent({
  props: {
    label: { type: String, required: true },
    modelValue: { type: Number, required: true },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    unit: { type: String, default: "" }
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const update = (value: number | number[] | undefined): void => {
      emit("update:modelValue", Array.isArray(value) ? value[0] : Number(value ?? props.modelValue));
    };

    return () =>
      h("div", { class: "number-control" }, [
        h("div", { class: "control-label" }, [
          h("span", props.label),
          h("b", `${props.modelValue}${props.unit}`)
        ]),
        h("div", { class: "control-row" }, [
          h(resolveComponent("el-slider"), {
            modelValue: props.modelValue,
            min: props.min,
            max: props.max,
            step: props.step,
            onInput: update
          }),
          h(resolveComponent("el-input-number"), {
            modelValue: props.modelValue,
            min: props.min,
            max: props.max,
            step: props.step,
            controls: false,
            onChange: update
          })
        ])
      ]);
  }
});
</script>

<style scoped>
.motion-library {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 200px minmax(500px, 1fr) 320px;
  grid-template-rows: minmax(0, 1fr);
  grid-template-areas: "list preview params";
  gap: 16px;
}

.motion-sidebar,
.motion-preview-panel,
.motion-info {
  min-width: 0;
  min-height: 0;
  padding: 18px;
}

.motion-sidebar {
  grid-area: list;
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 14px;
}

.library-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.library-head span,
.motion-detail span {
  color: var(--dm-secondary);
  font-family: "Geist Mono", ui-monospace, monospace;
  font-size: 0.75rem;
  letter-spacing: 0;
}

.library-head h2 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 15px;
  line-height: 1.3;
  font-weight: 600;
}

.library-head small {
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

.category-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.category-tabs button {
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
  color: var(--dm-secondary);
  padding: 7px 6px;
  font-size: 11px;
  cursor: pointer;
}

.category-tabs button.active {
  color: var(--dm-tertiary);
  background: rgba(255, 255, 255, 0.085);
}

.motion-list-scroll {
  min-height: 0;
}

.motion-list {
  display: grid;
  gap: 6px;
  padding-right: 5px;
}

.motion-card {
  min-width: 0;
  border: 0;
  border-radius: var(--dm-radius-md);
  min-height: 70px;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  align-items: center;
  gap: 11px;
  background: rgba(255, 255, 255, 0.025);
  padding: 7px;
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease;
}

.motion-card:hover:not(.active) {
  background: rgba(255, 255, 255, 0.045);
}

.motion-card.active {
  background: rgba(255, 255, 255, 0.09);
  box-shadow: none;
}

.motion-thumb {
  width: 58px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  overflow: hidden;
  background: #101010;
  color: var(--dm-tertiary);
}

.motion-thumb :deep(.motion-preview-visual) {
  background-color: var(--dm-motion-canvas-background);
}

.motion-thumb :deep(.preview-target) {
  width: 68%;
}

.motion-card strong {
  display: block;
  color: var(--dm-primary);
  font-size: 12px;
  line-height: 1.35;
  font-weight: 600;
}

.motion-card p {
  margin: 3px 0 0;
  color: var(--dm-secondary);
  font-size: 10px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.motion-card.active strong {
  color: var(--dm-primary);
}

.motion-card.active p {
  color: var(--dm-secondary);
}

.motion-preview-panel {
  grid-area: preview;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 0;
  padding: 20px;
}

.hidden-file-input { display: none; }

.motion-workspace-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 0 0 16px;
}

.motion-title-copy {
  min-width: 0;
}

.motion-title-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.motion-title-line h2 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 28px;
  line-height: 1.25;
  font-weight: 620;
}

.motion-title-line span {
  color: var(--dm-secondary);
  font-size: 14px;
}

.motion-title-copy p {
  margin: 7px 0 0;
  color: var(--dm-secondary);
  font-size: 12px;
}

.motion-view-toolbar {
  min-height: 46px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--dm-hairline);
}

.motion-view-tabs {
  align-self: stretch;
  display: flex;
  align-items: stretch;
  gap: 4px;
}

.motion-view-tabs button {
  position: relative;
  min-width: 84px;
  padding: 0 10px 12px;
  border: 0;
  background: transparent;
  color: var(--dm-secondary);
  font-size: 13px;
  cursor: pointer;
}

.motion-view-tabs button::after {
  content: "";
  position: absolute;
  right: 10px;
  bottom: -1px;
  left: 10px;
  height: 2px;
  border-radius: 999px;
  background: transparent;
}

.motion-view-tabs button:hover {
  color: var(--dm-primary);
}

.motion-view-tabs button.active {
  color: #1683ff;
}

.motion-view-tabs button.active::after {
  background: #0070f3;
}

.workspace-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-bottom: 9px;
}

.workspace-actions :deep(.el-button) {
  border-radius: 4px;
}

.motion-workspace-content {
  min-width: 0;
  min-height: 0;
  display: grid;
  padding-top: 14px;
}

.motion-workspace-content > * {
  grid-area: 1 / 1;
}

.motion-stage {
  position: relative;
  min-height: 0;
  height: 100%;
  display: grid;
  place-items: center;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  overflow: hidden;
  background-color: #0d0d0d;
  box-shadow: none;
}

.motion-stage::before {
  display: none;
}

.editor-motion-visual {
  z-index: 1;
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
  border: 0;
  border-radius: var(--dm-radius-lg);
  background-color: var(--dm-motion-canvas-background);
  box-shadow: none;
}

.screen-card {
  position: relative;
  width: min(320px, 58%);
  aspect-ratio: 1.15;
  height: auto;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  overflow: hidden;
  border: 1px solid var(--dm-tertiary);
  border-radius: var(--dm-radius-lg);
  background: rgba(20, 19, 15, 0.94);
  color: var(--dm-primary);
  transform-origin: center;
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28), inset 0 0 22px rgba(255, 255, 255, 0.018);
}

.screen-card strong {
  color: var(--dm-tertiary);
  font-size: clamp(38px, 4vw, 60px);
  line-height: 1;
  text-shadow: none;
}

.screen-card p,
.screen-card small {
  margin: 0;
  color: var(--dm-secondary);
}

.screen-card p { color: var(--dm-primary); font-size: 14px; }
.screen-card small { margin-top: 8px; font-size: 12px; }

.screen-card.imported-svg-only {
  overflow: visible;
  border: 0 !important;
  border-radius: 0;
  background: transparent;
  box-shadow: none !important;
}

.preview-heading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-heading .el-icon { color: var(--dm-tertiary); }

.preview-chart {
  width: 82%;
  height: 54px;
  display: grid;
  place-items: center;
  margin-top: 8px;
  overflow: hidden;
  color: var(--dm-tertiary);
}

.preview-chart .el-icon {
  width: 100%;
  height: 100%;
  font-size: 62px;
  opacity: 0.8;
}

.motion-stage.paused :is(.screen-card, .screen-card *, .ripple, .scan-line, .editor-motion-visual, .editor-motion-visual *) { animation-play-state: paused !important; }

.imported-svg {
  width: min(78%, 180px);
  height: min(78%, 110px);
  display: grid;
  place-items: center;
}

.imported-svg :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.motion-detail {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.motion-detail div {
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  padding: 14px;
  background: var(--dm-surface-raised);
}

.motion-detail p {
  margin: 6px 0 0;
  color: var(--dm-primary);
}

.motion-info {
  grid-area: params;
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
  overflow: hidden;
}

.motion-export {
  min-width: 0;
  min-height: 0;
  display: grid;
  height: 100%;
  padding: 0;
  overflow: hidden;
  background: #0d0d0d;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
}

.motion-export :deep(.code-mirror-host) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 0;
}

.param-head {
  align-items: center;
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

.param-section {
  display: grid;
  gap: 15px;
  padding: 14px 2px 18px;
}

.param-section + .param-section {
  padding-top: 18px;
  border-top: 1px solid var(--dm-hairline);
}

.param-section h3 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 13px;
  font-weight: 600;
}

.color-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

:deep(.field-block) {
  display: grid;
  gap: 8px;
}

:deep(.field-block > span),
:deep(.control-label) {
  color: var(--dm-secondary);
  font-size: 12px;
}

:deep(.control-label) {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

:deep(.control-label b) {
  color: var(--dm-primary);
  font-weight: 500;
}

:deep(.number-control) {
  width: 100%;
  min-width: 0;
  display: grid;
  gap: 8px;
}

:deep(.control-row) {
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 72px;
  gap: 10px;
  align-items: center;
}

:deep(.control-row > *) {
  min-width: 0;
}

:deep(.control-row .el-input-number) {
  width: 72px;
  max-width: 72px;
}

.preview-fade span,
.preview-fade {
  animation-name: motionFade;
}

.preview-slide span,
.preview-slide {
  animation-name: motionSlide;
}

.motion-slide-up span,
.motion-slide-up {
  animation-name: motionSlideUp;
}

.motion-slide-left span,
.motion-slide-left {
  animation-name: motionSlideLeft;
}

.preview-scale span,
.preview-scale {
  animation-name: motionScale;
}

.preview-pulse span,
.preview-pulse {
  animation-name: motionPulse;
}

.preview-float span,
.preview-float {
  animation-name: motionFloat;
}

.preview-blink span,
.preview-blink {
  animation-name: motionBlink;
}

.preview-rotate span,
.preview-rotate {
  animation-name: motionRotate;
}

.preview-glow span,
.preview-glow {
  animation-name: motionGlow;
}

.ripple {
  position: absolute;
  border: 1px solid var(--dm-tertiary);
  border-radius: 999px;
  animation-name: motionRipple;
}

.scan-line {
  position: absolute;
  inset: 0;
  height: 2px;
  animation-name: motionScan;
}

@keyframes motionFade {
  50% { opacity: 0.35; }
}

@keyframes motionSlide {
  0%, 100% { translate: 0 0; }
  50% { translate: var(--motion-amplitude) calc(var(--motion-amplitude) * -1); }
}

@keyframes motionSlideUp {
  0% { translate: 0 16px; opacity: 0.2; }
  45%, 100% { translate: 0 0; opacity: 1; }
}

@keyframes motionSlideLeft {
  0% { translate: -16px 0; opacity: 0.2; }
  45%, 100% { translate: 0 0; opacity: 1; }
}

@keyframes motionScale {
  50% { scale: 1.08; }
}

@keyframes motionPulse {
  50% { scale: 1.06; opacity: 0.72; }
}

@keyframes motionFloat {
  50% { translate: 0 calc(var(--motion-amplitude) * -1); }
}

@keyframes motionBlink {
  50% { opacity: 0.28; }
}

@keyframes motionRotate {
  to { rotate: 360deg; }
}

@keyframes motionGlow {
  50% { box-shadow: 0 0 24px var(--motion-color); }
}

@keyframes motionRipple {
  from { transform: scale(0.55); opacity: 0.9; }
  to { transform: scale(2); opacity: 0; }
}

@keyframes motionScan {
  from { transform: translateY(-8px); }
  to { transform: translateY(160px); }
}
</style>
