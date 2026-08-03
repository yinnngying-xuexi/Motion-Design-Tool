<template>
  <div class="star-ring-panel">
    <div class="scope-tabs">
      <button type="button" :class="{ active: scope === 'overall' }" @click="scope = 'overall'">整体</button>
      <button type="button" :class="{ active: scope === 'layer' }" @click="scope = 'layer'">图层</button>
    </div>

    <template v-if="scope === 'overall'">
      <p class="param-group-title">整体设置</p>
      <ParamNumber label="尺寸" unit="px" :value="modelValue.overall.size" :min="80" :max="360" :step="1" @update="updateOverall('size', $event)" />
      <ParamNumber label="横向位置" unit="px" :value="modelValue.overall.offsetX" :min="-160" :max="160" :step="1" @update="updateOverall('offsetX', $event)" />
      <ParamNumber label="纵向位置" unit="px" :value="modelValue.overall.offsetY" :min="-120" :max="120" :step="1" @update="updateOverall('offsetY', $event)" />
      <ParamNumber label="整体透明度" :value="modelValue.overall.opacity" :min="0" :max="1" :step="0.05" @update="updateOverall('opacity', $event)" />
      <ColorParam label="主色" :value="modelValue.overall.color" @update="updateOverall('color', $event)" />
    </template>

    <template v-else>
      <section class="source-card">
        <div><strong>{{ sourceName }}</strong><small>{{ sourceDescription }}</small></div>
        <div class="source-actions">
          <button v-if="modelValue.sourceMode === 'imported' && modelValue.svg?.mode === 'layered'" type="button" @click="$emit('remap')">重新映射</button>
          <button v-if="modelValue.sourceMode === 'imported'" type="button" @click="$emit('usePreset')">恢复预设</button>
        </div>
      </section>

      <p class="param-group-title">实际素材图层</p>
      <div class="layer-list">
        <button
          v-for="layer in editableLayers"
          :key="layer.key"
          type="button"
          :class="{ active: activeLayerKey === layer.key, disabled: !roleForLayer(layer.key) && modelValue.svg?.mode !== 'whole' }"
          :style="{ paddingLeft: `${10 + layer.depth * 12}px` }"
          @click="activeLayerKey = layer.key"
        ><span>{{ layer.label }}</span><small>{{ layerStatus(layer.key) }}</small></button>
      </div>

      <template v-if="activeLayer">
        <div class="binding-row"><span>绑定角色</span><strong>{{ activeRoleLabel }}</strong></div>
        <p class="param-group-title">素材样式</p>
        <div class="param-field switch-field">
          <label><span>显示图层</span></label>
          <el-switch :model-value="activeLayer.visible" :disabled="!activeRole && modelValue.svg?.mode !== 'whole'" @change="updateLayer('visible', Boolean($event))" />
        </div>
        <div class="param-field">
          <label><span>颜色模式</span></label>
          <el-select :model-value="activeLayer.colorMode" @change="updateLayer('colorMode', $event)">
            <el-option label="保留原色" value="original" />
            <el-option label="单色覆盖" value="monochrome" />
          </el-select>
        </div>
        <template v-if="activeLayer.colorMode === 'monochrome'">
          <ColorParam label="填充颜色" :value="activeLayer.fillColor" @update="updateLayer('fillColor', $event)" />
          <ColorParam label="描边颜色" :value="activeLayer.strokeColor" @update="updateLayer('strokeColor', $event)" />
          <ParamNumber label="描边宽度" unit="px" :value="activeLayer.strokeWidth" :min="0" :max="12" :step="0.5" @update="updateLayer('strokeWidth', $event)" />
        </template>
        <ParamNumber label="图层透明度" :value="activeLayer.opacity" :min="0" :max="1" :step="0.05" @update="updateLayer('opacity', $event)" />

        <template v-if="activeRole || modelValue.svg?.mode === 'whole'">
          <p class="param-group-title">图层动效</p>
          <div class="param-field">
            <label><span>动效类型</span></label>
            <el-select :model-value="activeLayer.motion" @change="updateLayer('motion', $event)">
              <el-option v-for="option in motionOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-select>
          </div>
          <template v-if="activeLayer.motion !== 'none'">
            <ParamNumber label="动效时长" unit="s" :value="activeLayer.duration" :min="0.5" :max="20" :step="0.1" @update="updateLayer('duration', $event)" />
            <ParamNumber label="开始延迟" unit="s" :value="activeLayer.delay" :min="0" :max="5" :step="0.1" @update="updateLayer('delay', $event)" />
          </template>
          <div v-if="activeLayer.motion === 'rotate'" class="param-field">
            <label><span>旋转方向</span></label>
            <el-select :model-value="activeLayer.direction" @change="updateLayer('direction', $event)">
              <el-option label="顺时针" value="clockwise" /><el-option label="逆时针" value="counterclockwise" />
            </el-select>
          </div>
          <ParamNumber v-if="activeLayer.motion === 'pulse'" label="最小缩放" :value="activeLayer.minScale" :min="0.7" :max="0.99" :step="0.01" @update="updateLayer('minScale', $event)" />
          <template v-if="activeLayer.motion === 'particle-float'">
            <ParamNumber label="漂浮距离" unit="px" :value="activeLayer.distance" :min="2" :max="48" :step="1" @update="updateLayer('distance', $event)" />
            <ParamNumber label="最低透明度" :value="activeLayer.minOpacity" :min="0" :max="0.95" :step="0.05" @update="updateLayer('minOpacity', $event)" />
          </template>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from "vue";
