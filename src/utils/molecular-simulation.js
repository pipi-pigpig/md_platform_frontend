/**
 * 电解液分子动力学模拟引擎
 *
 * 包含分子类、碰撞系统、反应引擎、渲染器和对象池
 * 支持3D立体旋转效果
 */

import {
  ATOM_TYPES,
  MOLECULE_TEMPLATES,
  REACTIONS,
  getMoleculeBoundingBox
} from './molecular-data.js'

// ============================================
// 3D 旋转工具
// ============================================

function rotateX(point, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: point.x,
    y: point.y * cos - point.z * sin,
    z: point.y * sin + point.z * cos
  }
}

function rotateY(point, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos
  }
}

function rotateZ(point, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
    z: point.z
  }
}

// 投影参数
const PERSPECTIVE = 800
const FOCAL_LENGTH = 400

function project(point3D) {
  const scale = FOCAL_LENGTH / (FOCAL_LENGTH + point3D.z)
  return {
    x: point3D.x * scale,
    y: point3D.y * scale,
    scale: scale,
    z: point3D.z
  }
}

// ============================================
// 分子类
// ============================================

export class Molecule {
  constructor(template, x, y, temperature = 300) {
    this.id = Math.random().toString(36).substr(2, 9)
    this.template = template
    this.type = template.id
    this.position = { x, y }

    // 3D 旋转角度
    this.rotation3D = {
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2
    }

    // 3D 旋转速度（各轴独立）- 降低速度
    this.angularVelocity3D = {
      x: (Math.random() - 0.5) * 0.4,
      y: (Math.random() - 0.5) * 0.35,
      z: (Math.random() - 0.5) * 0.3
    }

    // 根据温度和分子量计算初始速度
    const speed = this.calculateThermalSpeed(temperature)
    const angle = Math.random() * Math.PI * 2
    this.velocity = {
      x: speed * Math.cos(angle),
      y: speed * Math.sin(angle)
    }

    // 能量状态
    this.kineticEnergy = this.calculateKineticEnergy()
    this.totalEnergy = this.kineticEnergy

    // 碰撞状态
    this.isColliding = false
    this.collisionCooldown = 0

    // 可见性
    this.visible = true
    this.opacity = 1

    // 边界框缓存
    this._boundingBox = null
  }

  calculateThermalSpeed(temperature) {
    const baseSpeed = 100  // 增加移动速度
    const tempFactor = temperature / 300
    const massFactor = Math.sqrt(50 / this.template.mass)
    return baseSpeed * tempFactor * massFactor
  }

  calculateKineticEnergy() {
    const v2 = this.velocity.x ** 2 + this.velocity.y ** 2
    return 0.5 * this.template.mass * v2
  }

  getBoundingBox() {
    if (this._boundingBox) {
      return this._boundingBox
    }
    this._boundingBox = getMoleculeBoundingBox(this.template)
    return this._boundingBox
  }

  update(deltaTime, bounds) {
    // 更新位置
    this.position.x += this.velocity.x * deltaTime
    this.position.y += this.velocity.y * deltaTime

    // 更新 3D 旋转
    this.rotation3D.x += this.angularVelocity3D.x * deltaTime
    this.rotation3D.y += this.angularVelocity3D.y * deltaTime
    this.rotation3D.z += this.angularVelocity3D.z * deltaTime

    // 边界碰撞检测
    const box = this.getBoundingBox()
    const halfWidth = box.width / 2 * 1.8
    const halfHeight = box.height / 2 * 1.8

    if (this.position.x - halfWidth < 0) {
      this.position.x = halfWidth
      this.velocity.x = Math.abs(this.velocity.x)
    }
    if (this.position.x + halfWidth > bounds.width) {
      this.position.x = bounds.width - halfWidth
      this.velocity.x = -Math.abs(this.velocity.x)
    }
    if (this.position.y - halfHeight < 0) {
      this.position.y = halfHeight
      this.velocity.y = Math.abs(this.velocity.y)
    }
    if (this.position.y + halfHeight > bounds.height) {
      this.position.y = bounds.height - halfHeight
      this.velocity.y = -Math.abs(this.velocity.y)
    }

    // 更新能量
    this.kineticEnergy = this.calculateKineticEnergy()
    this.totalEnergy = this.kineticEnergy

    // 更新碰撞冷却
    if (this.collisionCooldown > 0) {
      this.collisionCooldown -= deltaTime
    }
  }

