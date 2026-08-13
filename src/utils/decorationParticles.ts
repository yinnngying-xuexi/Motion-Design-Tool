import type { DecorationParticleConfig } from "@/types/decoration";

export function createDefaultDecorationParticleConfig(enabled = false, color = "#0070F3"): DecorationParticleConfig {
  return {
    enabled,
    style: "float",
    count: 14,
    size: 2,
    intensity: 70,
    colorMode: "inherit",
    color,
    speed: 1,
    areaWidth: 90,
    areaHeight: 62,
    offsetX: 0,
    offsetY: -8,
    layer: "front"
  };
}

export function normalizeDecorationParticleConfig(
  value: Partial<DecorationParticleConfig> | undefined,
  enabled = false,
  color = "#0070F3"
): DecorationParticleConfig {
  return {
    ...createDefaultDecorationParticleConfig(enabled, color),
    ...value
  };
}
