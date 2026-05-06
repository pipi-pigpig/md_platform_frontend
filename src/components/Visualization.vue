<template>
  <div class="visualization-container">
    <el-row :gutter="20">
      <!-- 左侧：计算结果竖形表 -->
      <el-col :span="8">
        <el-card class="result-card" shadow="never">
          <template #header>
            <div class="card-header">
              <i class="el-icon-data-analysis" style="color: #409EFF;"></i>
              <span>计算结果数值</span>
            </div>
          </template>
          <div class="result-table">
            <div v-for="item in calculationResults" :key="item.name" class="result-row" :class="{ 'indent-1': item.indent === 1, 'indent-2': item.indent === 2, 'header-item': item.isHeader }">
              <div class="result-label">{{ item.label }}</div>
              <div class="result-value" :class="getHighlightClass(item.value)">
                {{ item.value }} <span class="result-unit">{{ item.unit }}</span>
              </div>
            </div>
            <el-divider style="margin: 12px 0;"></el-divider>
            <div class="summary-section">
              <h4>计算统计信息</h4>
              <div class="summary-item">
                <span>模拟总步数:</span>
                <span>{{ stats.totalSteps }}</span>
              </div>
              <div class="summary-item">
                <span>平均每步时间:</span>
                <span>{{ stats.avgStepTime }} ms</span>
              </div>
              <div class="summary-item">
                <span>总计算时间:</span>
                <span>{{ stats.totalTime }}</span>
              </div>
              <div class="summary-item">
                <span>收敛性判断:</span>
                <el-tag :type="stats.converged ? 'success' : 'warning'" size="small">
                  {{ stats.converged ? '已收敛' : '未收敛' }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：图表 + 3D结构 -->
      <el-col :span="16">
        <el-row :gutter="20">
          <!-- 右上方：图表 -->
          <el-col :span="24">
            <el-card class="chart-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <i class="el-icon-data-line" style="color: #409EFF;"></i>
                  <span>二维数据分析</span>
                  <el-select v-model="currentChart" size="small" style="margin-left: auto; width: 200px">
                    <el-option label="1. NPT密度平衡" value="npt-density" />
                    <el-option label="2. 均方位移 MSD" value="msd" />
                    <el-option label="3. 电导率变化" value="conductivity" />
                    <el-option label="4. 溶剂化结构 RDF" value="rdf" />
                  </el-select>
                </div>
              </template>
              <div ref="plotlyChart" class="chart-area"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <!-- 右下方：3D结构 -->
          <el-col :span="24">
            <el-card class="mol-card" shadow="never">
              <template #header>
                <div class="card-header">
                  <i class="el-icon-view" style="color: #409EFF;"></i>
                  <span>三维分子结构可视化 (LiPF₆ + EC + DMC 电解液体系)</span>
                </div>
              </template>
              <div ref="molViewer" class="mol-area"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, onUnmounted } from 'vue'
import Plotly from 'plotly.js-dist-min'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'

const props = defineProps({
  simulationId: {
    type: [Number, String],
    required: true
  }
})

const currentChart = ref('npt-density')
const plotlyChart = ref(null)
const molViewer = ref(null)

