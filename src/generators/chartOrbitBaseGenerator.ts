import { basicMotions, createBasicMotionConfig } from "@/data/basicMotions";
import { generateBasicMotionFrames } from "@/generators/basicMotionGenerator";
import { circularOrbitTrail } from "@/generators/orbitTrail";

type Params = Record<string, string | number>;
const clamp = (value: unknown, fallback: number, min: number, max: number): number => {
  const number = Number(value ?? fallback);
  return Math.min(max, Math.max(min, Number.isFinite(number) ? number : fallback));
};

export function chartOrbitBaseSize(params: Params): { width: number; height: number } {
  const width = clamp(params.size, 320, 120, 1200);
  return { width, height: Math.round(width * clamp(params.perspective, 48, 24, 75) / 100) };
}

export function generateChartOrbitBaseCss(cls: string, params: Params): string {
  const { width, height } = chartOrbitBaseSize(params);
  const perspective = height / width;
  const color = String(params.color ?? "#0070F3");
  const duration = clamp(params.duration, 3.2, .6, 16);
  const trackOpacity = clamp(params.trackOpacity, 28, 0, 100) / 100;
  const surfaceOpacity = clamp(params.surfaceOpacity, 8, 0, 40) / 100;
  const lightIntensity = clamp(params.lightIntensity, 90, 0, 100) / 100;
  const glow = clamp(params.glowIntensity, 58, 0, 100) / 100;
  const template = basicMotions.find((motion) => motion.id === "slow-rotate")!;
  const config = { ...createBasicMotionConfig(template), direction: params.direction === "counterclockwise" ? "reverse" as const : "normal" as const };
  const frames = generateBasicMotionFrames(template, config);
  const animation = params.motionEnabled === "off" ? "none" : `${cls}-orbit ${duration}s linear infinite`;
  return `.${cls}{position:relative;width:${width}px;height:${height}px;isolation:isolate;color:${color};}
.${cls}__plane{position:absolute;left:0;top:50%;width:100%;aspect-ratio:1;transform:translateY(-50%) scaleY(${perspective});transform-origin:center;pointer-events:none;}
.${cls}__svg{display:block;width:100%;height:100%;overflow:visible;}
.${cls}__surface{fill:currentColor;opacity:${surfaceOpacity};}
.${cls}__track{fill:none;stroke:currentColor;stroke-width:.8;opacity:${trackOpacity};}
.${cls}__track--middle{opacity:${(trackOpacity * .32).toFixed(3)};}
.${cls}__rim{fill:none;stroke:currentColor;stroke-width:2;opacity:${(trackOpacity * .5).toFixed(3)};}
.${cls}__orbit{transform-box:view-box;transform-origin:0 0;animation:${animation};}
.${cls}__light{fill:none;stroke:color-mix(in srgb,currentColor 68%,#BDEEFF);stroke-linecap:round;opacity:${lightIntensity};}
.${cls}__light circle:first-child{stroke:color-mix(in srgb,currentColor 55%,#E1FAFF);}
.${cls}__glow{fill:none;stroke:currentColor;stroke-linecap:round;opacity:${(lightIntensity * glow * .46).toFixed(3)};filter:blur(${(1 + glow * 2.8).toFixed(2)}px);}
.${cls}__secondary{opacity:.42;}
@keyframes ${cls}-orbit{${frames}}
@media(prefers-reduced-motion:reduce){.${cls}__orbit{animation:none;}}`;
}

export function generateChartOrbitBaseMarkup(cls: string, params: Params, extraMarkup = ""): string {
  const lineWidth = clamp(params.borderWidth, 8, 1, 12) * 200 / chartOrbitBaseSize(params).width;
  const length = clamp(params.flowLength, 28, 8, 60);
  const trail = (halo: boolean) => circularOrbitTrail(86, lineWidth, length, halo);
  const arcs = `<g class="${cls}__glow">${trail(true)}</g><g class="${cls}__light">${trail(false)}</g>`;
  return `<div class="${cls}" aria-hidden="true">
  <div class="${cls}__plane">
    <svg class="${cls}__svg" viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg">
      <circle class="${cls}__surface" cx="0" cy="4" r="90"></circle>
      <circle class="${cls}__rim" cx="0" cy="4" r="90"></circle>
      <circle class="${cls}__track" cx="0" cy="0" r="94"></circle>
      <circle class="${cls}__track" cx="0" cy="0" r="78"></circle>
      <circle class="${cls}__track ${cls}__track--middle" cx="0" cy="0" r="86"></circle>
      <g class="${cls}__orbit">${arcs}<g class="${cls}__secondary" transform="rotate(180)">${arcs}</g></g>
    </svg>
  </div>
  ${extraMarkup}
</div>`;
}
