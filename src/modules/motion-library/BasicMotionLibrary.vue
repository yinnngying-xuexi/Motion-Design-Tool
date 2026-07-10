<template>
  <section class="motion-library">
    <aside class="motion-sidebar panel">
      <header class="library-head">
        <div>
          <h2>基础动效库</h2>
        </div>
        <small>{{ filteredMotions.length }} / {{ basicMotions.length }}</small>
      </header>

      <el-input v-model="keyword" placeholder="搜索内置动效" clearable />

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
            <div class="motion-mini" :class="[`preview-${motion.previewType}`, `motion-${motion.id}`]">
              <span></span>
            </div>
            <div>
              <strong>{{ motion.name }}</strong>
              <p>{{ motion.scene }}</p>
              <small>{{ motion.category }} · 系统内置</small>
            </div>
          </article>
        </div>
      </el-scrollbar>
    </aside>

    <main class="motion-preview-panel panel">
      <header class="library-head">
        <div>
          <h2>{{ selectedMotion.name }}</h2>
        </div>
        <el-button type="primary" @click="saveSelected">保存到我的动效</el-button>
      </header>

      <section class="motion-stage" :key="`${selectedMotion.id}-${previewKey}`">
        <div
          class="screen-card"
          :class="[`preview-${selectedMotion.previewType}`, `motion-${selectedMotion.id}`]"
          :style="previewStyle"
        >
          <span v-if="selectedMotion.previewType === 'ripple'" class="ripple" :style="rippleStyle"></span>
          <span v-if="selectedMotion.previewType === 'scan'" class="scan-line" :style="scanStyle"></span>
          <p>数据态势</p>
          <strong>87.62</strong>
          <small>{{ selectedMotion.category }}</small>
        </div>
      </section>

      <section class="motion-detail">
        <div>
          <span>推荐场景</span>
          <p>{{ selectedMotion.scene }}</p>
        </div>
        <div>
          <span>说明</span>
          <p>{{ selectedMotion.description }}</p>
        </div>
        <div>
          <span>当前参数</span>
          <p>{{ motionConfig.duration }}s · {{ motionConfig.timingFunction }} · {{ motionConfig.iteration }}</p>
        </div>
      </section>
    </main>

    <aside class="motion-info panel">
      <header class="library-head param-head">
        <div>
          <h2>参数编辑</h2>
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
import { computed, defineComponent, h, onMounted, reactive, ref, resolveComponent, watch } from "vue";
import { basicMotions } from "@/data/basicMotions";
import { useMyMotionStore } from "@/stores/myMotionStore";
import type { MotionCategory } from "@/types/motion";

interface MotionEditorConfig {
  duration: number;
  delay: number;
  iteration: "1" | "2" | "3" | "infinite";
  direction: "normal" | "reverse" | "alternate" | "alternate-reverse";
  timingFunction: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
  rotate: number;
  blur: number;
  shadow: number;
  glow: number;
  blinkFrequency: number;
  loopSpeed: number;
  amplitude: number;
  color: string;
  borderWidth: number;
  scanSpeed: number;
  rippleRadius: number;
}

const store = useMyMotionStore();
const keyword = ref("");
const activeCategory = ref<"全部" | MotionCategory>("全部");
const selectedMotionId = ref(basicMotions[0].id);
const previewKey = ref(0);

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
}

function saveSelected(): void {
  const before = store.savedMotions.length;
  store.saveMotion(selectedMotion.value);
  ElMessage.success(before === store.savedMotions.length ? "该动效已在我的动效中" : "已保存到我的动效");
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
  grid-template-columns: 372px minmax(520px, 1fr) 388px;
  gap: 14px;
}

.motion-sidebar,
.motion-preview-panel,
.motion-info {
  min-width: 0;
  min-height: 0;
  padding: 20px;
}

.motion-sidebar {
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  gap: 16px;
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
  font-size: 24px;
  font-weight: 600;
}

.library-head small {
  color: var(--dm-secondary);
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-tabs button {
  border: 1px solid var(--dm-hairline);
  border-radius: 999px;
  background: var(--dm-surface-raised);
  color: var(--dm-secondary);
  padding: 8px 12px;
  cursor: pointer;
}

.category-tabs button.active {
  border-color: var(--dm-tertiary);
  color: var(--dm-primary);
  background: rgba(0, 112, 243, 0.12);
}

.motion-list-scroll {
  min-height: 0;
}

.motion-list {
  display: grid;
  gap: 11px;
  padding-right: 8px;
}

.motion-card {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 12px;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-md);
  background: var(--dm-surface-raised);
  padding: 12px;
  cursor: pointer;
}

.motion-card.active {
  border-color: var(--dm-tertiary);
  background: rgba(0, 112, 243, 0.11);
  box-shadow: inset 0 0 24px rgba(0, 112, 243, 0.045);
}

.motion-card strong {
  color: var(--dm-primary);
}

.motion-card p,
.motion-card small {
  margin: 4px 0 0;
  color: var(--dm-secondary);
  font-size: 12px;
}

.motion-mini {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-md);
  background: #05080c;
}

.motion-mini span {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: var(--dm-tertiary);
  animation-duration: 1.8s;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

.motion-preview-panel {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
}

.motion-stage {
  min-height: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  background: #020406;
  box-shadow: inset 0 0 40px rgba(0, 112, 243, 0.035);
}

.screen-card {
  position: relative;
  width: 240px;
  height: 150px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  overflow: hidden;
  border: 1px solid var(--dm-tertiary);
  border-radius: var(--dm-radius-lg);
  background: var(--dm-surface-soft);
  color: var(--dm-primary);
  transform-origin: center;
}

.screen-card strong {
  font-size: 38px;
}

.screen-card p,
.screen-card small {
  margin: 0;
  color: var(--dm-secondary);
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
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
  overflow: hidden;
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
  gap: 14px;
  padding-bottom: 18px;
}

.param-section + .param-section {
  padding-top: 18px;
  border-top: 1px solid var(--dm-hairline);
}

.param-section h3 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 15px;
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
  grid-template-columns: minmax(0, 1fr) 78px;
  gap: 10px;
  align-items: center;
}

:deep(.control-row > *) {
  min-width: 0;
}

:deep(.control-row .el-input-number) {
  width: 78px;
  max-width: 78px;
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
