<template>
  <div id="app">
    <!-- 登录页单独渲染 -->
    <router-view v-if="isPublicPage" />

    <!-- 其他页面带侧边栏布局 -->
    <el-container v-else style="height: 100vh;">
      <!-- 侧边栏 -->
      <el-aside width="240px" style="background-color: #545c64; color: white;">
        <div style="padding: 20px; font-size: 20px; font-weight: bold; white-space: nowrap;">
          <i class="el-icon-cpu"></i> 电解液配方计算平台
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
            <h2 style="margin: 0;">{{ pageTitle }}</h2>
            <div style="display: flex; align-items: center; gap: 15px;">
              <el-dropdown trigger="hover" @command="handleCommand">
                <div class="user-dropdown-trigger">
                  <span>{{ userName }}</span>
                </div>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                    <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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
import { setLoggedOut, cancelAllRequests } from './api.js'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    const router = useRouter()

    const isPublicPage = computed(() =>
      route.path === '/login' ||
      route.path === '/forgot-password' ||
      route.path === '/reset-password'
    )

    const currentPath = computed(() => route.path)

    // 根据路由动态显示页面名称
    const pageTitle = computed(() => {
      const titles = {
        '/dashboard': '控制台',
        '/simulations': '分子动力学模拟任务管理',
        '/systems': '电解液配方管理',
        '/profile': '个人信息'
      }
      return titles[route.path] || '电解液配方计算平台'
    })

    const userName = computed(() => {
      const user = localStorage.getItem('user')
      if (user) {
        try {
          const userData = JSON.parse(user)
          return userData.realName || userData.username || '系统管理员'
        } catch {
          return '系统管理员'
        }
      }
      return '系统管理员'
    })

    const handleLogout = () => {
      setLoggedOut(true)
      cancelAllRequests()

      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }

    const handleCommand = (command) => {
      if (command === 'profile') {
        router.push('/profile')
      } else if (command === 'logout') {
        handleLogout()
      }
    }

    return {
      isPublicPage,
      currentPath,
      pageTitle,
      userName,
      handleLogout,
      handleCommand
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

.user-dropdown-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 12px;
  border-radius: 4px;
  cursor: pointer;
  background: #e9ebed;
  color: #606266;
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
}

.user-dropdown-trigger:hover {
  background: #409eff;
  color: #fff;
}
</style>
