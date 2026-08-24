<template>
  <div class="star-ring-panel">
    <section class="source-card">
      <div><strong>{{ sourceName }}</strong><small>{{ sourceDescription }}</small></div>
      <div class="source-actions">
        <button v-if="showImportGuide" type="button" @click="$emit('showImportGuide')"><span aria-hidden="true">ⓘ</span> 导入说明</button>
        <button v-if="modelValue.kind !== 'layered-decoration' && modelValue.sourceMode === 'imported' && modelValue.svg?.mode === 'layered'" type="button" @click="$emit('remap')">重新映射</button>
        <button v-if="modelValue.sourceMode === 'imported'" type="button" @click="$emit('usePreset')">恢复预设</button>
      </div>
    </section>

    <template v-if="modelValue.kind === 'chart-tech-ring'">
      <p class="param-group-title">图表适配</p>
      <div class="chart-content-source">
        <div>
          <span>中心图表素材</span>
          <strong :title="modelValue.chartContentSvg?.fileName">{{ modelValue.chartContentSvg?.fileName ?? "暂未导入" }}</strong>
        </div>
        <button v-if="modelValue.chartContentSvg" type="button" @click="$emit('removeChartContent')">移除</button>
      </div>
      <div class="chart-size-info">
        <span>外环原始尺寸</span>
        <strong>{{ sourceDimensions }}</strong>
      </div>
      <ParamNumber
        label="中心图表尺寸"
        unit="px"
        :value="chartContentSize"
        :min="48"
        :max="chartContentSizeMax"
        :step="2"
        @update="updateChartContentSize"
      />
      <p class="chart-size-note">虚线区域是建议放置饼图或环形图的安全范围，只用于编辑预览，不会显示在最终页面中。</p>
    </template>

    <p class="param-group-title">实际素材图层</p>
    <div class="layer-list">
      <div
        v-for="layer in editableLayers"
        :key="layer.key"
        class="layer-row"
        :class="{ active: activeLayerKey === layer.key, hidden: !modelValue.layerConfigs[layer.key]?.visible }"
        :style="{ paddingLeft: `${10 + layer.depth * 12}px` }"
        role="button"
        tabindex="0"
        @click="activeLayerKey = layer.key"
        @keydown.enter.prevent="activeLayerKey = layer.key"
        @keydown.space.prevent="activeLayerKey = layer.key"
      >
        <span>{{ layer.label }}</span>
        <span class="layer-row-actions">
          <small>{{ layerChineseName(layer.key) }}</small>
          <button
            type="button"
            class="layer-visibility"
            :class="{ off: !modelValue.layerConfigs[layer.key]?.visible }"
            :aria-label="modelValue.layerConfigs[layer.key]?.visible ? `隐藏${layer.label}` : `显示${layer.label}`"
            :title="modelValue.layerConfigs[layer.key]?.visible ? '隐藏图层' : '显示图层'"
            @click.stop="toggleLayerVisibility(layer.key)"
          >
            <svg v-if="modelValue.layerConfigs[layer.key]?.visible" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.75"/></svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 16 16M9.8 6.3A10.6 10.6 0 0 1 12 6c6 0 9.5 6 9.5 6a15.8 15.8 0 0 1-2.2 2.8M6.2 7.4C3.8 9.2 2.5 12 2.5 12s3.5 6 9.5 6c1 0 2-.2 2.8-.5M10.1 10.1a2.75 2.75 0 0 0 3.8 3.8"/></svg>
          </button>
        </span>
      </div>
    </div>

    <template v-if="activeLayer">
        <p class="param-group-title">图层动效</p>
        <div class="param-field">
          <label><span>动效类型</span></label>
          <el-select :model-value="activeMotionValue" @change="updateMotionSelection">
            <el-option label="无动效" value="none" />
            <el-option-group v-if="componentMotionOptions.length" label="组件专属动效">
              <el-option v-for="option in componentMotionOptions" :key="option.value" :label="option.label" :value="option.value" />
            </el-option-group>
            <el-option-group v-for="group in basicMotionGroups" :key="group.label" :label="group.label">
              <el-option v-for="option in group.options" :key="option.value" :label="option.label" :value="option.value" />
            </el-option-group>
          </el-select>
        </div>

        <template v-if="activeBasicTemplate">
          <template v-for="group in activeBasicTemplate.paramGroups" :key="group.id">
            <p class="param-group-title">{{ group.title }}</p>
            <template v-for="param in group.params" :key="param.key">
              <ParamNumber
                v-if="param.type === 'number'"
                :label="param.label"
                :unit="param.unit"
                :value="Number(activeBasicConfig[param.key] ?? 0)"
                :min="param.min ?? 0"
                :max="param.max ?? 100"
                :step="param.step ?? 1"
                @update="updateBasicMotionParam(param.key, $event)"
              />
              <ColorParam
                v-else-if="param.type === 'color'"
                :label="param.label"
                :value="String(activeBasicConfig[param.key] ?? activeLayer.fillColor)"
                @update="updateBasicMotionParam(param.key, $event)"
              />
              <div v-else class="param-field">
                <label><span>{{ param.label }}</span></label>
                <el-select :model-value="activeBasicConfig[param.key]" @change="updateBasicMotionParam(param.key, $event)">
                  <el-option v-for="option in param.options" :key="option.value" :label="option.label" :value="option.value" />
                </el-select>
              </div>
            </template>
          </template>
        </template>

        <template v-else-if="activeLayer.motion !== 'none'">
          <template v-if="isSpecialMotionActive">
            <ParamNumber label="动效时长" unit="s" :value="activeLayer.duration" :min="0.5" :max="20" :step="0.1" @update="updateLayer('duration', $event)" />
            <ParamNumber label="开始延迟" unit="s" :value="activeLayer.delay" :min="0" :max="5" :step="0.1" @update="updateLayer('delay', $event)" />
          </template>
          <div v-if="showsDirection" class="param-field">
            <label><span>{{ activeRole === 'rotating-ring' || activeRole === 'highlight' ? '轮转方向' : '旋转方向' }}</span></label>
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
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, ref, watch } from "vue";
import { ElColorPicker, ElInput, ElInputNumber, ElSlider } from "element-plus";
import type { StarRingDecorationConfig, StarRingLayerConfig, StarRingLayerRole, StarRingMotionType, StarRingSvgLayer } from "@/types/decoration";
import { STAR_RING_ROLE_LABELS, STAR_RING_ROLE_ORDER, STAR_RING_ROLE_PROFILES } from "@/utils/starRingDecoration";
import { basicMotions, createBasicMotionConfig } from "@/data/basicMotions";
import type { BasicMotionConfig, BasicMotionParamKey, BasicMotionTemplate, MotionCategory } from "@/types/motion";

