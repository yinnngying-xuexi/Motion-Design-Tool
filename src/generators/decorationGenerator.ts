import type { DecorationEffectTemplate, DecorationParticleConfig } from "@/types/decoration";
import type { SvgFlowConfig, SvgFlowSource, SvgPreviewAsset, SvgStyleConfig } from "@/types/svgFlow";
import { generateDecorationParticleCss, generateDecorationParticleMarkup } from "@/generators/decorationParticleGenerator";
import { generateBackgroundSweepCss, generateBackgroundSweepMarkup } from "@/generators/backgroundSweepGenerator";

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
    const glowRadius = Math.max(0, ringSize * 0.045 * glowStrength);
    const glowFilter = glowRadius > 0
      ? `drop-shadow(-${Math.max(0.5, glowRadius * 0.16).toFixed(1)}px -${Math.max(0.5, glowRadius * 0.16).toFixed(1)}px ${Math.max(1, glowRadius * 0.55).toFixed(1)}px color-mix(in srgb,${color} 78%,transparent)) drop-shadow(0 0 ${glowRadius.toFixed(1)}px color-mix(in srgb,${color} 34%,transparent))`
      : "none";
    return `.${cls}{position:relative;width:${ringSize}px;display:grid;place-items:center;opacity:${opacity};isolation:isolate;color:${color}}
.${cls}__svg{display:block;width:${ringSize}px;height:${ringSize}px;overflow:visible;filter:${glowFilter}}
.${cls}__ring{fill:none;transform-box:fill-box;transform-origin:center;will-change:transform}
.${cls}__ring--inner{stroke:${color};stroke-width:${Math.max(6, ringWidth * 8).toFixed(1)};stroke-dasharray:${Math.max(7, ringWidth * 5).toFixed(1)} ${Math.max(3, ringWidth * 2.4).toFixed(1)};opacity:.9;animation:${kf}Inner ${Number(duration).toFixed(2)}s linear infinite}
.${cls}__ring--outer{stroke:color-mix(in srgb,${color} 64%,#0071bc);stroke-width:${Math.max(4, ringWidth * 6).toFixed(1)};stroke-dasharray:${Math.max(1.5, ringWidth).toFixed(1)} ${Math.max(8, ringWidth * 8).toFixed(1)};opacity:.82;animation:${kf}Outer ${Number(duration).toFixed(2)}s linear infinite}
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
  const svgTargets = ":is(.decoration-composition__svg,.loading-imported-svg)";
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
    return `<div class="${cls}" role="status" aria-label="加载中"><svg class="${cls}__svg" viewBox="0 0 415.04 415.04" aria-hidden="true"><circle class="${cls}__ring ${cls}__ring--inner" cx="207.52" cy="207.52" r="198"></circle><circle class="${cls}__ring ${cls}__ring--outer" cx="207.52" cy="207.52" r="174"></circle><g>${cells}</g></svg></div>`;
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
