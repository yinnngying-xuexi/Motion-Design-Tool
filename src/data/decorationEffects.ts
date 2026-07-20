import type { DecorationEffectTemplate, DecorationSection } from "@/types/decoration";

const commonParams = {
  color: { key: "color", label: "主色", type: "color" as const },
  duration: { key: "duration", label: "动效时长", type: "number" as const, min: 0.4, max: 8, step: 0.1, unit: "s" },
  opacity: { key: "opacity", label: "透明度", type: "number" as const, min: 0.1, max: 1, step: 0.05 },
  glow: { key: "glow", label: "发光强度", type: "number" as const, min: 0, max: 64, step: 1, unit: "px" },
  size: { key: "size", label: "尺寸", type: "number" as const, min: 48, max: 260, step: 1, unit: "px" },
  borderWidth: { key: "borderWidth", label: "线宽", type: "number" as const, min: 1, max: 10, step: 1, unit: "px" }
};

const linearParams = {
  size: { key: "size", label: "轨道长度", type: "number" as const, min: 180, max: 520, step: 1, unit: "px" },
  borderWidth: { key: "borderWidth", label: "轨道线宽", type: "number" as const, min: 1, max: 4, step: 1, unit: "px" }
};

const cometParams = {
  size: { key: "size", label: "轨道长度", type: "number" as const, min: 280, max: 720, step: 1, unit: "px" },
  duration: { key: "duration", label: "巡航时长", type: "number" as const, min: 2, max: 24, step: 0.5, unit: "s" }
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
  pause: { key: "pause", label: "间隔时间", type: "number" as const, min: 0, max: 8, step: 0.1, unit: "s" },
  tail: { key: "tail", label: "拖尾长度", type: "number" as const, min: 40, max: 2000, step: 10, unit: "px" },
  headColor: { key: "headColor", label: "头部颜色", type: "color" as const },
  tailColor: { key: "tailColor", label: "拖尾颜色", type: "color" as const },
  endColor: { key: "endColor", label: "尾端颜色", type: "color" as const }
};

export const decorationSections: DecorationSection[] = ["图标底座", "线性流光", "扫描装饰", "边框光效"];

