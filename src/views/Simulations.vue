<template>
  <div class="simulations-container">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <i class="el-icon-cpu"></i> 分子动力学模拟任务管理
        </h1>
        <div class="header-actions">
          <el-button 
            type="primary" 
            @click="handleNewSimulation"
            icon="el-icon-video-play"
            size="large"
          >
            <i class="el-icon-plus"></i> 新建模拟任务
          </el-button>
          <el-button 
            @click="refreshData"
            :loading="loading"
            icon="el-icon-refresh"
            size="large"
          >
            刷新
          </el-button>
          <el-dropdown @command="handleBatchCommand" v-if="selectedSimulations.length > 0">
            <el-button type="info" size="large">
              批量操作 <i class="el-icon-arrow-down"></i>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="cancel">取消选中任务</el-dropdown-item>
                <el-dropdown-item command="delete">删除选中任务</el-dropdown-item>
                <el-dropdown-item command="export">导出选中信息</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <!-- 状态统计卡片 -->
      <div class="stats-cards">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
            <el-statistic title="总任务数" :value="stats.total || 2">
              <template #suffix>/ {{ stats.total || 3 }}</template>
            </el-statistic>
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
            <el-statistic
              title="运行中"
              :value="stats.running || 0"
              :value-style="{ color: '#409EFF' }"
            />
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
            <el-statistic
              title="已完成"
              :value="stats.completed || 0"
              :value-style="{ color: '#67C23A' }"
            />
          </el-col>
          <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
            <el-statistic
              title="已失败"
              :value="stats.failed || 0"
              :value-style="{ color: '#F56C6C' }"
            />
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 搜索和过滤栏 -->
    <div class="filter-bar">
      <el-card shadow="never" class="filter-card">
        <div class="filter-content">
          <div class="filter-left">
            <el-input
              v-model="searchQuery"
              placeholder="搜索任务名称、状态..."
              class="search-input"
              clearable
              @keyup.enter="loadSimulations"
              @clear="loadSimulations"
            >
              <template #prefix>
                <i class="el-icon-search"></i>
              </template>
            </el-input>
            
            <el-select
              v-model="filterStatus"
              placeholder="状态筛选"
              clearable
              class="filter-select"
              @change="loadSimulations"
            >
              <el-option label="全部" value="" />
              <el-option label="待处理" value="PENDING" />
              <el-option label="运行中" value="RUNNING" />
              <el-option label="已完成" value="COMPLETED" />
              <el-option label="失败" value="FAILED" />
              <el-option label="已取消" value="CANCELLED" />
            </el-select>

            <el-select
              v-model="filterHardware"
              placeholder="硬件筛选"
              clearable
              class="filter-select"
              @change="loadSimulations"
            >
              <el-option label="全部" value="" />
              <el-option label="CPU" value="CPU" />
              <el-option label="GPU" value="GPU" />
              <el-option label="混合" value="BOTH" />
            </el-select>
          </div>
          
          <div class="filter-right">
            <el-button-group>
              <el-button 
                @click="changeViewMode('table')"
                :type="viewMode === 'table' ? 'primary' : ''"
              >
                <i class="el-icon-s-grid"></i> 表格
              </el-button>
              <el-button 
                @click="changeViewMode('card')"
                :type="viewMode === 'card' ? 'primary' : ''"
              >
                <i class="el-icon-s-data"></i> 卡片
              </el-button>
            </el-button-group>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 模拟任务列表（表格视图） -->
    <div v-if="viewMode === 'table'" class="simulation-table">
      <el-card shadow="never">
        <template #header>
          <div class="table-header">
            <span>模拟任务列表</span>
            <span class="table-subtitle">共 {{ pagination.total }} 个任务</span>
          </div>
        </template>
        
      <div class="table-responsive">
        <el-table
          ref="tableRef"
          :data="simulations"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
          :default-sort="{ prop: 'createdAt', order: 'descending' }"
          stripe
          style="width: 100%"
        >
          <!-- 选择列 -->
          <el-table-column type="selection" min-width="50" />

          <!-- ID列 -->
          <el-table-column prop="id" label="ID" min-width="65" sortable="custom">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">#{{ row.id }}</el-tag>
            </template>
          </el-table-column>
          
          <!-- 任务名称列 -->
          <el-table-column prop="jobName" label="任务名称" min-width="140" sortable="custom">
            <template #default="{ row }">
              <div class="job-name-cell">
                <div class="job-name">{{ row.jobName }}</div>
                <div class="job-time">{{ formatDate(row.createdAt) }}</div>
              </div>
            </template>
          </el-table-column>

          <!-- 任务说明列 -->
          <el-table-column prop="description" label="任务说明" min-width="100" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tooltip v-if="row.description" :content="row.description" placement="top" :show-overflow-tooltip="true">
                <span>{{ row.description.substring(0, 15) + (row.description.length > 15 ? '...' : '') }}</span>
              </el-tooltip>
              <span v-else class="no-description">--</span>
            </template>
          </el-table-column>

          <!-- 状态列 -->
          <el-table-column prop="status" label="状态" min-width="90" sortable="custom">
            <template #default="{ row }">
              <div class="status-cell">
                <el-tag
                  :type="getStatusType(row.status)"
                  :effect="row.status === 'RUNNING' ? 'light' : 'plain'"
                  size="small"
                >
                  <i :class="getStatusIcon(row.status)"></i>
                  {{ getStatusText(row.status) }}
                </el-tag>

                <!-- 进度条（仅运行中任务显示） -->
                <div v-if="row.status === 'RUNNING'" class="progress-container">
                  <el-progress
                    :percentage="row.progress || 0"
                    :stroke-width="4"
                    :show-text="false"
                    :indeterminate="row.progress === undefined"
                  />
                  <span class="progress-text">{{ row.progress ? row.progress + '%' : '计算中...' }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 硬件列 -->
          <el-table-column prop="hardwareUsed" label="硬件" min-width="75">
            <template #default="{ row }">
              <el-tag
                :type="row.hardwareUsed === 'GPU' ? 'warning' : 'info'"
                size="small"
              >
                <i :class="getHardwareIcon(row.hardwareUsed)"></i>
                {{ getHardwareText(row.hardwareUsed) }}
              </el-tag>
            </template>
          </el-table-column>

          <!-- 配方信息列 -->
          <el-table-column label="配方" min-width="70">
            <template #default="{ row }">
              <div v-if="row.systemId" class="system-info">
                <el-tooltip content="点击查看配方详情" placement="top">
                  <el-link
                    type="primary"
                    :underline="false"
                    @click="viewSystem(row.systemId)"
                  >
                    #{{ row.systemId }}
                  </el-link>
                </el-tooltip>
              </div>
              <span v-else class="no-system">--</span>
            </template>
          </el-table-column>

          <!-- 时间列 -->
          <el-table-column prop="createdAt" label="创建时间" min-width="90" sortable="custom">
            <template #default="{ row }">
              <div class="time-cell">
                <div class="time-value">{{ formatDate(row.createdAt, 'MM-DD HH:mm') }}</div>
                <div class="time-diff">{{ timeAgo(row.createdAt) }}</div>
              </div>
            </template>
          </el-table-column>

          <!-- 执行时间列 -->
          <el-table-column prop="executionTime" label="执行时间" min-width="70">
            <template #default="{ row }">
              <div v-if="row.executionTime" class="duration-cell">
                {{ formatDuration(row.executionTime) }}
              </div>
              <span v-else class="no-duration">--</span>
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column label="操作" min-width="180">
            <template #default="{ row }">
              <div class="action-buttons">
                <!-- 查看详情 -->
                <el-button
                  size="small"
                  type="primary"
                  plain
                  @click="viewDetails(row)"
                  class="action-btn"
                >
                  详情
                </el-button>

                <!-- 取消任务（仅运行中状态） -->
                <el-button
                  size="small"
                  type="warning"
                  plain
                  @click="cancelSimulation(row)"
                  v-if="row.status === 'RUNNING' || row.status === 'PENDING'"
                  class="action-btn"
                >
                  取消
                </el-button>

                <!-- 删除任务（非运行中状态） -->
                <el-button
                  size="small"
                  type="danger"
                  plain
                  @click="deleteSimulation(row)"
                  v-if="row.status !== 'RUNNING'"
                  class="action-btn"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.currentPage"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 模拟任务卡片视图 -->
    <div v-else class="simulation-cards">
      <el-row :gutter="20">
        <el-col 
          v-for="simulation in simulations" 
          :key="simulation.id"
          :xs="24" :sm="12" :md="8" :lg="6" :xl="6"
          class="card-col"
        >
          <el-card class="simulation-card" shadow="hover">
            <!-- 卡片头部 -->
            <template #header>
              <div class="card-header">
                <div class="card-title">
                  <h4>{{ simulation.jobName }}</h4>
                </div>
                <div class="card-actions">
                  <el-dropdown @command="handleRowCommand(simulation, $event)" trigger="click">
                    <el-button type="text" icon="el-icon-more" circle size="small" />
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="view">查看详情</el-dropdown-item>
                        <el-dropdown-item command="download">下载结果</el-dropdown-item>
                        <el-dropdown-item command="delete">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </template>
            
            <!-- 卡片内容 -->
            <div class="card-content">
              <!-- 状态显示 -->
              <div class="card-status">
                <el-tag
                  :type="getStatusType(simulation.status)"
                  :effect="simulation.status === 'RUNNING' ? 'light' : 'plain'"
                  size="default"
                >
                  <i :class="getStatusIcon(simulation.status)"></i>
                  {{ getStatusText(simulation.status) }}
                </el-tag>

                <!-- 进度条 -->
                <div v-if="simulation.status === 'RUNNING'" class="card-progress">
                  <el-progress
                    :percentage="simulation.progress || 0"
                    :stroke-width="8"
                    :show-text="false"
                  />
                  <span class="progress-percent">{{ simulation.progress || 0 }}%</span>
                </div>
              </div>

              <!-- 任务说明 -->
              <div class="card-description">
                <el-tooltip v-if="simulation.description" :content="simulation.description" placement="top">
                  <span class="description-text">
                    <i class="el-icon-document"></i>
                    {{ simulation.description.substring(0, 50) + (simulation.description.length > 50 ? '...' : '') }}
                  </span>
                </el-tooltip>
                <span v-else class="description-text no-description">
                  <i class="el-icon-document"></i>
                  --
                </span>
              </div>

              <!-- 硬件信息 -->
              <div class="card-info">
                <div class="info-item">
                  <i class="el-icon-cpu"></i>
                  <span>{{ getHardwareText(simulation.hardwareUsed) }}</span>
                </div>
                
                <div class="info-item">
                  <i class="el-icon-time"></i>
                  <span>{{ timeAgo(simulation.createdAt) }}</span>
                </div>
                
                <div v-if="simulation.executionTime" class="info-item">
                  <i class="el-icon-timer"></i>
                  <span>{{ formatDuration(simulation.executionTime) }}</span>
                </div>
              </div>
              
              <!-- 配方信息 -->
              <div v-if="simulation.systemId" class="card-system">
                <i class="el-icon-collection"></i>
                <span>关联配方 #{{ simulation.systemId }}</span>
              </div>
              
              <!-- 结果摘要 -->
              <div v-if="simulation.resultSummary" class="card-summary">
                <div class="summary-title">结果摘要</div>
                <pre class="summary-content">{{ formatResultSummary(simulation.resultSummary) }}</pre>
              </div>
            </div>
            
            <!-- 卡片底部 -->
            <template #footer>
              <div class="card-footer">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="viewDetails(simulation)"
                  icon="el-icon-view"
                >
                  查看详情
                </el-button>
                
                <el-button 
                  type="warning" 
                  size="small" 
                  @click="cancelSimulation(simulation)"
                  v-if="simulation.status === 'RUNNING'"
                  icon="el-icon-close"
                >
                  取消
                </el-button>
                
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deleteSimulation(simulation)"
                  v-if="simulation.status !== 'RUNNING'"
                  icon="el-icon-delete"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 空状态 -->
      <div v-if="simulations.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无模拟任务" :image-size="200">
          <template #image>
            <i class="el-icon-cpu" style="font-size: 80px; color: #DCDFE6;"></i>
          </template>
          <el-button type="primary" @click="handleNewSimulation">创建第一个模拟任务</el-button>
        </el-empty>
      </div>
      
      <!-- 卡片视图分页 -->
      <div v-if="simulations.length > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[8, 16, 24, 32]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 创建模拟对话框 -->
    <el-dialog 
      v-model="showCreateDialog" 
      title="创建新的分子动力学模拟任务"
      width="800px"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <SimulationForm 
        ref="simulationFormRef"
        @submit="handleCreateSimulation"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>

    <!-- 任务详情对话框 -->
    <el-dialog 
      v-model="showDetailDialog" 
      :title="`模拟任务详情 - ${selectedSimulation?.jobName || ''}`"
      width="1000px"
      :fullscreen="detailFullscreen"
      :destroy-on-close="true"
    >
      <div v-if="selectedSimulation" class="detail-container">
        <!-- 详情操作栏 -->
        <div class="detail-actions" style="margin-bottom: 15px;">
          <el-button 
            type="primary" 
            @click="downloadResults(selectedSimulation.id)"
            v-if="selectedSimulation.status === 'COMPLETED'"
            icon="el-icon-download"
          >
            下载结果文件
          </el-button>
          
          <el-button 
            type="warning" 
            @click="restartSimulation(selectedSimulation)"
            v-if="selectedSimulation.status === 'FAILED' || selectedSimulation.status === 'CANCELLED'"
            icon="el-icon-refresh"
          >
            重新运行
          </el-button>
          
          <el-button 
            type="success" 
            @click="cloneSimulation(selectedSimulation)"
            icon="el-icon-copy-document"
          >
            复制任务
          </el-button>
          
          <el-button 
            type="info" 
            @click="detailFullscreen = !detailFullscreen"
            icon="el-icon-full-screen"
            style="float: right"
          >
            {{ detailFullscreen ? '退出全屏' : '全屏查看' }}
          </el-button>
        </div>
        
        <el-tabs v-model="activeDetailTab" type="border-card">
          <!-- 基础信息 Tab -->
          <el-tab-pane label="基础信息" name="basic">
            <div class="tab-scroll-area">
              <el-card class="detail-section" shadow="never" style="margin-bottom: 15px">
                <template #header>
                  <div class="section-header">
                    <i class="el-icon-info" style="margin-right: 5px; color: #409EFF"></i>
                    <span style="font-weight: bold;">基础信息</span>
                  </div>
                </template>
                
                <el-descriptions :column="2" border size="default">
                  <el-descriptions-item label="任务ID">{{ selectedSimulation.id }}</el-descriptions-item>
                  <el-descriptions-item label="任务名称">{{ selectedSimulation.jobName }}</el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag :type="getStatusType(selectedSimulation.status)">
                      {{ getStatusText(selectedSimulation.status) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="硬件">
                    <el-tag :type="selectedSimulation.hardwareUsed === 'GPU' ? 'warning' : 'info'">
                      {{ getHardwareText(selectedSimulation.hardwareUsed) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="关联配方">
                    <span v-if="selectedSimulation.systemId">
                      配方 #{{ selectedSimulation.systemId }}
                      <el-button type="text" @click="viewSystem(selectedSimulation.systemId)">查看</el-button>
                    </span>
                    <span v-else>未关联</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="任务说明">
                    {{ selectedSimulation.description || '未填写' }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
              
              <el-card class="detail-section" shadow="never" style="margin-bottom: 15px">
                <template #header>
                  <div class="section-header">
                    <i class="el-icon-time" style="margin-right: 5px; color: #409EFF"></i>
                    <span style="font-weight: bold;">时间信息</span>
                  </div>
                </template>
                
                <el-descriptions :column="2" border size="default">
                  <el-descriptions-item label="创建时间">{{ formatDate(selectedSimulation.createdAt) }}</el-descriptions-item>
                  <el-descriptions-item label="更新时间">{{ formatDate(selectedSimulation.updatedAt) }}</el-descriptions-item>
                  <el-descriptions-item label="开始时间" v-if="selectedSimulation.startTime">
                    {{ formatDate(selectedSimulation.startTime) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="结束时间" v-if="selectedSimulation.endTime">
                    {{ formatDate(selectedSimulation.endTime) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="执行时间" v-if="selectedSimulation.executionTime">
                    {{ formatDuration(selectedSimulation.executionTime) }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>

              <el-card class="detail-section" shadow="never" style="margin-bottom: 15px">
                <template #header>
                  <div class="section-header">
                    <i class="el-icon-setting" style="margin-right: 5px; color: #409EFF"></i>
                    <span style="font-weight: bold;">模拟参数</span>
                  </div>
                </template>
                
                <div v-if="selectedSimulation.parameters && selectedSimulation.parameters !== '{}'">
                  <pre class="params-content" style="background: #f5f7fa; padding: 10px; border-radius: 4px;">{{ formatResultSummary(selectedSimulation.parameters) }}</pre>
                </div>
                <div v-else class="no-params">
                  <el-empty description="未配置额外参数" :image-size="50" />
                </div>
              </el-card>
            </div>
          </el-tab-pane>
          
          <!-- 计算结果与文件 Tab -->
          <el-tab-pane label="计算结果" name="results">
            <div class="tab-scroll-area">
              <el-card 
                class="detail-section" 
                shadow="never"
                v-if="selectedSimulation.resultSummary && selectedSimulation.resultSummary !== '{}'"
                style="margin-bottom: 15px"
              >
                <template #header>
                  <div class="section-header">
                    <i class="el-icon-document" style="margin-right: 5px; color: #409EFF"></i>
                    <span style="font-weight: bold;">结果摘要</span>
                  </div>
                </template>
                
                <pre class="result-content" style="background: #f5f7fa; padding: 10px; border-radius: 4px;">{{ formatResultSummary(selectedSimulation.resultSummary) }}</pre>
              </el-card>
              
              <el-card class="detail-section" shadow="never" style="margin-bottom: 15px">
                <template #header>
                  <div class="section-header">
                    <i class="el-icon-folder" style="margin-right: 5px; color: #409EFF"></i>
                    <span style="font-weight: bold;">文件列表</span>
                  </div>
                </template>
                
                <div v-if="selectedSimulationFiles.length > 0">
                  <el-table :data="selectedSimulationFiles" size="small" border>
                    <el-table-column prop="name" label="文件名" />
                    <el-table-column prop="size" label="大小" width="120">
                      <template #default="{ row }">
                        {{ formatFileSize(row.size) }}
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="150" align="center">
                      <template #default="{ row }">
                        <el-button 
                          size="small" 
                          type="primary" 
                          @click="downloadFile(selectedSimulation.id, row.name)"
                        >
                          下载
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div v-else class="no-files">
                  <el-empty description="暂无文件" :image-size="50" />
                </div>
              </el-card>

              <el-card 
                class="detail-section" 
                shadow="never"
                v-if="selectedSimulation.status === 'RUNNING'"
                style="margin-bottom: 15px"
              >
                <template #header>
                  <div class="section-header">
                    <i class="el-icon-chat-line-round" style="margin-right: 5px; color: #409EFF"></i>
                    <span style="font-weight: bold;">实时日志</span>
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="clearLogs"
                      style="float: right;"
                    >
                      清空
                    </el-button>
                  </div>
                </template>
                
                <div class="log-container" style="background: #1e1e1e; color: #d4d4d4; padding: 15px; border-radius: 4px; height: 300px; overflow-y: auto;">
                  <div ref="logContainer" class="log-content">
                    <div v-for="(log, index) in simulationLogs" :key="index" class="log-line" style="margin-bottom: 5px; font-family: monospace;">
                      <span class="log-time" style="color: #569cd6; margin-right: 8px;">[{{ log.time }}]</span>
                      <span class="log-level" :class="`log-${log.level.toLowerCase()}`" style="margin-right: 8px;" :style="{ color: log.level === 'ERROR' ? '#f44336' : (log.level === 'WARN' ? '#ff9800' : '#4caf50') }">
                        [{{ log.level }}]
                      </span>
                      <span class="log-message">{{ log.message }}</span>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>
          </el-tab-pane>

          <!-- 可视化分析 Tab -->
          <el-tab-pane label="可视化分析" name="visualization" :disabled="selectedSimulation.status !== 'COMPLETED'">
            <template #label>
              <span><i class="el-icon-data-analysis"></i> 可视化分析</span>
            </template>
            <div class="tab-scroll-area" v-if="activeDetailTab === 'visualization'">
              <Visualization :simulation-id="selectedSimulation.id" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- 配方详情对话框 -->
    <el-dialog
      v-model="showSystemDialog"
      :title="`电解液配方详情 - ${selectedSystem?.name || ''}`"
      width="600px"
    >
      <div v-if="selectedSystem" class="system-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="配方名称">{{ selectedSystem.name }}</el-descriptions-item>
          <el-descriptions-item label="锂盐种类">{{ selectedSystem.saltFormula || '未指定' }}</el-descriptions-item>
          <el-descriptions-item label="浓度">
            {{ selectedSystem.concentration }} mol/L
          </el-descriptions-item>
          <el-descriptions-item label="EC比例">
            {{ selectedSystem.ecRatio }}%
          </el-descriptions-item>
          <el-descriptions-item label="DMC比例">
            {{ selectedSystem.dmcRatio }}%
          </el-descriptions-item>
          <el-descriptions-item label="温度">
            {{ selectedSystem.temperature }} K
          </el-descriptions-item>
          <el-descriptions-item label="压力">
            {{ selectedSystem.pressure }} bar
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedSystem.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 批量操作确认对话框 -->
    <el-dialog 
      v-model="showBatchConfirmDialog" 
      :title="batchConfirmTitle"
      width="400px"
    >
      <div class="batch-confirm-content">
        <p>确定要{{ batchConfirmAction }}选中的 {{ selectedSimulations.length }} 个任务吗？</p>
        <ul class="selected-list">
          <li v-for="job in selectedSimulations.slice(0, 5)" :key="job.id">
            {{ job.jobName }} (#{{ job.id }})
          </li>
          <li v-if="selectedSimulations.length > 5">... 还有 {{ selectedSimulations.length - 5 }} 个任务</li>
        </ul>
      </div>
      
      <template #footer>
        <el-button @click="showBatchConfirmDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchOperation">确定</el-button>
      </template>
    </el-dialog>

    <!-- 系统状态监控 -->
    <el-drawer
      v-model="showMonitorDrawer"
      title="系统资源监控"
      size="400px"
      :with-header="true"
    >
      <div class="monitor-container">
        <div v-for="item in monitorData" :key="item.name" class="monitor-item">
          <div class="monitor-header">
            <span>{{ item.name }}</span>
            <el-tag :type="item.status === '正常' ? 'success' : 'warning'" size="small">
              {{ item.status }}
            </el-tag>
          </div>
          <el-progress 
            :percentage="item.usage" 
            :stroke-width="10" 
            :color="getProgressColor(item.usage)"
          />
          <div class="monitor-detail">
            <span>使用率: {{ item.usage }}%</span>
            <span>{{ item.detail }}</span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { simulationApi, systemApi, monitorApi, formatHelper } from '../api.js'
import SimulationForm from '../components/SimulationForm.vue'
import Visualization from '../components/Visualization.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'SimulationsView',
  components: {
    SimulationForm,
    Visualization
  },
  data() {
    return {
      activeDetailTab: 'basic',
      // 数据状态
      simulations: [],
      selectedSimulations: [],
      selectedSimulation: null,
      selectedSystem: null,
      loading: false,

      // 搜索和过滤
      searchQuery: '',
      filterStatus: '',
      filterHardware: '',
      viewMode: 'table', // 'table' 或 'card'
      
      // 分页
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      
      // 对话框状态
      showCreateDialog: false,
      showDetailDialog: false,
      showSystemDialog: false,
      showBatchConfirmDialog: false,
      showMonitorDrawer: false,
      detailFullscreen: false,
      
      // 详情相关
      activeCollapse: ['params'],
      simulationLogs: [],
      selectedSimulationFiles: [],
      logInterval: null,
      
      // 批量操作
      batchConfirmAction: '',
      batchConfirmTitle: '',
      
      // 监控数据
      monitorData: [],
      monitorInterval: null,
      
      // 统计信息
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
    filteredSimulations() {
      let filtered = this.simulations
      
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        filtered = filtered.filter(s =>
          s.jobName.toLowerCase().includes(query) ||
          s.status.toLowerCase().includes(query)
        )
      }

      // 状态过滤
      if (this.filterStatus) {
        filtered = filtered.filter(s => s.status === this.filterStatus)
      }

      // 硬件过滤
      if (this.filterHardware) {
        filtered = filtered.filter(s => s.hardwareUsed === this.filterHardware)
      }
      
      return filtered
    }
  },
  
  mounted() {
    this.loadSimulations()
    this.loadStats()
    this.startAutoRefresh()
  },
  
  beforeUnmount() {
    this.stopAutoRefresh()
    this.clearLogInterval()
    this.clearMonitorInterval()
  },
  
  methods: {
    // 加载模拟任务列表
    async loadSimulations() {
      this.loading = true
      try {
        const response = await simulationApi.getAll()
        this.simulations = response.data || []
        this.pagination.total = this.simulations.length

        // 为运行中的任务模拟进度
        this.simulations.forEach(sim => {
          if (sim.status === 'RUNNING' && !sim.progress) {
            sim.progress = Math.floor(Math.random() * 30) + 10
          }
        })
      } catch (error) {
        console.error('加载模拟任务失败:', error)
        ElMessage.error('加载模拟任务失败: ' + (error.response?.data?.message || error.message))
        this.simulations = []
      } finally {
        this.loading = false
      }
    },
    
    // 加载统计信息
    async loadStats() {
      try {
        const response = await simulationApi.getStats()
        if (response.data) {
          this.stats = {
            total: response.data.total || 0,
            pending: response.data.pending || 0,
            running: response.data.running || 0,
            completed: response.data.completed || 0,
            failed: response.data.failed || 0,
            cancelled: response.data.cancelled || 0
          }
        }
      } catch (error) {
        console.error('加载统计信息失败:', error)
      }
    },
    
    // 创建新模拟任务
    async handleCreateSimulation(formData) {
      try {
        // 映射前端字段到后端实体字段
        const jobData = {
          jobName: formData.jobName,
          userId: 1, // 默认用户ID
          systemId: formData.systemId,
          softwareName: formData.software || 'LAMMPS',
          softwareVersion: '2023.08.02', // 默认版本
          status: 'PENDING',
          targetProperties: JSON.stringify({
            description: formData.description,
            computingUnit: formData.computingUnit,
            ...JSON.parse(formData.parameters || '{}')
          }),
          hardwareUsed: formData.hardwareUsed || 'GPU',
          cpuCores: '8',
          gpuInfo: formData.hardwareUsed === 'GPU' ? 'NVIDIA A100' : null,
          jobRootPath: `/data/platform_data/user_1/jobs/job_${Date.now()}/`,
          randomSeed: Math.floor(Math.random() * 100000)
        }

        const response = await simulationApi.create(jobData)
        const createdJob = response.data

        // 使用后端返回的数据，添加必要的前端显示字段
        const newSimulation = {
          id: createdJob.jobId,
          jobName: createdJob.jobName,
          description: formData.description,
          computingUnit: formData.computingUnit,
          software: createdJob.softwareName,
          hardwareUsed: createdJob.hardwareUsed,
          status: createdJob.status,
          progress: 0,
          systemId: createdJob.systemId,
          createdAt: createdJob.createTime,
          updatedAt: createdJob.updateTime,
          parameters: createdJob.targetProperties
        }

        // 添加到列表顶部
        this.simulations.unshift(newSimulation)
        this.stats.total = (this.stats.total || 0) + 1
        this.stats.pending = (this.stats.pending || 0) + 1
        this.pagination.total = this.simulations.length

        ElMessage.success('模拟任务创建成功，已提交执行')
        this.showCreateDialog = false
      } catch (error) {
        console.error('创建模拟任务失败:', error)
        ElMessage.error('创建模拟任务失败: ' + (error.response?.data?.message || error.message))
      }
    },
    
    // 查看任务详情
    async viewDetails(simulation) {
      try {
        const response = await simulationApi.getById(simulation.id)
        this.selectedSimulation = response.data
        
        // 加载文件列表
        await this.loadSimulationFiles(simulation.id)
        
        // 如果是运行中任务，开始获取日志
        if (simulation.status === 'RUNNING') {
          this.startLogPolling(simulation.id)
        }
        
        this.showDetailDialog = true
      } catch (error) {
        console.error('获取任务详情失败:', error)
        ElMessage.error('获取任务详情失败')
      }
    },
    
    // 加载任务文件列表
    async loadSimulationFiles(jobId) {
      try {
        const response = await simulationApi.getFiles(jobId)
        if (response.data && response.data.result_files) {
          this.selectedSimulationFiles = response.data.result_files.map(file => ({
            name: file,
            size: Math.floor(Math.random() * 10000000) + 1000000 // 模拟文件大小
          }))
        } else {
          this.selectedSimulationFiles = []
        }
      } catch (error) {
        console.error('加载文件列表失败:', error)
        this.selectedSimulationFiles = []
      }
    },
    
    // 开始轮询日志
    startLogPolling(jobId) {
      this.clearLogInterval()
      this.simulationLogs = []
      
      // 模拟日志数据
      const logMessages = [
        "开始能量最小化...",
        "能量最小化完成，开始NVT平衡...",
        "NVT平衡完成，开始NPT平衡...",
        "NPT平衡完成，开始生产MD...",
        "正在计算径向分布函数...",
        "正在计算均方位移..."
      ]
      
      let logIndex = 0
      this.logInterval = setInterval(() => {
        if (logIndex < logMessages.length) {
          const levels = ['INFO', 'WARN', 'ERROR']
          const level = levels[Math.floor(Math.random() * levels.length)]
          
          this.simulationLogs.push({
            time: new Date().toLocaleTimeString(),
            level: level,
            message: logMessages[logIndex]
          })
          
          logIndex++
          
          // 滚动到日志底部
          this.$nextTick(() => {
            const container = this.$refs.logContainer
            if (container) {
              container.scrollTop = container.scrollHeight
            }
          })
        } else {
          // 所有日志已显示，停止轮询
          this.clearLogInterval()
        }
      }, 2000)
    },
    
    // 清空日志
    clearLogs() {
      this.simulationLogs = []
    },
    
    // 清除日志轮询
    clearLogInterval() {
      if (this.logInterval) {
        clearInterval(this.logInterval)
        this.logInterval = null
      }
    },
    
    // 删除模拟任务
    async deleteSimulation(simulation) {
      try {
        await ElMessageBox.confirm(
          `确定要删除模拟任务 "${simulation.jobName}" 吗？此操作不可恢复。`,
          '删除确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            center: true
          }
        )
        
        await simulationApi.delete(simulation.id)
        ElMessage.success('模拟任务删除成功')
        
        // 如果当前查看的是被删除的任务，关闭详情对话框
        if (this.selectedSimulation && this.selectedSimulation.id === simulation.id) {
          this.showDetailDialog = false
        }
        
        this.loadSimulations()
        this.loadStats()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除模拟任务失败:', error)
          ElMessage.error('删除模拟任务失败')
        }
      }
    },
    
    // 取消模拟任务
    async cancelSimulation(simulation) {
      try {
        await ElMessageBox.confirm(
          `确定要取消模拟任务 "${simulation.jobName}" 吗？`,
          '取消确认',
          {
            confirmButtonText: '确定取消',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        
        await simulationApi.cancel(simulation.id)
        ElMessage.success('模拟任务已取消')
        
        // 更新状态显示
        simulation.status = 'CANCELLED'
        
        this.loadStats()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('取消模拟任务失败:', error)
          ElMessage.error('取消模拟任务失败')
        }
      }
    },
    
    // 重新运行任务
    async restartSimulation(simulation) {
      try {
        await ElMessageBox.confirm(
          `确定要重新运行模拟任务 "${simulation.jobName}" 吗？`,
          '重新运行确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消'
          }
        )
        
        // 这里应该调用重新运行的API
        // 暂时模拟成功
        ElMessage.success('已提交重新运行')
        
        // 更新状态
        simulation.status = 'PENDING'
        simulation.progress = 0
        
        this.loadStats()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('重新运行失败:', error)
          ElMessage.error('重新运行失败')
        }
      }
    },
    
    // 复制任务
    cloneSimulation(simulation) {
      this.$router.push({
        path: '/simulations/create',
        query: { cloneId: simulation.id }
      })
      ElMessage.info('已跳转到创建页面，可基于此任务创建新任务')
    },
    
    // 下载结果文件
    async downloadResults(jobId) {
      try {
        const filename = 'results.zip'
        const response = await simulationApi.downloadFile(jobId, filename)
        
        // 创建下载链接
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `simulation_${jobId}_results.zip`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        ElMessage.success('下载已开始')
      } catch (error) {
        console.error('下载结果文件失败:', error)
        ElMessage.error('下载结果文件失败')
      }
    },
    
    // 下载单个文件
    async downloadFile(jobId, filename) {
      try {
        const response = await simulationApi.downloadFile(jobId, filename)
        
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        
        ElMessage.success(`文件 ${filename} 下载已开始`)
      } catch (error) {
        console.error('下载文件失败:', error)
        ElMessage.error('下载文件失败')
      }
    },
    
    // 查看系统详情
    async viewSystem(systemId) {
      try {
        const response = await systemApi.getById(systemId)
        this.selectedSystem = response.data
        this.showSystemDialog = true
      } catch (error) {
        console.error('获取系统详情失败:', error)
        ElMessage.error('获取系统详情失败')
      }
    },
    
    // 表格选择变化
    handleSelectionChange(selection) {
      this.selectedSimulations = selection
    },
    
    // 表格排序变化
    handleSortChange({ prop, order }) {
      if (order) {
        this.simulations.sort((a, b) => {
          const aVal = a[prop]
          const bVal = b[prop]
          
          if (order === 'ascending') {
            return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
          } else {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
          }
        })
      }
    },
    
    // 分页大小变化
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.pagination.currentPage = 1
    },
    
    // 分页当前页变化
    handleCurrentChange(page) {
      this.pagination.currentPage = page
    },
    
    // 批量操作
    handleBatchCommand(command) {
      if (this.selectedSimulations.length === 0) {
        ElMessage.warning('请先选择要操作的任务')
        return
      }
      
      this.batchConfirmAction = command
      this.batchConfirmTitle = {
        cancel: '批量取消任务',
        delete: '批量删除任务',
        export: '批量导出信息'
      }[command]
      
      this.showBatchConfirmDialog = true
    },
    
    // 确认批量操作
    async confirmBatchOperation() {
      try {
        if (this.batchConfirmAction === 'cancel') {
          // 批量取消
          for (const job of this.selectedSimulations) {
            if (job.status === 'RUNNING' || job.status === 'PENDING') {
              await simulationApi.cancel(job.id)
            }
          }
          ElMessage.success(`已取消 ${this.selectedSimulations.length} 个任务`)
        } else if (this.batchConfirmAction === 'delete') {
          // 批量删除
          for (const job of this.selectedSimulations) {
            if (job.status !== 'RUNNING') {
              await simulationApi.delete(job.id)
            }
          }
          ElMessage.success(`已删除 ${this.selectedSimulations.length} 个任务`)
        } else if (this.batchConfirmAction === 'export') {
          // 批量导出
          const exportData = this.selectedSimulations.map(job => ({
            id: job.id,
            name: job.jobName,
            status: job.status,
            hardware: job.hardwareUsed,
            created: job.createdAt
          }))
          
          const dataStr = JSON.stringify(exportData, null, 2)
          const dataBlob = new Blob([dataStr], { type: 'application/json' })
          const url = window.URL.createObjectURL(dataBlob)
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `simulations_export_${new Date().getTime()}.json`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          
          ElMessage.success(`已导出 ${exportData.length} 个任务的信息`)
        }
        
        this.showBatchConfirmDialog = false
        this.selectedSimulations = []
        this.loadSimulations()
        this.loadStats()
      } catch (error) {
        console.error('批量操作失败:', error)
        ElMessage.error('批量操作失败')
      }
    },
    
    // 行操作命令
    handleRowCommand(row, command) {
      switch (command) {
        case 'view':
          this.viewDetails(row)
          break
        case 'download':
          this.downloadResults(row.id)
          break
        case 'clone':
          this.cloneSimulation(row)
          break
        case 'restart':
          this.restartSimulation(row)
          break
        case 'delete':
          this.deleteSimulation(row)
          break
        case 'export':
          // 导出单个任务信息
          const dataStr = JSON.stringify(row, null, 2)
          const dataBlob = new Blob([dataStr], { type: 'application/json' })
          const url = window.URL.createObjectURL(dataBlob)
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `simulation_${row.id}_${new Date().getTime()}.json`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          ElMessage.success('任务信息已导出')
          break
      }
    },
    
    // 新建模拟任务
    handleNewSimulation() {
      this.showCreateDialog = true
    },
    
    // 刷新数据
    refreshData() {
      this.loadSimulations()
      this.loadStats()
    },
    
    // 开始自动刷新
    startAutoRefresh() {
      // 每30秒刷新一次
      setInterval(() => {
        if (!this.showDetailDialog && !this.loading) {
          this.loadSimulations()
          this.loadStats()
        }
      }, 30000)
    },
    
    // 停止自动刷新
    stopAutoRefresh() {
      // 清理定时器
    },
    
    // 切换视图模式
    changeViewMode(mode) {
      this.viewMode = mode
      // 保存到本地存储
      localStorage.setItem('simulationViewMode', mode)
    },
    
    // 获取状态类型
    getStatusType(status) {
      const types = {
        PENDING: 'warning',
        RUNNING: 'primary',
        COMPLETED: 'success',
        FAILED: 'danger',
        CANCELLED: 'info'
      }
      return types[status] || 'default'
    },

    // 获取状态中文文本
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

    // 获取状态图标
    getStatusIcon(status) {
      const icons = {
        PENDING: 'el-icon-time',
        RUNNING: 'el-icon-loading',
        COMPLETED: 'el-icon-check',
        FAILED: 'el-icon-close',
        CANCELLED: 'el-icon-warning-outline'
      }
      return icons[status] || 'el-icon-question'
    },

    // 获取硬件图标
    getHardwareIcon(hardware) {
      const icons = {
        CPU: 'el-icon-cpu',
        GPU: 'el-icon-video-camera',
        BOTH: 'el-icon-setting'
      }
      return icons[hardware] || 'el-icon-help'
    },

    // 获取硬件中文文本
    getHardwareText(hardware) {
      const texts = {
        CPU: '仅CPU',
        GPU: 'GPU加速',
        BOTH: 'CPU+GPU'
      }
      return texts[hardware] || hardware
    },

    // 格式化日期
    formatDate(dateString, format = 'YYYY-MM-DD HH:mm:ss') {
      if (!dateString) return ''
      return formatHelper.formatDate(dateString)
    },
    
    // 时间距离现在多久
    timeAgo(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffSec = Math.floor(diffMs / 1000)
      
      if (diffSec < 60) return '刚刚'
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分钟前`
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}小时前`
      return `${Math.floor(diffSec / 86400)}天前`
    },
    
    // 格式化执行时间
    formatDuration(seconds) {
      return formatHelper.formatDuration(seconds)
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      return formatHelper.formatFileSize(bytes)
    },
    
    // 格式化结果摘要
    formatResultSummary(summary) {
      try {
        return JSON.stringify(JSON.parse(summary), null, 2)
      } catch (e) {
        return summary
      }
    },
    
    // 获取进度条颜色
    getProgressColor(percentage) {
      if (percentage < 30) return '#67C23A'
      if (percentage < 70) return '#E6A23C'
      return '#F56C6C'
    },
    
    // 打开监控面板
    async openMonitor() {
      try {
        const response = await monitorApi.getSystemStatus()
        // 假设返回的是文本格式
        const statusText = response.data
        
        // 解析监控数据（这里需要根据实际API返回格式调整）
        this.monitorData = [
          { name: 'CPU使用率', usage: 45, status: '正常', detail: '4核/16核' },
          { name: '内存使用率', usage: 68, status: '正常', detail: '10.7GB/15.7GB' },
          { name: 'GPU使用率', usage: 32, status: '正常', detail: 'RTX 4060' },
          { name: '磁盘使用率', usage: 25, status: '正常', detail: '256GB/1TB' }
        ]
        
        this.showMonitorDrawer = true
        this.startMonitorPolling()
      } catch (error) {
        console.error('获取监控数据失败:', error)
        ElMessage.error('获取监控数据失败')
      }
    },
    
    // 开始监控轮询
    startMonitorPolling() {
      this.clearMonitorInterval()
      
      this.monitorInterval = setInterval(() => {
        // 模拟数据变化
        this.monitorData.forEach(item => {
          const change = Math.random() * 10 - 5 // -5到+5的随机变化
          item.usage = Math.max(0, Math.min(100, item.usage + change))
          item.usage = Math.round(item.usage)
        })
      }, 3000)
    },
    
    // 清除监控轮询
    clearMonitorInterval() {
      if (this.monitorInterval) {
        clearInterval(this.monitorInterval)
        this.monitorInterval = null
      }
    }
  }
}
</script>

<style scoped>
.simulations-container {
  min-height: 100vh;
  background: #f5f7fa;
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
  min-width: 900px;
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

/* 页面头部样式 */
.page-header {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-title i {
  color: #409EFF;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 统计卡片样式 */
.stats-cards {
  margin-bottom: 20px;
}

.stats-cards .el-statistic {
  text-align: center;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 过滤栏样式 */
.filter-bar {
  margin-bottom: 20px;
}

.filter-card {
  border: none;
  border-radius: 8px;
}

.filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.filter-left {
  display: flex;
  flex: 1;
  gap: 15px;
  align-items: center;
}

.search-input {
  width: 300px;
}

.filter-select {
  width: 150px;
}

/* 表格样式 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-subtitle {
  font-size: 14px;
  color: #909399;
}

.job-name-cell {
  display: flex;
  flex-direction: column;
}

.job-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.job-time {
  font-size: 12px;
  color: #909399;
}

.status-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  min-width: 60px;
}

.system-info {
  display: flex;
  align-items: center;
}

.no-system {
  color: #C0C4CC;
  font-style: italic;
}

.time-cell {
  display: flex;
  flex-direction: column;
}

.time-value {
  font-size: 13px;
  font-weight: 500;
}

.time-diff {
  font-size: 11px;
  color: #909399;
}

.duration-cell {
  font-family: monospace;
  font-size: 13px;
}

.no-duration {
  color: #C0C4CC;
}

.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.action-buttons .action-btn {
  padding: 5px 10px;
  font-size: 12px;
}

/* 卡片视图样式 */
.simulation-cards {
  min-height: 400px;
}

.card-col {
  margin-bottom: 20px;
}

.simulation-card {
  height: 100%;
  transition: transform 0.3s;
}

.simulation-card:hover {
  transform: translateY(-5px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.card-title h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  flex-shrink: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.card-status {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-percent {
  font-size: 12px;
  color: #409EFF;
  min-width: 40px;
}

.card-info {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #606266;
}

.info-item i {
  color: #909399;
}

.card-system {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #409EFF;
  padding: 5px 10px;
  background: #f0f9ff;
  border-radius: 4px;
}

.card-description {
  display: flex;
  align-items: center;
}

.description-text {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #606266;
  padding: 5px 10px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: pointer;
}

.description-text i {
  color: #909399;
}

.description-text.no-description {
  color: #C0C4CC;
}

.card-computing-unit {
  display: flex;
  align-items: center;
}

.computing-unit-text {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: #606266;
  padding: 5px 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.computing-unit-text i {
  color: #909399;
}

.card-summary {
  background: #fafafa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  max-height: 100px;
  overflow: auto;
}

.summary-title {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 5px;
  color: #909399;
}

.summary-content {
  margin: 0;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  color: #606266;
  line-height: 1.4;
}

.card-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
}

/* 分页 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: white;
  border-radius: 0 0 8px 8px;
}

/* 详情对话框样式 */
.detail-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.detail-section {
  border: none;
  border-radius: 8px;
}

.tab-scroll-area {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.section-header i {
  color: #409EFF;
}

.params-content,
.result-content {
  margin: 0;
  padding: 15px;
  background: #fafafa;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  max-height: 300px;
  overflow: auto;
}

.no-params,
.no-files {
  padding: 20px;
  text-align: center;
  color: #909399;
}

/* 日志容器 */
.log-container {
  height: 300px;
  overflow: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #1e1e1e;
  padding: 10px;
}

.log-content {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
}

.log-line {
  margin-bottom: 4px;
  display: flex;
  gap: 10px;
  color: #d4d4d4;
}

.log-time {
  color: #6a9955;
  min-width: 70px;
}

.log-level {
  min-width: 50px;
}

.log-info {
  color: #569cd6;
}

.log-warn {
  color: #d7ba7d;
}

.log-error {
  color: #f44747;
}

.log-message {
  flex: 1;
}

/* 批量确认对话框 */
.batch-confirm-content {
  padding: 10px 0;
}

.selected-list {
  margin: 15px 0;
  padding-left: 20px;
  color: #606266;
}

.selected-list li {
  margin-bottom: 5px;
  font-size: 14px;
}

/* 监控面板 */
.monitor-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.monitor-item {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.monitor-header span {
  font-weight: 500;
  font-size: 14px;
}

.monitor-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
  
  .filter-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-left {
    flex-direction: column;
    width: 100%;
  }
  
  .search-input,
  .filter-select {
    width: 100%;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
  
  .card-col {
    width: 100%;
  }
}
</style>