import { ElColorPicker, ElInput, ElInputNumber, ElSlider } from "element-plus";
import type { StarRingDecorationConfig, StarRingLayerConfig, StarRingLayerRole, StarRingMotionType, StarRingOverallConfig, StarRingSvgLayer } from "@/types/decoration";
import { STAR_RING_ROLE_LABELS, STAR_RING_ROLE_ORDER } from "@/utils/starRingDecoration";

const props = defineProps<{ modelValue: StarRingDecorationConfig }>();
const emit = defineEmits<{ "update:modelValue": [value: StarRingDecorationConfig]; usePreset: []; remap: [] }>();
const scope = ref<"overall" | "layer">("overall");
const activeLayerKey = ref("preset-rotating-ring");
const presetLayers: StarRingSvgLayer[] = STAR_RING_ROLE_ORDER.map((role) => ({ key: `preset-${role}`, id: role, label: STAR_RING_ROLE_LABELS[role], tagName: "g", parentKey: null, depth: 0 }));
const editableLayers = computed<StarRingSvgLayer[]>(() => {
  if (props.modelValue.sourceMode === "preset") return presetLayers;
  if (props.modelValue.svg?.mode === "whole") return [{ key: "dm-svg-whole", id: "whole", label: "整体素材", tagName: "svg", parentKey: null, depth: 0 }];
  return props.modelValue.svg?.layers ?? [];
});
const activeLayer = computed(() => props.modelValue.layerConfigs[activeLayerKey.value]);
const activeRole = computed(() => roleForLayer(activeLayerKey.value));
const activeRoleLabel = computed(() => activeRole.value ? STAR_RING_ROLE_LABELS[activeRole.value] : props.modelValue.svg?.mode === "whole" ? "整体素材" : "未绑定");
const sourceName = computed(() => props.modelValue.sourceMode === "preset" ? "系统预设素材" : props.modelValue.svg?.fileName ?? "导入素材");
const sourceDescription = computed(() => props.modelValue.sourceMode === "preset" ? "五个标准图层角色" : props.modelValue.svg?.mode === "whole" ? "单图形整体模式" : `${props.modelValue.svg?.layers.length ?? 0} 个可映射分组`);
const motionOptions = computed<Array<{ label: string; value: StarRingMotionType }>>(() => {
  const common: Array<{ label: string; value: StarRingMotionType }> = [{ label: "无动效", value: "none" }];
  const role = activeRole.value;
  if (props.modelValue.svg?.mode === "whole") return [...common, { label: "持续旋转", value: "rotate" }, { label: "轻微呼吸", value: "pulse" }, { label: "粒子漂浮", value: "particle-float" }];
  if (role === "rotating-ring") return [...common, { label: "持续旋转", value: "rotate" }, { label: "轻微呼吸", value: "pulse" }];
  if (role === "particles") return [...common, { label: "粒子漂浮", value: "particle-float" }, { label: "轻微呼吸", value: "pulse" }];
  if (role === "center") return [...common, { label: "轻微呼吸", value: "pulse" }, { label: "持续旋转", value: "rotate" }];
  return [...common, { label: "轻微呼吸", value: "pulse" }];
});

watch(editableLayers, (layers) => { if (!layers.some((layer) => layer.key === activeLayerKey.value)) activeLayerKey.value = layers[0]?.key ?? ""; }, { immediate: true });
function cloneConfig(): StarRingDecorationConfig { return JSON.parse(JSON.stringify(props.modelValue)) as StarRingDecorationConfig; }
function roleForLayer(key: string): StarRingLayerRole | undefined { return STAR_RING_ROLE_ORDER.find((role) => props.modelValue.layerMapping[role].includes(key)); }
function layerStatus(key: string): string {
  const role = roleForLayer(key);
  if (!role && props.modelValue.svg?.mode !== "whole") return props.modelValue.layerConfigs[key]?.visible ? "结构容器" : "未绑定";
  return props.modelValue.layerConfigs[key]?.visible ? (role ? STAR_RING_ROLE_LABELS[role] : "整体") : "已隐藏";
}
function updateOverall<Key extends keyof StarRingOverallConfig>(key: Key, value: StarRingOverallConfig[Key]): void {
  const next = cloneConfig();
  if (key === "color") {
    const previous = next.overall.color;
    Object.values(next.layerConfigs).forEach((layer) => { if (layer.fillColor === previous) layer.fillColor = String(value); if (layer.strokeColor === previous) layer.strokeColor = String(value); });
  }
  next.overall[key] = value;
  emit("update:modelValue", next);
}
function updateLayer<Key extends keyof StarRingLayerConfig>(key: Key, value: StarRingLayerConfig[Key]): void {
  const next = cloneConfig();
  if (!next.layerConfigs[activeLayerKey.value]) return;
  next.layerConfigs[activeLayerKey.value][key] = value;
  emit("update:modelValue", next);
}

