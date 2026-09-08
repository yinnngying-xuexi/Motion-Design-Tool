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
                :direction="motion.defaultConfig.direction"
                :color="motion.defaultConfig.color ?? '#0070F3'"
                :min-opacity="motion.defaultConfig.minOpacity"
                :max-opacity="motion.defaultConfig.maxOpacity"
                :min-scale="motion.defaultConfig.minScale"
                :max-scale="motion.defaultConfig.maxScale"
                :offset-y="motion.defaultConfig.offsetY"
                :glow-peak="motion.defaultConfig.glowPeak ?? 8"
                :glow-strength="motion.defaultConfig.glowStrength"
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
            <el-icon><Download /></el-icon>
            导入 SVG
          </el-button>
          <el-button size="small" @click="downloadHtml">导出 HTML</el-button>
          <el-button class="dm-blue-action" type="primary" size="small" @click="copyCode">复制代码</el-button>
        </div>
      </div>

      <div class="motion-workspace-content">
        <div v-show="activeWorkspaceView === 'preview'" class="preview-surface" role="tabpanel">
          <section
            ref="previewCapture"
            class="motion-stage"
            :class="{ paused: previewState !== 'playing' }"
            :key="`${selectedMotion.id}-${previewKey}`"
          >
            <MotionPreviewVisual
              class="editor-motion-visual"
              :motion-id="selectedMotion.id"
              :alt="`${selectedMotion.name}动效预览`"
              :playing="previewAnimationActive"
              :duration="previewMotionDuration"
              :delay="motionConfig.delay"
              :iteration="previewIteration"
              :timing-function="motionConfig.timingFunction"
              :direction="motionConfig.direction"
              :color="motionConfig.color"
              :start-opacity="motionConfig.startOpacity"
              :end-opacity="motionConfig.endOpacity"
              :min-opacity="motionConfig.minOpacity"
              :max-opacity="motionConfig.maxOpacity"
              :start-scale="motionConfig.startScale"
              :end-scale="motionConfig.endScale"
              :min-scale="motionConfig.minScale"
              :max-scale="motionConfig.maxScale"
              :start-blur="motionConfig.startBlur"
              :offset-x="motionConfig.offsetX"
              :offset-y="motionConfig.offsetY"
              :rotation-angle="motionConfig.rotationAngle"
              :emphasis-scale="motionConfig.emphasisScale"
              :rebound-scale="motionConfig.reboundScale"
              :glow-base="motionConfig.glowBase"
              :glow-peak="motionConfig.glowPeak"
              :glow-strength="motionConfig.glowStrength"
              :blink-frequency="motionConfig.blinkFrequency"
              :border-width="motionConfig.borderWidth"
              :scan-speed="motionConfig.scanSpeed"
              :scan-direction="motionConfig.scanDirection"
              :scan-line-width="motionConfig.scanLineWidth"
              :scan-length="motionConfig.scanLength"
              :ripple-start-radius="motionConfig.rippleStartRadius"
              :ripple-end-radius="motionConfig.rippleEndRadius"
              :ripple-count="motionConfig.rippleCount"
              :ripple-interval="motionConfig.rippleInterval"
              :flow-length="motionConfig.flowLength"
              :flow-head-opacity="motionConfig.flowHeadOpacity"
              :flow-tail-opacity="motionConfig.flowTailOpacity"
              :flow-head-width="motionConfig.flowHeadWidth"
              :flow-tail-width="motionConfig.flowTailWidth"
              :svg-markup="svgAsset?.markup"
              :svg-width="svgAsset?.width"
              :svg-height="svgAsset?.height"
              :svg-color-mode="svgStyle.colorMode"
              :svg-fill-color="svgStyle.fillColor"
              :svg-stroke-color="svgStyle.strokeColor"
              :svg-stroke-width="svgStyle.strokeWidth"
              :svg-opacity="svgStyle.opacity"
            />
          </section>
          <PreviewPlaybackControls
            :duration="previewMotionDuration"
            @replay="restartTimelinePlayback"
          />
        </div>

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
        <div v-for="group in selectedMotion.paramGroups" :key="group.id" class="param-section">
          <h3>{{ group.title }}</h3>
          <template v-for="param in group.params" :key="param.key">
            <NumberControl
              v-if="param.type === 'number'"
              :label="param.label"
              :model-value="numberValue(param.key)"
              :min="param.min"
              :max="param.max"
              :step="param.step"
              :unit="param.unit"
              @update:model-value="setMotionParam(param.key, $event)"
              @commit="commitMotionParam"
            />
            <FieldBlock v-else-if="param.type === 'color'" :label="param.label">
              <div class="color-row">
                <el-color-picker
                  :model-value="stringValue(param.key)"
                  @update:model-value="setMotionParam(param.key, $event || '#0070F3')"
                />
                <el-input
                  :model-value="stringValue(param.key)"
                  @update:model-value="setMotionParam(param.key, $event)"
                />
              </div>
            </FieldBlock>
            <FieldBlock v-else :label="param.label">
              <el-select
                :model-value="motionConfig[param.key]"
                @update:model-value="setCommittedMotionParam(param.key, $event)"
              >
                <el-option
                  v-for="option in param.options"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </FieldBlock>
          </template>
        </div>

        <SvgStylePanel
          v-if="svgAsset"
          :model-value="svgStyle"
          :primary-color="svgAsset.primaryColor"
          @update:model-value="updateSvgStyle"
        />
      </el-scrollbar>
    </aside>

  </section>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { Download } from "@element-plus/icons-vue";
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref, resolveComponent, watch } from "vue";
import { basicMotions } from "@/data/basicMotions";
import {
  generateBasicMotionHtmlCss,
  type BasicMotionConfig
} from "@/generators/basicMotionGenerator";
import { useMyMotionStore } from "@/stores/myMotionStore";
import type {
  BasicMotionParamKey,
  BasicMotionTemplate,
  MotionCategory
} from "@/types/motion";
import type { SvgPreviewAsset, SvgStyleConfig } from "@/types/svgFlow";
import { createDefaultSvgStyleConfig, readSvgPreviewFile } from "@/utils/svgFlow";
import { createMotionArtifact } from "@/utils/motionArtifact";
import CodeMirrorViewer from "@/modules/icon-base-library/CodeMirrorViewer.vue";
import PreviewPlaybackControls from "@/modules/icon-base-library/PreviewPlaybackControls.vue";
import MotionPreviewVisual from "@/modules/motion-library/MotionPreviewVisual.vue";
import SvgStylePanel from "@/modules/motion-library/SvgStylePanel.vue";

