<template>
  <section class="decoration-library">
    <aside class="decoration-list panel">
      <header class="section-head">
        <div>
          <h2>装饰组件</h2>
        </div>
        <small>{{ sectionEffects.length }} / {{ decorationEffects.length }}</small>
      </header>

      <div class="section-tabs">
        <button
          v-for="section in decorationSections"
          :key="section"
          type="button"
          :class="{ active: activeSection === section }"
          :disabled="!hasSectionEffects(section)"
          @click="activeSection = section"
        >
          {{ section }}
        </button>
      </div>

      <el-scrollbar class="effect-scroll">
        <div class="effect-stack">
          <template v-for="group in sectionGroups" :key="group.name">
            <div class="subsection-title">
              <span>{{ group.name }}</span>
              <small>{{ group.effects.length }}</small>
            </div>
            <article
              v-for="effect in group.effects"
              :key="effect.id"
              class="effect-card"
              :class="{ active: currentEffect.id === effect.id }"
              @click="selectEffect(effect.id)"
            >
              <div class="effect-thumb dm-motion-canvas" :class="effect.previewType">
                <div
                  v-if="effect.previewType === 'particle-base' || effect.previewType === 'svg-flow' || effect.previewType === 'loading'"
                  class="real-effect-thumbnail"
                  :class="{
                    'path-flow-thumbnail': effect.previewType === 'svg-flow',
                    'loading-thumbnail': effect.previewType === 'loading'
                  }"
                  v-html="effectThumbnailMarkup(effect)"
                ></div>
                <span v-else></span>
              </div>
              <div class="effect-card-copy">
                <strong>{{ effect.name }}</strong>
                <p>{{ effect.defaultParams.duration }}s · {{ effect.scene }}</p>
              </div>
            </article>
          </template>
          <template v-if="activeSection === '图标/点位' && customDecorationStore.components.length">
            <div class="custom-list-title"><span>自定义组件</span><small>{{ customDecorationStore.components.length }}</small></div>
            <article
              v-for="component in customDecorationStore.components"
              :key="component.id"
              class="effect-card custom-effect-card"
              :class="{ active: activeCustomId === component.id }"
              @click="selectCustomComponent(component.id)"
            >
              <div class="effect-thumb dm-motion-canvas"><img :src="component.previewImage" :alt="component.name" /></div>
              <div class="effect-card-copy"><strong>{{ component.name }}</strong><p>已保存的分层装饰组件</p></div>
            </article>
          </template>
        </div>
      </el-scrollbar>
    </aside>

    <main class="decoration-preview panel">
      <header class="decoration-workspace-head">
        <div class="decoration-title-copy">
          <div class="decoration-title-line">
            <h2>{{ displayTitle }}</h2>
          </div>
          <p>{{ currentEffect.description }}</p>
        </div>
        <input ref="svgFileInput" class="hidden-file-input" type="file" accept=".svg,image/svg+xml" @change="handleSvgUpload" />
      </header>

      <div class="decoration-view-toolbar">
        <div class="decoration-view-tabs" role="tablist" aria-label="装饰组件展示视图">
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
        <div class="decoration-workspace-actions">
          <el-button v-if="supportsImportedSvg" size="small" @click="triggerSvgImport">
            <el-icon><Download /></el-icon>
            导入 SVG
          </el-button>
          <el-button v-if="isStarRing" size="small" @click="saveAsCustomDecoration">保存为自定义组件</el-button>
          <el-button size="small" @click="downloadHtml">导出 HTML</el-button>
          <el-button class="dm-blue-action" type="primary" size="small" @click="copyCode">复制代码</el-button>
        </div>
      </div>

      <div class="decoration-workspace-content">
        <div v-show="activeWorkspaceView === 'preview'" class="preview-surface" role="tabpanel">
          <div
            ref="previewCapture"
            :key="`${currentEffect.id}-${previewKey}`"
            class="preview-stage dm-motion-canvas"
            :class="{ paused: !previewPlaying }"
          >
            <div
              class="generated-preview"
              :class="{
                'path-flow-preview': isSvgFlow,
                'imported-svg-preview': isStarRing && starRingConfig.sourceMode === 'imported',
                'size-fitted-preview': Boolean(previewIntrinsicSize)
              }"
              :style="previewFitStyle"
              v-html="previewMarkup"
            ></div>
          </div>
          <PreviewPlaybackControls
            :duration="previewDuration"
            @replay="replayPreview"
          />
        </div>
        <section v-show="activeWorkspaceView === 'code'" class="decoration-code" role="tabpanel">
          <CodeMirrorViewer :code="htmlCss" language="html" />
        </section>
      </div>
    </main>

    <aside class="decoration-params panel">
      <header class="section-head">
        <div>
          <h2>参数设置</h2>
        </div>
        <el-button size="small" @click="resetParams">重置</el-button>
      </header>

      <el-scrollbar class="param-scroll">
        <template v-if="isSubtitleSweep">
          <section class="flow-param-section subtitle-sweep-params">
            <h3>移动光效</h3>
            <p class="flow-param-note">导入 SVG 后自动生成，不要求素材包含“光”图层。</p>
            <div
              v-for="paramItem in currentEffect.editableParams"
              :key="paramItem.key"
              class="param-control"
              :class="{ 'switch-control': paramItem.key === 'sourceVisibility' }"
            >
              <label><span>{{ paramItem.label }}</span><small v-if="paramItem.unit">{{ paramItem.unit }}</small></label>
              <el-switch
                v-if="paramItem.key === 'sourceVisibility'"
                v-model="params[paramItem.key]"
                active-value="flow-only"
                inactive-value="show"
                aria-label="隐藏原素材"
              />
              <div v-else-if="paramItem.type === 'color'" class="color-row">
                <el-color-picker v-model="params[paramItem.key]" />
                <el-input v-model="params[paramItem.key]" />
              </div>
              <template v-else-if="paramItem.type === 'select'">
                <el-select v-model="params[paramItem.key]">
                  <el-option v-for="option in paramItem.options" :key="option.value" :label="option.label" :value="option.value" />
                </el-select>
              </template>
              <div v-else class="number-row">
                <el-slider :model-value="Number(params[paramItem.key])" :min="paramItem.min" :max="paramItem.max" :step="paramItem.step" @input="params[paramItem.key] = Array.isArray($event) ? $event[0] : $event" />
                <el-input-number :model-value="Number(params[paramItem.key])" :min="paramItem.min" :max="paramItem.max" :step="paramItem.step" :controls="false" @change="params[paramItem.key] = Number($event ?? params[paramItem.key])" />
              </div>
            </div>
          </section>
        </template>
        <StarRingParamPanel
          v-if="isLayeredDecoration"
          :model-value="activeLayeredConfig"
          @update:model-value="updateLayeredConfig"
          @use-preset="restoreLayeredPreset"
        />
        <template v-else-if="isSvgFlow">
          <div class="flow-param-stack">
            <section class="flow-param-section">
              <h3>流动设置</h3>
              <div
                v-for="paramItem in flowMotionParams"
                :key="paramItem.key"
                class="param-control"
                :class="{ 'switch-control': paramItem.key === 'sourceVisibility' }"
              >
                <label><span>{{ paramItem.label }}</span><small v-if="paramItem.unit">{{ paramItem.unit }}</small></label>
                <el-switch
                  v-if="paramItem.key === 'sourceVisibility'"
                  v-model="params[paramItem.key]"
                  active-value="flow-only"
                  inactive-value="show"
                  aria-label="隐藏原素材"
                />
                <template v-else-if="paramItem.type === 'select'">
                  <el-select v-model="params[paramItem.key]">
                    <el-option v-for="option in paramItem.options" :key="option.value" :label="option.label" :value="option.value" />
                  </el-select>
                </template>
                <div v-else class="number-row">
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
                    :controls="false"
                    @change="params[paramItem.key] = Number($event ?? params[paramItem.key])"
                  />
                </div>
              </div>
            </section>

            <section class="flow-param-section">
              <h3>光效设置</h3>
              <div v-for="paramItem in flowLightParams" :key="paramItem.key" class="param-control">
                <label><span>{{ paramItem.label }}</span><small v-if="paramItem.unit">{{ paramItem.unit }}</small></label>
                <div v-if="paramItem.type === 'color'" class="color-row">
                  <el-color-picker v-model="params[paramItem.key]" />
                  <el-input v-model="params[paramItem.key]" />
                </div>
                <div v-else class="number-row">
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
                    :controls="false"
                    @change="params[paramItem.key] = Number($event ?? params[paramItem.key])"
                  />
                </div>
              </div>
            </section>

            <section v-if="flowShapeParams.length" class="flow-param-section">
              <h3>形态设置</h3>
              <p v-if="isBackgroundSweep" class="flow-param-note">宽幅位置 0% 为最左侧；端点宽度 100% 与最宽处相同。</p>
              <div v-for="paramItem in flowShapeParams" :key="paramItem.key" class="param-control">
                <label><span>{{ paramItem.label }}</span><small v-if="paramItem.unit">{{ paramItem.unit }}</small></label>
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
                    :controls="false"
                    @change="params[paramItem.key] = Number($event ?? params[paramItem.key])"
                  />
                </div>
              </div>
            </section>

            <section v-if="flowTargets.length > 1" class="flow-param-section flow-path-section">
              <div class="flow-param-section-head">
                <h3>路径设置</h3>
                <small>{{ flowTargets.length }} 条路径</small>
              </div>
              <article v-for="target in flowTargets" :key="`${target.id}-${target.region ?? target.direction}`" class="flow-path-card">
                <header>
                  <strong>{{ target.label }}</strong>
                  <el-switch v-model="target.enabled" />
                </header>
                <template v-if="target.enabled">
                  <label class="flow-path-field">
                    <span>流动方向</span>
                    <el-select v-model="target.direction">
                      <el-option v-for="option in flowDirectionOptions" :key="option.value" :label="option.label" :value="option.value" />
                    </el-select>
                  </label>
                  <label class="flow-path-field">
                    <span>开始延迟</span>
                    <el-input-number v-model="target.delay" :min="0" :max="8" :step="0.1" :controls="false" />
                  </label>
                </template>
              </article>
            </section>
          </div>
        </template>
        <template v-else-if="!isLayeredDecoration">
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
            <template v-else-if="paramItem.type === 'text'">
              <el-input v-model="params[paramItem.key]" maxlength="24" />
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
                  :controls="false"
                  @change="params[paramItem.key] = Number($event ?? params[paramItem.key])"
                />
              </div>
            </template>
            </div>
          </div>
          <SvgStylePanel
            v-if="importedSvg && !isSvgFlow"
            :model-value="svgStyle"
            :primary-color="importedSvg.primaryColor"
            @update:model-value="updateSvgStyle"
          />
        </template>
        <DecorationParticlePanel
          v-if="supportsParticleEffect"
          :model-value="activeParticleEffect"
          @update:model-value="updateParticleEffect"
        />
      </el-scrollbar>
    </aside>

    <StarRingMappingDialog
      v-if="pendingStarRingAsset && isStarRing"
      v-model="mappingDialogVisible"
      :asset="pendingStarRingAsset"
      :mapping="pendingStarRingMapping"
      @confirm="confirmStarRingMapping"
    />

  </section>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from "element-plus";