// 计算结果数据 - 按层级组织
const calculationResults = [
  // 密度
  { name: 'density', label: '密度', indent: 0, isHeader: true },
  { name: 'density-value', label: '• 密度值', value: '1.048', unit: 'g/cm³', indent: 1 },
  { name: 'density-temp', label: '• 温度条件', value: '298.15', unit: 'K', indent: 1 },
  { name: 'density-press', label: '• 压强条件', value: '1.0', unit: 'bar', indent: 1 },
  { name: 'density-sample', label: '• 采样时间', value: '10.0', unit: 'ns', indent: 1 },
  { name: 'density-method', label: '• 计算方法', value: 'NPT 系综', unit: '', indent: 1 },

  // 电导率
  { name: 'conductivity', label: '电导率', indent: 0, isHeader: true },
  { name: 'cond-total', label: '• 总电导率', value: '85.2', unit: 'mS/cm', indent: 1 },
  { name: 'cond-li', label: '• Li⁺ 电导率', value: '41.8', unit: 'mS/cm', indent: 1 },
  { name: 'cond-pf6', label: '• PF₆⁻ 电导率', value: '33.2', unit: 'mS/cm', indent: 1 },
  { name: 'cond-tensor', label: '• 电导率张量迹', value: '84.9', unit: 'mS/cm', indent: 1 },
  { name: 'cond-method', label: '• 计算方法', value: 'Green-Kubo', unit: '', indent: 1 },
  { name: 'cond-contrib', label: '• 离子贡献', value: '98.2', unit: '%', indent: 1 },
  { name: 'cond-temp', label: '• 温度', value: '298.15', unit: 'K', indent: 1 },
  { name: 'cond-sample', label: '• 采样时间', value: '5.0', unit: 'ns', indent: 1 },
  { name: 'cond-field', label: '• 电场强度', value: '0.0', unit: 'V/Å', indent: 1 },

  // 粘度
  { name: 'viscosity', label: '粘度', indent: 0, isHeader: true },
  { name: 'visc-value', label: '• 粘度值', value: '1.23', unit: 'cP', indent: 1 },
  { name: 'visc-method', label: '• 计算方法', value: 'Green-Kubo', unit: '', indent: 1 },
  { name: 'visc-acf', label: '• 应力自相关函数', value: '200.0', unit: 'ps', indent: 1 },
  { name: 'visc-shear', label: '• 剪切速率', value: '1.2e-5', unit: 'ps⁻¹', indent: 1 },
  { name: 'visc-stress', label: '• 应力响应', value: '0.15', unit: 'bar', indent: 1 },
  { name: 'visc-sample', label: '• 采样时间', value: '8.0', unit: 'ns', indent: 1 },
  { name: 'visc-temp', label: '• 温度', value: '298.15', unit: 'K', indent: 1 },

  // 介电常数
  { name: 'dielectric', label: '介电常数', indent: 0, isHeader: true },
  { name: 'die-tensor', label: '• 介电常数张量', value: '72.5', unit: 'F/m', indent: 1 },
  { name: 'die-static', label: '• 静态介电常数', value: '68.3', unit: '', indent: 1 },
  { name: 'die-spectrum', label: '• 介电谱数据', value: '5.2 (ε∞)', unit: '', indent: 1 },
  { name: 'die-method', label: '• 计算方法', value: '偶极自相关', unit: '', indent: 1 },
  { name: 'die-dipole', label: '• 偶极矩数据', value: '2.35', unit: 'D', indent: 1 },
  { name: 'die-sample', label: '• 采样时间', value: '2.0', unit: 'ns', indent: 1 },
  { name: 'die-temp', label: '• 温度', value: '298.15', unit: 'K', indent: 1 },
  { name: 'die-contrib', label: '• 组分贡献', value: '85% 溶剂', unit: '', indent: 1 },
  { name: 'die-size', label: '• 体系尺寸', value: '40.0', unit: 'Å', indent: 1 },

  // 溶剂化结构
  { name: 'solvation', label: '溶剂化结构', indent: 0, isHeader: true },
  { name: 'solv-center', label: '• 中心离子类型', value: 'Li⁺', unit: '', indent: 1 },
  { name: 'solv-shell', label: '• 溶剂化壳层结构', value: '第一+第二壳层', unit: '', indent: 1 },
  { name: 'solv-coord', label: '• 平均配位数', value: '5.8', unit: '', indent: 1 },
  { name: 'solv-dist', label: '• 配位距离', value: '2.01', unit: 'Å', indent: 1 },
  { name: 'solv-rdf', label: '• RDF特征峰', value: '2.0 Å', unit: '', indent: 1 },
  { name: 'solv-hbond', label: '• 氢键网络特征', value: '4.2 平均氢键', unit: '', indent: 1 },
  { name: 'solv-stability', label: '• 溶剂化结构稳定性', value: '85', unit: 'ps', indent: 1 },
  { name: 'solv-energy', label: '• 离子-溶剂相互作用能', value: '-382.4', unit: 'kJ/mol', indent: 1 },
  { name: 'solv-tempdep', label: '• 温度依赖性', value: '12.5', unit: 'kJ/mol', indent: 1 }
]

// 统计信息
const stats = {
  totalSteps: '10,000,000',
  avgStepTime: '1.8',
  totalTime: '5h 12min',
  converged: true
}

// 根据数值高亮
const getHighlightClass = (value) => {
  const num = parseFloat(value)
  if (!isNaN(num) && num < 0) {
    return 'negative'
  }
  return ''
}

