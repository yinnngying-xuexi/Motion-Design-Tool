import type { BasicMotionTemplate } from "@/types/motion";
import type { SvgPreviewAsset } from "@/types/svgFlow";

export interface BasicMotionConfig {
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

function names(template: BasicMotionTemplate): { cls: string; keyframes: string } {
  const id = template.id.replace(/[^a-zA-Z0-9-]/g, "-");
  return { cls: `motion-${id}`, keyframes: `motion${id.replace(/-/g, "")}` };
}

function frames(template: BasicMotionTemplate, config: BasicMotionConfig): string {
  const x = config.translateX || config.amplitude;
  const y = config.translateY || config.amplitude;
  if (template.id === "highlight-glow") {
    return `0%, 100% {
      transform: scale(0.985);
      filter: brightness(0.92) saturate(0.94);
      box-shadow: 0 0 ${Math.max(4, config.glow * 0.4)}px ${config.color}55;
    }
    50% {
      transform: scale(1.025);
      filter: brightness(1.22) saturate(1.16);
      box-shadow: 0 0 ${Math.max(8, config.glow)}px ${config.color}, 0 0 ${Math.max(14, config.glow * 2.1)}px ${config.color}66;
    }`;
  }
  if (template.id === "border-highlight") {
    return `0%, 100% {
      border-color: ${config.color}66;
      box-shadow: inset 0 0 0 1px ${config.color}12;
    }
    50% {
      border-color: ${config.color};
      box-shadow: inset 0 0 ${Math.max(4, config.glow * 0.5)}px ${config.color}44, 0 0 ${Math.max(8, config.glow)}px ${config.color}CC;
    }`;
  }
  switch (template.previewType) {
    case "fade": return "0% { opacity: 0; } 100% { opacity: 1; }";
    case "slide": return `0% { transform: translate(${-Math.abs(x)}px, ${Math.abs(y)}px); opacity: 0; } 100% { transform: translate(0, 0); opacity: ${config.opacity}; }`;
    case "scale": return `0% { transform: scale(0.72); opacity: 0; } 100% { transform: scale(${config.scale}); opacity: ${config.opacity}; }`;
    case "pulse": return `0%, 100% { transform: scale(${config.scale}); opacity: ${config.opacity}; } 50% { transform: scale(${config.scale * 1.08}); opacity: ${Math.max(0.25, config.opacity * 0.72)}; }`;
    case "float": return `0%, 100% { transform: translateY(0); } 50% { transform: translateY(${-Math.abs(config.amplitude)}px); }`;
    case "blink": return `0%, 100% { opacity: ${config.opacity}; } 50% { opacity: ${Math.max(0.12, config.opacity * 0.22)}; }`;
    case "rotate": return `from { transform: rotate(${config.rotate}deg); } to { transform: rotate(${config.rotate + 360}deg); }`;
    case "glow": return `0%, 100% { filter: drop-shadow(0 0 ${Math.max(2, config.glow * 0.35)}px ${config.color}); } 50% { filter: drop-shadow(0 0 ${config.glow}px ${config.color}); }`;
    case "ripple": return "from { transform: scale(0.55); opacity: 0.9; } to { transform: scale(2); opacity: 0; }";
    case "scan": return "from { transform: translateY(-8px); } to { transform: translateY(100%); }";
    default: return "from { opacity: 0; } to { opacity: 1; }";
  }
}

export function generateBasicMotionMarkup(template: BasicMotionTemplate, asset?: SvgPreviewAsset): string {
  const { cls } = names(template);
  const content = asset
    ? `<div class="${cls}__svg">${asset.markup}</div>`
    : template.id === "pulse-spread"
      ? `<span class="${cls}__pulse-core"></span>`
    : `<p>数据态势</p><strong>87.62</strong><small>${template.category}</small>`;
  const ripple = template.previewType === "ripple"
    ? `<span class="${cls}__ripple"></span><span class="${cls}__ripple ${cls}__ripple--secondary"></span>`
    : "";
  const scan = template.previewType === "scan" ? `<span class="${cls}__scan"></span>` : "";
  const sweep = template.id === "border-flow" ? `<span class="${cls}__sweep"></span>` : "";
  const modifier = asset ? ` ${cls}--svg-only` : "";
  return `<div class="${cls}${modifier}">${ripple}${scan}${sweep}${content}</div>`;
}

export function generateBasicMotionCss(template: BasicMotionTemplate, config: BasicMotionConfig): string {
  const { cls, keyframes } = names(template);
  const speed = template.previewType === "blink" ? 1 / config.blinkFrequency : config.duration / config.loopSpeed;
  const childAnimated = template.previewType === "ripple" || template.previewType === "scan" || template.id === "border-flow";
  const rootAnimation = childAnimated
    ? "none"
    : `${keyframes} ${speed}s ${config.timingFunction} ${config.delay}s ${config.iteration} ${config.direction}`;
  const pulseSpread = template.id === "pulse-spread";
  const baseBorder = pulseSpread ? "0" : `${config.borderWidth}px solid ${config.color}`;
  const baseBackground = pulseSpread ? "transparent" : template.id === "highlight-glow" ? `${config.color}D9` : "#0A0A0A";
  const baseShadow = pulseSpread ? "none" : template.id === "highlight-glow"
    ? `0 0 ${Math.max(4, config.glow * 0.55)}px ${config.color}AA, 0 0 ${Math.max(10, config.glow * 1.15)}px ${config.color}44`
    : `0 0 ${config.shadow}px rgba(0,0,0,.8), 0 0 ${config.glow}px ${config.color}`;
  return `.${cls} {
  position: relative;
  width: 240px;
  height: 150px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  overflow: hidden;
  color: ${config.color};
  opacity: ${config.opacity};
  border: ${baseBorder};
  background: ${baseBackground};
  box-shadow: ${baseShadow};
  transform: translate(${config.translateX}px, ${config.translateY}px) scale(${config.scale}) rotate(${config.rotate}deg);
  filter: blur(${config.blur}px);
  animation: ${rootAnimation};
}
.${cls} p, .${cls} small { margin: 0; color: #8F8F8F; }
.${cls} strong { font-size: 38px; }
.${cls}.${cls}--svg-only { overflow: visible; border: 0; border-radius: 0; background: transparent; box-shadow: none; }
.${cls}__svg, .${cls}__svg svg { width: min(78%, 180px); height: min(78%, 110px); display: block; overflow: visible; }
.${cls}__svg svg { width: 100%; height: 100%; }
.${cls}__pulse-core { position:absolute; z-index:2; width:22px; height:22px; border:1px solid ${config.color}; border-radius:50%; background:${config.color}; box-shadow:0 0 ${Math.max(6, config.glow)}px ${config.color}; animation:${keyframes}Core ${speed}s ease-in-out infinite; }
.${cls}__ripple { position:absolute; z-index:1; width:${config.rippleRadius}px; height:${config.rippleRadius}px; border:${Math.max(1, config.borderWidth)}px solid ${config.color}; border-radius:50%; box-shadow:0 0 ${Math.max(4, config.glow * 0.45)}px ${config.color}; animation:${keyframes}Ripple ${speed}s cubic-bezier(.18,.72,.28,1) infinite; }
.${cls}__ripple--secondary { animation-delay: calc(${speed}s / -2); }
.${cls}__scan { position:absolute; inset:-2px 0 auto; height:2px; background:${config.color}; box-shadow:0 0 ${config.glow}px ${config.color}; animation:${keyframes}Scan ${config.scanSpeed}s linear infinite; }
.${cls}__sweep { position:absolute; inset:0 auto 0 -46%; width:36%; background:linear-gradient(90deg,transparent,${config.color},transparent); transform:skewX(-12deg); opacity:.86; animation:${keyframes}Sweep ${speed}s linear infinite; }
@keyframes ${keyframes} { ${frames(template, config)} }
@keyframes ${keyframes}Core {
  0%, 100% { opacity:.82; transform:scale(.82); }
  50% { opacity:1; transform:scale(1.08); }
}
@keyframes ${keyframes}Ripple {
  0% { opacity:.92; transform:scale(.24); }
  72% { opacity:.28; }
  100% { opacity:0; transform:scale(1.9); }
}
@keyframes ${keyframes}Scan {
  0% { transform:translateY(0); opacity:0; }
  12%, 88% { opacity:1; }
  100% { transform:translateY(152px); opacity:0; }
}
@keyframes ${keyframes}Sweep {
  from { transform:translateX(0) skewX(-12deg); }
  to { transform:translateX(410%) skewX(-12deg); }
}`;
}

export function generateBasicMotionHtmlCss(template: BasicMotionTemplate, config: BasicMotionConfig, asset?: SvgPreviewAsset): string {
  return `${generateBasicMotionMarkup(template, asset)}\n\n<style>\n${generateBasicMotionCss(template, config)}\n</style>`;
}

export function generateBasicMotionVue(template: BasicMotionTemplate, config: BasicMotionConfig, asset?: SvgPreviewAsset): string {
  return `<template>\n  ${generateBasicMotionMarkup(template, asset)}\n</template>\n\n<style scoped>\n${generateBasicMotionCss(template, config)}\n</style>`;
}

export function generateBasicMotionJson(template: BasicMotionTemplate, config: BasicMotionConfig, asset?: SvgPreviewAsset): string {
  return JSON.stringify({ id: template.id, name: template.name, category: template.category, config, svgAsset: asset }, null, 2);
}