import { Download } from "@element-plus/icons-vue";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { decorationEffects, decorationSections } from "@/data/decorationEffects";
import {
  generateDecorationCss,
  generateDecorationCompositionCss,
  generateDecorationHtmlCss,
  generateDecorationMarkup
} from "@/generators/decorationGenerator";
import { generateStarRingCss, generateStarRingHtmlCss, generateStarRingMarkup } from "@/generators/starRingGenerator";
import { generateSubtitleSweepCss, generateSubtitleSweepHtmlCss, generateSubtitleSweepMarkup, type SubtitleSweepParams } from "@/generators/subtitleSweepGenerator";
import { generateDecorationParticleCss } from "@/generators/decorationParticleGenerator";
import type { DecorationEffectTemplate, DecorationParticleConfig, DecorationSection } from "@/types/decoration";
import type { StarRingDecorationConfig, StarRingLayerMapping, StarRingSvgAsset } from "@/types/decoration";
import type { SvgFlowSource, SvgPreviewAsset, SvgStyleConfig } from "@/types/svgFlow";
import { SVG_FLOW_DRAFT_KEY, SVG_FLOW_LEGACY_DRAFT_KEY, SVG_FLOW_OPEN_KEY, createDefaultSvgFlowConfig, createDefaultSvgStyleConfig, createSystemSvgFlowSource, readSvgBackgroundFile, readSvgFlowFile, readSvgPreviewFile } from "@/utils/svgFlow";
import { useMyMotionStore } from "@/stores/myMotionStore";
import { createMotionArtifact } from "@/utils/motionArtifact";
import CodeMirrorViewer from "@/modules/icon-base-library/CodeMirrorViewer.vue";
import PreviewPlaybackControls from "@/modules/icon-base-library/PreviewPlaybackControls.vue";
import SvgStylePanel from "@/modules/motion-library/SvgStylePanel.vue";
import StarRingParamPanel from "@/modules/decoration-library/StarRingParamPanel.vue";
import StarRingMappingDialog from "@/modules/decoration-library/StarRingMappingDialog.vue";
import DecorationParticlePanel from "@/modules/decoration-library/DecorationParticlePanel.vue";
import { applyImportedLayeredDecorationConfig, applyImportedStarRingConfig, createDefaultLayeredDecorationConfig, createDefaultStarRingConfig, readLayeredDecorationSvgFile, readStarRingSvgFile, renameStarRingAssetLayers } from "@/utils/starRingDecoration";
import { createDefaultDecorationParticleConfig, normalizeDecorationParticleConfig } from "@/utils/decorationParticles";
import { useCustomDecorationStore } from "@/stores/customDecorationStore";

