<template>
  <div class="dashboard">
    <h2>控制台</h2>
    <p style="color: #909399; margin-bottom: 20px;">查看您的模拟任务概览</p>

    <!-- 统计卡片 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <div style="font-size: 36px; color: #409eff;">{{ stats.total }}</div>
            <div style="color: #909399;">总任务数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <div style="font-size: 36px; color: #e6a23c;">{{ stats.pending }}</div>
            <div style="color: #909399;">等待中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <div style="font-size: 36px; color: #67c23a;">{{ stats.running }}</div>
            <div style="color: #909399;">运行中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div style="text-align: center;">
            <div style="font-size: 36px; color: #67c23a;">{{ stats.completed }}</div>
            <div style="color: #909399;">已完成</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近模拟 -->
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>最近模拟任务</span>
          <el-button @click="loadSimulations">刷新</el-button>
        </div>
      </template>

      <div class="table-responsive">
        <el-table :data="recentSimulations" v-loading="loading">
        <el-table-column prop="jobName" label="任务名称" width="180" />
        <el-table-column prop="description" label="任务说明" min-width="200">
          <template #default="scope">
            <el-tooltip v-if="scope.row.description" :content="scope.row.description" placement="top">
              <span>{{ scope.row.description.substring(0, 30) + (scope.row.description.length > 30 ? '...' : '') }}</span>
            </el-tooltip>
            <span v-else style="color: #C0C4CC;">--</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="viewDetails(scope.row.id)">
              查看
            </el-button>
          </template>
        </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
import { simulationApi } from '../api.js'

export default {
  name: 'Dashboard',
  data() {
    return {
      loading: false,
      simulations: [],
      stats: {
        total: 0,
        pending: 0,
        running: 0,
        completed: 0,
        failed: 0,
        cancelled: 0
      }
    }
  },
  computed: {
    recentSimulations() {
      return this.simulations.slice(0, 5)
    }
  },
  mounted() {
    this.loadSimulations()
  },
  methods: {
    async loadSimulations() {
      this.loading = true
      try {
        // 获取模拟任务
        const response = await simulationApi.getAll()
        this.simulations = response.data || []

        // 获取统计信息
        try {
          const statsResponse = await simulationApi.getStats()
          if (statsResponse.data) {
            this.stats = {
              total: statsResponse.data.total || 0,
              pending: statsResponse.data.pending || 0,
              running: statsResponse.data.running || 0,
              completed: statsResponse.data.completed || 0,
              failed: statsResponse.data.failed || 0,
              cancelled: statsResponse.data.cancelled || 0
            }
          }
        } catch (e) {
          console.log('统计API暂不可用')
        }
      } catch (error) {
        // 如果是静默错误（请求被取消），不显示提示
        if (error.silent) {
          return
        }
        console.error('加载模拟任务失败:', error)
      } finally {
        this.loading = false
      }
    },

    getStatusColor(status) {
      const colors = {
        PENDING: 'warning',
        RUNNING: 'primary',
        COMPLETED: 'success',
        FAILED: 'danger',
        CANCELLED: 'info'
      }
      return colors[status] || 'default'
    },

    getStatusText(status) {
      const texts = {
        PENDING: '等待中',
        RUNNING: '运行中',
        COMPLETED: '已完成',
        FAILED: '已失败',
        CANCELLED: '已取消'
      }
      return texts[status] || status
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },

    viewDetails(id) {
      this.$router.push(`/simulations?view=${id}`)
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

/* 表格响应式容器 */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* 深度覆盖 Element Plus 表格样式 */
.table-responsive :deep(.el-table) {
  display: table;
  width: 100% !important;
  min-width: 600px;
}

.table-responsive :deep(.el-table__inner-wrapper) {
  width: 100% !important;
}

.table-responsive :deep(.el-table__header-wrapper),
.table-responsive :deep(.el-table__body-wrapper) {
  overflow-x: visible !important;
}

.table-responsive :deep(.el-table__header),
.table-responsive :deep(.el-table__body) {
  width: 100% !important;
  table-layout: auto !important;
}

.table-responsive :deep(.el-table__cell) {
  word-break: break-word;
}

/* 确保固定列不干扰滚动 */
.table-responsive :deep(.el-table-fixed-column--right) {
  position: static !important;
}

.table-responsive :deep(.el-table__fixed-right) {
  display: none !important;
}
</style>
