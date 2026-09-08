import type { DecorationParticleConfig } from "@/types/decoration";
import { normalizeDecorationParticleConfig } from "@/utils/decorationParticles";

const CLASS_NAME = "dm-decoration-particles";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function decorationParticleDuration(value: Partial<DecorationParticleConfig> | undefined): number {
  const config = normalizeDecorationParticleConfig(value);
  const base = config.style === "twinkle" ? 2.2 : config.style === "spread" ? 3.6 : 4.4;
  return Number((base / clamp(config.speed, 0.4, 2)).toFixed(2));
}

export function generateDecorationParticleMarkup(value: Partial<DecorationParticleConfig> | undefined, inheritedColor = "#0070F3"): string {
  const config = normalizeDecorationParticleConfig(value, false, inheritedColor);
  if (!config.enabled) return "";
  const count = Math.round(clamp(config.count, 4, 60));
  const color = config.colorMode === "custom" ? config.color : inheritedColor;
  const intensity = clamp(config.intensity, 0, 100) / 100;
  const particles = Array.from({ length: count }, (_, index) => {
    const x = (index * 37 + 15) % 100;
    const y = (index * 53 + 23) % 100;
    const scale = 0.55 + (index % 6) * 0.16;
    const angle = ((index * 137.5) % 360) * Math.PI / 180;
    const distance = 18 + index % 7 * 6;
    const particleSize = clamp(config.size, 1, 6) * scale;
    return `<i style="--p-x:${x}%;--p-y:${y}%;--p-size:${particleSize.toFixed(2)}px;--p-glow:${(particleSize * 2).toFixed(2)}px;--p-glow-wide:${(particleSize * 5).toFixed(2)}px;--p-drift:${index % 2 ? 4 : -4}px;--p-rise:${-(8 + index % 5 * 3)}px;--p-dx:${(Math.cos(angle) * distance).toFixed(2)}px;--p-dy:${(Math.sin(angle) * distance).toFixed(2)}px;--p-delay:${(-index * 0.37).toFixed(2)}s"></i>`;
  }).join("");
  const variables = `--p-color:${color};--p-opacity:${intensity};--p-opacity-high:${(intensity * 0.82).toFixed(3)};--p-opacity-low:${(intensity * 0.28).toFixed(3)};--p-opacity-end:${(intensity * 0.34).toFixed(3)};--p-opacity-min:${(intensity * 0.18).toFixed(3)};--p-opacity-mid:${(intensity * 0.48).toFixed(3)};--p-duration:${decorationParticleDuration(config)}s;--p-area-width:${clamp(config.areaWidth, 20, 140)}%;--p-area-height:${clamp(config.areaHeight, 20, 140)}%;--p-offset-x:${clamp(config.offsetX, -50, 50)}%;--p-offset-y:${clamp(config.offsetY, -50, 50)}%`;
  return `<div class="${CLASS_NAME} ${CLASS_NAME}--${config.style} ${CLASS_NAME}--${config.layer}" aria-hidden="true" style="${variables}">${particles}</div>`;
}

export function generateDecorationParticleCss(): string {
  return `.${CLASS_NAME}{position:absolute;left:calc(50% + var(--p-offset-x));top:calc(50% + var(--p-offset-y));width:var(--p-area-width);height:var(--p-area-height);transform:translate(-50%,-50%);overflow:visible;pointer-events:none;isolation:isolate}.${CLASS_NAME}--back{z-index:0}.${CLASS_NAME}--front{z-index:8}
.${CLASS_NAME} i{position:absolute;left:var(--p-x);top:var(--p-y);width:var(--p-size);height:var(--p-size);border-radius:50%;background:color-mix(in srgb,var(--p-color) 82%,white);opacity:var(--p-opacity-high);box-shadow:0 0 var(--p-glow) var(--p-color),0 0 var(--p-glow-wide) color-mix(in srgb,var(--p-color) 65%,transparent);will-change:transform,opacity}
.${CLASS_NAME}--float i{animation:dm-particle-float var(--p-duration) ease-in-out var(--p-delay) infinite alternate}.${CLASS_NAME}--twinkle i{animation:dm-particle-twinkle var(--p-duration) ease-in-out var(--p-delay) infinite}.${CLASS_NAME}--spread i{animation:dm-particle-spread var(--p-duration) ease-out var(--p-delay) infinite}
@keyframes dm-particle-float{0%{transform:translate3d(0,4px,0) scale(.65);opacity:var(--p-opacity-low)}48%{opacity:var(--p-opacity)}100%{transform:translate3d(var(--p-drift),var(--p-rise),0) scale(1.18);opacity:var(--p-opacity-end)}}
@keyframes dm-particle-twinkle{0%,100%{transform:scale(.55);opacity:var(--p-opacity-min)}45%{transform:scale(1.18);opacity:var(--p-opacity)}70%{transform:scale(.82);opacity:var(--p-opacity-mid)}}
@keyframes dm-particle-spread{0%{transform:translate3d(0,0,0) scale(.45);opacity:0}18%{opacity:var(--p-opacity)}100%{transform:translate3d(var(--p-dx),var(--p-dy),0) scale(1.12);opacity:0}}
@media (prefers-reduced-motion:reduce){.${CLASS_NAME} i{animation:none!important}}`;
}