const props = defineProps<{ initialEffectId?: string }>();
const initialEffect = decorationEffects.find((effect) => effect.id === props.initialEffectId);
const activeSection = ref<DecorationSection>(initialEffect?.section ?? decorationEffects[0].section);
const activeEffectId = ref(initialEffect?.id ?? decorationEffects[0].id);
const activeWorkspaceView = ref<"preview" | "code">("preview");
const previewKey = ref(0);
const previewPlaying = ref(true);
const previewSpeed = ref(1);
const params = reactive<Record<string, string | number>>({});
const starRingConfig = ref<StarRingDecorationConfig>(createDefaultStarRingConfig());
const subtitleSweepConfig = ref<StarRingDecorationConfig>(createDefaultLayeredDecorationConfig("subtitle-sweep"));
const pendingStarRingAsset = ref<StarRingSvgAsset>();
const pendingStarRingMapping = ref<StarRingLayerMapping>(createDefaultStarRingConfig().layerMapping);
const mappingDialogVisible = ref(false);
const remappingExistingAsset = ref(false);
const activeCustomId = ref("");
const svgSource = ref<SvgFlowSource>(createSystemSvgFlowSource(initialEffect?.id));
const importedSvg = ref<SvgPreviewAsset>();
const svgStyle = reactive<SvgStyleConfig>(createDefaultSvgStyleConfig());
const particleEffect = ref<DecorationParticleConfig>(createDefaultDecorationParticleConfig());
const svgFileInput = ref<HTMLInputElement>();
const previewCapture = ref<HTMLElement>();
const previewViewport = ref({ width: 800, height: 480 });
let previewResizeObserver: ResizeObserver | undefined;
const motionStore = useMyMotionStore();
const customDecorationStore = useCustomDecorationStore();

const sectionEffects = computed(() => decorationEffects.filter((effect) => effect.section === activeSection.value));
const sectionGroups = computed(() => {
  const groups = new Map<string, DecorationEffectTemplate[]>();
  sectionEffects.value.forEach((effect) => {
    const effects = groups.get(effect.subsection) ?? [];
    effects.push(effect);
    groups.set(effect.subsection, effects);
  });
  return [...groups].map(([name, effects]) => ({ name, effects }));
});
const currentEffect = computed(() => decorationEffects.find((effect) => effect.id === activeEffectId.value) ?? sectionEffects.value[0] ?? decorationEffects[0]);
const isSvgFlow = computed(() => currentEffect.value.generator === "svg-flow");
const isBackgroundSweep = computed(() => currentEffect.value.id === "svg-flow-double-guide");
const isStarRing = computed(() => currentEffect.value.id === "base-particle-star-ring");
const isSubtitleSweep = computed(() => currentEffect.value.id === "subtitle-orbit-sweep-01");
const supportsImportedSvg = computed(() => isStarRing.value || isSubtitleSweep.value || isSvgFlow.value || currentEffect.value.generator === "loading-icon-pulse");
const supportsParticleEffect = computed(() => currentEffect.value.section !== "loading");
const isLayeredDecoration = computed(() => isStarRing.value || isSubtitleSweep.value);
const activeLayeredConfig = computed(() => isSubtitleSweep.value ? subtitleSweepConfig.value : starRingConfig.value);
const activeParticleEffect = computed(() => isStarRing.value
  ? normalizeDecorationParticleConfig(starRingConfig.value.particleEffect, true, starRingConfig.value.overall.color)
  : particleEffect.value);
const activeCustomComponent = computed(() => customDecorationStore.components.find((item) => item.id === activeCustomId.value));
const displayTitle = computed(() => activeCustomComponent.value?.name ?? currentEffect.value.name);
const flowMotionParams = computed(() => ["duration", "pause", "easing", "sourceVisibility", ...(flowTargets.value.length > 1 ? [] : ["direction"])]
  .map((key) => currentEffect.value.editableParams.find((item) => item.key === key))
  .filter((item): item is NonNullable<typeof item> => Boolean(item)));
const flowLightParams = computed(() => ["tail", "borderWidth", "glow", "headColor", "tailColor", "endColor", "lightIntensity"]
  .map((key) => currentEffect.value.editableParams.find((item) => item.key === key))
  .filter((item): item is NonNullable<typeof item> => Boolean(item)));