type MotionEditorConfig = BasicMotionConfig;

const props = defineProps<{ initialMotionId?: string }>();
const store = useMyMotionStore();
const keyword = ref("");
const activeCategory = ref<"全部" | MotionCategory>("全部");
const selectedMotionId = ref(basicMotions.some((motion) => motion.id === props.initialMotionId) ? props.initialMotionId! : basicMotions[0].id);
const previewKey = ref(0);
type PreviewState = "idle" | "playing" | "paused" | "ended";
const previewState = ref<PreviewState>("idle");
const previewCurrentTime = ref(0);
const previewLooping = ref(false);
const previewCapture = ref<HTMLElement>();
const svgAsset = ref<SvgPreviewAsset>();
const svgStyle = reactive<SvgStyleConfig>(createDefaultSvgStyleConfig());
const svgFileInput = ref<HTMLInputElement>();
const activeWorkspaceView = ref<"preview" | "code">("preview");
const motionConfigMemory = new Map<string, MotionEditorConfig>();
let previewFrameId = 0;
let previewLastTick = 0;
let parameterReplayTimer = 0;
let suppressTimelineRestart = false;

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
const htmlCssCode = computed(() => generateBasicMotionHtmlCss(selectedMotion.value, motionConfig, svgAsset.value, svgStyle));
const previewAnimationActive = computed(() => previewState.value !== "idle");
const previewMotionDuration = computed(() => {
  if (selectedMotion.value.id === "alert-blink") return 1 / Math.max(motionConfig.blinkFrequency, 0.1);
  if (selectedMotion.value.id === "scan-line") return motionConfig.scanSpeed;
  return motionConfig.duration;
});
const previewTotalTime = computed(() => Math.max(0.01, motionConfig.delay + previewMotionDuration.value));
const isConfiguredLoop = computed(() =>
  ["breath", "float", "soft-blink", "glow-pulse", "slow-rotate"].includes(selectedMotion.value.id)
);
const previewIteration = computed(() => isConfiguredLoop.value ? "infinite" : "1");
const usesCommittedParameterReplay = computed(() =>
  ["slide-up", "slide-left", "scale-in", "breath", "float", "soft-blink", "glow-pulse", "slow-rotate"].includes(selectedMotion.value.id)
);

