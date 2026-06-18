<template>
  <div class="simulation-detail-page">
    <!-- 顶部导航栏 -->
    <div class="detail-header">
      <div class="header-left">
        <el-button @click="goBack" :icon="ArrowLeft">返回列表</el-button>
        <el-divider direction="vertical" />
        <h2 class="header-title" v-if="simulation">{{ simulation.jobName }}</h2>
        <el-tag v-if="simulation" :type="simulation.statusType" size="large" style="margin-left: 12px;">
          {{ simulation.statusText }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-button
          type="warning"
          @click="restartSimulation"
          v-if="simulation?.status === 'FAILED' || simulation?.status === 'CANCELLED'"
        >
          重新运行
        </el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" style="text-align: center; padding: 100px 0;">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p style="color: #909399; margin-top: 12px;">加载中...</p>
    </div>

    <!-- 详情内容 -->
    <div v-else-if="simulation" class="detail-body">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 基础信息 Tab -->
        <el-tab-pane label="基础信息" name="basic">
          <el-card class="detail-section" shadow="never" style="margin-bottom: 15px">
            <template #header>
              <div class="section-header">
                <i class="el-icon-info" style="margin-right: 5px; color: #409EFF"></i>
                <span style="font-weight: bold;">任务概况</span>
              </div>
            </template>

            <el-descriptions :column="2" border size="default">
              <el-descriptions-item label="任务ID">{{ simulation.id }}</el-descriptions-item>
              <el-descriptions-item label="任务名称">{{ simulation.jobName }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="simulation.statusType">
                  {{ simulation.statusText }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="硬件">
                <el-tag :type="simulation.hardwareUsed === 'GPU' ? 'warning' : 'info'">
                  {{ simulation.hardwareText }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="软件">
                {{ simulation.softwareName || '--' }} {{ simulation.softwareVersion ? `v${simulation.softwareVersion}` : '' }}
              </el-descriptions-item>
              <el-descriptions-item label="CPU核心">
                {{ simulation.cpuCores ? simulation.cpuCores + ' 核' : '--' }}
              </el-descriptions-item>
              <el-descriptions-item label="GPU">
                {{ simulation.gpuInfo || '--' }}
              </el-descriptions-item>
              <el-descriptions-item label="关联配方">
                <span v-if="simulation.systemId">
                  配方 #{{ simulation.systemId }}
                  <el-button type="text" @click="viewSystem(simulation.systemId)">查看</el-button>
                </span>
                <span v-else>未关联</span>
              </el-descriptions-item>
              <el-descriptions-item label="任务说明" :span="2">
                {{ simulation.description || '未填写' }}
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
              <el-descriptions-item label="创建时间">{{ formatDate(simulation.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatDate(simulation.updatedAt) }}</el-descriptions-item>
              <el-descriptions-item label="开始时间" v-if="simulation.startTime">
                {{ formatDate(simulation.startTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="结束时间" v-if="simulation.endTime">
                {{ formatDate(simulation.endTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="执行时间" v-if="simulation.executionTime">
                {{ formatDuration(simulation.executionTime) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card class="detail-section" shadow="never" style="margin-bottom: 15px">
            <template #header>
              <div class="section-header">
                <i class="el-icon-setting" style="margin-right: 5px; color: #409EFF"></i>
                <span style="font-weight: bold;">输入参数</span>
              </div>
            </template>

            <div v-if="parsedParameters && Object.keys(parsedParameters).length > 0">
              <el-descriptions :column="2" border size="default">
                <el-descriptions-item
                  v-for="item in parametersList"
                  :key="item.key"
                  :label="item.label"
                >
                  {{ item.value }}<span class="field-unit" v-if="item.unit">{{ item.unit }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </div>
            <div v-else>
              <el-empty description="未配置输入参数" :image-size="50" />
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 计算结果与文件 Tab -->
        <el-tab-pane label="计算结果" name="results">
          <!-- 未完成提示 -->
          <el-card
            class="detail-section"
            shadow="never"
            v-if="simulation.status !== 'COMPLETED'"
            style="margin-bottom: 15px"
          >
            <el-empty description="任务尚未完成，暂无计算结果" :image-size="80">
              <template #image>
                <span style="font-size: 48px; color: #C0C4CC;">📋</span>
              </template>
            </el-empty>
          </el-card>

          <!-- 计算结果数值（已完成时显示） -->
          <template v-if="simulation.status === 'COMPLETED'">
            <!-- 关键指标概览条 -->
            <div class="result-overview-bar">
              <div class="overview-item" v-for="item in keyMetrics" :key="item.label">
                <span class="overview-label">{{ item.label }}</span>
                <span class="overview-value" :style="{ color: item.color }">{{ item.value }}</span>
                <span class="overview-unit">{{ item.unit }}</span>
              </div>
            </div>

            <!-- 分组详细数据 -->
            <el-card
              v-for="group in calculationResultGroups"
              :key="group.name"
              class="detail-section result-group-card"
              shadow="never"
              style="margin-top: 12px"
            >
              <template #header>
                <div class="section-header">
                  <i :class="group.icon" style="margin-right: 5px;" :style="{ color: group.color }"></i>
                  <span style="font-weight: bold;">{{ group.label }}</span>
                </div>
              </template>
              <el-descriptions :column="2" border size="default">
                <el-descriptions-item
                  v-for="field in group.fields"
                  :key="field.key"
                  :label="field.label"
                >
                  <span :class="{ 'negative-value': field.negative }">{{ field.value }}</span>
                  <span class="field-unit">{{ field.unit }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </template>

          <el-card
            class="detail-section"
            shadow="never"
            v-if="simulation.status === 'RUNNING'"
            style="margin-bottom: 15px"
          >
            <template #header>
              <div class="section-header">
                <i class="el-icon-chat-line-round" style="margin-right: 5px; color: #409EFF"></i>
                <span style="font-weight: bold;">实时日志</span>
                <el-button type="text" size="small" @click="clearLogs" style="float: right;">
                  清空
                </el-button>
              </div>
            </template>

            <div class="log-container">
              <div ref="logContainer" class="log-content">
                <div v-for="(log, index) in simulationLogs" :key="index" class="log-line">
                  <span class="log-time">[{{ log.time }}]</span>
                  <span class="log-level" :class="`log-${log.level.toLowerCase()}`">
                    [{{ log.level }}]
                  </span>
                  <span class="log-message">{{ log.message }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 输出文件 Tab -->
        <el-tab-pane label="输出文件" name="files">
          <el-card v-if="files.length > 0" class="detail-section files-card" shadow="never">
            <el-table :data="files" border style="width: 100%" class="files-table">
              <el-table-column prop="name" label="文件名" min-width="200" />
              <el-table-column label="大小" min-width="120">
                <template #default="{ row }">{{ formatFileSize(row.size) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="100" align="center">
                <template #default="{ row }">
                  <el-button size="small" type="primary" @click="downloadFile(row.name)">下载</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
          <el-empty v-else description="暂无结果文件" :image-size="80" />
        </el-tab-pane>

        <!-- 可视化分析 Tab -->
        <el-tab-pane label="可视化分析" name="visualization" :disabled="simulation.status !== 'COMPLETED'">
          <template #label>
            <span><i class="el-icon-data-analysis"></i> 可视化分析</span>
          </template>
          <div v-if="activeTab === 'visualization'">
            <Visualization :simulation-id="simulation.id" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 加载失败 -->
    <div v-else style="text-align: center; padding: 100px 0;">
      <el-empty description="未找到该模拟任务">
        <el-button type="primary" @click="goBack">返回列表</el-button>
      </el-empty>
    </div>

    <!-- 配方详情对话框 -->
    <el-dialog
      v-model="showSystemDialog"
      :title="`电解液配方详情 - ${selectedSystem?.name || ''}`"
      width="650px"
      align-center
    >
      <div v-if="selectedSystem" class="system-detail">
        <el-descriptions :column="2" border size="default">
          <el-descriptions-item label="配方名称" :span="2">{{ selectedSystem.name }}</el-descriptions-item>
          <el-descriptions-item label="任务描述" :span="2">{{ selectedSystem.taskDescription || '未填写' }}</el-descriptions-item>
          <el-descriptions-item label="溶剂">{{ selectedSystem.solventInfoDisplay }}</el-descriptions-item>
          <el-descriptions-item label="锂盐">{{ selectedSystem.saltInfoDisplay }}</el-descriptions-item>
          <el-descriptions-item label="添加剂">{{ selectedSystem.additiveInfoDisplay }}</el-descriptions-item>
          <el-descriptions-item label="盒子尺寸">{{ selectedSystem.boxSizeDisplay }}</el-descriptions-item>
          <el-descriptions-item label="温度">{{ selectedSystem.temperature }} K</el-descriptions-item>
          <el-descriptions-item label="压力">{{ selectedSystem.pressure }} bar</el-descriptions-item>
          <el-descriptions-item label="边界条件">{{ selectedSystem.boundaryConditions }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ formatDate(selectedSystem.createdAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ArrowLeft, Loading } from '@element-plus/icons-vue'
import { simulationApi, systemApi, formatHelper } from '../api.js'
import { Simulation } from '../models/Simulation.js'
import { ElectrolyteFormula } from '../models/ElectrolyteFormula.js'
import { getMockCompletedSimulation } from '../models/mockData.js'
import Visualization from '../components/Visualization.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'SimulationDetail',
  components: { Visualization, ArrowLeft, Loading },
  data() {
    return {
      loading: true,
      simulation: null,
      files: [],
      activeTab: 'basic',
      simulationLogs: [],
      logInterval: null,
      showSystemDialog: false,
      selectedSystem: null
    }
  },
  computed: {
    parsedParameters() {
      if (!this.simulation?.parameters || this.simulation.parameters === '{}') return null
      try {
        return JSON.parse(this.simulation.parameters)
      } catch {
        return null
      }
    },
    parametersList() {
      const params = this.parsedParameters
      if (!params) return []
      const labelMap = {
        ensemble: { label: '系综类型', unit: '' },
        temperature: { label: '温度', unit: 'K' },
        pressure: { label: '压强', unit: 'bar' },
        timestep: { label: '时间步长', unit: 'fs' },
        totalSteps: { label: '总步数', unit: '' },
        outputInterval: { label: '输出间隔', unit: '步' },
        thermostat: { label: '控温器', unit: '' },
        barostat: { label: '控压器', unit: '' },
        cutoffDistance: { label: '截断距离', unit: 'Å' },
        longRangeSolver: { label: '长程求解器', unit: '' },
        bondStyle: { label: '键势函数', unit: '' },
        angleStyle: { label: '角势函数', unit: '' },
        dihedralStyle: { label: '二面角势函数', unit: '' },
        improperStyle: { label: '非正常二面角势函数', unit: '' },
        pairStyle: { label: '对势函数', unit: '' },
        kspaceStyle: { label: 'K空间求解', unit: '' },
        kspaceAccuracy: { label: 'K空间精度', unit: '' },
        neighborSkin: { label: '邻域皮肤距离', unit: 'Å' },
        neighborUpdateFrequency: { label: '邻域更新频率', unit: '' }
      }
      const valueMap = {
        ensemble: { NVT: 'NVT (正则系综)', NPT: 'NPT (等温等压系综)', NVE: 'NVE (微正则系综)' },
        thermostat: { 'Nose-Hoover': 'Nose-Hoover', 'Berendsen': 'Berendsen', 'Langevin': 'Langevin' },
        longRangeSolver: { PPPM: 'PPPM', Ewald: 'Ewald' }
      }
      return Object.entries(params).map(([key, value]) => {
        const meta = labelMap[key] || { label: key, unit: '' }
        const displayValue = valueMap[key]?.[value] || value
        return { key, label: meta.label, value: String(displayValue), unit: meta.unit }
      })
    },
    keyMetrics() {
      return [
        { label: '密度', value: '1.048', unit: 'g/cm³', color: '#409EFF' },
        { label: '电导率', value: '85.2', unit: 'mS/cm', color: '#E6A23C' },
        { label: '粘度', value: '1.23', unit: 'cP', color: '#67C23A' },
        { label: '介电常数', value: '68.3', unit: '', color: '#F56C6C' },
        { label: 'Li⁺扩散系数', value: '2.34e-10', unit: 'm²/s', color: '#b07cc9' },
        { label: 'Li⁺配位数', value: '5.8', unit: '', color: '#ff9933' }
      ]
    },
    calculationResultGroups() {
      return [
        {
          name: 'density', label: '密度', icon: 'el-icon-box', color: '#409EFF',
          fields: [
            { key: 'density-value', label: '密度值', value: '1.048', unit: 'g/cm³' },
            { key: 'density-err', label: '统计误差', value: '±0.003', unit: 'g/cm³' },
            { key: 'density-temp', label: '温度条件', value: '298.15', unit: 'K' },
            { key: 'density-press', label: '压强条件', value: '1.0', unit: 'bar' },
            { key: 'density-sample', label: '采样时间', value: '10.0', unit: 'ns' },
            { key: 'density-equil', label: '平衡时间', value: '2.0', unit: 'ns' },
            { key: 'density-method', label: '计算方法', value: 'NPT 系综', unit: '' },
            { key: 'density-ensemble', label: '系综类型', value: 'NPT', unit: '' },
            { key: 'density-atoms', label: '体系原子数', value: '24,576', unit: '' }
          ]
        },
        {
          name: 'conductivity', label: '电导率', icon: 'el-icon-lightning', color: '#E6A23C',
          fields: [
            { key: 'cond-total', label: '总电导率', value: '85.2', unit: 'mS/cm' },
            { key: 'cond-err', label: '统计误差', value: '±2.1', unit: 'mS/cm' },
            { key: 'cond-li', label: 'Li⁺ 电导率', value: '41.8', unit: 'mS/cm' },
            { key: 'cond-pf6', label: 'PF₆⁻ 电导率', value: '33.2', unit: 'mS/cm' },
            { key: 'cond-tensor', label: '电导率张量迹', value: '84.9', unit: 'mS/cm' },
            { key: 'cond-method', label: '计算方法', value: 'Green-Kubo', unit: '' },
            { key: 'cond-contrib', label: '离子贡献', value: '98.2', unit: '%' },
            { key: 'cond-field', label: '电场强度', value: '0.0', unit: 'V/Å' },
            { key: 'cond-temp', label: '温度', value: '298.15', unit: 'K' },
            { key: 'cond-sample', label: '采样时间', value: '5.0', unit: 'ns' },
            { key: 'cond-neq', label: '非平衡态校正', value: '0.8', unit: 'mS/cm' },
            { key: 'cond-trans', label: '迁移数 (Li⁺)', value: '0.38', unit: '' }
          ]
        },
        {
          name: 'viscosity', label: '粘度', icon: 'el-icon-heavy-rain', color: '#67C23A',
          fields: [
            { key: 'visc-value', label: '粘度值', value: '1.23', unit: 'cP' },
            { key: 'visc-err', label: '统计误差', value: '±0.05', unit: 'cP' },
            { key: 'visc-method', label: '计算方法', value: 'Green-Kubo', unit: '' },
            { key: 'visc-acf', label: '应力自相关函数衰减时间', value: '200.0', unit: 'ps' },
            { key: 'visc-shear', label: '剪切速率', value: '1.2e-5', unit: 'ps⁻¹' },
            { key: 'visc-stress', label: '应力响应', value: '0.15', unit: 'bar' },
            { key: 'visc-bulk', label: '体积粘度', value: '2.85', unit: 'cP' },
            { key: 'visc-sample', label: '采样时间', value: '8.0', unit: 'ns' },
            { key: 'visc-temp', label: '温度', value: '298.15', unit: 'K' }
          ]
        },
        {
          name: 'dielectric', label: '介电常数', icon: 'el-icon-magnet', color: '#F56C6C',
          fields: [
            { key: 'die-tensor', label: '介电常数张量', value: '72.5', unit: 'F/m' },
            { key: 'die-static', label: '静态介电常数', value: '68.3', unit: '' },
            { key: 'die-optical', label: '光学介电常数 (ε∞)', value: '5.2', unit: '' },
            { key: 'die-spectrum', label: '介电谱数据', value: '5.2 (ε∞)', unit: '' },
            { key: 'die-method', label: '计算方法', value: '偶极自相关', unit: '' },
            { key: 'die-dipole', label: '偶极矩数据', value: '2.35', unit: 'D' },
            { key: 'die-sample', label: '采样时间', value: '2.0', unit: 'ns' },
            { key: 'die-temp', label: '温度', value: '298.15', unit: 'K' },
            { key: 'die-contrib', label: '组分贡献', value: '85% 溶剂', unit: '' },
            { key: 'die-size', label: '体系尺寸', value: '40.0', unit: 'Å' },
            { key: 'die-corr', label: '偶极相关时间', value: '15.3', unit: 'ps' },
            { key: 'die-var', label: '偶极矩涨落', value: '0.42', unit: 'D²' }
          ]
        },
        {
          name: 'diffusion', label: '扩散系数', icon: 'el-icon-position', color: '#b07cc9',
          fields: [
            { key: 'diff-li', label: 'Li⁺ 扩散系数', value: '2.34e-10', unit: 'm²/s' },
            { key: 'diff-li-err', label: 'Li⁺ 统计误差', value: '±0.08e-10', unit: 'm²/s' },
            { key: 'diff-anion', label: 'PF₆⁻ 扩散系数', value: '1.87e-10', unit: 'm²/s' },
            { key: 'diff-anion-err', label: 'PF₆⁻ 统计误差', value: '±0.06e-10', unit: 'm²/s' },
            { key: 'diff-solvent', label: 'EC 扩散系数', value: '5.62e-10', unit: 'm²/s' },
            { key: 'diff-solvent-dmc', label: 'DMC 扩散系数', value: '8.15e-10', unit: 'm²/s' },
            { key: 'diff-method', label: '计算方法', value: 'MSD 线性拟合', unit: '' },
            { key: 'diff-fit-range', label: '拟合区间', value: '5-50', unit: 'ns' },
            { key: 'diff-r2', label: '拟合R²', value: '0.997', unit: '' },
            { key: 'diff-temp', label: '温度', value: '298.15', unit: 'K' },
            { key: 'diff-nernst', label: 'Nernst-Einstein电导率', value: '82.6', unit: 'mS/cm' },
            { key: 'diff-ratio', label: 'NE/实际比值', value: '0.97', unit: '' }
          ]
        },
        {
          name: 'solvation', label: '溶剂化结构', icon: 'el-icon-connection', color: '#ff9933',
          fields: [
            { key: 'solv-center', label: '中心离子类型', value: 'Li⁺', unit: '' },
            { key: 'solv-shell', label: '溶剂化壳层结构', value: '第一+第二壳层', unit: '' },
            { key: 'solv-coord', label: '平均配位数', value: '5.8', unit: '' },
            { key: 'solv-coord-err', label: '配位数波动', value: '±0.3', unit: '' },
            { key: 'solv-dist', label: '配位距离', value: '2.01', unit: 'Å' },
            { key: 'solv-rdf', label: 'RDF特征峰', value: '2.0 Å', unit: '' },
            { key: 'solv-rdf2', label: '第二壳层峰位', value: '4.2', unit: 'Å' },
            { key: 'solv-hbond', label: '氢键网络特征', value: '4.2 平均氢键', unit: '' },
            { key: 'solv-stability', label: '溶剂化结构稳定性', value: '85', unit: 'ps' },
            { key: 'solv-energy', label: '离子-溶剂相互作用能', value: '-382.4', unit: 'kJ/mol', negative: true },
            { key: 'solv-tempdep', label: '温度依赖性', value: '12.5', unit: 'kJ/mol' },
            { key: 'solv-cnm', label: '配位数分布', value: '4-7 为主', unit: '' }
          ]
        },
        {
          name: 'thermo', label: '热力学量', icon: 'el-icon-thermometer', color: '#E6A23C',
          fields: [
            { key: 'thermo-pe', label: '势能', value: '-125,432', unit: 'kJ/mol' },
            { key: 'thermo-ke', label: '动能', value: '38,256', unit: 'kJ/mol' },
            { key: 'thermo-etotal', label: '总能量', value: '-87,176', unit: 'kJ/mol' },
            { key: 'thermo-enthalpy', label: '焓', value: '-86,920', unit: 'kJ/mol' },
            { key: 'thermo-temp', label: '平均温度', value: '298.23', unit: 'K' },
            { key: 'thermo-temp-fluct', label: '温度涨落', value: '±1.8', unit: 'K' },
            { key: 'thermo-press', label: '平均压力', value: '1.02', unit: 'bar' },
            { key: 'thermo-press-fluct', label: '压力涨落', value: '±52.3', unit: 'bar' },
            { key: 'thermo-vol', label: '体系体积', value: '64,000', unit: 'Å³' },
            { key: 'thermo-cp', label: '等压热容', value: '285.6', unit: 'J/(mol·K)' },
            { key: 'thermo-cv', label: '等容热容', value: '248.3', unit: 'J/(mol·K)' },
            { key: 'thermo-compress', label: '等温压缩率', value: '8.2e-5', unit: 'bar⁻¹' }
          ]
        }
      ]
    }
  },
  mounted() {
    this.loadDetail()
  },
  beforeUnmount() {
    this.clearLogInterval()
  },
  methods: {
    async loadDetail() {
      this.loading = true
      const id = Number(this.$route.params.id)

      // mock 数据
      if (id === 1) {
        const mockSim = getMockCompletedSimulation()
        if (mockSim.isMock) {
          this.simulation = mockSim
          this.files = [
            { name: 'input.lammps', size: 4520 },
            { name: 'data.system', size: 245760 },
            { name: 'log.lammps', size: 128340 },
            { name: 'dump.traj.gz', size: 5242880 },
            { name: 'thermo.dat', size: 32768 },
            { name: 'msd.dat', size: 8192 },
            { name: 'rdf.dat', size: 16384 },
            { name: 'coord_num.dat', size: 4096 },
            { name: 'energy.png', size: 65536 },
            { name: 'temperature.png', size: 55296 }
          ]
          this.loading = false
          return
        }
      }

      try {
        const [detailResponse, filesResponse] = await Promise.all([
          simulationApi.getById(id),
          simulationApi.getFiles(id).catch(() => ({ data: { result_files: [] } }))
        ])

        this.simulation = new Simulation(detailResponse.data)

        if (filesResponse.data && filesResponse.data.result_files) {
          this.files = filesResponse.data.result_files.map(file => ({
            name: file,
            size: Math.floor(Math.random() * 10000000) + 1000000
          }))
        }

        if (this.simulation.status === 'RUNNING') {
          this.startLogPolling()
        }
      } catch (error) {
        if (error.silent) return
        console.error('加载任务详情失败:', error)
        ElMessage.error('加载任务详情失败')
      } finally {
        this.loading = false
      }
    },

    goBack() {
      this.$router.push('/simulations')
    },

    startLogPolling() {
      this.clearLogInterval()
      this.simulationLogs = []

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
            level,
            message: logMessages[logIndex]
          })

          logIndex++

          this.$nextTick(() => {
            const container = this.$refs.logContainer
            if (container) {
              container.scrollTop = container.scrollHeight
            }
          })
        } else {
          this.clearLogInterval()
        }
      }, 2000)
    },

    clearLogs() {
      this.simulationLogs = []
    },

    clearLogInterval() {
      if (this.logInterval) {
        clearInterval(this.logInterval)
        this.logInterval = null
      }
    },

    async restartSimulation() {
      try {
        await ElMessageBox.confirm(
          `确定要重新运行模拟任务 "${this.simulation.jobName}" 吗？`,
          '重新运行确认',
          { confirmButtonText: '确定', cancelButtonText: '取消' }
        )
        ElMessage.success('已提交重新运行')
        this.simulation.status = 'PENDING'
        this.simulation.progress = 0
      } catch (error) {
        if (error !== 'cancel') {
          console.error('重新运行失败:', error)
          ElMessage.error('重新运行失败')
        }
      }
    },

    cloneSimulation() {
      this.$router.push({
        path: '/simulations/create',
        query: { cloneId: this.simulation.id }
      })
      ElMessage.info('已跳转到创建页面，可基于此任务创建新任务')
    },

    async downloadResults() {
      try {
        const response = await simulationApi.downloadFile(this.simulation.id, 'results.zip')
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `simulation_${this.simulation.id}_results.zip`)
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

    async downloadFile(filename) {
      try {
        const response = await simulationApi.downloadFile(this.simulation.id, filename)
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

    async viewSystem(systemId) {
      try {
        const response = await systemApi.getById(systemId)
        this.selectedSystem = new ElectrolyteFormula(response.data?.data)
        this.showSystemDialog = true
      } catch (error) {
        console.error('获取系统详情失败:', error)
        ElMessage.error('获取系统详情失败')
      }
    },

    formatDate(dateString) {
      return formatHelper.formatDate(dateString)
    },

    formatDuration(seconds) {
      return formatHelper.formatDuration(seconds)
    },

    formatFileSize(bytes) {
      return formatHelper.formatFileSize(bytes)
    }
  }
}
</script>

<style scoped>
.simulation-detail-page {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.detail-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.detail-body :deep(.el-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-body :deep(.el-tabs__content) {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.detail-section {
  border: none;
  border-radius: 8px;
}

.files-card :deep(.el-card__body) {
  padding: 0;
}

.files-table :deep(.el-table__header th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.files-table :deep(.el-table__body td) {
  background-color: #fff;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

/* 计算结果 - 概览条 */
.result-overview-bar {
  display: flex;
  gap: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.overview-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 8px;
  border-right: 1px solid #e4e7ed;
  min-width: 0;
}

.overview-item:last-child {
  border-right: none;
}

.overview-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
  white-space: nowrap;
}

.overview-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.overview-unit {
  font-size: 11px;
  color: #C0C4CC;
  margin-top: 4px;
}

/* 统一所有 el-descriptions 风格 */
:deep(.el-descriptions__body) {
  table-layout: fixed;
}
:deep(.el-descriptions__label) {
  width: 140px;
}
:deep(.el-descriptions__content) {
  min-width: 120px;
}

.field-unit {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

.negative-value {
  color: #409EFF;
  font-weight: 600;
}

.log-container {
  height: 400px;
  overflow-y: auto;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 15px;
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

.system-detail {
  padding: 10px 0;
}
</style>
