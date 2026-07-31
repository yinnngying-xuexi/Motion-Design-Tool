import type {
  BasicMotionParamKey,
  BasicMotionTemplate,
  MotionParamDefinition,
  MotionParamGroup,
  MotionParamOption
} from "@/types/motion";

const timingOptions: MotionParamOption[] = [
  { label: "线性 linear", value: "linear" },
  { label: "标准 ease", value: "ease" },
  { label: "缓入 ease-in", value: "ease-in" },
  { label: "缓出 ease-out", value: "ease-out" },
  { label: "缓入缓出 ease-in-out", value: "ease-in-out" }
];
const directionOptions: MotionParamOption[] = [
  { label: "顺时针 / 正向", value: "normal" },
  { label: "逆时针 / 反向", value: "reverse" }
];
const rotationDirectionOptions: MotionParamOption[] = [
  { label: "顺时针", value: "normal" },
  { label: "逆时针", value: "reverse" }
];
const iterationOptions: MotionParamOption[] = [
  { label: "1 次", value: "1" },
  { label: "2 次", value: "2" },
  { label: "3 次", value: "3" }
];
const numberParam = (
  key: BasicMotionParamKey, label: string, min: number, max: number, step: number, unit = ""
): MotionParamDefinition => ({ key, label, type: "number", min, max, step, unit });
const colorParam = (label = "主色"): MotionParamDefinition => ({ key: "color", label, type: "color" });
const selectParam = (
  key: BasicMotionParamKey, label: string, options: MotionParamOption[]
): MotionParamDefinition => ({ key, label, type: "select", options });
const effect = (...params: MotionParamDefinition[]): MotionParamGroup => ({ id: "effect", title: "效果参数", params });
const timing = (...params: MotionParamDefinition[]): MotionParamGroup => ({ id: "timing", title: "时间与节奏", params });
const duration = (max = 10) => numberParam("duration", "动效时长", 0.1, max, 0.1, "s");
const delay = () => numberParam("delay", "开始延迟", 0, 5, 0.1, "s");
const easing = () => selectParam("timingFunction", "缓动曲线", timingOptions);
const entryDuration = () => numberParam("duration", "动效时长", 0.2, 2, 0.05, "s");
const entryDelay = () => numberParam("delay", "开始延迟", 0, 2, 0.05, "s");
const loopDuration = (min: number, max: number, step: number) =>
  numberParam("duration", "循环时长", min, max, step, "s");
const loopDelay = () => numberParam("delay", "开始延迟", 0, 3, 0.1, "s");

