<template>
  <section class="motion-home">
    <el-scrollbar class="home-scroll">
      <div class="home-wrap">
        <header class="collection-header">
          <div class="collection-title">
            <span>Motion library</span>
            <h1>动效预设</h1>
            <p>浏览动效案例，悬停查看效果，点击进入编辑。</p>
          </div>

          <div class="collection-tools">
            <el-input
              v-model="keyword"
              clearable
              :prefix-icon="Search"
              placeholder="搜索基础动效和装饰组件"
              aria-label="搜索动效案例"
            />
            <small>{{ keyword.trim() ? `${filteredMotions.length} 个搜索结果` : `${filteredMotions.length} 个案例` }}</small>
          </div>
        </header>

        <section class="motion-home-grid" aria-label="动效案例">
          <article
            v-for="motion in filteredMotions"
            :key="motion.id"
            class="home-motion-card"
            tabindex="0"
            role="button"
            :aria-label="`打开${motion.name}编辑器`"
            @mouseenter="playMotion(motion.id)"
            @mouseleave="stopMotion(motion.id)"
            @focus="playMotionOnKeyboardFocus($event, motion.id)"
            @blur="stopMotion(motion.id)"
            @click="openResult(motion)"
            @keyup.enter="openResult(motion)"
          >
            <div class="motion-visual dm-motion-canvas">
              <MotionPreviewVisual
                v-if="motion.kind === 'basic'"
                :key="`${motion.id}-${previewingId === motion.id}`"
                :motion-id="motion.targetId"
                :alt="`${motion.name}动效预览`"
                :playing="previewingId === motion.id"
                :duration="motion.durationValue"
                :iteration="motion.iteration"
                :timing-function="motion.timingFunction"
                :direction="motion.previewConfig.direction"
                :color="motion.previewConfig.color ?? '#0070F3'"
                :min-opacity="motion.previewConfig.minOpacity"
                :max-opacity="motion.previewConfig.maxOpacity"
                :min-scale="motion.previewConfig.minScale"
                :max-scale="motion.previewConfig.maxScale"
                :offset-y="motion.previewConfig.offsetY"
                :glow-peak="motion.previewConfig.glowPeak ?? 14"
                :glow-strength="motion.previewConfig.glowStrength"
              />
              <div
                v-else
                class="decoration-home-preview"
                :class="{ 'is-playing': previewingId === motion.id }"
              >
                <div
                  class="decoration-home-preview-content"
                  :style="{ '--home-decoration-scale': motion.previewScale }"
                  v-html="motion.previewHtml"
                ></div>
              </div>
            </div>

            <div class="motion-copy">
              <div class="motion-title-row">
                <h2>{{ motion.name }} <small>{{ motion.english }}</small></h2>
                <span>{{ motion.duration }}</span>
              </div>
              <p>{{ motion.description }}</p>
              <dl>
                <dt>适用场景</dt>
                <dd>{{ motion.scene }}</dd>
              </dl>
            </div>
          </article>
        </section>

        <div v-if="!filteredMotions.length" class="home-empty">
          <el-icon><Search /></el-icon>
          <strong>没有找到匹配的动效</strong>
          <p>换一个名称或使用场景试试。</p>
        </div>
      </div>
    </el-scrollbar>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import { basicMotions } from "@/data/basicMotions";
import { decorationEffects } from "@/data/decorationEffects";
import { generateDecorationCss, generateDecorationMarkup } from "@/generators/decorationGenerator";
import MotionPreviewVisual from "@/modules/motion-library/MotionPreviewVisual.vue";
import type { BasicMotionConfig } from "@/types/motion";

interface HomeMotion {
  kind: "basic" | "decoration";
  id: string;
  targetId: string;
  name: string;
  english: string;
  description: string;
  scene: string;
  duration: string;
  durationValue: number;
  iteration: string;
  timingFunction: string;
  previewConfig: Partial<BasicMotionConfig>;
  previewHtml: string;
  previewScale: string;
}

const emit = defineEmits<{
  openMotion: [motionId: string];
  openDecoration: [effectId: string];
}>();
const keyword = ref("");
const previewingId = ref("");

