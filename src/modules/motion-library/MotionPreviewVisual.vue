<template>
  <div
    ref="previewRoot"
    class="motion-preview-visual dm-motion-canvas"
    :class="[`motion-${motionId}`, { 'is-playing': playing, 'is-paused': !playing, 'has-svg': Boolean(svgMarkup) }]"
    :data-motion-id="motionId"
    :data-preview-source="previewSource"
    :style="rootStyle"
    role="img"
    :aria-label="alt"
  >
    <div class="preview-target" :style="targetStyle">
      <div
        v-if="svgMarkup"
        class="preview-svg-material"
        :class="{ monochrome: svgColorMode === 'monochrome' }"
        v-html="svgMarkup"
      ></div>
      <div v-else class="preview-rectangle"></div>
      <svg
        v-if="showsBorderOrbit"
        class="preview-border-orbit"
        viewBox="0 0 176 110"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect class="orbit-track" x="2" y="2" width="172" height="106" rx="10" pathLength="100"></rect>
        <rect
          v-for="segment in borderFlowTrailSegments"
          :key="segment.id"
          class="orbit-segment"
          :class="{ 'orbit-segment-head': segment.isHead }"
          x="2"
          y="2"
          width="172"
          height="106"
          rx="10"
          pathLength="100"
          :style="borderFlowSegmentStyle(segment)"
        ></rect>
      </svg>
      <span v-if="showsScan" class="preview-sweep" :class="`scan-${scanDirection}`"></span>
      <span
        v-for="index in showsRipple ? Math.max(1, Math.round(rippleCount)) : 0"
        :key="index"
        class="preview-ripple"
        :style="{ '--ripple-delay': `${(index - 1) * rippleInterval}s` }"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  BORDER_FLOW_DASH_GAP,
  BORDER_FLOW_DASH_LENGTH,
  borderFlowTrailSegments,
  type BorderFlowTrailSegment
} from "@/utils/borderFlowTrail";

interface Props {
  motionId: string;
  alt?: string;
  playing?: boolean;
  duration?: number;
  delay?: number;
  iteration?: string;
  timingFunction?: string;
  direction?: string;
  color?: string;
  startOpacity?: number;
  endOpacity?: number;
  minOpacity?: number;
  maxOpacity?: number;
  startScale?: number;
  endScale?: number;
  minScale?: number;
  maxScale?: number;
  startBlur?: number;
  offsetX?: number;
  offsetY?: number;
  rotationAngle?: number;
  emphasisScale?: number;
  reboundScale?: number;
  glowBase?: number;
  glowPeak?: number;
  blinkFrequency?: number;
  borderWidth?: number;
  scanSpeed?: number;
  scanDirection?: "top-to-bottom" | "bottom-to-top" | "left-to-right" | "right-to-left";
  scanLineWidth?: number;
  scanLength?: number;
  rippleStartRadius?: number;
  rippleEndRadius?: number;
  rippleCount?: number;
  rippleInterval?: number;
  flowLength?: number;
  flowHeadOpacity?: number;
  flowTailOpacity?: number;
  flowHeadWidth?: number;
  flowTailWidth?: number;
  glowStrength?: number;
  svgMarkup?: string;
  svgWidth?: number;
  svgHeight?: number;
  svgColorMode?: "original" | "monochrome";
  svgFillColor?: string;
  svgStrokeColor?: string;
  svgStrokeWidth?: number;
  svgOpacity?: number;
}

const props = withDefaults(defineProps<Props>(), {
  alt: "动效预览",
  playing: false,
  duration: 1,
  delay: 0,
  iteration: "1",
  timingFunction: "ease-in-out",
  direction: "normal",
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
  glowPeak: 18,
  blinkFrequency: 1,
  borderWidth: 1,
  scanSpeed: 1.8,
  scanDirection: "top-to-bottom",
  scanLineWidth: 2,
  scanLength: 100,
  rippleStartRadius: 24,
  rippleEndRadius: 170,
  rippleCount: 3,
  rippleInterval: 0.45,
  flowLength: 18,
  flowHeadOpacity: 1,
  flowTailOpacity: 0,
  flowHeadWidth: 3.4,
  flowTailWidth: 0.5,
  glowStrength: 50,
  svgMarkup: "",
  svgWidth: 240,
  svgHeight: 150,
  svgColorMode: "original",
  svgFillColor: "#0070F3",
  svgStrokeColor: "#0070F3",
  svgStrokeWidth: 1,
  svgOpacity: 1
});

