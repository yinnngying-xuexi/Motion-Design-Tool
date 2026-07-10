import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import "@/styles/main.css";

import { createPinia } from "pinia";
import { createApp } from "vue";
import ElementPlus from "element-plus";
import App from "./App.vue";

createApp(App).use(createPinia()).use(ElementPlus).mount("#app");
