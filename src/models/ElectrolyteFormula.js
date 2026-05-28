/**
 * 电解液配方实体类
 *
 * 封装电解液配方的数据结构、解析和格式化
 * 构造时自动解析原始数据并计算格式化属性，直接通过实例访问即可
 *
 * 解决的问题：
 * - Simulations.vue 和 Systems.vue 中 formatSolventInfo/formatSaltInfo 重复
 * - Systems.vue editSystem() 和 SimulationForm.vue fillFormFromSystem() 中解析逻辑重复
 * - JSON 字符串/对象两种格式的兼容逻辑散落各处
 */

// 锂盐 → 离子映射
const SALT_IONS_MAP = {
  'LiPF6': { cation: 'Li+', anion: 'PF6-' },
  'LiFSI': { cation: 'Li+', anion: 'FSI-' },
  'LiTFSI': { cation: 'Li+', anion: 'TFSI-' },
  'LiBF4': { cation: 'Li+', anion: 'BF4-' },
  'NaCl': { cation: 'Na+', anion: 'Cl-' }
}

// ─── 私有解析函数 ───

function parseJsonField(field) {
  if (!field) return null
  if (typeof field === 'object') return field
  if (typeof field === 'string') {
    if (field.trim() === '' || field === 'null') return null
    try {
      return JSON.parse(field)
    } catch {
      return null
    }
  }
  return null
}

function parseSolvents(solventInfo) {
  const data = parseJsonField(solventInfo)
  if (!data) return []

  // 格式1: {"solvents": [{"name": "EC", "moleFraction": 0.3}]}
  if (data.solvents && Array.isArray(data.solvents)) {
    return data.solvents.map(s => ({
      name: s.name || '',
      moleFraction: s.moleFraction || 0,
      moleRatio: s.mole_ratio || 0,
      moleculeCount: s.molecule_count || 0
    }))
  }

  // 格式2: [{"name": "EC", "mole_ratio": 3, "molecule_count": 250}]
  if (Array.isArray(data)) {
    return data.map(s => ({
      name: s.name || '',
      moleFraction: s.moleFraction || 0,
      moleRatio: s.mole_ratio || 0,
      moleculeCount: s.molecule_count || 0
    }))
  }

  return []
}

function parseSalts(saltInfo) {
  const data = parseJsonField(saltInfo)
  if (!data || !Array.isArray(data)) return []

  return data.map(s => {
    const name = s.name || ''
    const ions = SALT_IONS_MAP[name]
    return {
      name,
      cation: s.cation || s.cation_id ? getCationName(s.cation_id) : (ions?.cation || ''),
      anion: s.anion || s.anion_id ? getAnionName(s.anion_id) : (ions?.anion || ''),
      concentration: s.concentration || s.concentration_mol_L || 1.0
    }
  })
}

function parseAdditives(additiveInfo) {
  const data = parseJsonField(additiveInfo)
  if (!data || !Array.isArray(data)) return []

  return data.map(a => ({
    name: a.name || '',
    concentration: a.concentration || a.mass_fraction || 0
  }))
}

function parseBoxSize(boxSize) {
  if (!boxSize) return { x: 40.0, y: 40.0, z: 40.0 }
  const data = parseJsonField(boxSize)
  if (!data) return { x: 40.0, y: 40.0, z: 40.0 }
  return {
    x: data.x || 40.0,
    y: data.y || 40.0,
    z: data.z || 40.0
  }
}

// ─── 私有格式化函数 ───

function formatSolventInfo(solvents) {
  if (!solvents || solvents.length === 0) return '-'

  const totalRatio = solvents.reduce((sum, s) => sum + (s.moleRatio || s.moleFraction || 0), 0)

  return solvents.map(s => {
    let fraction
    if (s.moleFraction) {
      fraction = (s.moleFraction * 100).toFixed(0)
    } else if (s.moleRatio && totalRatio > 0) {
      fraction = ((s.moleRatio / totalRatio) * 100).toFixed(0)
    } else {
      fraction = '?'
    }
    return `${s.name || '?'} ${fraction}%`
  }).join(' / ')
}

function formatSaltInfo(salts) {
  if (!salts || salts.length === 0) return '-'
  return salts.map(s => `${s.name || '?'} ${s.concentration || '?'}M`).join(', ')
}

function formatAdditiveInfo(additives) {
  if (!additives || additives.length === 0) return '无'
  return additives.map(a => {
    const conc = a.concentration || '?'
    return `${a.name || '?'} ${conc}${a.concentration ? 'M' : ''}`
  }).join(', ')
}

