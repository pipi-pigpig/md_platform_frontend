import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import App from './App.vue'

// 导入视图
import Dashboard from './views/Dashboard.vue'
import Simulations from './views/Simulations.vue'
import Systems from './views/Systems.vue'

// 创建路由
const routes = [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', component: Dashboard },
    { path: '/simulations', component: Simulations },
    { path: '/systems', component: Systems }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 创建应用
const app = createApp(App)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn
})
app.mount('#app')