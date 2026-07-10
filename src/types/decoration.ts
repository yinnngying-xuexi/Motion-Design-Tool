export type DecorationSection = "图标底座" | "线性流光" | "扫描装饰" | "边框光效";

export type DecorationPreviewType = "base-ring" | "particle-base" | "linear-flow" | "comet-flow" | "scan" | "border-glow";

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
  generator: "base-ring" | "particle-base" | "linear-flow" | "comet-flow" | "scan" | "border-glow";
}

export interface CssVariableParam {
  name: string;
  value: string;
  type: "color" | "number" | "text";
  unit: string;
  numericValue: number;
}
