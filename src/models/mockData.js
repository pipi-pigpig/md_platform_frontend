/**
 * 前端 Mock 数据
 *
 * 仅用于前端开发测试，不涉及后端接口
 * 包含完整的模拟任务和电解液配方示例数据
 */

import { Simulation } from './Simulation.js'
import { ElectrolyteFormula } from './ElectrolyteFormula.js'

// ─── 完整的已完成模拟任务（所有字段均有值） ───

export const MOCK_COMPLETED_SIMULATION_RAW = {
  id: 1,
  jobName: '前端mock任务项',
  isMock: true,
  description: '这是一个用于前端开发测试的模拟任务项，包含了所有可能的字段内容，用于验证页面展示效果和数据格式化逻辑。该任务模拟了典型的锂离子电池电解液分子动力学计算流程，使用LAMMPS软件在GPU加速环境下完成。',
  status: 'COMPLETED',
  hardwareUsed: 'BOTH',
  progress: 100,
  systemId: 1,
  createdAt: '2026-05-20T09:30:00.000Z',
  updatedAt: '2026-05-20T14:45:30.000Z',
  startTime: '2026-05-20T09:35:12.000Z',
  endTime: '2026-05-20T14:45:28.000Z',
  executionTime: 18616,
  parameters: JSON.stringify({
    ensemble: 'NVT',
    temperature: 298.15,
    pressure: 1.0,
    timestep: 1.0,
    totalSteps: 500000,
    outputInterval: 1000,
    thermostat: 'Nose-Hoover',
    cutoffDistance: 12.0,
    longRangeSolver: 'PPPM',
    bondStyle: 'harmonic',
    angleStyle: 'harmonic',
    dihedralStyle: 'opls',
    improperStyle: 'harmonic',
    pairStyle: 'lj/cut/coul/long',
    kspaceStyle: 'pppm',
    kspaceAccuracy: 1e-5,
    neighborSkin: 2.0,
    neighborUpdateFrequency: 1
  }),
  resultSummary: JSON.stringify({
    totalEnergy: -52384.67,
    potentialEnergy: -54821.33,
    kineticEnergy: 2436.66,
    temperature: 298.23,
    pressure: 1.02,
    volume: 64000.0,
    density: 1.19,
    diffusionCoefficient: {
      cation: 2.34e-10,
      anion: 1.87e-10,
      solvent: 5.62e-10
    },
    ionicConductivity: 10.8,
    viscosity: 0.89,
    radialDistributionFunction: 'computed',
    meanSquareDisplacement: 'computed',
    coordinationNumber: {
      Li_O_ECDMC: 4.2,
      Li_PF6: 0.8
    }
  }),
  softwareName: 'LAMMPS',
  softwareVersion: '23Jun2022',
  cpuCores: 16,
  gpuInfo: 'NVIDIA RTX 4060 (8GB)',
  jobRootPath: '/data/simulations/job_001',
  randomSeed: 42,
  targetProperties: JSON.stringify([
    'ionic_conductivity',
    'diffusion_coefficient',
    'viscosity',
    'radial_distribution_function',
    'coordination_number'
  ]),
  userId: 1
}

// ─── 完整的电解液配方（所有字段均有值） ───

export const MOCK_ELECTROLYTE_FORMULA_RAW = {
  id: 1,
  name: 'EC/DMC-LiPF6 标准电解液',
  taskDescription: '商用锂离子电池标准电解液配方，EC:DMC=3:7摩尔比，1M LiPF6，添加5% FEC作为成膜添加剂',
  temperature: 298.15,
  pressure: 1.0,
  boundaryConditions: 'p p p',
  createdAt: '2026-05-18T10:00:00.000Z',
  updatedAt: '2026-05-19T16:30:00.000Z',
  solventInfo: JSON.stringify({
    solvents: [
      { name: 'EC', moleFraction: 0.3, mole_ratio: 3, molecule_count: 250 },
      { name: 'DMC', moleFraction: 0.7, mole_ratio: 7, molecule_count: 583 }
    ]
  }),
  saltInfo: JSON.stringify([
    { name: 'LiPF6', cation: 'Li+', anion: 'PF6-', concentration: 1.0, concentration_mol_L: 1.0, cation_id: 1, anion_id: 2 }
  ]),
  additiveInfo: JSON.stringify([
    { name: 'FEC', concentration: 0.05, mass_fraction: 0.05 }
  ]),
  boxSize: JSON.stringify({ x: 40.0, y: 40.0, z: 40.0 })
}

// ─── 其他状态的模拟任务 ───

