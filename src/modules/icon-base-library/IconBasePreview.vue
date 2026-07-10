<template>
  <section class="preview-panel">
    <header class="section-head">
      <div>
        <h2>图标底座动效预览</h2>
      </div>
      <div class="preview-actions">
        <el-radio-group v-model="background" size="small">
          <el-radio-button label="ink">墨黑</el-radio-button>
          <el-radio-button label="black">纯黑</el-radio-button>
          <el-radio-button label="transparent-grid">透明网格</el-radio-button>
        </el-radio-group>
        <el-button-group>
          <el-button size="small" @click="playing = true">播放</el-button>
          <el-button size="small" @click="playing = false">暂停</el-button>
          <el-button size="small" @click="replay">重播</el-button>
        </el-button-group>
      </div>
    </header>

    <div class="preview-stage" :class="background" :key="previewKey">
      <div v-if="asset" class="preview-orbit">
        <div class="icon-base-preview" :class="[animationClass, { paused: !playing }]" :style="previewStyle">
          <span v-if="config?.animationType === 'ripple'" class="ripple-ring"></span>
          <img class="icon-base-preview__bg" :src="asset.dataUrl" :alt="asset.name" />
          <div v-if="config?.showIcon" class="icon-base-preview__icon" :style="iconStyle">●</div>
        </div>
      </div>

      <div v-else class="preview-empty">
        <strong>等待上传底座素材</strong>
        <span>上传 PNG / SVG / WebP 后可在这里实时预览动效。</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { IconBaseAsset, IconBaseBackground } from "@/types/iconBase";
import { hexToRgb } from "@/generators/iconBaseGenerator";

const props = defineProps<{
  asset: IconBaseAsset | null;
}>();

const background = ref<IconBaseBackground>("ink");
const playing = ref(true);
const previewKey = ref(0);

const config = computed(() => props.asset?.motionConfig);

const animationClass = computed(() => {
  if (!config.value || config.value.animationType === "none") return "";
  return `motion-${config.value.animationType}`;
});

const previewStyle = computed(() => {
  if (!config.value) return {};
  const item = config.value;
  return {
    width: `${item.width}px`,
    height: `${item.height}px`,
    opacity: item.opacity,
    transform: `scale(${item.scale}) rotate(${item.rotate}deg)`,
    "--duration": `${item.duration}s`,
    "--delay": `${item.delay}s`,
    "--iteration": item.iteration,
    "--timing": item.timingFunction,
    "--direction": item.direction,
    "--glow-color": item.glowColor,
    "--glow-rgb": hexToRgb(item.glowColor),
    "--glow-alpha": item.glowStrength,
    "--shadow-blur": `${item.shadowBlur}px`,
    "--ripple-size": `${item.rippleSize}px`
  };
});

const iconStyle = computed(() => {
  if (!config.value) return {};
  return {
    width: `${config.value.iconSize}px`,
    height: `${config.value.iconSize}px`,
    color: config.value.iconColor,
    fontSize: `${config.value.iconSize}px`,
    textShadow: `0 0 ${config.value.shadowBlur}px rgba(${hexToRgb(config.value.glowColor)}, ${config.value.glowStrength})`
  };
});

function replay(): void {
  playing.value = true;
  previewKey.value += 1;
}
</script>

<style scoped>
.preview-panel {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.section-head span {
  color: var(--dm-secondary);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.section-head h2 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 20px;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.preview-stage {
  position: relative;
  min-height: 480px;
  display: grid;
  place-items: center;
  overflow: hidden;
  border: 1px solid var(--dm-hairline);
  border-radius: var(--dm-radius-lg);
}

.preview-stage.ink {
  background: var(--dm-neutral);
}

.preview-stage.black {
  background: #000000;
}

.preview-stage.transparent-grid {
  background: var(--dm-neutral);
  box-shadow: inset 0 0 0 12px rgba(237, 237, 237, 0.03);
}

.preview-orbit {
  width: min(68%, 520px);
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 1px solid var(--dm-hairline);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.025);
}

.icon-base-preview {
  position: relative;
  display: inline-grid;
  place-items: center;
  transform-origin: center;
  animation-duration: var(--duration);
  animation-delay: var(--delay);
  animation-iteration-count: var(--iteration);
  animation-timing-function: var(--timing);
  animation-direction: var(--direction);
}

.icon-base-preview.paused,
.icon-base-preview.paused .ripple-ring {
  animation-play-state: paused;
}

.icon-base-preview__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  z-index: 1;
}

.icon-base-preview__icon {
  position: relative;
  z-index: 2;
  display: grid;
  place-items: center;
  line-height: 1;
}

.ripple-ring {
  position: absolute;
  width: var(--ripple-size);
  height: var(--ripple-size);
  border: 1px solid rgba(var(--glow-rgb), var(--glow-alpha));
  border-radius: 999px;
  animation: previewRipple var(--duration) var(--timing) var(--delay) var(--iteration) var(--direction);
  pointer-events: none;
}

.motion-pulse {
  animation-name: previewPulse;
}

.motion-rotate {
  animation-name: previewRotate;
}

.motion-float {
  animation-name: previewFloat;
}

.motion-blink {
  animation-name: previewBlink;
}

.motion-glow {
  animation-name: previewGlow;
}

.preview-empty {
  display: grid;
  gap: 8px;
  color: var(--dm-primary);
  text-align: center;
}

.preview-empty span {
  color: var(--dm-secondary);
}

@keyframes previewPulse {
  0%, 100% { scale: 1; }
  50% { scale: 1.08; }
}

@keyframes previewRotate {
  to { rotate: 360deg; }
}

@keyframes previewFloat {
  0%, 100% { translate: 0 0; }
  50% { translate: 0 -12px; }
}

@keyframes previewBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.32; }
}

@keyframes previewGlow {
  0%, 100% { filter: drop-shadow(0 0 4px rgba(var(--glow-rgb), 0.25)); }
  50% { filter: drop-shadow(0 0 var(--shadow-blur) rgba(var(--glow-rgb), var(--glow-alpha))); }
}

@keyframes previewRipple {
  0% { scale: 0.5; opacity: var(--glow-alpha); }
  100% { scale: 1.2; opacity: 0; }
}
</style>
