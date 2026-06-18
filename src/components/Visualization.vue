<template>
  <div class="visualization-container">
    <!-- 热力学曲线仪表盘 -->
    <el-card class="dashboard-card" shadow="never">
      <template #header>
        <div class="card-header">
          <i class="el-icon-data-line" style="color: #409EFF;"></i>
          <span>热力学曲线</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :span="12"><div ref="chartTemperature" class="chart-item"></div></el-col>
        <el-col :span="12"><div ref="chartPressure" class="chart-item"></div></el-col>
        <el-col :span="12"><div ref="chartDensity" class="chart-item"></div></el-col>
        <el-col :span="12"><div ref="chartEnergy" class="chart-item"></div></el-col>
      </el-row>
    </el-card>

    <!-- 离子动力学仪表盘 -->
    <el-card class="dashboard-card" shadow="never" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <i class="el-icon-connection" style="color: #67C23A;"></i>
          <span>离子动力学</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :span="12"><div ref="chartMsd" class="chart-item"></div></el-col>
        <el-col :span="12"><div ref="chartRdf" class="chart-item"></div></el-col>
      </el-row>
    </el-card>

    <!-- 性质变化曲线仪表盘 -->
    <el-card class="dashboard-card" shadow="never" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <i class="el-icon-data-analysis" style="color: #E6A23C;"></i>
          <span>性质变化曲线</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col :span="12"><div ref="chartConductivity" class="chart-item"></div></el-col>
        <el-col :span="12"><div ref="chartViscosityTemp" class="chart-item"></div></el-col>
      </el-row>
    </el-card>

    <!-- 电解液溶液全景 -->
    <el-card class="dashboard-card" shadow="never" style="margin-top: 16px;">
      <template #header>
        <div class="card-header">
          <i class="el-icon-view" style="color: #409EFF;"></i>
          <span>电解液溶液全景</span>
          <div style="margin-left: auto; display: flex; gap: 10px; align-items: center;">
            <el-radio-group v-model="displayStyle" size="small" @change="(v) => switchDisplayStyle(v, 0)">
              <el-radio-button label="ballStick">球棍模型</el-radio-button>
              <el-radio-button label="spaceFilling">空间填充</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>
      <div ref="molViewer" class="mol-area"></div>
      <div class="mol-legend">
        <span class="legend-item"><i class="legend-dot" style="background:#b07cc9;"></i>Li⁺</span>
        <span class="legend-item"><i class="legend-dot" style="background:#ff9933;"></i>PF₆⁻</span>
        <span class="legend-item"><i class="legend-dot" style="background:#5470C6;"></i>EC</span>
        <span class="legend-item"><i class="legend-dot" style="background:#3BA272;"></i>DMC</span>
      </div>
    </el-card>

    <!-- 各成分三维分子结构 -->
    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :span="12">
        <el-card class="dashboard-card molecule-card" shadow="never">
          <template #header>
            <div class="card-header">
              <i class="legend-dot" style="background:#b07cc9; width:10px; height:10px; flex-shrink:0;"></i>
              <span>Li⁺ (锂离子)</span>
              <div style="margin-left: auto;">
                <el-radio-group v-model="displayStyleLi" size="small" @change="(v) => switchDisplayStyle(v, 1)">
                  <el-radio-button label="ballStick">球棍模型</el-radio-button>
                  <el-radio-button label="spaceFilling">空间填充</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div ref="molLi" class="mol-item"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="dashboard-card molecule-card" shadow="never">
          <template #header>
            <div class="card-header">
              <i class="legend-dot" style="background:#ff9933; width:10px; height:10px; flex-shrink:0;"></i>
              <span>PF₆⁻ (六氟磷酸根)</span>
              <div style="margin-left: auto;">
                <el-radio-group v-model="displayStylePF6" size="small" @change="(v) => switchDisplayStyle(v, 2)">
                  <el-radio-button label="ballStick">球棍模型</el-radio-button>
                  <el-radio-button label="spaceFilling">空间填充</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div ref="molPF6" class="mol-item"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="dashboard-card molecule-card" shadow="never">
          <template #header>
            <div class="card-header">
              <i class="legend-dot" style="background:#5470C6; width:10px; height:10px; flex-shrink:0;"></i>
              <span>EC (碳酸乙烯酯)</span>
              <div style="margin-left: auto;">
                <el-radio-group v-model="displayStyleEC" size="small" @change="(v) => switchDisplayStyle(v, 3)">
                  <el-radio-button label="ballStick">球棍模型</el-radio-button>
                  <el-radio-button label="spaceFilling">空间填充</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div ref="molEC" class="mol-item"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="dashboard-card molecule-card" shadow="never">
          <template #header>
            <div class="card-header">
              <i class="legend-dot" style="background:#3BA272; width:10px; height:10px; flex-shrink:0;"></i>
              <span>DMC (碳酸二甲酯)</span>
              <div style="margin-left: auto;">
                <el-radio-group v-model="displayStyleDMC" size="small" @change="(v) => switchDisplayStyle(v, 4)">
                  <el-radio-button label="ballStick">球棍模型</el-radio-button>
                  <el-radio-button label="spaceFilling">空间填充</el-radio-button>
                </el-radio-group>
              </div>
            </div>
          </template>
          <div ref="molDMC" class="mol-item"></div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const props = defineProps({
  simulationId: {
    type: [Number, String],
    required: true
  }
})

