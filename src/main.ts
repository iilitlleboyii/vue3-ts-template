import { createApp } from 'vue'
import App from './App.vue'

import pinia from '@/stores'
import router from '@/router'
import i18n from '@/locales'

// 全局样式
import 'virtual:uno.css'
import '@unocss/reset/tailwind-compat.css'
import '@/assets/styles/element/dark.scss'
import '@/assets/styles/index.scss'

// 引入动画库
import 'animate.css'

// 注册指令
import truncate from '@/directives/common/truncate'

// 路由守卫
import '@/router/guard'

// SVG图标
import 'virtual:svg-icons-register'

// 右键菜单
// @ts-ignore
import contextmenu from 'v-contextmenu'
import 'v-contextmenu/dist/themes/default.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(i18n)
app.use(contextmenu)

app.directive('truncate', truncate)

app.mount('#app')
