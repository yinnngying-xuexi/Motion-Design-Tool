import { basicMotions, createBasicMotionConfig } from "@/data/basicMotions";
import { generateBasicMotionFrames } from "@/generators/basicMotionGenerator";
import { borderFlowTrailSegments } from "@/utils/borderFlowTrail";
import { isWebglLight } from "@/utils/lightWebgl";
import { lightDecorations } from "@/data/lightDecorations";

type Params = Record<string, string | number>;
const sizes: Record<string, [number, number]> = {
  "light-particle-band": [420, 60], "light-electric-beam": [600, 200],
  "light-plasma-ring": [280, 280], "light-comet-ring": [280, 280],
  "light-silk-wave": [600, 160], "light-flare-base": [360, 190]
};
export function lightDecorationSize(id: string): { width: number; height: number } {
  const [width, height] = sizes[id] ?? [320, 160];
  return { width, height };
}
const number = (value: unknown, fallback: number, min: number, max: number): number => {
  const next = Number(value ?? fallback);
  return Math.max(min, Math.min(max, Number.isFinite(next) ? next : fallback));
};
const fixed = (value: number): string => value.toFixed(2);

function frames(id: string, overrides = {}): string {
  const template = basicMotions.find((motion) => motion.id === id)!;
  return generateBasicMotionFrames(template, { ...createBasicMotionConfig(template), ...overrides });
}