const molViewer = ref(null)
const molLi = ref(null)
const molPF6 = ref(null)
const molEC = ref(null)
const molDMC = ref(null)
const displayStyle = ref('ballStick')
const displayStyleLi = ref('ballStick')
const displayStylePF6 = ref('ballStick')
const displayStyleEC = ref('ballStick')
const displayStyleDMC = ref('ballStick')

// 各图表容器 ref
const chartTemperature = ref(null)
const chartPressure = ref(null)
const chartDensity = ref(null)
const chartEnergy = ref(null)
const chartMsd = ref(null)
const chartRdf = ref(null)
const chartConductivity = ref(null)
const chartViscosityTemp = ref(null)

// 图表类型与 ref 的映射
const chartRefMap = {
  temperature: chartTemperature,
  pressure: chartPressure,
  density: chartDensity,
  energy: chartEnergy,
  msd: chartMsd,
  rdf: chartRdf,
  conductivity: chartConductivity,
  'viscosity-temp': chartViscosityTemp
}

// ECharts 实例管理
const chartInstances = {}

// 配色方案
const COLORS = {
  temperature: '#FC8452',
  pressure: '#9A60B4',
  density: '#3BA272',
  energy: ['#FAC858', '#5470C6', '#91CC75'],
  msd: ['#5470C6', '#FAC858'],
  rdf: ['#5470C6', '#EE6666'],
  conductivity: ['#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE', '#3BA272'],
  viscosity: '#EE6666'
}

// 通用 tooltip
const baseTooltip = {
  trigger: 'axis',
  backgroundColor: 'rgba(255,255,255,0.96)',
  borderColor: '#eee', borderWidth: 1,
  textStyle: { color: '#333', fontSize: 12 },
  axisPointer: { type: 'cross', crossStyle: { color: '#999' } }
}

// 通用 toolbox（仅保存图片）
const baseToolbox = {
  right: 10, top: 4,
  feature: {
    saveAsImage: { title: '保存', pixelRatio: 2 }
  },
  iconStyle: { borderColor: '#999' },
  emphasis: { iconStyle: { borderColor: '#409EFF' } }
}

// 通用滚轮缩放（折线类长序列图表使用）
const insideZoom = [{ type: 'inside' }]

