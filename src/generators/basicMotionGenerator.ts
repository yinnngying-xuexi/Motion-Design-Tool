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
    : `<p>数据态势</p><strong>87.62</strong><small>${template.category}</small>`;
  const ripple = template.previewType === "ripple" ? `<span class="${cls}__ripple"></span>` : "";
  const scan = template.previewType === "scan" ? `<span class="${cls}__scan"></span>` : "";
  return `<div class="${cls}">${ripple}${scan}${content}</div>`;
}

export function generateBasicMotionCss(template: BasicMotionTemplate, config: BasicMotionConfig): string {
  const { cls, keyframes } = names(template);
  const speed = template.previewType === "blink" ? 1 / config.blinkFrequency : config.duration / config.loopSpeed;
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
  border: ${config.borderWidth}px solid ${config.color};
  background: #0A0A0A;
  box-shadow: 0 0 ${config.shadow}px rgba(0,0,0,.8), 0 0 ${config.glow}px ${config.color};
  transform: translate(${config.translateX}px, ${config.translateY}px) scale(${config.scale}) rotate(${config.rotate}deg);
  filter: blur(${config.blur}px);
  animation: ${keyframes} ${speed}s ${config.timingFunction} ${config.delay}s ${config.iteration} ${config.direction};
}
.${cls} p, .${cls} small { margin: 0; color: #8F8F8F; }
.${cls} strong { font-size: 38px; }
.${cls}__svg, .${cls}__svg svg { width: min(78%, 180px); height: min(78%, 110px); display: block; overflow: visible; }
.${cls}__svg svg { width: 100%; height: 100%; }
.${cls}__ripple { position:absolute; width:${config.rippleRadius}px; height:${config.rippleRadius}px; border:${Math.max(1, config.borderWidth)}px solid ${config.color}; border-radius:50%; animation:${keyframes} ${speed}s linear infinite; }
.${cls}__scan { position:absolute; inset:0; height:2px; background:${config.color}; box-shadow:0 0 ${config.glow}px ${config.color}; animation:${keyframes} ${config.scanSpeed}s linear infinite; }
@keyframes ${keyframes} { ${frames(template, config)} }`;
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