export const MOCK_RUNNING_SIMULATION_RAW = {
  id: 2,
  jobName: 'LiFSI电解液扩散系数计算',
  description: '计算LiFSI基电解液中锂离子的扩散系数，使用NVT系综进行5ns平衡动力学模拟',
  status: 'RUNNING',
  hardwareUsed: 'GPU',
  progress: 67,
  systemId: 2,
  createdAt: '2026-05-25T08:00:00.000Z',
  updatedAt: '2026-05-27T10:30:00.000Z',
  startTime: '2026-05-25T08:05:00.000Z',
  endTime: null,
  executionTime: null,
  parameters: JSON.stringify({
    ensemble: 'NVT',
    temperature: 333.15,
    timestep: 1.0,
    totalSteps: 5000000,
    outputInterval: 5000,
    thermostat: 'Nose-Hoover'
  }),
  resultSummary: null,
  softwareName: 'LAMMPS',
  softwareVersion: '23Jun2022',
  cpuCores: 8,
  gpuInfo: 'NVIDIA RTX 4060 (8GB)',
  jobRootPath: '/data/simulations/job_002',
  randomSeed: 123,
  targetProperties: JSON.stringify(['diffusion_coefficient', 'ionic_conductivity']),
  userId: 1
}

export const MOCK_PENDING_SIMULATION_RAW = {
  id: 3,
  jobName: 'NaCl水溶液分子动力学模拟',
  description: '氯化钠水溶液的分子动力学模拟，研究离子水合结构和扩散行为',
  status: 'PENDING',
  hardwareUsed: 'CPU',
  progress: 0,
  systemId: 3,
  createdAt: '2026-05-27T11:00:00.000Z',
  updatedAt: '2026-05-27T11:00:00.000Z',
  startTime: null,
  endTime: null,
  executionTime: null,
  parameters: JSON.stringify({
    ensemble: 'NPT',
    temperature: 298.15,
    pressure: 1.0,
    timestep: 2.0,
    totalSteps: 1000000,
    thermostat: 'Nose-Hoover',
    barostat: 'Parrinello-Rahman'
  }),
  resultSummary: null,
  softwareName: 'GROMACS',
  softwareVersion: '2023.1',
  cpuCores: 32,
  gpuInfo: null,
  jobRootPath: '/data/simulations/job_003',
  randomSeed: 456,
  targetProperties: JSON.stringify(['diffusion_coefficient', 'radial_distribution_function']),
  userId: 1
}

export const MOCK_FAILED_SIMULATION_RAW = {
  id: 4,
  jobName: 'LiTFSI-EMC高温稳定性测试',
  description: 'LiTFSI在EMC溶剂中的高温稳定性模拟，模拟温度353K',
  status: 'FAILED',
  hardwareUsed: 'GPU',
  progress: 23,
  systemId: 4,
  createdAt: '2026-05-22T14:00:00.000Z',
  updatedAt: '2026-05-22T15:32:00.000Z',
  startTime: '2026-05-22T14:05:30.000Z',
  endTime: '2026-05-22T15:31:45.000Z',
  executionTime: 5175,
  parameters: JSON.stringify({
    ensemble: 'NVT',
    temperature: 353.15,
    timestep: 1.0,
    totalSteps: 2000000,
    outputInterval: 2000
  }),
  resultSummary: JSON.stringify({ error: 'Simulation became unstable: temperature exceeded 500K at step 460000. Possible causes: initial configuration too close, timestep too large, or force field parameters inappropriate for this temperature.' }),
  softwareName: 'LAMMPS',
  softwareVersion: '23Jun2022',
  cpuCores: 8,
  gpuInfo: 'NVIDIA RTX 4060 (8GB)',
  jobRootPath: '/data/simulations/job_004',
  randomSeed: 789,
  targetProperties: JSON.stringify(['stability_analysis', 'decomposition_products']),
  userId: 1
}

export const MOCK_CANCELLED_SIMULATION_RAW = {
  id: 5,
  jobName: 'EC/DEC混合溶剂配比优化',
  description: '不同EC/DEC配比对电解液性能影响的系统研究，共12组配比方案',
  status: 'CANCELLED',
  hardwareUsed: 'BOTH',
  progress: 5,
  systemId: 5,
  createdAt: '2026-05-23T09:00:00.000Z',
  updatedAt: '2026-05-23T09:30:00.000Z',
  startTime: '2026-05-23T09:05:00.000Z',
  endTime: '2026-05-23T09:28:00.000Z',
  executionTime: 1380,
  parameters: JSON.stringify({
    ensemble: 'NPT',
    temperature: 298.15,
    pressure: 1.0,
    timestep: 1.0,
    totalSteps: 3000000,
    ecRatios: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
  }),
  resultSummary: null,
  softwareName: 'LAMMPS',
  softwareVersion: '23Jun2022',
  cpuCores: 16,
  gpuInfo: 'NVIDIA RTX 4060 (8GB)',
  jobRootPath: '/data/simulations/job_005',
  randomSeed: 321,
  targetProperties: JSON.stringify(['ionic_conductivity', 'viscosity', 'density']),
  userId: 1
}