const generateMockData = (type) => {
  if (type === 'temperature') {
    const x = Array.from({ length: 200 }, (_, i) => (i * 0.5).toFixed(1))
    const y = x.map(step => { const t = parseFloat(step); return 298.15 + (Math.random() * 2 - 1) * (t < 15 ? 8 * Math.exp(-t / 5) : 0.8) })
    return { x, y, title: '温度变化', ytitle: '温度 (K)', xtitle: '时间 (ps)', type: 'temperature' }
  } else if (type === 'pressure') {
    const x = Array.from({ length: 200 }, (_, i) => (i * 0.5).toFixed(1))
    const y = x.map(step => { const t = parseFloat(step); return 0.1 + (Math.random() * 2 - 1) * (t < 20 ? 200 * Math.exp(-t / 8) : 15) })
    return { x, y, title: '压力变化', ytitle: '压力 (bar)', xtitle: '时间 (ps)', type: 'pressure' }
  } else if (type === 'density') {
    const x = Array.from({ length: 200 }, (_, i) => (i * 0.5).toFixed(1))
    const y = x.map(step => { const t = parseFloat(step); return 1.18 + (Math.random() * 2 - 1) * (t < 30 ? 0.05 * Math.exp(-t / 12) : 0.003) })
    return { x, y, title: '密度收敛', ytitle: '密度 (g/cm³)', xtitle: '时间 (ps)', type: 'density' }
  } else if (type === 'energy') {
    const x = Array.from({ length: 150 }, (_, i) => (i * 0.5).toFixed(1))
    const kinetic = x.map(t => { const s = parseFloat(t); return -85000 + (Math.random() * 2 - 1) * (s < 10 ? 500 : 100) })
    const potential = x.map(t => { const s = parseFloat(t); return -220000 + (Math.random() * 2 - 1) * (s < 10 ? 800 : 150) + (s < 20 ? -s * 50 : -1000) })
    const total = kinetic.map((k, i) => k + potential[i])
    return {
      x, series: [
        { name: '动能', data: kinetic, color: COLORS.energy[0] },
        { name: '势能', data: potential, color: COLORS.energy[1] },
        { name: '总能量', data: total, color: COLORS.energy[2] }
      ],
      title: '系统能量变化', ytitle: '能量 (kJ/mol)', xtitle: '时间 (ps)', type: 'energy'
    }
  } else if (type === 'msd') {
    const x = Array.from({ length: 50 }, (_, i) => (Math.log10(i + 1) + 0.1).toFixed(2))
    const yLi = x.map(t => Math.log10(2 * 1.21e-9 * Math.pow(10, parseFloat(t)) * 1e12))
    const yPF6 = x.map(t => Math.log10(2 * 0.85e-9 * Math.pow(10, parseFloat(t)) * 1e12))
    return {
      x, series: [
        { name: 'Li⁺', data: yLi.map(v => +v.toFixed(3)), color: COLORS.msd[0] },
        { name: 'PF₆⁻', data: yPF6.map(v => +v.toFixed(3)), color: COLORS.msd[1] }
      ],
      title: '均方位移 (双对数坐标)', ytitle: 'log(MSD) (Å²)', xtitle: 'log(time) (ps)',
      type: 'msd', fitStart: 10, fitEnd: 40
    }
  } else if (type === 'rdf') {
    const rdfX = Array.from({ length: 100 }, (_, i) => (1 + i * 0.05).toFixed(2))
    const rdfLiO = rdfX.map(r => {
      r = parseFloat(r)
      if (r < 1.8) return 0
      if (r >= 1.8 && r < 2.4) return +(Math.exp(-Math.pow((r - 2.0) / 0.15, 2)) * 4.8).toFixed(3)
      if (r >= 3.0 && r < 4.5) return +(Math.exp(-Math.pow((r - 3.8) / 0.6, 2)) * 1.8).toFixed(3)
      return r > 6 ? 1.0 : +(Math.exp(-(r - 5) / 2) * 1.2).toFixed(3)
    })
    const rdfLiP = rdfX.map(r => {
      r = parseFloat(r)
      if (r < 3.5) return 0
      if (r >= 3.5 && r < 5.0) return +(Math.exp(-Math.pow((r - 4.2) / 0.5, 2)) * 2.1).toFixed(3)
      return r > 6 ? 0.8 : +(Math.exp(-(r - 5) / 3) * 1.0).toFixed(3)
    })
    return {
      x: rdfX, series: [
        { name: 'Li⁺ - O (溶剂)', data: rdfLiO, color: COLORS.rdf[0] },
        { name: 'Li⁺ - P (PF₆⁻)', data: rdfLiP, color: COLORS.rdf[1] }
      ],
      title: 'Li⁺溶剂化径向分布函数', ytitle: 'g(r)', xtitle: '距离 r (Å)', type: 'rdf'
    }
  } else if (type === 'conductivity') {
    const concentrations = ['0.1', '0.5', '1.0', '1.5', '2.0', '3.0']
    const conductivities = [12.5, 48.2, 85.2, 112.8, 128.5, 118.3]
    return { x: concentrations, y: conductivities, title: '电导率-浓度曲线', ytitle: '电导率 σ (mS/cm)', xtitle: '盐浓度 (mol/L)', type: 'conductivity' }
  } else if (type === 'viscosity-temp') {
    const temps = [253, 263, 273, 283, 293, 298, 303, 313, 323, 333, 343]
    const viscosity = temps.map(T => +(2.89 * Math.exp(1400 / T - 1400 / 298)).toFixed(2))
    return { x: temps.map(String), y: viscosity, title: '粘度-温度曲线', ytitle: '粘度 η (mPa·s)', xtitle: '温度 (K)', type: 'viscosity' }
  }
}

