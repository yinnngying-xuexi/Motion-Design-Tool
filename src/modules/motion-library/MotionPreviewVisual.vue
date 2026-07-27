<template>
  <div
    class="motion-preview-visual dm-motion-canvas"
    :class="[`motion-${motionId}`, { 'is-playing': playing, 'is-paused': !playing }]"
    :data-motion-id="motionId"
    :data-preview-source="previewSource"
    :style="rootStyle"
    role="img"
    :aria-label="alt"
  >
    <div class="preview-target" :style="targetStyle">
      <div class="preview-rectangle">
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
        <span v-if="showsScan" class="preview-sweep"></span>
      </div>
      <span v-if="showsRipple" class="preview-ripple"></span>
      <span v-if="showsRipple" class="preview-ripple preview-ripple-secondary"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
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
  opacity?: number;
  translateX?: number;
  translateY?: number;
  scale?: number;
  rotate?: number;
  blur?: number;
  shadow?: number;
  glow?: number;
  loopSpeed?: number;
  blinkFrequency?: number;
  borderWidth?: number;
  amplitude?: number;
  scanSpeed?: number;
  rippleRadius?: number;
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
  opacity: 1,
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotate: 0,
  blur: 0,
  shadow: 0,
  glow: 18,
  loopSpeed: 1,
  blinkFrequency: 1,
  borderWidth: 1,
  amplitude: 24,
  scanSpeed: 1.8,
  rippleRadius: 96
});

const previewSource = computed(() => `live-rectangle:${props.motionId}`);
const showsBorderOrbit = computed(() => props.motionId === "border-flow");
const showsScan = computed(() => props.motionId === "scan-line");
const showsRipple = computed(() => props.motionId === "pulse-spread");
const effectiveDuration = computed(() => {
  if (props.motionId === "alert-blink" || props.motionId === "soft-blink") {
    return 1 / Math.max(props.blinkFrequency, 0.1);
  }
  return props.duration / Math.max(props.loopSpeed, 0.1);
});

const rootStyle = computed(() => ({
  "--preview-duration": `${effectiveDuration.value}s`,
  "--preview-delay": `${props.delay}s`,
  "--preview-iteration": props.iteration,
  "--preview-timing": props.timingFunction,
  "--preview-direction": props.direction,
  "--preview-color": props.color,
  "--preview-glow": `${Math.max(props.glow, 0)}px`,
  "--preview-border-width": `${Math.max(props.borderWidth, 1)}px`,
  "--preview-amplitude": `${Math.max(props.amplitude, 0)}px`,
  "--preview-scan-speed": `${Math.max(props.scanSpeed, 0.1)}s`,
  "--preview-ripple-size": `${Math.max(props.rippleRadius, 24)}px`,
  "--orbit-dash-length": BORDER_FLOW_DASH_LENGTH,
  "--orbit-dash-gap": BORDER_FLOW_DASH_GAP
}));

function borderFlowSegmentStyle(segment: BorderFlowTrailSegment): Record<string, string | number> {
  return {
    "--orbit-start": `${segment.offset}px`,
    "--orbit-opacity": segment.opacity,
    "--orbit-width": `${Math.max(0.5, props.borderWidth * segment.widthFactor)}px`
  };
}

const targetStyle = computed(() => ({
  opacity: props.opacity,
  transform: `translate(${props.translateX}px, ${props.translateY}px) scale(${props.scale}) rotate(${props.rotate}deg)`,
  filter: `blur(${props.blur}px) drop-shadow(0 12px ${Math.max(props.shadow, 0)}px rgba(0, 0, 0, 0.46))`
}));
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

.is-playing .preview-rectangle {
  animation-duration: var(--preview-duration);
  animation-delay: var(--preview-delay);
  animation-iteration-count: var(--preview-iteration);
  animation-timing-function: var(--preview-timing);
  animation-direction: var(--preview-direction);
  animation-fill-mode: both;
}

.is-paused :is(.preview-rectangle, .preview-sweep, .preview-ripple, .preview-border-orbit .orbit-segment) {
  animation-play-state: paused !important;
}

