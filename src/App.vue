<template>
  <div id="app">
    <!-- 登录页单独渲染 -->
    <router-view v-if="isLoginPage" />

    <!-- 其他页面带侧边栏布局 -->
    <el-container v-else style="height: 100vh;">
      <!-- 侧边栏 -->
      <el-aside width="200px" style="background-color: #545c64; color: white;">
        <div style="padding: 20px; font-size: 20px; font-weight: bold;">
          <i class="el-icon-cpu"></i> 分子模拟平台
        </div>
        <el-menu
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
          :default-active="currentPath"
          router
        >
          <el-menu-item index="/dashboard">
            <i class="el-icon-s-data"></i>
            <span>控制台</span>
          </el-menu-item>
          <el-menu-item index="/simulations">
            <i class="el-icon-cpu"></i>
            <span>模拟任务</span>
          </el-menu-item>
          <el-menu-item index="/systems">
            <i class="el-icon-collection"></i>
            <span>电解液配方</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <el-header style="background: white; border-bottom: 1px solid #e4e7ed;">
          <div style="display: flex; justify-content: space-between; align-items: center; height: 100%;">
            <h2 style="margin: 0;">电解液分子动力学模拟平台</h2>
            <div style="display: flex; align-items: center; gap: 15px;">
              <span style="color: #606266;">{{ userName }}</span>
              <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
            </div>
          </div>
        </el-header>

        <el-main style="background: #f5f7fa;">
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    const router = useRouter()

    const isLoginPage = computed(() => route.path === '/login')

    const currentPath = computed(() => route.path)

    const userName = computed(() => {
      const user = localStorage.getItem('user')
      if (user) {
        try {
          const userData = JSON.parse(user)
          return userData.realName || userData.username || '用户'
        } catch {
          return '用户'
        }
      }
      return '用户'
    })

    const handleLogout = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }

    return {
      isLoginPage,
      currentPath,
      userName,
      handleLogout
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
}
</style>