const buildEchartsOption = (type, data) => {
  const title = { text: data.title, left: 'center', top: 4, textStyle: { fontSize: 14, fontWeight: 600, color: '#303133' } }
  const xAxisBase = { type: 'category', boundaryGap: false, axisLine: { lineStyle: { color: '#ccc' } }, axisTick: { show: false }, axisLabel: { color: '#666', fontSize: 11 }, splitLine: { show: false }, name: data.xtitle, nameTextStyle: { fontSize: 11, color: '#909399', padding: [8, 0, 0, 0] } }
  const yAxisBase = { type: 'value', axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#666', fontSize: 11 }, splitLine: { lineStyle: { color: '#f0f0f0', type: 'dashed' } }, name: data.ytitle, nameTextStyle: { fontSize: 11, color: '#909399', padding: [0, 0, 4, 0] } }
  const grid = { left: 60, right: 24, top: 48, bottom: 40 }

  // ——— 1. 温度：暖色折线 + 渐变填充 + 目标温度参考线 ———
  if (data.type === 'temperature') {
    return {
      title, tooltip: baseTooltip, toolbox: baseToolbox, dataZoom: insideZoom,
      grid: { left: 60, right: 24, top: 52, bottom: 40 },
      xAxis: { ...xAxisBase, data: data.x },
      yAxis: yAxisBase,
      series: [{
        type: 'line', data: data.y, smooth: 0.4, symbol: 'none',
        lineStyle: { width: 2.5, color: COLORS.temperature },
        areaStyle: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(252,132,82,0.40)' },
            { offset: 1, color: 'rgba(252,132,82,0.02)' }
          ]
        },
        markLine: {
          silent: true, symbol: 'none',
          lineStyle: { color: '#FC8452', type: 'dashed', width: 1.5 },
          data: [{ yAxis: 298.15, label: { formatter: '目标 298.15 K', position: 'insideEndTop', fontSize: 10, color: '#FC8452' } }]
        }
      }]
    }
  }

  // ——— 2. 压力：紫色散点折线 + 零线参考 + 阴影波动带 ———
  if (data.type === 'pressure') {
    // 取采样点做散点
    const sampledIdx = data.x.filter((_, i) => i % 4 === 0)
    const sampledY = data.y.filter((_, i) => i % 4 === 0)
    return {
      title, tooltip: baseTooltip, toolbox: baseToolbox, dataZoom: insideZoom,
      grid,
      xAxis: { ...xAxisBase, data: data.x },
      yAxis: yAxisBase,
      series: [
        {
          type: 'line', data: data.y, smooth: 0.3, symbol: 'none',
          lineStyle: { width: 1.5, color: 'rgba(154,96,180,0.5)' },
          areaStyle: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(154,96,180,0.15)' },
              { offset: 1, color: 'rgba(154,96,180,0.01)' }
            ]
          }
        },
        {
          type: 'scatter', data: sampledIdx.map((xVal, i) => [xVal, sampledY[i]]),
          symbolSize: 4, itemStyle: { color: COLORS.pressure, borderColor: '#fff', borderWidth: 1 },
          z: 10
        },
        {
          type: 'line', data: data.y.map(() => 0), symbol: 'none',
          lineStyle: { width: 1, color: '#9A60B4', type: 'dashed', opacity: 0.4 },
          markLine: {
            silent: true, symbol: 'none',
            lineStyle: { color: '#9A60B4', type: 'dotted', width: 1 },
            data: [{ yAxis: 0, label: { formatter: '0 bar', fontSize: 10, color: '#9A60B4', position: 'insideEndTop' } }]
          }
        }
      ]
    }
  }

  // ——— 3. 密度：青绿色阶跃线 + 平衡标注 + 收敛区间高亮 ———
  if (data.type === 'density') {
    return {
      title, tooltip: baseTooltip, toolbox: baseToolbox, dataZoom: insideZoom,
      grid: { left: 60, right: 24, top: 52, bottom: 40 },
      xAxis: { ...xAxisBase, data: data.x },
      yAxis: { ...yAxisBase, min: 1.10, max: 1.30 },
      series: [{
        type: 'line', data: data.y, step: 'middle', symbol: 'none',
        lineStyle: { width: 2, color: COLORS.density },
        areaStyle: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59,162,114,0.30)' },
            { offset: 1, color: 'rgba(59,162,114,0.02)' }
          ]
        },
        markLine: {
          silent: true, symbol: 'none',
          lineStyle: { color: COLORS.density, type: 'dashed', width: 1.5 },
          data: [{ yAxis: 1.18, label: { formatter: '平衡值 1.18 g/cm³', fontSize: 10, color: COLORS.density, position: 'insideEndTop' } }]
        },
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(59,162,114,0.08)', borderWidth: 1, borderColor: 'rgba(59,162,114,0.25)', borderType: 'dashed' },
          label: { show: true, position: 'insideTop', formatter: '收敛区', fontSize: 10, color: COLORS.density },
          data: [[{ xAxis: data.x[60] }, { xAxis: data.x[data.x.length - 1] }]]
        }
      }]
    }
  }

  // ——— 4. 能量：三线叠加 + 透明填充 ———
  if (data.type === 'energy') {
    return {
      title, tooltip: baseTooltip, toolbox: baseToolbox, dataZoom: insideZoom,
      legend: { top: 28, textStyle: { fontSize: 11 } },
      grid: { left: 60, right: 24, top: 68, bottom: 40 },
      xAxis: { ...xAxisBase, data: data.x },
      yAxis: yAxisBase,
      series: data.series.map((s, i) => ({
        type: 'line', name: s.name, data: s.data, smooth: 0.3, symbol: 'none',
        lineStyle: { width: 2.5, color: s.color },
        areaStyle: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: s.color + '50' },
            { offset: 1, color: s.color + '05' }
          ]
        }
      }))
    }
  }

  // ——— 5. MSD：虚线 + 圆点标记 + 拟合区 ———
  if (data.type === 'msd') {
    const series = data.series.map((s) => ({
      type: 'line', name: s.name, data: s.data, smooth: false,
      symbol: 'circle', symbolSize: 5,
      lineStyle: { width: 2, color: s.color, type: 'dashed' },
      itemStyle: { color: s.color, borderColor: '#fff', borderWidth: 1.5 }
    }))
    series[0].markArea = {
      silent: true,
      itemStyle: { color: 'rgba(84,112,198,0.08)', borderWidth: 1, borderColor: 'rgba(84,112,198,0.3)', borderType: 'dashed' },
      label: { show: true, position: 'insideTop', formatter: '线性拟合区', fontSize: 10, color: '#5470C6' },
      data: [[{ xAxis: data.x[data.fitStart] }, { xAxis: data.x[data.fitEnd] }]]
    }
    return {
      title, tooltip: baseTooltip, toolbox: baseToolbox, dataZoom: insideZoom,
      legend: { top: 28, textStyle: { fontSize: 11 } },
      grid: { left: 60, right: 24, top: 68, bottom: 40 },
      xAxis: { ...xAxisBase, data: data.x },
      yAxis: yAxisBase,
      series
    }
  }

  // ——— 6. RDF：粗实线 + 峰值标注 + 无填充 ———
  if (data.type === 'rdf') {
    return {
      title, tooltip: baseTooltip, toolbox: baseToolbox, dataZoom: insideZoom,
      legend: { top: 28, textStyle: { fontSize: 11 } },
      grid: { left: 60, right: 24, top: 68, bottom: 40 },
      xAxis: { ...xAxisBase, data: data.x },
      yAxis: yAxisBase,
      series: data.series.map((s, i) => ({
        type: 'line', name: s.name, data: s.data, smooth: 0.2,
        symbol: 'none',
        lineStyle: { width: 3, color: s.color },
        markPoint: i === 0 ? {
          data: [
            { type: 'max', name: '第一配位层', symbolSize: 40, label: { fontSize: 9 } },
          ],
          symbol: 'pin', itemStyle: { color: s.color }
        } : undefined
      }))
    }
  }

  // ——— 7. 电导率：圆角渐变柱 + 数值标签 ———
  if (data.type === 'conductivity') {
    return {
      title, tooltip: baseTooltip, toolbox: baseToolbox,
      grid,
      xAxis: { ...xAxisBase, data: data.x, boundaryGap: true },
      yAxis: yAxisBase,
      series: [{
        type: 'bar', data: data.y, barWidth: '40%', barMaxWidth: 48,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: (params) => new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: COLORS.conductivity[params.dataIndex % COLORS.conductivity.length] },
            { offset: 1, color: COLORS.conductivity[params.dataIndex % COLORS.conductivity.length] + '66' }
          ])
        },
        label: { show: true, position: 'top', fontSize: 10, color: '#666', formatter: '{c}' }
      }]
    }
  }

  // ——— 8. 粘度：红色平滑曲线 + 菱形标记点 ———
  if (data.type === 'viscosity') {
    return {
      title, tooltip: baseTooltip, toolbox: baseToolbox, dataZoom: insideZoom,
      grid,
      xAxis: { ...xAxisBase, data: data.x },
      yAxis: yAxisBase,
      series: [{
        type: 'line', data: data.y, smooth: true,
        symbol: 'diamond', symbolSize: 8,
        lineStyle: { width: 2.5, color: COLORS.viscosity },
        itemStyle: { color: COLORS.viscosity, borderColor: '#fff', borderWidth: 2 },
        areaStyle: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(238,102,102,0.22)' },
            { offset: 1, color: 'rgba(238,102,102,0.01)' }
          ]
        }
      }]
    }
  }

  return {}
}

