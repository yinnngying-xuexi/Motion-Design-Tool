<template>
  <el-dialog class="star-ring-mapping-dialog" :model-value="modelValue" title="图层识别与动效映射" width="920px" destroy-on-close @close="$emit('update:modelValue', false)">
    <div class="mapping-layout">
      <section class="mapping-tree-panel">
        <header><strong>SVG 图层树</strong><small>{{ unnamedCount ? `${unnamedCount} 个未命名` : `${asset.layers.length} 个图层` }}</small></header>
        <p v-if="unnamedCount" class="mapping-name-warning">此 SVG 未保留部分 Figma 图层名，请在下方直接重命名后再映射。</p>
        <div class="mapping-tree">
          <div
            v-for="layer in asset.layers"
            :key="layer.key"
            class="mapping-tree-row"
            :class="{ active: highlightedKey === layer.key }"
            :style="{ paddingLeft: `${12 + layer.depth * 16}px` }"
            @mouseenter="highlightedKey = layer.key"
            @click="highlightedKey = layer.key"
          >
            <el-input
              v-model="draftLabels[layer.key]"
              maxlength="40"
              :aria-label="`重命名 ${layer.label}`"
              @focus="highlightedKey = layer.key"
              @click.stop
              @change="suggestMappingFromLabels"
            />
            <small>{{ layer.tagName }}</small>
          </div>
        </div>
      </section>

      <section class="mapping-preview-panel">
        <header><strong>素材预览</strong><small>悬停左侧图层可定位</small></header>
        <div class="mapping-preview dm-motion-canvas" v-html="highlightedMarkup"></div>
      </section>

      <section class="mapping-role-panel">
        <header><strong>动效角色</strong><small>一个角色可绑定多个分组</small></header>
        <div class="mapping-role-list">
          <label v-for="role in roleOrder" :key="role">
            <span>{{ roleLabels[role] }}</span>
            <el-select :model-value="draft[role]" multiple collapse-tags collapse-tags-tooltip popper-class="star-ring-mapping-select-popper" placeholder="可选，不匹配则关闭" @change="updateRole(role, $event)">
              <el-option v-for="layer in asset.layers" :key="layer.key" :label="layerOptionLabel(layer)" :value="layer.key" :disabled="isUsedByOtherRole(layer.key, role)" />
            </el-select>
          </label>
        </div>
      </section>
    </div>
    <template #footer>
      <div class="mapping-footer-note">已映射 {{ mappedCount }} / {{ asset.layers.length }} 个分组，未映射图层将作为普通图层保留。</div>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" class="dm-blue-action" @click="confirmMapping">{{ confirmLabel }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { StarRingLayerMapping, StarRingLayerRole, StarRingSvgAsset, StarRingSvgLayer } from "@/types/decoration";
import { autoMapStarRingLayers, STAR_RING_ROLE_LABELS, STAR_RING_ROLE_PROFILES } from "@/utils/starRingDecoration";

const props = withDefaults(defineProps<{
  modelValue: boolean;
  asset: StarRingSvgAsset;
  mapping: StarRingLayerMapping;
  roleProfile?: "star-ring" | "chart-tech-ring";
}>(), { roleProfile: "star-ring" });
const emit = defineEmits<{ "update:modelValue": [value: boolean]; confirm: [mapping: StarRingLayerMapping, labels: Record<string, string>] }>();
const roleOrder = computed(() => STAR_RING_ROLE_PROFILES[props.roleProfile]);
const roleLabels = STAR_RING_ROLE_LABELS;
const confirmLabel = computed(() => props.roleProfile === "chart-tech-ring" ? "应用到饼图环形" : "应用到星环底座");
const draft = ref<StarRingLayerMapping>(cloneMapping(props.mapping));
const draftLabels = ref<Record<string, string>>(createLabelDraft(props.asset));
const highlightedKey = ref(props.asset.layers[0]?.key ?? "");