  // 获取原子的 3D 世界坐标（经过旋转和投影）
  getAtomWorldPositions3D() {
    const scale = 1.8  // 增大间距，让分子更舒展

    return this.template.atoms.map(atom => {
      const atomType = ATOM_TYPES[atom.element]
      const baseRadius = atomType ? atomType.radius : 12

      // 原始 3D 坐标（将 2D offset 扩展到 3D）
      let point3D = {
        x: atom.offset[0] * scale,
        y: atom.offset[1] * scale,
        z: 0  // 初始在 XY 平面
      }

      // 应用 3D 旋转
      point3D = rotateX(point3D, this.rotation3D.x)
      point3D = rotateY(point3D, this.rotation3D.y)
      point3D = rotateZ(point3D, this.rotation3D.z)

      // 透视投影
      const projected = project(point3D)

      return {
        element: atom.element,
        x: this.position.x + projected.x,
        y: this.position.y + projected.y,
        z: projected.z,
        scale: projected.scale,
        radius: baseRadius * 0.6 * projected.scale,
        color: atomType ? atomType.color : '#888888',
        isIon: atom.isIon,
        charge: atom.charge
      }
    })
  }

  // 获取化学键的 3D 投影坐标
  getBondWorldPositions3D() {
    const scale = 1.8
    const atomPositions = this.template.atoms.map(atom => {
      let point3D = {
        x: atom.offset[0] * scale,
        y: atom.offset[1] * scale,
        z: 0
      }
      point3D = rotateX(point3D, this.rotation3D.x)
      point3D = rotateY(point3D, this.rotation3D.y)
      point3D = rotateZ(point3D, this.rotation3D.z)
      return project(point3D)
    })

    return this.template.bonds.map(([i, j, order]) => {
      const p1 = atomPositions[i]
      const p2 = atomPositions[j]

      return {
        x1: this.position.x + p1.x,
        y1: this.position.y + p1.y,
        z1: p1.z,
        x2: this.position.x + p2.x,
        y2: this.position.y + p2.y,
        z2: p2.z,
        order,
        avgZ: (p1.z + p2.z) / 2,
        avgScale: (p1.scale + p2.scale) / 2
      }
    })
  }

  reset(template, x, y, temperature = 300) {
    this.template = template
    this.type = template.id
    this.position = { x, y }
    this._boundingBox = null

    this.rotation3D = {
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2
    }

    this.angularVelocity3D = {
      x: (Math.random() - 0.5) * 0.4,
      y: (Math.random() - 0.5) * 0.35,
      z: (Math.random() - 0.5) * 0.3
    }

    const speed = this.calculateThermalSpeed(temperature)
    const angle = Math.random() * Math.PI * 2
    this.velocity = {
      x: speed * Math.cos(angle),
      y: speed * Math.sin(angle)
    }

    this.kineticEnergy = this.calculateKineticEnergy()
    this.totalEnergy = this.kineticEnergy
    this.isColliding = false
    this.collisionCooldown = 0
    this.visible = true
    this.opacity = 1
  }
}

// ============================================
// 碰撞系统
// ============================================

export class CollisionSystem {
  constructor() {
    this.collisionPairs = []
  }

  broadPhase(molecules) {
    const pairs = []
    for (let i = 0; i < molecules.length; i++) {
      for (let j = i + 1; j < molecules.length; j++) {
        if (this.checkBoundingBoxCollision(molecules[i], molecules[j])) {
          pairs.push([molecules[i], molecules[j]])
        }
      }
    }
    return pairs
  }