const flowShapeParams = computed(() => ["flowAmplitude", "flowFocusPosition", "flowLeftEndWidth", "flowRightEndWidth"]
  .map((key) => currentEffect.value.editableParams.find((item) => item.key === key))
  .filter((item): item is NonNullable<typeof item> => Boolean(item)));
const flowTargets = computed(() => svgSource.value?.targets ?? []);
const previewIntrinsicSize = computed(() => {
  if (isSvgFlow.value && svgSource.value) {
    return { width: svgSource.value.width, height: svgSource.value.height };
  }
  if (isStarRing.value && starRingConfig.value.svg) {
    return { width: starRingConfig.value.svg.width, height: starRingConfig.value.svg.height };
  }
  if (isSubtitleSweep.value && subtitleSweepConfig.value.svg) {
    return { width: subtitleSweepConfig.value.svg.width, height: subtitleSweepConfig.value.svg.height };
  }
  return undefined;
});
const previewFitStyle = computed(() => {
  const source = previewIntrinsicSize.value;
  if (!source) return undefined;
  const sourceWidth = Math.max(1, source.width);
  const sourceHeight = Math.max(1, source.height);
  // 编辑器只负责完整展示素材，交付尺寸仍由 sourceWidth/sourceHeight 保留。
  // 横向标题类 SVG 留出更多画布边距，避免 1920px 素材在预览中显得被放大或截断。
  const previewWidthRatio = isSvgFlow.value ? 0.74 : 0.9;
  const availableWidth = Math.max(1, previewViewport.value.width * previewWidthRatio);
  const availableHeight = Math.max(1, previewViewport.value.height * 0.78);
  const importedStarRingScale = isStarRing.value && starRingConfig.value.sourceMode === "imported" ? 0.82 : 1;
  const scale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight) * importedStarRingScale;
  return {
    width: `${sourceWidth * scale}px`,
    height: `${sourceHeight * scale}px`
  };
});
const flowDirectionOptions = [
  { label: "从左到右", value: "ltr" },
  { label: "从右到左", value: "rtl" },
  { label: "从上到下", value: "ttb" },
  { label: "从下到上", value: "btt" }
] as const;

function hasSectionEffects(section: DecorationSection): boolean {
  return decorationEffects.some((effect) => effect.section === section);
}

const cssCode = computed(() => isSubtitleSweep.value
  ? generateSubtitleSweepCss(subtitleSweepConfig.value, params as unknown as SubtitleSweepParams)
  : isStarRing.value ? generateStarRingCss(starRingConfig.value)
  : `${generateDecorationCss(currentEffect.value, params)}${activeParticleEffect.value.enabled ? `\n${generateDecorationParticleCss()}` : ""}`);
const htmlCss = computed(() => isSubtitleSweep.value
  ? generateSubtitleSweepHtmlCss(subtitleSweepConfig.value, params as unknown as SubtitleSweepParams)
  : isStarRing.value ? generateStarRingHtmlCss(starRingConfig.value)
  : generateDecorationHtmlCss(currentEffect.value, params, svgSource.value, importedSvg.value, svgStyle, activeParticleEffect.value));
const previewMarkup = computed(() => isSubtitleSweep.value
  ? `<style>${cssCode.value}</style>${generateSubtitleSweepMarkup(subtitleSweepConfig.value, params as unknown as SubtitleSweepParams)}`
  : isStarRing.value ? `<style>${cssCode.value}</style>${generateStarRingMarkup(starRingConfig.value)}`
  : `<style>${cssCode.value}${generateDecorationCompositionCss(importedSvg.value, svgStyle)}</style>${generateDecorationMarkup(currentEffect.value, params, svgSource.value, importedSvg.value, "main", activeParticleEffect.value)}`);
const previewDuration = computed(() => {
  if (!isStarRing.value && !isSubtitleSweep.value) return Number(params.duration ?? currentEffect.value.defaultParams.duration ?? 0);
  if (isSubtitleSweep.value) return Number(params.duration ?? 2.8);
  return Math.max(...Object.values(starRingConfig.value.layerConfigs)
    .filter((layer) => layer.visible && layer.motion !== "none")
    .map((layer) => layer.motion === "basic" ? Number(layer.basicMotionConfig?.duration ?? layer.duration) : layer.duration), 0);
});

watch(activeSection, () => {
  activeEffectId.value = sectionEffects.value[0]?.id ?? decorationEffects[0].id;
});

watch(() => props.initialEffectId, async (id) => {
  const effect = decorationEffects.find((item) => item.id === id);
  if (!effect) return;
  activeSection.value = effect.section;
  await nextTick();
  activeEffectId.value = effect.id;
});

watch(currentEffect, resetParams, { immediate: true });

watch([previewMarkup, previewPlaying, previewSpeed], () => {
  void nextTick(applyPlaybackState);
});

watch([svgSource, params, particleEffect], () => {
  if (!isSvgFlow.value || !svgSource.value) return;
  localStorage.setItem(SVG_FLOW_DRAFT_KEY, JSON.stringify({
    effectId: currentEffect.value.id,
    name: currentEffect.value.name,
    source: svgSource.value,
    config: { ...params },
    particleEffect: particleEffect.value
  }));
}, { deep: true });

watch(previewCapture, (nextElement, previousElement) => {
  if (previousElement) previewResizeObserver?.unobserve(previousElement);
  if (!nextElement) return;
  previewResizeObserver?.observe(nextElement);
  previewViewport.value = {
    width: Math.max(1, nextElement.clientWidth),
    height: Math.max(1, nextElement.clientHeight)
  };
}, { flush: "post" });

onMounted(() => {
  previewResizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    previewViewport.value = {
      width: Math.max(1, entry.contentRect.width),
      height: Math.max(1, entry.contentRect.height)
    };
  });
  if (previewCapture.value) previewResizeObserver.observe(previewCapture.value);
  localStorage.removeItem(SVG_FLOW_LEGACY_DRAFT_KEY);
  motionStore.loadFromLocal();
  customDecorationStore.load();
  void restoreSvgFlow();
  window.addEventListener("datamotion:import-svg", triggerSvgImport);
  window.addEventListener("datamotion:save", saveFromToolbar);
  window.addEventListener("datamotion:export", downloadHtml);
});

