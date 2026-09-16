import type { DecorationEffectTemplate, DecorationParticleConfig } from "@/types/decoration";
import type { SvgFlowConfig, SvgFlowSource, SvgPreviewAsset, SvgStyleConfig } from "@/types/svgFlow";
import { generateDecorationParticleCss, generateDecorationParticleMarkup } from "@/generators/decorationParticleGenerator";
import { generateBackgroundSweepCss, generateBackgroundSweepMarkup } from "@/generators/backgroundSweepGenerator";
import { BORDER_FLOW_DASH_GAP, BORDER_FLOW_DASH_LENGTH, borderFlowTrailSegments } from "@/utils/borderFlowTrail";

export type DecorationParams = Record<string, string | number>;

const DECORATION_BLUE = "#0070F3";
const DECORATION_BLUE_LIGHT = "#7AB8FF";
const DECORATION_BLUE_DARK = "#003B82";

function svgFlowConfig(params: DecorationParams): SvgFlowConfig {
  return {
    direction: (param(params, "direction", "ltr") as SvgFlowConfig["direction"]),
    easing: (param(params, "easing", "linear") as SvgFlowConfig["easing"]),
    duration: Number(param(params, "duration", 5)),
    pause: Number(param(params, "pause", 0.8)),
    tail: Number(param(params, "tail", 420)),
    borderWidth: Number(param(params, "borderWidth", 3)),
    glow: Number(param(params, "glow", 14)),
    headColor: String(param(params, "headColor", DECORATION_BLUE_LIGHT)),
    tailColor: String(param(params, "tailColor", DECORATION_BLUE)),
    endColor: String(param(params, "endColor", DECORATION_BLUE_DARK))
  };
}

function svgFlowMetrics(viewBox: string, config: SvgFlowConfig, region?: "left" | "right"): { x: number; y: number; width: number; height: number; axis: "x" | "y"; start: number; finish: number; gradient: string } {
  const [viewX = 0, y = 0, viewWidth = 1000, height = 180] = viewBox.split(/[\s,]+/).map(Number);
  const width = region ? viewWidth / 2 : viewWidth;
  const x = region === "right" ? viewX + viewWidth / 2 : viewX;
  const horizontal = config.direction === "ltr" || config.direction === "rtl";
  const axisLength = horizontal ? width : height;
  const forward = config.direction === "ltr" || config.direction === "ttb";
  const start = forward ? (horizontal ? x : y) - config.tail : (horizontal ? x + width : y + height);
  const finish = forward ? (horizontal ? x + width : y + height) : (horizontal ? x : y) - config.tail;
  const gradient = horizontal
    ? config.direction === "ltr" ? "x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"" : "x1=\"1\" y1=\"0\" x2=\"0\" y2=\"0\""
    : config.direction === "ttb" ? "x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"" : "x1=\"0\" y1=\"1\" x2=\"0\" y2=\"0\"";

  return { x, y, width: Number.isFinite(width) ? width : axisLength, height: Number.isFinite(height) ? height : axisLength, axis: horizontal ? "x" : "y", start, finish, gradient };
}