const props = withDefaults(defineProps<{ modelValue: StarRingDecorationConfig; showImportGuide?: boolean }>(), {
  showImportGuide: false
});
const emit = defineEmits<{ "update:modelValue": [value: StarRingDecorationConfig]; usePreset: []; remap: []; showImportGuide: []; removeChartContent: [] }>();
const activeLayerKey = ref("");
const activeRoleOrder = computed<readonly StarRingLayerRole[]>(() => props.modelValue.kind === "chart-tech-ring"
  ? STAR_RING_ROLE_PROFILES["chart-tech-ring"]
  : props.modelValue.kind === "star-ring"
    ? STAR_RING_ROLE_PROFILES["star-ring"]
    : STAR_RING_ROLE_ORDER);
const editableLayers = computed<StarRingSvgLayer[]>(() => {
  if (props.modelValue.svg?.mode === "whole") return [{ key: "dm-svg-whole", id: "whole", label: "整体素材", tagName: "svg", parentKey: null, depth: 0 }];
  const layers = props.modelValue.svg?.layers ?? [];
  const byKey = new Map(layers.map((layer) => [layer.key, layer]));
  const ordered = activeRoleOrder.value
    .filter((role) => role !== "particles")
    .flatMap((role) => props.modelValue.layerMapping[role])
    .map((key) => byKey.get(key))
    .filter((layer): layer is StarRingSvgLayer => Boolean(layer));
  const orderedKeys = new Set(ordered.map((layer) => layer.key));
  return [...ordered, ...layers.filter((layer) => !orderedKeys.has(layer.key))];
});
const activeLayer = computed(() => props.modelValue.layerConfigs[activeLayerKey.value]);
const activeRole = computed(() => roleForLayer(activeLayerKey.value));
const activeMotionValue = computed(() => {
  if (!activeLayer.value || activeLayer.value.motion === "none") return "none";
  if (activeLayer.value.motion === "basic" && activeLayer.value.basicMotionId) return `basic:${activeLayer.value.basicMotionId}`;
  if (activeRole.value === "rotating-ring" && activeLayer.value.motion === "rotate") return "special:ring-highlight";
  return `special:${activeLayer.value.motion}`;
});
const showsDirection = computed(() => activeMotionValue.value === "special:rotate" || activeMotionValue.value === "special:ring-highlight");
const activeBasicTemplate = computed<BasicMotionTemplate | undefined>(() => activeLayer.value?.motion === "basic"
  ? basicMotions.find((motion) => motion.id === activeLayer.value?.basicMotionId)
  : undefined);
