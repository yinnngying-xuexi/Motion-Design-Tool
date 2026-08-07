import type { BasicMotionConfig, BasicMotionTemplate } from "@/types/motion";
import type { SvgPreviewAsset, SvgStyleConfig } from "@/types/svgFlow";
import { borderFlowTrailSegments } from "@/utils/borderFlowTrail";

export type { BasicMotionConfig } from "@/types/motion";

function names(template: BasicMotionTemplate): { cls: string; keyframes: string } {
  const id = template.id.replace(/[^a-zA-Z0-9-]/g, "-");
  return { cls: `motion-${id}`, keyframes: `motion${id.replace(/-/g, "")}` };
}

export function generateBasicMotionFrames(template: BasicMotionTemplate, config: BasicMotionConfig): string {
  switch (template.id) {
    case "fade-in":
      return `from { opacity:${config.startOpacity}; filter:blur(${config.startBlur}px); } to { opacity:${config.endOpacity}; filter:blur(0); }`;
    case "slide-up":
      return `from { opacity:${config.startOpacity}; transform:translateY(${config.offsetY}px); } to { opacity:1; transform:translateY(0); }`;
    case "slide-left":
      return `from { opacity:${config.startOpacity}; transform:translateX(${Math.abs(config.offsetX)}px); } to { opacity:1; transform:translateX(0); }`;
    case "scale-in":
      return `from { opacity:${config.startOpacity}; transform:scale(${config.startScale}); } to { opacity:1; transform:scale(${config.endScale}); }`;
    case "breath":
      return `0%,100% { transform:scale(${config.minScale}); } 50% { transform:scale(1); }`;
    case "float":
      return `0%,100% { transform:translateY(0); } 50% { transform:translateY(${-Math.abs(config.offsetY)}px); }`;
    case "soft-blink":
      return `0%,100% { opacity:1; } 50% { opacity:${config.minOpacity}; }`;
    case "glow-pulse":
      return `0%,100% { filter:drop-shadow(0 0 0 transparent); } 50% { filter:drop-shadow(0 0 ${config.glowPeak}px color-mix(in srgb,${config.color} ${config.glowStrength}%,transparent)); }`;
    case "alert-blink":
      return `0%,100% { opacity:1; } 50% { opacity:${config.minOpacity}; }`;
    case "slow-rotate":
      return `from { transform:rotate(0deg); } to { transform:rotate(${config.direction === "reverse" ? -360 : 360}deg); }`;
    case "scale-tip":
      return `0%,100% { transform:scale(1); } 48% { transform:scale(${config.emphasisScale}); } 72% { transform:scale(${config.reboundScale}); }`;
    case "highlight-glow":
      return `0%,100% { transform:scale(.985); filter:brightness(.92) saturate(.94) drop-shadow(0 0 ${config.glowBase}px color-mix(in srgb,${config.color} ${config.glowStrength * 0.7}%,transparent)) drop-shadow(0 0 ${config.glowPeak * 0.35}px color-mix(in srgb,${config.color} ${config.glowStrength * 0.35}%,transparent)); }
  50% { transform:scale(1.025); filter:brightness(1.22) saturate(1.16) drop-shadow(0 0 ${config.glowPeak}px color-mix(in srgb,${config.color} ${config.glowStrength}%,transparent)) drop-shadow(0 0 ${config.glowPeak * 1.65}px color-mix(in srgb,${config.color} ${config.glowStrength * 0.7}%,transparent)); }`;
    case "border-highlight":
      return `0%,100% { border-color:${config.color}55; box-shadow:inset 0 0 ${config.glowBase}px ${config.color}22,0 0 ${config.glowBase}px ${config.color}33; }
  50% { border-color:${config.color}; box-shadow:inset 0 0 ${config.glowPeak * 0.45}px ${config.color}44,0 0 ${config.glowPeak}px ${config.color}CC; }`;
    default:
      return "from { opacity:0; } to { opacity:1; }";
  }
}

