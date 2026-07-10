import type { DecorationEffectTemplate } from "@/types/decoration";

export type DecorationParams = Record<string, string | number>;

export function decorationClassName(template: DecorationEffectTemplate): string {
  return `decoration-effect-${template.id}`;
}

function keyframesName(template: DecorationEffectTemplate): string {
  return `decoration${template.id.replace(/[^a-zA-Z0-9]/g, "")}`;
}

function param(params: DecorationParams, key: string, fallback: string | number): string | number {
  return params[key] ?? fallback;
}

function particleRingSegments(className: string, count = 10): string {
  const center = 100;
  const outerRadius = 88;
  const innerRadius = 62;
  const step = 360 / count;
  const gap = 2.2;

  const point = (radius: number, angle: number): { x: number; y: number } => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(radians),
      y: center + radius * Math.sin(radians)
    };
  };

  return Array.from({ length: count }, (_, index) => {
    const startAngle = index * step + gap;
    const endAngle = (index + 1) * step - gap;
    const outerStart = point(outerRadius, startAngle);
    const outerEnd = point(outerRadius, endAngle);
    const innerEnd = point(innerRadius, endAngle);
    const innerStart = point(innerRadius, startAngle);
    const path = [
      `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
      `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
      `A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
      "Z"
    ].join(" ");
    return `<path class="${className}__segment" d="${path}"></path>`;
  }).join("");
}

export function generateDecorationCss(template: DecorationEffectTemplate, params: DecorationParams): string {
  const cls = decorationClassName(template);
  const kf = keyframesName(template);
  const size = param(params, "size", 160);
  const color = param(params, "color", "#0070F3");
  const duration = param(params, "duration", 2.4);
  const opacity = param(params, "opacity", 1);
  const glow = param(params, "glow", 18);
  const borderWidth = param(params, "borderWidth", 1);

  if (template.generator === "comet-flow") {
    const cometGlow = Number(glow);
    const cometWidth = Number(borderWidth);

    return `.${cls} {
  --comet-color: ${color};
  position: relative;
  width: ${size}px;
  height: 96px;
  opacity: ${opacity};
  overflow: visible;
}

.${cls}__svg {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.${cls}__comet {
  fill: none;
  stroke: url(#${cls}-color);
  stroke-width: ${cometWidth};
  stroke-linecap: round;
  mask: url(#${cls}-mask);
  filter:
    drop-shadow(0 0 ${Math.max(2, Math.round(cometGlow * 0.18))}px rgba(255, 255, 255, 0.85))
    drop-shadow(0 0 ${Math.max(4, Math.round(cometGlow * 0.66))}px ${color});
}

.${cls}__color {
  stop-color: var(--comet-color);
}

.${cls}__mask {
  transform-box: view-box;
  animation: ${kf} ${duration}s linear infinite;
}

@keyframes ${kf} {
  0% { transform: translateX(0); }
  70%, 100% { transform: translateX(3840px); }
}`;
  }

  if (template.generator === "particle-base") {
    const baseSize = Number(size);
    const baseHeight = Math.round(baseSize * 0.7);
    const particleGlow = Math.max(4, Math.round(Number(glow) * 0.45));

    return `.${cls} {
  --base-view-scale: 0.375;
  position: relative;
  width: ${baseSize}px;
  height: ${baseHeight}px;
  opacity: ${opacity};
  isolation: isolate;
}

.${cls}__halo,
.${cls}__core,
.${cls}__ring,
.${cls}__particles {
  position: absolute;
}

.${cls}__halo {
  left: 4%;
  top: 6%;
  width: 92%;
  aspect-ratio: 1;
  box-sizing: border-box;
  border: ${borderWidth}px dashed ${color};
  border-radius: 50%;
  opacity: 0.58;
  transform: scaleY(var(--base-view-scale));
  transform-origin: 50% 50%;
  box-shadow:
    0 0 ${Math.round(Number(glow) * 0.55)}px ${color},
    inset 0 0 ${Math.round(Number(glow) * 0.35)}px ${color};
  z-index: 1;
}

.${cls}__halo::after {
  content: "";
  position: absolute;
  inset: 10%;
  border: ${borderWidth}px dashed ${color};
  border-radius: 50%;
  opacity: 0.62;
}

.${cls}__core {
  left: 22%;
  top: 14%;
  width: 56%;
  aspect-ratio: 1;
  box-sizing: border-box;
  border: ${borderWidth}px solid ${color};
  border-radius: 50%;
  background: #07111A;
  transform: scaleY(var(--base-view-scale));
  transform-origin: 50% 50%;
  box-shadow:
    0 0 ${glow}px ${color},
    inset 0 0 ${Math.round(Number(glow) * 0.65)}px rgba(0, 112, 243, 0.32);
  z-index: 3;
}

.${cls}__ring {
  left: 6%;
  top: -8%;
  width: 88%;
  aspect-ratio: 1;
  overflow: visible;
  transform: scaleY(var(--base-view-scale));
  transform-origin: 50% 50%;
  filter: drop-shadow(0 0 ${Math.round(Number(glow) * 0.48)}px ${color});
  z-index: 2;
}

.${cls}__segments {
  transform-box: view-box;
  transform-origin: 100px 100px;
  animation: ${kf} ${duration}s linear infinite;
}

.${cls}__segment {
  fill: ${color};
  fill-opacity: 0.2;
  stroke: ${color};
  stroke-width: ${Math.max(1, Number(borderWidth) * 1.4)};
  stroke-linejoin: round;
}

.${cls}__segment:nth-child(3n + 1) {
  fill-opacity: 0.38;
}

.${cls}__segment:nth-child(3n + 2) {
  fill-opacity: 0.28;
}

.${cls}__ring-outline {
  fill: none;
  stroke: ${color};
  stroke-width: ${Math.max(1, Number(borderWidth))};
  opacity: 0.72;
}

.${cls}__particles {
  inset: 0;
  z-index: 4;
  pointer-events: none;
}

.${cls}__particles b {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: 0 0 ${particleGlow}px ${color};
  animation: ${kf}Particle 2.8s ease-in-out infinite;
}

.${cls}__particles b:nth-child(1) { left: 13%; top: 52%; animation-delay: -0.2s; }
.${cls}__particles b:nth-child(2) { left: 21%; top: 39%; animation-delay: -1.1s; }
.${cls}__particles b:nth-child(3) { left: 34%; top: 29%; animation-delay: -1.8s; }
.${cls}__particles b:nth-child(4) { left: 48%; top: 18%; animation-delay: -0.7s; }
.${cls}__particles b:nth-child(5) { left: 62%; top: 28%; animation-delay: -2.2s; }
.${cls}__particles b:nth-child(6) { left: 76%; top: 36%; animation-delay: -1.4s; }
.${cls}__particles b:nth-child(7) { left: 86%; top: 50%; animation-delay: -2.5s; }
.${cls}__particles b:nth-child(8) { left: 56%; top: 45%; animation-delay: -0.4s; }

@keyframes ${kf} {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes ${kf}Particle {
  0%, 100% { transform: translateY(8px) scale(0.7); opacity: 0.2; }
  45% { transform: translateY(-8px) scale(1.2); opacity: 1; }
  70% { transform: translateY(-14px) scale(0.8); opacity: 0.45; }
}`;
  }

  if (template.generator === "linear-flow") {
    const trackLength = Number(size);
    const lineWidth = Number(borderWidth);
    const coreSize = Math.max(3, lineWidth * 2 + 1);
    const glowSize = Number(glow);
    const travelDistance = trackLength + 64;
    const isCorner = template.id === "linear-corner-flow";

    if (isCorner) {
      return `.${cls} {
  position: relative;
  width: ${trackLength}px;
  height: 76px;
  opacity: ${opacity};
  overflow: hidden;
}

.${cls}::before {
  content: "";
  position: absolute;
  left: 0;
  right: 24px;
  top: 24px;
  height: 28px;
  border-top: ${lineWidth}px solid ${color};
  border-right: ${lineWidth}px solid ${color};
  border-radius: 0 18px 0 0;
  opacity: 0.28;
  box-shadow: 0 -1px ${Math.max(3, Math.round(glowSize * 0.3))}px ${color};
}

.${cls}::after {
  content: "";
  position: absolute;
  top: ${24 - Math.floor(coreSize / 2)}px;
  left: 0;
  width: ${coreSize}px;
  height: ${coreSize}px;
  border-radius: 999px;
  background: #FFFFFF;
  box-shadow:
    0 0 ${glowSize}px ${color},
    -10px 0 ${Math.max(4, Math.round(glowSize * 0.8))}px ${color},
    -24px 0 ${Math.max(3, Math.round(glowSize * 0.55))}px ${color},
    -40px 0 ${Math.max(2, Math.round(glowSize * 0.3))}px ${color};
  animation: ${kf} ${duration}s linear infinite;
}

@keyframes ${kf} {
  0% { transform: translate(-24px, 0); opacity: 0; }
  8% { opacity: 1; }
  78% { transform: translate(${trackLength - 28}px, 0); opacity: 1; }
  92% { transform: translate(${trackLength - 28}px, 28px); opacity: 1; }
  100% { transform: translate(${trackLength - 28}px, 40px); opacity: 0; }
}`;
    }

    return `.${cls} {
  position: relative;
  width: ${trackLength}px;
  height: 64px;
  opacity: ${opacity};
  overflow: hidden;
}

.${cls}::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: ${lineWidth}px;
  background: ${color};
  opacity: 0.28;
  box-shadow: 0 0 ${Math.max(3, Math.round(glowSize * 0.3))}px ${color};
}

.${cls}::after {
  content: "";
  position: absolute;
  top: calc(50% - ${Math.floor(coreSize / 2)}px);
  left: 0;
  width: ${coreSize}px;
  height: ${coreSize}px;
  border-radius: 999px;
  background: #FFFFFF;
  box-shadow:
    0 0 ${glowSize}px ${color},
    -10px 0 ${Math.max(4, Math.round(glowSize * 0.8))}px ${color},
    -24px 0 ${Math.max(3, Math.round(glowSize * 0.55))}px ${color},
    -40px 0 ${Math.max(2, Math.round(glowSize * 0.3))}px ${color};
  animation: ${kf} ${duration}s linear infinite;
}

@keyframes ${kf} {
  0% { transform: translateX(-24px); opacity: 0; }
  8% { opacity: 1; }
  92% { opacity: 1; }
  100% { transform: translateX(${travelDistance}px); opacity: 0; }
}`;
  }

  if (template.generator === "scan") {
    return `.${cls} {
  position: relative;
  width: ${size}px;
  height: ${Math.round(Number(size) * 0.68)}px;
  opacity: ${opacity};
  overflow: hidden;
  border: ${borderWidth}px solid rgba(237, 237, 237, 0.16);
  background: #000;
}

.${cls}::after {
  content: "";
  position: absolute;
  inset: 0;
  height: ${Number(borderWidth) * 2}px;
  background: ${color};
  box-shadow: 0 0 ${glow}px ${color};
  animation: ${kf} ${duration}s linear infinite;
}

@keyframes ${kf} {
  from { transform: translateY(-8px); }
  to { transform: translateY(${Math.round(Number(size) * 0.68)}px); }
}`;
  }

  if (template.generator === "border-glow") {
    return `.${cls} {
  position: relative;
  width: ${size}px;
  height: ${Math.round(Number(size) * 0.62)}px;
  opacity: ${opacity};
  border: ${borderWidth}px solid ${color};
  background: #0A0A0A;
  box-shadow: 0 0 ${Math.round(Number(glow) * 0.45)}px ${color};
  animation: ${kf} ${duration}s ease-in-out infinite;
}

.${cls}::before,
.${cls}::after {
  content: "";
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: ${color};
  border-style: solid;
  border-width: ${borderWidth}px 0 0 ${borderWidth}px;
}

.${cls}::before { left: -${borderWidth}px; top: -${borderWidth}px; }
.${cls}::after { right: -${borderWidth}px; bottom: -${borderWidth}px; transform: rotate(180deg); }

@keyframes ${kf} {
  0%, 100% { box-shadow: 0 0 ${Math.round(Number(glow) * 0.35)}px ${color}; }
  50% { box-shadow: 0 0 ${glow}px ${color}; }
}`;
  }

  return `.${cls} {
  position: relative;
  width: ${size}px;
  height: ${size}px;
  opacity: ${opacity};
  border: ${borderWidth}px solid ${color};
  border-radius: 999px;
  background: #000;
  box-shadow: 0 0 ${glow}px ${color};
  animation: ${kf} ${duration}s ease-in-out infinite;
}

.${cls}::before {
  content: "";
  position: absolute;
  inset: 22%;
  border: ${borderWidth}px solid rgba(237, 237, 237, 0.22);
  border-radius: inherit;
}

.${cls}::after {
  content: "";
  position: absolute;
  inset: 42%;
  border-radius: inherit;
  background: ${color};
  box-shadow: 0 0 ${glow}px ${color};
}

@keyframes ${kf} {
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.06) rotate(12deg); }
}`;
}

export function generateDecorationHtmlCss(template: DecorationEffectTemplate, params: DecorationParams): string {
  return `${generateDecorationMarkup(template)}

<style>
${generateDecorationCss(template, params)}
</style>`;
}

export function generateDecorationMarkup(template: DecorationEffectTemplate): string {
  if (template.generator === "comet-flow") {
    const cls = decorationClassName(template);
    return `<div class="${cls}" aria-hidden="true">
  <svg class="${cls}__svg" viewBox="0 0 3840 130" preserveAspectRatio="none" fill="none">
    <defs>
      <path id="${cls}-path" d="M3840 2H2722.2C2670.59 2 2622.3 27.4476 2593.12 70.0193C2567.97 106.709 2530.28 128 2490.49 128H1349.51C1309.72 128 1272.03 106.709 1246.88 70.0193C1217.7 27.4476 1169.41 2 1117.8 2H0"></path>
      <linearGradient id="${cls}-color" x1="0" y1="65" x2="3840" y2="65" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#55E6FF"></stop>
        <stop class="${cls}__color" offset="0.42"></stop>
        <stop offset="0.58" stop-color="#FFFFFF"></stop>
        <stop offset="1" stop-color="#6AA7FF"></stop>
      </linearGradient>
      <linearGradient id="${cls}-mask-gradient" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0" stop-color="#FFFFFF" stop-opacity="1"></stop>
        <stop offset="0.1" stop-color="#FFFFFF" stop-opacity="0.95"></stop>
        <stop offset="0.42" stop-color="#FFFFFF" stop-opacity="0.45"></stop>
        <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"></stop>
      </linearGradient>
      <mask id="${cls}-mask" maskUnits="userSpaceOnUse" x="-900" y="-40" width="5640" height="220">
        <rect class="${cls}__mask" x="-820" y="-40" width="820" height="220" fill="url(#${cls}-mask-gradient)"></rect>
      </mask>
    </defs>
    <use href="#${cls}-path" class="${cls}__comet"></use>
  </svg>
</div>`;
  }

  if (template.generator === "particle-base") {
    const cls = decorationClassName(template);
    const segments = particleRingSegments(cls);
    const particles = Array.from({ length: 8 }, () => "<b></b>").join("");
    return `<div class="${cls}" aria-hidden="true">
  <div class="${cls}__halo"></div>
  <svg class="${cls}__ring" viewBox="0 0 200 200" focusable="false">
    <circle class="${cls}__ring-outline" cx="100" cy="100" r="91"></circle>
    <g class="${cls}__segments">${segments}</g>
  </svg>
  <div class="${cls}__core"></div>
  <div class="${cls}__particles">${particles}</div>
</div>`;
  }

  return `<div class="${decorationClassName(template)}"></div>`;
}

export function generateDecorationVue(template: DecorationEffectTemplate, params: DecorationParams): string {
  return `<template>
  ${generateDecorationMarkup(template)}
</template>

<style scoped>
${generateDecorationCss(template, params)}
</style>`;
}

export function generateDecorationJson(template: DecorationEffectTemplate, params: DecorationParams): string {
  return JSON.stringify(
    {
      id: template.id,
      name: template.name,
      section: template.section,
      description: template.description,
      scene: template.scene,
      params
    },
    null,
    2
  );
}