const activeBasicConfig = computed<Partial<BasicMotionConfig>>(() => activeLayer.value?.basicMotionConfig ?? {});
const sourceName = computed(() => props.modelValue.sourceMode === "preset"
  ? props.modelValue.kind === "layered-decoration"
    ? "系统预设 SVG"
    : props.modelValue.kind === "chart-tech-ring"
      ? "饼图环形 SVG"
      : "星环粒子底座 SVG"
  : props.modelValue.svg?.fileName ?? "导入素材");
const sourceDescription = computed(() => props.modelValue.svg?.mode === "whole" ? "整体素材" : `${props.modelValue.svg?.layers.length ?? 0} 个 SVG 图层`);
const sourceDimensions = computed(() => `${Math.round(props.modelValue.svg?.width ?? props.modelValue.overall.size)} × ${Math.round(props.modelValue.svg?.height ?? props.modelValue.overall.size)} px`);
const chartContentSize = computed(() => props.modelValue.chartContentSize ?? 208);
const chartContentSizeMax = computed(() => Math.max(48, Math.floor(Math.min(
  props.modelValue.svg?.width ?? props.modelValue.overall.size,
  props.modelValue.svg?.height ?? props.modelValue.overall.size
) * 0.8)));
const componentMotionOptions = computed<Array<{ label: string; value: string }>>(() => {
  const options: Array<{ label: string; value: string }> = [];
  if (props.modelValue.kind === "layered-decoration") return options;
  const role = activeRole.value;
  if (props.modelValue.svg?.mode === "whole") options.push({ label: "持续旋转", value: "special:rotate" });
  if (role === "rotating-ring" || role === "highlight") options.push({ label: "环形高亮轮转", value: "special:ring-highlight" });
  if (role === "particles") options.push({ label: "粒子漂浮", value: "special:particle-float" });
  if (activeLayer.value?.motion === "pulse") options.push({ label: "轻微呼吸（旧版）", value: "special:pulse" });
  return options;
});
const compatibleBasicMotionIds = new Set(["fade-in", "slide-up", "slide-left", "scale-in", "breath", "float", "soft-blink", "glow-pulse", "slow-rotate", "scale-tip", "highlight-glow", "alert-blink"]);
const basicMotionGroups = computed(() => {
  const categories: MotionCategory[] = ["入场动效", "循环动效", "强调动效", "告警动效"];
  return categories.map((category) => ({
    label: category,
    options: basicMotions
      .filter((motion) => motion.category === category && compatibleBasicMotionIds.has(motion.id))
      .map((motion) => ({ label: motion.name, value: `basic:${motion.id}` }))
  })).filter((group) => group.options.length);
});
const isSpecialMotionActive = computed(() => activeLayer.value && !["none", "basic"].includes(activeLayer.value.motion));