onMounted(() => {
  store.loadFromLocal();
  window.addEventListener("datamotion:import-svg", triggerSvgImport);
  window.addEventListener("datamotion:save", saveSelected);
  window.addEventListener("datamotion:export", downloadHtml);
  window.addEventListener("datamotion:search", handleGlobalSearch);
  void nextTick(restartTimelinePlayback);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(previewFrameId);
  window.clearTimeout(parameterReplayTimer);
  window.removeEventListener("datamotion:import-svg", triggerSvgImport);
  window.removeEventListener("datamotion:save", saveSelected);
  window.removeEventListener("datamotion:export", downloadHtml);
  window.removeEventListener("datamotion:search", handleGlobalSearch);
});

watch(selectedMotionId, async (nextId, previousId) => {
  if (previousId) motionConfigMemory.set(previousId, { ...motionConfig });
  const nextTemplate = basicMotions.find((motion) => motion.id === nextId) ?? basicMotions[0];
  suppressTimelineRestart = true;
  Object.assign(motionConfig, motionConfigMemory.get(nextId) ?? createDefaultConfig(nextTemplate));
  previewKey.value += 1;
  stopTimelineAtStart();
  await nextTick();
  suppressTimelineRestart = false;
  restartTimelinePlayback();
});

watch(motionConfig, () => {
  motionConfigMemory.set(selectedMotionId.value, { ...motionConfig });
  if (!suppressTimelineRestart && !usesCommittedParameterReplay.value) scheduleParameterReplay();
}, { deep: true });

function createDefaultConfig(template: BasicMotionTemplate = selectedMotion.value): MotionEditorConfig {
  const defaults: MotionEditorConfig = {
    duration: template?.duration ?? 1.2,
    delay: 0,
    iteration: template?.iteration === "3" ? "3" : template?.iteration === "1" ? "1" : "infinite",
    direction: "normal",
    timingFunction: (template?.timingFunction as MotionEditorConfig["timingFunction"]) ?? "ease-in-out",
    color: "#0070F3",
    startOpacity: 0,
    endOpacity: 1,
    minOpacity: 0.35,
    maxOpacity: 1,
    startScale: 0.72,
    endScale: 1,
    minScale: 0.98,
    maxScale: 1.045,
    startBlur: 0,
    offsetX: 48,
    offsetY: 24,
    rotationAngle: 360,
    emphasisScale: 1.12,
    reboundScale: 0.97,
    glowBase: 6,
    glowPeak: 24,
    glowStrength: 50,
    borderWidth: 1,
    blinkFrequency: 1,
    rippleStartRadius: 24,
    rippleEndRadius: 170,
    rippleCount: 3,
    rippleInterval: 0.45,
    flowLength: 18,
    flowHeadOpacity: 1,
    flowTailOpacity: 0,
    flowHeadWidth: 3.4,
    flowTailWidth: 0.5,
    scanSpeed: 2.4,
    scanDirection: "top-to-bottom",
    scanLineWidth: 2,
    scanLength: 100,
    assetScale: 1,
    assetOffsetX: 0,
    assetOffsetY: 0
  };
  const configured = { ...defaults, ...template.defaultConfig };
  if (template.id === "glow-pulse" && svgAsset.value?.primaryColor) {
    configured.color = svgAsset.value.primaryColor;
  }
  return configured;
}

function resetConfig(): void {
  Object.assign(motionConfig, createDefaultConfig());
  motionConfigMemory.set(selectedMotionId.value, { ...motionConfig });
  scheduleParameterReplay();
}

function numberValue(key: BasicMotionParamKey): number {
  return Number(motionConfig[key]);
}

function stringValue(key: BasicMotionParamKey): string {
  return String(motionConfig[key]);
}

function setMotionParam(key: BasicMotionParamKey, value: string | number): void {
  (motionConfig as unknown as Record<BasicMotionParamKey, string | number>)[key] = value;
}

function setCommittedMotionParam(key: BasicMotionParamKey, value: string | number): void {
  setMotionParam(key, value);
  if (usesCommittedParameterReplay.value) scheduleParameterReplay();
}

function commitMotionParam(): void {
  if (usesCommittedParameterReplay.value) scheduleParameterReplay();
}

