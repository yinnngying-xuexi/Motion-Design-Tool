<template>
  <el-dialog class="star-ring-mapping-dialog" :model-value="modelValue" title="图层识别与动效映射" width="920px" destroy-on-close @close="$emit('update:modelValue', false)">
    <div class="mapping-layout">
      <section class="mapping-tree-panel">
        <header><strong>SVG 图层树</strong><small>{{ asset.layers.length }} 个分组</small></header>
        <div class="mapping-tree">
          <button
            v-for="layer in asset.layers"
            :key="layer.key"
            type="button"
            :class="{ active: highlightedKey === layer.key }"
            :style="{ paddingLeft: `${12 + layer.depth * 16}px` }"
            @mouseenter="highlightedKey = layer.key"
            @focus="highlightedKey = layer.key"
            @click="highlightedKey = layer.key"
          ><span>{{ layer.label }}</span><small>{{ layer.tagName }}</small></button>
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
            <el-select :model-value="draft[role]" multiple collapse-tags collapse-tags-tooltip placeholder="可选，不匹配则关闭" @change="updateRole(role, $event)">
              <el-option v-for="layer in asset.layers" :key="layer.key" :label="layerOptionLabel(layer)" :value="layer.key" :disabled="isUsedByOtherRole(layer.key, role)" />
            </el-select>
          </label>
        </div>
      </section>
    </div>
    <template #footer>
      <div class="mapping-footer-note">已映射 {{ mappedCount }} / {{ asset.layers.length }} 个分组，未映射图层应用后自动隐藏。</div>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" class="dm-blue-action" @click="confirmMapping">应用到星环底座</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import type { StarRingLayerMapping, StarRingLayerRole, StarRingSvgAsset, StarRingSvgLayer } from "@/types/decoration";
import { STAR_RING_ROLE_LABELS, STAR_RING_ROLE_ORDER } from "@/utils/starRingDecoration";

const props = defineProps<{ modelValue: boolean; asset: StarRingSvgAsset; mapping: StarRingLayerMapping }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; confirm: [mapping: StarRingLayerMapping] }>();
const roleOrder = STAR_RING_ROLE_ORDER;
const roleLabels = STAR_RING_ROLE_LABELS;
const draft = ref<StarRingLayerMapping>(cloneMapping(props.mapping));
const highlightedKey = ref(props.asset.layers[0]?.key ?? "");

watch(() => [props.modelValue, props.asset, props.mapping] as const, () => {
  if (!props.modelValue) return;
  draft.value = cloneMapping(props.mapping);
  highlightedKey.value = props.asset.layers[0]?.key ?? "";
}, { deep: true });

const mappedCount = computed(() => new Set(Object.values(draft.value).flat()).size);
const highlightedMarkup = computed(() => {
  const selector = highlightedKey.value.replace(/[^a-zA-Z0-9-]/g, "");
  const css = selector ? `<style>[data-dm-node-key="${selector}"]{filter:drop-shadow(0 0 6px #0070f3) drop-shadow(0 0 14px #0070f3);opacity:1!important;}</style>` : "";
  return `${css}${props.asset.markup}`;
});

function cloneMapping(mapping: StarRingLayerMapping): StarRingLayerMapping {
  return JSON.parse(JSON.stringify(mapping)) as StarRingLayerMapping;
}
function updateRole(role: StarRingLayerRole, value: string[]): void {
  const selected = [...value];
  STAR_RING_ROLE_ORDER.forEach((other) => {
    if (other !== role) draft.value[other] = draft.value[other].filter((key) => !selected.includes(key));
  });
  draft.value[role] = selected;
}
function isUsedByOtherRole(key: string, role: StarRingLayerRole): boolean {
  return STAR_RING_ROLE_ORDER.some((candidate) => candidate !== role && draft.value[candidate].includes(key));
}
function layerOptionLabel(layer: StarRingSvgLayer): string {
  return `${"— ".repeat(layer.depth)}${layer.label}`;
}
function confirmMapping(): void {
  if (!mappedCount.value) {
    ElMessage.warning("请至少映射一个 SVG 图层");
    return;
  }
  emit("confirm", cloneMapping(draft.value));
  emit("update:modelValue", false);
}
</script>

<style>
.mapping-layout{display:grid;grid-template-columns:210px minmax(300px,1fr) 270px;gap:12px;min-height:430px}.mapping-tree-panel,.mapping-preview-panel,.mapping-role-panel{min-width:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:10px;padding:12px;border-radius:8px;background:#111}.mapping-layout header{display:flex;align-items:center;justify-content:space-between;gap:8px}.mapping-layout header strong{color:var(--dm-primary);font-size:12px}.mapping-layout header small{color:var(--dm-secondary);font-size:9px}.mapping-tree{display:grid;align-content:start;gap:3px;max-height:390px;overflow:auto}.mapping-tree button{display:flex;align-items:center;justify-content:space-between;min-height:31px;padding-right:8px;border:0;border-radius:4px;background:transparent;color:var(--dm-secondary);font-size:10px;text-align:left;cursor:pointer}.mapping-tree button:hover,.mapping-tree button.active{background:rgba(255,255,255,.075);color:var(--dm-primary)}.mapping-tree button span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mapping-tree button small{font-family:"Geist Mono",ui-monospace,monospace}.mapping-preview{display:grid;place-items:center;min-height:360px;overflow:hidden;border-radius:6px}.mapping-preview svg{display:block;width:82%;height:82%;overflow:visible}.mapping-role-list{display:grid;align-content:start;gap:12px}.mapping-role-list label{display:grid;gap:6px;color:var(--dm-secondary);font-size:10px}.mapping-role-list .el-select{width:100%}.star-ring-mapping-dialog .el-dialog__footer{display:flex;align-items:center;justify-content:flex-end;gap:8px}.mapping-footer-note{margin-right:auto;color:var(--dm-secondary);font-size:10px}
</style>