// 模拟数据生成
const generateMockData = (type) => {
  if (type === 'npt-density') {
    // 1. NPT平衡过程密度变化
    const x = Array.from({ length: 100 }, (_, i) => i)
    // 密度从波动到稳定
    const y = x.map(step => {
      const baseDensity = 1.18
      const amplitude = step < 30 ? (0.05 * (1 - step / 30)) : 0.005
      return baseDensity + (Math.random() * 2 - 1) * amplitude
    })
    return {
      x, y,
      title: 'NPT平衡过程密度稳定性',
      ytitle: '密度 (g/cm³)',
      xtitle: '模拟步数 (ps)',
      type: 'scatter'
    }
  } else if (type === 'msd') {
    // 2. 双对数均方位移 MSD
    const x = Array.from({ length: 50 }, (_, i) => Math.log10(i + 1) + 0.1)
    // Li+ MSD
    const yLi = x.map(t => Math.log10(2 * 1.21e-9 * Math.pow(10, t) * 1e12))
    // PF6- MSD
    const yPF6 = x.map(t => Math.log10(2 * 0.85e-9 * Math.pow(10, t) * 1e12))
    return {
      x,
      traces: [
        { x, y: yLi, name: 'Li⁺', color: '#409EFF' },
        { x, y: yPF6, name: 'PF₆⁻', color: '#E6A23C' }
      ],
      title: '均方位移 (双对数坐标)',
      ytitle: 'log(MSD) (Å²)',
      xtitle: 'log(time) (ps)',
      type: 'msd',
      fitStart: 10, fitEnd: 40
    }
  } else if (type === 'conductivity') {
    // 3. 不同浓度下电导率变化
    const concentrations = [0.1, 0.5, 1.0, 1.5, 2.0, 3.0]
    const conductivities = [12.5, 48.2, 85.2, 112.8, 128.5, 118.3]
    return {
      x: concentrations,
      y: conductivities,
      title: '不同浓度下电解液电导率',
      ytitle: '电导率 σ (mS/cm)',
      xtitle: '盐浓度 (mol/L)',
      type: 'bar'
    }
  } else if (type === 'rdf') {
    // 4. Li+周围溶剂化结构径向分布
    const rdfX = Array.from({ length: 100 }, (_, i) => 1 + i * 0.05)
    // Li-O (溶剂) 和 Li-PF6 分布
    const rdfLiO = rdfX.map(r => {
      if (r < 1.8) return 0
      if (r >= 1.8 && r < 2.4) return Math.exp(-Math.pow((r - 2.0) / 0.15, 2)) * 4.8
      if (r >= 3.0 && r < 4.5) return Math.exp(-Math.pow((r - 3.8) / 0.6, 2)) * 1.8
      return r > 6 ? 1.0 : Math.exp(-(r - 5) / 2) * 1.2
    })
    const rdfLiP = rdfX.map(r => {
      if (r < 3.5) return 0
      if (r >= 3.5 && r < 5.0) return Math.exp(-Math.pow((r - 4.2) / 0.5, 2)) * 2.1
      return r > 6 ? 0.8 : Math.exp(-(r - 5) / 3) * 1.0
    })
    return {
      x: rdfX,
      traces: [
        { x: rdfX, y: rdfLiO, name: 'Li⁺ - O (溶剂)', color: '#409EFF' },
        { x: rdfX, y: rdfLiP, name: 'Li⁺ - P (PF₆⁻)', color: '#F56C6C' }
      ],
      title: 'Li⁺周围溶剂化径向分布函数',
      ytitle: 'g(r)',
      xtitle: '距离 r (Å)',
      type: 'rdf'
    }
  }
}

