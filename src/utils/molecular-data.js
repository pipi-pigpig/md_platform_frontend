/**
 * 电解液分子动力学模拟 - 分子数据结构
 *
 * 包含原子类型定义、电解液分子模板、化学反应配置
 */

// ============================================
// 原子类型定义 (CPK 配色标准 + 电解液专用配色)
// ============================================

export const ATOM_TYPES = {
  // 基本元素 - 增大半径以便更好可视化
  Li: { symbol: 'Li', name: '锂', color: '#b07cc9', radius: 16, mass: 6.941 },
  C:  { symbol: 'C',  name: '碳', color: '#707070', radius: 14, mass: 12.011 },
  H:  { symbol: 'H',  name: '氢', color: '#e8e8e8', radius: 10, mass: 1.008 },
  O:  { symbol: 'O',  name: '氧', color: '#ff4444', radius: 15, mass: 15.999 },
  F:  { symbol: 'F',  name: '氟', color: '#88dd55', radius: 13, mass: 18.998 },
  P:  { symbol: 'P',  name: '磷', color: '#ff8833', radius: 17, mass: 30.974 },
  B:  { symbol: 'B',  name: '硼', color: '#ffbb00', radius: 15, mass: 10.811 },
  N:  { symbol: 'N',  name: '氮', color: '#4488ff', radius: 14, mass: 14.007 },
  S:  { symbol: 'S',  name: '硫', color: '#ffee33', radius: 17, mass: 32.065 }
}

// 离子特殊颜色（更亮，带发光效果）
export const ION_COLORS = {
  Li_plus:   '#d066d0',  // Li+ 更亮的紫色
  PF6_minus: '#70c040',  // PF6- 绿色调
  BF4_minus: '#e0b030',  // BF4- 金色调
  TFSI_minus:'#60a0e0'   // TFSI- 蓝色调
}

// ============================================
// 电解液分子模板定义
// ============================================