  checkBoundingBoxCollision(mol1, mol2) {
    const box1 = mol1.getBoundingBox()
    const box2 = mol2.getBoundingBox()

    const scale = 1.8
    const x1 = mol1.position.x + box1.minX * scale
    const y1 = mol1.position.y + box1.minY * scale
    const w1 = box1.width * scale
    const h1 = box1.height * scale

    const x2 = mol2.position.x + box2.minX * scale
    const y2 = mol2.position.y + box2.minY * scale
    const w2 = box2.width * scale
    const h2 = box2.height * scale

    return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1)
  }

  narrowPhase(mol1, mol2) {
    const dx = mol2.position.x - mol1.position.x
    const dy = mol2.position.y - mol1.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    const box1 = mol1.getBoundingBox()
    const box2 = mol2.getBoundingBox()
    const minDistance = (Math.max(box1.width, box1.height) + Math.max(box2.width, box2.height)) * 0.9

    if (distance < minDistance) {
      return {
        colliding: true,
        distance,
        minDistance,
        normal: distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 }
      }
    }

    return { colliding: false }
  }

  resolveCollision(mol1, mol2, collisionInfo) {
    if (mol1.collisionCooldown > 0 || mol2.collisionCooldown > 0) {
      return null
    }

    const m1 = mol1.template.mass
    const m2 = mol2.template.mass
    const totalMass = m1 + m2

    const dvx = mol1.velocity.x - mol2.velocity.x
    const dvy = mol1.velocity.y - mol2.velocity.y
    const dvn = dvx * collisionInfo.normal.x + dvy * collisionInfo.normal.y

    if (dvn < 0) return null

    const restitution = 0.95
    const impulse = (1 + restitution) * dvn / totalMass

    mol1.velocity.x -= impulse * m2 * collisionInfo.normal.x
    mol1.velocity.y -= impulse * m2 * collisionInfo.normal.y
    mol2.velocity.x += impulse * m1 * collisionInfo.normal.x
    mol2.velocity.y += impulse * m1 * collisionInfo.normal.y

    const overlap = collisionInfo.minDistance - collisionInfo.distance
    const separation = overlap / 2 + 1

    mol1.position.x -= separation * collisionInfo.normal.x
    mol1.position.y -= separation * collisionInfo.normal.y
    mol2.position.x += separation * collisionInfo.normal.x
    mol2.position.y += separation * collisionInfo.normal.y

    // 碰撞时改变旋转
    mol1.angularVelocity3D.x += (Math.random() - 0.5) * 0.5
    mol1.angularVelocity3D.y += (Math.random() - 0.5) * 0.5
    mol2.angularVelocity3D.x += (Math.random() - 0.5) * 0.5
    mol2.angularVelocity3D.y += (Math.random() - 0.5) * 0.5

    mol1.collisionCooldown = 0.1
    mol2.collisionCooldown = 0.1
    mol1.isColliding = true
    mol2.isColliding = true
    setTimeout(() => {
      mol1.isColliding = false
      mol2.isColliding = false
    }, 100)

    mol1.kineticEnergy = mol1.calculateKineticEnergy()
    mol2.kineticEnergy = mol2.calculateKineticEnergy()

    const collisionEnergy = 0.5 * m1 * m2 / totalMass * dvn * dvn

    return {
      molecules: [mol1, mol2],
      relativeVelocity: Math.sqrt(dvx * dvx + dvy * dvy),
      kineticEnergy: collisionEnergy
    }
  }

  detectAndResolve(molecules) {
    const collisionInfos = []
    const pairs = this.broadPhase(molecules)

    for (const [mol1, mol2] of pairs) {
      const collision = this.narrowPhase(mol1, mol2)

      if (collision.colliding) {
        const info = this.resolveCollision(mol1, mol2, collision)
        if (info) {
          collisionInfos.push(info)
        }
      }
    }

    return collisionInfos
  }
}

// ============================================
// 反应引擎
// ============================================

export class ReactionEngine {
  constructor(reactions) {
    this.reactions = reactions
    this.reactionEffects = []
    this.maxEffects = 5
  }

  checkReactionConditions(collisionInfo) {
    const mol1 = collisionInfo.molecules[0]
    const mol2 = collisionInfo.molecules[1]
    const type1 = mol1.type
    const type2 = mol2.type

    for (const reaction of this.reactions) {
      const reactants = { ...reaction.reactants }
      let matchCount = 0

      if (reactants[type1] && reactants[type1] > 0) {
        reactants[type1]--
        matchCount++
      }
      if (reactants[type2] && reactants[type2] > 0) {
        reactants[type2]--
        matchCount++
      }

      const allMatched = Object.values(reactants).every(count => count === 0)

      if (allMatched && matchCount >= 2) {
        const collisionEnergy = collisionInfo.kineticEnergy
        if (collisionEnergy >= reaction.activationEnergy) {
          if (Math.random() < reaction.probability * 0.3) {
            return {
              canReact: true,
              reaction,
              reactants: [mol1, mol2]
            }
          }
        }
      }
    }

    return { canReact: false }
  }