onBeforeUnmount(() => {
  previewResizeObserver?.disconnect();
  window.removeEventListener("datamotion:import-svg", triggerSvgImport);
  window.removeEventListener("datamotion:save", saveFromToolbar);
  window.removeEventListener("datamotion:export", downloadHtml);
});

function selectEffect(id: string): void {
  activeCustomId.value = "";
  activeEffectId.value = id;
}

async function selectCustomComponent(id: string): Promise<void> {
  const component = customDecorationStore.components.find((item) => item.id === id);
  if (!component) return;
  activeEffectId.value = "base-particle-star-ring";
  await nextTick();
  activeCustomId.value = id;
  starRingConfig.value = JSON.parse(JSON.stringify(component.config)) as StarRingDecorationConfig;
  void replayPreview();
}

function effectThumbnailMarkup(effect: DecorationEffectTemplate): string {
  if (effect.id === "base-particle-star-ring") {
    const config = createDefaultStarRingConfig();
    return `<style>${generateStarRingCss(config)}</style>${generateStarRingMarkup(config)}`;
  }
  if (effect.id === "subtitle-orbit-sweep-01") {
    const config = createDefaultLayeredDecorationConfig("subtitle-sweep");
    const defaultParams = effect.defaultParams as unknown as SubtitleSweepParams;
    return `<style>${generateSubtitleSweepCss(config, defaultParams)}</style>${generateSubtitleSweepMarkup(config, defaultParams)}`;
  }
  if (effect.generator === "svg-flow") {
    const source = createSystemSvgFlowSource(effect.id);
    return `<style>${generateDecorationCss(effect, effect.defaultParams)}</style>${generateDecorationMarkup(effect, effect.defaultParams, source, undefined, "thumb")}`;
  }
  return `<style>${generateDecorationCss(effect, effect.defaultParams)}</style>${generateDecorationMarkup(effect, effect.defaultParams)}`;
}

function resetParams(): void {
  if (isStarRing.value) {
    if (starRingConfig.value.sourceMode === "imported" && starRingConfig.value.svg) {
      const next = createDefaultStarRingConfig();
      applyImportedStarRingConfig(next, starRingConfig.value.svg, starRingConfig.value.layerMapping);
      starRingConfig.value = next;
    } else {
      starRingConfig.value = createDefaultStarRingConfig();
    }
    activeCustomId.value = "";
    importedSvg.value = undefined;
    return;
  }
  if (isSubtitleSweep.value) {
    Object.keys(params).forEach((key) => delete params[key]);
    Object.assign(params, currentEffect.value.defaultParams);
    if (subtitleSweepConfig.value.sourceMode === "imported" && subtitleSweepConfig.value.svg) {
      const next = createDefaultLayeredDecorationConfig("subtitle-sweep");
      applyImportedLayeredDecorationConfig(next, subtitleSweepConfig.value.svg);
      subtitleSweepConfig.value = next;
    } else {
      subtitleSweepConfig.value = createDefaultLayeredDecorationConfig("subtitle-sweep");
    }
    void replayPreview();
    return;
  }
  if (isSvgFlow.value) {
    Object.keys(params).forEach((key) => delete params[key]);
    Object.assign(params, currentEffect.value.defaultParams);
    svgSource.value = createSystemSvgFlowSource(currentEffect.value.id);
    particleEffect.value = createDefaultDecorationParticleConfig();
    importedSvg.value = undefined;
    void replayPreview();
    return;
  }
  Object.keys(params).forEach((key) => delete params[key]);
  Object.assign(params, currentEffect.value.defaultParams);
  importedSvg.value = undefined;
  Object.assign(svgStyle, createDefaultSvgStyleConfig());
  particleEffect.value = createDefaultDecorationParticleConfig();
}

function togglePreview(): void {
  previewPlaying.value = !previewPlaying.value;
  void nextTick(applyPlaybackState);
}

function setPreviewSpeed(speed: number): void {
  previewSpeed.value = speed;
  void nextTick(applyPlaybackState);
}

async function replayPreview(): Promise<void> {
  previewPlaying.value = true;
  previewKey.value += 1;
  await nextTick();
  previewCapture.value?.getAnimations({ subtree: true }).forEach((animation) => {
    animation.currentTime = 0;
  });
  previewCapture.value?.querySelectorAll("svg").forEach((svg) => {
    const animatedSvg = svg as SVGSVGElement & { setCurrentTime?: (seconds: number) => void };
    animatedSvg.setCurrentTime?.(0);
  });
  applyPlaybackState();
}

function applyPlaybackState(): void {
  const target = previewCapture.value;
  if (!target) return;
  target.getAnimations({ subtree: true }).forEach((animation) => {
    animation.playbackRate = previewSpeed.value;
    if (previewPlaying.value) animation.play();
    else animation.pause();
  });
  target.querySelectorAll("svg").forEach((svg) => {
    const animatedSvg = svg as SVGSVGElement & {
      pauseAnimations?: () => void;
      unpauseAnimations?: () => void;
    };
    if (previewPlaying.value) animatedSvg.unpauseAnimations?.();
    else animatedSvg.pauseAnimations?.();
  });
}

async function copyCode(): Promise<void> {
  await navigator.clipboard.writeText(htmlCss.value);
  ElMessage.success("代码已复制");
}