function rippleMarkup(cls: string, config?: BasicMotionConfig): string {
  const count = Math.max(1, Math.round(config?.rippleCount ?? 3));
  return Array.from({ length: count }, (_, index) =>
    `<span class="${cls}__ripple" style="--ripple-index:${index}"></span>`
  ).join("");
}

function borderOrbitMarkup(cls: string, config?: BasicMotionConfig): string {
  if (!config) return "";
  const last = Math.max(1, borderFlowTrailSegments.length - 1);
  const trail = borderFlowTrailSegments.map((_, index) => {
    const progress = index / last;
    const strength = Math.pow(1 - progress, 1.35);
    const opacity = config.flowTailOpacity + (config.flowHeadOpacity - config.flowTailOpacity) * strength;
    const width = config.flowTailWidth + (config.flowHeadWidth - config.flowTailWidth) * strength;
    const trailDirection = config.direction === "reverse" ? -1 : 1;
    return `  <rect class="${cls}__orbit-segment${index === 0 ? ` ${cls}__orbit-segment--head` : ""}" x="2" y="2" width="236" height="146" rx="10" pathLength="100" style="--orbit-start:${trailDirection * progress * config.flowLength}px;--orbit-opacity:${opacity.toFixed(3)};--orbit-width:${width.toFixed(2)}px"></rect>`;
  }).join("\n");
  return `<svg class="${cls}__orbit" viewBox="0 0 240 150" preserveAspectRatio="none" aria-hidden="true">
  <rect class="${cls}__orbit-track" x="2" y="2" width="236" height="146" rx="10" pathLength="100"></rect>
${trail}
</svg>`;
}

export function generateBasicMotionMarkup(
  template: BasicMotionTemplate,
  asset?: SvgPreviewAsset,
  config?: BasicMotionConfig
): string {
  const { cls } = names(template);
  const content = template.id === "pulse-spread"
      ? `<span class="${cls}__pulse-core"></span>`
      : `<p>数据态势</p><strong>87.62</strong><small>${template.category}</small>`;
  const material = asset
    ? `<div class="${cls}__material ${cls}__material--svg"><div class="${cls}__svg">${asset.markup}</div></div>`
    : `<div class="${cls}__material">${content}</div>`;
  const ripple = template.id === "pulse-spread" ? rippleMarkup(cls, config) : "";
  const scan = template.id === "scan-line" ? `<span class="${cls}__scan"></span>` : "";
  const borderOrbit = template.id === "border-flow" ? borderOrbitMarkup(cls, config) : "";
  return `<div class="${cls}${asset ? ` ${cls}--svg-only` : ""}">${material}${ripple}${scan}${borderOrbit}</div>`;
}

function generateSvgStyleCss(cls: string, style?: SvgStyleConfig): string {
  const current = style ?? {
    colorMode: "original",
    fillColor: "#0070F3",
    strokeColor: "#0070F3",
    strokeWidth: 1,
    opacity: 1
  };
  const base = `.${cls}__svg { opacity:${current.opacity}; }
.${cls}__svg [stroke]:not([stroke="none"]) { stroke-width:${current.strokeWidth}px !important; }`;
  if (current.colorMode === "original") return base;
  return `${base}
.${cls}__svg :is(path,rect,circle,ellipse,polygon,polyline,line) { stroke:${current.strokeColor} !important; stroke-width:${current.strokeWidth}px !important; }
.${cls}__svg :is(path,rect,circle,ellipse,polygon):not([fill="none"]) { fill:${current.fillColor} !important; }
.${cls}__svg :is([fill="none"],line,polyline) { fill:none !important; }`;
}

