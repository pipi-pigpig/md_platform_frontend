<template>
  <div id="app">
    <el-container style="height: 100vh;">
      <!-- 侧边栏 -->
      <el-aside width="200px" style="background-color: #545c64; color: white;">
        <div style="padding: 20px; font-size: 20px; font-weight: bold;">
          <i class="el-icon-cpu"></i> 分子模拟平台
        </div>
        <el-menu
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#ffd04b"
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
            <!-- <el-button type="primary" @click="$router.push('/simulations')">
              <i class="el-icon-plus"></i> 新建模拟
            </el-button> -->
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
export default {
  name: 'App'
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