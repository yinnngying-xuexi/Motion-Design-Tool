import type { StarRingDecorationConfig } from "@/types/decoration";
import { generateStarRingCss, generateStarRingMarkup } from "@/generators/starRingGenerator";

export interface SubtitleSweepParams {
  duration: number;
  pause: number;
  easing: string;
  sourceVisibility: "show" | "flow-only";
  sweepShape: "arc" | "oval" | "soft-band" | "slanted-rect" | "rect";
  sweepStartColor?: string;
  sweepEndColor?: string;
  sweepWidth: number;
  sweepBlur: number;
  sweepIntensity: number;
  sweepColor?: string;
  sweepAngle?: number;
}

export type SubtitleSweepVariant = "sweep" | "light-arc";

function sweepClassName(variant: SubtitleSweepVariant): string {
  return variant === "light-arc" ? "dm-subtitle-light-arc" : "dm-subtitle-sweep";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeEasing(value: string): string {
  return ["linear", "ease-in", "ease-out", "ease-in-out"].includes(value) ? value : "ease-out";
}

function sweepShapeCss(shape: SubtitleSweepParams["sweepShape"], angle: number): string {
  if (shape === "rect") return `top:-20%;height:140%;transform:skewX(${-angle}deg);border-radius:0;`;
  if (shape === "slanted-rect") return "top:-45%;height:190%;transform:skewX(-22deg);border-radius:2px;mask-image:linear-gradient(180deg,transparent,#000 26%,#000 74%,transparent);";
  if (shape === "oval") return "top:4%;height:92%;border-radius:50%;mask-image:radial-gradient(ellipse, #000 12%,rgba(0,0,0,.75) 42%,transparent 74%);";
  if (shape === "soft-band") return "top:24%;height:52%;border-radius:50%;mask-image:linear-gradient(180deg,transparent,#000 45%,#000 55%,transparent);";
  return "bottom:-26%;height:116%;border-radius:50% 50% 12% 12% / 100% 100% 18% 18%;mask-image:radial-gradient(ellipse at 50% 100%,transparent 28%,rgba(0,0,0,.8) 48%,#000 60%,transparent 85%);";
}

export function generateSubtitleSweepMarkup(config: StarRingDecorationConfig, params: SubtitleSweepParams, variant: SubtitleSweepVariant = "sweep", instanceId = "main"): string {
  const className = sweepClassName(variant);
  const showSource = params.sourceVisibility !== "flow-only";
  return `<div class="${className}">
  ${showSource ? `<div class="${className}__material">${generateStarRingMarkup(config, `${className}-${instanceId}`)}</div>` : ""}
  <div class="${className}__light" aria-hidden="true"></div>
</div>`;
}

export function generateSubtitleSweepCss(config: StarRingDecorationConfig, params: SubtitleSweepParams, variant: SubtitleSweepVariant = "sweep"): string {
  const className = sweepClassName(variant);
  const width = Math.max(1, config.svg?.width ?? 410);
  const height = Math.max(1, config.svg?.height ?? 40);
  const duration = Math.max(0.1, Number(params.duration));
  const pause = Math.max(0, Number(params.pause));
  const total = duration + pause;
  const activeEnd = clamp(duration / Math.max(total, 0.1) * 100, 1, 100);
  const lightWidth = clamp(Number(params.sweepWidth), 20, Math.max(20, width * 0.45));
  const blur = clamp(Number(params.sweepBlur), 0, 16);
  const edgeBlur = Math.min(blur * 0.32, height * 0.1);
  const haloBlur = Math.min(blur * 0.75, height * 0.25);
  const intensity = clamp(Number(params.sweepIntensity), 0, 100) / 100;
  const startColor = params.sweepStartColor || params.sweepColor || "#4DC9FF";
  const endColor = params.sweepEndColor || params.sweepColor || "#0070F3";
  const shape = variant === "light-arc" ? "rect" : ["arc", "oval", "soft-band", "slanted-rect"].includes(params.sweepShape) ? params.sweepShape : "oval";
  const angle = clamp(Number(params.sweepAngle ?? 32), -60, 60);
  const tiltedExtent = variant === "light-arc" ? Math.tan(Math.abs(angle) * Math.PI / 180) * height * 0.7 : 0;
  const overscan = Math.max(haloBlur * 3 + tiltedExtent, height * 0.45, 8);
  const travel = width + lightWidth + overscan * 2;
  const peakOpacity = intensity * 0.9;
  const colorProfile = variant === "light-arc" ? params.sweepColor || startColor : `linear-gradient(90deg,transparent 0%,color-mix(in srgb,${endColor} 16%,transparent) 16%,color-mix(in srgb,${startColor} 72%,transparent) 42%,${startColor} 52%,color-mix(in srgb,${endColor} 55%,transparent) 68%,transparent 100%)`;
  const pauseFrame = pause > 0 ? `100%{transform:translateX(${travel}px)}` : "";
  const fadePauseFrame = pause > 0 ? "100%{opacity:0}" : "";
  const sourceCss = params.sourceVisibility === "flow-only" ? "" : generateStarRingCss(config);
  return `${sourceCss}
.${className}{position:relative;width:${width}px;height:${height}px;overflow:hidden;isolation:isolate;}
.${className}__material{position:absolute;inset:0;z-index:1;}
.${className}__light{position:absolute;z-index:2;top:0;left:${-lightWidth - overscan}px;width:${lightWidth}px;height:100%;pointer-events:none;opacity:0;transform:translateX(0);mix-blend-mode:${variant === "light-arc" ? "normal" : "screen"};animation:${className}-move ${total}s ${safeEasing(params.easing)} infinite,${className}-fade ${total}s linear infinite;}
.${className}__light::before,.${className}__light::after{content:"";position:absolute;left:0;width:100%;${sweepShapeCss(shape, angle)}background:${colorProfile};}
.${className}__light::before{filter:blur(${edgeBlur.toFixed(2)}px);}
.${className}__light::after{opacity:.42;filter:blur(${haloBlur.toFixed(2)}px);}
@keyframes ${className}-move{0%{transform:translateX(0)}${activeEnd.toFixed(4)}%{transform:translateX(${travel}px)}${pauseFrame}}
@keyframes ${className}-fade{0%{opacity:0}${(activeEnd * 0.12).toFixed(4)}%{opacity:${(peakOpacity * 0.72).toFixed(3)}}${(activeEnd * 0.28).toFixed(4)}%{opacity:${peakOpacity.toFixed(3)}}${(activeEnd * 0.72).toFixed(4)}%{opacity:${(peakOpacity * 0.9).toFixed(3)}}${activeEnd.toFixed(4)}%{opacity:0}${fadePauseFrame}}
@media (prefers-reduced-motion:reduce){.${className}__light{animation:none;display:none;}}`;
}

export function generateSubtitleSweepHtmlCss(config: StarRingDecorationConfig, params: SubtitleSweepParams, variant: SubtitleSweepVariant = "sweep"): string {
  return `${generateSubtitleSweepMarkup(config, params, variant)}

<style>
${generateSubtitleSweepCss(config, params, variant)}
</style>`;
}
