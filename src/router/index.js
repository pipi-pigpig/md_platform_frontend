import { createRouter, createWebHistory } from 'vue-router'

// 导入视图
import Login from '../views/Login.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import ResetPassword from '../views/ResetPassword.vue'
import Dashboard from '../views/Dashboard.vue'
import Simulations from '../views/Simulations.vue'
import Systems from '../views/Systems.vue'
import Profile from '../views/Profile.vue'

// 路由配置
const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { public: true }
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: ForgotPassword,
        meta: { public: true }
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: ResetPassword,
        meta: { public: true }
    },
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { requiresAuth: true }
    },
    {
        path: '/simulations',
        name: 'Simulations',
        component: Simulations,
        meta: { requiresAuth: true }
    },
    {
        path: '/simulations/:id',
        name: 'SimulationDetail',
        component: () => import('../views/SimulationDetail.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/systems',
        name: 'Systems',
        component: Systems,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: { requiresAuth: true }
    }
]

// 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫 - 检查登录状态
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')

    // 如果是公开页面，直接放行
    if (to.meta.public) {
        next()
        return
    }

    // 需要认证的页面，检查 token
    if (to.meta.requiresAuth && !token) {
        next('/login')
    } else {
        next()
    }
})

export default router
