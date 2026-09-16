<template>
  <details class="svg-style-panel" open>
    <summary>
      <span>SVG 样式</span>
      <small>{{ modelValue.colorMode === "original" ? "保留原色" : "单色覆盖" }}</small>
    </summary>

    <div class="svg-style-fields">
      <label class="svg-style-field">
        <span>颜色模式</span>
        <el-select :model-value="modelValue.colorMode" @update:model-value="update('colorMode', $event)">
          <el-option label="保留原色" value="original" />
          <el-option label="单色覆盖" value="monochrome" />
        </el-select>
      </label>

      <template v-if="modelValue.colorMode === 'monochrome'">
        <label class="svg-style-field">
          <span>填充颜色</span>
          <div class="svg-color-row">
            <el-color-picker :model-value="modelValue.fillColor" @update:model-value="update('fillColor', $event || primaryColor)" />
            <el-input :model-value="modelValue.fillColor" @update:model-value="update('fillColor', $event)" />
          </div>
        </label>
        <label class="svg-style-field">
          <span>描边颜色</span>
          <div class="svg-color-row">
            <el-color-picker :model-value="modelValue.strokeColor" @update:model-value="update('strokeColor', $event || primaryColor)" />
            <el-input :model-value="modelValue.strokeColor" @update:model-value="update('strokeColor', $event)" />
          </div>
        </label>
      </template>

      <div class="svg-style-field">
        <span>描边宽度</span>
        <div class="svg-number-row">
          <el-slider
            :model-value="modelValue.strokeWidth"
            :min="0"
            :max="12"
            :step="0.5"
            @input="updateNumber('strokeWidth', $event)"
          />
          <el-input-number
            :model-value="modelValue.strokeWidth"
            :min="0"
            :max="12"
            :step="0.5"
            :controls="false"
            @change="update('strokeWidth', Number($event ?? modelValue.strokeWidth))"
          />
        </div>
      </div>

      <div class="svg-style-field">
        <span>基础透明度</span>
        <div class="svg-number-row">
          <el-slider
            :model-value="modelValue.opacity"
            :min="0"
            :max="1"
            :step="0.05"
            @input="updateNumber('opacity', $event)"
          />
          <el-input-number
            :model-value="modelValue.opacity"
            :min="0"
            :max="1"
            :step="0.05"
            :controls="false"
            @change="update('opacity', Number($event ?? modelValue.opacity))"
          />
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import type { SvgStyleConfig } from "@/types/svgFlow";

const props = defineProps<{
  modelValue: SvgStyleConfig;
  primaryColor: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: SvgStyleConfig];
}>();

function update<Key extends keyof SvgStyleConfig>(key: Key, value: SvgStyleConfig[Key]): void {
  emit("update:modelValue", { ...props.modelValue, [key]: value });
}

function updateNumber(key: "strokeWidth" | "opacity", value: number | number[]): void {
  update(key, Array.isArray(value) ? value[0] : value);
}
</script>

<style scoped>
.svg-style-panel {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--dm-hairline);
}

.svg-style-panel summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--dm-primary);
  font-size: 13px;
  font-weight: 650;
  cursor: pointer;
  list-style: none;
}

.svg-style-panel summary::-webkit-details-marker { display: none; }
.svg-style-panel summary::after {
  content: "⌄";
  margin-left: auto;
  color: var(--dm-tertiary);
  transition: transform 140ms ease;
}
.svg-style-panel:not([open]) summary::after { transform: rotate(-90deg); }
.svg-style-panel summary small {
  margin-left: auto;
  color: var(--dm-tertiary);
  font-size: 11px;
  font-weight: 450;
}

.svg-style-fields {
  display: grid;
  gap: 16px;
  padding-top: 16px;
}

.svg-style-field {
  display: grid;
  gap: 8px;
  color: var(--dm-secondary);
  font-size: 12px;
}

.svg-color-row,
.svg-number-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--dm-param-number-width);
  align-items: center;
  gap: 10px;
}

.svg-color-row {
  grid-template-columns: 32px minmax(0, 1fr);
}

.svg-number-row :deep(.el-input-number) { width: var(--dm-param-number-width); }
</style>