function defaultSvgFlowSource(): SvgFlowSource {
  return {
    fileName: "默认弧线路径.svg",
    viewBox: "0 0 1000 180",
    width: 1000,
    height: 180,
    shape: '<path d="M0 116 H188 C274 116 298 34 390 34 H654 C746 34 778 146 880 146 H1000"></path>'
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function namespaceSvgContent(content: string, prefix: string): { content: string; ids: Map<string, string> } {
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
  return { content: next, ids };
}

function splitSvgDefinitions(content: string): { visual: string; definitions: string } {
  let definitions = "";
  const visual = content.replace(/<defs\b[^>]*>([\s\S]*?)<\/defs>/gi, (_match, inner: string) => {
    definitions += inner;
    return "";
  });
  return { visual, definitions };
}

export function decorationClassName(template: DecorationEffectTemplate): string {
  return `decoration-effect-${template.id}`;
}

function keyframesName(template: DecorationEffectTemplate): string {
  return `decoration${template.id.replace(/[^a-zA-Z0-9]/g, "")}`;
}

function param(params: DecorationParams, key: string, fallback: string | number): string | number {
  return params[key] ?? fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface ConnectionFlowGeometry {
  width: number;
  height: number;
  path: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
}

function connectionFlowGeometry(params: DecorationParams): ConnectionFlowGeometry {
  const length = Math.max(80, Number(param(params, "length", 300)));
  const bend = Math.max(0, Number(param(params, "bend", 48)));
  const pathStyle = String(param(params, "pathStyle", "curve"));
  const direction = String(param(params, "direction", "ltr"));
  const vertical = direction === "ttb" || direction === "btt";
  const padding = 20;

  if (vertical) {
    const width = Math.max(64, bend + padding * 2);
    const height = length + padding * 2;
    const centerX = width / 2;
    const start = { x: centerX + bend / 2, y: padding };
    const end = { x: centerX - bend / 2, y: height - padding };
    const path = pathStyle === "straight"
      ? `M ${centerX} ${padding} L ${centerX} ${height - padding}`
      : pathStyle === "elbow"
        ? `M ${start.x} ${start.y} V ${height / 2} H ${end.x} V ${end.y}`
        : `M ${start.x} ${start.y} C ${start.x} ${height * 0.38},${end.x} ${height * 0.62},${end.x} ${end.y}`;
    return {
      width,
      height,
      path,
      start: pathStyle === "straight" ? { x: centerX, y: padding } : start,
      end: pathStyle === "straight" ? { x: centerX, y: height - padding } : end
    };
  }

  const width = length + padding * 2;
  const height = Math.max(64, bend + padding * 2);
  const centerY = height / 2;
  const start = { x: padding, y: centerY + bend / 2 };
  const end = { x: width - padding, y: centerY - bend / 2 };
  const path = pathStyle === "straight"
    ? `M ${padding} ${centerY} L ${width - padding} ${centerY}`
    : pathStyle === "elbow"
      ? `M ${start.x} ${start.y} H ${width / 2} V ${end.y} H ${end.x}`
      : `M ${start.x} ${start.y} C ${width * 0.38} ${start.y},${width * 0.62} ${end.y},${end.x} ${end.y}`;
  return {
    width,
    height,
    path,
    start: pathStyle === "straight" ? { x: padding, y: centerY } : start,
    end: pathStyle === "straight" ? { x: width - padding, y: centerY } : end
  };
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
  const color = param(params, "color", DECORATION_BLUE);
  const duration = param(params, "duration", 2.4);
  const opacity = param(params, "opacity", 1);
  const glow = param(params, "glow", 18);
  const borderWidth = param(params, "borderWidth", 1);

  if (template.generator === "flow-marker") {
    const markerSize = Math.max(1, Number(size));
    const distance = Math.max(0, Number(param(params, "distance", 240)));
    const speed = Math.max(1, Number(param(params, "speed", 120)));
    const glowIntensity = Math.max(0, Math.min(100, Number(param(params, "glowIntensity", 55)))) / 100;
    const tailLength = Math.max(0, Number(param(params, "tailLength", 54)));
    const direction = String(param(params, "direction", "ltr"));
    const horizontal = direction === "ltr" || direction === "rtl";
    const reverse = direction === "rtl" || direction === "btt";
    const loopDuration = Math.max(0.25, distance / speed);
    const crossSize = Math.max(64, markerSize * 4, tailLength * 0.34);
    const width = horizontal ? distance + markerSize : crossSize;
    const height = horizontal ? crossSize : distance + markerSize;
    const startTransform = horizontal
      ? `translate3d(0,-50%,0)`
      : `translate3d(-50%,0,0)`;
    const finishTransform = horizontal
      ? `translate3d(${reverse ? -distance : distance}px,-50%,0)`
      : `translate3d(-50%,${reverse ? -distance : distance}px,0)`;
    const runnerPosition = horizontal
      ? `top:50%;${reverse ? "right" : "left"}:0;`
      : `left:50%;${reverse ? "bottom" : "top"}:0;`;
    const tailThickness = Math.max(1, markerSize * 0.22);
    const tailPosition = horizontal
      ? `top:50%;${reverse ? "left" : "right"}:50%;width:${tailLength}px;height:${tailThickness.toFixed(1)}px;transform:translateY(-50%);background:linear-gradient(${reverse ? "90deg" : "270deg"},color-mix(in srgb,${color} 68%,transparent),transparent);`
      : `left:50%;${reverse ? "top" : "bottom"}:50%;width:${tailThickness.toFixed(1)}px;height:${tailLength}px;transform:translateX(-50%);background:linear-gradient(${reverse ? "180deg" : "0deg"},color-mix(in srgb,${color} 68%,transparent),transparent);`;
    const directionRotation = direction === "rtl" ? 180 : direction === "ttb" ? 90 : direction === "btt" ? -90 : 0;
    const glowSoft = Math.max(1, markerSize * 0.42 * glowIntensity);
    const glowPeak = Math.max(1, markerSize * 0.9 * glowIntensity);

    return `.${cls}{position:relative;width:${width.toFixed(1)}px;height:${height.toFixed(1)}px;overflow:hidden;isolation:isolate;color:${color}}
.${cls}__runner{position:absolute;${runnerPosition}width:${markerSize}px;height:${markerSize}px;display:grid;place-items:center;will-change:transform,opacity,filter;animation:${kf} ${loopDuration.toFixed(3)}s ease-in-out infinite}
.${cls}__tail{position:absolute;${tailPosition}border-radius:999px;opacity:${tailLength > 0 ? 0.7 : 0};filter:blur(${Math.max(0.5, markerSize * 0.08).toFixed(1)}px);pointer-events:none}
.${cls}__mark{position:relative;z-index:1;display:block;width:${markerSize}px;height:${markerSize}px;background:${color};box-sizing:border-box}
.${cls}[data-shape="circle"] .${cls}__mark{border-radius:50%}
.${cls}[data-shape="square"] .${cls}__mark{border-radius:${Math.max(1, markerSize * 0.12).toFixed(1)}px}
.${cls}[data-shape="diamond"] .${cls}__mark{border-radius:${Math.max(1, markerSize * 0.08).toFixed(1)}px;transform:rotate(45deg) scale(.78)}
.${cls}[data-shape="triangle"] .${cls}__mark{clip-path:polygon(8% 6%,100% 50%,8% 94%);transform:rotate(${directionRotation}deg)}
.${cls}[data-shape="sector"] .${cls}__mark{border-radius:100% 0 0 0;transform:rotate(${directionRotation + 45}deg) scale(.82)}
.${cls}[data-shape="custom-svg"] .${cls}__mark{background:transparent;transform:none}
.${cls}__mark svg{display:block;width:100%;height:100%;overflow:visible}
.${cls} .flow-marker-imported-svg :is(path,rect,circle,ellipse,polygon):not([fill="none"]){fill:${color}!important}
.${cls} .flow-marker-imported-svg :is(path,rect,circle,ellipse,polygon,polyline,line)[stroke]:not([stroke="none"]){stroke:${color}!important}
.${cls} .flow-marker-imported-svg :is([fill="none"],line,polyline){fill:none!important}
@keyframes ${kf}{0%{transform:${startTransform};opacity:0;filter:drop-shadow(0 0 0 transparent)}12%{opacity:.72;filter:drop-shadow(0 0 ${glowSoft.toFixed(1)}px color-mix(in srgb,${color} 46%,transparent))}48%{opacity:1;filter:drop-shadow(0 0 ${glowPeak.toFixed(1)}px color-mix(in srgb,${color} 74%,transparent))}82%{opacity:.82;filter:drop-shadow(0 0 ${glowSoft.toFixed(1)}px color-mix(in srgb,${color} 42%,transparent))}100%{transform:${finishTransform};opacity:0;filter:drop-shadow(0 0 0 transparent)}}`;
  }

  if (template.generator === "flow-marker-sequence") {
    const markerSize = Math.max(1, Number(size));
    const markerCount = Math.max(2, Math.min(8, Math.round(Number(param(params, "markerCount", 3)))));
    const markerGap = Math.max(0, Number(param(params, "markerGap", 4)));
    const direction = String(param(params, "direction", "ltr"));
    const horizontal = direction === "ltr" || direction === "rtl";
    const directionRotation = direction === "rtl" ? 180 : direction === "ttb" ? 90 : direction === "btt" ? -90 : 0;
    const loopDuration = Math.max(0.4, Number(duration));
    const pause = Math.max(0, Number(param(params, "pause", 0.1)));
    const totalDuration = loopDuration + pause;
    const easing = String(param(params, "easing", "ease-in-out"));
    const minOpacity = Math.max(0.05, Math.min(0.8, Number(param(params, "minOpacity", 0.16))));
    const glowIntensity = Math.max(0, Math.min(100, Number(param(params, "glowIntensity", 55)))) / 100;
    const afterglow = Math.max(0, Math.min(100, Number(param(params, "afterglow", 52)))) / 100;
    const mainSize = markerCount * markerSize + (markerCount - 1) * markerGap;
    const crossSize = markerSize * 2.6;
    const width = horizontal ? mainSize : crossSize;
    const height = horizontal ? crossSize : mainSize;
    const delayStep = loopDuration / markerCount;
    const motionEnd = Math.min(100, (loopDuration / totalDuration) * 100);
    const peakAt = Math.min(motionEnd * 0.48, 38);
    const riseAt = Math.max(0, peakAt - 12);
    const fadeAt = Math.min(motionEnd, peakAt + 12 + afterglow * 24);
    const glowSoft = Math.max(0.5, markerSize * 0.36 * glowIntensity);
    const glowPeak = Math.max(1, markerSize * 0.95 * glowIntensity);

    return `.${cls}{position:relative;width:${width.toFixed(1)}px;height:${height.toFixed(1)}px;display:flex;flex-direction:${horizontal ? "row" : "column"};align-items:center;justify-content:center;gap:${markerGap}px;isolation:isolate;color:${color}}
.${cls}__item{position:relative;display:grid;place-items:center;width:${markerSize}px;height:${markerSize}px;opacity:${minOpacity};will-change:transform,opacity,filter;animation:${kf} ${totalDuration.toFixed(3)}s ${easing} infinite;animation-delay:calc(var(--marker-index) * ${delayStep.toFixed(3)}s)}
.${cls}__mark{display:block;width:100%;height:100%;background:${color};box-sizing:border-box}
.${cls}[data-shape="circle"] .${cls}__mark{border-radius:50%}
.${cls}[data-shape="square"] .${cls}__mark{border-radius:${Math.max(1, markerSize * 0.12).toFixed(1)}px}
.${cls}[data-shape="diamond"] .${cls}__mark{border-radius:${Math.max(1, markerSize * 0.08).toFixed(1)}px;transform:rotate(45deg) scale(.78)}
.${cls}[data-shape="triangle"] .${cls}__mark{clip-path:polygon(8% 6%,100% 50%,8% 94%);transform:rotate(${directionRotation}deg)}
.${cls}[data-shape="sector"] .${cls}__mark{border-radius:100% 0 0 0;transform:rotate(${directionRotation + 45}deg) scale(.82)}
.${cls}[data-shape="custom-svg"] .${cls}__mark{background:transparent;transform:rotate(${directionRotation}deg)}
.${cls}__mark svg{display:block;width:100%;height:100%;overflow:visible}
.${cls} .sequence-marker-imported-svg :is(path,rect,circle,ellipse,polygon):not([fill="none"]){fill:${color}!important}
.${cls} .sequence-marker-imported-svg :is(path,rect,circle,ellipse,polygon,polyline,line)[stroke]:not([stroke="none"]){stroke:${color}!important}
.${cls} .sequence-marker-imported-svg :is([fill="none"],line,polyline){fill:none!important}
@keyframes ${kf}{0%,100%{transform:scale(.86);opacity:${minOpacity};filter:drop-shadow(0 0 0 transparent)}${riseAt.toFixed(1)}%{transform:scale(.94);opacity:${Math.min(0.8, minOpacity + 0.2).toFixed(2)};filter:drop-shadow(0 0 ${glowSoft.toFixed(1)}px color-mix(in srgb,${color} 36%,transparent))}${peakAt.toFixed(1)}%{transform:scale(1.08);opacity:1;filter:drop-shadow(0 0 ${glowPeak.toFixed(1)}px color-mix(in srgb,${color} 78%,transparent))}${fadeAt.toFixed(1)}%{transform:scale(.98);opacity:${Math.min(0.86, minOpacity + afterglow * 0.52).toFixed(2)};filter:drop-shadow(0 0 ${glowSoft.toFixed(1)}px color-mix(in srgb,${color} 42%,transparent))}${motionEnd.toFixed(1)}%{transform:scale(.86);opacity:${minOpacity};filter:drop-shadow(0 0 0 transparent)}}`;
  }

  if (template.generator === "corner-focus") {
    const targetWidth = Math.max(40, Number(param(params, "targetWidth", 180)));
    const targetHeight = Math.max(32, Number(param(params, "targetHeight", 100)));
    const cornerLength = Math.max(6, Number(param(params, "cornerLength", 22)));
    const lineWidth = Math.max(0.5, Number(borderWidth));
    const focusDistance = Math.max(0, Number(param(params, "focusDistance", 12)));
    const cornerStyle = String(param(params, "cornerStyle", "angle"));
    const cornerCount = String(param(params, "cornerCount", "four"));
    const minOpacity = Math.max(0.05, Math.min(0.8, Number(param(params, "minOpacity", 0.22))));
    const glowIntensity = Math.max(0, Math.min(100, Number(param(params, "glowIntensity", 42)))) / 100;
    const loopDuration = Math.max(0.8, Number(duration));
    const pause = Math.max(0, Number(param(params, "pause", 0.3)));
    const totalDuration = loopDuration + pause;
    const easing = String(param(params, "easing", "ease-in-out"));
    const motionEnd = Math.min(100, (loopDuration / totalDuration) * 100);
    const focusIn = motionEnd * 0.32;
    const focusOut = motionEnd * 0.68;
    const glowRadius = Math.max(0.5, cornerLength * 0.45 * glowIntensity);
    const pointSize = Math.max(2, lineWidth * 1.8);
    const fullWidth = targetWidth + focusDistance * 2;
    const fullHeight = targetHeight + focusDistance * 2;

    return `.${cls}{position:relative;width:${fullWidth.toFixed(1)}px;height:${fullHeight.toFixed(1)}px;isolation:isolate;color:${color}}
.${cls}__corner{position:absolute;width:${cornerLength}px;height:${cornerLength}px;opacity:${minOpacity};will-change:transform,opacity,filter;animation:${kf} ${totalDuration.toFixed(3)}s ${easing} infinite}
.${cls}__corner::before,.${cls}__corner::after{content:"";position:absolute;display:block;background:${color};border-radius:999px}
.${cls}__corner::before{width:100%;height:${lineWidth}px}
.${cls}__corner::after{width:${lineWidth}px;height:100%}
.${cls}__corner--tl{left:${focusDistance}px;top:${focusDistance}px;--start-x:-${focusDistance}px;--start-y:-${focusDistance}px}
.${cls}__corner--tr{right:${focusDistance}px;top:${focusDistance}px;--start-x:${focusDistance}px;--start-y:-${focusDistance}px}
.${cls}__corner--br{right:${focusDistance}px;bottom:${focusDistance}px;--start-x:${focusDistance}px;--start-y:${focusDistance}px}
.${cls}__corner--bl{left:${focusDistance}px;bottom:${focusDistance}px;--start-x:-${focusDistance}px;--start-y:${focusDistance}px}
.${cls}__corner--tl::before,.${cls}__corner--tr::before{top:0}.${cls}__corner--br::before,.${cls}__corner--bl::before{bottom:0}
.${cls}__corner--tl::after,.${cls}__corner--bl::after{left:0}.${cls}__corner--tr::after,.${cls}__corner--br::after{right:0}
.${cls}[data-count="single"] .${cls}__corner:not(.${cls}__corner--tl){display:none}
.${cls}[data-count="double"] .${cls}__corner--tr,.${cls}[data-count="double"] .${cls}__corner--bl{display:none}
.${cls}[data-style="broken"] .${cls}__corner::before{background:linear-gradient(90deg,${color} 0 38%,transparent 38% 56%,${color} 56% 100%)}
.${cls}[data-style="broken"] .${cls}__corner::after{background:linear-gradient(180deg,${color} 0 38%,transparent 38% 56%,${color} 56% 100%)}
.${cls}[data-style="dot-line"] .${cls}__corner::before,.${cls}[data-style="dot-line"] .${cls}__corner::after{opacity:.72}
.${cls}__point{display:none;position:absolute;width:${pointSize}px;height:${pointSize}px;border-radius:50%;background:${color};box-shadow:0 0 ${Math.max(2, pointSize * 2)}px color-mix(in srgb,${color} 60%,transparent)}
.${cls}[data-style="dot-line"] .${cls}__point{display:block}
.${cls}__corner--tl .${cls}__point{left:0;top:0;transform:translate(-30%,-30%)}
.${cls}__corner--tr .${cls}__point{right:0;top:0;transform:translate(30%,-30%)}
.${cls}__corner--br .${cls}__point{right:0;bottom:0;transform:translate(30%,30%)}
.${cls}__corner--bl .${cls}__point{left:0;bottom:0;transform:translate(-30%,30%)}
.${cls}__custom{display:none;width:100%;height:100%}
.${cls}[data-style="custom-svg"] .${cls}__corner::before,.${cls}[data-style="custom-svg"] .${cls}__corner::after,.${cls}[data-style="custom-svg"] .${cls}__point{display:none}
.${cls}[data-style="custom-svg"] .${cls}__custom{display:block}
.${cls}__corner--tr .${cls}__custom{transform:rotate(90deg)}
.${cls}__corner--br .${cls}__custom{transform:rotate(180deg)}
.${cls}__corner--bl .${cls}__custom{transform:rotate(-90deg)}
.${cls}__custom svg{display:block;width:100%;height:100%;overflow:visible}
.${cls} .corner-focus-imported-svg :is(path,rect,circle,ellipse,polygon):not([fill="none"]){fill:${color}!important}
.${cls} .corner-focus-imported-svg :is(path,rect,circle,ellipse,polygon,polyline,line)[stroke]:not([stroke="none"]){stroke:${color}!important}
.${cls} .corner-focus-imported-svg :is([fill="none"],line,polyline){fill:none!important}
@keyframes ${kf}{0%,100%{transform:translate(var(--start-x),var(--start-y)) scale(.96);opacity:${minOpacity};filter:drop-shadow(0 0 0 transparent)}${focusIn.toFixed(1)}%,${focusOut.toFixed(1)}%{transform:translate(0,0) scale(1);opacity:1;filter:drop-shadow(0 0 ${glowRadius.toFixed(1)}px color-mix(in srgb,${color} 68%,transparent))}${motionEnd.toFixed(1)}%{transform:translate(var(--start-x),var(--start-y)) scale(.96);opacity:${minOpacity};filter:drop-shadow(0 0 0 transparent)}}`;
  }

  if (template.generator === "connection-flow") {
    const geometry = connectionFlowGeometry(params);
    const lineWidth = Math.max(0.5, Number(param(params, "lineWidth", 1.5)));
    const trackOpacity = Math.max(0.05, Math.min(0.6, Number(param(params, "trackOpacity", 0.2))));
    const glowIntensity = Math.max(0, Math.min(100, Number(param(params, "glowIntensity", 44)))) / 100;
    const glowWidth = lineWidth + 3 + glowIntensity * 6;
    const blur = Math.max(0.4, 1 + glowIntensity * 3.5);
    return `.${cls}{position:relative;width:${geometry.width.toFixed(1)}px;height:${geometry.height.toFixed(1)}px;isolation:isolate;color:${color}}
.${cls}__svg{display:block;width:100%;height:100%;overflow:visible}
.${cls}__track,.${cls}__flow-glow,.${cls}__flow-core{fill:none;stroke:${color};stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.${cls}__track{stroke-width:${lineWidth}px;opacity:${trackOpacity}}
.${cls}__flow-glow{stroke-width:${glowWidth.toFixed(1)}px;opacity:${(0.18 + glowIntensity * 0.2).toFixed(2)};filter:blur(${blur.toFixed(1)}px)}
.${cls}__flow-core{stroke-width:${Math.max(1, lineWidth * 1.25).toFixed(1)}px;opacity:${(0.72 + glowIntensity * 0.24).toFixed(2)};filter:drop-shadow(0 0 ${Math.max(1, glowIntensity * 6).toFixed(1)}px ${color})}
.${cls}__endpoint{fill:${color};stroke:${color};vector-effect:non-scaling-stroke}
.${cls}[data-endpoint="none"] .${cls}__endpoint{display:none}
.${cls}[data-endpoint="dot"] .${cls}__endpoint{stroke-width:0;opacity:.82}
.${cls}[data-endpoint="ring"] .${cls}__endpoint{fill:#111;stroke-width:${lineWidth}px;opacity:.86}`;
  }

  if (template.generator === "loading-ring") {
    const arcLength = Number(param(params, "arcLength", 32));
    const ringWidth = Number(borderWidth);
    const direction = param(params, "direction", "clockwise") === "counterclockwise" ? "reverse" : "normal";
    const trackColor = param(params, "trackColor", "#26303B");
    return `.${cls}{position:relative;width:${size}px;height:${size}px;border:${ringWidth}px solid ${trackColor};border-radius:50%;box-sizing:border-box;opacity:${opacity}}
.${cls}__arc{position:absolute;inset:-${ringWidth}px;border-radius:50%;background:conic-gradient(from -90deg,${color} 0deg,${DECORATION_BLUE_LIGHT} ${(arcLength * 2.6).toFixed(1)}deg,transparent ${(arcLength * 3.6).toFixed(1)}deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - ${ringWidth}px),#000 calc(100% - ${ringWidth - 0.5}px));mask:radial-gradient(farthest-side,transparent calc(100% - ${ringWidth}px),#000 calc(100% - ${ringWidth - 0.5}px));filter:drop-shadow(0 0 ${Math.max(2, ringWidth * 1.4)}px ${color});animation:${kf} ${duration}s linear infinite;animation-direction:${direction}}
@keyframes ${kf}{to{transform:rotate(360deg)}}`;
  }

  if (template.generator === "loading-dots") {
    const dotCount = Math.round(Number(param(params, "dotCount", 3)));
    const dotSize = Number(param(params, "dotSize", 8));
    const gap = Number(param(params, "gap", 10));
    const minOpacity = Number(param(params, "minOpacity", 0.24));
    return `.${cls}{display:flex;align-items:center;justify-content:center;gap:${gap}px;opacity:${opacity}}
.${cls} i{display:block;width:${dotSize}px;height:${dotSize}px;border-radius:50%;background:${color};opacity:${minOpacity};box-shadow:0 0 ${Math.max(3, dotSize)}px color-mix(in srgb,${color} 55%,transparent);animation:${kf} ${duration}s ease-in-out infinite;animation-delay:calc(var(--dot-index) * ${Math.max(0.08, Number(duration) / (dotCount * 3)).toFixed(2)}s)}
.${cls} i:nth-child(n+${dotCount + 1}){display:none}
@keyframes ${kf}{0%,60%,100%{transform:scale(.72);opacity:${minOpacity}}30%{transform:scale(1.18);opacity:1;box-shadow:0 0 ${Math.max(6, dotSize * 1.8)}px ${color}}}`;
  }

  if (template.generator === "loading-line") {
    const trackWidth = Number(param(params, "trackWidth", 280));
    const trackColor = param(params, "trackColor", "#26303B");
    const stripeWidth = Number(param(params, "tailLength", 20));
    const radius = Number(param(params, "radius", 3));
    const progress = Number(param(params, "progress", 48));
    const progressMode = param(params, "lineMode", "indeterminate") === "progress";
    const stripeStep = Math.max(8, stripeWidth);
    const stripeLight = `color-mix(in srgb,${color} 94%,white 6%)`;
    const stripeDark = `color-mix(in srgb,${color} 42%,${trackColor})`;
    return `.${cls}{position:relative;width:${trackWidth}px;height:${Number(borderWidth)}px;box-sizing:border-box;background:transparent;overflow:hidden;opacity:${opacity}}
.${cls}::before{content:"";position:absolute;inset:0;border-radius:${radius}px;background:${trackColor}}
.${cls}__flow{position:relative;z-index:1;display:block;width:${progressMode ? progress : 100}%;height:100%;border-radius:${radius}px;background-color:${stripeDark};background-image:linear-gradient(45deg,${stripeLight} 25%,${stripeDark} 25%,${stripeDark} 50%,${stripeLight} 50%,${stripeLight} 75%,${stripeDark} 75%,${stripeDark} 100%);background-size:${stripeStep.toFixed(1)}px ${stripeStep.toFixed(1)}px;animation:${kf} ${duration}s linear infinite;transition:width .2s ease-out}
@keyframes ${kf}{to{background-position:${stripeStep.toFixed(1)}px 0}}`;
  }

  if (template.generator === "loading-icon-pulse") {
    const minScale = Number(param(params, "minScale", 0.92));
    const haloRange = Number(param(params, "haloRange", 18));
    const haloIntensity = Number(param(params, "haloIntensity", 55)) / 100;
    const haloVisible = param(params, "haloEnabled", "on") === "on";
    return `.${cls}{position:relative;width:${size}px;height:${size}px;display:grid;place-items:center;isolation:isolate;opacity:${opacity}}
.${cls}__halo{position:absolute;inset:14%;border:1px solid ${color};border-radius:50%;opacity:${haloVisible ? haloIntensity : 0};box-shadow:0 0 ${haloRange}px ${color},inset 0 0 ${Math.max(4, haloRange * 0.55)}px color-mix(in srgb,${color} 60%,transparent);animation:${kf}Halo ${duration}s ease-out infinite}
.${cls}__icon{position:relative;z-index:1;width:56%;height:56%;display:grid;place-items:center;filter:drop-shadow(0 0 ${Math.max(4, haloRange * 0.45)}px color-mix(in srgb,${color} 72%,transparent));animation:${kf} ${duration}s ease-in-out infinite}
.${cls}__icon svg{display:block;width:100%;height:100%;overflow:visible}
@keyframes ${kf}{0%,100%{transform:scale(${minScale});opacity:.72}50%{transform:scale(1);opacity:1}}
@keyframes ${kf}Halo{0%{transform:scale(.72);opacity:0}35%{opacity:${haloVisible ? haloIntensity : 0}}100%{transform:scale(1.42);opacity:0}}`;
  }

  if (template.generator === "loading-tech-ring") {
    const ringSize = Number(size);
    const innerSize = Math.min(ringSize - 4, Number(param(params, "innerSize", ringSize * 0.8)));
    const outerWidth = Number(param(params, "outerWidth", 1));
    const innerWidth = Number(param(params, "innerWidth", 1));
    const outerGlowStrength = Number(param(params, "outerGlow", 72)) / 100;
    const innerGlowStrength = Number(param(params, "innerGlow", 52)) / 100;
    const outerHighlight = Math.max(2, ringSize * 0.025);
    const outerGlow = Math.max(5, ringSize * 0.075) * outerGlowStrength;
    const innerGlow = Math.max(4, innerSize * 0.065) * innerGlowStrength;
    const direction = param(params, "direction", "clockwise") === "counterclockwise" ? "-360deg" : "360deg";
    return `.${cls}{position:relative;width:${ringSize}px;height:${ringSize}px;border-radius:50%;display:grid;place-items:center;opacity:${opacity};isolation:isolate}
.${cls}__orbit{position:absolute;inset:0;border-radius:50%;border:${outerWidth}px solid color-mix(in srgb,${color} 18%,transparent);background:radial-gradient(circle,transparent 55%,color-mix(in srgb,${color} 5%,transparent) 72%,transparent 74%);box-shadow:${outerHighlight.toFixed(1)}px 0 ${Math.max(1, outerWidth * 0.7).toFixed(1)}px -1px ${color},${outerGlow.toFixed(1)}px 0 ${outerGlow.toFixed(1)}px color-mix(in srgb,${color} 58%,transparent),inset -${outerGlow.toFixed(1)}px 0 ${outerGlow.toFixed(1)}px -${(outerGlow * 0.45).toFixed(1)}px color-mix(in srgb,${color} 50%,transparent);animation:${kf} ${duration}s linear infinite;box-sizing:border-box}
.${cls}__inner{position:absolute;left:50%;top:50%;width:${innerSize}px;height:${innerSize}px;transform:translate(-50%,-50%);border-radius:50%;border:${innerWidth}px solid color-mix(in srgb,${color} 16%,transparent);box-shadow:${Math.max(1.5, outerHighlight * 0.7).toFixed(1)}px 0 ${Math.max(1, innerWidth * 0.7).toFixed(1)}px -1px ${color},${innerGlow.toFixed(1)}px 0 ${innerGlow.toFixed(1)}px color-mix(in srgb,${color} 56%,transparent),inset -${innerGlow.toFixed(1)}px 0 ${innerGlow.toFixed(1)}px -${(innerGlow * 0.4).toFixed(1)}px color-mix(in srgb,${color} 48%,transparent);box-sizing:border-box}
.${cls}__label{position:relative;z-index:2;max-width:${Math.max(20, innerSize - 18)}px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:color-mix(in srgb,${color} 78%,white);font:500 ${Math.max(10, Math.min(18, innerSize * 0.14)).toFixed(1)}px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.08em;text-shadow:0 0 ${Math.max(3, innerGlow * 0.7).toFixed(1)}px color-mix(in srgb,${color} 64%,transparent)}
@keyframes ${kf}{from{transform:rotate(0deg)}to{transform:rotate(${direction})}}`;
  }

  if (template.generator === "loading-irregular-ring") {
    const ringSize = Number(size);
    const ringWidth = Number(borderWidth);
    const glowStrength = Number(param(params, "glowIntensity", 35)) / 100;
    const glowRadius = Math.max(0, ringSize * 0.06 * glowStrength);
    const discSize = ringSize * (150 / 260);
    const labelSize = Math.max(9, ringSize * (19 / 260));
    const labelSpacing = Math.max(0.5, ringSize * (2 / 260));
    const labelWidth = discSize * 0.88;
    const ringFilter = glowRadius > 0
      ? `drop-shadow(0 0 ${Math.max(1, glowRadius * 0.42).toFixed(1)}px color-mix(in srgb,${color} 72%,transparent)) drop-shadow(0 0 ${glowRadius.toFixed(1)}px color-mix(in srgb,${color} 38%,transparent))`
      : "none";
    return `.${cls}{position:relative;width:${ringSize}px;height:${ringSize}px;display:grid;place-items:center;opacity:${opacity};isolation:isolate}
.${cls}__ring-frame,.${cls}__disc-frame{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
.${cls}__ring,.${cls}__disc{position:absolute;display:block;border-radius:50%;box-sizing:border-box;transform-origin:center;will-change:transform}
.${cls}__ring{border:${ringWidth}px solid color-mix(in srgb,${color} 10%,transparent);border-left-color:${color};border-right-color:${color};filter:${ringFilter}}
.${cls}__ring--one{width:92%;height:92%;animation:${kf}Spin ${(Number(duration)).toFixed(2)}s linear infinite}
.${cls}__ring--two{width:106%;height:106%;animation:${kf}Spinner ${(Number(duration) * 1.25).toFixed(2)}s linear infinite}
.${cls}__ring--three{width:120%;height:120%;animation:${kf}Spin ${(Number(duration) * 1.5).toFixed(2)}s linear infinite}
.${cls}__disc{width:${discSize.toFixed(2)}px;height:${discSize.toFixed(2)}px;border:${ringWidth}px solid ${color};opacity:.9;filter:${ringFilter};animation:${kf}Disc ${(Number(duration) * 3).toFixed(2)}s linear infinite}
.${cls}__disc--one{animation-delay:${(Number(duration) * 0.2).toFixed(2)}s}
.${cls}__disc--two{animation-delay:${(Number(duration) * 1.2).toFixed(2)}s}
.${cls}__disc--three{animation-delay:${(Number(duration) * 2.2).toFixed(2)}s}
.${cls}__label{position:relative;z-index:2;display:block;width:${labelWidth.toFixed(2)}px;max-width:${labelWidth.toFixed(2)}px;overflow:hidden;text-align:center;text-overflow:ellipsis;white-space:nowrap;color:${color};font:400 ${labelSize.toFixed(1)}px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:${labelSpacing.toFixed(1)}px;text-shadow:0 0 ${Math.max(0, glowRadius * 0.7).toFixed(1)}px color-mix(in srgb,${color} 55%,transparent);animation:${kf}Blink ${Number(duration).toFixed(2)}s ease infinite}
@keyframes ${kf}Blink{0%,100%{opacity:1}50%{opacity:0}}
@keyframes ${kf}Disc{to{transform:rotate3d(.5,.5,.5,-720deg)}}
@keyframes ${kf}Spin{to{transform:rotate(-360deg)}}
@keyframes ${kf}Spinner{to{transform:rotate(360deg)}}`;
  }

  if (template.generator === "loading-hex-tech-ring") {
    const ringSize = Number(size);
    const ringWidth = Number(borderWidth);
    const glowStrength = Number(param(params, "glowIntensity", 64)) / 100;
    const centerOpacity = Math.max(0, Math.min(1, Number(param(params, "centerOpacity", 100)) / 100));
    const glowRadius = Math.max(0, ringSize * 0.045 * glowStrength);
    const glowFilter = glowRadius > 0
      ? `drop-shadow(-${Math.max(0.5, glowRadius * 0.16).toFixed(1)}px -${Math.max(0.5, glowRadius * 0.16).toFixed(1)}px ${Math.max(1, glowRadius * 0.55).toFixed(1)}px color-mix(in srgb,${color} 78%,transparent)) drop-shadow(0 0 ${glowRadius.toFixed(1)}px color-mix(in srgb,${color} 34%,transparent))`
      : "none";
    return `.${cls}{position:relative;width:${ringSize}px;display:grid;place-items:center;opacity:${opacity};isolation:isolate;color:${color}}
.${cls}__svg{display:block;width:${ringSize}px;height:${ringSize}px;overflow:visible;filter:${glowFilter}}
.${cls}__ring{fill:none;transform-box:fill-box;transform-origin:center;will-change:transform}
.${cls}__ring--inner{stroke:${color};stroke-width:${Math.max(6, ringWidth * 8).toFixed(1)};stroke-dasharray:${Math.max(7, ringWidth * 5).toFixed(1)} ${Math.max(3, ringWidth * 2.4).toFixed(1)};opacity:.9;animation:${kf}Inner ${Number(duration).toFixed(2)}s linear infinite}
.${cls}__ring--outer{stroke:color-mix(in srgb,${color} 64%,#0071bc);stroke-width:${Math.max(4, ringWidth * 6).toFixed(1)};stroke-dasharray:${Math.max(1.5, ringWidth).toFixed(1)} ${Math.max(8, ringWidth * 8).toFixed(1)};opacity:.82;animation:${kf}Outer ${Number(duration).toFixed(2)}s linear infinite}
.${cls}__cells{opacity:${centerOpacity.toFixed(2)}}
.${cls}__cell{fill:${color};stroke:color-mix(in srgb,${color} 26%,white);stroke-width:${Math.max(1, ringWidth * 0.5).toFixed(1)};transform-box:fill-box;transform-origin:center;animation:${kf}Cell 2s linear infinite;animation-delay:calc(var(--cell-index) * .4s)}
@keyframes ${kf}Inner{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}
@keyframes ${kf}Outer{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes ${kf}Cell{0%,100%{transform:scale(.1);opacity:0}50%{transform:scale(1);opacity:1}}`;
  }

  if (template.id === "svg-flow-double-guide") {
    return generateBackgroundSweepCss(cls);
  }

  if (template.generator === "svg-flow") {
    const config = svgFlowConfig(params);
    const total = Math.max(0.1, config.duration + config.pause);
    const glowRatio = Math.max(0, Math.min(1, config.glow / 64));
    const glowFilter = config.glow <= 0
      ? "none"
      : `brightness(${(1 + glowRatio * 0.72).toFixed(2)}) drop-shadow(0 0 ${Math.max(1, config.glow * 0.16).toFixed(1)}px ${config.headColor}) drop-shadow(0 0 ${Math.max(2, config.glow * 0.48).toFixed(1)}px ${config.headColor}) drop-shadow(0 0 ${Math.max(3, config.glow).toFixed(1)}px ${config.tailColor})`;

    return `.${cls} {
  position: relative;
  isolation: isolate;
  opacity: 1;
}

.${cls}__svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
  position: relative;
  z-index: 1;
}

.${cls}__path {
  fill: none;
  stroke: ${config.headColor};
  stroke-width: ${config.borderWidth};
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: ${glowFilter};
}

.${cls}__track {
  fill: none;
  stroke: ${config.endColor};
  stroke-width: ${Math.max(1, config.borderWidth * 0.5)};
  opacity: 0.7;
}

.${cls}__tail {
  fill: none;
  stroke: ${config.tailColor};
  stroke-width: ${Math.max(1, config.borderWidth * 1.75)};
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: ${(0.16 + glowRatio * 0.48).toFixed(2)};
  filter: ${config.glow <= 0 ? "none" : `drop-shadow(0 0 ${Math.max(2, config.glow * 0.72).toFixed(1)}px ${config.tailColor})`};
}

.${cls}__meta { display: none; }

/* 动画总时长 ${total}s，前 ${config.duration}s 流动，剩余时间留白。 */`;
  }

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
    drop-shadow(0 0 ${Math.max(2, Math.round(cometGlow * 0.18))}px rgba(122, 184, 255, 0.9))
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
    inset 0 0 ${Math.round(Number(glow) * 0.65)}px rgba(0, 112, 243, 0.18);
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
  background: ${DECORATION_BLUE_LIGHT};
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
  background: ${DECORATION_BLUE_LIGHT};
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
  background: ${DECORATION_BLUE_LIGHT};
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

  if (template.generator === "panel-border-flow") {
    const panelWidth = Math.max(160, Number(param(params, "panelWidth", 460)));
    const panelHeight = Math.max(100, Number(param(params, "panelHeight", 240)));
    const structureColor = String(param(params, "structureColor", "#1681FF"));
    const backgroundColor = String(param(params, "backgroundColor", "#080E17"));
    const structureOpacity = Math.max(0.1, Math.min(1, Number(param(params, "structureOpacity", 76)) / 100));
    const glowIntensity = Math.max(0, Math.min(100, Number(param(params, "glowIntensity", 32)))) / 100;
    const flowEnabled = String(param(params, "flowEnabled", "on")) !== "off";
    const flowDirection = String(param(params, "direction", "clockwise")) === "counterclockwise" ? "reverse" : "normal";
    const glowBlur = Math.max(1, Number(borderWidth) * (1.5 + glowIntensity * 4));
    const flowCss = flowEnabled
      ? `
.${cls}__flow-track,.${cls}__flow-segment{fill:none;vector-effect:non-scaling-stroke;stroke-linecap:round}
.${cls}__flow-track{stroke:${structureColor};stroke-width:.7;opacity:${(structureOpacity * .2).toFixed(3)}}
.${cls}__flow-segment{stroke:${color};stroke-width:var(--panel-flow-width);stroke-dasharray:${BORDER_FLOW_DASH_LENGTH} ${BORDER_FLOW_DASH_GAP};stroke-dashoffset:var(--panel-flow-start);opacity:var(--panel-flow-opacity);animation:${kf} ${duration}s linear infinite ${flowDirection}}
.${cls}__flow-segment--head{stroke:color-mix(in srgb,${color} 82%,white 18%);filter:drop-shadow(0 0 ${glowBlur.toFixed(1)}px color-mix(in srgb,${color} ${Math.round(36 + glowIntensity * 42)}%,transparent))}
@keyframes ${kf}{to{stroke-dashoffset:calc(var(--panel-flow-start) - 100px)}}`
      : "";

    return `.${cls}{position:relative;width:${panelWidth}px;height:${panelHeight}px;overflow:visible;isolation:isolate;color:${color}}
.${cls}__source{position:absolute;inset:0;display:grid;place-items:center;overflow:visible;pointer-events:none}
.${cls}__source svg{display:block;width:100%;height:100%;overflow:visible}
.${cls}__svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.${cls}__frame-shell{fill:${backgroundColor};fill-opacity:.96;stroke:${structureColor};stroke-opacity:${(structureOpacity * .72).toFixed(3)};stroke-width:1.15;vector-effect:non-scaling-stroke}
.${cls}__frame-inner{fill:none;stroke:${structureColor};stroke-opacity:${(structureOpacity * .34).toFixed(3)};stroke-width:.8;vector-effect:non-scaling-stroke}
.${cls}__frame-plate{fill:color-mix(in srgb,${structureColor} 14%,${backgroundColor});stroke:${structureColor};stroke-opacity:${Math.min(1, structureOpacity * .95).toFixed(3)};stroke-width:1;vector-effect:non-scaling-stroke}
.${cls}__frame-rail{fill:color-mix(in srgb,${structureColor} 9%,${backgroundColor});stroke:${structureColor};stroke-opacity:${(structureOpacity * .72).toFixed(3)};stroke-width:1;vector-effect:non-scaling-stroke}
.${cls}__frame-corner{fill:none;stroke:${structureColor};stroke-opacity:${Math.min(1, structureOpacity * 1.18).toFixed(3)};stroke-width:1.6;vector-effect:non-scaling-stroke}
.${cls}__frame-accent{fill:none;stroke:${structureColor};stroke-opacity:${Math.min(1, structureOpacity * .9).toFixed(3)};stroke-width:1.1;vector-effect:non-scaling-stroke}
.${cls}__frame-tick{stroke:${structureColor};stroke-opacity:${(structureOpacity * .68).toFixed(3)};stroke-width:1;vector-effect:non-scaling-stroke}
.${cls}__frame-block{fill:${structureColor};fill-opacity:${(structureOpacity * .72).toFixed(3)}}
.${cls}__frame-node{fill:${structureColor};fill-opacity:${Math.min(1, structureOpacity * 1.08).toFixed(3)};filter:drop-shadow(0 0 3px color-mix(in srgb,${structureColor} 55%,transparent))}
${flowCss}`;
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

export function generateDecorationCompositionCss(asset?: SvgPreviewAsset, style?: SvgStyleConfig): string {
  if (!asset) return "";
  const current = style ?? {
    colorMode: "original",
    fillColor: "#0070F3",
    strokeColor: "#0070F3",
    strokeWidth: 1,
    opacity: 1
  };
  const svgTargets = ":is(.decoration-composition__svg,.loading-imported-svg,.flow-marker-imported-svg,.sequence-marker-imported-svg,.corner-focus-imported-svg)";
  const monochromeCss = current.colorMode === "monochrome"
    ? `${svgTargets} :is(path,rect,circle,ellipse,polygon,polyline,line) { stroke:${current.strokeColor} !important; stroke-width:${current.strokeWidth}px !important; }
${svgTargets} :is(path,rect,circle,ellipse,polygon):not([fill="none"]) { fill:${current.fillColor} !important; }
${svgTargets} :is([fill="none"],line,polyline) { fill:none !important; }`
    : `${svgTargets} [stroke]:not([stroke="none"]) { stroke-width:${current.strokeWidth}px !important; }`;
  return `.decoration-composition { position: relative; display: grid; place-items: center; isolation: isolate; }
.decoration-composition__effect { position: relative; z-index: 1; }
.decoration-composition__svg { position: absolute; z-index: 2; width: 88px; height: 88px; display: grid; place-items: center; opacity:${current.opacity}; pointer-events: none; }
.decoration-composition__svg svg { width: 100%; height: 100%; display: block; overflow: visible; }
.loading-imported-svg{width:100%;height:100%;display:grid;place-items:center;opacity:${current.opacity}}
.loading-imported-svg svg{width:100%;height:100%;display:block;overflow:visible}
.flow-marker-imported-svg{opacity:${current.opacity}}
.flow-marker-imported-svg svg{width:100%;height:100%;display:block;overflow:visible}
.sequence-marker-imported-svg,.corner-focus-imported-svg{opacity:${current.opacity}}
.sequence-marker-imported-svg svg,.corner-focus-imported-svg svg{width:100%;height:100%;display:block;overflow:visible}
${monochromeCss}`;
}

function composeDecoration(markup: string, asset?: SvgPreviewAsset): string {
  if (!asset) return markup;
  return `<div class="decoration-composition">
  <div class="decoration-composition__effect">${markup}</div>
  <div class="decoration-composition__svg">${asset.markup}</div>
</div>`;
}

export function generateDecorationHtmlCss(template: DecorationEffectTemplate, params: DecorationParams, source?: SvgFlowSource, asset?: SvgPreviewAsset, svgStyle?: SvgStyleConfig, particleEffect?: DecorationParticleConfig): string {
  return `${generateDecorationMarkup(template, params, source, asset, "main", particleEffect)}

<style>
${generateDecorationCss(template, params)}
${generateDecorationCompositionCss(asset, svgStyle)}
${particleEffect?.enabled ? generateDecorationParticleCss() : ""}
</style>`;
}

export function generateDecorationMarkup(template: DecorationEffectTemplate, params: DecorationParams = {}, source?: SvgFlowSource, asset?: SvgPreviewAsset, instanceId = "main", particleEffect?: DecorationParticleConfig): string {
  if (template.generator === "panel-border-flow") {
    const cls = decorationClassName(template);
    const panelWidth = Math.max(160, Number(param(params, "panelWidth", 460)));
    const panelHeight = Math.max(100, Number(param(params, "panelHeight", 240)));
    const radius = Math.max(0, Number(param(params, "radius", 6)));
    const cornerLength = Math.max(8, Math.min(48, Number(param(params, "cornerLength", 18)), panelWidth * .14, panelHeight * .24));
    const headerWidth = Math.max(60, Math.min(Number(param(params, "headerWidth", 160)), panelWidth * .52));
    const flowLength = Math.max(8, Math.min(48, Number(param(params, "flowLength", 24))));
    const lineWidth = Math.max(.5, Number(param(params, "borderWidth", 1.4)));
    const glowRatio = Math.max(0, Math.min(1, Number(param(params, "glowIntensity", 32)) / 100));
    const flowEnabled = String(param(params, "flowEnabled", "on")) !== "off";
    const inset = Math.max(2, lineWidth * 1.5);
    const cut = Number(cornerLength.toFixed(2));
    const frameLeft = Math.max(12, inset + 9);
    const frameRight = panelWidth - Math.max(12, inset + 7);
    const frameTop = Math.max(18, inset + 16);
    const frameBottom = panelHeight - Math.max(12, inset + 9);
    const outerPath = `M ${frameLeft + cut} ${frameTop} H ${frameRight - cut * 1.35} L ${frameRight} ${frameTop + cut} V ${frameBottom - cut} L ${frameRight - cut} ${frameBottom} H ${frameLeft + cut * .72} L ${frameLeft} ${frameBottom - cut * .72} V ${frameTop + cut} Z`;
    const innerInset = 8;
    const innerCut = Math.max(5, cut - 5);
    const innerPath = `M ${frameLeft + innerInset + innerCut} ${frameTop + innerInset} H ${frameRight - innerInset - innerCut * 1.25} L ${frameRight - innerInset} ${frameTop + innerInset + innerCut} V ${frameBottom - innerInset - innerCut} L ${frameRight - innerInset - innerCut} ${frameBottom - innerInset} H ${frameLeft + innerInset + innerCut * .7} L ${frameLeft + innerInset} ${frameBottom - innerInset - innerCut * .7} V ${frameTop + innerInset + innerCut} Z`;
    const rectRadius = Math.max(0, Math.min(radius, (panelWidth - inset * 2) / 2, (panelHeight - inset * 2) / 2));
    const importedFlowPath = `M ${inset + rectRadius} ${inset} H ${panelWidth - inset - rectRadius} Q ${panelWidth - inset} ${inset} ${panelWidth - inset} ${inset + rectRadius} V ${panelHeight - inset - rectRadius} Q ${panelWidth - inset} ${panelHeight - inset} ${panelWidth - inset - rectRadius} ${panelHeight - inset} H ${inset + rectRadius} Q ${inset} ${panelHeight - inset} ${inset} ${panelHeight - inset - rectRadius} V ${inset + rectRadius} Q ${inset} ${inset} ${inset + rectRadius} ${inset} Z`;
    const headerStart = frameLeft + 18;
    const headerEnd = Math.min(frameRight - cut - 72, headerStart + headerWidth);
    const statusStart = Math.max(headerEnd + 48, frameRight - cut - 78);
    const bottomStart = Math.max(frameLeft + cut + 56, panelWidth * .58);
    const leftRailTop = frameTop + Math.max(40, panelHeight * .23);
    const leftRailBottom = frameBottom - Math.max(34, panelHeight * .18);
    const rightRailTop = frameTop + Math.max(62, panelHeight * .34);
    const rightRailBottom = Math.min(frameBottom - 34, rightRailTop + Math.max(42, panelHeight * .22));
    const defaultStructure = `<svg class="${cls}__structure" viewBox="0 0 ${panelWidth} ${panelHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path class="${cls}__frame-shell" d="${outerPath}"></path>
    <path class="${cls}__frame-inner" d="${innerPath}"></path>
    <path class="${cls}__frame-plate" d="M ${headerStart} ${frameTop} H ${headerStart + 14} L ${headerStart + 25} 5 H ${headerEnd} L ${headerEnd + 18} ${frameTop} Z"></path>
    <path class="${cls}__frame-plate" d="M ${bottomStart} ${frameBottom} H ${frameRight - cut - 20} L ${frameRight - 2} ${frameBottom - 22} H ${bottomStart + 48} Z"></path>
    <path class="${cls}__frame-rail" d="M 3 ${leftRailTop + 9} L ${frameLeft} ${leftRailTop} V ${leftRailBottom} L 7 ${leftRailBottom - 12} Z"></path>
    <path class="${cls}__frame-rail" d="M ${frameRight} ${rightRailTop} L ${panelWidth - 3} ${rightRailTop + 12} V ${rightRailBottom - 8} L ${frameRight} ${rightRailBottom} Z"></path>
    <path class="${cls}__frame-corner" d="M ${frameLeft} ${frameTop + cut + 18} V ${frameTop + cut} L ${frameLeft + cut} ${frameTop} H ${frameLeft + cut + 24} M ${frameRight - cut - 22} ${frameTop} H ${frameRight - cut * 1.35} L ${frameRight} ${frameTop + cut} V ${frameTop + cut + 18} M ${frameRight} ${frameBottom - cut - 18} V ${frameBottom - cut} L ${frameRight - cut} ${frameBottom} H ${frameRight - cut - 24} M ${frameLeft + cut + 22} ${frameBottom} H ${frameLeft + cut * .72} L ${frameLeft} ${frameBottom - cut * .72} V ${frameBottom - cut - 18}"></path>
    <path class="${cls}__frame-accent" d="M ${headerEnd + 28} ${frameTop + 8} H ${statusStart - 12} M ${frameLeft + 13} ${frameBottom - 16} H ${bottomStart - 26} L ${bottomStart - 14} ${frameBottom - 6} M ${frameRight - 17} ${frameTop + cut + 34} V ${rightRailTop - 15}"></path>
    <g class="${cls}__frame-tick"><path d="M ${statusStart} ${frameTop + 8} h 13 M ${statusStart + 19} ${frameTop + 8} h 8 M ${statusStart + 33} ${frameTop + 8} h 4"></path><path d="M 7 ${leftRailTop + 25} h 6 M 7 ${leftRailTop + 39} h 6 M 7 ${leftRailTop + 53} h 6"></path><path d="M ${frameRight + 2} ${rightRailTop + 20} h 6 M ${frameRight + 2} ${rightRailTop + 32} h 6"></path></g>
    <rect class="${cls}__frame-block" x="${headerStart + 34}" y="10" width="${Math.max(28, (headerEnd - headerStart) * .28)}" height="3" rx="1.5"></rect>
    <rect class="${cls}__frame-block" x="${bottomStart + 18}" y="${frameBottom - 8}" width="32" height="2" rx="1"></rect>
    <circle class="${cls}__frame-node" cx="${headerStart + 16}" cy="${frameTop - 7}" r="2.5"></circle>
    <circle class="${cls}__frame-node" cx="${statusStart - 20}" cy="${frameTop + 8}" r="2"></circle>
    <circle class="${cls}__frame-node" cx="${frameLeft + 7}" cy="${frameBottom - 17}" r="2"></circle>
  </svg>`;
    const sourceMarkup = asset?.markup ?? defaultStructure;
    const flowPath = asset ? importedFlowPath : outerPath;
    const lastSegment = Math.max(1, borderFlowTrailSegments.length - 1);
    const flowSegments = borderFlowTrailSegments.map((segment, index) => {
      const progress = index / lastSegment;
      const opacity = segment.opacity * (.34 + glowRatio * .66);
      const width = Math.max(.45, lineWidth * segment.widthFactor * .52);
      return `<path class="${cls}__flow-segment${segment.isHead ? ` ${cls}__flow-segment--head` : ""}" d="${flowPath}" pathLength="100" style="--panel-flow-start:${(progress * flowLength).toFixed(3)}px;--panel-flow-opacity:${opacity.toFixed(3)};--panel-flow-width:${width.toFixed(2)}px"></path>`;
    }).join("\n    ");
    const flowMarkup = flowEnabled ? `<svg class="${cls}__svg" viewBox="0 0 ${panelWidth} ${panelHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path class="${cls}__flow-track" d="${flowPath}"></path>
    ${flowSegments}
  </svg>` : "";
    return `<div class="${cls}" aria-label="${escapeHtml(template.name)}">
  <div class="${cls}__source">${sourceMarkup}</div>
  ${flowMarkup}
  ${generateDecorationParticleMarkup(particleEffect, String(param(params, "color", DECORATION_BLUE)))}
</div>`;
  }

  if (template.generator === "flow-marker") {
    const cls = decorationClassName(template);
    const requestedShape = String(param(params, "shape", "triangle"));
    const shape = requestedShape === "custom-svg" && !asset ? "triangle" : requestedShape;
    const assetClass = asset && shape === "custom-svg" ? " flow-marker-imported-svg" : "";
    const shapeMarkup = asset && shape === "custom-svg" ? asset.markup : "";
    return `<div class="${cls}" data-shape="${escapeHtml(shape)}" aria-hidden="true"><span class="${cls}__runner"><i class="${cls}__tail"></i><i class="${cls}__mark${assetClass}">${shapeMarkup}</i></span>${generateDecorationParticleMarkup(particleEffect, String(param(params, "color", DECORATION_BLUE)))}</div>`;
  }

  if (template.generator === "flow-marker-sequence") {
    const cls = decorationClassName(template);
    const requestedShape = String(param(params, "shape", "triangle"));
    const shape = requestedShape === "custom-svg" && !asset ? "triangle" : requestedShape;
    const markerCount = Math.max(2, Math.min(8, Math.round(Number(param(params, "markerCount", 3)))));
    const direction = String(param(params, "direction", "ltr"));
    const reverseOrder = direction === "rtl" || direction === "btt";
    const items = Array.from({ length: markerCount }, (_, index) => {
      const markerIndex = reverseOrder ? markerCount - index - 1 : index;
      const importedSvg = asset && shape === "custom-svg"
        ? namespaceSvgContent(asset.markup, `${cls}-${instanceId}-${index}`).content
        : "";
      const assetClass = importedSvg ? " sequence-marker-imported-svg" : "";
      return `<span class="${cls}__item" style="--marker-index:${markerIndex}"><i class="${cls}__mark${assetClass}">${importedSvg}</i></span>`;
    }).join("");
    return `<div class="${cls}" data-shape="${escapeHtml(shape)}" data-direction="${escapeHtml(direction)}" aria-hidden="true">${items}${generateDecorationParticleMarkup(particleEffect, String(param(params, "color", DECORATION_BLUE)))}</div>`;
  }

  if (template.generator === "corner-focus") {
    const cls = decorationClassName(template);
    const requestedStyle = String(param(params, "cornerStyle", "angle"));
    const cornerStyle = requestedStyle === "custom-svg" && !asset ? "angle" : requestedStyle;
    const cornerCount = String(param(params, "cornerCount", "four"));
    const positions = ["tl", "tr", "br", "bl"];
    const corners = positions.map((position, index) => {
      const importedSvg = asset && cornerStyle === "custom-svg"
        ? namespaceSvgContent(asset.markup, `${cls}-${instanceId}-${index}`).content
        : "";
      return `<span class="${cls}__corner ${cls}__corner--${position}"><i class="${cls}__point"></i><i class="${cls}__custom corner-focus-imported-svg">${importedSvg}</i></span>`;
    }).join("");
    return `<div class="${cls}" data-style="${escapeHtml(cornerStyle)}" data-count="${escapeHtml(cornerCount)}" aria-hidden="true">${corners}${generateDecorationParticleMarkup(particleEffect, String(param(params, "color", DECORATION_BLUE)))}</div>`;
  }

  if (template.generator === "connection-flow") {
    const cls = decorationClassName(template);
    const geometry = connectionFlowGeometry(params);
    const endpointStyle = String(param(params, "endpointStyle", "dot"));
    const direction = String(param(params, "direction", "ltr"));
    const reverse = direction === "rtl" || direction === "btt";
    const duration = Math.max(0.4, Number(param(params, "duration", 2.4)));
    const flowCount = Math.max(1, Math.min(5, Math.round(Number(param(params, "flowCount", 2)))));
    const trailLength = Math.max(4, Math.min(30, Number(param(params, "trailLength", 14))));
    const lineWidth = Math.max(0.5, Number(param(params, "lineWidth", 1.5)));
    const endpointRadius = endpointStyle === "ring" ? Math.max(3.5, lineWidth * 3) : Math.max(2.5, lineWidth * 2.2);
    const flowSegments = Array.from({ length: flowCount }, (_, index) => {
      const begin = -duration * index / flowCount;
      const from = reverse ? 0 : 100;
      const to = reverse ? 100 : 0;
      const animation = `<animate attributeName="stroke-dashoffset" from="${from}" to="${to}" dur="${duration.toFixed(2)}s" begin="${begin.toFixed(2)}s" repeatCount="indefinite" calcMode="linear"></animate>`;
      return `<path class="${cls}__flow-glow" d="${geometry.path}" pathLength="100" stroke-dasharray="${trailLength} ${100 - trailLength}" stroke-dashoffset="${from}">${animation}</path><path class="${cls}__flow-core" d="${geometry.path}" pathLength="100" stroke-dasharray="${trailLength} ${100 - trailLength}" stroke-dashoffset="${from}">${animation}</path>`;
    }).join("");
    return `<div class="${cls}" data-endpoint="${escapeHtml(endpointStyle)}" aria-hidden="true"><svg class="${cls}__svg" viewBox="0 0 ${geometry.width.toFixed(1)} ${geometry.height.toFixed(1)}"><path class="${cls}__track" d="${geometry.path}"></path>${flowSegments}<circle class="${cls}__endpoint" cx="${geometry.start.x.toFixed(1)}" cy="${geometry.start.y.toFixed(1)}" r="${endpointRadius.toFixed(1)}"></circle><circle class="${cls}__endpoint" cx="${geometry.end.x.toFixed(1)}" cy="${geometry.end.y.toFixed(1)}" r="${endpointRadius.toFixed(1)}"></circle></svg>${generateDecorationParticleMarkup(particleEffect, String(param(params, "color", DECORATION_BLUE)))}</div>`;
  }

  if (template.generator === "loading-ring") {
    return `<div class="${decorationClassName(template)}" role="status" aria-label="加载中"><span class="${decorationClassName(template)}__arc"></span></div>`;
  }

  if (template.generator === "loading-dots") {
    const dots = Array.from({ length: 5 }, (_, index) => `<i style="--dot-index:${index}"></i>`).join("");
    return `<div class="${decorationClassName(template)}" role="status" aria-label="加载中">${dots}</div>`;
  }

  if (template.generator === "loading-line") {
    return `<div class="${decorationClassName(template)}" role="status" aria-label="加载中"><span class="${decorationClassName(template)}__flow"></span></div>`;
  }

  if (template.generator === "loading-icon-pulse") {
    const iconMarkup = asset?.markup ?? `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="15" fill="${param(params, "color", DECORATION_BLUE)}" fill-opacity=".18"></circle><path d="M24 11.5 35.2 18v12L24 36.5 12.8 30V18L24 11.5Z" stroke="${param(params, "color", DECORATION_BLUE)}" stroke-width="2"></path><circle cx="24" cy="24" r="4.5" fill="${DECORATION_BLUE_LIGHT}"></circle></svg>`;
    const assetClass = asset ? " loading-imported-svg" : "";
    return `<div class="${decorationClassName(template)}" role="status" aria-label="加载中"><span class="${decorationClassName(template)}__halo"></span><span class="${decorationClassName(template)}__icon${assetClass}">${iconMarkup}</span></div>`;
  }

  if (template.generator === "loading-tech-ring") {
    const centerText = escapeHtml(String(param(params, "centerText", "Loading")));
    return `<div class="${decorationClassName(template)}" role="status" aria-label="加载中"><span class="${decorationClassName(template)}__orbit"><span class="${decorationClassName(template)}__inner"></span></span><span class="${decorationClassName(template)}__label">${centerText}</span></div>`;
  }

  if (template.generator === "loading-irregular-ring") {
    const cls = decorationClassName(template);
    const centerText = escapeHtml(String(param(params, "centerText", "LOADING...")));
    return `<div class="${cls}" role="status" aria-label="加载中"><span class="${cls}__ring-frame" aria-hidden="true"><i class="${cls}__ring ${cls}__ring--one"></i><i class="${cls}__ring ${cls}__ring--two"></i><i class="${cls}__ring ${cls}__ring--three"></i></span><span class="${cls}__disc-frame" aria-hidden="true"><i class="${cls}__disc ${cls}__disc--one"></i><i class="${cls}__disc ${cls}__disc--two"></i><i class="${cls}__disc ${cls}__disc--three"></i></span><span class="${cls}__label">${centerText}</span></div>`;
  }

  if (template.generator === "loading-hex-tech-ring") {
    const cls = decorationClassName(template);
    const cells = [
      [209.02, 207.52],
      [254.02, 288.52],
      [115.02, 206.52],
      [160.02, 126.52],
      [255.02, 126.52],
      [159.02, 287.52],
      [300.02, 208.52]
    ].map(([x, y], index) => {
      const points = [
        [x, y - 49.42],
        [x + 42.8, y - 24.71],
        [x + 42.8, y + 24.71],
        [x, y + 49.42],
        [x - 42.8, y + 24.71],
        [x - 42.8, y - 24.71]
      ].map((point) => point.map((value) => value.toFixed(2)).join(",")).join(" ");
      return `<polygon class="${cls}__cell" style="--cell-index:${index}" points="${points}"></polygon>`;
    }).join("");
    return `<div class="${cls}" role="status" aria-label="加载中"><svg class="${cls}__svg" viewBox="0 0 415.04 415.04" aria-hidden="true"><circle class="${cls}__ring ${cls}__ring--inner" cx="207.52" cy="207.52" r="198"></circle><circle class="${cls}__ring ${cls}__ring--outer" cx="207.52" cy="207.52" r="174"></circle><g class="${cls}__cells">${cells}</g></svg></div>`;
  }

  if (template.id === "svg-flow-double-guide") {
    return generateBackgroundSweepMarkup(
      decorationClassName(template),
      svgFlowConfig(params),
      source ?? defaultSvgFlowSource(),
      instanceId,
      Number(param(params, "lightIntensity", 85)),
      String(param(params, "waveColor", DECORATION_BLUE)),
      Number(param(params, "flowAmplitude", 4.5)),
      Number(param(params, "flowFocusPosition", 14)),
      Number(param(params, "flowLeftEndWidth", 85)),
      Number(param(params, "flowRightEndWidth", 25)),
      String(param(params, "sourceVisibility", "show")) !== "flow-only",
      particleEffect
    );
  }

  if (template.generator === "svg-flow") {
    const cls = decorationClassName(template);
    const config = svgFlowConfig(params);
    const currentSource = source ?? defaultSvgFlowSource();
    const total = Math.max(0.1, config.duration + config.pause);
    const [, , viewBoxWidth = 1000, viewBoxHeight = 180] = currentSource.viewBox.split(/[\s,]+/).map(Number);
    const sourceWidth = Number(currentSource.width || viewBoxWidth || 1000);
    const sourceHeight = Number(currentSource.height || viewBoxHeight || 180);
    const legacyPathId = `${cls}-${instanceId}-legacy-path`;
    const showSource = String(param(params, "sourceVisibility", "show")) !== "flow-only";
    const rawTargets = currentSource.targets?.length
      ? currentSource.targets
      : [{ id: legacyPathId, label: currentSource.fileName, enabled: true, direction: config.direction, delay: 0 }];
    const rawContent = currentSource.content ?? currentSource.shape.replace(/^<([^\s>]+)/, `<$1 id="${legacyPathId}"`);
    const namespaced = namespaceSvgContent(rawContent, `${cls}-${instanceId}-source`);
    const sourceParts = splitSvgDefinitions(namespaced.content);
    const hasMultipleTargets = rawTargets.length > 1;
    const targets = rawTargets.filter((target) => target.enabled).map((target, index) => ({
      ...target,
      id: namespaced.ids.get(target.id) ?? target.id,
      direction: hasMultipleTargets ? (target.direction ?? config.direction) : config.direction,
      delay: hasMultipleTargets ? Number(target.delay ?? 0) : 0,
      index
    }));
    const overlays = targets.map((target) => {
      const pathConfig = { ...config, direction: target.direction };
      const metrics = svgFlowMetrics(currentSource.viewBox, pathConfig, target.region);
      const pad = Math.max(config.tail, config.glow * 2, 24);
      const maskX = metrics.x - pad;
      const maskY = metrics.y - pad;
      const maskWidth = metrics.width + pad * 2;
      const maskHeight = metrics.height + pad * 2;
      const rect = metrics.axis === "x"
        ? `x="${metrics.start}" y="${maskY}" width="${config.tail}" height="${maskHeight}"`
        : `x="${maskX}" y="${metrics.start}" width="${maskWidth}" height="${config.tail}"`;
      const maskId = `${cls}-${instanceId}-mask-${target.index}`;
      const clipId = `${cls}-${instanceId}-clip-${target.index}`;
      const easingSpline = config.easing === "ease-in"
        ? "0.42 0 1 1"
        : config.easing === "ease-out"
          ? "0 0 0.58 1"
          : "0.42 0 0.58 1";
      const hasPause = config.pause > 0.0001;
      const animationValues = hasPause
        ? `${metrics.start};${metrics.finish};${metrics.finish}`
        : `${metrics.start};${metrics.finish}`;
      const animationKeyTimes = hasPause
        ? `0;${(config.duration / total).toFixed(3)};1`
        : "0;1";
      const animationTiming = config.easing === "linear"
        ? 'calcMode="linear"'
        : `calcMode="spline" keySplines="${hasPause ? `${easingSpline};0 0 1 1` : easingSpline}"`;
      return {
        defs: `${target.region ? `<clipPath id="${clipId}"><rect x="${metrics.x}" y="${metrics.y}" width="${metrics.width}" height="${metrics.height}"></rect></clipPath>` : ""}
      <linearGradient id="${maskId}-gradient" ${metrics.gradient}>
        <stop offset="0" stop-color="#FFFFFF" stop-opacity="0"></stop>
        <stop offset="0.36" stop-color="#FFFFFF" stop-opacity="0.2"></stop>
        <stop offset="0.74" stop-color="#FFFFFF" stop-opacity="0.78"></stop>
        <stop offset="1" stop-color="#FFFFFF"></stop>
      </linearGradient>
      <mask id="${maskId}" maskUnits="userSpaceOnUse" x="${maskX}" y="${maskY}" width="${maskWidth}" height="${maskHeight}">
        <rect ${rect} fill="url(#${maskId}-gradient)">
          <animate attributeName="${metrics.axis}" values="${animationValues}" keyTimes="${animationKeyTimes}" ${animationTiming} dur="${total}s" begin="${target.delay}s" repeatCount="indefinite"></animate>
        </rect>
      </mask>`,
        use: `${showSource ? `<use href="#${target.id}" class="${cls}__track"${target.region ? ` clip-path="url(#${clipId})"` : ""}></use>\n    ` : ""}<use href="#${target.id}" class="${cls}__tail" mask="url(#${maskId})"${target.region ? ` clip-path="url(#${clipId})"` : ""}></use>
    <use href="#${target.id}" class="${cls}__path" mask="url(#${maskId})"${target.region ? ` clip-path="url(#${clipId})"` : ""}></use>`
      };
    });

    return `<div class="${cls}" style="width:${sourceWidth}px;aspect-ratio:${sourceWidth}/${sourceHeight}" aria-label="${currentSource.fileName}">
  <svg class="${cls}__svg" viewBox="${currentSource.viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      ${sourceParts.definitions}
      ${showSource ? "" : sourceParts.visual}
      ${overlays.map((item) => item.defs).join("\n      ")}
    </defs>
    ${showSource ? sourceParts.visual : ""}
    ${overlays.map((item) => item.use).join("\n    ")}
  </svg>
  ${generateDecorationParticleMarkup(particleEffect, config.tailColor)}
</div>`;
  }

  if (template.generator === "comet-flow") {
    const cls = decorationClassName(template);
    return composeDecoration(`<div class="${cls}" aria-hidden="true">
  <svg class="${cls}__svg" viewBox="0 0 3840 130" preserveAspectRatio="none" fill="none">
    <defs>
      <path id="${cls}-path" d="M3840 2H2722.2C2670.59 2 2622.3 27.4476 2593.12 70.0193C2567.97 106.709 2530.28 128 2490.49 128H1349.51C1309.72 128 1272.03 106.709 1246.88 70.0193C1217.7 27.4476 1169.41 2 1117.8 2H0"></path>
      <linearGradient id="${cls}-color" x1="0" y1="65" x2="3840" y2="65" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="${DECORATION_BLUE}"></stop>
        <stop class="${cls}__color" offset="0.42"></stop>
        <stop offset="0.58" stop-color="${DECORATION_BLUE_LIGHT}"></stop>
        <stop offset="1" stop-color="#005FD1"></stop>
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
</div>`, asset);
  }

  if (template.generator === "particle-base") {
    const cls = decorationClassName(template);
    const segments = particleRingSegments(cls);
    const particles = Array.from({ length: 8 }, () => "<b></b>").join("");
    return composeDecoration(`<div class="${cls}" aria-hidden="true">
  <div class="${cls}__halo"></div>
  <svg class="${cls}__ring" viewBox="0 0 200 200" focusable="false">
    <circle class="${cls}__ring-outline" cx="100" cy="100" r="91"></circle>
    <g class="${cls}__segments">${segments}</g>
  </svg>
  <div class="${cls}__core"></div>
  <div class="${cls}__particles">${particles}</div>
</div>`, asset);
  }

  return composeDecoration(`<div class="${decorationClassName(template)}"></div>`, asset);
}

export function generateDecorationVue(template: DecorationEffectTemplate, params: DecorationParams, source?: SvgFlowSource, asset?: SvgPreviewAsset, svgStyle?: SvgStyleConfig): string {
  return `<template>
  ${generateDecorationMarkup(template, params, source, asset)}
</template>

<style scoped>
${generateDecorationCss(template, params)}
${generateDecorationCompositionCss(asset, svgStyle)}
</style>`;
}

export function generateDecorationJson(template: DecorationEffectTemplate, params: DecorationParams, source?: SvgFlowSource, asset?: SvgPreviewAsset, svgStyle?: SvgStyleConfig): string {
  return JSON.stringify(
    {
      id: template.id,
      name: template.name,
      section: template.section,
      description: template.description,
      scene: template.scene,
      params,
      svgSource: template.generator === "svg-flow" && source ? source : undefined,
      importedSvg: template.generator !== "svg-flow" && asset ? asset : undefined,
      svgStyle: asset ? svgStyle : undefined
    },
    null,
    2
  );
}