const motionMeta = [
  { id: "home-fade", targetId: "fade-in", name: "淡入", english: "Fade In", description: "从透明到可见，建立安静清晰的内容层级。" },
  { id: "home-slide-up", targetId: "slide-up", name: "上滑进入", english: "Slide Up", description: "内容从下方进入，适合分组信息依次出现。" },
  { id: "home-zoom", targetId: "scale-in", name: "缩放淡入", english: "Scale In", description: "用轻微缩放聚焦关键数字或重点模块。" },
  { id: "home-slide-left", targetId: "slide-left", name: "左滑进入", english: "Slide Left", description: "强调内容来源方向，适合侧栏和信息面板。" },
  { id: "home-breath", targetId: "breath", name: "呼吸", english: "Breathing", description: "柔和循环变化，让重要状态保持可感知。" },
  { id: "home-rotate", targetId: "slow-rotate", name: "慢速旋转", english: "Loading", description: "持续旋转的装饰运动，适合加载与状态环。" },
  { id: "home-pulse", targetId: "highlight-glow", name: "高亮脉冲", english: "Pulse", description: "短促的亮度和尺度变化，用于强调关键状态。" },
  { id: "home-count", targetId: "scale-tip", name: "放大提示", english: "Scale Tip", description: "用短暂放大回应变化，适合指标和按钮反馈。" },
  { id: "home-warning", targetId: "alert-blink", name: "告警闪烁", english: "Warning Flash", description: "克制的明暗变化，提醒异常状态或风险信息。" },
  { id: "home-flow", targetId: "border-flow", name: "边框流光", english: "Light Flow", description: "沿边界持续流动，为重点区域增加方向感。" }
] as const;

const featuredMotions: HomeMotion[] = motionMeta.map((item) => {
  const source = basicMotions.find((motion) => motion.id === item.targetId) ?? basicMotions[0];
  return {
    ...item,
    kind: "basic",
    scene: source.scene,
    duration: `${source.duration}s`,
    durationValue: source.duration,
    iteration: source.iteration,
    timingFunction: source.timingFunction,
    previewConfig: source.defaultConfig,
    previewHtml: "",
    previewScale: "1"
  };
});

const searchableBasicMotions: HomeMotion[] = basicMotions.map((motion) => {
  const meta = motionMeta.find((item) => item.targetId === motion.id);
  return {
    kind: "basic",
    id: `search-basic-${motion.id}`,
    targetId: motion.id,
    name: motion.name,
    english: meta?.english ?? "基础动效",
    description: motion.description,
    scene: motion.scene,
    duration: `${motion.duration}s`,
    durationValue: motion.duration,
    iteration: motion.iteration,
    timingFunction: motion.timingFunction,
    previewConfig: motion.defaultConfig,
    previewHtml: "",
    previewScale: "1"
  };
});

const searchableDecorationMotions: HomeMotion[] = decorationEffects.map((effect) => ({
  kind: "decoration",
  id: `search-decoration-${effect.id}`,
  targetId: effect.id,
  name: effect.name,
  english: "装饰组件",
  description: effect.description,
  scene: effect.scene,
  duration: `${Number(effect.defaultParams.duration ?? 2.4)}s`,
  durationValue: Number(effect.defaultParams.duration ?? 2.4),
  iteration: "infinite",
  timingFunction: "linear",
  previewConfig: {},
  previewHtml: `<style>${generateDecorationCss(effect, effect.defaultParams)}</style>${generateDecorationMarkup(effect, effect.defaultParams)}`,
  previewScale: decorationPreviewScale(effect.previewType)
}));

const filteredMotions = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  if (!query) return featuredMotions;
  return [...searchableBasicMotions, ...searchableDecorationMotions].filter((motion) =>
    `${motion.name} ${motion.english} ${motion.description} ${motion.scene}`.toLowerCase().includes(query)
  );
});

function decorationPreviewScale(previewType: string): string {
  if (previewType === "comet-flow") return "0.44";
  if (previewType === "linear-flow" || previewType === "svg-flow") return "0.52";
  if (previewType === "particle-base") return "0.72";
  return "0.76";
}

function openResult(motion: HomeMotion): void {
  if (motion.kind === "decoration") emit("openDecoration", motion.targetId);
  else emit("openMotion", motion.targetId);
}

function playMotion(id: string): void {
  previewingId.value = "";
  requestAnimationFrame(() => {
    previewingId.value = id;
  });
}

