import type { DecorationEffectTemplate, DecorationParam } from "@/types/decoration";

export const referenceLoadingSpecs: Record<string, { width: number; height: number; visualWidth?: number; visualHeight: number; textTop: number; fontSize: number; scale: number; duration: number }> = {
  "loading-reference-dot-wave": { width: 180, height: 118, visualHeight: 82, textTop: 78, fontSize: 40, scale: 33, duration: 1.48 },
  "loading-reference-wire-orb": { width: 280, height: 280, visualHeight: 280, textTop: 50, fontSize: 30, scale: 70, duration: 6 },
  "loading-reference-particle-ring": { width: 280, height: 280, visualHeight: 280, textTop: 50, fontSize: 30, scale: 70, duration: 2.7 },
  "loading-reference-flare-line": { width: 736, height: 180, visualWidth: 320, visualHeight: 145, textTop: 82, fontSize: 40, scale: 50, duration: 4.59 }
};

const color: DecorationParam = { key: "color", label: "动效颜色", type: "color" };
const text: DecorationParam = { key: "centerText", label: "加载文字", type: "text" };
const showText: DecorationParam = { key: "showText", label: "显示文字", type: "select", options: [{ label: "显示", value: "on" }, { label: "隐藏", value: "off" }] };
const glowSpread: DecorationParam = { key: "glowSpread", label: "扩散光芒", type: "number", min: 0, max: 200, step: 1, unit: "%" };
const cases = [
  ["loading-reference-dot-wave", "粒子摆动", "一圈粒子连续扭转，在下弯弧、交叉双叶与上拱弧之间循环，下方文字可隐藏。"],
  ["loading-reference-wire-orb", "流体线框环", "细密暗线与折叠亮弧沿球面往复流动，中央文字可隐藏。"],
  ["loading-reference-particle-ring", "粒子辉光环", "柔亮蓝色光环与细粒子持续环绕，中央显示 loading。"],
  ["loading-reference-flare-line", "星芒光点", "三颗星芒沿光束推进，依次带弧形拖尾从下方回流，文字可隐藏。"]
];

export const referenceLoadings: DecorationEffectTemplate[] = cases.map(([id, name, description]) => ({
  id, name, description, section: "loading", subsection: "通用 Loading", scene: "页面加载、图表等待、大屏切换",
  defaultParams: { color: "#0070F3", centerText: "loading", showText: "on", overallScale: referenceLoadingSpecs[id].scale, duration: referenceLoadingSpecs[id].duration, ...(id === "loading-reference-flare-line" ? { glowSpread: 100 } : {}) },
  editableParams: id === "loading-reference-flare-line" ? [color, glowSpread, showText, text] : [color, showText, text], previewType: "loading", generator: "reference-loading"
}));

export function referenceLoadingSize(id: string): { width: number; height: number } {
  const { width, height } = referenceLoadingSpecs[id];
  return { width, height };
}