watch(editableLayers, (layers) => { if (!layers.some((layer) => layer.key === activeLayerKey.value)) activeLayerKey.value = layers[0]?.key ?? ""; }, { immediate: true });
function cloneConfig(): StarRingDecorationConfig { return JSON.parse(JSON.stringify(props.modelValue)) as StarRingDecorationConfig; }
function roleForLayer(key: string): StarRingLayerRole | undefined { return activeRoleOrder.value.find((role) => props.modelValue.layerMapping[role].includes(key)); }
function layerChineseName(key: string): string {
  if (props.modelValue.kind === "layered-decoration") return "素材图层";
  const role = roleForLayer(key);
  if (role) return STAR_RING_ROLE_LABELS[role];
  return props.modelValue.svg?.mode === "whole" ? "整体素材" : "普通图层";
}
function updateLayer<Key extends keyof StarRingLayerConfig>(key: Key, value: StarRingLayerConfig[Key]): void {
  const next = cloneConfig();
  if (!next.layerConfigs[activeLayerKey.value]) return;
  next.layerConfigs[activeLayerKey.value][key] = value;
  emit("update:modelValue", next);
}
function toggleLayerVisibility(key: string): void {
  const next = cloneConfig();
  const layer = next.layerConfigs[key];
  if (!layer) return;
  layer.visible = !layer.visible;
  emit("update:modelValue", next);
}
function updateChartContentSize(value: number): void {
  const next = cloneConfig();
  next.chartContentSize = value;
  emit("update:modelValue", next);
}
function updateMotionSelection(value: string): void {
  const next = cloneConfig();
  const layer = next.layerConfigs[activeLayerKey.value];
  if (!layer) return;
  if (value === "none") {
    layer.motion = "none";
    layer.basicMotionId = undefined;
    layer.basicMotionConfig = undefined;
  } else if (value.startsWith("basic:")) {
    const id = value.slice("basic:".length);
    const template = basicMotions.find((motion) => motion.id === id);
    if (!template) return;
    layer.motion = "basic";
    layer.basicMotionId = id;
    layer.basicMotionConfig = createBasicMotionConfig(template, layer.fillColor);
  } else {
    layer.motion = value.slice("special:".length) as StarRingMotionType;
    layer.basicMotionId = undefined;
    layer.basicMotionConfig = undefined;
  }
  emit("update:modelValue", next);
}
function updateBasicMotionParam(key: BasicMotionParamKey, value: string | number): void {
  const next = cloneConfig();
  const layer = next.layerConfigs[activeLayerKey.value];
  if (!layer || layer.motion !== "basic") return;
  layer.basicMotionConfig = { ...(layer.basicMotionConfig ?? {}), [key]: value };
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
.star-ring-panel{display:grid;gap:16px}.star-ring-panel .param-group-title{margin:2px 0 -2px;color:var(--dm-primary);font-size:12px;font-weight:600}.star-ring-panel .param-field{display:grid;gap:8px}.star-ring-panel .param-field label{display:flex;justify-content:space-between;color:var(--dm-secondary);font-size:12px}.star-ring-panel .param-field label small{font-family:"Geist Mono",ui-monospace,monospace}.star-ring-panel .number-row{display:grid;grid-template-columns:minmax(0,1fr) var(--dm-param-value-width);gap:10px;align-items:center}.star-ring-panel .number-row .el-input-number{width:var(--dm-param-value-width)}.star-ring-panel .color-row{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;align-items:center}.star-ring-panel .source-card{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:11px;border-radius:7px;background:rgba(255,255,255,.035)}.star-ring-panel .source-card>div:first-child{min-width:0;display:grid;gap:3px}.star-ring-panel .source-card strong{overflow:hidden;color:var(--dm-primary);font-size:11px;text-overflow:ellipsis;white-space:nowrap}.star-ring-panel .source-card small{color:var(--dm-secondary);font-size:10px}.star-ring-panel .source-actions{display:flex;gap:6px}.star-ring-panel .source-actions button{padding:0;border:0;background:transparent;color:#1683ff;font-size:10px;cursor:pointer;white-space:nowrap}.star-ring-panel .naming-guide{padding:10px 11px;border-radius:7px;background:rgba(255,255,255,.025)}.star-ring-panel .naming-guide summary{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--dm-primary);font-size:11px;font-weight:600;cursor:pointer;list-style:none}.star-ring-panel .naming-guide summary::-webkit-details-marker{display:none}.star-ring-panel .naming-guide summary::after{content:"⌄";color:var(--dm-secondary);font-size:12px;transition:transform .18s}.star-ring-panel .naming-guide[open] summary::after{transform:rotate(180deg)}.star-ring-panel .naming-guide summary small{margin-left:auto;color:var(--dm-secondary);font-size:9px;font-weight:400}.star-ring-panel .naming-guide-list{display:grid;gap:5px;margin-top:10px}.star-ring-panel .naming-guide-list>div{display:grid;grid-template-columns:58px minmax(0,1fr) 48px;align-items:center;gap:6px;min-height:24px}.star-ring-panel .naming-guide-list span{color:#b8b8b8;font-size:10px}.star-ring-panel .naming-guide-list span small{margin-left:3px;color:#686868;font-size:8px}.star-ring-panel .naming-guide-list code{overflow:hidden;color:#79b8ff;font:9px/1.4 "Geist Mono",ui-monospace,monospace;text-overflow:ellipsis;white-space:nowrap}.star-ring-panel .naming-guide-list em{color:#777;font-size:9px;font-style:normal;text-align:right}.star-ring-panel .naming-guide p{margin:8px 0 0;color:#686868;font-size:9px;line-height:1.5}.star-ring-panel .layer-list{display:grid;gap:4px}.star-ring-panel .layer-row{display:flex;align-items:center;justify-content:space-between;min-height:38px;padding-right:7px;border-radius:5px;background:rgba(255,255,255,.025);color:var(--dm-secondary);cursor:pointer;outline:none}.star-ring-panel .layer-row:hover,.star-ring-panel .layer-row:focus-visible{background:rgba(255,255,255,.055);color:var(--dm-primary)}.star-ring-panel .layer-row.active{background:rgba(255,255,255,.09);color:var(--dm-primary)}.star-ring-panel .layer-row.hidden>span:first-child{opacity:.46}.star-ring-panel .layer-row-actions{display:flex;align-items:center;gap:7px}.star-ring-panel .layer-list small{font-size:9px;color:var(--dm-secondary)}.star-ring-panel .layer-visibility{display:grid;place-items:center;width:26px;height:26px;padding:0;border:0;border-radius:4px;background:transparent;color:#a8a8a8;cursor:pointer}.star-ring-panel .layer-visibility:hover{background:rgba(255,255,255,.08);color:#fff}.star-ring-panel .layer-visibility.off{color:#5e5e5e}.star-ring-panel .layer-visibility svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.star-ring-panel .binding-row{display:flex;align-items:center;justify-content:space-between;padding:10px;border-radius:6px;background:rgba(255,255,255,.025);color:var(--dm-secondary);font-size:11px}.star-ring-panel .binding-row strong{color:var(--dm-primary);font-weight:500}
.star-ring-panel .chart-size-info{display:flex;align-items:center;justify-content:space-between;min-height:36px;padding:0 10px;border-radius:6px;background:rgba(255,255,255,.025);color:var(--dm-secondary);font-size:11px}.star-ring-panel .chart-size-info strong{color:var(--dm-primary);font:500 11px/1.4 "Geist Mono",ui-monospace,monospace}.star-ring-panel .chart-size-note{margin:-4px 0 0;color:#737373;font-size:10px;line-height:1.6}
.star-ring-panel .chart-content-source{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px;border-radius:6px;background:rgba(0,112,243,.055)}.star-ring-panel .chart-content-source>div{min-width:0;display:grid;gap:3px}.star-ring-panel .chart-content-source span{color:var(--dm-secondary);font-size:10px}.star-ring-panel .chart-content-source strong{overflow:hidden;color:var(--dm-primary);font-size:11px;font-weight:500;text-overflow:ellipsis;white-space:nowrap}.star-ring-panel .chart-content-source button{padding:0;border:0;background:transparent;color:#ff6b6b;font-size:10px;cursor:pointer}
</style>
