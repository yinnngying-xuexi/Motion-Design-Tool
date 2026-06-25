const { createApp, nextTick } = Vue;

const baseParams = [
  { key: "duration", label: "动效时长", type: "range", min: 300, max: 6000, step: 100, unit: "ms", default: 1800 },
  { key: "delay", label: "延迟时间", type: "range", min: 0, max: 2400, step: 100, unit: "ms", default: 0 },
  {
    key: "iteration",
    label: "播放次数",
    type: "select",
    default: "infinite",
    options: [
      { label: "播放一次", value: "1" },
      { label: "三次", value: "3" },
      { label: "无限循环", value: "infinite" }
    ]
  },
  {
    key: "easing",
    label: "缓动曲线",
    type: "select",
    default: "ease-in-out",
    options: [
      { label: "线性", value: "linear" },
      { label: "柔和", value: "ease-in-out" },
      { label: "加速", value: "ease-in" },
      { label: "减速", value: "ease-out" },
      { label: "回弹", value: "cubic-bezier(.2,1.4,.42,1)" }
    ]
  }
];

const paramMap = {
  opacity: { key: "opacity", label: "透明度", type: "range", min: 0.2, max: 1, step: 0.05, unit: "", default: 1 },
  translateY: { key: "translateY", label: "纵向位移", type: "range", min: -120, max: 120, step: 4, unit: "px", default: 42 },
  translateX: { key: "translateX", label: "横向位移", type: "range", min: -160, max: 160, step: 4, unit: "px", default: -48 },
  scale: { key: "scale", label: "缩放幅度", type: "range", min: 1, max: 1.45, step: 0.01, unit: "x", default: 1.08 },
  rotate: { key: "rotate", label: "旋转角度", type: "range", min: 45, max: 360, step: 5, unit: "deg", default: 360 },
  glow: { key: "glow", label: "发光强度", type: "range", min: 0, max: 34, step: 1, unit: "px", default: 18 },
  radius: { key: "radius", label: "扩散半径", type: "range", min: 8, max: 72, step: 2, unit: "px", default: 34 },
  borderWidth: { key: "borderWidth", label: "边框宽度", type: "range", min: 1, max: 6, step: 1, unit: "px", default: 2 },
  color: { key: "color", label: "动效颜色", type: "color", default: "#2C5EF5" }
};

const motions = [
  {
    id: "fade-in",
    name: "淡入",
    category: "入场动效",
    scene: "数据卡片、标题文字",
    description: "适合模块初次加载，低干扰地建立页面层级。",
    previewType: "slide",
    className: "preview-fade-in",
    params: [...baseParams, paramMap.opacity]
  },
  {
    id: "slide-up",
    name: "上滑进入",
    category: "入场动效",
    scene: "数据卡片、图表容器",
    description: "卡片从下方进入，适合首屏模块分组出现。",
    previewType: "slide",
    className: "preview-slide-up",
    params: [...baseParams, paramMap.translateY, paramMap.opacity]
  },
  {
    id: "slide-left",
    name: "左滑进入",
    category: "入场动效",
    scene: "侧栏、弹层、信息面板",
    description: "横向进入可强调空间来源，适合左侧信息流。",
    previewType: "slide",
    className: "preview-slide-left",
    params: [...baseParams, paramMap.translateX, paramMap.opacity]
  },
  {
    id: "scale-in",
    name: "缩放进入",
    category: "入场动效",
    scene: "指标数字、重点模块",
    description: "轻微缩放带来聚焦感，不会破坏整体节奏。",
    previewType: "pulse",
    className: "preview-breath",
    params: [...baseParams, paramMap.scale, paramMap.opacity]
  },
  {
    id: "breath",
    name: "呼吸",
    category: "循环动效",
    scene: "状态卡片、重点指标",
    description: "柔和缩放循环，适合作为常驻提示。",
    previewType: "pulse",
    className: "preview-breath",
    params: [...baseParams, paramMap.scale, paramMap.opacity]
  },
  {
    id: "float",
    name: "上下浮动",
    category: "循环动效",
    scene: "图标、地图浮层",
    description: "轻量位移让静态组件保持活性。",
    previewType: "slide",
    className: "preview-slide-up",
    params: [...baseParams, paramMap.translateY, paramMap.opacity]
  },
  {
    id: "flicker",
    name: "轻微闪烁",
    category: "循环动效",
    scene: "状态文字、提示点",
    description: "低频透明度变化，用于弱提示。",
    previewType: "pulse",
    className: "preview-fade-in",
    params: [...baseParams, paramMap.opacity]
  },
  {
    id: "slow-rotate",
    name: "慢速旋转",
    category: "循环动效",
    scene: "装饰环、加载态",
    description: "适合科技装饰，但保持慢速避免分散注意力。",
    previewType: "pulse",
    className: "preview-rotate",
    params: [...baseParams, paramMap.rotate]
  },
  {
    id: "scale-tip",
    name: "放大提示",
    category: "强调动效",
    scene: "按钮、指标数字",
    description: "短暂放大强调当前关注点。",
    previewType: "pulse",
    className: "preview-breath",
    params: [...baseParams, paramMap.scale]
  },
  {
    id: "highlight-glow",
    name: "高亮发光",
    category: "强调动效",
    scene: "关键指标、重点状态",
    description: "使用规范中的钴蓝作为唯一强调色。",
    previewType: "glow",
    className: "preview-glow",
    params: [...baseParams, paramMap.color, paramMap.glow]
  },
  {
    id: "border-highlight",
    name: "边框高亮",
    category: "强调动效",
    scene: "卡片边界、选中模块",
    description: "边框与阴影同步变化，适合选中态提示。",
    previewType: "glow",
    className: "preview-border",
    params: [...baseParams, paramMap.color, paramMap.glow, paramMap.borderWidth]
  },
  {
    id: "red-alert",
    name: "红色闪烁",
    category: "告警动效",
    scene: "异常设备、风险标签",
    description: "将告警表达收敛到低频闪烁，避免过度刺眼。",
    previewType: "pulse",
    className: "preview-alert",
    params: [...baseParams, paramMap.color, paramMap.glow, paramMap.opacity]
  },
  {
    id: "pulse-spread",
    name: "脉冲扩散",
    category: "告警动效",
    scene: "地图点位、异常区域",
    description: "点位向外扩散，适合地图或设备定位。",
    previewType: "pulse",
    className: "preview-pulse",
    params: [...baseParams, paramMap.color, paramMap.radius]
  },
  {
    id: "border-flow",
    name: "边框流光",
    category: "大屏装饰",
    scene: "数据卡片、图表容器",
    description: "用发光强弱模拟流光，保持平面规范的克制感。",
    previewType: "glow",
    className: "preview-border",
    params: [...baseParams, paramMap.color, paramMap.glow, paramMap.borderWidth]
  },
  {
    id: "scan-line",
    name: "扫描线",
    category: "大屏装饰",
    scene: "图表容器、监测面板",
    description: "垂直扫描用于表达系统巡检与实时刷新。",
    previewType: "scan",
    className: "preview-scan",
    params: [...baseParams, paramMap.color]
  },
  {
    id: "map-point",
    name: "地图光点闪烁",
    category: "大屏装饰",
    scene: "地图点位、区域标注",
    description: "点位闪烁用于大屏地图状态表达。",
    previewType: "pulse",
    className: "preview-pulse",
    params: [...baseParams, paramMap.color, paramMap.radius]
  }
];