// ─── 其他配方 ───

export const MOCK_WATER_FORMULA_RAW = {
  id: 2,
  name: 'NaCl水溶液 (1M)',
  taskDescription: '1M氯化钠水溶液，用于研究离子水合结构',
  temperature: 298.15,
  pressure: 1.0,
  boundaryConditions: 'p p p',
  createdAt: '2026-05-19T10:00:00.000Z',
  updatedAt: '2026-05-19T10:00:00.000Z',
  solventInfo: JSON.stringify({
    solvents: [
      { name: 'WATER', moleFraction: 1.0, mole_ratio: 1, molecule_count: 8000 }
    ]
  }),
  saltInfo: JSON.stringify([
    { name: 'NaCl', cation: 'Na+', anion: 'Cl-', concentration: 1.0, concentration_mol_L: 1.0, cation_id: 5, anion_id: 6 }
  ]),
  additiveInfo: null,
  boxSize: JSON.stringify({ x: 48.0, y: 48.0, z: 48.0 })
}

export const MOCK_LIFSI_FORMULA_RAW = {
  id: 3,
  name: 'LiFSI/DME 电解液',
  taskDescription: 'LiFSI基电解液，用于固态电池界面研究',
  temperature: 333.15,
  pressure: 1.0,
  boundaryConditions: 'p p p',
  createdAt: '2026-05-20T08:00:00.000Z',
  updatedAt: '2026-05-21T14:00:00.000Z',
  solventInfo: JSON.stringify({
    solvents: [
      { name: 'DME', moleFraction: 1.0, mole_ratio: 1, molecule_count: 400 }
    ]
  }),
  saltInfo: JSON.stringify([
    { name: 'LiFSI', cation: 'Li+', anion: 'FSI-', concentration: 1.2, concentration_mol_L: 1.2, cation_id: 1, anion_id: 10 }
  ]),
  additiveInfo: JSON.stringify([
    { name: 'LiNO3', concentration: 0.1, mass_fraction: 0.02 }
  ]),
  boxSize: JSON.stringify({ x: 35.0, y: 35.0, z: 35.0 })
}

// ─── 工厂函数：获取包装好的实体实例 ───

/** 获取已完成的模拟任务实例（所有字段完整） */
export function getMockCompletedSimulation() {
  return new Simulation(MOCK_COMPLETED_SIMULATION_RAW)
}

/** 获取运行中的模拟任务实例 */
export function getMockRunningSimulation() {
  return new Simulation(MOCK_RUNNING_SIMULATION_RAW)
}

/** 获取等待中的模拟任务实例 */
export function getMockPendingSimulation() {
  return new Simulation(MOCK_PENDING_SIMULATION_RAW)
}

/** 获取失败的模拟任务实例 */
export function getMockFailedSimulation() {
  return new Simulation(MOCK_FAILED_SIMULATION_RAW)
}

/** 获取已取消的模拟任务实例 */
export function getMockCancelledSimulation() {
  return new Simulation(MOCK_CANCELLED_SIMULATION_RAW)
}

/** 获取所有状态模拟任务实例列表 */
export function getMockAllSimulations() {
  return [
    getMockCompletedSimulation(),
    getMockRunningSimulation(),
    getMockPendingSimulation(),
    getMockFailedSimulation(),
    getMockCancelledSimulation()
  ]
}

/** 获取模拟任务统计数据 */
export function getMockSimulationStats() {
  return {
    total: 5,
    pending: 1,
    running: 1,
    completed: 1,
    failed: 1,
    cancelled: 1
  }
}

/** 获取EC/DMC-LiPF6标准配方实例 */
export function getMockStandardFormula() {
  return new ElectrolyteFormula(MOCK_ELECTROLYTE_FORMULA_RAW)
}

/** 获取NaCl水溶液配方实例 */
export function getMockWaterFormula() {
  return new ElectrolyteFormula(MOCK_WATER_FORMULA_RAW)
}

/** 获取LiFSI/DME配方实例 */
export function getMockLifsiFormula() {
  return new ElectrolyteFormula(MOCK_LIFSI_FORMULA_RAW)
}

/** 获取所有配方实例列表 */
export function getMockAllFormulas() {
  return [
    getMockStandardFormula(),
    getMockWaterFormula(),
    getMockLifsiFormula()
  ]
}

/** 获取模拟任务的文件列表（mock） */
export function getMockSimulationFiles() {
  return [
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
}