const renderChart = (type, containerRef) => {
  const container = containerRef?.value
  if (!container) return

  // 销毁已有实例
  if (chartInstances[type]) {
    chartInstances[type].dispose()
    delete chartInstances[type]
  }

  const data = generateMockData(type)
  if (!data) return

  const chart = echarts.init(container)
  chartInstances[type] = chart
  chart.setOption(buildEchartsOption(type, data))
}

const renderAllCharts = () => {
  Object.entries(chartRefMap).forEach(([type, refObj]) => {
    renderChart(type, refObj)
  })
}

// 窗口 resize 时自适应
const handleResize = () => {
  Object.values(chartInstances).forEach(chart => {
    if (chart && !chart.isDisposed()) chart.resize()
  })
}

// Three.js 相关变量
// Three.js 场景实例管理：全景 + 4 个成分
const scenes = []

// 公共工具：创建原子球
function createAtom(color, radius, pos) {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 48, 24),
    new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.2 })
  )
  sphere.position.set(pos[0], pos[1], pos[2])
  sphere.castShadow = true
  sphere.receiveShadow = true
  return sphere
}

// 公共工具：创建化学键
function createBond(from, to, color = 0xbbbbbb, radius = 0.06) {
  const f = new THREE.Vector3(...from), t = new THREE.Vector3(...to)
  const dir = new THREE.Vector3().subVectors(t, f)
  const len = dir.length()
  const cyl = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, len, 8),
    new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 })
  )
  cyl.position.copy(new THREE.Vector3().addVectors(f, t).multiplyScalar(0.5))
  cyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  cyl.castShadow = true
  return cyl
}