.motion-fade-in.is-playing .preview-rectangle { animation-name: sharedFadeIn; }
.motion-slide-up.is-playing .preview-rectangle,
.motion-float.is-playing .preview-rectangle { animation-name: sharedSlideUp; }
.motion-slide-left.is-playing .preview-rectangle { animation-name: sharedSlideLeft; }
.motion-scale-in.is-playing .preview-rectangle,
.motion-scale-tip.is-playing .preview-rectangle { animation-name: sharedScaleIn; }
.motion-breath.is-playing .preview-rectangle { animation-name: sharedPulse; }
.motion-pulse-spread.is-playing .preview-rectangle { animation-name: pulseSpreadCore; }
.motion-soft-blink.is-playing .preview-rectangle,
.motion-alert-blink.is-playing .preview-rectangle { animation-name: sharedBlink; }
.motion-slow-rotate.is-playing .preview-rectangle { animation-name: sharedRotate; }
.motion-highlight-glow.is-playing .preview-rectangle { animation-name: highlightGlowPulse; }
.motion-border-highlight.is-playing .preview-rectangle { animation-name: borderHighlightPulse; }
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
    0 0 calc(var(--preview-glow) * 0.55) color-mix(in srgb, var(--preview-color) 72%, transparent),
    0 0 calc(var(--preview-glow) * 1.15) color-mix(in srgb, var(--preview-color) 28%, transparent);
}

.motion-border-highlight .preview-rectangle {
  border-color: color-mix(in srgb, var(--preview-color) 42%, transparent);
  background: #111317;
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, var(--preview-color) 8%, transparent),
    0 0 0 transparent;
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
  animation: borderOrbit var(--preview-duration) linear infinite;
}

.preview-sweep {
  position: absolute;
  inset: -2px 0 auto;
  width: 100%;
  height: 2px;
  opacity: 0;
}

.motion-scan-line .preview-sweep {
  background: var(--preview-color);
  box-shadow:
    0 0 calc(var(--preview-glow) * 0.5) var(--preview-color),
    0 10px calc(var(--preview-glow) * 0.85) color-mix(in srgb, var(--preview-color) 48%, transparent);
  transform: none;
}

.motion-scan-line.is-playing .preview-sweep {
  animation: sharedScan var(--preview-duration) linear infinite;
}

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
  animation: sharedRipple var(--preview-duration) cubic-bezier(0.18, 0.72, 0.28, 1) infinite;
}

.is-playing .preview-ripple-secondary {
  animation-delay: calc(var(--preview-duration) / -2);
}

@keyframes sharedFadeIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes sharedSlideUp {
  from { opacity: 0; transform: translateY(var(--preview-amplitude)); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes sharedSlideLeft {
  from { opacity: 0; transform: translateX(calc(var(--preview-amplitude) * -1)); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes sharedScaleIn {
  from { opacity: 0.18; transform: scale(0.72); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes sharedPulse {
  0%, 100% { opacity: 0.88; transform: scale(0.98); }
  50% { opacity: 1; transform: scale(1.045); }
}

@keyframes pulseSpreadCore {
  0%, 100% { opacity: 0.82; transform: translate(-50%, -50%) scale(0.82); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.08); }
}

@keyframes sharedBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.24; }
}

@keyframes sharedRotate { to { transform: rotate(360deg); } }

@keyframes borderOrbit {
  from { stroke-dashoffset: var(--orbit-start); }
  to { stroke-dashoffset: calc(var(--orbit-start) - 100px); }
}

@keyframes sharedScan {
  from { transform: translateY(0); opacity: 0; }
  12% { opacity: 1; }
  88% { opacity: 1; }
  to { transform: translateY(110px); opacity: 0; }
}

@keyframes sharedRipple {
  0% { opacity: 0.92; transform: translate(-50%, -50%) scale(0.24); }
  72% { opacity: 0.28; }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(1.9); }
}

@keyframes highlightGlowPulse {
  0%, 100% {
    filter: brightness(0.92) saturate(0.94);
    transform: scale(0.985);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.32),
      0 0 calc(var(--preview-glow) * 0.4) color-mix(in srgb, var(--preview-color) 58%, transparent),
      0 0 calc(var(--preview-glow) * 0.8) color-mix(in srgb, var(--preview-color) 18%, transparent);
  }
  50% {
    filter: brightness(1.22) saturate(1.16);
    transform: scale(1.025);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.58),
      0 0 var(--preview-glow) color-mix(in srgb, var(--preview-color) 92%, transparent),
      0 0 calc(var(--preview-glow) * 2.15) color-mix(in srgb, var(--preview-color) 48%, transparent);
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
