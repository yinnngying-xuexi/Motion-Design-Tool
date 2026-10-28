<template>
  <section class="motion-scale-control">
    <div class="scale-heading"><h3>整体缩放</h3><button type="button" @click="commit(100)">100%</button></div>
    <div class="scale-inputs">
      <el-slider :model-value="value" :min="1" :max="1000" :step="1" @input="update" @change="$emit('commit')" />
      <el-input-number :model-value="value" :min="1" :max="1000" :step="1" :controls="false" aria-label="整体缩放百分比" @change="commit" />
      <small>%</small>
    </div>
    <p>宽高等比缩放，背景不变；100% 为当前组件尺寸。</p>
    <p v-if="width && height">实际尺寸 {{ format(width * value / 100) }} × {{ format(height * value / 100) }} px</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { motionScaleFactor } from "@/utils/motionScale";
const props = defineProps<{ modelValue: number; width?: number; height?: number }>();
const emit = defineEmits<{ "update:modelValue": [value: number]; commit: [] }>();
const value = computed(() => Number((motionScaleFactor(props.modelValue) * 100).toFixed(2)));
function update(next: number | number[] | undefined): void {
  emit("update:modelValue", Number((motionScaleFactor(Array.isArray(next) ? next[0] : next ?? 100) * 100).toFixed(2)));
}
function commit(next: number | undefined): void { update(next); emit("commit"); }
function format(next: number): string { return Number(next.toFixed(1)).toString(); }
</script>

<style scoped>
.motion-scale-control{display:grid;gap:12px;padding:16px 0;border-bottom:1px solid var(--dm-hairline);margin-bottom:16px;}
.scale-heading{display:flex;align-items:center;justify-content:space-between;}
h3{margin:0;font-size:13px;font-weight:600;color:var(--dm-primary);}
.scale-heading button{padding:0;border:0;background:none;color:#0070f3;font-size:11px;cursor:pointer;}
.scale-inputs{display:grid;grid-template-columns:minmax(0,1fr) 60px 10px;align-items:center;gap:8px;}
.scale-inputs :deep(.el-input-number){width:60px;}
.scale-inputs :deep(.el-slider){min-width:0;margin:0 10px;}
.scale-inputs :deep(.el-slider__button){width:16px;height:16px;}
small,p{font-size:11px;color:var(--dm-tertiary);}
p{margin:0;line-height:1.5;}
</style>