function formatBoxSize(boxSize) {
  if (!boxSize || (!boxSize.x && !boxSize.y && !boxSize.z)) return '-'
  return `${boxSize.x || '?'} × ${boxSize.y || '?'} × ${boxSize.z || '?'} Å`
}

// ─── 私有推导函数 ───

function deriveSolventType(solvents) {
  if (!solvents || solvents.length === 0) return 'EC_DMC'
  const names = solvents.map(s => s.name)

  if (names.includes('WATER') || names.includes('Water')) return 'WATER'
  if (names.includes('EC') && names.includes('DMC')) return 'EC_DMC'
  if (names.includes('EC') && names.includes('EMC')) return 'EC_EMC'
  if (names.includes('EC') && !names.includes('DMC') && !names.includes('EMC')) return 'EC'
  if (names.includes('DMC') && !names.includes('EC')) return 'DMC'
  return 'OTHER'
}

function deriveSaltType(salts) {
  if (!salts || salts.length === 0) return ''
  const name = salts[0].name || ''
  if (name.includes('LiPF6') || name.includes('LiPF')) return 'LiPF6'
  if (name.includes('LiFSI')) return 'LiFSI'
  if (name.includes('LiTFSI')) return 'LiTFSI'
  if (name.includes('LiBF4')) return 'LiBF4'
  if (name.includes('NaCl')) return 'NaCl'
  return ''
}

// ─── 私有辅助函数 ───

function getCationName(id) {
  const cations = { 1: 'Li+', 2: 'Li+', 5: 'Na+' }
  return cations[id] || 'Li+'
}

function getAnionName(id) {
  const anions = { 2: 'PF6-', 6: 'Cl-', 10: 'TFSI-' }
  return anions[id] || ''
}

function calcSolventRatios(solvents) {
  const totalRatio = solvents.reduce((sum, s) => sum + (s.moleRatio || s.moleFraction || 0), 0)
  const result = { ecRatio: 0, dmcRatio: 0 }

  if (totalRatio > 0) {
    const ec = solvents.find(s => s.name === 'EC')
    const dmc = solvents.find(s => s.name === 'DMC') || solvents.find(s => s.name === 'EMC')
    if (ec) result.ecRatio = Math.round((ec.moleRatio || ec.moleFraction || 0) / totalRatio * 100)
    if (dmc) result.dmcRatio = Math.round((dmc.moleRatio || dmc.moleFraction || 0) / totalRatio * 100)
  }

  return result
}

// ─── 实体类 ───

export class ElectrolyteFormula {
  constructor(data) {
    if (!data) return

    // 原始字段
    this.id = data.id
    this.name = data.name || ''
    this.taskDescription = data.taskDescription || ''
    this.temperature = data.temperature
    this.pressure = data.pressure
    this.boundaryConditions = data.boundaryConditions
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt

    // 解析后的结构化数据
    this.solvents = parseSolvents(data.solventInfo)
    this.salts = parseSalts(data.saltInfo)
    this.additives = parseAdditives(data.additiveInfo)
    this.boxSize = parseBoxSize(data.boxSize)

    // 构造时计算的格式化属性
    this.solventInfoDisplay = formatSolventInfo(this.solvents)
    this.saltInfoDisplay = formatSaltInfo(this.salts)
    this.additiveInfoDisplay = formatAdditiveInfo(this.additives)
    this.boxSizeDisplay = formatBoxSize(this.boxSize)

    // 构造时计算的派生属性
    this.solventType = deriveSolventType(this.solvents)
    this.saltType = deriveSaltType(this.salts)
  }

  /** 新建配方的默认表单数据 */
  static defaultFormData() {
    return {
      name: '',
      taskDescription: '',
      solventInfo: {
        solvents: [
          { name: 'EC', moleFraction: 0.3 },
          { name: 'DMC', moleFraction: 0.7 }
        ]
      },
      saltInfo: [{ name: 'LiPF6', cation: 'Li+', anion: 'PF6-', concentration: 1.0 }],
      additiveInfo: [],
      temperature: 298.15,
      pressure: 1.0,
      boxSize: { x: 40.0, y: 40.0, z: 40.0 },
      boundaryConditions: 'p p p'
    }
  }

  /** 验证溶剂摩尔分数之和是否为1 */
  static validateSolventSum(solvents) {
    if (!solvents || solvents.length === 0) return { valid: false, sum: 0 }
    const sum = solvents.reduce((total, s) => total + (s.moleFraction || 0), 0)
    return { valid: Math.abs(sum - 1.0) <= 0.001, sum }
  }

  /** 从实例计算溶剂的 EC/DMC 百分比（供 SimulationForm 使用） */
  getSolventRatios() {
    return calcSolventRatios(this.solvents)
  }
}
