import type { DecorationEffectTemplate } from "@/types/decoration";
import source5039 from "@/assets/point-reference/Group 1321315039.svg?raw";
import source5040 from "@/assets/point-reference/Group 1321315040.svg?raw";
import source5041 from "@/assets/point-reference/Group 1321315041.svg?raw";
import source4627 from "@/assets/point-reference/Group 1321314627.svg?raw";
import source5036 from "@/assets/point-reference/Group 1321315036.svg?raw";
import source5037 from "@/assets/point-reference/Group 1321315037.svg?raw";
import source5038 from "@/assets/point-reference/Group 1321315038.svg?raw";

export interface PointReferenceSpec {
  source: string;
  file: string;
  width: number;
  height: number;
  center: [number, number];
  radius: [number, number];
  iconFloat?: number;
  iconFloatMax?: number;
  topPadding?: number;
  mode: "column" | "halo" | "grid" | "finance" | "saucer" | "sectors" | "hexagon";
}

const presets = [
  { suffix: "5039", source: source5039, name: "环轨光柱底座", width: 186, height: 165, center: [92.68, 140.78], radius: [75.89, 10.97], iconFloat: 8, mode: "column", description: "圆形薄光环从底部向上掠过并淡出，两侧星芒交错升降，设备图标独立悬浮。" },
  { suffix: "5040", source: source5040, name: "悬浮光环底座", width: 124, height: 101, center: [62, 63], radius: [56, 18], iconFloat: 10, iconFloatMax: 12, topPadding: 14, mode: "halo", description: "宽光环与缺口沿透视圆环连续旋转，设备图标明显上下悬浮，底盘保持静止。" },
  { suffix: "5041", source: source5041, name: "晶格悬浮底座", width: 205, height: 128, center: [102, 89], radius: [68, 23], mode: "grid", description: "保留静态玻璃晶格与点阵底板，细小粒子在设备图标周围错峰向上流动。" },
  { suffix: "4627", source: source4627, name: "金融全息底座", width: 146, height: 166, center: [73.07, 107.9], radius: [64.93, 26.45], iconFloat: 10, iconFloatMax: 16, mode: "finance", description: "金融图标明显上下悬浮，周围光环与底座环面围绕共同中心持续旋转。" },
  { suffix: "5036", source: source5036, name: "飞碟环绕底座", width: 101, height: 102, center: [50.5, 74], radius: [44, 14], iconFloat: 10, iconFloatMax: 16, mode: "saucer", description: "上层圆环围绕自身中心旋转，下方飞碟底盘保持静止，图标明显上下悬浮。" },
  { suffix: "5037", source: source5037, name: "扇环能量底座", width: 126, height: 141, center: [63, 100], radius: [54, 18], iconFloat: 10, iconFloatMax: 16, mode: "sectors", description: "宽幅扇形环片围绕中心连续旋转，保持椭圆透视，设备图标明显上下悬浮。" },
  { suffix: "5038", source: source5038, name: "六棱流光底座", width: 102, height: 117, center: [51, 88], radius: [43, 17], mode: "hexagon", description: "保留六棱立体底板和悬浮图标，细小粒子在图标周围错峰漂浮。" }
] as const;

export const pointReferenceSpecs: Record<string, PointReferenceSpec> = Object.fromEntries(presets.map(preset => [
  `icon-point-${preset.suffix}`,
  { ...preset, file: `Group 132131${preset.suffix}.svg`, center: [...preset.center], radius: [...preset.radius] }
]));

export const pointReferenceEffects: DecorationEffectTemplate[] = presets.map(preset => ({
  id: `icon-point-${preset.suffix}`,
  name: preset.name,
  section: "图标/点位",
  subsection: "图标底座",
  description: preset.description,
  scene: preset.mode === "finance" ? "金融点位、指标入口" : "设备点位、数字孪生、状态标记",
  defaultParams: { duration: 3.6, floatDistance: "iconFloat" in preset ? preset.iconFloat : 3, ...(preset.mode === "column" ? { starDistance: 18 } : {}), ...(["grid", "hexagon"].includes(preset.mode) ? {} : { lightIntensity: 65 }), color: "#0070F3", colorMode: "original", motionEnabled: "on", showBase: "on", showIcon: "on" },
  ...(preset.mode === "grid" ? { defaultParticleEffect: { enabled: true, style: "float" as const, count: 18, size: 1.4, intensity: 65, speed: 1.1, areaWidth: 56, areaHeight: 52, offsetX: 0, offsetY: -2, layer: "front" as const } } : {}),
  ...(preset.mode === "hexagon" ? { defaultParticleEffect: { enabled: true, style: "float" as const, count: 22, size: 1.5, intensity: 72, speed: 1.1, areaWidth: 78, areaHeight: 46, offsetX: 0, offsetY: -20, layer: "front" as const } } : {}),
  editableParams: [
    { key: "colorMode", label: "素材颜色", type: "select", options: [{ label: "保留原色", value: "original" }, { label: "统一主色", value: "monochrome" }] },
    { key: "color", label: "光效 / 统一主色", type: "color" },
    { key: "duration", label: "循环时长", type: "number", min: 1, max: 12, step: .1, unit: "s" },
    { key: "floatDistance", label: "图标悬浮幅度", type: "number", min: 0, max: "iconFloatMax" in preset ? preset.iconFloatMax : 8, step: .5, unit: "px" },
    ...(preset.mode === "column" ? [{ key: "starDistance", label: "星芒浮动幅度", type: "number" as const, min: 0, max: 28, step: 1, unit: "px" }] : []),
    ...(["grid", "hexagon"].includes(preset.mode) ? [] : [{ key: "lightIntensity", label: "光效强度", type: "number" as const, min: 0, max: 100, step: 1, unit: "%" }]),
    { key: "motionEnabled", label: "运动状态", type: "select", options: [{ label: "播放动效", value: "on" }, { label: "静态显示", value: "off" }] }
  ],
  previewType: "particle-base",
  generator: "point-reference"
}));

export function pointReferenceSize(id: string): { width: number; height: number } {
  const spec = pointReferenceSpecs[id];
  return { width: spec.width, height: spec.height + (spec.topPadding ?? 0) };
}