export function generateLightDecorationCss(cls: string, id: string): string {
  const uses = id === "light-comet-ring" ? ["rotate", "breathe"] : id === "light-flare-base" ? ["breathe", "float"] : [];
  const rules: Record<string, () => string> = {
    rotate: () => `.${cls} .dm-light__rotate{transform-box:view-box;transform-origin:center;animation:dm-light-rotate var(--light-duration) linear infinite;animation-direction:var(--light-direction);}@keyframes dm-light-rotate{${frames("slow-rotate")}}`,
    breathe: () => `.${cls} .dm-light__breathe{transform-box:fill-box;transform-origin:center;animation:dm-light-breathe var(--light-duration) ease-in-out var(--light-delay,0s) infinite;}@keyframes dm-light-breathe{${frames("breath", { minScale: .86 })}}`,
    float: () => `.${cls} .dm-light__float{animation:dm-light-float var(--light-duration) ease-in-out var(--light-delay,0s) infinite;}@keyframes dm-light-float{${frames("float", { offsetY: 6 })}}`
  };
  return `.${cls}{position:relative;width:var(--light-width);height:var(--light-height);color:var(--light-color);opacity:var(--light-intensity);isolation:isolate;pointer-events:none;background:transparent;}
.${cls}>svg{display:block;width:100%;height:100%;overflow:visible;}
${isWebglLight(id) ? `.${cls}{min-width:0;min-height:0;} .${cls}>dm-light-renderer,.${cls}>dm-light-renderer>canvas{display:block;width:100%;height:100%;min-width:0;min-height:0;background:transparent;} .${cls} .dm-light-error{display:none;} .${cls} dm-light-renderer[data-ready="false"] .dm-light-error{display:block;position:absolute;inset:0;align-content:center;text-align:center;color:#9aa2ad;font:12px/1.6 Arial,sans-serif;}` : ""}
${uses.map((key) => rules[key]()).join("\n")}
.${cls}[data-motion="off"] *{animation:none!important;}
@media(prefers-reduced-motion:reduce){.${cls} *{animation:none!important;}}`;
}

export function generateLightDecorationMarkup(id: string, cls: string, params: Params, instanceId = "main", extraMarkup = ""): string {
  const defaults = lightDecorations.find((effect) => effect.id === id)?.defaultParams ?? {};
  params = { ...defaults, ...params };
  const { width, height } = lightDecorationSize(id);
  const prefix = `${id}-${instanceId}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  const rawColor = String(params.color ?? "#0070F3");
  const color = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(rawColor) ? rawColor : "#0070F3";
  const duration = id === "light-electric-beam" ? 4.96 : number(params.duration, 3, .5, 12);
  const moving = params.motionEnabled !== "off";
  const intensity = id === "light-electric-beam" ? 1 : number(params.lightIntensity, 75, 0, 100) / 100;
  const shapeAttribute = id === "light-silk-wave" ? ` data-curvature="${number(params.curvature, Number(defaults.curvature), 0, 100) / 100}" data-wave-count="${Math.round(number(params.waveCount, Number(defaults.waveCount), 1, 4))}"` : "";
  const style = `--light-width:${width}px;--light-height:${height}px;--light-color:${color};--light-intensity:${intensity};--light-duration:${duration}s;--light-direction:${params.direction === 'counterclockwise' ? 'reverse' : 'normal'}`;
  if (isWebglLight(id)) return `<div class="${cls} dm-light-decoration" data-light-id="${id}" data-motion="${moving ? 'on' : 'off'}" style="${style}" aria-hidden="true"><dm-light-renderer data-effect="${id}" data-color="${color}" data-duration="${duration}" data-direction="${params.direction === 'counterclockwise' ? 'counterclockwise' : 'clockwise'}" data-motion="${moving ? 'on' : 'off'}" data-intensity="${intensity}" data-width="${width}" data-height="${height}"${shapeAttribute}><span class="dm-light-error">此光效需要 WebGL，请开启浏览器硬件加速</span></dm-light-renderer>${extraMarkup}</div>`;
  const blur = (name: string, deviation: number): string => `<filter id="${prefix}-${name}" x="-70%" y="-100%" width="240%" height="300%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${deviation}"></feGaussianBlur></filter>`;
  let defs = `${blur('soft', 4)}${blur('halo', 12)}<linearGradient id="${prefix}-line"><stop stop-color="currentColor" stop-opacity="0"></stop><stop offset=".3" stop-color="currentColor" stop-opacity=".65"></stop><stop offset=".7" stop-color="currentColor"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0"></stop></linearGradient>`;
  let visual = "";
  if (id === "light-comet-ring") {
    const widthScale = number(params.lineWidth, Number(defaults.lineWidth ?? 3.3), .5, 12) / 3.3;
    const trail = (halo: boolean) => borderFlowTrailSegments.map((segment, index) => {
      const progress = index / (borderFlowTrailSegments.length - 1);
      return `<circle cx="140" cy="140" r="94" pathLength="100" fill="none" stroke="${halo ? 'currentColor' : 'color-mix(in srgb,currentColor 40%,white)'}" stroke-dasharray="3.5 96.5" stroke-dashoffset="${fixed(progress * 70)}" stroke-linecap="round" stroke-width="${fixed(halo ? 14 * Math.sqrt(widthScale) : segment.widthFactor * .95 * widthScale)}" opacity="${fixed(segment.opacity * (halo ? .8 : 1))}"></circle>`;
    }).join("");
    const grain = Array.from({ length: 120 }, (_, index) => {
      const angle = index * 2.39996, r = 35 + index % 25 * 3;
      return `<circle cx="${fixed(140 + Math.cos(angle) * r)}" cy="${fixed(140 + Math.sin(angle) * r)}" r=".45" fill="currentColor" opacity="${index % 4 ? .1 : .22}"></circle>`;
    }).join("");
    visual = `<circle cx="140" cy="140" r="94" fill="none" stroke="currentColor" stroke-width="${fixed(.7 * widthScale)}" opacity=".32"></circle><g class="dm-light__breathe">${grain}</g><g class="dm-light__rotate"><g filter="url(#${prefix}-soft)">${trail(true)}</g>${trail(false)}<circle cx="234" cy="140" r="${fixed(1.7 * widthScale)}" fill="color-mix(in srgb,currentColor 35%,white)"></circle></g>`;
  } else if (id === "light-flare-base") {
    defs += `<linearGradient id="${prefix}-ray" x1="0" y1="1" x2="0" y2="0"><stop stop-color="currentColor" stop-opacity=".9"></stop><stop offset=".5" stop-color="currentColor" stop-opacity=".32"></stop><stop offset="1" stop-color="currentColor" stop-opacity="0"></stop></linearGradient><radialGradient id="${prefix}-floor"><stop stop-color="currentColor" stop-opacity=".02"></stop><stop offset=".72" stop-color="currentColor" stop-opacity=".13"></stop><stop offset="1" stop-color="currentColor" stop-opacity=".65"></stop></radialGradient>`;
    const rays = Array.from({ length: 20 }, (_, index) => {
      const angle = Math.PI + index / 19 * Math.PI;
      const x = 180 + Math.cos(angle) * 117, y = 138 + Math.sin(angle) * 23;
      const height = 20 + (index * 17 % 35), outward = (x - 180) * .25;
      return `<path class="dm-light__float" style="--light-delay:${fixed(-index * .23)}s" d="M${fixed(x - 4)} ${fixed(y)}Q${fixed(x + outward)} ${fixed(y - height * .55)} ${fixed(x + outward * 2 - 10)} ${fixed(y - height)}Q${fixed(x + outward + 14)} ${fixed(y - height * .45)} ${fixed(x + 6)} ${fixed(y)}Z" fill="url(#${prefix}-ray)" opacity="${.3 + index % 4 * .12}"></path>`;
    }).join("");
    visual = `<g filter="url(#${prefix}-soft)">${rays}</g><ellipse cx="180" cy="138" rx="117" ry="25" fill="url(#${prefix}-floor)"></ellipse><ellipse cx="180" cy="138" rx="117" ry="25" fill="none" stroke="currentColor" stroke-width="1.3"></ellipse><ellipse cx="180" cy="138" rx="78" ry="17" fill="none" stroke="currentColor" stroke-width="1" opacity=".8"></ellipse><ellipse cx="180" cy="138" rx="78" ry="17" fill="none" stroke="currentColor" stroke-width="7" opacity=".5" filter="url(#${prefix}-soft)"></ellipse><g class="dm-light__breathe"><ellipse cx="180" cy="138" rx="142" ry="32" fill="none" stroke="currentColor" stroke-width=".6" opacity=".28"></ellipse></g><g class="dm-light__breathe" style="--light-delay:${fixed(-duration / 2)}s"><ellipse cx="180" cy="138" rx="157" ry="36" fill="none" stroke="currentColor" stroke-width=".5" opacity=".16"></ellipse></g>`;
  }
  return `<div class="${cls} dm-light-decoration" data-light-id="${id}" data-motion="${moving ? 'on' : 'off'}" style="${style}" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><defs>${defs}</defs>${visual}</svg>${extraMarkup}</div>`;
}