const renderPlotly = () => {
  if (!plotlyChart.value) return

  const data = generateMockData(currentChart.value)
  let traces = []

  if (data.type === 'scatter') {
    traces = [{
      x: data.x,
      y: data.y,
      type: 'scatter',
      mode: 'lines',
      line: { color: '#409EFF', width: 2 }
    }]
  } else if (data.type === 'bar') {
    traces = [{
      x: data.x,
      y: data.y,
      type: 'bar',
      marker: {
        color: data.x.map((c, i) => ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#409EFF'][i % 6]),
        line: { width: 1, color: '#fff' }
      }
    }]
  } else if (data.type === 'msd' || data.type === 'rdf') {
    traces = data.traces.map(t => ({
      x: t.x,
      y: t.y,
      type: 'scatter',
      mode: 'lines',
      name: t.name,
      line: { color: t.color, width: 2 }
    }))
    // 添加线性拟合区域标注 for MSD
    if (data.type === 'msd') {
      const yMin = Math.min(...data.traces[0].y)
      const yMax = Math.max(...data.traces[0].y)
      traces.push({
        type: 'rect',
        x0: data.x[data.fitStart],
        x1: data.x[data.fitEnd],
        y0: yMin - 0.2,
        y1: yMax + 0.2,
        line: { width: 0 },
        fillcolor: 'rgba(64, 158, 255, 0.2)',
        name: '线性拟合区'
      })
    }
  }

  const layout = {
    title: { text: data.title, font: { size: 14 } },
    xaxis: { title: data.xtitle, gridcolor: '#EBEEF5' },
    yaxis: { title: data.ytitle, gridcolor: '#EBEEF5' },
    margin: { l: 60, r: 20, t: 40, b: 50 },
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    height: 280,
    showlegend: (data.type === 'msd' || data.type === 'rdf'),
    legend: { x: 1, y: 1, xanchor: 'right' }
  }

  Plotly.newPlot(plotlyChart.value, traces, layout, { responsive: true })
}

// Three.js 相关变量 - 完整移植自 3Dmol.html (精细溶剂化结构)
let scene = null
let camera = null
let renderer = null
let labelRenderer = null
let controls = null
let composer = null
let stars = null
let ring = null
let particles = null
let animationId = null
let resizeHandler = null
let clickHandler = null

// 初始化Three.js场景 - 完整的Li+溶剂化壳层 (2 EC + 2 DMC + PF6-)，带泛光特效
const initThreeJS = () => {
  if (!molViewer.value) return

  // 获取容器尺寸
  const container = molViewer.value
  const width = container.clientWidth
  const height = container.clientHeight

  // --- 初始化场景、相机、渲染器 ---
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#020510') // 深色背景突出分子
  scene.fog = new THREE.FogExp2('#020510', 0.008)

  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000)
  camera.position.set(10, 6, 16)
  camera.lookAt(0, 1.5, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.7 // 调暗曝光
  renderer.outputEncoding = THREE.sRGBEncoding
  container.appendChild(renderer.domElement)

  // CSS2渲染器用于文字标签 (始终面向屏幕)
  labelRenderer = new CSS2DRenderer()
  labelRenderer.setSize(width, height)
  labelRenderer.domElement.style.position = 'absolute'
  labelRenderer.domElement.style.top = '0px'
  labelRenderer.domElement.style.left = '0px'
  labelRenderer.domElement.style.pointerEvents = 'none'
  container.appendChild(labelRenderer.domElement)

  // --- 后期特效: 泛光 (Bloom) ---
  const renderScene = new RenderPass(scene, camera)
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85)
  bloomPass.threshold = 0.2
  bloomPass.strength = 0.3 // 调暗泛光强度
  bloomPass.radius = 0.8
  composer = new EffectComposer(renderer)
  composer.addPass(renderScene)
  composer.addPass(bloomPass)

  // --- 轨道控制器 (带自动旋转) ---
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.autoRotate = true
  controls.autoRotateSpeed = 1.2
  controls.enableZoom = true
  controls.enablePan = true
  controls.target.set(0, 1.8, 0)
  controls.maxPolarAngle = Math.PI / 1.9
  controls.minDistance = 6
  controls.maxDistance = 24

  // --- 灯光系统 (调暗) ---
  // 1. 环境光
  scene.add(new THREE.AmbientLight(0x404c66, 0.3))
  // 2. 主平行光 (产生阴影)
  const dirLight = new THREE.DirectionalLight(0xfff0e0, 0.9)
  dirLight.position.set(6, 14, 8)
  dirLight.castShadow = true
  dirLight.receiveShadow = true
  dirLight.shadow.mapSize.width = 2048
  dirLight.shadow.mapSize.height = 2048
  const d = 14
  dirLight.shadow.camera.left = -d
  dirLight.shadow.camera.right = d
  dirLight.shadow.camera.top = d
  dirLight.shadow.camera.bottom = -d
  dirLight.shadow.camera.near = 2
  dirLight.shadow.camera.far = 35
  dirLight.shadow.bias = -0.0004
  scene.add(dirLight)

  // 3. 辅助彩色光源 (调暗)
  const backLight1 = new THREE.PointLight(0x4466cc, 0.6)
  backLight1.position.set(-5, 4, -8)
  scene.add(backLight1)
  const backLight2 = new THREE.PointLight(0x66aaff, 0.5)
  backLight2.position.set(7, 3, -9)
  scene.add(backLight2)
  const fillLight1 = new THREE.PointLight(0xffaa66, 0.4)
  fillLight1.position.set(-4, 5, 10)
  scene.add(fillLight1)
  const fillLight2 = new THREE.PointLight(0x99ccff, 0.35)
  fillLight2.position.set(9, 4, 6)
  scene.add(fillLight2)
  const bottomLight = new THREE.PointLight(0x5577aa, 0.3)
  bottomLight.position.set(0, -1, 5)
  scene.add(bottomLight)

  // 添加可见光晕小球体 (装饰)
  function addLightSphere(color, pos, intensity = 0.2) {
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshBasicMaterial({ color }))
    sphere.position.set(pos[0], pos[1], pos[2])
    scene.add(sphere)
  }
  addLightSphere(0x88aaff, [-5, 4, -8])
  addLightSphere(0xaaccff, [7, 3, -9])

  // --- 背景: 动态星空粒子 + 科技网格环 ---
  const starsGeo = new THREE.BufferGeometry()
  const starsCount = 3000
  const starPos = new Float32Array(starsCount * 3)
  for (let i = 0; i < starsCount * 3; i += 3) {
    const r = 45 + Math.random() * 50
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos((Math.random() * 2) - 1)
    starPos[i] = Math.sin(phi) * Math.cos(theta) * r
    starPos[i + 1] = Math.sin(phi) * Math.sin(theta) * r
    starPos[i + 2] = Math.cos(phi) * r
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const starsMat = new THREE.PointsMaterial({ color: 0xb0caff, size: 0.12, transparent: true, blending: THREE.AdditiveBlending })
  stars = new THREE.Points(starsGeo, starsMat)
  scene.add(stars)

  // 动态旋转光环
  const ringGeometry = new THREE.TorusGeometry(5.2, 0.03, 32, 200)
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x3a7bd5, emissive: new THREE.Color(0x1a4c9c), emissiveIntensity: 0.8, transparent: true, opacity: 0.35 })
  ring = new THREE.Mesh(ringGeometry, ringMaterial)
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.5
  ring.receiveShadow = false
  scene.add(ring)

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(4.0, 0.02, 16, 120), new THREE.MeshStandardMaterial({ color: 0x7aaaff, emissive: new THREE.Color(0x2266cc), emissiveIntensity: 0.5, transparent: true, opacity: 0.25 }))
  ring2.rotation.x = Math.PI / 2
  ring2.rotation.z = 0.3
  ring2.position.y = 0.6
  scene.add(ring2)

  // 地面展示台 (半透明玻璃)
  const basePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(6.5, 6.5, 0.3, 64),
    new THREE.MeshStandardMaterial({ color: 0x0e1a2b, roughness: 0.25, metalness: 0.5, transparent: true, opacity: 0.7, emissive: new THREE.Color(0x112233), emissiveIntensity: 0.4 })
  )
  basePlate.position.y = -0.2
  basePlate.receiveShadow = true
  basePlate.castShadow = false
  scene.add(basePlate)

  const glowDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(5.0, 5.0, 0.05, 64),
    new THREE.MeshStandardMaterial({ color: 0x2a4a7a, emissive: new THREE.Color(0x1a3a6a), emissiveIntensity: 0.7, transparent: true, opacity: 0.5 })
  )
  glowDisc.position.y = 0.05
  glowDisc.receiveShadow = false
  scene.add(glowDisc)

  // --- 工具函数: 创建原子 (高光金属感) ---
  function createAtom(color, radius, pos, metalness = 0.2, roughness = 0.25, emissive = false) {
    const geometry = new THREE.SphereGeometry(radius, 64, 32)
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: metalness,
      emissive: emissive ? color : 0x000000,
      emissiveIntensity: 0.15,
      envMapIntensity: 1.5
    })
    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.set(pos[0], pos[1], pos[2])
    sphere.castShadow = true
    sphere.receiveShadow = true
    return sphere
  }

  function createBond(posFrom, posTo, color = 0xcccccc, radius = 0.07) {
    const from = new THREE.Vector3(...posFrom)
    const to = new THREE.Vector3(...posTo)
    const direction = new THREE.Vector3().subVectors(to, from)
    const length = direction.length()
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 8)
    const material = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1 })
    const cylinder = new THREE.Mesh(geometry, material)
    cylinder.castShadow = true
    cylinder.receiveShadow = true
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5)
    cylinder.position.copy(mid)
    cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
    return cylinder
  }

  function createLabel(text, position, fontSize = '20px', color = '#e0f0ff', bg = 'rgba(10,25,45,0.75)') {
    const div = document.createElement('div')
    div.textContent = text
    div.style.color = color
    div.style.fontSize = fontSize
    div.style.fontWeight = '500'
    div.style.textShadow = '0 2px 15px #000000'
    div.style.padding = '8px 22px'
    div.style.borderRadius = '40px'
    div.style.background = bg
    div.style.backdropFilter = 'blur(10px)'
    div.style.border = '1px solid #3a7bd5'
    div.style.pointerEvents = 'none'
    div.style.letterSpacing = '2px'
    div.style.whiteSpace = 'nowrap'
    const label = new CSS2DObject(div)
    label.position.set(position[0], position[1], position[2])
    return label
  }

  // --- 构建复杂的溶剂化簇: 中心 Li+，周围 2 EC + 2 DMC，以及一个 PF6- 阴离子 ---
  const moleculeGroup = new THREE.Group()

  // 为了方便调整，所有坐标相对于组中心 (0,0,0) 附近，Li+ 位于 (0, 1.8, 0)
  const liPos = [0.0, 1.8, 0.0]
  moleculeGroup.add(createAtom(0xb07cc9, 0.58, liPos, 0.3, 0.25, true)) // 锂离子稍大且发光

  // 标签: Li⁺
  moleculeGroup.add(createLabel('Li⁺', [liPos[0], liPos[1] + 1.2, liPos[2]], '22px', '#e0b0ff', 'rgba(40,20,50,0.8)'))

  // ---------- 分子1: EC (碳酸乙烯酯) 位于 Li 左侧前方 ----------
  const ec1Atoms = [
    { color: 0x808080, radius: 0.45, pos: [-1.8, 2.1, 1.5] }, // C羰基
    { color: 0xff3333, radius: 0.48, pos: [-2.0, 2.5, 2.6] }, // O=
    { color: 0xff3333, radius: 0.48, pos: [-0.8, 1.5, 2.0] }, // O醚
    { color: 0x808080, radius: 0.45, pos: [-0.5, 2.4, 0.9] }, // C环
    { color: 0x808080, radius: 0.45, pos: [-2.3, 2.9, 0.7] }, // C环
    { color: 0xff3333, radius: 0.48, pos: [-2.8, 2.1, 1.4] }, // O醚
    { color: 0xeeeeee, radius: 0.28, pos: [-0.2, 2.8, 1.5] },
    { color: 0xeeeeee, radius: 0.28, pos: [-1.0, 2.9, -0.2] },
    { color: 0xeeeeee, radius: 0.28, pos: [-3.0, 3.2, 0.1] },
    { color: 0xeeeeee, radius: 0.28, pos: [-2.7, 3.5, 1.5] },
  ]
  const ec1Bonds = [
    [0, 1], [0, 2], [0, 5], [2, 3], [3, 4], [4, 5], [3, 6], [3, 7], [4, 8], [4, 9]
  ]
  ec1Atoms.forEach(a => moleculeGroup.add(createAtom(a.color, a.radius, a.pos, 0.15, 0.35)))
  ec1Bonds.forEach(b => moleculeGroup.add(createBond(ec1Atoms[b[0]].pos, ec1Atoms[b[1]].pos, 0xaaaaaa, 0.065)))
  moleculeGroup.add(createLabel('EC (1)', [-1.8, 3.7, 1.8], '18px', '#b8d0ff'))

  // ---------- 分子2: EC 位于右侧后方 ----------
  const ec2Atoms = [
    { color: 0x808080, radius: 0.45, pos: [2.2, 2.0, -1.0] },
    { color: 0xff3333, radius: 0.48, pos: [2.5, 2.5, -2.0] },
    { color: 0xff3333, radius: 0.48, pos: [1.4, 1.2, -1.5] },
    { color: 0x808080, radius: 0.45, pos: [1.8, 1.8, 0.5] },
    { color: 0x808080, radius: 0.45, pos: [3.2, 2.0, 0.8] },
    { color: 0xff3333, radius: 0.48, pos: [3.0, 1.2, -0.5] },
    { color: 0xeeeeee, radius: 0.28, pos: [1.3, 2.5, 1.0] },
    { color: 0xeeeeee, radius: 0.28, pos: [2.5, 1.0, 1.2] },
    { color: 0xeeeeee, radius: 0.28, pos: [4.0, 2.5, 1.0] },
    { color: 0xeeeeee, radius: 0.28, pos: [3.0, 0.8, -1.5] },
  ]
  const ec2Bonds = [[0, 1], [0, 2], [0, 5], [2, 3], [3, 4], [4, 5], [3, 6], [3, 7], [4, 8], [4, 9]]
  ec2Atoms.forEach(a => moleculeGroup.add(createAtom(a.color, a.radius, a.pos, 0.15, 0.35)))
  ec2Bonds.forEach(b => moleculeGroup.add(createBond(ec2Atoms[b[0]].pos, ec2Atoms[b[1]].pos, 0xaaaaaa, 0.065)))
  moleculeGroup.add(createLabel('EC (2)', [2.8, 3.5, -0.5], '18px', '#b8d0ff'))

  // ---------- 分子3: DMC 位于左后方 ----------
  const dmc1Atoms = [
    { color: 0x808080, radius: 0.45, pos: [-2.0, 1.2, -2.0] }, // 羰基C
    { color: 0xff3333, radius: 0.48, pos: [-1.8, 1.5, -3.2] }, // O=
    { color: 0xff3333, radius: 0.48, pos: [-3.2, 0.8, -1.5] }, // O-左
    { color: 0xff3333, radius: 0.48, pos: [-0.8, 0.8, -1.8] }, // O-右
    { color: 0x808080, radius: 0.45, pos: [-4.0, 1.5, -1.0] }, // 甲基C
    { color: 0x808080, radius: 0.45, pos: [0.0, 1.2, -1.2] }, // 甲基C
    { color: 0xeeeeee, radius: 0.28, pos: [-4.5, 2.2, -0.2] },
    { color: 0xeeeeee, radius: 0.28, pos: [-4.8, 0.8, -1.8] },
    { color: 0xeeeeee, radius: 0.28, pos: [-3.8, 2.2, -2.0] },
    { color: 0xeeeeee, radius: 0.28, pos: [0.6, 1.8, -0.4] },
    { color: 0xeeeeee, radius: 0.28, pos: [0.6, 0.5, -1.8] },
    { color: 0xeeeeee, radius: 0.28, pos: [-0.4, 1.8, -2.2] },
  ]
  const dmc1Bonds = [[0, 1], [0, 2], [0, 3], [2, 4], [3, 5], [4, 6], [4, 7], [4, 8], [5, 9], [5, 10], [5, 11]]
  dmc1Atoms.forEach(a => moleculeGroup.add(createAtom(a.color, a.radius, a.pos, 0.15, 0.35)))
  dmc1Bonds.forEach(b => moleculeGroup.add(createBond(dmc1Atoms[b[0]].pos, dmc1Atoms[b[1]].pos, 0xbbbbbb, 0.06)))
  moleculeGroup.add(createLabel('DMC (1)', [-2.5, 2.8, -2.2], '18px', '#c0d8ff'))

  // ---------- 分子4: DMC 位于右侧前方 ----------
  const dmc2Atoms = [
    { color: 0x808080, radius: 0.45, pos: [2.5, 2.5, 2.2] },
    { color: 0xff3333, radius: 0.48, pos: [2.8, 3.2, 3.0] },
    { color: 0xff3333, radius: 0.48, pos: [3.5, 1.8, 1.5] },
    { color: 0xff3333, radius: 0.48, pos: [1.2, 2.0, 2.5] },
    { color: 0x808080, radius: 0.45, pos: [4.5, 2.5, 1.0] },
    { color: 0x808080, radius: 0.45, pos: [0.5, 2.8, 1.8] },
    { color: 0xeeeeee, radius: 0.28, pos: [5.2, 2.0, 1.8] },
    { color: 0xeeeeee, radius: 0.28, pos: [5.0, 3.5, 0.8] },
    { color: 0xeeeeee, radius: 0.28, pos: [4.2, 1.8, 0.0] },
    { color: 0xeeeeee, radius: 0.28, pos: [0.0, 3.5, 2.5] },
    { color: 0xeeeeee, radius: 0.28, pos: [1.0, 3.5, 1.0] },
    { color: 0xeeeeee, radius: 0.28, pos: [-0.2, 2.0, 1.2] },
  ]
  const dmc2Bonds = [[0, 1], [0, 2], [0, 3], [2, 4], [3, 5], [4, 6], [4, 7], [4, 8], [5, 9], [5, 10], [5, 11]]
  dmc2Atoms.forEach(a => moleculeGroup.add(createAtom(a.color, a.radius, a.pos, 0.15, 0.35)))
  dmc2Bonds.forEach(b => moleculeGroup.add(createBond(dmc2Atoms[b[0]].pos, dmc2Atoms[b[1]].pos, 0xbbbbbb, 0.06)))
  moleculeGroup.add(createLabel('DMC (2)', [3.0, 4.0, 2.5], '18px', '#c0d8ff'))

  // ---------- PF6- 阴离子 (稍远，位于上方偏后) ----------
  const pf6Pos = [0.5, 3.8, -2.8]
  const pfAtoms = [
    { color: 0xff9933, radius: 0.55, pos: pf6Pos }, // P
    { color: 0x90e050, radius: 0.42, pos: [pf6Pos[0] + 1.5, pf6Pos[1], pf6Pos[2]] },
    { color: 0x90e050, radius: 0.42, pos: [pf6Pos[0] - 1.5, pf6Pos[1], pf6Pos[2]] },
    { color: 0x90e050, radius: 0.42, pos: [pf6Pos[0], pf6Pos[1] + 1.5, pf6Pos[2]] },
    { color: 0x90e050, radius: 0.42, pos: [pf6Pos[0], pf6Pos[1] - 1.5, pf6Pos[2]] },
    { color: 0x90e050, radius: 0.42, pos: [pf6Pos[0], pf6Pos[1], pf6Pos[2] + 1.5] },
    { color: 0x90e050, radius: 0.42, pos: [pf6Pos[0], pf6Pos[1], pf6Pos[2] - 1.5] },
  ]
  pfAtoms.forEach(a => moleculeGroup.add(createAtom(a.color, a.radius, a.pos, 0.15, 0.3)))
  for (let i = 1; i <= 6; i++) moleculeGroup.add(createBond(pfAtoms[0].pos, pfAtoms[i].pos, 0xaaccaa, 0.08))
  moleculeGroup.add(createLabel('PF₆⁻', [pf6Pos[0], pf6Pos[1] + 2.2, pf6Pos[2]], '20px', '#b0ffb0', 'rgba(20,50,30,0.8)'))

  scene.add(moleculeGroup)

  // --- 添加动态粒子云 (模拟电子云/溶剂分子轨迹) ---
  const cloudParticles = new THREE.BufferGeometry()
  const particleCount = 800
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    const r = 3.8 + Math.random() * 5.5
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos((Math.random() * 2) - 1)
    positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r
    positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r + 1.8
    positions[i * 3 + 2] = Math.cos(phi) * r

    const col = new THREE.Color().setHSL(0.6 + Math.random() * 0.3, 0.8, 0.5)
    colors[i * 3] = col.r
    colors[i * 3 + 1] = col.g
    colors[i * 3 + 2] = col.b
  }
  cloudParticles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  cloudParticles.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const particleMat = new THREE.PointsMaterial({
    size: 0.08, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  })
  particles = new THREE.Points(cloudParticles, particleMat)
  scene.add(particles)

  // 额外光带/轨迹线
  const trajectoryPoints = []
  for (let i = 0; i <= 200; i++) {
    const t = i / 200 * Math.PI * 2
    trajectoryPoints.push(new THREE.Vector3(4.5 * Math.cos(t * 1.3), 1.5 + 1.2 * Math.sin(t * 2), 4.5 * Math.sin(t * 1.7)))
  }
  const trajectoryLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(trajectoryPoints),
    new THREE.LineBasicMaterial({ color: 0x3a7bd5 })
  )
  scene.add(trajectoryLine)

  // 添加几个连接配位键的虚线表示配位作用
  const ligandLines = [
    [liPos, [-1.8, 2.1, 1.5]], [liPos, [2.2, 2.0, -1.0]], [liPos, [-2.0, 1.2, -2.0]], [liPos, [2.5, 2.5, 2.2]]
  ]
  ligandLines.forEach(pair => {
    const points = [new THREE.Vector3(...pair[0]), new THREE.Vector3(...pair[1])]
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x88aaff, transparent: true, opacity: 0.25 }))
    scene.add(line)
  })

  // --- 窗口自适应 ---
  resizeHandler = () => {
    if (!container || !camera || !renderer || !labelRenderer || !composer) return
    const newWidth = container.clientWidth
    const newHeight = container.clientHeight
    camera.aspect = newWidth / newHeight
    camera.updateProjectionMatrix()
    renderer.setSize(newWidth, newHeight)
    composer.setSize(newWidth, newHeight)
    labelRenderer.setSize(newWidth, newHeight)
  }

  window.addEventListener('resize', resizeHandler, false)

  // 点击切换自动旋转
  clickHandler = () => {
    controls.autoRotate = !controls.autoRotate
  }
  renderer.domElement.addEventListener('click', clickHandler)

  // --- 动画和渲染循环 ---
  let clock = new THREE.Clock()

  function animate() {
    animationId = requestAnimationFrame(animate)
    const delta = clock.getDelta()
    const elapsedTime = performance.now() * 0.001

    controls.update()

    // 星星缓慢旋转
    if (stars) {
      stars.rotation.y += 0.0002
      stars.rotation.x += 0.0001
    }

    // 环旋转
    if (ring) {
      ring.rotation.z += 0.002
    }

    // 粒子云动态浮动
    if (particles) {
      particles.rotation.y += 0.001
      particles.rotation.x = Math.sin(elapsedTime * 0.1) * 0.1
    }

    // 轨迹线微弱动画
    if (trajectoryLine) {
      trajectoryLine.rotation.y += 0.002
    }

    // 使用composer渲染 (带泛光)
    composer.render()
    labelRenderer.render(scene, camera)
  }

  animate()
  console.log('✨ 完整Li⁺溶剂化壳层结构已加载 — 包含 Li⁺ · 2EC · 2DMC · PF₆⁻，带泛光特效')
}