async function handleSvgUpload(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    if (isSubtitleSweep.value) {
      const asset = await readLayeredDecorationSvgFile(file);
      const next = createDefaultLayeredDecorationConfig("subtitle-sweep");
      applyImportedLayeredDecorationConfig(next, asset);
      subtitleSweepConfig.value = next;
      importedSvg.value = undefined;
      ElMessage.success(`已读取 ${asset.mode === "layered" ? asset.layers.length : 1} 个素材图层，并自动添加移动光效`);
      void replayPreview();
    } else if (isStarRing.value) {
      const { asset, mapping } = await readStarRingSvgFile(file);
      if (asset.mode === "whole") {
        const next = createDefaultStarRingConfig();
        applyImportedStarRingConfig(next, asset, mapping);
        starRingConfig.value = next;
        activeCustomId.value = "";
        ElMessage.success("SVG 已按整体素材导入");
      } else {
        pendingStarRingAsset.value = asset;
        pendingStarRingMapping.value = mapping;
        remappingExistingAsset.value = false;
        mappingDialogVisible.value = true;
      }
      importedSvg.value = undefined;
    } else if (isSvgFlow.value) {
      svgSource.value = isBackgroundSweep.value
        ? await readSvgBackgroundFile(file)
        : await readSvgFlowFile(file, currentEffect.value.id === "svg-flow-tool-02" ? "double" : "single");
      importedSvg.value = undefined;
      ElMessage.success(isBackgroundSweep.value ? "SVG 背景已读取，编辑器柔光已自动应用" : "SVG 路径已读取");
    } else if (currentEffect.value.generator === "loading-icon-pulse") {
      const previewAsset = await readSvgPreviewFile(file);
      importedSvg.value = previewAsset;
      Object.assign(svgStyle, createDefaultSvgStyleConfig(previewAsset.primaryColor));
      params.color = previewAsset.primaryColor;
      ElMessage.success("SVG 已替换默认加载图标");
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "SVG 上传失败");
  } finally {
    input.value = "";
  }
}

function updateSvgStyle(value: SvgStyleConfig): void {
  Object.assign(svgStyle, value);
}

function updateStarRingConfig(value: StarRingDecorationConfig): void {
  starRingConfig.value = value;
  void replayPreview();
}

function updateLayeredConfig(value: StarRingDecorationConfig): void {
  if (isSubtitleSweep.value) subtitleSweepConfig.value = value;
  else starRingConfig.value = value;
  void replayPreview();
}

function restoreLayeredPreset(): void {
  if (isSubtitleSweep.value) {
    subtitleSweepConfig.value = createDefaultLayeredDecorationConfig("subtitle-sweep");
    ElMessage.success("已恢复系统预设素材");
    void replayPreview();
    return;
  }
  restoreStarRingPreset();
}

function updateParticleEffect(value: DecorationParticleConfig): void {
  if (isStarRing.value) {
    starRingConfig.value = { ...starRingConfig.value, particleEffect: value };
  } else {
    particleEffect.value = value;
  }
  void replayPreview();
}

function restoreStarRingPreset(): void {
  starRingConfig.value = createDefaultStarRingConfig();
  activeCustomId.value = "";
  ElMessage.success("已恢复系统预设素材");
  void replayPreview();
}

function openCurrentMapping(): void {
  if (!starRingConfig.value.svg || starRingConfig.value.svg.mode !== "layered") return;
  pendingStarRingAsset.value = starRingConfig.value.svg;
  pendingStarRingMapping.value = JSON.parse(JSON.stringify(starRingConfig.value.layerMapping)) as StarRingLayerMapping;
  remappingExistingAsset.value = true;
  mappingDialogVisible.value = true;
}

function confirmStarRingMapping(mapping: StarRingLayerMapping, labels: Record<string, string>): void {
  const pendingAsset = pendingStarRingAsset.value;
  if (!pendingAsset) return;
  const asset = renameStarRingAssetLayers(pendingAsset, labels);
  const previous = starRingConfig.value;
  const next = createDefaultStarRingConfig();
  applyImportedStarRingConfig(next, asset, mapping);
  if (remappingExistingAsset.value) {
    next.particleEffect = previous.particleEffect;
    Object.keys(next.layerConfigs).forEach((key) => {
      const old = previous.layerConfigs[key];
      if (old) next.layerConfigs[key] = { ...old, visible: next.layerConfigs[key].visible };
    });
  }
  starRingConfig.value = next;
  pendingStarRingAsset.value = asset;
  pendingStarRingMapping.value = mapping;
  remappingExistingAsset.value = false;
  activeCustomId.value = "";
  const matched = new Set(Object.values(mapping).flat()).size;
  ElMessage.success(`已应用分层素材，映射 ${matched} 个图层`);
  void replayPreview();
}

async function saveAsCustomDecoration(): Promise<void> {
  try {
    const { value } = await ElMessageBox.prompt("保存后会出现在装饰组件的“自定义组件”区域。", "保存为自定义装饰组件", {
      confirmButtonText: "保存",
      cancelButtonText: "取消",
      inputValue: activeCustomComponent.value?.name ?? starRingConfig.value.svg?.fileName.replace(/\.svg$/i, "") ?? "星环粒子底座",
      inputPattern: /\S+/,
      inputErrorMessage: "请输入组件名称"
    });
    const artifact = await createMotionArtifact({ id: "custom-star-ring", name: value.trim(), htmlCss: htmlCss.value, previewNode: previewCapture.value });
    const saved = customDecorationStore.save(value.trim(), starRingConfig.value, artifact.previewImage);
    activeCustomId.value = saved.id;
    ElMessage.success("已保存为自定义装饰组件");
  } catch {
    // 用户取消时保持当前编辑状态。
  }
}

function triggerSvgImport(): void {
  svgFileInput.value?.click();
}

async function saveFromToolbar(): Promise<void> {
  if (isSubtitleSweep.value) {
    try {
      const artifact = await createMotionArtifact({ id: currentEffect.value.id, name: currentEffect.value.name, htmlCss: htmlCss.value, previewNode: previewCapture.value });
      motionStore.saveDecoration(currentEffect.value, { ...params }, artifact, subtitleSweepConfig.value);
      ElMessage.success("已保存 HTML、预览图和名称");
    } catch {
      ElMessage.error("保存失败，无法生成当前动效预览图");
    }
    return;
  }
  if (isSvgFlow.value && svgSource.value) {
    await saveSvgFlow();
    return;
  }

  try {
    const artifact = await createMotionArtifact({
      id: currentEffect.value.id,
      name: currentEffect.value.name,
      htmlCss: htmlCss.value,
      previewNode: previewCapture.value
    });
    motionStore.saveDecoration(currentEffect.value, { ...params }, artifact, isStarRing.value ? starRingConfig.value : undefined);
    ElMessage.success("已保存 HTML、预览图和名称");
  } catch {
    ElMessage.error("保存失败，无法生成当前动效预览图");
  }
}

