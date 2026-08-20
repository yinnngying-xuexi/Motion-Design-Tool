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
  sourceVisibility: {
    key: "sourceVisibility",
    label: "隐藏原素材",
    type: "select" as const,
    options: [
      { label: "显示", value: "show" },
      { label: "隐藏（仅流光）", value: "flow-only" }
    ]
  },
  tail: { key: "tail", label: "拖尾长度", type: "number" as const, min: 40, max: 2000, step: 10, unit: "px" },
  borderWidth: { key: "borderWidth", label: "流光线宽", type: "number" as const, min: 1, max: 6, step: 1, unit: "px" },
  headColor: { key: "headColor", label: "流光高亮色", type: "color" as const },
  tailColor: { key: "tailColor", label: "拖尾颜色", type: "color" as const },
  endColor: { key: "endColor", label: "底轨颜色", type: "color" as const }
};

const backgroundSweepParams = {
  intensity: { key: "lightIntensity", label: "光效强度", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" },
  amplitude: { key: "flowAmplitude", label: "流动幅度", type: "number" as const, min: 0, max: 14, step: 0.5, unit: "px" },
  focusPosition: { key: "flowFocusPosition", label: "宽幅位置", type: "number" as const, min: 0, max: 100, step: 1, unit: "%" },
  leftEndWidth: { key: "flowLeftEndWidth", label: "左端宽度", type: "number" as const, min: 5, max: 100, step: 5, unit: "%" },
  rightEndWidth: { key: "flowRightEndWidth", label: "右端宽度", type: "number" as const, min: 5, max: 100, step: 5, unit: "%" }
};

const subtitleSweepParams = {
  duration: { key: "duration", label: "移动时长", type: "number" as const, min: 0.8, max: 8, step: 0.1, unit: "s" },
  pause: { key: "pause", label: "循环间隔", type: "number" as const, min: 0, max: 6, step: 0.1, unit: "s" },
  easing: svgFlowParams.easing,
  shape: {
    key: "sweepShape",
    label: "扫光形状",
    type: "select" as const,
    options: [
      { label: "弧形", value: "arc" },
      { label: "椭圆", value: "oval" },
      { label: "柔光带", value: "soft-band" }
    ]
  },
  startColor: { key: "sweepStartColor", label: "渐变起色", type: "color" as const },
  endColor: { key: "sweepEndColor", label: "渐变终色", type: "color" as const },
  width: { key: "sweepWidth", label: "光效宽度", type: "number" as const, min: 20, max: 140, step: 4, unit: "px" },
  blur: { key: "sweepBlur", label: "边缘模糊", type: "number" as const, min: 0, max: 16, step: 1, unit: "px" },
  intensity: { key: "sweepIntensity", label: "光效强度", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" }
};

const loadingParams = {
  loopDuration: { key: "duration", label: "循环时长", type: "number" as const, min: 0.5, max: 6, step: 0.1, unit: "s" },
  rotationSpeed: { key: "duration", label: "旋转速度", type: "number" as const, min: 0.4, max: 4, step: 0.1, unit: "s" },
  size: { key: "size", label: "尺寸", type: "number" as const, min: 24, max: 180, step: 2, unit: "px" },
  outerSize: { key: "size", label: "外环大小", type: "number" as const, min: 48, max: 220, step: 2, unit: "px" },
  innerSize: { key: "innerSize", label: "内环大小", type: "number" as const, min: 24, max: 190, step: 2, unit: "px" },
  outerWidth: { key: "outerWidth", label: "外环粗细", type: "number" as const, min: 1, max: 12, step: 0.5, unit: "px" },
  innerWidth: { key: "innerWidth", label: "内环粗细", type: "number" as const, min: 1, max: 12, step: 0.5, unit: "px" },
  outerGlow: { key: "outerGlow", label: "外环发光", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" },
  innerGlow: { key: "innerGlow", label: "内环发光", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" },
  glowIntensity: { key: "glowIntensity", label: "发光强度", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" },
  techRotationSpeed: { key: "duration", label: "旋转速度", type: "number" as const, min: 2, max: 20, step: 0.5, unit: "s" },
  techSize: { key: "size", label: "尺寸", type: "number" as const, min: 80, max: 320, step: 10, unit: "px" },
  centerText: { key: "centerText", label: "中心文字", type: "text" as const },
  color: { key: "color", label: "主色", type: "color" as const },
  trackColor: { key: "trackColor", label: "轨道颜色", type: "color" as const },
  lineWidth: { key: "borderWidth", label: "线条宽度", type: "number" as const, min: 1, max: 12, step: 1, unit: "px" },
  direction: {
    key: "direction",
    label: "旋转方向",
    type: "select" as const,
    options: [
      { label: "顺时针", value: "clockwise" },
      { label: "逆时针", value: "counterclockwise" }
    ]
  },
  arcLength: { key: "arcLength", label: "高亮弧长", type: "number" as const, min: 12, max: 75, step: 1, unit: "%" },
  dotCount: { key: "dotCount", label: "圆点数量", type: "number" as const, min: 3, max: 5, step: 1 },
  dotSize: { key: "dotSize", label: "圆点大小", type: "number" as const, min: 3, max: 16, step: 1, unit: "px" },
  gap: { key: "gap", label: "圆点间距", type: "number" as const, min: 4, max: 24, step: 1, unit: "px" },
  minOpacity: { key: "minOpacity", label: "最小透明度", type: "number" as const, min: 0.1, max: 0.8, step: 0.05 },
  lineMode: {
    key: "lineMode",
    label: "加载模式",
    type: "select" as const,
    options: [
      { label: "无限加载", value: "indeterminate" },
      { label: "进度加载", value: "progress" }
    ]
  },
  progress: { key: "progress", label: "当前进度", type: "number" as const, min: 0, max: 100, step: 1, unit: "%" },
  trackWidth: { key: "trackWidth", label: "轨道宽度", type: "number" as const, min: 120, max: 760, step: 20, unit: "px" },
  progressHeight: { key: "borderWidth", label: "进度条高度", type: "number" as const, min: 4, max: 32, step: 1, unit: "px" },
  stripeWidth: { key: "tailLength", label: "斜纹宽度", type: "number" as const, min: 6, max: 40, step: 1, unit: "px" },
  tailLength: { key: "tailLength", label: "流光长度", type: "number" as const, min: 12, max: 60, step: 1, unit: "%" },
  radius: { key: "radius", label: "圆角", type: "number" as const, min: 0, max: 20, step: 1, unit: "px" },
  minScale: { key: "minScale", label: "最小缩放", type: "number" as const, min: 0.8, max: 0.99, step: 0.01 },
  haloEnabled: {
    key: "haloEnabled",
    label: "显示光环",
    type: "select" as const,
    options: [
      { label: "显示", value: "on" },
      { label: "隐藏", value: "off" }
    ]
  },
  haloRange: { key: "haloRange", label: "光环范围", type: "number" as const, min: 4, max: 48, step: 1, unit: "px" },
  haloIntensity: { key: "haloIntensity", label: "光环强度", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" }
};

export const decorationSections: DecorationSection[] = [
  "标题装饰",
  "图表装饰",
  "图标/点位",
  "面板装饰",
  "loading"
];

export const decorationEffects: DecorationEffectTemplate[] = [
  {
    id: "base-particle-star-ring",
    name: "星环粒子底座",
    section: "图标/点位",
    subsection: "图标底座",
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
    name: "单边流光",
    section: "标题装饰",
    subsection: "顶部标题",
    description: "沿标题装饰路径生成连续渐变流光，也可导入同类 SVG 替换系统案例。",
    scene: "大屏顶部标题、底部装饰、横向标题栏",
    defaultParams: {
      direction: "ltr",
      easing: "linear",
      duration: 5,
      pause: 0.8,
      sourceVisibility: "show",
      tail: 420,
      borderWidth: 2,
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
      svgFlowParams.sourceVisibility,
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
    name: "双边流光",
    section: "标题装饰",
    subsection: "顶部标题",
    description: "两侧流光沿标题装饰路径向中间聚拢，可导入同结构 SVG 替换系统案例。",
    scene: "大屏顶部标题、底部装饰、横向标题栏",
    defaultParams: {
      direction: "ltr",
      easing: "linear",
      duration: 5,
      pause: 0.8,
      sourceVisibility: "show",
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
      svgFlowParams.sourceVisibility,
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
    id: "svg-flow-double-guide",
    name: "水波纹流光",
    section: "标题装饰",
    subsection: "顶部标题",
    description: "标题框保持静止，多层蓝青色半透明水流丝带在框内交叠流动。",
    scene: "大屏顶部标题、横向标题框、页面抬头",
    defaultParams: {
      direction: "ltr",
      easing: "linear",
      duration: 5.4,
      pause: 0,
      sourceVisibility: "show",
      lightIntensity: 68,
      flowAmplitude: 9,
      flowFocusPosition: 14,
      flowLeftEndWidth: 85,
      flowRightEndWidth: 25
    },
    editableParams: [
      svgFlowParams.duration,
      svgFlowParams.sourceVisibility,
      backgroundSweepParams.intensity,
      backgroundSweepParams.amplitude,
      backgroundSweepParams.focusPosition,
      backgroundSweepParams.leftEndWidth,
      backgroundSweepParams.rightEndWidth
    ],
    previewType: "svg-flow",
    generator: "svg-flow"
  },
  {
    id: "subtitle-orbit-sweep-01",
    name: "扫光",
    section: "标题装饰",
    subsection: "小标题",
    description: "系统自动在小标题素材内部生成从左向右移动的柔和光效，素材图层可分别绑定基础动效。",
    scene: "大屏小标题、图表模块标题、分区标题",
    defaultParams: {
      duration: 2.8,
      pause: 0.8,
      easing: "ease-out",
      sourceVisibility: "show",
      sweepShape: "oval",
      sweepStartColor: "#4DC9FF",
      sweepEndColor: "#0070F3",
      sweepWidth: 76,
      sweepBlur: 12,
      sweepIntensity: 20
    },
    editableParams: [
      subtitleSweepParams.duration,
      subtitleSweepParams.pause,
      subtitleSweepParams.easing,
      svgFlowParams.sourceVisibility,
      subtitleSweepParams.shape,
      subtitleSweepParams.startColor,
      subtitleSweepParams.endColor,
      subtitleSweepParams.width,
      subtitleSweepParams.blur,
      subtitleSweepParams.intensity
    ],
    previewType: "layered-sweep",
    generator: "layered-sweep"
  },
  {
    id: "loading-rotating-ring",
    name: "旋转圆环",
    section: "loading",
    subsection: "通用 Loading",
    description: "低亮度底环配合渐变高亮弧持续旋转，适合页面、弹窗和模块等待。",
    scene: "页面加载、弹窗等待、图表模块",
    defaultParams: {
      duration: 1.2,
      size: 72,
      color: DECORATION_BLUE,
      trackColor: "#26303B",
      borderWidth: 5,
      direction: "clockwise",
      arcLength: 32
    },
    editableParams: [loadingParams.loopDuration, loadingParams.direction, loadingParams.size, loadingParams.lineWidth, loadingParams.arcLength, loadingParams.trackColor, loadingParams.color],
    previewType: "loading",
    generator: "loading-ring"
  },
  {
    id: "loading-sequence-dots",
    name: "点序呼吸",
    section: "loading",
    subsection: "通用 Loading",
    description: "圆点依次放大并变亮，形成轻量、安静且适合小区域使用的等待节奏。",
    scene: "按钮提交、文字等待、局部数据加载",
    defaultParams: {
      duration: 1.2,
      color: DECORATION_BLUE,
      dotCount: 3,
      dotSize: 8,
      gap: 10,
      minOpacity: 0.24
    },
    editableParams: [loadingParams.loopDuration, loadingParams.dotCount, loadingParams.dotSize, loadingParams.gap, loadingParams.minOpacity, loadingParams.color],
    previewType: "loading",
    generator: "loading-dots"
  },
  {
    id: "loading-linear-flow",
    name: "横向进度条",
    section: "loading",
    subsection: "通用 Loading",
    description: "蓝色斜纹在深色横向轨道内持续流动，也可以切换为确定进度展示。",
    scene: "页面加载、文件处理、数据同步",
    defaultParams: {
      duration: 1.2,
      lineMode: "indeterminate",
      progress: 72,
      trackWidth: 720,
      borderWidth: 14,
      tailLength: 20,
      radius: 3,
      trackColor: "#151A22",
      color: DECORATION_BLUE
    },
    editableParams: [loadingParams.loopDuration, loadingParams.lineMode, loadingParams.progress, loadingParams.trackWidth, loadingParams.progressHeight, loadingParams.stripeWidth, loadingParams.radius, loadingParams.trackColor, loadingParams.color],
    previewType: "loading",
    generator: "loading-line"
  },
  {
    id: "loading-icon-pulse",
    name: "图标脉冲",
    section: "loading",
    subsection: "通用 Loading",
    description: "图标轻微呼吸并带柔和扩散光环，可导入项目 SVG 替换默认图标。",
    scene: "品牌启动、设备加载、地图点位",
    defaultParams: {
      duration: 1.8,
      size: 72,
      color: DECORATION_BLUE,
      minScale: 0.92,
      haloEnabled: "on",
      haloRange: 18,
      haloIntensity: 55
    },
    editableParams: [loadingParams.loopDuration, loadingParams.size, loadingParams.minScale, loadingParams.haloEnabled, loadingParams.haloRange, loadingParams.haloIntensity, loadingParams.color],
    previewType: "loading",
    generator: "loading-icon-pulse"
  },
  {
    id: "loading-tech-ring",
    name: "科技环形",
    section: "loading",
    subsection: "通用 Loading",
    description: "双层同心光环以偏心高亮点持续旋转，保留轻量、克制的科技感。",
    scene: "数据图表、可视化模块、科技界面加载",
    defaultParams: {
      duration: 1,
      size: 128,
      innerSize: 102,
      outerWidth: 1,
      innerWidth: 1,
      outerGlow: 72,
      innerGlow: 52,
      centerText: "Loading",
      color: DECORATION_BLUE
    },
    editableParams: [
      loadingParams.centerText,
      loadingParams.rotationSpeed,
      loadingParams.outerSize,
      loadingParams.innerSize,
      loadingParams.outerWidth,
      loadingParams.innerWidth,
      loadingParams.outerGlow,
      loadingParams.innerGlow,
      loadingParams.color
    ],
    previewType: "loading",
    generator: "loading-tech-ring"
  },
  {
    id: "loading-irregular-ring",
    name: "不规则旋转环",
    section: "loading",
    subsection: "通用 Loading",
    description: "三层双侧高亮圆环交错正反转，叠加三层 3D 倾斜圆盘与中央闪烁文字。",
    scene: "科技界面、数据加载、全屏等待",
    defaultParams: {
      duration: 1,
      size: 160,
      borderWidth: 2,
      glowIntensity: 35,
      centerText: "LOADING...",
      color: DECORATION_BLUE
    },
    editableParams: [
      loadingParams.centerText,
      loadingParams.rotationSpeed,
      loadingParams.size,
      loadingParams.lineWidth,
      loadingParams.glowIntensity,
      loadingParams.color
    ],
    previewType: "loading",
    generator: "loading-irregular-ring"
  },
  {
    id: "loading-hex-tech-ring",
    name: "六边形科技环",
    section: "loading",
    subsection: "通用 Loading",
    description: "双层刻度环反向旋转，七枚蜂窝六边形依次缩放显隐并循环，适合可视化系统的模块加载状态。",
    scene: "科技界面、数据模块、系统初始化",
    defaultParams: {
      duration: 10,
      size: 200,
      borderWidth: 2,
      glowIntensity: 64,
      color: DECORATION_BLUE
    },
    editableParams: [
      loadingParams.techRotationSpeed,
      loadingParams.techSize,
      loadingParams.lineWidth,
      loadingParams.glowIntensity,
      loadingParams.color
    ],
    previewType: "loading",
    generator: "loading-hex-tech-ring"
  }
];