const previewRoot = ref<HTMLElement>();
const previewViewport = ref({ width: 720, height: 420 });
let previewResizeObserver: ResizeObserver | undefined;

function updatePreviewViewport(): void {
  const element = previewRoot.value;
  if (!element) return;
  previewViewport.value = {
    width: Math.max(1, element.clientWidth),
    height: Math.max(1, element.clientHeight)
  };
}

onMounted(() => {
  updatePreviewViewport();
  previewResizeObserver = new ResizeObserver(updatePreviewViewport);
  if (previewRoot.value) previewResizeObserver.observe(previewRoot.value);
});

onBeforeUnmount(() => previewResizeObserver?.disconnect());

const previewSource = computed(() => `live-rectangle:${props.motionId}`);
const showsBorderOrbit = computed(() => props.motionId === "border-flow");
const showsScan = computed(() => props.motionId === "scan-line");
const showsRipple = computed(() => props.motionId === "pulse-spread");
const effectiveDuration = computed(() => {
  if (props.motionId === "alert-blink") {
    return 1 / Math.max(props.blinkFrequency, 0.1);
  }
  return props.duration;
});
const isConfiguredLoop = computed(() =>
  ["breath", "float", "soft-blink", "glow-pulse", "slow-rotate"].includes(props.motionId)
);
const previewIteration = computed(() => isConfiguredLoop.value ? "infinite" : props.iteration);
const previewTimingFunction = computed(() => props.motionId === "slow-rotate" ? "linear" : props.timingFunction);
const previewDirection = computed(() => props.motionId === "slow-rotate" ? "normal" : props.direction);
const previewRotationAngle = computed(() => {
  if (props.motionId !== "slow-rotate") return props.rotationAngle;
  return props.direction === "reverse" ? -360 : 360;
});

const rootStyle = computed(() => ({
  "--preview-duration": `${effectiveDuration.value}s`,
  "--preview-delay": `${props.delay}s`,
  "--preview-iteration": previewIteration.value,
  "--preview-timing": previewTimingFunction.value,
  "--preview-direction": previewDirection.value,
  "--preview-color": props.color,
  "--preview-glow-base": `${Math.max(props.glowBase, 0)}px`,
  "--preview-glow": `${Math.max(props.glowPeak, 0)}px`,
  "--preview-border-width": `${Math.max(props.borderWidth, 1)}px`,
  "--preview-offset-x": `${Math.max(props.offsetX, 0)}px`,
  "--preview-offset-y": `${Math.max(props.offsetY, 0)}px`,
  "--preview-start-opacity": props.startOpacity,
  "--preview-end-opacity": props.endOpacity,
  "--preview-min-opacity": props.minOpacity,
  "--preview-max-opacity": ["soft-blink", "alert-blink"].includes(props.motionId) ? 1 : props.maxOpacity,
  "--preview-start-scale": props.startScale,
  "--preview-end-scale": props.endScale,
  "--preview-min-scale": props.minScale,
  "--preview-max-scale": props.motionId === "breath" ? 1 : props.maxScale,
  "--preview-start-blur": `${Math.max(props.startBlur, 0)}px`,
  "--preview-rotation-angle": `${previewRotationAngle.value}deg`,
  "--preview-emphasis-scale": props.emphasisScale,
  "--preview-rebound-scale": props.reboundScale,
  "--preview-glow-strength": `${props.glowStrength}%`,
  "--preview-glow-strength-soft": `${Math.max(0, Math.min(100, props.glowStrength * 0.35))}%`,
  "--preview-glow-strength-base": `${Math.max(0, Math.min(100, props.glowStrength * 0.7))}%`,
  "--preview-glow-strength-peak": `${Math.max(0, Math.min(100, props.glowStrength))}%`,
  "--preview-svg-fill": props.svgFillColor,
  "--preview-svg-stroke": props.svgStrokeColor,
  "--preview-svg-stroke-width": `${props.svgStrokeWidth}px`,
  "--preview-svg-opacity": props.svgOpacity,
  "--preview-svg-aspect": `${Math.max(1, props.svgWidth)}/${Math.max(1, props.svgHeight)}`,
  "--preview-scan-speed": `${Math.max(props.scanSpeed, 0.1)}s`,
  "--preview-scan-line-width": `${Math.max(props.scanLineWidth, 1)}px`,
  "--preview-scan-length": `${Math.max(20, props.scanLength)}%`,
  "--preview-ripple-size": `${Math.max(props.rippleEndRadius, 24)}px`,
  "--preview-ripple-start-scale": Math.min(1, props.rippleStartRadius / Math.max(props.rippleEndRadius, 1)),
  "--orbit-dash-length": BORDER_FLOW_DASH_LENGTH,
  "--orbit-dash-gap": BORDER_FLOW_DASH_GAP
}));

