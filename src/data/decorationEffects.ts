import type { DecorationEffectTemplate, DecorationSection } from "@/types/decoration";
import { lightDecorations } from "@/data/lightDecorations";
import { referenceLoadings } from "@/data/referenceLoadings";
import { pointReferenceEffects } from "@/data/pointReferenceBases";

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
  titleWidth: { key: "titleWidth", label: "标题宽度", type: "number" as const, min: 80, max: 16384, step: 10, unit: "px" },
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
  color: { key: "waveColor", label: "水波纹颜色", type: "color" as const },
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
      { label: "柔光带", value: "soft-band" },
      { label: "斜矩形", value: "slanted-rect" }
    ]
  },
  startColor: { key: "sweepStartColor", label: "渐变起色", type: "color" as const },
  endColor: { key: "sweepEndColor", label: "渐变终色", type: "color" as const },
  width: { key: "sweepWidth", label: "光效宽度", type: "number" as const, min: 20, max: 140, step: 4, unit: "px" },
  blur: { key: "sweepBlur", label: "边缘模糊", type: "number" as const, min: 0, max: 16, step: 1, unit: "px" },
  intensity: { key: "sweepIntensity", label: "光效强度", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" }
};

const loadingParams = {
  rotationSpeed: { key: "duration", label: "旋转速度", type: "number" as const, min: 0.4, max: 4, step: 0.1, unit: "s" },
  outerSize: { key: "size", label: "外环大小", type: "number" as const, min: 48, max: 220, step: 2, unit: "px" },
  innerSize: { key: "innerSize", label: "内环大小", type: "number" as const, min: 24, max: 190, step: 2, unit: "px" },
  outerWidth: { key: "outerWidth", label: "外环粗细", type: "number" as const, min: 1, max: 12, step: 0.5, unit: "px" },
  innerWidth: { key: "innerWidth", label: "内环粗细", type: "number" as const, min: 1, max: 12, step: 0.5, unit: "px" },
  outerGlow: { key: "outerGlow", label: "外环发光", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" },
  innerGlow: { key: "innerGlow", label: "内环发光", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" },
  centerText: { key: "centerText", label: "中心文字", type: "text" as const },
  showText: { key: "showText", label: "显示文字", type: "select" as const, options: [{ label: "显示", value: "on" }, { label: "隐藏", value: "off" }] },
  color: { key: "color", label: "主色", type: "color" as const },
};

const flowMarkerParams = {
  shape: {
    key: "shape",
    label: "形状",
    type: "select" as const,
    options: [
      { label: "三角形", value: "triangle" },
      { label: "圆形", value: "circle" },
      { label: "正方形", value: "square" },
      { label: "菱形", value: "diamond" },
      { label: "扇形", value: "sector" },
      { label: "自定义 SVG", value: "custom-svg" }
    ]
  },
  size: { key: "size", label: "尺寸", type: "number" as const, min: 6, max: 48, step: 1, unit: "px" },
  color: { key: "color", label: "颜色", type: "color" as const },
  direction: {
    key: "direction",
    label: "移动方向",
    type: "select" as const,
    options: [
      { label: "从左到右", value: "ltr" },
      { label: "从右到左", value: "rtl" },
      { label: "从上到下", value: "ttb" },
      { label: "从下到上", value: "btt" }
    ]
  },
  distance: { key: "distance", label: "移动距离", type: "number" as const, min: 40, max: 600, step: 10, unit: "px" },
  speed: { key: "speed", label: "移动速度", type: "number" as const, min: 30, max: 400, step: 10, unit: "px/s" },
  glowIntensity: { key: "glowIntensity", label: "发光强度", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" },
  tailLength: { key: "tailLength", label: "拖尾长度", type: "number" as const, min: 0, max: 160, step: 4, unit: "px" }
};

const sequenceMarkerParams = {
  markerCount: { key: "markerCount", label: "标记数量", type: "number" as const, min: 2, max: 8, step: 1 },
  markerGap: { key: "markerGap", label: "标记间距", type: "number" as const, min: 0, max: 24, step: 1, unit: "px" },
  duration: { key: "duration", label: "循环时长", type: "number" as const, min: 0.4, max: 4, step: 0.1, unit: "s" },
  pause: { key: "pause", label: "循环间隔", type: "number" as const, min: 0, max: 2, step: 0.1, unit: "s" },
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
  minOpacity: { key: "minOpacity", label: "最低透明度", type: "number" as const, min: 0.05, max: 0.8, step: 0.05 },
  afterglow: { key: "afterglow", label: "余辉衰减", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" }
};

const connectionFlowParams = {
  pathStyle: {
    key: "pathStyle",
    label: "路径样式",
    type: "select" as const,
    options: [
      { label: "直线", value: "straight" },
      { label: "折线", value: "elbow" },
      { label: "曲线", value: "curve" }
    ]
  },
  endpointStyle: {
    key: "endpointStyle",
    label: "端点样式",
    type: "select" as const,
    options: [
      { label: "无端点", value: "none" },
      { label: "圆点", value: "dot" },
      { label: "圆环", value: "ring" }
    ]
  },
  length: { key: "length", label: "连接长度", type: "number" as const, min: 80, max: 720, step: 10, unit: "px" },
  bend: { key: "bend", label: "转折幅度", type: "number" as const, min: 0, max: 160, step: 4, unit: "px" },
  lineWidth: { key: "lineWidth", label: "路径线宽", type: "number" as const, min: 1, max: 6, step: 0.5, unit: "px" },
  trackOpacity: { key: "trackOpacity", label: "路径透明度", type: "number" as const, min: 0.05, max: 0.6, step: 0.05 },
  duration: { key: "duration", label: "流动时长", type: "number" as const, min: 0.6, max: 8, step: 0.1, unit: "s" },
  flowCount: { key: "flowCount", label: "流光数量", type: "number" as const, min: 1, max: 5, step: 1 },
  trailLength: { key: "trailLength", label: "流光长度", type: "number" as const, min: 4, max: 30, step: 1, unit: "%" }
};

const panelBorderFlowParams = {
  panelWidth: { key: "panelWidth", label: "面板宽度", type: "number" as const, min: 160, max: 1280, step: 10, unit: "px" },
  panelHeight: { key: "panelHeight", label: "面板高度", type: "number" as const, min: 100, max: 720, step: 10, unit: "px" },
  radius: { key: "radius", label: "边框圆角", type: "number" as const, min: 0, max: 40, step: 1, unit: "px" },
  cornerLength: { key: "cornerLength", label: "切角尺寸", type: "number" as const, min: 8, max: 48, step: 2, unit: "px" },
  headerWidth: { key: "headerWidth", label: "顶部舱条长度", type: "number" as const, min: 60, max: 360, step: 10, unit: "px" },
  structureOpacity: { key: "structureOpacity", label: "结构线强度", type: "number" as const, min: 10, max: 100, step: 5, unit: "%" },
  backgroundColor: { key: "backgroundColor", label: "面板底色", type: "color" as const },
  structureColor: { key: "structureColor", label: "结构颜色", type: "color" as const },
  flowEnabled: {
    key: "flowEnabled",
    label: "边框流光",
    type: "select" as const,
    options: [
      { label: "开启", value: "on" },
      { label: "关闭", value: "off" }
    ]
  },
  direction: {
    key: "direction",
    label: "流动方向",
    type: "select" as const,
    options: [
      { label: "顺时针", value: "clockwise" },
      { label: "逆时针", value: "counterclockwise" }
    ]
  },
  duration: { key: "duration", label: "流动时长", type: "number" as const, min: 1, max: 12, step: 0.1, unit: "s" },
  flowLength: { key: "flowLength", label: "流光长度", type: "number" as const, min: 8, max: 48, step: 1, unit: "%" },
  borderWidth: { key: "borderWidth", label: "流光线宽", type: "number" as const, min: 1, max: 6, step: 0.5, unit: "px" },
  glowIntensity: { key: "glowIntensity", label: "发光强度", type: "number" as const, min: 0, max: 100, step: 5, unit: "%" },
  color: { key: "color", label: "流光颜色", type: "color" as const }
};

export const decorationSections: DecorationSection[] = [
  "标题装饰",
  "图表装饰",
  "图标/点位",
  "通用装饰",
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
    id: "icon-base-stacked-energy",
    name: "层叠能量底座",
    section: "图标/点位",
    subsection: "图标底座",
    description: "三层能量底板按节奏依次提亮，中心图标轻微浮动，适合强调重点设备与空间点位。",
    scene: "重点设备、定位标记、空间节点",
    defaultParams: {
      size: 196,
      color: DECORATION_BLUE,
      duration: 2.4,
      opacity: 1,
      glow: 18,
      borderWidth: 2
    },
    editableParams: [],
    previewType: "particle-base",
    generator: "particle-base"
  },
  {
    id: "icon-base-ripple-focus",
    name: "环形扩散底座",
    section: "图标/点位",
    subsection: "图标底座",
    description: "多层透视环由内向外错峰扩散，中心图标稳定聚焦，适合告警点位与实时事件定位。",
    scene: "告警点位、事件定位、地图聚焦",
    defaultParams: {
      size: 196,
      color: "#20A6FF",
      duration: 2.6,
      opacity: 1,
      glow: 20,
      borderWidth: 2
    },
    editableParams: [],
    previewType: "particle-base",
    generator: "particle-base"
  },
  {
    id: "chart-tech-ring-01",
    name: "饼图环形",
    section: "图表装饰",
    subsection: "饼图外环",
    description: "双层科技环保持反向旋转，外围光效轻微呼吸，为饼图和环形图提供稳定的科技装饰边界。",
    scene: "饼图、环形图、占比图表",
    defaultParams: {
      size: 300,
      color: DECORATION_BLUE,
      duration: 10,
      opacity: 1,
      glow: 18,
      borderWidth: 2
    },
    editableParams: [],
    previewType: "particle-base",
    generator: "particle-base"
  },
  {
    id: "chart-orbit-base-01",
    name: "环绕光弧底座",
    section: "图表装饰",
    subsection: "图表底座",
    description: "双层透视椭圆底盘承载渐变环绕光弧，作为饼图、环形图的底部装饰，图表内容保持独立。",
    scene: "3D 饼图、透视环形图、占比图表底座",
    defaultParams: {
      size: 320, perspective: 48, borderWidth: 8, trackOpacity: 28, surfaceOpacity: 8,
      color: DECORATION_BLUE, motionEnabled: "on", direction: "clockwise", duration: 3.2,
      flowLength: 28, lightIntensity: 90, glowIntensity: 58
    },
    editableParams: [
      { key: "size", label: "底座宽度", type: "number", min: 120, max: 1200, step: 10, unit: "px" },
      { key: "perspective", label: "透视高度比例", type: "number", min: 24, max: 75, step: 1, unit: "%" },
      { key: "color", label: "底座颜色", type: "color" },
      { key: "trackOpacity", label: "轨道强度", type: "number", min: 0, max: 100, step: 1, unit: "%" },
      { key: "surfaceOpacity", label: "底盘透明度", type: "number", min: 0, max: 40, step: 1, unit: "%" },
      { key: "motionEnabled", label: "光弧运动", type: "select", options: [{ label: "开启", value: "on" }, { label: "关闭", value: "off" }] },
      { key: "direction", label: "环绕方向", type: "select", options: [{ label: "顺时针", value: "clockwise" }, { label: "逆时针", value: "counterclockwise" }] },
      { key: "duration", label: "环绕时长", type: "number", min: .6, max: 16, step: .1, unit: "s" },
      { key: "flowLength", label: "光弧长度", type: "number", min: 8, max: 60, step: 1, unit: "%" },
      { key: "borderWidth", label: "光弧宽度", type: "number", min: 1, max: 12, step: .5, unit: "px" },
      { key: "lightIntensity", label: "光弧强度", type: "number", min: 0, max: 100, step: 1, unit: "%" },
      { key: "glowIntensity", label: "发光强度", type: "number", min: 0, max: 100, step: 1, unit: "%" }
    ],
    previewType: "chart-base",
    generator: "chart-orbit-base"
  },
  {
    id: "svg-flow-tool",
    name: "单边流光",
    section: "标题装饰",
    subsection: "顶部标题",
    description: "沿标题装饰路径生成连续渐变流光，也可导入同类 SVG 替换系统案例。",
    scene: "大屏顶部标题、底部装饰、横向标题栏",
    defaultParams: {
      titleWidth: 1920,
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
      svgFlowParams.titleWidth,
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
      waveColor: DECORATION_BLUE,
      lightIntensity: 68,
      flowAmplitude: 9,
      flowFocusPosition: 14,
      flowLeftEndWidth: 85,
      flowRightEndWidth: 25
    },
    editableParams: [
      svgFlowParams.duration,
      svgFlowParams.sourceVisibility,
      backgroundSweepParams.color,
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
    id: "subtitle-light-arc-01",
    name: "光弧掠过",
    section: "标题装饰",
    subsection: "小标题",
    description: "略微倾斜的柔边矩形光带从左向右扫过科技标题底板，底板纹理和菱形标记保持静止。",
    scene: "大屏小标题、年度指标、图表模块标题",
    defaultParams: {
      duration: 1.3,
      pause: 1,
      easing: "ease-in-out",
      sourceVisibility: "show",
      sweepShape: "rect",
      sweepAngle: 32,
      sweepColor: "#66D7FF",
      sweepWidth: 40,
      sweepBlur: 9,
      sweepIntensity: 10
    },
    editableParams: [
      subtitleSweepParams.duration,
      subtitleSweepParams.pause,
      subtitleSweepParams.easing,
      svgFlowParams.sourceVisibility,
      { key: "sweepAngle", label: "倾斜角度", type: "number", min: -60, max: 60, step: 1, unit: "°" },
      { key: "sweepColor", label: "光效颜色", type: "color" },
      subtitleSweepParams.width,
      subtitleSweepParams.blur,
      subtitleSweepParams.intensity
    ],
    previewType: "layered-sweep",
    generator: "layered-sweep"
  },
  {
    id: "flow-marker-01",
    name: "流动标记",
    section: "通用装饰",
    subsection: "动态标记",
    description: "用于标题、按钮、卡片、模块边缘等场景的小型动态装饰标记。",
    scene: "标题、按钮、卡片、模块边缘",
    defaultParams: {
      shape: "triangle",
      size: 14,
      color: DECORATION_BLUE,
      direction: "ltr",
      distance: 240,
      speed: 120,
      duration: 2,
      glowIntensity: 55,
      tailLength: 54
    },
    editableParams: [
      flowMarkerParams.shape,
      flowMarkerParams.size,
      flowMarkerParams.color,
      flowMarkerParams.direction,
      flowMarkerParams.distance,
      flowMarkerParams.speed,
      flowMarkerParams.glowIntensity,
      flowMarkerParams.tailLength
    ],
    previewType: "flow-marker",
    generator: "flow-marker"
  },
  {
    id: "flow-marker-02",
    name: "闪烁流动",
    section: "通用装饰",
    subsection: "动态标记",
    description: "多个固定标记依次提亮并保留轻微余辉，用于表达稳定、克制的方向引导。",
    scene: "标题指示、按钮引导、流程方向、模块边缘",
    defaultParams: {
      shape: "triangle",
      markerCount: 3,
      size: 12,
      markerGap: 4,
      color: DECORATION_BLUE,
      direction: "ltr",
      duration: 1.2,
      pause: 0.1,
      easing: "ease-in-out",
      minOpacity: 0.16,
      glowIntensity: 55,
      afterglow: 52
    },
    editableParams: [
      flowMarkerParams.shape,
      sequenceMarkerParams.markerCount,
      flowMarkerParams.size,
      sequenceMarkerParams.markerGap,
      flowMarkerParams.color,
      flowMarkerParams.direction,
      sequenceMarkerParams.duration,
      sequenceMarkerParams.pause,
      sequenceMarkerParams.easing,
      sequenceMarkerParams.minOpacity,
      flowMarkerParams.glowIntensity,
      sequenceMarkerParams.afterglow
    ],
    previewType: "flow-marker",
    generator: "flow-marker-sequence"
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
      showText: "on",
      color: DECORATION_BLUE
    },
    editableParams: [
      loadingParams.centerText,
      loadingParams.showText,
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
  ...lightDecorations,
  ...pointReferenceEffects,
  ...referenceLoadings
];
