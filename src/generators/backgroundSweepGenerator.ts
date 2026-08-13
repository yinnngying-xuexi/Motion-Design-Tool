import type { DecorationParticleConfig } from "@/types/decoration";
import type { SvgFlowConfig, SvgFlowSource } from "@/types/svgFlow";
import { generateDecorationParticleMarkup } from "@/generators/decorationParticleGenerator";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namespaceSvgContent(content: string, prefix: string): string {
  const ids = new Map<string, string>();
  let index = 0;
  content.replace(/\bid=(['"])(.*?)\1/g, (_match, _quote, id: string) => {
    if (!ids.has(id)) ids.set(id, `${prefix}-${++index}`);
    return _match;
  });
  let next = content;
  ids.forEach((replacement, original) => {
    const escaped = escapeRegExp(original);
    next = next
      .replace(new RegExp(`id=(['"])${escaped}\\1`, "g"), `id="${replacement}"`)
      .replace(new RegExp(`url\\(\\s*#${escaped}\\s*\\)`, "g"), `url(#${replacement})`)
      .replace(new RegExp(`(href|xlink:href)=(['"])#${escaped}\\2`, "g"), `$1="#${replacement}"`);
  });
  return next;
}

function isolateBackgroundContent(source: SvgFlowSource): string {
  const content = source.content ?? source.shape;
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") return content;
  try {
    const document = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`, "image/svg+xml");
    const background = [...document.querySelectorAll<SVGElement>("[id],[data-name]")].find((element) => {
      const name = element.getAttribute("id") ?? element.getAttribute("data-name") ?? "";
      return name.trim().toLowerCase() === "background";
    });
    if (!background) return content;
    const serializer = new XMLSerializer();
    const definitions = [...document.querySelectorAll("defs")]
      .filter((defs) => !background.contains(defs))
      .map((defs) => serializer.serializeToString(defs))
      .join("");
    return `${serializer.serializeToString(background)}${definitions}`;
  } catch {
    return content;
  }
}

type Point = readonly [number, number];

interface RibbonOptions {
  amplitude: number;
  thickness: number;
  phaseOffset: number;
  frequency: number;
  drift: number;
  focusPosition: number;
  leftEndWidth: number;
  rightEndWidth: number;
}

function smoothstep(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function widthEnvelope(progress: number, options: RibbonOptions): number {
  const focus = Math.max(0, Math.min(1, options.focusPosition));
  const leftWidth = Math.max(0.05, Math.min(1, options.leftEndWidth));
  const rightWidth = Math.max(0.05, Math.min(1, options.rightEndWidth));
  if (focus <= 0.001) return 1 + (rightWidth - 1) * smoothstep(progress);
  if (focus >= 0.999) return leftWidth + (1 - leftWidth) * smoothstep(progress);
  if (progress <= focus) return leftWidth + (1 - leftWidth) * smoothstep(progress / focus);
  return 1 + (rightWidth - 1) * smoothstep((progress - focus) / (1 - focus));
}

function curvedPath(points: ReadonlyArray<Point>, close = false): string {
  if (points.length < 2) return "";
  const commands = points.slice(0, -1).map((point, index) => {
    const previous = points[Math.max(0, index - 1)];
    const next = points[index + 1];
    const afterNext = points[Math.min(points.length - 1, index + 2)];
    return `C${(point[0] + (next[0] - previous[0]) / 6).toFixed(2)} ${(point[1] + (next[1] - previous[1]) / 6).toFixed(2)} ${(next[0] - (afterNext[0] - point[0]) / 6).toFixed(2)} ${(next[1] - (afterNext[1] - point[1]) / 6).toFixed(2)} ${next[0].toFixed(2)} ${next[1].toFixed(2)}`;
  });
  return `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)} ${commands.join(" ")}${close ? " Z" : ""}`;
}

function ribbonPoints(x: number, width: number, center: number, phase: number, options: RibbonOptions) {
  const upper: Point[] = [];
  const lower: Point[] = [];
  const sampleCount = 16;
  for (let index = 0; index <= sampleCount; index += 1) {
    const progress = index / sampleCount;
    const thicknessEnvelope = widthEnvelope(progress, options);
    const motionEnvelope = 0.22 + thicknessEnvelope * 0.78;
    const primary = Math.sin(Math.PI * 2 * (progress * options.frequency + phase + options.phaseOffset));
    const secondary = Math.sin(Math.PI * 2 * (progress * options.frequency * 0.52 - phase * 0.68 + options.phaseOffset * 0.4));
    const edgeMotion = 0.18 + Math.pow(Math.sin(Math.PI * progress), 0.72) * 0.82;
    const centerOffset = options.amplitude * motionEnvelope * edgeMotion * (primary * 0.7 + secondary * 0.42) + options.drift * motionEnvelope * edgeMotion;
    const thicknessWave = 1 + 0.32 * Math.sin(Math.PI * 2 * (progress * 1.35 - phase * 0.62 + options.phaseOffset)) * Math.pow(Math.sin(Math.PI * progress), 0.72);
    const halfThickness = options.thickness * thicknessEnvelope * thicknessWave * 0.5;
    const horizontal = x + progress * width;
    upper.push([horizontal, center + centerOffset - halfThickness]);
    lower.push([horizontal, center + centerOffset + halfThickness]);
  }
  return { upper, lower };
}

function ribbonPath(x: number, width: number, center: number, phase: number, options: RibbonOptions): string {
  const { upper, lower } = ribbonPoints(x, width, center, phase, options);
  return curvedPath([...upper, ...lower.reverse(), upper[0]], true);
}

function edgePath(x: number, width: number, center: number, phase: number, options: RibbonOptions): string {
  return curvedPath(ribbonPoints(x, width, center, phase, options).upper);
}

function morphValues(builder: (phase: number) => string): string {
  return Array.from({ length: 9 }, (_, index) => builder(index / 8)).join(";");
}

function morphAnimation(values: string, duration: number, begin = 0): string {
  return `<animate attributeName="d" values="${values}" keyTimes="0;0.125;0.25;0.375;0.5;0.625;0.75;0.875;1" calcMode="spline" keySplines="${Array.from({ length: 8 }, () => "0.42 0 0.58 1").join(";")}" dur="${duration.toFixed(2)}s" begin="${begin.toFixed(2)}s" repeatCount="indefinite"></animate>`;
}

export function generateBackgroundSweepCss(className: string): string {
  return `.${className} { position:relative; isolation:isolate; opacity:1; }
.${className}__svg { display:block; width:100%; height:auto; overflow:hidden; }
.${className}__water { mix-blend-mode:screen; pointer-events:none; }
.${className}__water-texture { mix-blend-mode:screen; }`;
}

export function generateBackgroundSweepMarkup(
  className: string,
  config: SvgFlowConfig,
  source: SvgFlowSource,
  instanceId: string,
  lightIntensity = 72,
  flowAmplitude = 4.5,
  flowFocusPosition = 14,
  flowLeftEndWidth = 85,
  flowRightEndWidth = 25,
  particleEffect?: DecorationParticleConfig
): string {
  const [x = 0, y = 0, width = 1000, height = 180] = source.viewBox.split(/[\s,]+/).map(Number);
  const sourceWidth = Number(source.width || width || 1000);
  const sourceHeight = Number(source.height || height || 180);
  const prefix = `${className}-${instanceId}`;
  const background = namespaceSvgContent(isolateBackgroundContent(source), `${prefix}-source`);
  const duration = Math.max(2.4, Number(config.duration) || 4.8);
  const intensity = Math.max(0, Math.min(1, lightIntensity / 100));
  const amplitude = Math.max(height * 0.075, Math.min(height * 0.23, height * 0.075 + flowAmplitude * 0.72));
  const startX = x + Math.max(48, width * 0.025);
  const endInset = Math.max(64, width * 0.035);
  const flowWidth = Math.max(100, width - (startX - x) - endInset);
  const center = y + height * 0.52;
  const shape = {
    focusPosition: Math.max(0, Math.min(100, flowFocusPosition)) / 100,
    leftEndWidth: Math.max(5, Math.min(100, flowLeftEndWidth)) / 100,
    rightEndWidth: Math.max(5, Math.min(100, flowRightEndWidth)) / 100
  };
  const rear: RibbonOptions = { ...shape, amplitude: amplitude * 0.92, thickness: height * 0.58, phaseOffset: 0.13, frequency: 1.55, drift: -height * 0.025 };
  const body: RibbonOptions = { ...shape, amplitude: amplitude * 1.18, thickness: height * 0.46, phaseOffset: 0, frequency: 1.28, drift: height * 0.02 };
  const front: RibbonOptions = { ...shape, amplitude, thickness: height * 0.3, phaseOffset: 0.34, frequency: 1.72, drift: -height * 0.012 };
  const clipId = `${prefix}-clip`;
  const rearGradientId = `${prefix}-rear`;
  const bodyGradientId = `${prefix}-body`;
  const frontGradientId = `${prefix}-front`;
  const highlightGradientId = `${prefix}-highlight`;
  const meshPatternId = `${prefix}-mesh`;
  const softGlowId = `${prefix}-soft-glow`;
  const fluidBlurId = `${prefix}-fluid-blur`;
  const edgeGlowId = `${prefix}-edge-glow`;
  const rearValues = morphValues((phase) => ribbonPath(startX, flowWidth, center, phase, rear));
  const bodyValues = morphValues((phase) => ribbonPath(startX, flowWidth, center, phase, body));
  const frontValues = morphValues((phase) => ribbonPath(startX, flowWidth, center, phase, front));
  const bodyEdgeValues = morphValues((phase) => edgePath(startX, flowWidth, center, phase, body));
  const frontEdgeValues = morphValues((phase) => edgePath(startX, flowWidth, center, phase, front));
  const bodyInitial = ribbonPath(startX, flowWidth, center, 0, body);
  const visualFocus = Math.max(6, Math.min(94, shape.focusPosition * 100));
  const focusLead = Math.max(2, visualFocus - 9);
  const focusAfter = Math.min(98, visualFocus + 14);
  const focusFade = Math.min(99, visualFocus + 40);

  const definitions = `<defs>
    <clipPath id="${clipId}"><rect x="${startX}" y="${y + 1}" width="${flowWidth}" height="${Math.max(1, height - 2)}" rx="1"></rect></clipPath>
    <linearGradient id="${rearGradientId}" x1="${startX}" y1="0" x2="${startX + flowWidth}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#06184E" stop-opacity=".12"></stop><stop offset="${focusLead}%" stop-color="#0A3EBD" stop-opacity=".46"></stop><stop offset="${visualFocus}%" stop-color="#087DE8" stop-opacity=".58"></stop><stop offset="${focusAfter}%" stop-color="#00A7B6" stop-opacity=".48"></stop><stop offset="${focusFade}%" stop-color="#0A56D4" stop-opacity=".26"></stop><stop offset="1" stop-color="#07143F" stop-opacity=".06"></stop></linearGradient>
    <linearGradient id="${bodyGradientId}" x1="${startX}" y1="0" x2="${startX + flowWidth}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#061A56" stop-opacity=".14"></stop><stop offset="${focusLead}%" stop-color="#0648C8" stop-opacity=".62"></stop><stop offset="${visualFocus}%" stop-color="#40F3F3" stop-opacity=".88"></stop><stop offset="${focusAfter}%" stop-color="#00B9C7" stop-opacity=".72"></stop><stop offset="${focusFade}%" stop-color="#075FCF" stop-opacity=".3"></stop><stop offset="1" stop-color="#07143F" stop-opacity=".07"></stop><animateTransform attributeName="gradientTransform" type="translate" values="${(-flowWidth * 0.045).toFixed(2)} 0;${(flowWidth * 0.045).toFixed(2)} 0;${(-flowWidth * 0.045).toFixed(2)} 0" dur="${(duration * 1.35).toFixed(2)}s" repeatCount="indefinite"></animateTransform></linearGradient>
    <linearGradient id="${frontGradientId}" x1="${startX}" y1="0" x2="${startX + flowWidth}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#07235F" stop-opacity=".1"></stop><stop offset="${focusLead}%" stop-color="#116BFF" stop-opacity=".5"></stop><stop offset="${visualFocus}%" stop-color="#72FFFF" stop-opacity=".9"></stop><stop offset="${focusAfter}%" stop-color="#00BFD6" stop-opacity=".68"></stop><stop offset="${focusFade}%" stop-color="#148BFF" stop-opacity=".28"></stop><stop offset="1" stop-color="#06153F" stop-opacity=".05"></stop></linearGradient>
    <linearGradient id="${highlightGradientId}" x1="${startX}" y1="0" x2="${startX + flowWidth}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#0A58E8" stop-opacity=".04"></stop><stop offset="${focusLead}%" stop-color="#177DFF" stop-opacity=".54"></stop><stop offset="${visualFocus}%" stop-color="#72FFFF" stop-opacity=".92"></stop><stop offset="${focusAfter}%" stop-color="#00D0E1" stop-opacity=".58"></stop><stop offset="${focusFade}%" stop-color="#1F79FF" stop-opacity=".2"></stop><stop offset="1" stop-color="#0B2B75" stop-opacity="0"></stop></linearGradient>
    <pattern id="${meshPatternId}" width="5" height="3.5" patternUnits="userSpaceOnUse"><circle cx=".8" cy=".8" r=".48" fill="#80F6FF" fill-opacity=".52"></circle><circle cx="3.4" cy="2.45" r=".34" fill="#2AA7FF" fill-opacity=".42"></circle></pattern>
    <filter id="${softGlowId}" x="-4%" y="-160%" width="108%" height="420%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${Math.max(2.2, height * 0.06).toFixed(2)}"></feGaussianBlur></filter>
    <filter id="${fluidBlurId}" x="-3%" y="-90%" width="106%" height="280%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${Math.max(1.4, height * 0.032).toFixed(2)}"></feGaussianBlur></filter>
    <filter id="${edgeGlowId}" x="-3%" y="-110%" width="106%" height="320%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${Math.max(1.8, height * 0.038).toFixed(2)}"></feGaussianBlur></filter>
  </defs>`;

  const water = `<g class="${className}__water" clip-path="url(#${clipId})">
    <path d="${ribbonPath(startX, flowWidth, center, 0, rear)}" fill="url(#${rearGradientId})" opacity="${(intensity * 0.42).toFixed(3)}" filter="url(#${softGlowId})">${morphAnimation(rearValues, duration * 1.27, -duration * 0.31)}</path>
    <path d="${bodyInitial}" fill="url(#${bodyGradientId})" opacity="${(intensity * 0.56).toFixed(3)}" filter="url(#${fluidBlurId})">${morphAnimation(bodyValues, duration)}</path>
    <path d="${ribbonPath(startX, flowWidth, center, 0, front)}" fill="url(#${frontGradientId})" opacity="${(intensity * 0.44).toFixed(3)}" filter="url(#${fluidBlurId})">${morphAnimation(frontValues, duration * 0.86, -duration * 0.18)}</path>
    <path class="${className}__water-texture" d="${bodyInitial}" fill="url(#${meshPatternId})" opacity="${(intensity * 0.1).toFixed(3)}">${morphAnimation(bodyValues, duration)}</path>
    <path d="${edgePath(startX, flowWidth, center, 0, body)}" fill="none" stroke="url(#${highlightGradientId})" stroke-width="${Math.max(1.2, height * 0.018).toFixed(2)}" stroke-linecap="round" opacity="${(intensity * 0.5).toFixed(3)}" filter="url(#${edgeGlowId})">${morphAnimation(bodyEdgeValues, duration)}</path>
    <path d="${edgePath(startX, flowWidth, center, 0, front)}" fill="none" stroke="url(#${highlightGradientId})" stroke-width="${Math.max(0.7, height * 0.01).toFixed(2)}" stroke-linecap="round" opacity="${(intensity * 0.38).toFixed(3)}" filter="url(#${fluidBlurId})">${morphAnimation(frontEdgeValues, duration * 0.86, -duration * 0.18)}</path>
  </g>`;

  return `<div class="${className}" style="width:${sourceWidth}px;aspect-ratio:${sourceWidth}/${sourceHeight}" aria-label="${source.fileName}">
  <svg class="${className}__svg" viewBox="${source.viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${background}
    ${definitions}
    ${water}
  </svg>
  ${generateDecorationParticleMarkup(particleEffect, config.headColor)}
</div>`;
}
