import type { DecorationEffectTemplate, DecorationSection } from "@/types/decoration";

const DECORATION_BLUE = "#0070F3";
const DECORATION_BLUE_LIGHT = "#7AB8FF";
const DECORATION_BLUE_DARK = "#003B82";
const FLOW_GREEN = "#10B981";
const FLOW_GREEN_LIGHT = "#A7F3D0";
const FLOW_GREEN_DARK = "#064E3B";

const commonParams = {
  color: { key: "color", label: "主色", type: "color" as const },
  duration: { key: "duration", label: "动效时长", type: "number" as const, min: 0.4, max: 8, step: 0.1, unit: "s" },
  opacity: { key: "opacity", label: "透明度", type: "number" as const, min: 0.1, max: 1, step: 0.05 },
  glow: { key: "glow", label: "发光强度", type: "number" as const, min: 0, max: 64, step: 1, unit: "px" },
  size: { key: "size", label: "尺寸", type: "number" as const, min: 48, max: 260, step: 1, unit: "px" },
  borderWidth: { key: "borderWidth", label: "线宽", type: "number" as const, min: 1, max: 10, step: 1, unit: "px" }
};

const svgFlowParams = {
  direction: {
    key: "direction",
    label: "流动方向",
    type: "select" as const,
    options: [
      { label: "从左到右", value: "ltr" },
      { label: "从右到左", value: "rtl" },
      { label: "从上到下", value: "ttb" },
      { label: "从下到上", value: "btt" }
    ]
  },
  easing: {
    key: "easing",
    label: "速度变化",
    type: "select" as const,
    options: [
      { label: "匀速", value: "linear" },
      { label: "缓入", value: "ease-in" },
      { label: "缓出", value: "ease-out" },
      { label: "缓入缓出", value: "ease-in-out" }
    ]
  },
  duration: { key: "duration", label: "流动时长", type: "number" as const, min: 1, max: 16, step: 0.1, unit: "s" },
  pause: { key: "pause", label: "流光间隔", type: "number" as const, min: 0, max: 8, step: 0.1, unit: "s" },
  tail: { key: "tail", label: "拖尾长度", type: "number" as const, min: 40, max: 2000, step: 10, unit: "px" },
  borderWidth: { key: "borderWidth", label: "流光线宽", type: "number" as const, min: 1, max: 6, step: 1, unit: "px" },
  headColor: { key: "headColor", label: "流光高亮色", type: "color" as const },
  tailColor: { key: "tailColor", label: "拖尾颜色", type: "color" as const },
  endColor: { key: "endColor", label: "底轨颜色", type: "color" as const }
};

export const decorationSections: DecorationSection[] = ["图标底座", "线性流光"];

export const decorationEffects: DecorationEffectTemplate[] = [
  {
    id: "base-particle-star-ring",
    name: "星环粒子底座",
    section: "图标底座",
    description: "分段星环在底座中心持续旋转，上方粒子缓慢升起，适合高等级设备与核心点位。",
    scene: "核心设备、重点点位、智能中枢",
    defaultParams: {
      size: 188,
      color: DECORATION_BLUE,
      duration: 4.2,
      opacity: 1,
      glow: 22,
      borderWidth: 1
    },
    editableParams: [commonParams.size, commonParams.color, commonParams.duration, commonParams.opacity, commonParams.glow, commonParams.borderWidth],
    previewType: "particle-base",
    generator: "particle-base"
  },
  {
    id: "svg-flow-tool",
    name: "路径流光01",
    section: "线性流光",
    description: "沿标题装饰路径生成连续渐变流光，也可导入同类 SVG 替换系统案例。",
    scene: "大屏顶部标题、底部装饰、横向标题栏",
    defaultParams: {
      direction: "ltr",
      easing: "linear",
      duration: 5,
      pause: 0.8,
      tail: 420,
      borderWidth: 3,
      glow: 14,
      headColor: FLOW_GREEN_LIGHT,
      tailColor: FLOW_GREEN,
      endColor: FLOW_GREEN_DARK
    },
    editableParams: [
      svgFlowParams.direction,
      svgFlowParams.easing,
      svgFlowParams.duration,
      svgFlowParams.pause,
      svgFlowParams.tail,
      svgFlowParams.borderWidth,
      commonParams.glow,
      svgFlowParams.headColor,
      svgFlowParams.tailColor,
      svgFlowParams.endColor
    ],
    previewType: "svg-flow",
    generator: "svg-flow"
  },
  {
    id: "svg-flow-tool-02",
    name: "路径流光02",
    section: "线性流光",
    description: "两侧流光沿标题装饰路径向中间聚拢，可导入同结构 SVG 替换系统案例。",
    scene: "大屏顶部标题、底部装饰、横向标题栏",
    defaultParams: {
      direction: "ltr",
      easing: "linear",
      duration: 5,
      pause: 0.8,
      tail: 420,
      borderWidth: 3,
      glow: 14,
      headColor: DECORATION_BLUE_LIGHT,
      tailColor: DECORATION_BLUE,
      endColor: DECORATION_BLUE_DARK
    },
    editableParams: [
      svgFlowParams.direction,
      svgFlowParams.easing,
      svgFlowParams.duration,
      svgFlowParams.pause,
      svgFlowParams.tail,
      svgFlowParams.borderWidth,
      commonParams.glow,
      svgFlowParams.headColor,
      svgFlowParams.tailColor,
      svgFlowParams.endColor
    ],
    previewType: "svg-flow",
    generator: "svg-flow"
  }
];
