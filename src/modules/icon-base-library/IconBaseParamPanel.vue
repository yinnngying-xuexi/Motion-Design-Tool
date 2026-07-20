<template>
  <aside class="param-panel">
    <header class="section-head">
      <div>
        <h2>底座参数</h2>
      </div>
    </header>

    <el-empty v-if="!asset" description="上传或选择素材后编辑参数" />

    <el-scrollbar v-else class="param-scroll">
      <el-collapse v-model="openGroups">
        <el-collapse-item title="底座基础参数" name="base">
          <div class="control-grid">
            <NumberControl label="宽度" :value="config.width" :min="32" :max="360" unit="px" @change="patch({ width: $event })" />
            <NumberControl label="高度" :value="config.height" :min="32" :max="360" unit="px" @change="patch({ height: $event })" />
            <NumberControl label="透明度" :value="config.opacity" :min="0.1" :max="1" :step="0.05" @change="patch({ opacity: $event })" />
            <NumberControl label="缩放比例" :value="config.scale" :min="0.3" :max="2.5" :step="0.05" @change="patch({ scale: $event })" />
            <NumberControl label="旋转角度" :value="config.rotate" :min="-180" :max="180" unit="deg" @change="patch({ rotate: $event })" />
            <NumberControl label="图标大小" :value="config.iconSize" :min="8" :max="96" unit="px" @change="patch({ iconSize: $event })" />
          </div>
          <div class="inline-control">
            <span>图标颜色</span>
            <el-color-picker :model-value="config.iconColor" @change="patch({ iconColor: $event || config.iconColor })" />
          </div>
          <div class="inline-control">
            <span>显示图标</span>
            <el-switch :model-value="config.showIcon" @change="patch({ showIcon: Boolean($event) })" />
          </div>
        </el-collapse-item>

        <el-collapse-item title="动效参数" name="motion">
          <div class="stack">
            <label>
              <span>动效类型</span>
              <el-select :model-value="config.animationType" @change="patch({ animationType: $event })">
                <el-option label="无动效" value="none" />
                <el-option label="呼吸" value="pulse" />
                <el-option label="慢速旋转" value="rotate" />
                <el-option label="上下浮动" value="float" />
                <el-option label="闪烁" value="blink" />
                <el-option label="发光" value="glow" />
                <el-option label="脉冲扩散" value="ripple" />
              </el-select>
            </label>
            <NumberControl label="动效时长" :value="config.duration" :min="0.2" :max="10" :step="0.1" unit="s" @change="patch({ duration: $event })" />
            <NumberControl label="延迟时间" :value="config.delay" :min="0" :max="5" :step="0.1" unit="s" @change="patch({ delay: $event })" />
            <label>
              <span>循环次数</span>
              <el-select :model-value="config.iteration" @change="patch({ iteration: $event })">
                <el-option label="1 次" value="1" />
                <el-option label="2 次" value="2" />
                <el-option label="3 次" value="3" />
                <el-option label="无限循环" value="infinite" />
              </el-select>
            </label>
            <label>
              <span>缓动曲线</span>
              <el-select :model-value="config.timingFunction" @change="patch({ timingFunction: $event })">
                <el-option label="linear" value="linear" />
                <el-option label="ease" value="ease" />
                <el-option label="ease-in" value="ease-in" />
                <el-option label="ease-out" value="ease-out" />
                <el-option label="ease-in-out" value="ease-in-out" />
              </el-select>
            </label>
            <label>
              <span>动效方向</span>
              <el-select :model-value="config.direction" @change="patch({ direction: $event })">
                <el-option label="normal" value="normal" />
                <el-option label="reverse" value="reverse" />
                <el-option label="alternate" value="alternate" />
              </el-select>
            </label>
          </div>
        </el-collapse-item>

        <el-collapse-item title="光效参数" name="light">
          <div class="inline-control">
            <span>发光颜色</span>
            <el-color-picker :model-value="config.glowColor" @change="patch({ glowColor: $event || config.glowColor })" />
          </div>
          <NumberControl label="发光强度" :value="config.glowStrength" :min="0" :max="1" :step="0.05" @change="patch({ glowStrength: $event })" />
          <NumberControl label="阴影范围" :value="config.shadowBlur" :min="0" :max="72" unit="px" @change="patch({ shadowBlur: $event })" />
          <NumberControl label="扩散范围" :value="config.rippleSize" :min="40" :max="320" unit="px" @change="patch({ rippleSize: $event })" />
        </el-collapse-item>
      </el-collapse>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref } from "vue";
import { ElInputNumber, ElSlider } from "element-plus";
import { useIconBaseStore } from "@/stores/iconBaseStore";
import type { IconBaseAsset, IconBaseMotionConfig } from "@/types/iconBase";

const props = defineProps<{
  asset: IconBaseAsset | null;
}>();

const store = useIconBaseStore();
const openGroups = ref(["base", "motion", "light"]);

const config = computed(() => props.asset?.motionConfig ?? ({} as IconBaseMotionConfig));

function patch(configPatch: Partial<IconBaseMotionConfig>): void {
  store.updateCurrentAssetConfig(configPatch);
}

const NumberControl = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    unit: { type: String, default: "" }
  },
  emits: ["change"],
  setup(controlProps, { emit }) {
    return () =>
      h("div", { class: "number-control" }, [
        h("div", { class: "control-label" }, [
          h("span", controlProps.label),
          h("b", `${controlProps.value}${controlProps.unit}`)
        ]),
        h("div", { class: "control-row" }, [
          h(ElSlider, {
            modelValue: controlProps.value,
            min: controlProps.min,
            max: controlProps.max,
            step: controlProps.step,
            onInput: (value: number | number[]) => emit("change", Array.isArray(value) ? value[0] : value)
          }),
          h(ElInputNumber, {
            modelValue: controlProps.value,
            min: controlProps.min,
            max: controlProps.max,
            step: controlProps.step,
            controls: false,
            onChange: (value: number | undefined) => emit("change", Number(value ?? controlProps.value))
          })
        ])
      ]);
  }
});
</script>

<style scoped>
.param-panel {
  min-width: 0;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 16px;
}

.section-head span {
  color: var(--dm-secondary);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.section-head h2 {
  margin: 0;
  color: var(--dm-primary);
  font-size: 18px;
  line-height: 1.3;
}

.param-scroll {
  min-height: 0;
}

.control-grid,
.stack {
  display: grid;
  gap: 14px;
}

.inline-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

.inline-control span,
.stack label > span {
  display: block;
  margin-bottom: 8px;
  color: var(--dm-secondary);
  font-size: 13px;
}

:deep(.number-control) {
  display: grid;
  gap: 8px;
}

:deep(.control-label) {
  display: flex;
  justify-content: space-between;
  color: var(--dm-secondary);
  font-size: 13px;
}

:deep(.control-label b) {
  color: var(--dm-primary);
  font-weight: 600;
}

:deep(.control-row) {
  display: grid;
  grid-template-columns: 1fr 76px;
  gap: 10px;
  align-items: center;
}
</style>