// 清理Three.js资源
const cleanupThreeJS = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  // 移除事件监听器
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }

  if (renderer && clickHandler && renderer.domElement) {
    renderer.domElement.removeEventListener('click', clickHandler)
    clickHandler = null
  }

  // 遍历场景并释放所有资源
  if (scene) {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        if (object.geometry) {
          object.geometry.dispose()
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose())
          } else {
            object.material.dispose()
          }
        }
      }
    })
  }

  if (renderer && molViewer.value) {
    if (renderer.domElement && molViewer.value.contains(renderer.domElement)) {
      molViewer.value.removeChild(renderer.domElement)
    }
    renderer.dispose()
    renderer = null
  }
  if (labelRenderer && labelRenderer.domElement && molViewer.value && molViewer.value.contains(labelRenderer.domElement)) {
    molViewer.value.removeChild(labelRenderer.domElement)
    labelRenderer = null
  }

  scene = null
  camera = null
  controls = null
  stars = null
  composer = null
  ring = null
  particles = null
}

watch(currentChart, () => {
  renderPlotly()
})

onMounted(() => {
  nextTick(() => {
    renderPlotly()
    setTimeout(() => {
      initThreeJS()
    }, 300)
  })
})

onUnmounted(() => {
  cleanupThreeJS()
})
</script>

