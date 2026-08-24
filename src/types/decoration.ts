import type { BasicMotionConfig } from "@/types/motion";

export type DecorationSection = "标题装饰" | "图表装饰" | "图标/点位" | "面板装饰" | "loading";
export type DecorationSubsection = "顶部标题" | "小标题" | "饼图外环" | "图标底座" | "通用 Loading";

export type DecorationPreviewType = "base-ring" | "particle-base" | "linear-flow" | "comet-flow" | "svg-flow" | "layered-sweep" | "scan" | "border-glow" | "loading";

export interface DecorationParam {
  key: string;
  label: string;
  type: "number" | "color" | "select" | "text";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface DecorationEffectTemplate {
  id: string;
  name: string;
  section: DecorationSection;
  subsection: DecorationSubsection;
  description: string;
  scene: string;
  defaultParams: Record<string, string | number>;
  editableParams: DecorationParam[];
  previewType: DecorationPreviewType;
  generator: "base-ring" | "particle-base" | "linear-flow" | "comet-flow" | "svg-flow" | "layered-sweep" | "scan" | "border-glow" | "loading-ring" | "loading-dots" | "loading-line" | "loading-icon-pulse" | "loading-tech-ring" | "loading-irregular-ring" | "loading-hex-tech-ring";
}

export type DecorationParticleStyle = "float" | "twinkle" | "spread";
export type DecorationParticleColorMode = "inherit" | "custom";
export type DecorationParticleLayer = "back" | "front";

export interface DecorationParticleConfig {
  enabled: boolean;
  style: DecorationParticleStyle;
  count: number;
  size: number;
  intensity: number;
  colorMode: DecorationParticleColorMode;
  color: string;
  speed: number;
  areaWidth: number;
  areaHeight: number;
  offsetX: number;
  offsetY: number;
  layer: DecorationParticleLayer;
}

export interface CssVariableParam {
  name: string;
  value: string;
  type: "color" | "number" | "text";
  unit: string;
  numericValue: number;
}

export type StarRingLayerRole =
  | "background"
  | "static-ring"
  | "rotating-ring"
  | "center"
  | "particles"
  | "outer-ring"
  | "inner-ring"
  | "highlight"
  | "glow";
export type StarRingEditableLayerRole = StarRingLayerRole | "whole";
export type StarRingMotionType = "none" | "basic" | "rotate" | "ring-highlight" | "pulse" | "particle-float";
export type StarRingColorMode = "original" | "monochrome";

export interface StarRingOverallConfig {
  size: number;
  offsetX: number;
  offsetY: number;
  opacity: number;
  color: string;
}

export interface StarRingLayerConfig {
  visible: boolean;
  colorMode: StarRingColorMode;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  motion: StarRingMotionType;
  duration: number;
  delay: number;
  direction: "clockwise" | "counterclockwise";
  minScale: number;
  distance: number;
  minOpacity: number;
  particleIntensity: number;
  basicMotionId?: string;
  basicMotionConfig?: Partial<BasicMotionConfig>;
}

export interface StarRingSvgLayer {
  key: string;
  id: string;
  label: string;
  tagName: string;
  parentKey: string | null;
  depth: number;
  highlightSegmentCount?: number;
  highlightBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface StarRingSvgAsset {
  fileName: string;
  markup: string;
  primaryColor: string;
  width: number;
  height: number;
  mode: "layered" | "whole";
  layers: StarRingSvgLayer[];
  rootKeys: string[];
}

export type StarRingLayerMapping = Record<StarRingLayerRole, string[]>;
export type StarRingLayerConfigs = Record<string, StarRingLayerConfig>;

export interface StarRingDecorationConfig {
  version: 1;
  kind?: "star-ring" | "layered-decoration" | "chart-tech-ring";
  chartContentSize?: number;
  sourceMode: "preset" | "imported";
  overall: StarRingOverallConfig;
  layerMapping: StarRingLayerMapping;
  layerConfigs: StarRingLayerConfigs;
  particleEffect?: DecorationParticleConfig;
  svg?: StarRingSvgAsset;
  chartContentSvg?: StarRingSvgAsset;
}

export interface SavedStarRingComponent {
  id: string;
  name: string;
  savedAt: string;
  previewImage: string;
  config: StarRingDecorationConfig;
}