  executeReaction(reactionInfo, molecules, templates) {
    const { reaction, reactants } = reactionInfo

    const reactantIndices = reactants.map(mol => molecules.indexOf(mol))
    reactantIndices.sort((a, b) => b - a)
    reactantIndices.forEach(index => molecules.splice(index, 1))

    const centerPosition = {
      x: reactants.reduce((sum, mol) => sum + mol.position.x, 0) / reactants.length,
      y: reactants.reduce((sum, mol) => sum + mol.position.y, 0) / reactants.length
    }

    const productMolecules = []

    for (const [productType, count] of Object.entries(reaction.products)) {
      const template = templates[productType]
      if (!template) continue

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        const offset = 30
        const mol = new Molecule(
          template,
          centerPosition.x + Math.cos(angle) * offset,
          centerPosition.y + Math.sin(angle) * offset,
          400
        )

        const speedBoost = Math.sqrt(Math.abs(reaction.energyRelease) / template.mass) * 0.3
        mol.velocity.x += (Math.random() - 0.5) * speedBoost
        mol.velocity.y += (Math.random() - 0.5) * speedBoost

        productMolecules.push(mol)
      }
    }

    molecules.push(...productMolecules)
    this.addReactionEffect(centerPosition, reaction.energyRelease)

    return productMolecules
  }

  addReactionEffect(position, energy) {
    if (this.reactionEffects.length >= this.maxEffects) {
      this.reactionEffects.shift()
    }

    this.reactionEffects.push({
      position: { ...position },
      intensity: Math.abs(energy),
      startTime: performance.now(),
      duration: 800
    })
  }

  updateReactionEffects() {
    const now = performance.now()
    this.reactionEffects = this.reactionEffects.filter(effect => {
      return now - effect.startTime < effect.duration
    })
  }

  getActiveEffects() {
    return this.reactionEffects
  }
}

// ============================================
// 渲染器 - 亮色主题 + 简约抽象风格
// ============================================

export class MolecularRenderer {
  constructor(ctx, width, height) {
    this.ctx = ctx
    this.width = width
    this.height = height
    this.time = 0
    this.scale = 1
  }

  resize(width, height) {
    this.width = width
    this.height = height
  }

  renderMolecule3D(molecule) {
    const ctx = this.ctx

    // 获取 3D 投影后的原子和键位置
    const atoms = molecule.getAtomWorldPositions3D()
    const bonds = molecule.getBondWorldPositions3D()

    // 按 z 值排序，先绘制远的，再绘制近的
    const sortedBonds = [...bonds].sort((a, b) => b.avgZ - a.avgZ)
    const sortedAtoms = [...atoms].sort((a, b) => b.z - a.z)

    // 绘制化学键
    sortedBonds.forEach(bond => {
      this.renderBond3D(bond, molecule.opacity)
    })

    // 绘制原子
    sortedAtoms.forEach(atom => {
      this.renderAtom3D(atom, molecule.opacity)
    })
  }