// 通用：初始化一个 Three.js 小场景
function initMolScene(containerRef, buildMolecules, cameraPos = [6, 4, 6]) {
  const container = containerRef?.value
  if (!container) {
    console.warn('initMolScene: container ref is null')
    return null
  }

  const width = container.clientWidth || 300
  const height = container.clientHeight || 300

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#eef1f5')

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000)
  camera.position.set(...cameraPos)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.outputColorSpace = THREE.SRGBColorSpace

  // WebGL context check
  const gl = renderer.getContext()
  if (!gl) {
    renderer.dispose()
    return null
  }

  container.appendChild(renderer.domElement)

  // 灯光
  scene.add(new THREE.AmbientLight(0xffffff, 0.7))
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
  dirLight.position.set(5, 10, 7)
  dirLight.castShadow = true
  scene.add(dirLight)
  const fill = new THREE.PointLight(0xddeeff, 0.3)
  fill.position.set(-4, 3, 6)
  scene.add(fill)

  // 轨道控制器
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = true
  controls.autoRotateSpeed = 0.6
  controls.target.set(0, 0, 0)
  controls.minDistance = 3
  controls.maxDistance = 20

  // 构建分子
  const molGroup = new THREE.Group()
  const bondGroup = new THREE.Group()
  const radii = []
  try {
    buildMolecules(molGroup, bondGroup, radii)
  } catch (e) {
    console.error('buildMolecules error:', e.message)
  }
  molGroup.add(bondGroup)
  scene.add(molGroup)

  // 使用 ResizeObserver 监听容器尺寸变化
  const resizeObs = new ResizeObserver(() => {
    const w = container.clientWidth
    const h = container.clientHeight
    if (w === 0 || h === 0) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  })
  resizeObs.observe(container)

  return {
    scene, camera, renderer, controls, molGroup, bondGroup, radii, resizeObs, container
  }
}

// 销毁场景
function disposeScene(s) {
  if (!s) return
  if (s.resizeObs) s.resizeObs.disconnect()
  s.scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
      else obj.material.dispose()
    }
  })
  if (s.container && s.renderer.domElement && s.container.contains(s.renderer.domElement)) {
    s.container.removeChild(s.renderer.domElement)
  }
  s.renderer.dispose()
}

// ========== 溶液全景 ==========
const initPanorama = () => {
  const s = initMolScene(molViewer, (molGroup, bondGroup, radii) => {
    function addMol(atoms, bonds, bc = 0xaaaaaa, br = 0.06) {
      atoms.forEach(a => { molGroup.add(createAtom(a.color, a.radius, a.pos)); radii.push(a.radius) })
      bonds.forEach(b => bondGroup.add(createBond(atoms[b[0]].pos, atoms[b[1]].pos, bc, br)))
    }

    // Li⁺ x2
    const LI = 0xb07cc9;
    [[-5, 2, 3], [6, -1, -4]].forEach(p => addMol([{ color: LI, radius: 0.55, pos: p }], []))

    // PF₆⁻ x2
    const PF_P = 0xff9933, PF_F = 0x90e050;
    [[-6, -1, -5], [5, 3, 5]].forEach(c => {
      const a = [
        { color: PF_P, radius: 0.52, pos: c },
        { color: PF_F, radius: 0.38, pos: [c[0]+1.4,c[1],c[2]] },
        { color: PF_F, radius: 0.38, pos: [c[0]-1.4,c[1],c[2]] },
        { color: PF_F, radius: 0.38, pos: [c[0],c[1]+1.4,c[2]] },
        { color: PF_F, radius: 0.38, pos: [c[0],c[1]-1.4,c[2]] },
        { color: PF_F, radius: 0.38, pos: [c[0],c[1],c[2]+1.4] },
        { color: PF_F, radius: 0.38, pos: [c[0],c[1],c[2]-1.4] },
      ]
      addMol(a, [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6]], 0xaaccaa, 0.07)
    })

    // EC x3
    const EC_C = 0x5470C6, EC_O = 0xff4444, EC_H = 0xcccccc
    ;[[-3,4,-2],[4,-2,2],[-1,-3,5]].forEach(c => {
      const a = [
        { color: EC_C, radius: 0.42, pos: c },
        { color: EC_O, radius: 0.45, pos: [c[0]-0.3,c[1]+1.1,c[2]+0.8] },
        { color: EC_O, radius: 0.45, pos: [c[0]+0.8,c[1]-0.6,c[2]+0.9] },
        { color: EC_C, radius: 0.42, pos: [c[0]+1.4,c[1]+0.3,c[2]+0.4] },
        { color: EC_C, radius: 0.42, pos: [c[0]-1.2,c[1]+0.5,c[2]-0.3] },
        { color: EC_O, radius: 0.45, pos: [c[0]-0.4,c[1]-0.8,c[2]-0.9] },
        { color: EC_H, radius: 0.25, pos: [c[0]+1.8,c[1]+1.0,c[2]+0.2] },
        { color: EC_H, radius: 0.25, pos: [c[0]+2.0,c[1]-0.2,c[2]+0.8] },
        { color: EC_H, radius: 0.25, pos: [c[0]-1.8,c[1]+1.2,c[2]-0.6] },
        { color: EC_H, radius: 0.25, pos: [c[0]-2.0,c[1]-0.1,c[2]-0.8] },
      ]
      addMol(a, [[0,1],[0,2],[0,5],[2,3],[3,4],[4,5],[3,6],[3,7],[4,8],[4,9]], 0x7a8eb5, 0.055)
    })

    // DMC x3
    const DMC_C = 0x3BA272, DMC_O = 0xff4444, DMC_H = 0xcccccc
    ;[[2,4,-5],[-5,-2,1],[0,-4,-3]].forEach(c => {
      const a = [
        { color: DMC_C, radius: 0.42, pos: c },
        { color: DMC_O, radius: 0.45, pos: [c[0]+0.2,c[1]+1.2,c[2]+0.6] },
        { color: DMC_O, radius: 0.45, pos: [c[0]+1.3,c[1]-0.3,c[2]-0.5] },
        { color: DMC_O, radius: 0.45, pos: [c[0]-1.1,c[1]-0.5,c[2]+0.7] },
        { color: DMC_C, radius: 0.42, pos: [c[0]+2.3,c[1]+0.2,c[2]-1.0] },
        { color: DMC_C, radius: 0.42, pos: [c[0]-2.2,c[1]+0.1,c[2]+1.3] },
        { color: DMC_H, radius: 0.25, pos: [c[0]+2.8,c[1]+1.0,c[2]-0.5] },
        { color: DMC_H, radius: 0.25, pos: [c[0]+2.9,c[1]-0.5,c[2]-0.4] },
        { color: DMC_H, radius: 0.25, pos: [c[0]+2.5,c[1]+0.2,c[2]-2.0] },
        { color: DMC_H, radius: 0.25, pos: [c[0]-2.8,c[1]+1.0,c[2]+0.8] },
        { color: DMC_H, radius: 0.25, pos: [c[0]-2.7,c[1]-0.6,c[2]+0.7] },
        { color: DMC_H, radius: 0.25, pos: [c[0]-2.5,c[1]+0.2,c[2]+2.3] },
      ]
      addMol(a, [[0,1],[0,2],[0,3],[2,4],[3,5],[4,6],[4,7],[4,8],[5,9],[5,10],[5,11]], 0x6daa8e, 0.055)
    })

    // 粒子云
    const cloudGeo = new THREE.BufferGeometry()
    const n = 400
    const pp = new Float32Array(n * 3), pc = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 4 + Math.random() * 8
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(Math.random() * 2 - 1)
      pp[i*3] = Math.sin(ph)*Math.cos(th)*r; pp[i*3+1] = Math.sin(ph)*Math.sin(th)*r; pp[i*3+2] = Math.cos(ph)*r
      const col = new THREE.Color().setHSL(0.58+Math.random()*0.12, 0.3, 0.6)
      pc[i*3]=col.r; pc[i*3+1]=col.g; pc[i*3+2]=col.b
    }
    cloudGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3))
    cloudGeo.setAttribute('color', new THREE.BufferAttribute(pc, 3))
    const pts = new THREE.Points(cloudGeo, new THREE.PointsMaterial({ size: 0.06, vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false }))
    molGroup.add(pts)
  }, [14, 10, 14])
  if (s) scenes.push(s)
}