export const MOLECULE_TEMPLATES = {
  // ========== 溶剂分子 ==========

  EC: {
    id: 'EC',
    name: '碳酸乙烯酯',
    formula: 'C₃H₄O₃',
    formulaPlain: 'C3H4O3',
    category: 'solvent',
    description: '高介电常数溶剂，利于锂盐解离',
    mass: 88.06,
    // 原子定义: [元素, x偏移, y偏移]
    atoms: [
      // 羰基碳 (中心)
      { element: 'C', offset: [0, 0] },
      // 羰基氧 (双键氧，上方)
      { element: 'O', offset: [0, 24] },
      // 醚氧1 (右侧)
      { element: 'O', offset: [22, -12] },
      // 醚氧2 (左侧)
      { element: 'O', offset: [-22, -12] },
      // 环碳1 (右下)
      { element: 'C', offset: [28, -36] },
      // 环碳2 (左下)
      { element: 'C', offset: [-28, -36] },
      // 氢原子
      { element: 'H', offset: [40, -40] },
      { element: 'H', offset: [40, -32] },
      { element: 'H', offset: [-40, -40] },
      { element: 'H', offset: [-40, -32] }
    ],
    // 化学键: [原子索引1, 原子索引2, 键级]
    bonds: [
      [0, 1, 2],  // C=O 双键
      [0, 2, 1],  // C-O 单键
      [0, 3, 1],  // C-O 单键
      [2, 4, 1],  // O-C 单键
      [3, 5, 1],  // O-C 单键
      [4, 5, 1],  // C-C 单键 (闭环)
      [4, 6, 1],  // C-H
      [4, 7, 1],  // C-H
      [5, 8, 1],  // C-H
      [5, 9, 1]   // C-H
    ]
  },

  DMC: {
    id: 'DMC',
    name: '碳酸二甲酯',
    formula: 'C₃H₆O₃',
    formulaPlain: 'C3H6O3',
    category: 'solvent',
    description: '低粘度溶剂，利于离子迁移',
    mass: 90.08,
    atoms: [
      // 羰基碳 (中心)
      { element: 'C', offset: [0, 0] },
      // 羰基氧 (上方)
      { element: 'O', offset: [0, 24] },
      // 醚氧1 (右侧)
      { element: 'O', offset: [24, -12] },
      // 醚氧2 (左侧)
      { element: 'O', offset: [-24, -12] },
      // 甲基碳1 (右侧)
      { element: 'C', offset: [44, -16] },
      // 甲基碳2 (左侧)
      { element: 'C', offset: [-44, -16] },
      // 氢原子 (甲基1)
      { element: 'H', offset: [56, -6] },
      { element: 'H', offset: [56, -26] },
      { element: 'H', offset: [50, -36] },
      // 氢原子 (甲基2)
      { element: 'H', offset: [-56, -6] },
      { element: 'H', offset: [-56, -26] },
      { element: 'H', offset: [-50, -36] }
    ],
    bonds: [
      [0, 1, 2],  // C=O
      [0, 2, 1],  // C-O
      [0, 3, 1],  // C-O
      [2, 4, 1],  // O-CH3
      [3, 5, 1],  // O-CH3
      [4, 6, 1], [4, 7, 1], [4, 8, 1],  // 甲基氢
      [5, 9, 1], [5, 10, 1], [5, 11, 1] // 甲基氢
    ]
  },

  EMC: {
    id: 'EMC',
    name: '碳酸甲乙酯',
    formula: 'C₄H₈O₃',
    formulaPlain: 'C4H8O3',
    category: 'solvent',
    description: '混合溶剂，兼顾介电常数与粘度',
    mass: 104.11,
    atoms: [
      // 羰基碳
      { element: 'C', offset: [0, 0] },
      // 羰基氧
      { element: 'O', offset: [0, 24] },
      // 醚氧1 (甲基侧)
      { element: 'O', offset: [24, -12] },
      // 醚氧2 (乙基侧)
      { element: 'O', offset: [-24, -12] },
      // 甲基碳
      { element: 'C', offset: [44, -16] },
      // 亚甲基碳
      { element: 'C', offset: [-44, -16] },
      // 乙基端碳
      { element: 'C', offset: [-70, -30] },
      // 甲基氢
      { element: 'H', offset: [56, -6] },
      { element: 'H', offset: [56, -26] },
      { element: 'H', offset: [50, -36] },
      // 亚甲基氢
      { element: 'H', offset: [-40, -32] },
      { element: 'H', offset: [-48, -2] },
      // 乙基端氢
      { element: 'H', offset: [-84, -20] },
      { element: 'H', offset: [-84, -40] },
      { element: 'H', offset: [-76, -50] }
    ],
    bonds: [
      [0, 1, 2],  // C=O
      [0, 2, 1],  // C-O (甲基)
      [0, 3, 1],  // C-O (乙基)
      [2, 4, 1],  // O-CH3
      [3, 5, 1],  // O-CH2
      [5, 6, 1],  // CH2-CH3
      [4, 7, 1], [4, 8, 1], [4, 9, 1],
      [5, 10, 1], [5, 11, 1],
      [6, 12, 1], [6, 13, 1], [6, 14, 1]
    ]
  },

  DEC: {
    id: 'DEC',
    name: '碳酸二乙酯',
    formula: 'C₅H₁₀O₃',
    formulaPlain: 'C5H10O3',
    category: 'solvent',
    description: '低熔点溶剂，低温性能好',
    mass: 118.13,
    atoms: [
      // 羰基碳
      { element: 'C', offset: [0, 0] },
      // 羰基氧
      { element: 'O', offset: [0, 24] },
      // 醚氧1
      { element: 'O', offset: [24, -12] },
      // 醚氧2
      { element: 'O', offset: [-24, -12] },
      // 亚甲基碳1
      { element: 'C', offset: [40, -16] },
      // 亚甲基碳2
      { element: 'C', offset: [-40, -16] },
      // 乙基端碳1
      { element: 'C', offset: [66, -30] },
      // 乙基端碳2
      { element: 'C', offset: [-66, -30] },
      // 亚甲基氢1
      { element: 'H', offset: [36, -32] },
      { element: 'H', offset: [44, -2] },
      // 亚甲基氢2
      { element: 'H', offset: [-36, -32] },
      { element: 'H', offset: [-44, -2] },
      // 乙基端氢1
      { element: 'H', offset: [80, -20] },
      { element: 'H', offset: [80, -40] },
      { element: 'H', offset: [72, -50] },
      // 乙基端氢2
      { element: 'H', offset: [-80, -20] },
      { element: 'H', offset: [-80, -40] },
      { element: 'H', offset: [-72, -50] }
    ],
    bonds: [
      [0, 1, 2],  // C=O
      [0, 2, 1], [0, 3, 1],
      [2, 4, 1], [3, 5, 1],
      [4, 6, 1], [5, 7, 1],
      [4, 8, 1], [4, 9, 1],
      [5, 10, 1], [5, 11, 1],
      [6, 12, 1], [6, 13, 1], [6, 14, 1],
      [7, 15, 1], [7, 16, 1], [7, 17, 1]
    ]
  },

  PC: {
    id: 'PC',
    name: '碳酸丙烯酯',
    formula: 'C₄H₆O₃',
    formulaPlain: 'C4H6O3',
    category: 'solvent',
    description: '高沸点溶剂，热稳定性好',
    mass: 102.09,
    atoms: [
      // 羰基碳
      { element: 'C', offset: [0, 0] },
      // 羰基氧
      { element: 'O', offset: [0, 24] },
      // 醚氧1
      { element: 'O', offset: [22, -12] },
      // 醚氧2
      { element: 'O', offset: [-22, -12] },
      // 环碳1
      { element: 'C', offset: [28, -36] },
      // 环碳2
      { element: 'C', offset: [-28, -36] },
      // 甲基碳
      { element: 'C', offset: [0, -50] },
      // 氢原子
      { element: 'H', offset: [40, -40] },
      { element: 'H', offset: [40, -32] },
      { element: 'H', offset: [-40, -40] },
      { element: 'H', offset: [-40, -32] },
      { element: 'H', offset: [10, -64] },
      { element: 'H', offset: [-10, -64] },
      { element: 'H', offset: [0, -56] }
    ],
    bonds: [
      [0, 1, 2],  // C=O
      [0, 2, 1], [0, 3, 1],
      [2, 4, 1], [3, 5, 1],
      [4, 5, 1], [4, 6, 1], [5, 6, 1],
      [4, 7, 1], [4, 8, 1],
      [5, 9, 1], [5, 10, 1],
      [6, 11, 1], [6, 12, 1], [6, 13, 1]
    ]
  },

  // ========== 离子 ==========

  Li_plus: {
    id: 'Li_plus',
    name: '锂离子',
    formula: 'Li⁺',
    formulaPlain: 'Li+',
    category: 'cation',
    charge: 1,
    description: '电解液中最重要的阳离子',
    mass: 6.941,
    atoms: [
      { element: 'Li', offset: [0, 0], isIon: true, charge: 1 }
    ],
    bonds: [],
    // 离子特殊渲染配置
    ionConfig: {
      glowColor: ION_COLORS.Li_plus,
      glowIntensity: 0.8,
      showChargeLabel: true,
      solvationShellRadius: 40,  // 第一溶剂化壳层
      solvationShellOpacity: 0.2
    }
  },

  PF6_minus: {
    id: 'PF6_minus',
    name: '六氟磷酸根',
    formula: 'PF₆⁻',
    formulaPlain: 'PF6-',
    category: 'anion',
    charge: -1,
    description: '最常用的锂盐阴离子',
    mass: 144.96,
    atoms: [
      // 中心磷
      { element: 'P', offset: [0, 0] },
      // 6个氟 (八面体结构，简化为平面展示)
      { element: 'F', offset: [30, 0] },
      { element: 'F', offset: [-30, 0] },
      { element: 'F', offset: [0, 30] },
      { element: 'F', offset: [0, -30] },
      { element: 'F', offset: [21, 21] },
      { element: 'F', offset: [-21, -21] }
    ],
    bonds: [
      [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [0, 5, 1], [0, 6, 1]
    ],
    ionConfig: {
      glowColor: ION_COLORS.PF6_minus,
      glowIntensity: 0.6,
      showChargeLabel: true
    }
  },

  BF4_minus: {
    id: 'BF4_minus',
    name: '四氟硼酸根',
    formula: 'BF₄⁻',
    formulaPlain: 'BF4-',
    category: 'anion',
    charge: -1,
    description: '替代PF6-的阴离子，稳定性好',
    mass: 86.81,
    atoms: [
      // 中心硼
      { element: 'B', offset: [0, 0] },
      // 4个氟 (四面体结构，简化为平面)
      { element: 'F', offset: [26, 0] },
      { element: 'F', offset: [-26, 0] },
      { element: 'F', offset: [0, 26] },
      { element: 'F', offset: [0, -26] }
    ],
    bonds: [
      [0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]
    ],
    ionConfig: {
      glowColor: ION_COLORS.BF4_minus,
      glowIntensity: 0.5,
      showChargeLabel: true
    }
  },

  TFSI_minus: {
    id: 'TFSI_minus',
    name: '双三氟甲基磺酰亚胺根',
    formula: '(CF₃SO₂)₂N⁻',
    formulaPlain: 'TFSI-',
    category: 'anion',
    charge: -1,
    description: '大分子阴离子，离子液体常用',
    mass: 280.14,
    atoms: [
      // 中心氮
      { element: 'N', offset: [0, 0] },
      // 左侧磺酰基
      { element: 'S', offset: [-30, 16] },
      { element: 'O', offset: [-50, 0] },
      { element: 'O', offset: [-40, 36] },
      { element: 'C', offset: [-40, -6] },
      { element: 'F', offset: [-64, -16] },
      { element: 'F', offset: [-36, -26] },
      { element: 'F', offset: [-52, 12] },
      // 右侧磺酰基
      { element: 'S', offset: [30, 16] },
      { element: 'O', offset: [50, 0] },
      { element: 'O', offset: [40, 36] },
      { element: 'C', offset: [40, -6] },
      { element: 'F', offset: [64, -16] },
      { element: 'F', offset: [36, -26] },
      { element: 'F', offset: [52, 12] }
    ],
    bonds: [
      [0, 1, 1],  // N-S
      [1, 2, 2], [1, 3, 2],  // S=O
      [1, 4, 1],  // S-C
      [4, 5, 1], [4, 6, 1], [4, 7, 1],  // CF3
      [0, 8, 1],  // N-S
      [8, 9, 2], [8, 10, 2],  // S=O
      [8, 11, 1],  // S-C
      [11, 12, 1], [11, 13, 1], [11, 14, 1]  // CF3
    ],
    ionConfig: {
      glowColor: ION_COLORS.TFSI_minus,
      glowIntensity: 0.4,
      showChargeLabel: true
    }
  },

  // ========== 添加剂 ==========

  FEC: {
    id: 'FEC',
    name: '氟代碳酸乙烯酯',
    formula: 'C₃H₃FO₃',
    formulaPlain: 'C3H3FO3',
    category: 'additive',
    description: 'SEI膜形成添加剂',
    mass: 106.05,
    atoms: [
      // 羰基碳
      { element: 'C', offset: [0, 0] },
      // 羰基氧
      { element: 'O', offset: [0, 24] },
      // 醚氧1
      { element: 'O', offset: [22, -12] },
      // 醚氧2
      { element: 'O', offset: [-22, -12] },
      // 环碳1
      { element: 'C', offset: [28, -36] },
      // 环碳2 (含氟)
      { element: 'C', offset: [-28, -36] },
      // 氟原子
      { element: 'F', offset: [-20, -56] },
      // 氢原子
      { element: 'H', offset: [40, -40] },
      { element: 'H', offset: [40, -32] },
      { element: 'H', offset: [-44, -40] }
    ],
    bonds: [
      [0, 1, 2],  // C=O
      [0, 2, 1], [0, 3, 1],
      [2, 4, 1], [3, 5, 1],
      [4, 5, 1],  // 闭环
      [5, 6, 1],  // C-F
      [4, 7, 1], [4, 8, 1],
      [5, 9, 1]
    ]
  },

  VC: {
    id: 'VC',
    name: '碳酸亚乙烯酯',
    formula: 'C₃H₂O₃',
    formulaPlain: 'C3H2O3',
    category: 'additive',
    description: '成膜添加剂，提高循环寿命',
    mass: 86.05,
    atoms: [
      // 羰基碳
      { element: 'C', offset: [0, 0] },
      // 羰基氧
      { element: 'O', offset: [0, 24] },
      // 醚氧1
      { element: 'O', offset: [22, -12] },
      // 醚氧2
      { element: 'O', offset: [-22, -12] },
      // 环碳1 (双键)
      { element: 'C', offset: [28, -36] },
      // 环碳2 (双键)
      { element: 'C', offset: [-28, -36] },
      // 氢原子
      { element: 'H', offset: [40, -36] },
      { element: 'H', offset: [-40, -36] }
    ],
    bonds: [
      [0, 1, 2],  // C=O
      [0, 2, 1], [0, 3, 1],
      [2, 4, 2],  // C=C 双键 (乙烯基特征)
      [3, 5, 2],  // C=C 双键
      [4, 5, 1],  // 闭环
      [4, 6, 1], [5, 7, 1]
    ]
  }
}

// ============================================
// 化学反应定义
// ============================================

export const REACTIONS = [
  {
    id: 'lipf6_dissociation',
    name: 'LiPF₆ 解离',
    equation: 'LiPF₆ → Li⁺ + PF₆⁻',
    description: '锂盐在溶剂中解离形成自由离子',
    reactants: { Li_plus: 1, PF6_minus: 1 },
    products: { Li_plus: 1, PF6_minus: 1 },  // 解离后变为自由离子
    activationEnergy: 20,
    probability: 0.25,
    energyRelease: 0,  // 解离不释放能量
    isDissociation: true
  },

  {
    id: 'li_solvation',
    name: 'Li⁺ 溶剂化',
    equation: 'Li⁺ + nEC → [Li(EC)n]⁺',
    description: 'Li+ 与溶剂分子形成溶剂化壳层',
    reactants: { Li_plus: 1, EC: 4 },
    products: { Li_plus: 1 },  // 溶剂化后的 Li+
    activationEnergy: 10,
    probability: 0.3,
    energyRelease: -50,  // 放热
    isSolvation: true
  },

  {
    id: 'ion_pairing',
    name: '离子对缔合',
    equation: 'Li⁺ + PF₆⁻ → [LiPF₆]',
    description: '离子形成接触离子对',
    reactants: { Li_plus: 1, PF6_minus: 1 },
    products: {},  // 形成离子对（不单独显示）
    activationEnergy: 30,
    probability: 0.15,
    energyRelease: 40,
    isPairing: true
  },

  {
    id: 'ec_reduction',
    name: 'EC 还原',
    equation: 'EC + 2e⁻ → LEDC',
    description: 'EC 在负极表面还原形成 SEI 膜成分',
    reactants: { EC: 2 },
    products: {},  // SEI 膜成分
    activationEnergy: 80,
    probability: 0.08,
    energyRelease: 200,  // 大量放热
    isReduction: true
  },

  {
    id: 'fec_decomposition',
    name: 'FEC 分解',
    equation: 'FEC → LiF + VC',
    description: 'FEC 分解形成含氟 SEI 层',
    reactants: { FEC: 1, Li_plus: 1 },
    products: { VC: 1 },
    activationEnergy: 60,
    probability: 0.1,
    energyRelease: 100,
    isDecomposition: true
  }
]

// ============================================
// 溶剂化结构定义
// ============================================

export const SOLVATION_STRUCTURES = {
  Li_EC_4: {
    centerIon: 'Li_plus',
    coordinationNumber: 4,
    solvents: ['EC', 'EC', 'EC', 'EC'],
    shellRadius: 40
  },
  Li_EC_DMC_mixed: {
    centerIon: 'Li_plus',
    coordinationNumber: 4,
    solvents: ['EC', 'EC', 'DMC', 'DMC'],
    shellRadius: 45
  }
}

// ============================================
// 辅助函数
// ============================================

/**
 * 获取分子的边界框
 */
export function getMoleculeBoundingBox(template) {
  if (!template.atoms || template.atoms.length === 0) {
    return { minX: -20, maxX: 20, minY: -20, maxY: 20, width: 40, height: 40 }
  }

  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  template.atoms.forEach(atom => {
    const atomType = ATOM_TYPES[atom.element]
    const r = atomType ? atomType.radius : 8
    const x = atom.offset[0]
    const y = atom.offset[1]

    minX = Math.min(minX, x - r)
    maxX = Math.max(maxX, x + r)
    minY = Math.min(minY, y - r)
    maxY = Math.max(maxY, y + r)
  })

  return {
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * 根据温度计算分子热运动速度
 * 使用麦克斯韦-玻尔兹曼分布
 */
export function calculateThermalSpeed(mass, temperature = 300) {
  // 简化的速度计算: v ~ sqrt(T/m)
  // 实际: v_rms = sqrt(3kT/m)，这里用简化版本
  const kB = 1.380649e-23  // 玻尔兹曼常数
  const scaleFactor = 0.5  // 可视化缩放因子

  // 转换质量为 kg (原子质量单位)
  const massKg = mass * 1.66054e-27

  // 计算均方根速度
  const vrms = Math.sqrt(3 * kB * temperature / massKg)

  // 缩放到画布单位
  return vrms * scaleFactor * 1e9  // 转换为合适范围
}

/**
 * 获取随机分子类型
 */
export function getRandomMoleculeType() {
  const types = Object.keys(MOLECULE_TEMPLATES)
  // 加权分布：溶剂多，离子少
  const weights = {
    EC: 20, DMC: 18, EMC: 15, DEC: 12, PC: 10,
    Li_plus: 8, PF6_minus: 8, BF4_minus: 4, TFSI_minus: 2,
    FEC: 2, VC: 1
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)
  let random = Math.random() * totalWeight

  for (const [type, weight] of Object.entries(weights)) {
    random -= weight
    if (random <= 0) return type
  }

  return 'EC'
}

/**
 * 判断两个分子是否可能发生反应
 */
export function checkReactionPossible(type1, type2) {
  for (const reaction of REACTIONS) {
    const reactants = reaction.reactants

    // 检查是否匹配反应物
    const hasType1 = reactants[type1] && reactants[type1] > 0
    const hasType2 = reactants[type2] && reactants[type2] > 0

    if (hasType1 && hasType2) {
      return reaction
    }

    // 检查单分子反应
    if (reactants[type1] && reactants[type1] >= 2 && type1 === type2) {
      return reaction
    }
  }

  return null
}