<style scoped>
.visualization-container {
  width: 100%;
}

/* 左侧结果表样式 */
.result-card {
  height: 860px;
  display: flex;
  flex-direction: column;
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

.result-table {
  padding: 10px 0;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  margin-bottom: 4px;
  background: #f8fafc;
  border-radius: 6px;
  transition: background 0.2s;
}

.result-row.indent-0 {
  padding-left: 0;
}

.result-row.indent-1 {
  padding-left: 20px;
}

.result-row.header-item {
  background: #e8f4ff;
  border-left: 4px solid #409EFF;
}

.result-row:hover {
  background: #e8f4ff;
}

.result-row.indent-2:hover {
  background: #dcf0ff;
}

.result-label {
  font-weight: 500;
  color: #606266;
  font-size: 14px;
}

.result-row.header-item .result-label {
  font-weight: 600;
  color: #409EFF;
  font-size: 15px;
}

.result-value {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.result-value.negative {
  color: #409EFF;
}

.result-unit {
  color: #909399;
  font-weight: normal;
  font-size: 13px;
  margin-left: 4px;
}

.summary-section {
  padding: 15px;
  background: #f0f9ff;
  border-radius: 8px;
  margin-top: 10px;
}

.summary-section h4 {
  margin: 0 0 12px 0;
  color: #409EFF;
  font-size: 14px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item span:first-child {
  color: #606266;
}

/* 右侧样式 */
.chart-card {
  display: flex;
  flex-direction: column;
}

.chart-area {
  width: 100%;
  height: 280px;
}

.mol-card {
  display: flex;
  flex-direction: column;
}

.mol-area {
  width: 100%;
  min-height: 440px;
  height: 440px;
  position: relative;
  border-radius: 6px;
  overflow: visible;
  border: 1px solid #EBEEF5;
  background: #f8fafc;
  display: block;
}

/* 响应式调整 */
@media (max-width: 1600px) {
  .mol-area {
    height: 340px;
  }
  .result-card {
    height: 680px;
  }
}
</style>