function borderFlowSegmentStyle(segment: BorderFlowTrailSegment): Record<string, string | number> {
  const progress = segment.id / Math.max(1, borderFlowTrailSegments.length - 1);
  const strength = Math.pow(1 - progress, 1.35);
  const opacity = props.flowTailOpacity + (props.flowHeadOpacity - props.flowTailOpacity) * strength;
  const width = props.flowTailWidth + (props.flowHeadWidth - props.flowTailWidth) * strength;
  const trailDirection = props.direction === "reverse" ? -1 : 1;
  return {
    "--orbit-start": `${trailDirection * progress * props.flowLength}px`,
    "--orbit-opacity": opacity,
    "--orbit-width": `${Math.max(0.2, width)}px`
  };
}

const targetStyle = computed(() => {
  const baseStyle: Record<string, string | number> = {
    opacity: 1,
    transform: "translate(0, 0) scale(1)",
    filter: "none"
  };
  if (!props.svgMarkup) return baseStyle;

  const sourceWidth = Math.max(1, props.svgWidth);
  const sourceHeight = Math.max(1, props.svgHeight);
  const availableWidth = Math.max(1, previewViewport.value.width * 0.82);
  const availableHeight = Math.max(1, previewViewport.value.height * 0.72);
  const previewScale = Math.min(availableWidth / sourceWidth, availableHeight / sourceHeight);
  return {
    ...baseStyle,
    width: `${sourceWidth * previewScale}px`,
    height: `${sourceHeight * previewScale}px`
  };
});
</script>

<style scoped>
.motion-preview-visual {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  background-color: var(--dm-motion-canvas-background);
  isolation: isolate;
}

.motion-preview-visual::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.045), transparent 48%);
  pointer-events: none;
}

.preview-target {
  position: relative;
  z-index: 1;
  width: min(34%, 176px);
  aspect-ratio: 8 / 5;
  transform-origin: center;
  will-change: transform, opacity, filter;
}

.has-svg .preview-target {
  aspect-ratio: auto;
}