function playMotionOnKeyboardFocus(event: FocusEvent, id: string): void {
  const target = event.currentTarget;
  if (target instanceof HTMLElement && target.matches(":focus-visible")) {
    playMotion(id);
  }
}

function stopMotion(id: string): void {
  if (previewingId.value === id) previewingId.value = "";
}
</script>

<style scoped>
.motion-home {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #0c0c0c;
}

.home-scroll { height: 100%; }

.home-wrap {
  width: min(1460px, calc(100% - 72px));
  min-height: 100%;
  margin: 0 auto;
  padding: 54px 0 76px;
}

.collection-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  align-items: end;
  gap: 56px;
  margin-bottom: 44px;
}

.collection-title > span {
  display: block;
  margin-bottom: 18px;
  color: #858580;
  font-family: "SFMono-Regular", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.collection-title h1 {
  margin: 0;
  color: #f2f2ef;
  font-size: clamp(46px, 4.2vw, 68px);
  line-height: 0.98;
  font-weight: 640;
  letter-spacing: -0.055em;
}

.collection-title p {
  margin: 24px 0 0;
  color: #888884;
  font-size: 15px;
  line-height: 1.7;
}

.collection-tools {
  display: grid;
  gap: 12px;
  justify-items: stretch;
}

.collection-tools :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 10px;
  background: #151515;
  box-shadow: none;
}

.collection-tools :deep(.el-input__wrapper:hover),
.collection-tools :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.18) inset;
}

.collection-tools small {
  color: #686864;
  font-size: 11px;
  text-align: right;
}

.motion-home-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 44px 18px;
}

.home-motion-card {
  min-width: 0;
  display: grid;
  gap: 16px;
  padding: 0;
  border: 0;
  background: transparent;
  outline: none;
  cursor: pointer;
}

.motion-visual {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: 12px;
  background-color: var(--dm-motion-canvas-background);
  transition: background-color 220ms ease, transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.motion-visual :deep(.motion-preview-visual) {
  width: 100%;
  height: 100%;
  background-color: var(--dm-motion-canvas-background);
}

.decoration-home-preview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.decoration-home-preview-content {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 560px;
  height: 280px;
  display: grid;
  place-items: center;
  transform: translate(-50%, -50%) scale(var(--home-decoration-scale, 0.7));
  transform-origin: center;
}

.decoration-home-preview:not(.is-playing) :deep(*) {
  animation-play-state: paused !important;
}

.home-motion-card:hover .motion-visual,
.home-motion-card:focus-visible .motion-visual {
  background-color: #1a1a1a;
  transform: translateY(-4px);
}

.home-motion-card:focus-visible .motion-visual {
  outline: 1px solid rgba(255, 255, 255, 0.72);
  outline-offset: 4px;
}

.motion-copy {
  min-width: 0;
  padding: 0 2px;
}

.motion-title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.motion-title-row h2 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #eeeeea;
  font-size: 16px;
  line-height: 1.2;
  font-weight: 580;
  letter-spacing: -0.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.motion-title-row h2 small {
  margin-left: 5px;
  color: #7b7b77;
  font-size: 10px;
  font-weight: 450;
  letter-spacing: 0;
}

.motion-title-row > span {
  flex: 0 0 auto;
  color: #777773;
  font-family: "SFMono-Regular", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
}

.motion-copy > p {
  max-width: 38ch;
  margin: 9px 0 15px;
  color: #858581;
  font-size: 12px;
  line-height: 1.65;
}

.motion-copy dl {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 12px;
  margin: 0;
  font-size: 11px;
  line-height: 1.5;
}

.motion-copy dt { color: #5e5e5a; }
.motion-copy dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: #a4a49f;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-empty {
  min-height: 360px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  color: #70706c;
  text-align: center;
}

.home-empty .el-icon { color: #a5a5a0; font-size: 28px; }
.home-empty strong { color: #deded9; font-weight: 560; }
.home-empty p { margin: 0; font-size: 12px; }

@media (max-width: 1380px) {
  .home-wrap {
    width: calc(100% - 52px);
    padding-top: 46px;
  }
}

@media (max-width: 1080px) {
  .collection-header {
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .collection-tools {
    max-width: 420px;
  }

  .collection-tools small { text-align: left; }
  .motion-home-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  .motion-visual { transition: none; }
  .home-motion-card:hover .motion-visual,
  .home-motion-card:focus-visible .motion-visual { transform: none; }
}
</style>