// ========== Li⁺ 单独 ==========
const initLi = () => {
  const s = initMolScene(molLi, (molGroup, bondGroup, radii) => {
    molGroup.add(createAtom(0xb07cc9, 0.8, [0, 0, 0]))
    radii.push(0.8)
  }, [4, 3, 4])
  if (s) scenes.push(s)
}

// ========== PF₆⁻ 单独 ==========
const initPF6 = () => {
  const s = initMolScene(molPF6, (molGroup, bondGroup, radii) => {
    const c = [0, 0, 0]
    const a = [
      { color: 0xff9933, radius: 0.7, pos: c },
      { color: 0x90e050, radius: 0.5, pos: [1.5,0,0] },
      { color: 0x90e050, radius: 0.5, pos: [-1.5,0,0] },
      { color: 0x90e050, radius: 0.5, pos: [0,1.5,0] },
      { color: 0x90e050, radius: 0.5, pos: [0,-1.5,0] },
      { color: 0x90e050, radius: 0.5, pos: [0,0,1.5] },
      { color: 0x90e050, radius: 0.5, pos: [0,0,-1.5] },
    ]
    a.forEach(x => { molGroup.add(createAtom(x.color, x.radius, x.pos)); radii.push(x.radius) })
    for (let i = 1; i <= 6; i++) bondGroup.add(createBond(a[0].pos, a[i].pos, 0xaaccaa, 0.09))
  }, [5, 3, 5])
  if (s) scenes.push(s)
}

// ========== EC 单独 ==========
const initEC = () => {
  const s = initMolScene(molEC, (molGroup, bondGroup, radii) => {
    const a = [
      { color: 0x5470C6, radius: 0.55, pos: [0, 0, 0] },
      { color: 0xff4444, radius: 0.58, pos: [-0.3, 1.4, 1.0] },
      { color: 0xff4444, radius: 0.58, pos: [1.0, -0.7, 1.1] },
      { color: 0x5470C6, radius: 0.55, pos: [1.7, 0.4, 0.5] },
      { color: 0x5470C6, radius: 0.55, pos: [-1.5, 0.6, -0.4] },
      { color: 0xff4444, radius: 0.58, pos: [-0.5, -1.0, -1.1] },
      { color: 0xcccccc, radius: 0.32, pos: [2.2, 1.2, 0.2] },
      { color: 0xcccccc, radius: 0.32, pos: [2.5, -0.3, 1.0] },
      { color: 0xcccccc, radius: 0.32, pos: [-2.2, 1.4, -0.7] },
      { color: 0xcccccc, radius: 0.32, pos: [-2.5, -0.2, -1.0] },
    ]
    a.forEach(x => { molGroup.add(createAtom(x.color, x.radius, x.pos)); radii.push(x.radius) })
    ;[[0,1],[0,2],[0,5],[2,3],[3,4],[4,5],[3,6],[3,7],[4,8],[4,9]].forEach(b =>
      bondGroup.add(createBond(a[b[0]].pos, a[b[1]].pos, 0x7a8eb5, 0.07))
    )
  }, [5, 4, 5])
  if (s) scenes.push(s)
}

