<template>
  <main class="app-shell" :class="{ 'home-mode': isHome, 'editor-mode': !isHome }">
    <header class="app-toolbar">
      <button class="toolbar-brand" type="button" aria-label="返回动效预设首页" @click="selectModule('home')">
        <strong>DM</strong>
        <span>动效编辑器</span>
        <small>V2.0</small>
      </button>

      <div v-if="!isHome" class="toolbar-search">
        <el-input
          v-model="searchKeyword"
          clearable
          :prefix-icon="Search"
          placeholder="搜索动效名称、场景或关键词"
          @input="dispatchSearch"
        />
      </div>

      <div v-if="!isHome" class="toolbar-actions">
        <el-button class="dm-blue-action save-motion-button" type="primary" :disabled="!isEditorModule" @click="dispatchEditorAction('save')">
          保存到我的动效
        </el-button>
      </div>
    </header>

    <aside class="app-nav">
      <el-scrollbar class="nav-scroll">
        <nav class="nav-stack" aria-label="主导航">
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            :class="{ active: isNavActive(item.key) }"
            @click="selectModule(item.key)"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </el-scrollbar>

    </aside>

    <section class="app-content">
      <MotionHome
        v-if="activeModule === 'home'"
        @open-motion="openMotionEditor"
        @open-decoration="openDecorationEditor"
      />
      <BasicMotionLibrary v-else-if="activeModule === 'motion'" :initial-motion-id="pendingMotionId" />
      <DecorationMotionLibrary v-else-if="activeModule === 'decoration'" :initial-effect-id="pendingDecorationId" />
      <MyMotionLibrary v-else-if="activeModule === 'my-motion'" @edit-svg-flow="openSvgFlowTool" />
      <CustomAssetLibrary v-else-if="activeModule === 'custom-asset'" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Box, MagicStick, Picture, Search, Star } from "@element-plus/icons-vue";
import CustomAssetLibrary from "@/modules/custom-asset-library/CustomAssetLibrary.vue";
import DecorationMotionLibrary from "@/modules/decoration-library/DecorationMotionLibrary.vue";
import BasicMotionLibrary from "@/modules/motion-library/BasicMotionLibrary.vue";
import MotionHome from "@/modules/motion-library/MotionHome.vue";
import MyMotionLibrary from "@/modules/motion-library/MyMotionLibrary.vue";

type ModuleKey = "home" | "motion" | "decoration" | "my-motion" | "custom-asset";

const activeModule = ref<ModuleKey>("home");
const searchKeyword = ref("");
const pendingMotionId = ref("fade-in");
const pendingDecorationId = ref("base-particle-star-ring");
const isEditorModule = computed(() => activeModule.value === "motion" || activeModule.value === "decoration");
const isHome = computed(() => activeModule.value === "home");

const navItems = [
  { key: "home", label: "动效预设", icon: MagicStick },
  { key: "decoration", label: "装饰组件", icon: Box },
  { key: "my-motion", label: "我的动效", icon: Star },
  { key: "custom-asset", label: "自定义素材", icon: Picture }
] as const;

function selectModule(module: ModuleKey): void {
  activeModule.value = module;
  searchKeyword.value = "";
  dispatchSearch("");
}

function isNavActive(module: ModuleKey): boolean {
  return module === "home" ? activeModule.value === "home" || activeModule.value === "motion" : activeModule.value === module;
}

function openMotionEditor(motionId: string): void {
  pendingMotionId.value = motionId;
  selectModule("motion");
}

function openDecorationEditor(effectId: string): void {
  pendingDecorationId.value = effectId;
  selectModule("decoration");
}

function openSvgFlowTool(): void {
  pendingDecorationId.value = "svg-flow-tool";
  selectModule("decoration");
}

function dispatchEditorAction(action: "save"): void {
  window.dispatchEvent(new CustomEvent(`datamotion:${action}`));
}

function dispatchSearch(value: string | number): void {
  window.dispatchEvent(new CustomEvent("datamotion:search", { detail: String(value) }));
}
</script>
