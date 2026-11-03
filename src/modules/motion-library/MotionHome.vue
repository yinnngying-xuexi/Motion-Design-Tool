<template>
  <section class="motion-home">
    <el-scrollbar class="home-scroll">
      <div class="home-wrap">
        <header class="collection-header">
          <div class="collection-title">
            <span>Motion library</span>
            <h1>动效库</h1>
            <p>浏览装饰组件动效，搜索并选择案例开始编辑。</p>
          </div>

          <div class="collection-tools">
            <el-input
              v-model="keyword"
              clearable
              :prefix-icon="Search"
              placeholder="搜索装饰组件动效"
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
            @click="openResult(motion)"
            @keyup.enter="openResult(motion)"
            @keydown.space.prevent
            @keyup.space.prevent="openResult(motion)"
          >
            <div class="motion-visual dm-motion-canvas">
              <div class="decoration-home-preview">
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
import { lightDecorationSize } from "@/generators/lightDecorationGenerator";
import { pointReferenceSize } from "@/data/pointReferenceBases";
import { motionScaleFactor } from "@/utils/motionScale";
import { referenceLoadingSize } from "@/data/referenceLoadings";
import { computed, ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import { decorationEffects } from "@/data/decorationEffects";
import { generateDecorationCss, generateDecorationMarkup, generateDecorationHtmlCss } from "@/generators/decorationGenerator";
import { generateStarRingCss, generateStarRingMarkup } from "@/generators/starRingGenerator";
import { generateSubtitleSweepCss, generateSubtitleSweepMarkup, type SubtitleSweepParams } from "@/generators/subtitleSweepGenerator";
import { createDefaultStarRingConfig, createDefaultStackedEnergyBaseConfig, createDefaultRippleFocusBaseConfig, createDefaultChartTechRingConfig, createDefaultLayeredDecorationConfig } from "@/utils/starRingDecoration";
import type { DecorationEffectTemplate } from "@/types/decoration";
import { createSystemSvgFlowSource } from "@/utils/svgFlow";

interface HomeMotion {
  id: string;
  targetId: string;
  name: string;
  english: string;
  description: string;
  scene: string;
  section: string;
  duration: string;
  previewHtml: string;
  previewScale: string;
}

const emit = defineEmits<{
  openDecoration: [effectId: string];
}>();
const keyword = ref("");

const decorationMotions: HomeMotion[] = decorationEffects.map((effect) => ({
  id: `search-decoration-${effect.id}`,
  targetId: effect.id,
  name: effect.name,
  english: "装饰组件",
  description: effect.description,
  scene: effect.scene,
  section: effect.section,
  duration: `${Number(effect.defaultParams.duration ?? 2.4)}s`,
  previewHtml: homeDecorationMarkup(effect),
  previewScale: effect.generator === "point-reference" || effect.generator === "light-decoration" || effect.generator === "reference-loading" ? fixedPreviewScale(effect) : effect.id === "svg-flow-tool-02" ? "0.14" : effect.id === "chart-tech-ring-01" ? "0.5" : effect.generator === "layered-sweep" ? "0.6" : decorationPreviewScale(effect.previewType)
}));

function fixedPreviewScale(effect: DecorationEffectTemplate): string {
  const { width, height } = effect.generator === "point-reference" ? pointReferenceSize(effect.id) : effect.generator === "reference-loading" ? referenceLoadingSize(effect.id) : lightDecorationSize(effect.id);
  return String(Math.min(190 / width, 116 / height) * motionScaleFactor(effect.defaultParams.overallScale));
}

function homeDecorationMarkup(effect: DecorationEffectTemplate): string {
  if (effect.defaultParticleEffect?.enabled) return generateDecorationHtmlCss(effect, effect.defaultParams);
  if (effect.generator === "layered-sweep") {
    const variant = effect.id === "subtitle-light-arc-01" ? "light-arc" : "sweep";
    const config = createDefaultLayeredDecorationConfig(variant === "light-arc" ? "subtitle-light-arc" : "subtitle-sweep");
    const params = effect.defaultParams as unknown as SubtitleSweepParams;
    return `<style>${generateSubtitleSweepCss(config, params, variant)}</style>${generateSubtitleSweepMarkup(config, params, variant, `home-${effect.id}`)}`;
  }
  const config = effect.id === "base-particle-star-ring" ? createDefaultStarRingConfig()
    : effect.id === "icon-base-stacked-energy" ? createDefaultStackedEnergyBaseConfig()
    : effect.id === "icon-base-ripple-focus" ? createDefaultRippleFocusBaseConfig()
    : effect.id === "chart-tech-ring-01" ? createDefaultChartTechRingConfig() : undefined;
  if (config) return `<style>${generateStarRingCss(config)}</style>${generateStarRingMarkup(config, `home-${effect.id}`)}`;
  return `<style>${generateDecorationCss(effect, effect.defaultParams)}</style>${generateDecorationMarkup(
    effect,
    effect.defaultParams,
    effect.generator === "svg-flow" ? createSystemSvgFlowSource(effect.id) : undefined,
    undefined,
    `home-${effect.id}`
  )}`;
}

// 首页按装饰类别展示；截图中的原首排四款按用户指定移到最后。
const sectionOrder = ["图标/点位", "loading", "标题装饰", "通用装饰", "图表装饰"];
const lastIds = ["base-particle-star-ring", "icon-base-stacked-energy", "icon-base-ripple-focus", "svg-flow-tool-02"];
const lastIdSet = new Set(lastIds);
const homeFeaturedMotions = [
  ...sectionOrder.flatMap((section) => decorationMotions.filter((motion) => motion.section === section && !lastIdSet.has(motion.targetId))),
  ...lastIds.flatMap((id) => decorationMotions.filter((motion) => motion.targetId === id))
];

const filteredMotions = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  if (!query) return homeFeaturedMotions;
  return homeFeaturedMotions.filter((motion) =>
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
  emit("openDecoration", motion.targetId);
}
</script>

<style scoped>
.motion-home {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #0d0e10;
}

.home-scroll { height: 100%; }

.home-wrap {
  width: calc(100% - 80px);
  min-height: 100%;
  margin: 0 auto;
  padding: 40px 0 60px;
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
  font-size: 34px;
  line-height: 0.98;
  font-weight: 640;
  letter-spacing: -0.025em;
}

.collection-title p {
  margin: 14px 0 0;
  color: #888884;
  font-size: 13px;
  line-height: 1.7;
}

.collection-tools {
  display: grid;
  gap: 12px;
  justify-items: stretch;
}

.collection-tools :deep(.el-input__wrapper) {
  min-height: 44px;
  border-radius: 4px;
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 32px 20px;
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
  aspect-ratio: 3 / 2;
  overflow: hidden;
  border-radius: 0;
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
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr);
  place-items: center;
  transform: translate(-50%, -50%) scale(var(--home-decoration-scale, 0.7));
  transform-origin: center;
}

.home-motion-card:hover .motion-visual,
.home-motion-card:focus-visible .motion-visual {
  background-color: #1a1a1a;
  transform: none;
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

@media (max-width: 1180px) {
  .motion-home-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (max-width: 900px) {
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

@media (max-width: 600px) {
  .home-wrap { width: calc(100% - 32px); }
  .motion-home-grid { grid-template-columns: minmax(0, 1fr); }
}

@media (prefers-reduced-motion: reduce) {
  .decoration-home-preview :deep(*) { animation-play-state: paused !important; }
  .motion-visual { transition: none; }
  .home-motion-card:hover .motion-visual,
  .home-motion-card:focus-visible .motion-visual { transform: none; }
}
</style>
