import type { DecorationEffectTemplate, DecorationSection } from "@/types/decoration";

const DECORATION_BLUE = "#0070F3";
const DECORATION_BLUE_LIGHT = "#7AB8FF";
const DECORATION_BLUE_DARK = "#003B82";

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
  duration: { key: "duration", label: "流动时长", type: "number" as const, min: 1, max: 16, step: 0.1, unit: "s" },
  pause: { key: "pause", label: "间隔时间", type: "number" as const, min: 0, max: 8, step: 0.1, unit: "s" },
  tail: { key: "tail", label: "拖尾长度", type: "number" as const, min: 40, max: 2000, step: 10, unit: "px" },
  borderWidth: { key: "borderWidth", label: "流光线宽", type: "number" as const, min: 1, max: 6, step: 1, unit: "px" },
  headColor: { key: "headColor", label: "头部颜色", type: "color" as const },
  tailColor: { key: "tailColor", label: "拖尾颜色", type: "color" as const },
  endColor: { key: "endColor", label: "尾端颜色", type: "color" as const }
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
    name: "路径流光",
    section: "线性流光",
    description: "沿默认弧线路径或导入的 SVG 路径生成连续渐变流光。",
    scene: "大屏顶栏、标题装饰、地图连线、面板边线",
    defaultParams: {
      direction: "ltr",
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