// ========== DMC 单独 ==========
const initDMC = () => {
  const s = initMolScene(molDMC, (molGroup, bondGroup, radii) => {
    const a = [
      { color: 0x3BA272, radius: 0.55, pos: [0, 0, 0] },
      { color: 0xff4444, radius: 0.58, pos: [0.2, 1.4, 0.7] },
      { color: 0xff4444, radius: 0.58, pos: [1.5, -0.4, -0.6] },
      { color: 0xff4444, radius: 0.58, pos: [-1.3, -0.6, 0.8] },
      { color: 0x3BA272, radius: 0.55, pos: [2.8, 0.2, -1.2] },
      { color: 0x3BA272, radius: 0.55, pos: [-2.6, 0.1, 1.5] },
      { color: 0xcccccc, radius: 0.32, pos: [3.4, 1.2, -0.6] },
      { color: 0xcccccc, radius: 0.32, pos: [3.5, -0.6, -0.5] },
      { color: 0xcccccc, radius: 0.32, pos: [3.0, 0.2, -2.4] },
      { color: 0xcccccc, radius: 0.32, pos: [-3.4, 1.2, 0.9] },
      { color: 0xcccccc, radius: 0.32, pos: [-3.3, -0.7, 0.8] },
      { color: 0xcccccc, radius: 0.32, pos: [-3.0, 0.2, 2.7] },
    ]
    a.forEach(x => { molGroup.add(createAtom(x.color, x.radius, x.pos)); radii.push(x.radius) })
    ;[[0,1],[0,2],[0,3],[2,4],[3,5],[4,6],[4,7],[4,8],[5,9],[5,10],[5,11]].forEach(b =>
      bondGroup.add(createBond(a[b[0]].pos, a[b[1]].pos, 0x6daa8e, 0.07))
    )
  }, [6, 4, 6])
  if (s) scenes.push(s)
}

// 切换球棍/空间填充（sceneIndex 可选，不传则控制全景）
const switchDisplayStyle = (style, sceneIndex) => {
  const isSpaceFilling = style === 'spaceFilling'
  const scale = isSpaceFilling ? 2.2 : 1.0
  const targets = sceneIndex !== undefined ? [scenes[sceneIndex]] : scenes
  targets.forEach(s => {
    if (!s || !s.molGroup) return
    s.molGroup.children.forEach((child) => {
      if (child instanceof THREE.Mesh && child.geometry?.type === 'SphereGeometry') {
        child.scale.setScalar(scale)
      }
    })
    if (s.bondGroup) s.bondGroup.visible = !isSpaceFilling
  })
}

// 统一动画循环
let globalAnimId = null
function globalAnimate() {
  globalAnimId = requestAnimationFrame(globalAnimate)
  scenes.forEach(s => {
    if (!s) return
    s.controls.update()
    s.renderer.render(s.scene, s.camera)
  })
}

onMounted(() => {
  nextTick(() => {
    renderAllCharts()
    setTimeout(() => {
      initPanorama()
      initLi()
      initPF6()
      initEC()
      initDMC()
      if (scenes.length > 0) globalAnimate()
    }, 500)
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cancelAnimationFrame(globalAnimId)
  globalAnimId = null
  scenes.forEach(s => disposeScene(s))
  scenes.length = 0
  Object.values(chartInstances).forEach(chart => {
    if (chart && !chart.isDisposed()) chart.dispose()
  })
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.visualization-container {
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
}

.card-header i {
  margin-right: 8px;
  font-size: 16px;
}

.dashboard-card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
}

.chart-item {
  width: 100%;
  height: 280px;
  min-height: 240px;
}

.mol-area {
  width: 100%;
  min-height: 500px;
  height: 500px;
  position: relative;
  border-radius: 6px;
  overflow: visible;
  border: 1px solid #EBEEF5;
  background: #eef1f5;
  display: block;
}

.mol-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 10px 0 4px;
  font-size: 13px;
  color: #606266;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.mol-item {
  width: 100%;
  height: 280px;
  min-height: 240px;
  border-radius: 6px;
  border: 1px solid #EBEEF5;
  background: #eef1f5;
}

.molecule-card :deep(.el-card__header) {
  padding: 10px 16px;
}

@media (max-width: 1600px) {
  .mol-area {
    height: 380px;
  }
  .chart-item {
    min-height: 200px;
  }
}
</style>
