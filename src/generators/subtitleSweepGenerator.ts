import type { StarRingDecorationConfig } from "@/types/decoration";
import { generateStarRingCss, generateStarRingMarkup } from "@/generators/starRingGenerator";

export interface SubtitleSweepParams {
  duration: number;
  pause: number;
  easing: string;
  sweepShape: "arc" | "oval" | "soft-band";
  sweepStartColor: string;
  sweepEndColor: string;
  sweepWidth: number;
  sweepBlur: number;
  sweepIntensity: number;
  sweepColor?: string;
}

const CLASS_NAME = "dm-subtitle-sweep";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeEasing(value: string): string {
  return ["linear", "ease-in", "ease-out", "ease-in-out"].includes(value) ? value : "ease-out";
}

function sweepShapeCss(shape: SubtitleSweepParams["sweepShape"]): string {
  if (shape === "oval") return "top:18%;height:64%;border-radius:50%;";
  if (shape === "soft-band") return "top:31%;height:38%;border-radius:999px;";
  return "bottom:-12%;height:82%;border-radius:50% 50% 12% 12% / 100% 100% 18% 18%;";
}

export function generateSubtitleSweepMarkup(config: StarRingDecorationConfig): string {
  return `<div class="${CLASS_NAME}">
  <div class="${CLASS_NAME}__material">${generateStarRingMarkup(config)}</div>
  <div class="${CLASS_NAME}__light" aria-hidden="true"></div>
</div>`;
}

export function generateSubtitleSweepCss(config: StarRingDecorationConfig, params: SubtitleSweepParams): string {
  const width = Math.max(1, config.svg?.width ?? 410);
  const height = Math.max(1, config.svg?.height ?? 40);
  const duration = Math.max(0.1, Number(params.duration));
  const pause = Math.max(0, Number(params.pause));
  const total = duration + pause;
  const activeEnd = clamp(duration / Math.max(total, 0.1) * 100, 1, 100);
  const lightWidth = clamp(Number(params.sweepWidth), 20, Math.max(20, width * 0.45));
  const blur = clamp(Number(params.sweepBlur), 0, 16);
  const intensity = clamp(Number(params.sweepIntensity), 0, 100) / 100;
  const startColor = params.sweepStartColor || params.sweepColor || "#4DC9FF";
  const endColor = params.sweepEndColor || params.sweepColor || "#0070F3";
  const shape = ["arc", "oval", "soft-band"].includes(params.sweepShape) ? params.sweepShape : "arc";
  const travel = width + lightWidth * 1.15;
  return `${generateStarRingCss(config)}
.${CLASS_NAME}{position:relative;width:${width}px;height:${height}px;overflow:hidden;isolation:isolate;}
.${CLASS_NAME}__material{position:absolute;inset:0;z-index:1;}
.${CLASS_NAME}__light{position:absolute;z-index:2;left:${-lightWidth}px;width:${lightWidth}px;pointer-events:none;opacity:0;transform:translateX(0);${sweepShapeCss(shape)}background:linear-gradient(90deg,${startColor} 0%,${endColor} 100%);filter:blur(${blur}px);mix-blend-mode:screen;animation:${CLASS_NAME}-move ${total}s ${safeEasing(params.easing)} infinite;}
.${CLASS_NAME}__light::after{content:"";position:absolute;inset:12% 10%;border-radius:inherit;background:linear-gradient(90deg,${startColor} 0%,${endColor} 100%);opacity:${(0.18 + intensity * 0.42).toFixed(2)};filter:blur(${Math.max(2, blur * 0.72).toFixed(1)}px);}
@keyframes ${CLASS_NAME}-move{0%{transform:translateX(0) scale(.92);opacity:0}8%{opacity:${(0.22 + intensity * 0.56).toFixed(2)}}${Math.max(10, activeEnd - 10).toFixed(2)}%{opacity:${(0.16 + intensity * 0.42).toFixed(2)}}${activeEnd.toFixed(2)}%{transform:translateX(${travel}px) scale(1.04);opacity:0}100%{transform:translateX(${travel}px) scale(1.04);opacity:0}}
@media (prefers-reduced-motion:reduce){.${CLASS_NAME}__light{animation:none;display:none;}}`;
}

export function generateSubtitleSweepHtmlCss(config: StarRingDecorationConfig, params: SubtitleSweepParams): string {
  return `${generateSubtitleSweepMarkup(config)}

<style>
${generateSubtitleSweepCss(config, params)}
</style>`;
}
