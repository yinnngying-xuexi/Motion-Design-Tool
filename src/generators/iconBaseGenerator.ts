import type { IconBaseAsset, IconBaseMotionConfig } from "@/types/iconBase";

function safeName(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-");
}

export function getIconBaseClassName(asset: IconBaseAsset): string {
  return `custom-icon-base-${safeName(asset.id)}`;
}

export function getIconBaseKeyframesName(asset: IconBaseAsset): string {
  return `iconBase${safeName(asset.id).replace(/-/g, "")}`;
}

function getAnimationDeclaration(asset: IconBaseAsset): string {
  const config = asset.motionConfig;
  if (config.animationType === "none" || config.animationType === "ripple") {
    return "animation: none;";
  }

  return `animation: ${getIconBaseKeyframesName(asset)} ${config.duration}s ${config.timingFunction} ${config.delay}s ${config.iteration} ${config.direction};`;
}

function getKeyframes(asset: IconBaseAsset): string {
  const config = asset.motionConfig;
  const name = getIconBaseKeyframesName(asset);

  switch (config.animationType) {
    case "pulse":
      return `@keyframes ${name} {
  0%, 100% { transform: scale(${config.scale}) rotate(${config.rotate}deg); }
  50% { transform: scale(${Number((config.scale + 0.08).toFixed(2))}) rotate(${config.rotate}deg); }
}`;
    case "rotate":
      return `@keyframes ${name} {
  from { transform: scale(${config.scale}) rotate(${config.rotate}deg); }
  to { transform: scale(${config.scale}) rotate(${config.rotate + 360}deg); }
}`;
    case "float":
      return `@keyframes ${name} {
  0%, 100% { transform: translateY(0) scale(${config.scale}) rotate(${config.rotate}deg); }
  50% { transform: translateY(-12px) scale(${config.scale}) rotate(${config.rotate}deg); }
}`;
    case "blink":
      return `@keyframes ${name} {
  0%, 100% { opacity: ${config.opacity}; }
  50% { opacity: ${Math.max(0.18, config.opacity * 0.35).toFixed(2)}; }
}`;
    case "glow":
      return `@keyframes ${name} {
  0%, 100% { filter: drop-shadow(0 0 ${Math.max(2, config.shadowBlur / 2)}px rgba(${hexToRgb(config.glowColor)}, ${config.glowStrength * 0.45})); }
  50% { filter: drop-shadow(0 0 ${config.shadowBlur}px rgba(${hexToRgb(config.glowColor)}, ${config.glowStrength})); }
}`;
    case "ripple":
      return `@keyframes ${name} {
  0% { transform: scale(${config.scale}); opacity: ${config.opacity}; }
  100% { transform: scale(${Number((config.rippleSize / Math.max(config.width, config.height)).toFixed(2))}); opacity: 0; }
}`;
    default:
      return "";
  }
}

function getRippleCss(asset: IconBaseAsset): string {
  const config = asset.motionConfig;
  if (config.animationType !== "ripple") {
    return "";
  }

  return `
.${getIconBaseClassName(asset)}::after {
  content: "";
  position: absolute;
  inset: 50%;
  width: ${config.width}px;
  height: ${config.height}px;
  border: 1px solid rgba(${hexToRgb(config.glowColor)}, ${config.glowStrength});
  border-radius: 999px;
  transform: translate(-50%, -50%);
  animation: ${getIconBaseKeyframesName(asset)} ${config.duration}s ${config.timingFunction} ${config.delay}s ${config.iteration} ${config.direction};
  pointer-events: none;
}`;
}

export function generateIconBaseCss(asset: IconBaseAsset): string {
  const config = asset.motionConfig;
  const className = getIconBaseClassName(asset);

  return `.${className} {
  position: relative;
  width: ${config.width}px;
  height: ${config.height}px;
  opacity: ${config.opacity};
  transform: scale(${config.scale}) rotate(${config.rotate}deg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  ${getAnimationDeclaration(asset)}
}

.${className} .custom-icon-base__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.${className} .custom-icon-base__icon {
  position: relative;
  z-index: 2;
  width: ${config.iconSize}px;
  height: ${config.iconSize}px;
  display: ${config.showIcon ? "grid" : "none"};
  place-items: center;
  color: ${config.iconColor};
  font-size: ${config.iconSize}px;
  line-height: 1;
  text-shadow: 0 0 ${config.shadowBlur}px rgba(${hexToRgb(config.glowColor)}, ${config.glowStrength});
}
${getRippleCss(asset)}

${getKeyframes(asset)}`;
}

export function generateIconBaseHtmlCss(asset: IconBaseAsset): string {
  const className = getIconBaseClassName(asset);
  return `<div class="custom-icon-base ${className}">
  <img class="custom-icon-base__bg" src="./${asset.fileName}" alt="${asset.name}" />
  <div class="custom-icon-base__icon">●</div>
</div>

<style>
${generateIconBaseCss(asset)}
</style>`;
}

export function generateIconBaseVueComponent(asset: IconBaseAsset): string {
  const className = getIconBaseClassName(asset);
  return `<template>
  <div class="custom-icon-base ${className}">
    <img class="custom-icon-base__bg" src="./${asset.fileName}" alt="${asset.name}" />
    <div v-if="showIcon" class="custom-icon-base__icon">
      <slot>●</slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const showIcon = ${asset.motionConfig.showIcon}
</script>

<style scoped>
${generateIconBaseCss(asset)}
</style>`;
}

export function generateIconBaseJsonConfig(asset: IconBaseAsset): string {
  const { dataUrl: _dataUrl, ...payload } = asset;
  return JSON.stringify(payload, null, 2);
}

export function hexToRgb(hex: string): string {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized.padEnd(6, "0").slice(0, 6);
  const numberValue = Number.parseInt(value, 16);
  const r = (numberValue >> 16) & 255;
  const g = (numberValue >> 8) & 255;
  const b = numberValue & 255;
  return `${r}, ${g}, ${b}`;
}

export function createDefaultIconBaseConfig(): IconBaseMotionConfig {
  return {
    width: 96,
    height: 96,
    opacity: 1,
    scale: 1,
    rotate: 0,
    showIcon: true,
    iconSize: 32,
    iconColor: "#0070F3",
    animationType: "pulse",
    duration: 2,
    delay: 0,
    iteration: "infinite",
    timingFunction: "ease-in-out",
    direction: "normal",
    glowColor: "#0070F3",
    glowStrength: 0.6,
    shadowBlur: 16,
    rippleSize: 120
  };
}