function scanGeometry(config: BasicMotionConfig): {
  inset: string; width: string; height: string; transformFrom: string; transformTo: string;
} {
  const horizontal = config.scanDirection === "left-to-right" || config.scanDirection === "right-to-left";
  const reverse = config.scanDirection === "bottom-to-top" || config.scanDirection === "right-to-left";
  if (horizontal) {
    return {
      inset: `0 auto 0 ${reverse ? "100%" : "0"}`,
      width: `${config.scanLineWidth}px`,
      height: `${config.scanLength}%`,
      transformFrom: `translate(-50%, ${(100 - config.scanLength) / 2}%)`,
      transformTo: `translate(${reverse ? "-240px" : "240px"}, ${(100 - config.scanLength) / 2}%)`
    };
  }
  return {
    inset: `${reverse ? "100%" : "0"} auto auto 0`,
    width: `${config.scanLength}%`,
    height: `${config.scanLineWidth}px`,
    transformFrom: `translate(${(100 - config.scanLength) / 2}%, -50%)`,
    transformTo: `translate(${(100 - config.scanLength) / 2}%, ${reverse ? "-150px" : "150px"})`
  };
}

export function generateBasicMotionCss(template: BasicMotionTemplate, config: BasicMotionConfig, svgStyle?: SvgStyleConfig): string {
  const { cls, keyframes } = names(template);
  const speed = template.id === "alert-blink" ? 1 / Math.max(config.blinkFrequency, 0.1) : config.duration;
  const isConfiguredLoop = ["breath", "float", "soft-blink", "glow-pulse", "slow-rotate"].includes(template.id);
  const iteration = isConfiguredLoop ? "infinite" : config.iteration;
  const timingFunction = template.id === "slow-rotate" ? "linear" : config.timingFunction;
  const animationDirection = template.id === "slow-rotate" ? "normal" : config.direction;
  const childAnimated = template.id === "pulse-spread" || template.id === "scan-line" || template.id === "border-flow";
  const rootAnimation = childAnimated
    ? "none"
    : `${keyframes} ${speed}s ${timingFunction} ${config.delay}s ${iteration} ${animationDirection} both`;
  const pulseSpread = template.id === "pulse-spread";
  const borderFlow = template.id === "border-flow";
  const scan = scanGeometry(config);
  const border = pulseSpread ? "0" : borderFlow
    ? `1px solid color-mix(in srgb, ${config.color} 16%, rgba(255,255,255,.08))`
    : `${template.id === "border-highlight" ? config.borderWidth : 1}px solid ${config.color}`;
  const rootBorder = template.id === "border-highlight" ? `${config.borderWidth}px solid transparent` : "0";
  const materialBorder = template.id === "border-highlight" ? "0" : border;
  const background = pulseSpread ? "transparent" : template.id === "highlight-glow" ? `${config.color}D9` : "#101214";
  const shadow = template.id === "highlight-glow"
    ? `0 0 ${config.glowBase}px ${config.color}88`
    : borderFlow ? "inset 0 1px 0 rgba(255,255,255,.04)" : "0 14px 32px rgba(0,0,0,.42)";
  const startRippleScale = Math.min(1, config.rippleStartRadius / Math.max(config.rippleEndRadius, 1));

  return `.${cls} {
  position:relative;
  width:240px;
  height:150px;
  display:grid;
  place-items:center;
  overflow:visible;
  color:${config.color};
  border:${rootBorder};
  border-radius:12px;
  animation:${rootAnimation};
}
.${cls}__material {
  position:relative;
  width:100%;
  height:100%;
  display:grid;
  place-items:center;
  align-content:center;
  gap:6px;
  overflow:${borderFlow ? "visible" : "hidden"};
  border:${materialBorder};
  border-radius:12px;
  background:${background};
  box-shadow:${shadow};
}
.${cls} p,.${cls} small { margin:0; color:#8F8F8F; }
.${cls} strong { font-size:38px; }
.${cls}__material--svg { overflow:visible; border:0; border-radius:0; background:transparent; box-shadow:none; }
.${cls}__svg { width:min(78%,180px); height:min(78%,110px); transform:translate(${config.assetOffsetX}px,${config.assetOffsetY}px) scale(${config.assetScale}); transform-origin:center; }
.${cls}__svg svg { width:100%; height:100%; display:block; overflow:visible; }
${generateSvgStyleCss(cls, svgStyle)}
.${cls}__pulse-core { position:absolute; z-index:2; width:22px; height:22px; border-radius:50%; background:${config.color}; box-shadow:0 0 ${Math.max(6, config.glowPeak)}px ${config.color}; animation:${keyframes}Core ${speed}s ease-in-out infinite; }
.${cls}__ripple { position:absolute; z-index:1; left:50%; top:50%; width:${config.rippleEndRadius}px; height:${config.rippleEndRadius}px; border:${config.borderWidth}px solid ${config.color}; border-radius:50%; transform:translate(-50%,-50%) scale(${startRippleScale}); opacity:0; animation:${keyframes}Ripple ${speed}s cubic-bezier(.18,.72,.28,1) infinite; animation-delay:calc(var(--ripple-index) * ${config.rippleInterval}s); }
.${cls}__scan { position:absolute; inset:${scan.inset}; width:${scan.width}; height:${scan.height}; background:${config.color}; box-shadow:0 0 ${config.glowPeak}px ${config.color}; animation:${keyframes}Scan ${config.scanSpeed}s linear infinite; }
.${cls}__orbit { position:absolute; z-index:3; inset:0; width:100%; height:100%; overflow:visible; pointer-events:none; }
.${cls}__orbit-track,.${cls}__orbit-segment { fill:none; stroke:${config.color}; vector-effect:non-scaling-stroke; stroke-linecap:round; }
.${cls}__orbit-track { stroke-width:.7px; opacity:.12; }
.${cls}__orbit-segment { stroke-width:var(--orbit-width); stroke-dasharray:1.4 98.6; opacity:var(--orbit-opacity); animation:${keyframes}Orbit ${speed}s linear infinite ${config.direction === "reverse" ? "reverse" : "normal"}; }
.${cls}__orbit-segment--head { stroke:color-mix(in srgb,${config.color} 76%,white 24%); filter:drop-shadow(0 0 ${Math.max(3, config.glowPeak * 0.45)}px ${config.color}); }
@keyframes ${keyframes} { ${generateBasicMotionFrames(template, config)} }
@keyframes ${keyframes}Core { 0%,100% { opacity:.82; transform:scale(.82); } 50% { opacity:1; transform:scale(1.08); } }
@keyframes ${keyframes}Ripple { 0% { opacity:.92; transform:translate(-50%,-50%) scale(${startRippleScale}); } 72% { opacity:.28; } 100% { opacity:0; transform:translate(-50%,-50%) scale(1); } }
@keyframes ${keyframes}Scan { from { transform:${scan.transformFrom}; opacity:0; } 12%,88% { opacity:1; } to { transform:${scan.transformTo}; opacity:0; } }
@keyframes ${keyframes}Orbit { from { stroke-dashoffset:var(--orbit-start); } to { stroke-dashoffset:calc(var(--orbit-start) - 100px); } }`;
}

export function generateBasicMotionHtmlCss(
  template: BasicMotionTemplate, config: BasicMotionConfig, asset?: SvgPreviewAsset, svgStyle?: SvgStyleConfig
): string {
  return `${generateBasicMotionMarkup(template, asset, config)}\n\n<style>\n${generateBasicMotionCss(template, config, svgStyle)}\n</style>`;
}

export function generateBasicMotionVue(
  template: BasicMotionTemplate, config: BasicMotionConfig, asset?: SvgPreviewAsset, svgStyle?: SvgStyleConfig
): string {
  return `<template>\n  ${generateBasicMotionMarkup(template, asset, config)}\n</template>\n\n<style scoped>\n${generateBasicMotionCss(template, config, svgStyle)}\n</style>`;
}

export function generateBasicMotionJson(
  template: BasicMotionTemplate, config: BasicMotionConfig, asset?: SvgPreviewAsset, svgStyle?: SvgStyleConfig
): string {
  return JSON.stringify({ id: template.id, name: template.name, category: template.category, config, svgAsset: asset, svgStyle }, null, 2);
}