watch(() => [props.modelValue, props.asset, props.mapping] as const, () => {
  if (!props.modelValue) return;
  draft.value = cloneMapping(props.mapping);
  draftLabels.value = createLabelDraft(props.asset);
  highlightedKey.value = props.asset.layers[0]?.key ?? "";
}, { deep: true });

const mappedCount = computed(() => new Set(Object.values(draft.value).flat()).size);
const unnamedCount = computed(() => props.asset.layers.filter((layer) => {
  if (layer.id) return false;
  return draftLabels.value[layer.key]?.trim() === layer.label;
}).length);
const highlightedMarkup = computed(() => {
  const selector = highlightedKey.value.replace(/[^a-zA-Z0-9-]/g, "");
  const css = selector ? `<style>[data-dm-node-key="${selector}"]{filter:drop-shadow(0 0 6px #0070f3) drop-shadow(0 0 14px #0070f3);opacity:1!important;}</style>` : "";
  return `${css}${props.asset.markup}`;
});

function cloneMapping(mapping: StarRingLayerMapping): StarRingLayerMapping {
  const availableKeys = new Set(props.asset.layers.map((layer) => layer.key));
  const cloned = JSON.parse(JSON.stringify(mapping)) as StarRingLayerMapping;
  roleOrder.value.forEach((role) => {
    cloned[role] = cloned[role].filter((key) => availableKeys.has(key));
  });
  return cloned;
}
function createLabelDraft(asset: StarRingSvgAsset): Record<string, string> {
  return Object.fromEntries(asset.layers.map((layer) => [layer.key, layer.label]));
}
function suggestMappingFromLabels(): void {
  const suggested = autoMapStarRingLayers({
    ...props.asset,
    layers: props.asset.layers.map((layer) => ({
      ...layer,
      label: draftLabels.value[layer.key]?.trim() || layer.label
    }))
  }, roleOrder.value);
  roleOrder.value.forEach((role) => {
    const key = suggested[role][0];
    if (!key || draft.value[role].length) return;
    const usedByAnotherRole = roleOrder.value.some((candidate) => candidate !== role && draft.value[candidate].includes(key));
    if (!usedByAnotherRole) draft.value[role] = [key];
  });
}
function updateRole(role: StarRingLayerRole, value: string[]): void {
  const selected = [...value];
  roleOrder.value.forEach((other) => {
    if (other !== role) draft.value[other] = draft.value[other].filter((key) => !selected.includes(key));
  });
  draft.value[role] = selected;
}
function isUsedByOtherRole(key: string, role: StarRingLayerRole): boolean {
  return roleOrder.value.some((candidate) => candidate !== role && draft.value[candidate].includes(key));
}
function layerOptionLabel(layer: StarRingSvgLayer): string {
  return `${"— ".repeat(layer.depth)}${draftLabels.value[layer.key]?.trim() || layer.label}`;
}
function confirmMapping(): void {
  if (!mappedCount.value) {
    ElMessage.warning("请至少映射一个 SVG 图层");
    return;
  }
  const labels = Object.fromEntries(props.asset.layers.map((layer, index) => {
    const label = draftLabels.value[layer.key]?.trim() || `未命名图层 ${index + 1}`;
    return [layer.key, label];
  }));
  emit("confirm", cloneMapping(draft.value), labels);
  emit("update:modelValue", false);
}
</script>