.preview-rectangle {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: var(--preview-border-width) solid color-mix(in srgb, var(--preview-color) 72%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, var(--preview-color) 86%, #777772 14%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.32),
    0 0 var(--preview-glow) color-mix(in srgb, var(--preview-color) 48%, transparent);
  will-change: transform, opacity;
}

.preview-svg-material {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  opacity: var(--preview-svg-opacity);
}

.preview-svg-material :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.preview-svg-material :deep([stroke]:not([stroke="none"])) {
  stroke-width: var(--preview-svg-stroke-width) !important;
}

.preview-svg-material.monochrome :deep(:is(path,rect,circle,ellipse,polygon,polyline,line)) {
  stroke: var(--preview-svg-stroke) !important;
  stroke-width: var(--preview-svg-stroke-width) !important;
}

.preview-svg-material.monochrome :deep(:is(path,rect,circle,ellipse,polygon):not([fill="none"])) {
  fill: var(--preview-svg-fill) !important;
}

.preview-svg-material.monochrome :deep(:is([fill="none"],line,polyline)) {
  fill: none !important;
}

.is-playing .preview-target {
  animation-duration: var(--preview-duration);
  animation-delay: var(--preview-delay);
  animation-iteration-count: var(--preview-iteration);
  animation-timing-function: var(--preview-timing);
  animation-direction: var(--preview-direction);
  animation-fill-mode: both;
}

.is-paused :is(.preview-target, .preview-sweep, .preview-ripple, .preview-border-orbit .orbit-segment) {
  animation-play-state: paused !important;
}

.motion-fade-in.is-playing .preview-target { animation-name: sharedFadeIn; }
.motion-slide-up.is-playing .preview-target { animation-name: sharedSlideUp; }
.motion-float.is-playing .preview-target { animation-name: sharedFloat; }
.motion-slide-left.is-playing .preview-target { animation-name: sharedSlideLeft; }
.motion-scale-in.is-playing .preview-target { animation-name: sharedScaleIn; }
.motion-scale-tip.is-playing .preview-target { animation-name: sharedScaleTip; }
.motion-breath.is-playing .preview-target { animation-name: sharedPulse; }
.motion-soft-blink.is-playing .preview-target,
.motion-alert-blink.is-playing .preview-target { animation-name: sharedBlink; }
.motion-glow-pulse.is-playing .preview-target { animation-name: sharedGlowPulse; }
.motion-slow-rotate.is-playing .preview-target { animation-name: sharedRotate; }
.motion-highlight-glow.is-playing .preview-target { animation-name: highlightGlowPulse; }
.motion-border-highlight.is-playing .preview-target { animation-name: borderHighlightPulse; }

.motion-pulse-spread.is-playing .preview-rectangle {
  animation: pulseSpreadCore var(--preview-duration) var(--preview-timing) var(--preview-delay) var(--preview-iteration) both;
}
.motion-border-flow .preview-rectangle,
.motion-border-highlight .preview-rectangle,
.motion-scan-line .preview-rectangle,
.motion-slow-rotate .preview-rectangle {
  background: #171717;
}

.motion-border-flow .preview-rectangle {
  overflow: visible;
  border-color: color-mix(in srgb, var(--preview-color) 16%, rgba(255, 255, 255, 0.08));
  background: #111317;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.035),
    0 0 calc(var(--preview-glow) * 0.32) color-mix(in srgb, var(--preview-color) 10%, transparent);
}

.motion-highlight-glow .preview-rectangle {
  border-color: color-mix(in srgb, var(--preview-color) 88%, white 12%);
  background: color-mix(in srgb, var(--preview-color) 82%, #10151c 18%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    0 0 var(--preview-glow-base) color-mix(in srgb, var(--preview-color) var(--preview-glow-strength-base), transparent),
    0 0 calc(var(--preview-glow-base) * 2) color-mix(in srgb, var(--preview-color) var(--preview-glow-strength-soft), transparent);
}

.motion-border-highlight .preview-rectangle {
  border-color: color-mix(in srgb, var(--preview-color) 42%, transparent);
  background: #111317;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--preview-color) 8%, transparent),
    0 0 0 transparent;
}

.motion-border-highlight .preview-target {
  border: var(--preview-border-width) solid transparent;
  border-radius: 12px;
}

.motion-pulse-spread .preview-target {
  width: min(46%, 180px);
  aspect-ratio: 1;
}

.motion-pulse-spread .preview-rectangle {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 22px;
  height: 22px;
  border-color: color-mix(in srgb, var(--preview-color) 90%, white 10%);
  border-radius: 999px;
  background: var(--preview-color);
  box-shadow:
    0 0 calc(var(--preview-glow) * 0.5) var(--preview-color),
    0 0 calc(var(--preview-glow) * 1.15) color-mix(in srgb, var(--preview-color) 48%, transparent);
  transform: translate(-50%, -50%);
  overflow: visible;
}

.preview-border-orbit {
  position: absolute;
  z-index: 3;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.orbit-track,
.orbit-segment {
  fill: none;
  stroke: var(--preview-color);
  vector-effect: non-scaling-stroke;
  stroke-linecap: round;
}

.orbit-track {
  stroke-width: max(0.6px, calc(var(--preview-border-width) * 0.62));
  opacity: 0.12;
}

.orbit-segment {
  stroke-width: var(--orbit-width);
  stroke-dasharray: var(--orbit-dash-length) var(--orbit-dash-gap);
  opacity: var(--orbit-opacity);
}

.orbit-segment-head {
  stroke: color-mix(in srgb, var(--preview-color) 76%, white 24%);
  filter:
    drop-shadow(0 0 calc(var(--preview-glow) * 0.26) var(--preview-color))
    drop-shadow(0 0 calc(var(--preview-glow) * 0.46) color-mix(in srgb, var(--preview-color) 34%, transparent));
}

.motion-border-flow.is-playing .orbit-segment {
  animation-name: borderOrbit;
  animation-duration: var(--preview-duration);
  animation-delay: var(--preview-delay);
  animation-timing-function: linear;
  animation-iteration-count: var(--preview-iteration);
  animation-direction: var(--preview-direction);
  animation-fill-mode: both;
}

.preview-sweep {
  position: absolute;
  opacity: 0;
}

.motion-scan-line .preview-sweep {
  background: var(--preview-color);
  box-shadow:
    0 0 calc(var(--preview-glow) * 0.5) var(--preview-color),
    0 10px calc(var(--preview-glow) * 0.85) color-mix(in srgb, var(--preview-color) 48%, transparent);
}

.preview-sweep.scan-top-to-bottom,
.preview-sweep.scan-bottom-to-top {
  left: calc((100% - var(--preview-scan-length)) / 2);
  width: var(--preview-scan-length);
  height: var(--preview-scan-line-width);
}

.preview-sweep.scan-top-to-bottom { top: 0; }
.preview-sweep.scan-bottom-to-top { bottom: 0; }

.preview-sweep.scan-left-to-right,
.preview-sweep.scan-right-to-left {
  top: calc((100% - var(--preview-scan-length)) / 2);
  width: var(--preview-scan-line-width);
  height: var(--preview-scan-length);
}

.preview-sweep.scan-left-to-right { left: 0; }
.preview-sweep.scan-right-to-left { right: 0; }

.preview-sweep.scan-left-to-right,
.preview-sweep.scan-right-to-left {
  box-shadow:
    0 0 calc(var(--preview-glow) * 0.5) var(--preview-color),
    10px 0 calc(var(--preview-glow) * 0.85) color-mix(in srgb, var(--preview-color) 48%, transparent);
}

.motion-scan-line.is-playing .preview-sweep {
  animation-duration: var(--preview-scan-speed);
  animation-delay: var(--preview-delay);
  animation-timing-function: linear;
  animation-iteration-count: var(--preview-iteration);
  animation-direction: var(--preview-direction);
  animation-fill-mode: both;
}
.motion-scan-line.is-playing .scan-top-to-bottom { animation-name: scanTopToBottom; }
.motion-scan-line.is-playing .scan-bottom-to-top { animation-name: scanBottomToTop; }
.motion-scan-line.is-playing .scan-left-to-right { animation-name: scanLeftToRight; }
.motion-scan-line.is-playing .scan-right-to-left { animation-name: scanRightToLeft; }

.preview-ripple {
  position: absolute;
  z-index: 1;
  left: 50%;
  top: 50%;
  width: min(var(--preview-ripple-size), 100%);
  height: min(var(--preview-ripple-size), 100%);
  border: max(1px, var(--preview-border-width)) solid color-mix(in srgb, var(--preview-color) 86%, transparent);
  border-radius: 999px;
  box-shadow:
    0 0 calc(var(--preview-glow) * 0.45) color-mix(in srgb, var(--preview-color) 72%, transparent),
    inset 0 0 calc(var(--preview-glow) * 0.3) color-mix(in srgb, var(--preview-color) 36%, transparent);
  transform: translate(-50%, -50%) scale(0.24);
  opacity: 0;
}

.is-playing .preview-ripple {
  animation-name: sharedRipple;
  animation-duration: var(--preview-duration);
  animation-delay: calc(var(--preview-delay) + var(--ripple-delay));
  animation-timing-function: cubic-bezier(0.18, 0.72, 0.28, 1);
  animation-iteration-count: var(--preview-iteration);
  animation-direction: var(--preview-direction);
  animation-fill-mode: both;
}

@keyframes sharedFadeIn {
  from { opacity: var(--preview-start-opacity); filter: blur(var(--preview-start-blur)); }
  to { opacity: var(--preview-end-opacity); filter: blur(0); }
}

@keyframes sharedSlideUp {
  from { opacity: var(--preview-start-opacity); transform: translateY(var(--preview-offset-y)); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes sharedSlideLeft {
  from { opacity: var(--preview-start-opacity); transform: translateX(var(--preview-offset-x)); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes sharedScaleIn {
  from { opacity: var(--preview-start-opacity); transform: scale(var(--preview-start-scale)); }
  to { opacity: 1; transform: scale(var(--preview-end-scale)); }
}

@keyframes sharedScaleTip {
  0%, 100% { transform: scale(1); }
  48% { transform: scale(var(--preview-emphasis-scale)); }
  72% { transform: scale(var(--preview-rebound-scale)); }
}

@keyframes sharedPulse {
  0%, 100% { transform: scale(var(--preview-min-scale)); }
  50% { transform: scale(1); }
}

@keyframes sharedFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(calc(var(--preview-offset-y) * -1)); }
}

@keyframes pulseSpreadCore {
  0%, 100% { opacity: 0.82; transform: translate(-50%, -50%) scale(0.82); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
}

@keyframes sharedBlink {
  0%, 100% { opacity: var(--preview-max-opacity); }
  50% { opacity: var(--preview-min-opacity); }
}

@keyframes sharedGlowPulse {
  0%, 100% { filter: drop-shadow(0 0 0 transparent); }
  50% {
    filter: drop-shadow(
      0 0 var(--preview-glow)
      color-mix(in srgb, var(--preview-color) var(--preview-glow-strength), transparent)
    );
  }
}

@keyframes sharedRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(var(--preview-rotation-angle)); }
}

@keyframes borderOrbit {
  from { stroke-dashoffset: var(--orbit-start); }
  to { stroke-dashoffset: calc(var(--orbit-start) - 100px); }
}

@keyframes scanTopToBottom {
  from { transform: translateY(0); opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  to { transform: translateY(110px); opacity: 0; }
}
@keyframes scanBottomToTop {
  from { transform: translateY(0); opacity: 0; }
  12%, 88% { opacity: 1; }
  to { transform: translateY(-110px); opacity: 0; }
}
@keyframes scanLeftToRight {
  from { transform: translateX(0); opacity: 0; }
  12%, 88% { opacity: 1; }
  to { transform: translateX(176px); opacity: 0; }
}
@keyframes scanRightToLeft {
  from { transform: translateX(0); opacity: 0; }
  12%, 88% { opacity: 1; }
  to { transform: translateX(-176px); opacity: 0; }
}

@keyframes sharedRipple {
  0% { opacity: 0.92; transform: translate(-50%, -50%) scale(var(--preview-ripple-start-scale)); }
  72% { opacity: 0.28; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
}

@keyframes highlightGlowPulse {
  0%, 100% {
    filter:
      brightness(0.92)
      saturate(0.94)
      drop-shadow(0 0 var(--preview-glow-base) color-mix(in srgb, var(--preview-color) var(--preview-glow-strength-base), transparent))
      drop-shadow(0 0 calc(var(--preview-glow) * 0.35) color-mix(in srgb, var(--preview-color) var(--preview-glow-strength-soft), transparent));
    transform: scale(0.985);
  }
  50% {
    filter:
      brightness(1.22)
      saturate(1.16)
      drop-shadow(0 0 var(--preview-glow) color-mix(in srgb, var(--preview-color) var(--preview-glow-strength-peak), transparent))
      drop-shadow(0 0 calc(var(--preview-glow) * 1.65) color-mix(in srgb, var(--preview-color) var(--preview-glow-strength-base), transparent));
    transform: scale(1.025);
  }
}

@keyframes borderHighlightPulse {
  0%, 100% {
    border-color: color-mix(in srgb, var(--preview-color) 36%, transparent);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--preview-color) 7%, transparent),
      0 0 0 transparent;
  }
  50% {
    border-color: color-mix(in srgb, var(--preview-color) 96%, white 4%);
    box-shadow:
      inset 0 0 calc(var(--preview-glow) * 0.55) color-mix(in srgb, var(--preview-color) 24%, transparent),
      0 0 calc(var(--preview-glow) * 0.85) color-mix(in srgb, var(--preview-color) 76%, transparent),
      0 0 calc(var(--preview-glow) * 1.5) color-mix(in srgb, var(--preview-color) 24%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .preview-rectangle,
  .preview-sweep,
  .preview-ripple,
  .preview-border-orbit * { animation: none !important; }
}
</style>
