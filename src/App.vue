<template>
  <main class="app-shell">
    <header class="app-toolbar">
      <div class="toolbar-brand">
        <strong>DM</strong>
        <span>动效编辑器</span>
        <small>V2.0</small>
      </div>
      <div class="toolbar-actions">
        <el-button :disabled="!isEditorModule" @click="dispatchEditorAction('import-svg')">导入 SVG</el-button>
        <el-button type="primary" :disabled="!isEditorModule" @click="dispatchEditorAction('save')">保存到我的动效</el-button>
        <el-button :disabled="!isEditorModule" @click="dispatchEditorAction('export')">导出</el-button>
      </div>
    </header>

    <aside class="app-nav">
      <el-scrollbar class="nav-scroll">
        <nav class="nav-stack">
          <button
            v-for="item in navItems"
            :key="item.key"
            type="button"
            :class="{ active: activeModule === item.key }"
            @click="activeModule = item.key"
          >
            <span>{{ item.label }}</span>
            <small>{{ item.desc }}</small>
          </button>
        </nav>
      </el-scrollbar>
    </aside>

    <section class="app-content">
      <BasicMotionLibrary v-if="activeModule === 'motion'" />
      <DecorationMotionLibrary v-else-if="activeModule === 'decoration'" />
      <MyMotionLibrary v-else-if="activeModule === 'my-motion'" @edit-svg-flow="openSvgFlowTool" />
      <CustomAssetLibrary v-else-if="activeModule === 'custom-asset'" />
      <ProjectDelivery v-else />
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { computed } from "vue";
import CustomAssetLibrary from "@/modules/custom-asset-library/CustomAssetLibrary.vue";
import DecorationMotionLibrary from "@/modules/decoration-library/DecorationMotionLibrary.vue";
import BasicMotionLibrary from "@/modules/motion-library/BasicMotionLibrary.vue";
import MyMotionLibrary from "@/modules/motion-library/MyMotionLibrary.vue";
import ProjectDelivery from "@/modules/project-delivery/ProjectDelivery.vue";

type ModuleKey = "motion" | "decoration" | "my-motion" | "custom-asset" | "project-delivery";

const activeModule = ref<ModuleKey>("motion");
const isEditorModule = computed(() => activeModule.value === "motion" || activeModule.value === "decoration");

const navItems: Array<{ key: ModuleKey; label: string; desc: string }> = [
  { key: "motion", label: "基础动效库", desc: "系统内置基础 CSS 动效" },
  { key: "decoration", label: "装饰动效库", desc: "图标底座、流光、扫描、边框" },
  { key: "my-motion", label: "我的动效", desc: "用户保存的个人动效" },
  { key: "custom-asset", label: "自定义素材库", desc: "上传或粘贴 CSS 模板" },
  { key: "project-delivery", label: "项目交付", desc: "按大屏板块整理并打包动效" }
];

function openSvgFlowTool(): void {
  activeModule.value = "decoration";
}

function dispatchEditorAction(action: "import-svg" | "save" | "export"): void {
  window.dispatchEvent(new CustomEvent(`datamotion:${action}`));
}
</script>