function stopTimelineAtStart(): void {
  cancelAnimationFrame(previewFrameId);
  previewState.value = "idle";
  previewCurrentTime.value = 0;
  previewLastTick = 0;
}

function scheduleParameterReplay(): void {
  window.clearTimeout(parameterReplayTimer);
  parameterReplayTimer = window.setTimeout(() => {
    restartTimelinePlayback();
  }, 150);
}

function restartTimelinePlayback(): void {
  cancelAnimationFrame(previewFrameId);
  previewCurrentTime.value = 0;
  previewState.value = "playing";
  previewKey.value += 1;
  void nextTick(() => {
    syncPreviewAnimations(0, true);
    if (isConfiguredLoop.value) return;
    startTimelineClock();
  });
}

function handlePrimaryPlayback(): void {
  if (previewState.value === "playing") {
    pauseTimelinePlayback();
    return;
  }
  if (previewState.value === "paused") {
    continueTimelinePlayback();
    return;
  }
  restartTimelinePlayback();
}

function pauseTimelinePlayback(): void {
  cancelAnimationFrame(previewFrameId);
  previewState.value = "paused";
  void nextTick(() => syncPreviewAnimations(previewCurrentTime.value, false));
}

function continueTimelinePlayback(): void {
  previewState.value = "playing";
  void nextTick(() => {
    syncPreviewAnimations(previewCurrentTime.value, true);
    startTimelineClock();
  });
}

function seekPreview(time: number): void {
  cancelAnimationFrame(previewFrameId);
  previewCurrentTime.value = Math.min(previewTotalTime.value, Math.max(0, time));
  previewState.value = previewCurrentTime.value >= previewTotalTime.value ? "ended" : "paused";
  void nextTick(() => syncPreviewAnimations(previewCurrentTime.value, false));
}

function startTimelineClock(): void {
  cancelAnimationFrame(previewFrameId);
  previewLastTick = performance.now();
  previewFrameId = requestAnimationFrame(updateTimelineClock);
}

function updateTimelineClock(timestamp: number): void {
  if (previewState.value !== "playing") return;
  const elapsed = Math.max(0, (timestamp - previewLastTick) / 1000);
  previewLastTick = timestamp;
  const nextTime = previewCurrentTime.value + elapsed;

  if (nextTime >= previewTotalTime.value) {
    if (previewLooping.value) {
      previewCurrentTime.value = 0;
      syncPreviewAnimations(0, true);
      previewFrameId = requestAnimationFrame(updateTimelineClock);
      return;
    }
    previewCurrentTime.value = previewTotalTime.value;
    previewState.value = "ended";
    void nextTick(() => syncPreviewAnimations(previewTotalTime.value, false));
    return;
  }

  previewCurrentTime.value = nextTime;
  previewFrameId = requestAnimationFrame(updateTimelineClock);
}

function syncPreviewAnimations(time: number, shouldPlay: boolean): void {
  const timeInMilliseconds = time * 1000;
  previewCapture.value?.getAnimations({ subtree: true }).forEach((animation) => {
    animation.currentTime = timeInMilliseconds;
    if (shouldPlay) animation.play();
    else animation.pause();
  });

  previewCapture.value?.querySelectorAll("svg").forEach((svg) => {
    const animatedSvg = svg as SVGSVGElement & {
      setCurrentTime?: (seconds: number) => void;
      pauseAnimations?: () => void;
      unpauseAnimations?: () => void;
    };
    animatedSvg.setCurrentTime?.(time);
    if (shouldPlay) animatedSvg.unpauseAnimations?.();
    else animatedSvg.pauseAnimations?.();
  });
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
    const asset = await readSvgPreviewFile(file);
    svgAsset.value = asset;
    Object.assign(svgStyle, createDefaultSvgStyleConfig(asset.primaryColor));
    const glowConfig = motionConfigMemory.get("glow-pulse");
    if (glowConfig) motionConfigMemory.set("glow-pulse", { ...glowConfig, color: asset.primaryColor });
    if (selectedMotion.value.id === "glow-pulse") motionConfig.color = asset.primaryColor;
    scheduleParameterReplay();
    ElMessage.success("SVG 已导入并应用当前动效");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "SVG 导入失败");
  } finally {
    input.value = "";
  }
}

function updateSvgStyle(value: SvgStyleConfig): void {
  Object.assign(svgStyle, value);
}

