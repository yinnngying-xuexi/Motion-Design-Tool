import type { DecorationEffectTemplate, DecorationParam } from "@/types/decoration";

const color: DecorationParam = { key: "color", label: "光效颜色", type: "color" };
const intensity: DecorationParam = { key: "lightIntensity", label: "光效强度", type: "number", min: 0, max: 100, step: 1, unit: "%" };
const duration: DecorationParam = { key: "duration", label: "循环时长", type: "number", min: .5, max: 12, step: .05, unit: "s" };
const motion: DecorationParam = { key: "motionEnabled", label: "运动状态", type: "select", options: [{ label: "播放动效", value: "on" }, { label: "静态光效", value: "off" }] };
const direction: DecorationParam = { key: "direction", label: "旋转方向", type: "select", options: [{ label: "顺时针", value: "clockwise" }, { label: "逆时针", value: "counterclockwise" }] };
const curvature: DecorationParam = { key: "curvature", label: "波带弧度", type: "number", min: 0, max: 100, step: 1, unit: "%" };
const waveCount: DecorationParam = { key: "waveCount", label: "起伏数量", type: "number", min: 1, max: 4, step: 1, unit: "组" };
const lineWidth: DecorationParam = { key: "lineWidth", label: "线条粗细", type: "number", min: .5, max: 12, step: .1, unit: "px" };

export const lightDecorations: DecorationEffectTemplate[] = [
  { id: "light-particle-band", name: "粒子光带", section: "通用装饰", subsection: "线性光效", description: "代码生成疏密不同的细小光点，错峰闪动并带窄幅柔光，背景透明。", scene: "按钮下沿、标题分隔、模块边缘", defaultParams: { color: "#00FFF8", lightIntensity: 100, duration: 2.1, motionEnabled: "on", overallScale: 60 }, editableParams: [color, intensity, duration, motion], previewType: "light", generator: "light-decoration" },
  { id: "light-electric-beam", name: "电弧光束", section: "通用装饰", subsection: "线性光效", description: "程序化生成细密电丝、短分支、亮芯与柔和光晕，可修改颜色并直接叠放。", scene: "按钮高亮、标题底线、能量指示", defaultParams: { color: "#35FCFF", duration: 4.96 }, editableParams: [color], previewType: "light", generator: "light-decoration" },
  { id: "light-plasma-ring", name: "等离子光环", section: "通用装饰", subsection: "环形光效", description: "不规则亮边与内部柔和游丝连续流动，保留中心透明的能量光环。", scene: "圆形按钮、重点指标、空间节点", defaultParams: { color: "#37BFFF", lightIntensity: 82, duration: 2.65, motionEnabled: "on", direction: "clockwise" }, editableParams: [color, intensity, duration, direction, motion], previewType: "light", generator: "light-decoration" },
  { id: "light-comet-ring", name: "辉光旋转环", section: "通用装饰", subsection: "环形光效", description: "高亮光头带连续衰减的长拖尾绕环运动，叠加细轨道和低亮度微粒。", scene: "环形图外围、圆形按钮、数据焦点", defaultParams: { color: "#2BA8FF", lightIntensity: 78, duration: .95, motionEnabled: "on", direction: "clockwise", lineWidth: 3.3 }, editableParams: [color, intensity, lineWidth, duration, direction, motion], previewType: "light", generator: "light-decoration" },
  { id: "light-silk-wave", name: "柔光波带", section: "通用装饰", subsection: "氛围光效", description: "多组舒展的波峰与波谷交错流动，细亮边与透明网纹薄带相互穿插，用于标题和模块背后的氛围光。", scene: "顶部大标题、小标题背景、模块氛围", defaultParams: { color: "#35C9DB", lightIntensity: 77, duration: 5.05, motionEnabled: "on", curvature: 22, waveCount: 2 }, editableParams: [color, intensity, curvature, waveCount, duration, motion], previewType: "light", generator: "light-decoration" },
  { id: "light-flare-base", name: "光晕扩散底座", section: "图表装饰", subsection: "图表底座", description: "双层透视光环配合向上散射的柔光和错峰扩张光晕，中心留空承载图表。", scene: "柱状图底部、圆形指标、空间点位底座", defaultParams: { overallScale: 39, color: "#0095ff", lightIntensity: 76, duration: 4.05, motionEnabled: "on" }, editableParams: [color, intensity, duration, motion], previewType: "light", generator: "light-decoration" }
];