<style>
.star-ring-mapping-dialog{--el-bg-color:#090909;--el-bg-color-overlay:#111;--el-text-color-primary:#f2f2f2;--el-text-color-regular:#b7b7b7;--el-border-color:#2c2c2c;--el-border-color-light:#242424;background:#090909!important;border:1px solid #262626;box-shadow:0 24px 70px rgba(0,0,0,.62)}.star-ring-mapping-dialog .el-dialog__header{padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.07)}.star-ring-mapping-dialog .el-dialog__title{color:#f5f5f5}.star-ring-mapping-dialog .el-dialog__headerbtn .el-dialog__close{color:#858585}.star-ring-mapping-dialog .el-dialog__headerbtn:hover .el-dialog__close{color:#fff}.star-ring-mapping-dialog .el-dialog__body{color:#d5d5d5}.star-ring-mapping-dialog .el-dialog__footer{border-top:1px solid rgba(255,255,255,.07)}
.mapping-layout{display:grid;grid-template-columns:210px minmax(300px,1fr) 270px;gap:12px;min-height:430px}.mapping-tree-panel,.mapping-preview-panel,.mapping-role-panel{min-width:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:10px;padding:12px;border-radius:8px;background:#111}.mapping-tree-panel:has(.mapping-name-warning){grid-template-rows:auto auto minmax(0,1fr)}.mapping-layout header{display:flex;align-items:center;justify-content:space-between;gap:8px}.mapping-layout header strong{color:var(--dm-primary);font-size:12px}.mapping-layout header small{color:var(--dm-secondary);font-size:9px}.mapping-name-warning{margin:0;padding:8px;border-radius:4px;background:rgba(255,255,255,.045);color:var(--dm-secondary);font-size:9px;line-height:1.5}.mapping-tree{display:grid;align-content:start;gap:3px;max-height:390px;overflow:auto}.mapping-tree-row{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:6px;min-height:31px;padding-right:8px;border-radius:4px;background:transparent;color:var(--dm-secondary);font-size:10px;cursor:pointer}.mapping-tree-row:hover,.mapping-tree-row.active{background:rgba(255,255,255,.075);color:var(--dm-primary)}.mapping-tree-row .el-input__wrapper{padding:0;background:transparent;box-shadow:none}.mapping-tree-row .el-input__inner{height:28px;color:inherit;font-size:10px}.mapping-tree-row .el-input__wrapper.is-focus{box-shadow:inset 0 -1px 0 rgba(0,112,243,.9)}.mapping-tree-row small{font-family:"Geist Mono",ui-monospace,monospace}.mapping-preview{display:grid;place-items:center;min-height:360px;overflow:hidden;border-radius:6px}.mapping-preview svg{display:block;width:82%;height:82%;overflow:visible}.mapping-role-list{display:grid;align-content:start;gap:12px}.mapping-role-list label{display:grid;gap:6px;color:var(--dm-secondary);font-size:10px}.mapping-role-list .el-select{width:100%}.star-ring-mapping-dialog .el-dialog__footer{display:flex;align-items:center;justify-content:flex-end;gap:8px}.mapping-footer-note{margin-right:auto;color:var(--dm-secondary);font-size:10px}
.star-ring-mapping-dialog .el-select__wrapper{background:#171717;box-shadow:0 0 0 1px #343434 inset}.star-ring-mapping-dialog .el-select__wrapper:hover{box-shadow:0 0 0 1px #4a4a4a inset}.star-ring-mapping-dialog .el-select__wrapper.is-focused{box-shadow:0 0 0 1px #0070f3 inset}.star-ring-mapping-dialog .el-tag{border-color:#3c3c3c;background:#232323;color:#d8d8d8}.star-ring-mapping-dialog .el-tag .el-tag__close{color:#949494}.star-ring-mapping-dialog .el-tag .el-tag__close:hover{background:#3a3a3a;color:#fff}
.star-ring-mapping-select-popper.el-popper{border-color:#303030!important;background:#111!important;box-shadow:0 12px 32px rgba(0,0,0,.58)!important}.star-ring-mapping-select-popper .el-select-dropdown{background:#111}.star-ring-mapping-select-popper .el-select-dropdown__item{color:#a8a8a8}.star-ring-mapping-select-popper .el-select-dropdown__item.is-hovering{background:#1d1d1d;color:#f2f2f2}.star-ring-mapping-select-popper .el-select-dropdown__item.is-selected{background:rgba(0,112,243,.14);color:#58a6ff}.star-ring-mapping-select-popper .el-popper__arrow::before{border-color:#303030!important;background:#111!important}
</style>