async function copyCode(): Promise<void> {
  await navigator.clipboard.writeText(htmlCssCode.value);
  ElMessage.success("代码已复制");
}

function downloadHtml(): void {
  const pageStyle = svgAsset.value
    ? `html,body{margin:0;width:${svgAsset.value.width}px;height:${svgAsset.value.height}px;display:grid;place-items:center;overflow:hidden;background:#000}`
    : "body{margin:0;min-height:100vh;display:grid;place-items:center;background:#000}";
  const code = `<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>${selectedMotion.value.name}</title>\n<style>${pageStyle}</style>\n</head>\n<body>\n${htmlCssCode.value}\n</body>\n</html>`;
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
  emits: ["update:modelValue", "commit"],
  setup(props, { emit }) {
    const update = (value: number | number[] | undefined): void => {
      emit("update:modelValue", Array.isArray(value) ? value[0] : Number(value ?? props.modelValue));
    };
    const commit = (value: number | number[] | undefined): void => {
      update(value);
      emit("commit");
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
            onInput: update,
            onChange: commit
          }),
          h(resolveComponent("el-input-number"), {
            modelValue: props.modelValue,
            min: props.min,
            max: props.max,
            step: props.step,
            controls: false,
            onChange: commit
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

.preview-surface {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
}

.motion-stage {
  position: relative;
  min-height: 0;
  height: 100%;
  display: grid;
  place-items: center;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg) var(--dm-radius-lg) 0 0;
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

.param-section-note {
  margin: -2px 0 0;
  color: var(--dm-tertiary);
  font-size: 12px;
  line-height: 1.6;
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
  grid-template-columns: minmax(0, 1fr) var(--dm-param-value-width);
  gap: 10px;
  align-items: center;
}

:deep(.control-row > *) {
  min-width: 0;
}

:deep(.control-row .el-input-number) {
  width: var(--dm-param-value-width);
  max-width: var(--dm-param-value-width);
}

.preview-fade {
  animation-name: motionFade;
}

.preview-slide {
  animation-name: motionSlide;
}

.motion-slide-up {
  animation-name: motionSlideUp;
}

.motion-slide-left {
  animation-name: motionSlideLeft;
}

.preview-scale {
  animation-name: motionScale;
}

.motion-scale-tip {
  animation-name: motionScaleTip;
}

.preview-pulse {
  animation-name: motionPulse;
}

.preview-float {
  animation-name: motionFloat;
}

.preview-blink {
  animation-name: motionBlink;
}

.preview-rotate {
  animation-name: motionRotate;
}

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
  from { opacity: var(--motion-start-opacity); filter: blur(var(--motion-start-blur)); }
  to { opacity: var(--motion-end-opacity); filter: blur(0); }
}

@keyframes motionSlide {
  from { opacity: var(--motion-start-opacity); }
  to { opacity: 1; }
}

@keyframes motionSlideUp {
  from { translate: 0 var(--motion-offset-y); opacity: var(--motion-start-opacity); }
  to { translate: 0 0; opacity: 1; }
}

@keyframes motionSlideLeft {
  from { translate: var(--motion-offset-x) 0; opacity: var(--motion-start-opacity); }
  to { translate: 0 0; opacity: 1; }
}

@keyframes motionScale {
  from { scale: var(--motion-start-scale); opacity: var(--motion-start-opacity); }
  to { scale: var(--motion-end-scale); opacity: 1; }
}

@keyframes motionScaleTip {
  0%, 100% { scale: 1; }
  48% { scale: var(--motion-emphasis-scale); }
  72% { scale: var(--motion-rebound-scale); }
}

@keyframes motionPulse {
  0%, 100% { scale: var(--motion-min-scale); }
  50% { scale: 1; }
}

@keyframes motionFloat {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 calc(var(--motion-offset-y) * -1); }
}

@keyframes motionBlink {
  0%, 100% { opacity: var(--motion-max-opacity); }
  50% { opacity: var(--motion-min-opacity); }
}

@keyframes motionRotate {
  to { rotate: var(--motion-rotation); }
}

@keyframes motionGlow {
  0%, 100% { filter: drop-shadow(0 0 var(--motion-glow-base) var(--motion-color)); }
  50% { filter: drop-shadow(0 0 var(--motion-glow-peak) var(--motion-color)); }
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