export const basicMotions: BasicMotionTemplate[] = [
  {
    id: "fade-in", name: "淡入", category: "入场动效", scene: "数据卡片、标题文字",
    description: "用于模块初次加载，低干扰地建立页面层级。",
    previewType: "fade", duration: 0.8, timingFunction: "ease-out", iteration: "1",
    defaultConfig: { startOpacity: 0, endOpacity: 1, startBlur: 0 },
    paramGroups: [
      { ...timing(duration(4), delay(), easing()), title: "基础参数" },
      effect(numberParam("startOpacity", "起始透明度", 0, 1, 0.05))
    ]
  },
  {
    id: "slide-up", name: "上滑进入", category: "入场动效", scene: "数据卡片、图表容器",
    description: "卡片从下方进入，适合首屏模块分组出现。",
    previewType: "slide", duration: 0.7, timingFunction: "ease-out", iteration: "1",
    defaultConfig: { duration: 0.7, delay: 0, timingFunction: "ease-out", offsetY: 36, startOpacity: 0 },
    paramGroups: [
      { ...timing(entryDuration(), entryDelay(), easing()), title: "基础参数" },
      effect(
        numberParam("offsetY", "进入距离", 0, 160, 4, "px"),
        numberParam("startOpacity", "起始透明度", 0, 1, 0.05)
      )
    ]
  },
  {
    id: "slide-left", name: "左滑进入", category: "入场动效", scene: "侧栏、弹层、信息面板",
    description: "横向进入可强调空间来源，适合左侧信息流。",
    previewType: "slide", duration: 0.7, timingFunction: "ease-out", iteration: "1",
    defaultConfig: { duration: 0.7, delay: 0, timingFunction: "ease-out", offsetX: 36, startOpacity: 0 },
    paramGroups: [
      { ...timing(entryDuration(), entryDelay(), easing()), title: "基础参数" },
      effect(
        numberParam("offsetX", "进入距离", 0, 160, 4, "px"),
        numberParam("startOpacity", "起始透明度", 0, 1, 0.05)
      )
    ]
  },
  {
    id: "scale-in", name: "缩放进入", category: "入场动效", scene: "指标数字、重点模块",
    description: "轻微缩放带来聚焦感，不会破坏整体节奏。",
    previewType: "scale", duration: 0.65, timingFunction: "ease-out", iteration: "1",
    defaultConfig: {
      duration: 0.65,
      delay: 0,
      timingFunction: "ease-out",
      startScale: 0.85,
      endScale: 1,
      startOpacity: 0
    },
    paramGroups: [
      { ...timing(entryDuration(), entryDelay(), easing()), title: "基础参数" },
      effect(
        numberParam("startScale", "起始缩放", 0.7, 1, 0.01),
        numberParam("startOpacity", "起始透明度", 0, 1, 0.05)
      )
    ]
  },
  {
    id: "breath", name: "呼吸", category: "循环动效", scene: "状态卡片、重点指标",
    description: "柔和缩放循环，适合作为常驻提示。",
    previewType: "pulse", duration: 2.2, timingFunction: "ease-in-out", iteration: "infinite",
    defaultConfig: {
      duration: 2.2,
      delay: 0,
      timingFunction: "ease-in-out",
      iteration: "infinite",
      minScale: 0.96,
      maxScale: 1
    },
    paramGroups: [
      { ...timing(loopDuration(1, 6, 0.1), loopDelay(), easing()), title: "基础参数" },
      effect(numberParam("minScale", "最小缩放", 0.85, 0.99, 0.01))
    ]
  },
  {
    id: "float", name: "上下浮动", category: "循环动效", scene: "图标、地图浮层",
    description: "轻量位移让静态组件保持活性。",
    previewType: "float", duration: 2.4, timingFunction: "ease-in-out", iteration: "infinite",
    defaultConfig: {
      duration: 2.4,
      delay: 0,
      timingFunction: "ease-in-out",
      iteration: "infinite",
      offsetY: 8
    },
    paramGroups: [
      { ...timing(loopDuration(1.2, 6, 0.1), loopDelay(), easing()), title: "基础参数" },
      effect(numberParam("offsetY", "浮动距离", 2, 30, 1, "px"))
    ]
  },
  {
    id: "soft-blink", name: "轻微闪烁", category: "循环动效", scene: "状态文字、提示点",
    description: "低频透明度变化，用于弱提示。",
    previewType: "blink", duration: 1.8, timingFunction: "ease-in-out", iteration: "infinite",
    defaultConfig: {
      duration: 1.8,
      delay: 0,
      timingFunction: "ease-in-out",
      iteration: "infinite",
      minOpacity: 0.75,
      maxOpacity: 1
    },
    paramGroups: [
      { ...timing(loopDuration(0.8, 5, 0.1), loopDelay(), easing()), title: "基础参数" },
      effect(numberParam("minOpacity", "最低透明度", 0.3, 0.95, 0.05))
    ]
  },
  {
    id: "glow-pulse", name: "光效脉冲", category: "循环动效", scene: "图标、重点指标、状态素材",
    description: "光效在无光与最大光晕之间柔和往返。",
    previewType: "glow", duration: 2, timingFunction: "ease-in-out", iteration: "infinite",
    defaultConfig: {
      duration: 2,
      delay: 0,
      timingFunction: "ease-in-out",
      iteration: "infinite",
      color: "#0070F3",
      glowStrength: 50,
      glowPeak: 18
    },
    paramGroups: [
      { ...timing(loopDuration(0.8, 6, 0.1), loopDelay(), easing()), title: "基础参数" },
      effect(
        colorParam("光效颜色"),
        numberParam("glowStrength", "光晕强度", 0, 100, 1, "%"),
        numberParam("glowPeak", "光晕范围", 0, 48, 1, "px")
      )
    ]
  },
  {
    id: "slow-rotate", name: "慢速旋转", category: "循环动效", scene: "装饰环、加载态",
    description: "适合科技装饰，保持慢速避免分散注意力。",
    previewType: "rotate", duration: 6, timingFunction: "linear", iteration: "infinite",
    defaultConfig: {
      duration: 6,
      delay: 0,
      timingFunction: "linear",
      iteration: "infinite",
      rotationAngle: 360,
      direction: "normal"
    },
    paramGroups: [
      { ...timing(loopDuration(2, 20, 0.5), loopDelay()), title: "基础参数" },
      effect(selectParam("direction", "旋转方向", rotationDirectionOptions))
    ]
  },
  {
    id: "scale-tip", name: "放大提示", category: "强调动效", scene: "按钮、指标数字",
    description: "短暂放大强调当前关注点。",
    previewType: "scale", duration: 0.9, timingFunction: "ease-in-out", iteration: "3",
    defaultConfig: { emphasisScale: 1.12, reboundScale: 0.97, iteration: "3" },
    paramGroups: [
      effect(
        numberParam("emphasisScale", "强调缩放", 1.01, 1.5, 0.01),
        numberParam("reboundScale", "回弹缩放", 0.7, 1, 0.01)
      ),
      timing(duration(4), selectParam("iteration", "播放次数", iterationOptions), easing())
    ]
  },
  {
    id: "highlight-glow", name: "高亮发光", category: "强调动效", scene: "关键指标、重点状态",
    description: "用可控强度的蓝色光效强调重要状态。",
    previewType: "glow", duration: 1.8, timingFunction: "ease-in-out", iteration: "1",
    defaultConfig: { color: "#0070F3", glowBase: 6, glowPeak: 28, glowStrength: 70, iteration: "1" },
    paramGroups: [
      effect(
        colorParam(),
        numberParam("glowBase", "基础光晕", 0, 40, 1, "px"),
        numberParam("glowPeak", "峰值光晕", 4, 80, 1, "px"),
        numberParam("glowStrength", "光效强度", 0, 100, 1, "%")
      ),
      timing(duration(), selectParam("iteration", "播放次数", iterationOptions), easing())
    ]
  },
  {
    id: "border-highlight", name: "边框高亮", category: "强调动效", scene: "卡片边界、选中模块",
    description: "边框与阴影同步变化，适合选中态提示。",
    previewType: "glow", duration: 1.6, timingFunction: "ease-in-out", iteration: "1",
    defaultConfig: { color: "#0070F3", borderWidth: 1, glowBase: 0, glowPeak: 24, iteration: "1" },
    paramGroups: [
      effect(
        colorParam("边框颜色"),
        numberParam("borderWidth", "边框宽度", 0.5, 8, 0.5, "px"),
        numberParam("glowBase", "基础光晕", 0, 30, 1, "px"),
        numberParam("glowPeak", "峰值光晕", 2, 64, 1, "px")
      ),
      timing(duration(), selectParam("iteration", "播放次数", iterationOptions), easing())
    ]
  },
  {
    id: "alert-blink", name: "告警闪烁", category: "告警动效", scene: "异常设备、风险标签",
    description: "低频闪烁用于表达告警，避免过度刺眼。",
    previewType: "blink", duration: 1.2, timingFunction: "ease-in-out", iteration: "infinite",
    defaultConfig: { color: "#0070F3", minOpacity: 0.22, maxOpacity: 1, blinkFrequency: 0.8 },
    paramGroups: [
      effect(
        colorParam("告警颜色"),
        numberParam("minOpacity", "最低透明度", 0.05, 1, 0.05),
        numberParam("blinkFrequency", "闪烁频率", 0.2, 4, 0.1, "Hz")
      ),
      timing(easing())
    ]
  },
  {
    id: "pulse-spread", name: "脉冲扩散", category: "告警动效", scene: "地图点位、异常区域",
    description: "点位向外扩散，适合地图或设备定位。",
    previewType: "ripple", duration: 1.8, timingFunction: "ease-out", iteration: "infinite",
    defaultConfig: {
      color: "#0070F3", rippleStartRadius: 24, rippleEndRadius: 170,
      rippleCount: 3, rippleInterval: 0.45, borderWidth: 1
    },
    paramGroups: [
      effect(
        colorParam(),
        numberParam("rippleStartRadius", "起始半径", 8, 100, 1, "px"),
        numberParam("rippleEndRadius", "扩散半径", 40, 260, 2, "px"),
        numberParam("rippleCount", "扩散层数", 1, 5, 1),
        numberParam("rippleInterval", "层间间隔", 0.1, 1.5, 0.05, "s"),
        numberParam("borderWidth", "扩散线宽", 0.5, 6, 0.5, "px")
      ),
      timing(duration(8))
    ]
  },
  {
    id: "border-flow", name: "边框流光", category: "强调动效", scene: "数据卡片、图表容器",
    description: "用于重点模块边框，形成科技感流动提示。",
    previewType: "glow", duration: 3, timingFunction: "linear", iteration: "infinite",
    defaultConfig: {
      color: "#0070F3", flowLength: 18, flowHeadOpacity: 1, flowTailOpacity: 0,
      flowHeadWidth: 3.4, flowTailWidth: 0.5, glowPeak: 20, direction: "normal"
    },
    paramGroups: [
      effect(
        colorParam("流光颜色"),
        numberParam("flowLength", "流光长度", 6, 48, 1, "%"),
        numberParam("flowHeadOpacity", "头部透明度", 0.1, 1, 0.05),
        numberParam("flowTailOpacity", "尾部透明度", 0, 0.6, 0.05),
        numberParam("flowHeadWidth", "头部线宽", 1, 8, 0.1, "px"),
        numberParam("flowTailWidth", "尾部线宽", 0.2, 3, 0.1, "px"),
        numberParam("glowPeak", "流光光晕", 0, 48, 1, "px")
      ),
      timing(duration(12), selectParam("direction", "流动方向", directionOptions))
    ]
  }
];
