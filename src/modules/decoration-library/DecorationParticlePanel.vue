<template>
  <details class="particle-panel" open>
    <summary>
      <span><strong>附加效果</strong><small>粒子效果</small></span>
      <el-switch
        :model-value="modelValue.enabled"
        @click.stop
        @change="update('enabled', Boolean($event))"
      />
    </summary>

    <div v-if="modelValue.enabled" class="particle-panel__body">
      <label class="particle-field">
        <span>粒子样式</span>
        <el-select :model-value="modelValue.style" @change="update('style', $event)">
          <el-option label="漂浮" value="float" />
          <el-option label="闪烁" value="twinkle" />
          <el-option label="扩散" value="spread" />
        </el-select>
      </label>
      <label class="particle-field">
        <span>显示层级</span>
        <el-select :model-value="modelValue.layer" @change="update('layer', $event)">
          <el-option label="素材前方" value="front" />
          <el-option label="素材后方" value="back" />
        </el-select>
      </label>
      <label class="particle-field">
        <span>粒子颜色</span>
        <el-select :model-value="modelValue.colorMode" @change="update('colorMode', $event)">
          <el-option label="继承素材主色" value="inherit" />
          <el-option label="自定义颜色" value="custom" />
        </el-select>
      </label>
      <div v-if="modelValue.colorMode === 'custom'" class="particle-field">
        <span>自定义颜色</span>
        <div class="color-row">
          <el-color-picker
            :model-value="modelValue.color"
            @change="update('color', $event || modelValue.color)"
          />
          <el-input :model-value="modelValue.color" @change="update('color', $event)" />
        </div>
      </div>
      <div v-for="field in numberFields" :key="field.key" class="particle-field">
        <label><span>{{ field.label }}</span><small>{{ field.unit }}</small></label>
        <div class="number-row">
          <el-slider
            :model-value="Number(modelValue[field.key])"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            @input="update(field.key, Array.isArray($event) ? $event[0] : $event)"
          />
          <el-input-number
            :model-value="Number(modelValue[field.key])"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            :controls="false"
            @change="update(field.key, Number($event ?? modelValue[field.key]))"
          />
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import type { DecorationParticleConfig } from "@/types/decoration";

const props = defineProps<{ modelValue: DecorationParticleConfig }>();
const emit = defineEmits<{ "update:modelValue": [value: DecorationParticleConfig] }>();
type NumberKey = "count" | "size" | "intensity" | "speed" | "areaWidth" | "areaHeight" | "offsetX" | "offsetY";
const numberFields: Array<{ key: NumberKey; label: string; unit: string; min: number; max: number; step: number }> = [
  { key: "count", label: "粒子数量", unit: "个", min: 4, max: 60, step: 2 },
  { key: "size", label: "粒子大小", unit: "px", min: 1, max: 6, step: 0.5 },
  { key: "intensity", label: "粒子强度", unit: "%", min: 0, max: 100, step: 5 },
  { key: "speed", label: "运动速度", unit: "倍", min: 0.4, max: 2, step: 0.1 },
  { key: "areaWidth", label: "分布宽度", unit: "%", min: 20, max: 140, step: 5 },
  { key: "areaHeight", label: "分布高度", unit: "%", min: 20, max: 140, step: 5 },
  { key: "offsetX", label: "水平位置", unit: "%", min: -50, max: 50, step: 1 },
  { key: "offsetY", label: "垂直位置", unit: "%", min: -50, max: 50, step: 1 }
];

function update<Key extends keyof DecorationParticleConfig>(key: Key, value: DecorationParticleConfig[Key]): void {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}
</script>

<style scoped>
.particle-panel {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--dm-hairline);
}

.particle-panel summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  list-style: none;
}

.particle-panel summary::-webkit-details-marker {
  display: none;
}

.particle-panel summary > span {
  display: grid;
  gap: 3px;
}

.particle-panel summary strong {
  color: var(--dm-primary);
  font-size: 12px;
}

.particle-panel summary small {
  color: var(--dm-secondary);
  font-size: 10px;
  font-weight: 400;
}

.particle-panel__body {
  display: grid;
  gap: 16px;
  padding-top: 16px;
}

.particle-field {
  display: grid;
  gap: 8px;
  color: var(--dm-secondary);
  font-size: 12px;
}

.particle-field > label,
.particle-field > span:first-child {
  display: flex;
  justify-content: space-between;
}

.particle-field small {
  font-family: "Geist Mono", ui-monospace, monospace;
}

.number-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--dm-param-value-width);
  gap: 10px;
  align-items: center;
}

.number-row :deep(.el-input-number) {
  width: var(--dm-param-value-width);
}

.color-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}
</style>