export const decorationEffects: DecorationEffectTemplate[] = [
  {
    id: "base-orbit-ring",
    name: "环形图标底座",
    section: "图标底座",
    description: "适合地图点位、设备状态图标和指标徽章的环形底座。",
    scene: "地图点位、设备图标、状态徽章",
    defaultParams: {
      size: 128,
      color: "#0070F3",
      duration: 2.4,
      opacity: 0.92,
      glow: 18,
      borderWidth: 1
    },
    editableParams: [commonParams.size, commonParams.color, commonParams.duration, commonParams.opacity, commonParams.glow, commonParams.borderWidth],
    previewType: "base-ring",
    generator: "base-ring"
  },
  {
    id: "base-diamond-pulse",
    name: "菱形脉冲底座",
    section: "图标底座",
    description: "带有轻微旋转和脉冲的菱形底座，用于高亮关键点位。",
    scene: "重点点位、告警设备、核心指标",
    defaultParams: {
      size: 118,
      color: "#0070F3",
      duration: 1.8,
      opacity: 0.86,
      glow: 24,
      borderWidth: 1
    },
    editableParams: [commonParams.size, commonParams.color, commonParams.duration, commonParams.opacity, commonParams.glow, commonParams.borderWidth],
    previewType: "base-ring",
    generator: "base-ring"
  },
  {
    id: "base-particle-star-ring",
    name: "星环粒子底座",
    section: "图标底座",
    description: "分段星环在底座中心持续旋转，上方粒子缓慢升起，适合高等级设备与核心点位。",
    scene: "核心设备、重点点位、智能中枢",
    defaultParams: {
      size: 188,
      color: "#0070F3",
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
    id: "linear-edge-flow",
    name: "水平线性流光",
    section: "线性流光",
    description: "沿水平线段运行的流光，可用于标题下划线和数据分割线。",
    scene: "标题装饰、分割线、路径提示",
    defaultParams: {
      size: 420,
      color: "#0070F3",
      duration: 2.8,
      opacity: 1,
      glow: 22,
      borderWidth: 1
    },
    editableParams: [linearParams.size, commonParams.color, commonParams.duration, commonParams.opacity, commonParams.glow, linearParams.borderWidth],
    previewType: "linear-flow",
    generator: "linear-flow"
  },
  {
    id: "linear-corner-flow",
    name: "折线路径流光",
    section: "线性流光",
    description: "沿折线路径穿梭的流光效果，适合模块连接和流程路径。",
    scene: "路径连接、流程节点、模块指向",
    defaultParams: {
      size: 360,
      color: "#0070F3",
      duration: 3.2,
      opacity: 1,
      glow: 20,
      borderWidth: 1
    },
    editableParams: [linearParams.size, commonParams.color, commonParams.duration, commonParams.opacity, commonParams.glow, linearParams.borderWidth],
    previewType: "linear-flow",
    generator: "linear-flow"
  },
  {
    id: "linear-arc-comet",
    name: "弧形彗星流光",
    section: "线性流光",
    description: "彗星光点沿对称下凹弧线巡航，带白色高光与青蓝渐隐光尾。",
    scene: "大屏顶栏、模块衔接、全宽装饰线",
    defaultParams: {
      size: 520,
      color: "#55E6FF",
      duration: 12,
      opacity: 1,
      glow: 18,
      borderWidth: 3
    },
    editableParams: [cometParams.size, commonParams.color, cometParams.duration, commonParams.opacity, commonParams.glow, linearParams.borderWidth],
    previewType: "comet-flow",
    generator: "comet-flow"
  },
  {
    id: "svg-flow-tool",
    name: "SVG流光工具",
    section: "线性流光",
    description: "上传 SVG 线条后，沿图形路径生成可调节的流光效果。",
    scene: "标题装饰、路径引导、地图连线、面板边线",
    defaultParams: {
      direction: "ltr",
      duration: 7.5,
      pause: 2,
      tail: 820,
      borderWidth: 3,
      glow: 12,
      headColor: "#FFFFFF",
      tailColor: "#0070F3",
      endColor: "#8F8F8F"
    },
    editableParams: [
      svgFlowParams.direction,
      cometParams.duration,
      svgFlowParams.pause,
      svgFlowParams.tail,
      linearParams.borderWidth,
      commonParams.glow,
      svgFlowParams.headColor,
      svgFlowParams.tailColor,
      svgFlowParams.endColor
    ],
    previewType: "svg-flow",
    generator: "svg-flow"
  },
  {
    id: "panel-scan-line",
    name: "面板扫描线",
    section: "扫描装饰",
    description: "垂直扫描线穿过面板区域，用于表达实时巡检和刷新。",
    scene: "图表容器、监控面板、巡检区域",
    defaultParams: {
      size: 180,
      color: "#0070F3",
      duration: 2,
      opacity: 0.8,
      glow: 14,
      borderWidth: 1
    },
    editableParams: [commonParams.size, commonParams.color, commonParams.duration, commonParams.opacity, commonParams.glow, commonParams.borderWidth],
    previewType: "scan",
    generator: "scan"
  },
  {
    id: "radar-scan",
    name: "雷达扫描",
    section: "扫描装饰",
    description: "圆形区域中的旋转扫描效果，适合地图局部监测。",
    scene: "地图区域、雷达态势、监测半径",
    defaultParams: {
      size: 160,
      color: "#0070F3",
      duration: 3.2,
      opacity: 0.75,
      glow: 18,
      borderWidth: 1
    },
    editableParams: [commonParams.size, commonParams.color, commonParams.duration, commonParams.opacity, commonParams.glow, commonParams.borderWidth],
    previewType: "scan",
    generator: "scan"
  },
  {
    id: "card-border-glow",
    name: "卡片边框光效",
    section: "边框光效",
    description: "数据卡片边框的呼吸发光，用于强调重点模块。",
    scene: "数据卡片、重点模块、图表容器",
    defaultParams: {
      size: 210,
      color: "#0070F3",
      duration: 2.4,
      opacity: 1,
      glow: 22,
      borderWidth: 1
    },
    editableParams: [commonParams.size, commonParams.color, commonParams.duration, commonParams.opacity, commonParams.glow, commonParams.borderWidth],
    previewType: "border-glow",
    generator: "border-glow"
  },
  {
    id: "corner-bracket-glow",
    name: "角标边框光效",
    section: "边框光效",
    description: "四角角标增强容器科技感，适合面板外框和标题块。",
    scene: "面板外框、标题模块、重点容器",
    defaultParams: {
      size: 190,
      color: "#0070F3",
      duration: 2.6,
      opacity: 1,
      glow: 20,
      borderWidth: 2
    },
    editableParams: [commonParams.size, commonParams.color, commonParams.duration, commonParams.opacity, commonParams.glow, commonParams.borderWidth],
    previewType: "border-glow",
    generator: "border-glow"
  }
];