createApp({
  data() {
    return {
      motions,
      activeMotion: motions[1],
      activeCategory: "全部",
      search: "",
      params: {},
      canvasSize: "1920 x 1080",
      canvasSizes: ["1920 x 1080", "2560 x 1440", "3840 x 2160", "自定义尺寸"],
      previewObject: "数据卡片",
      previewObjects: ["数据卡片", "指标数字", "图标", "告警标签", "图表容器", "地图点位", "边框面板", "普通按钮", "标题文字"],
      backgroundMode: "雾灰底色",
      backgrounds: ["雾灰底色", "深墨底色", "透明背景", "白色底色"],
      playState: "play",
      playModes: [
        { key: "play", label: "播放", icon: "play" },
        { key: "pause", label: "暂停", icon: "pause" },
        { key: "loop", label: "循环", icon: "repeat" }
      ],
      previewKey: 1,
      layers: [
        { uid: 1, name: "上滑进入", delay: 0, loop: false, enabled: true },
        { uid: 2, name: "呼吸", delay: 800, loop: true, enabled: true }
      ],
      codeTab: "css",
      copyLabel: "复制代码",
      showSaveModal: false,
      saveForm: { name: "公司大屏卡片入场", category: "我的动效", description: "适合首屏数据卡片进入，节奏柔和。" }
    };
  },
  computed: {
    categories() {
      return ["全部", ...new Set(this.motions.map((item) => item.category)), "我的动效", "项目动效库"];
    },
    filteredMotions() {
      const keyword = this.search.trim();
      return this.motions.filter((motion) => {
        const categoryMatched = this.activeCategory === "全部" || motion.category === this.activeCategory;
        const keywordMatched = !keyword || motion.name.includes(keyword) || motion.scene.includes(keyword);
        return categoryMatched && keywordMatched;
      });
    },
    backgroundClass() {
      return {
        "雾灰底色": "bg-grid",
        "深墨底色": "bg-forest",
        "透明背景": "bg-clear",
        "白色底色": "bg-paper"
      }[this.backgroundMode];
    },
    previewClass() {
      return ["motion-preview", this.activeMotion.className, this.playState === "pause" ? "paused" : ""];
    },
    previewStyle() {
      const duration = `${this.params.duration || 1800}ms`;
      return {
        "--motion-duration": duration,
        "--motion-delay": `${this.params.delay || 0}ms`,
        "--motion-iteration": this.params.iteration || "infinite",
        "--motion-easing": this.params.easing || "ease-in-out",
        "--motion-opacity": this.params.opacity ?? 1,
        "--motion-x": `${this.params.translateX || 0}px`,
        "--motion-y": `${this.params.translateY || 0}px`,
        "--motion-scale": this.params.scale || 1.08,
        "--motion-rotate": `${this.params.rotate || 360}deg`,
        "--motion-glow": `${this.params.glow || 18}px`,
        "--motion-radius": `${this.params.radius || 34}px`,
        "--motion-color": this.params.color || "#2C5EF5",
        "animation-play-state": this.playState === "pause" ? "paused" : "running",
        borderWidth: this.params.borderWidth ? `${this.params.borderWidth}px` : undefined,
        borderColor: this.activeMotion.id.includes("border") ? this.params.color : undefined
      };
    },
    hasConflict() {
      const enabledTransformLayers = this.layers.filter((layer) => layer.enabled && /进入|呼吸|旋转|放大/.test(layer.name));
      return enabledTransformLayers.length > 1;
    },
    generatedCss() {
      const name = this.activeMotion.id.replaceAll("-", "");
      const color = this.params.color || "#2C5EF5";
      const duration = `${this.params.duration || 1800}ms`;
      const delay = `${this.params.delay || 0}ms`;
      const iteration = this.params.iteration || "infinite";
      const easing = this.params.easing || "ease-in-out";
      return `.motion-${this.activeMotion.id} {
  animation: ${name} ${duration} ${easing} ${delay} ${iteration};
  opacity: ${this.params.opacity ?? 1};
  border-width: ${this.params.borderWidth || 1}px;
  border-color: ${color};
  box-shadow: 0 0 ${this.params.glow || 0}px ${color};
}

@keyframes ${name} {
  0% {
    opacity: 0;
    transform: translate(${this.params.translateX || 0}px, ${this.params.translateY || 0}px) scale(1);
  }
  50% {
    opacity: ${this.params.opacity ?? 1};
    transform: translate(0, 0) scale(${this.params.scale || 1});
    box-shadow: 0 0 ${this.params.glow || 12}px ${color};
  }
  100% {
    opacity: ${this.params.opacity ?? 1};
    transform: translate(0, 0) scale(1);
  }
}`;
    },
    generatedJson() {
      return JSON.stringify(
        {
          id: this.activeMotion.id,
          name: this.activeMotion.name,
          category: this.activeMotion.category,
          scene: this.activeMotion.scene,
          params: this.params,
          cssClassName: `motion-${this.activeMotion.id}`,
          supportCombination: true,
          source: "prototype"
        },
        null,
        2
      );
    }
  },
  watch: {
    activeMotion: {
      immediate: true,
      handler() {
        this.params = {};
        this.activeMotion.params.forEach((param) => {
          this.params[param.key] = param.default;
        });
        this.replay();
      }
    },
    params: {
      deep: true,
      handler() {
        this.replay(false);
      }
    }
  },
  mounted() {
    this.refreshIcons();
  },
  updated() {
    this.refreshIcons();
  },
  methods: {
    refreshIcons() {
      nextTick(() => {
        if (window.lucide) window.lucide.createIcons();
      });
    },
    selectMotion(motion) {
      this.activeMotion = motion;
      this.layers[0].name = motion.name;
      this.layers[0].loop = this.params.iteration === "infinite";
    },
    toggleFavorite(motion) {
      motion.favorite = !motion.favorite;
    },
    resetParam(param) {
      this.params[param.key] = param.default;
    },
    resetParams() {
      this.activeMotion.params.forEach((param) => {
        this.params[param.key] = param.default;
      });
      this.copyLabel = "已重置";
      setTimeout(() => (this.copyLabel = "复制代码"), 1000);
    },
    replay(force = true) {
      if (force) this.previewKey += 1;
    },
    setPlayState(state) {
      this.playState = state;
      if (state !== "pause") this.replay();
    },
    addLayer() {
      this.layers.push({
        uid: Date.now(),
        name: this.activeMotion.name,
        delay: this.params.delay || 0,
        loop: this.params.iteration === "infinite",
        enabled: true
      });
    },
    duplicateLayer(layer) {
      this.layers.push({ ...layer, uid: Date.now(), name: `${layer.name} 副本` });
    },
    removeLayer(layer) {
      this.layers = this.layers.filter((item) => item.uid !== layer.uid);
    },
    openSaveModal() {
      this.saveForm.name = `${this.activeMotion.name} 自定义`;
      this.saveForm.description = this.activeMotion.description;
      this.showSaveModal = true;
    },
    saveMotion() {
      this.motions.push({
        ...this.activeMotion,
        id: `custom-${Date.now()}`,
        name: this.saveForm.name,
        category: this.saveForm.category,
        scene: this.saveForm.description,
        favorite: true
      });
      this.activeCategory = this.saveForm.category;
      this.showSaveModal = false;
    },
    async copyCode() {
      const text = this.codeTab === "css" ? this.generatedCss : this.generatedJson;
      try {
        await navigator.clipboard.writeText(text);
        this.copyLabel = "复制成功";
      } catch {
        this.copyLabel = "已生成";
      }
      setTimeout(() => (this.copyLabel = "复制代码"), 1200);
    }
  }
}).mount("#app");
