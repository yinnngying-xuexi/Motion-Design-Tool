export type DecorationSection = "图标底座" | "线性流光";

export type DecorationPreviewType = "base-ring" | "particle-base" | "linear-flow" | "comet-flow" | "svg-flow" | "scan" | "border-glow";

export interface DecorationParam {
  key: string;
  label: string;
  type: "number" | "color" | "select";
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
  description: string;
  scene: string;
  defaultParams: Record<string, string | number>;
  editableParams: DecorationParam[];
  previewType: DecorationPreviewType;
  generator: "base-ring" | "particle-base" | "linear-flow" | "comet-flow" | "svg-flow" | "scan" | "border-glow";
}

export interface CssVariableParam {
  name: string;
  value: string;
  type: "color" | "number" | "text";
  unit: string;
  numericValue: number;
}

export type StarRingLayerRole = "background" | "static-ring" | "rotating-ring" | "center" | "particles";
export type StarRingEditableLayerRole = StarRingLayerRole | "whole";
export type StarRingMotionType = "none" | "rotate" | "pulse" | "particle-float";
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
}

export interface StarRingSvgLayer {
  key: string;
  id: string;
  label: string;
  tagName: string;
  parentKey: string | null;
  depth: number;
}

export interface StarRingSvgAsset {
  fileName: string;
  markup: string;
  primaryColor: string;
  mode: "layered" | "whole";
  layers: StarRingSvgLayer[];
  rootKeys: string[];
}

export type StarRingLayerMapping = Record<StarRingLayerRole, string[]>;
export type StarRingLayerConfigs = Record<string, StarRingLayerConfig>;

export interface StarRingDecorationConfig {
  version: 1;
  sourceMode: "preset" | "imported";
  overall: StarRingOverallConfig;
  layerMapping: StarRingLayerMapping;
  layerConfigs: StarRingLayerConfigs;
  svg?: StarRingSvgAsset;
}

export interface SavedStarRingComponent {
  id: string;
  name: string;
  savedAt: string;
  previewImage: string;
  config: StarRingDecorationConfig;
}
