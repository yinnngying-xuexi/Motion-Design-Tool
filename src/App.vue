<template>
  <main class="app-shell">
    <aside class="app-nav">
      <div class="brand">
        <div class="brand-mark">DM</div>
        <div>
          <strong>动效编辑器</strong>
        </div>
      </div>

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
      <MyMotionLibrary v-else-if="activeModule === 'my-motion'" />
      <CustomAssetLibrary v-else />
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue";
import CustomAssetLibrary from "@/modules/custom-asset-library/CustomAssetLibrary.vue";
import DecorationMotionLibrary from "@/modules/decoration-library/DecorationMotionLibrary.vue";
import BasicMotionLibrary from "@/modules/motion-library/BasicMotionLibrary.vue";
import MyMotionLibrary from "@/modules/motion-library/MyMotionLibrary.vue";

type ModuleKey = "motion" | "decoration" | "my-motion" | "custom-asset";

const activeModule = ref<ModuleKey>("motion");

const navItems: Array<{ key: ModuleKey; label: string; desc: string }> = [
  { key: "motion", label: "基础动效库", desc: "系统内置基础 CSS 动效" },
  { key: "decoration", label: "装饰动效库", desc: "图标底座、流光、扫描、边框" },
  { key: "my-motion", label: "我的动效", desc: "用户保存的个人动效" },
  { key: "custom-asset", label: "自定义素材库", desc: "上传或粘贴 CSS 模板" }
];
</script>
