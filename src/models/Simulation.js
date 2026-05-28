/**
 * 模拟任务实体类
 *
 * 封装模拟任务的数据结构、状态映射和硬件映射
 * 构造时自动计算派生属性，直接通过实例访问即可
 */

// 状态常量
export const SIMULATION_STATUS = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
}

// 状态 → Element Plus Tag 类型
export const STATUS_TYPES = {
  PENDING: 'warning',
  RUNNING: 'primary',
  COMPLETED: 'success',
  FAILED: 'danger',
  CANCELLED: 'info'
}

// 状态 → 中文文本
export const STATUS_TEXTS = {
  PENDING: '等待中',
  RUNNING: '运行中',
  COMPLETED: '已完成',
  FAILED: '已失败',
  CANCELLED: '已取消'
}

// 状态 → 图标
export const STATUS_ICONS = {
  PENDING: 'el-icon-time',
  RUNNING: 'el-icon-loading',
  COMPLETED: 'el-icon-check',
  FAILED: 'el-icon-close',
  CANCELLED: 'el-icon-warning-outline'
}

// 硬件 → 中文文本
export const HARDWARE_TEXTS = {
  CPU: '仅CPU',
  GPU: 'GPU加速',
  BOTH: 'CPU+GPU'
}

// 硬件 → 图标
export const HARDWARE_ICONS = {
  CPU: 'el-icon-cpu',
  GPU: 'el-icon-video-camera',
  BOTH: 'el-icon-setting'
}

export class Simulation {
  constructor(data) {
    if (!data) return

    // 原始字段
    this.id = data.id
    this.isMock = data.isMock || false
    this.jobName = data.jobName
    this.description = data.description
    this.status = data.status
    this.hardwareUsed = data.hardwareUsed
    this.progress = data.progress
    this.systemId = data.systemId
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
    this.startTime = data.startTime
    this.endTime = data.endTime
    this.executionTime = data.executionTime
    this.parameters = data.parameters
    this.resultSummary = data.resultSummary
    this.softwareName = data.softwareName
    this.softwareVersion = data.softwareVersion
    this.cpuCores = data.cpuCores
    this.gpuInfo = data.gpuInfo
    this.jobRootPath = data.jobRootPath
    this.randomSeed = data.randomSeed
    this.targetProperties = data.targetProperties
    this.userId = data.userId

    // 构造时计算属性 - 状态映射
    this.statusType = STATUS_TYPES[data.status] || 'default'
    this.statusText = STATUS_TEXTS[data.status] || data.status
    this.statusIcon = STATUS_ICONS[data.status] || 'el-icon-question'

    // 构造时计算属性 - 硬件映射
    this.hardwareText = HARDWARE_TEXTS[data.hardwareUsed] || data.hardwareUsed
    this.hardwareIcon = HARDWARE_ICONS[data.hardwareUsed] || 'el-icon-help'
  }
}