  renderBond3D(bond, opacity) {
    const ctx = this.ctx
    const depth = (bond.avgZ + 200) / 400  // 归一化深度
    const alpha = 0.08 + depth * 0.12  // 根据深度调整透明度

    ctx.beginPath()
    ctx.moveTo(bond.x1, bond.y1)
    ctx.lineTo(bond.x2, bond.y2)
    ctx.strokeStyle = `rgba(120, 130, 150, ${alpha * opacity})`
    ctx.lineWidth = 1.5 * bond.avgScale
    ctx.stroke()

    // 双键
    if (bond.order === 2) {
      const dx = bond.x2 - bond.x1
      const dy = bond.y2 - bond.y1
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len > 0) {
        const nx = -dy / len * 3
        const ny = dx / len * 3

        ctx.beginPath()
        ctx.moveTo(bond.x1 + nx, bond.y1 + ny)
        ctx.lineTo(bond.x2 + nx, bond.y2 + ny)
        ctx.strokeStyle = `rgba(120, 130, 150, ${alpha * 0.7 * opacity})`
        ctx.lineWidth = 1.2 * bond.avgScale
        ctx.stroke()
      }
    }
  }

  renderAtom3D(atom, opacity) {
    const ctx = this.ctx
    const depth = (atom.z + 200) / 400
    const radius = atom.radius

    // 根据深度计算颜色深浅
    const colorLightness = 0.3 + depth * 0.4

    // 外部柔和光晕（融入背景）
    const glowGradient = ctx.createRadialGradient(
      atom.x, atom.y, 0,
      atom.x, atom.y, radius * 2.5
    )
    glowGradient.addColorStop(0, this.hexToRgba(atom.color, 0.06 * opacity))
    glowGradient.addColorStop(0.5, this.hexToRgba(atom.color, 0.03 * opacity))
    glowGradient.addColorStop(1, 'rgba(248, 250, 252, 0)')

    ctx.beginPath()
    ctx.arc(atom.x, atom.y, radius * 2.5, 0, Math.PI * 2)
    ctx.fillStyle = glowGradient
    ctx.fill()

    // 主原子圆 - 简约线条风格
    ctx.beginPath()
    ctx.arc(atom.x, atom.y, radius, 0, Math.PI * 2)

    // 淡淡的填充，接近背景色
    ctx.fillStyle = this.hexToRgba(atom.color, 0.15 * colorLightness * opacity)
    ctx.fill()

    // 边框 - 根据颜色亮度调整透明度，浅色原子边框更明显
    const isLightColor = this.isLightColor(atom.color)
    const borderAlpha = isLightColor
      ? (0.5 + depth * 0.3) * opacity
      : (0.3 + depth * 0.25) * opacity

    ctx.strokeStyle = this.hexToRgba(atom.color, borderAlpha)
    ctx.lineWidth = isLightColor ? 1.8 : 1.2
    ctx.stroke()
  }

  isLightColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 180
  }

  renderReactionEffect(effect) {
    const ctx = this.ctx
    const now = performance.now()
    const progress = (now - effect.startTime) / effect.duration

    if (progress >= 1) return

    const alpha = Math.sin(progress * Math.PI) * 0.15
    const radius = 25 + progress * 20

    const gradient = ctx.createRadialGradient(
      effect.position.x, effect.position.y, 0,
      effect.position.x, effect.position.y, radius
    )

    gradient.addColorStop(0, `rgba(180, 190, 210, ${alpha})`)
    gradient.addColorStop(1, 'rgba(180, 190, 210, 0)')

    ctx.beginPath()
    ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
  }

  hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  render(molecules, effects) {
    this.time++

    // 不绘制任何背景或轨迹，完全透明
    this.ctx.clearRect(0, 0, this.width, this.height)

    // 按 z 值排序所有分子（简单的深度排序）
    const sortedMolecules = [...molecules].sort((a, b) => {
      const avgZa = a.getAtomWorldPositions3D().reduce((sum, atom) => sum + atom.z, 0)
      const avgZb = b.getAtomWorldPositions3D().reduce((sum, atom) => sum + atom.z, 0)
      return avgZa - avgZb
    })

    // 渲染所有分子
    sortedMolecules.forEach(molecule => {
      if (molecule.visible) {
        this.renderMolecule3D(molecule)
      }
    })

    // 渲染反应特效
    effects.forEach(effect => {
      this.renderReactionEffect(effect)
    })
  }
}

// ============================================
// 对象池
// ============================================

export class MoleculePool {
  constructor() {
    this.pools = new Map()
    this.maxPoolSize = 50
  }

  acquire(template, x, y, temperature) {
    const type = template.id
    const pool = this.pools.get(type)

    if (pool && pool.length > 0) {
      const molecule = pool.pop()
      molecule.reset(template, x, y, temperature)
      return molecule
    }

    return new Molecule(template, x, y, temperature)
  }

  release(molecule) {
    const type = molecule.type
    let pool = this.pools.get(type)

    if (!pool) {
      pool = []
      this.pools.set(type, pool)
    }

    if (pool.length < this.maxPoolSize) {
      molecule.visible = false
      pool.push(molecule)
    }
  }

  releaseAll() {
    this.pools.clear()
  }

  getPoolStats() {
    const stats = {}
    this.pools.forEach((pool, type) => {
      stats[type] = pool.length
    })
    return stats
  }
}

// ============================================
// 性能监控
// ============================================

export class PerformanceMonitor {
  constructor() {
    this.frameCount = 0
    this.lastTime = performance.now()
    this.fps = 60
    this.frameTime = 16.67
    this.moleculeCount = 0
  }

  update() {
    this.frameCount++
    const now = performance.now()
    const elapsed = now - this.lastTime

    if (elapsed >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / elapsed)
      this.frameTime = elapsed / this.frameCount
      this.frameCount = 0
      this.lastTime = now
    }
  }

  getStats() {
    return {
      fps: this.fps,
      frameTime: this.frameTime.toFixed(2),
      moleculeCount: this.moleculeCount
    }
  }

  shouldReduceQuality() {
    return this.fps < 30
  }
}