async function saveSvgFlow(): Promise<void> {
  if (!svgSource.value) return;
  try {
    const artifact = await createMotionArtifact({
      id: currentEffect.value.id,
      name: currentEffect.value.name,
      htmlCss: htmlCss.value,
      previewNode: previewCapture.value
    });
    motionStore.saveSvgFlow({
      effectId: currentEffect.value.id,
      name: currentEffect.value.name,
      source: svgSource.value,
      config: {
        ...createDefaultSvgFlowConfig(),
        ...params
      } as ReturnType<typeof createDefaultSvgFlowConfig>,
      particleEffect: particleEffect.value
    }, artifact);
    ElMessage.success("已保存 HTML、预览图和名称");
  } catch {
    ElMessage.error("保存失败，无法生成当前动效预览图");
  }
}

function downloadHtml(): void {
  const exportSize = isSvgFlow.value
    ? { width: svgSource.value?.width ?? 1920, height: svgSource.value?.height ?? 96 }
    : isSubtitleSweep.value && subtitleSweepConfig.value.svg
      ? { width: subtitleSweepConfig.value.svg.width, height: subtitleSweepConfig.value.svg.height }
      : isStarRing.value && starRingConfig.value.sourceMode === "imported" && starRingConfig.value.svg
      ? { width: starRingConfig.value.svg.width, height: starRingConfig.value.svg.height }
      : undefined;
  const bodyStyle = exportSize
    ? `margin:0;width:${exportSize.width}px;height:${exportSize.height}px;background:#000;overflow:hidden;`
    : "margin:0;padding:24px;background:#000;";
  const documentCode = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${displayTitle.value}</title>
<style>html,body{${bodyStyle}}</style>
</head>
<body>
${htmlCss.value}
</body>
</html>`;
  const blob = new Blob([documentCode], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${isSubtitleSweep.value || currentEffect.value.section === "loading"
    ? currentEffect.value.name
    : isStarRing.value
      ? "star-ring-base"
      : (svgSource.value?.fileName.replace(/\.svg$/i, "") || "path-flow")}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
  ElMessage.success("HTML 文件已导出");
}

async function restoreSvgFlow(): Promise<void> {
  const raw = localStorage.getItem(SVG_FLOW_OPEN_KEY) ?? localStorage.getItem(SVG_FLOW_DRAFT_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw) as {
      effectId?: string;
      source?: SvgFlowSource;
      config?: Record<string, string | number>;
      particleEffect?: DecorationParticleConfig;
    };
    if (!saved.source || !saved.config) return;
    activeSection.value = "标题装饰";
    await nextTick();
    activeEffectId.value = decorationEffects.some((effect) => effect.id === saved.effectId)
      ? saved.effectId!
      : "svg-flow-tool";
    await nextTick();
    svgSource.value = saved.source;
    Object.assign(params, createDefaultSvgFlowConfig(), saved.config);
    particleEffect.value = normalizeDecorationParticleConfig(saved.particleEffect);
    localStorage.removeItem(SVG_FLOW_OPEN_KEY);
  } catch {
    localStorage.removeItem(SVG_FLOW_OPEN_KEY);
  }
}
</script>

<style scoped>
.decoration-library {
  --decoration-blue: #0070f3;
  --decoration-blue-light: #7ab8ff;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 200px minmax(500px, 1fr) 320px;
  grid-template-rows: minmax(0, 1fr);
  grid-template-areas: "list preview params";
  gap: 16px;
}

.panel {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 0;
  border-radius: var(--dm-radius-lg);
  background: #111111;
  padding: 18px;
  box-shadow: none;
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
  gap: 6px;
  padding-right: 5px;
}

.subsection-title,
.custom-list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 4px 2px;
  color: var(--dm-secondary);
  font-size: 10px;
}

.custom-effect-card .effect-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.decoration-preview {
  grid-area: preview;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 0;
  padding: 20px;
}

.hidden-file-input { display: none; }

.decoration-params {
  grid-area: params;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
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
  font-size: 15px;
  line-height: 1.3;
  font-weight: 600;
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
  gap: 6px;
}

.section-tabs button {
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.025);
  color: var(--dm-secondary);
  padding: 7px 6px;
  font-size: 11px;
  cursor: pointer;
}

.section-tabs button.active {
  color: var(--dm-tertiary);
  background: rgba(255, 255, 255, 0.085);
}

.section-tabs button:disabled {
  color: rgba(255, 255, 255, 0.22);
  cursor: default;
}

.effect-card {
  min-width: 0;
  border: 0;
  border-radius: var(--dm-radius-md);
  min-height: 70px;
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  align-items: center;
  gap: 11px;
  padding: 7px;
  background: rgba(255, 255, 255, 0.025);
  cursor: pointer;
  transition: border-color 140ms ease, background-color 140ms ease, color 140ms ease;
}

.effect-card:hover:not(.active) {
  background: rgba(255, 255, 255, 0.045);
}

.effect-card.active {
  background: rgba(255, 255, 255, 0.09);
  box-shadow: none;
}

.effect-thumb {
  position: relative;
  width: 58px;
  height: 54px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 0;
  border-radius: 6px;
  background-color: var(--dm-motion-canvas-background);
}

.real-effect-thumbnail {
  position: absolute;
  left: 50%;
  top: 42%;
  width: 188px;
  height: 132px;
  display: grid;
  place-items: center;
  transform: translate(-50%, -50%) scale(0.24);
  transform-origin: center;
  pointer-events: none;
}

.real-effect-thumbnail.path-flow-thumbnail {
  top: 50%;
  width: 1920px;
  height: 96px;
  transform: translate(-50%, -50%) scale(0.028);
}

.real-effect-thumbnail.loading-thumbnail {
  top: 50%;
  width: 320px;
  height: 160px;
  transform: translate(-50%, -50%) scale(0.18);
}

.real-effect-thumbnail.loading-thumbnail :deep(.decoration-effect-loading-linear-flow) {
  transform: scale(0.78);
}

.effect-thumb span {
  width: 28px;
  height: 28px;
  border: 1px solid var(--decoration-blue);
  border-radius: 999px;
  box-shadow: 0 0 12px var(--decoration-blue);
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
  border: 1px dashed var(--decoration-blue);
  border-radius: 50%;
  background: transparent;
  box-shadow: 0 0 8px rgba(0, 112, 243, 0.38);
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
  border-bottom: 1px solid var(--decoration-blue);
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
  background: var(--decoration-blue-light);
  box-shadow: -6px 0 7px var(--decoration-blue), 0 0 8px var(--decoration-blue);
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
  border-top: 1px solid var(--decoration-blue);
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
  background: var(--decoration-blue-light);
  box-shadow: -8px 0 8px var(--decoration-blue), 0 0 8px var(--decoration-blue);
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
  border: 1px solid var(--decoration-blue);
}

.effect-thumb.particle-base span::after {
  left: 50%;
  top: -6px;
  width: 3px;
  height: 3px;
  background: var(--decoration-blue-light);
  box-shadow:
    -12px 4px 5px var(--decoration-blue),
    10px 7px 5px var(--decoration-blue),
    4px -4px 6px var(--decoration-blue);
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
  background: var(--decoration-blue);
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
  background: var(--decoration-blue-light);
  box-shadow: 0 0 8px var(--decoration-blue), -7px 0 6px var(--decoration-blue);
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
  font-size: 12px;
  line-height: 1.35;
  font-weight: 600;
}

.effect-card p {
  margin: 3px 0 0;
  color: var(--dm-secondary);
  font-size: 10px;
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

.decoration-workspace-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 0 0 16px;
}

.decoration-title-copy {
  min-width: 0;
}

.decoration-title-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.decoration-title-line h2 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 28px;
  line-height: 1.25;
  font-weight: 620;
}

.decoration-title-copy p {
  margin: 7px 0 0;
  color: var(--dm-secondary);
  font-size: 12px;
}

.decoration-view-toolbar {
  min-height: 46px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid var(--dm-hairline);
}

.decoration-view-tabs {
  align-self: stretch;
  display: flex;
  align-items: stretch;
  gap: 4px;
}

.decoration-view-tabs button {
  position: relative;
  min-width: 84px;
  padding: 0 10px 12px;
  border: 0;
  background: transparent;
  color: var(--dm-secondary);
  font-size: 13px;
  cursor: pointer;
}

.decoration-view-tabs button::after {
  content: "";
  position: absolute;
  right: 10px;
  bottom: -1px;
  left: 10px;
  height: 2px;
  border-radius: 999px;
  background: transparent;
}

.decoration-view-tabs button:hover {
  color: var(--dm-primary);
}

.decoration-view-tabs button.active {
  color: #1683ff;
}

.decoration-view-tabs button.active::after {
  background: #0070f3;
}

.decoration-workspace-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-bottom: 9px;
}

.decoration-workspace-actions :deep(.el-button) {
  border-radius: 4px;
}

.decoration-workspace-content {
  min-width: 0;
  min-height: 0;
  display: grid;
  padding-top: 14px;
}

.decoration-workspace-content > * {
  grid-area: 1 / 1;
}

.preview-surface {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
}

.preview-stage {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg) var(--dm-radius-lg) 0 0;
  overflow: hidden;
  background-color: var(--dm-motion-canvas-background);
  box-shadow: inset 0 0 90px rgba(255, 255, 255, 0.015);
}

.preview-stage.paused :deep(*) {
  animation-play-state: paused !important;
}

.decoration-code {
  min-width: 0;
  min-height: 0;
  display: grid;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
  background: #0d0d0d;
}

.decoration-code :deep(.code-mirror-host) {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border: 0;
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

.generated-preview.path-flow-preview {
  width: 100%;
  min-width: 0;
}

.generated-preview.path-flow-preview :deep(.decoration-effect-svg-flow-tool),
.generated-preview.path-flow-preview :deep(.decoration-effect-svg-flow-tool-02),
.generated-preview.path-flow-preview :deep(.decoration-effect-svg-flow-double-guide) {
  width: 100% !important;
  max-width: none;
}

.generated-preview.imported-svg-preview {
  width: 100%;
  min-width: 0;
}

.generated-preview.imported-svg-preview :deep(.dm-star-ring) {
  width: 100% !important;
  max-width: none;
  max-height: none;
}

.generated-preview.size-fitted-preview {
  min-width: 0;
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

.flow-param-stack {
  display: grid;
  gap: 22px;
}

.flow-param-section {
  display: grid;
  gap: 14px;
}

.flow-param-section + .flow-param-section {
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.flow-param-section h3 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 13px;
  font-weight: 600;
}

.flow-param-note {
  margin: -6px 0 0;
  color: var(--dm-tertiary);
  font-size: 11px;
  line-height: 1.6;
}

.flow-param-section-head,
.flow-path-card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.flow-param-section-head small {
  color: var(--dm-secondary);
  font-size: 11px;
}

.flow-path-card {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.035);
}

.flow-path-card strong {
  min-width: 0;
  overflow: hidden;
  color: var(--dm-primary);
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-path-field {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  color: var(--dm-secondary);
  font-size: 11px;
}

.flow-path-field :deep(.el-input-number) {
  width: 100%;
}

.param-control {
  display: grid;
  gap: 8px;
}

.param-control.switch-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.param-control.switch-control label {
  flex: 1;
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
  grid-template-columns: minmax(0, 1fr) var(--dm-param-value-width);
  gap: 10px;
  align-items: center;
}

.number-row > * {
  min-width: 0;
}

.number-row :deep(.el-input-number) {
  width: var(--dm-param-value-width);
  max-width: var(--dm-param-value-width);
}

.color-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

</style>