const ParamNumber = defineComponent({
  props: { label: { type: String, required: true }, unit: { type: String, default: "" }, value: { type: Number, required: true }, min: { type: Number, required: true }, max: { type: Number, required: true }, step: { type: Number, required: true } },
  emits: ["update"],
  setup(controlProps, { emit: controlEmit }) {
    return () => h("div", { class: "param-field" }, [h("label", [h("span", controlProps.label), controlProps.unit ? h("small", controlProps.unit) : null]), h("div", { class: "number-row" }, [h(ElSlider, { modelValue: controlProps.value, min: controlProps.min, max: controlProps.max, step: controlProps.step, "onUpdate:modelValue": (value: number | number[]) => controlEmit("update", Array.isArray(value) ? value[0] : value) }), h(ElInputNumber, { modelValue: controlProps.value, min: controlProps.min, max: controlProps.max, step: controlProps.step, controls: false, "onUpdate:modelValue": (value: number | undefined) => value !== undefined && controlEmit("update", value) })])]);
  }
});
const ColorParam = defineComponent({
  props: { label: { type: String, required: true }, value: { type: String, required: true } }, emits: ["update"],
  setup(colorProps, { emit: colorEmit }) { return () => h("div", { class: "param-field" }, [h("label", [h("span", colorProps.label)]), h("div", { class: "color-row" }, [h(ElColorPicker, { modelValue: colorProps.value, "onUpdate:modelValue": (value: string | null) => value && colorEmit("update", value) }), h(ElInput, { modelValue: colorProps.value, onChange: (value: string) => colorEmit("update", value) })])]); }
});
</script>

<style>
.star-ring-panel{display:grid;gap:16px}.star-ring-panel .scope-tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;padding:3px;border-radius:6px;background:rgba(255,255,255,.035)}.star-ring-panel .scope-tabs button{height:30px;border:0;border-radius:4px;background:transparent;color:var(--dm-secondary);cursor:pointer}.star-ring-panel .scope-tabs button.active{background:rgba(255,255,255,.1);color:var(--dm-primary)}.star-ring-panel .param-group-title{margin:2px 0 -2px;color:var(--dm-primary);font-size:12px;font-weight:600}.star-ring-panel .param-field{display:grid;gap:8px}.star-ring-panel .param-field label{display:flex;justify-content:space-between;color:var(--dm-secondary);font-size:12px}.star-ring-panel .param-field label small{font-family:"Geist Mono",ui-monospace,monospace}.star-ring-panel .number-row{display:grid;grid-template-columns:minmax(0,1fr) var(--dm-param-value-width);gap:10px;align-items:center}.star-ring-panel .number-row .el-input-number{width:var(--dm-param-value-width)}.star-ring-panel .color-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:center}.star-ring-panel .switch-field{grid-template-columns:1fr auto;align-items:center}.star-ring-panel .source-card{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:11px;border-radius:7px;background:rgba(255,255,255,.035)}.star-ring-panel .source-card>div:first-child{min-width:0;display:grid;gap:3px}.star-ring-panel .source-card strong{overflow:hidden;color:var(--dm-primary);font-size:11px;text-overflow:ellipsis;white-space:nowrap}.star-ring-panel .source-card small{color:var(--dm-secondary);font-size:10px}.star-ring-panel .source-actions{display:flex;gap:6px}.star-ring-panel .source-actions button{padding:0;border:0;background:transparent;color:#1683ff;font-size:10px;cursor:pointer;white-space:nowrap}.star-ring-panel .layer-list{display:grid;gap:4px}.star-ring-panel .layer-list button{display:flex;align-items:center;justify-content:space-between;min-height:36px;padding-right:9px;border:0;border-radius:5px;background:rgba(255,255,255,.025);color:var(--dm-secondary);cursor:pointer}.star-ring-panel .layer-list button.active{background:rgba(255,255,255,.09);color:var(--dm-primary)}.star-ring-panel .layer-list button.disabled{opacity:.5}.star-ring-panel .layer-list small{font-size:9px;color:var(--dm-secondary)}.star-ring-panel .binding-row{display:flex;align-items:center;justify-content:space-between;padding:10px;border-radius:6px;background:rgba(255,255,255,.025);color:var(--dm-secondary);font-size:11px}.star-ring-panel .binding-row strong{color:var(--dm-primary);font-weight:500}
</style>
