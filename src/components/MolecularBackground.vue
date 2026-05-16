<template>
  <canvas
    ref="canvasRef"
    class="molecular-background"
    :class="{ 'reduced-motion': prefersReducedMotion }"
  />
</template>

<script>
import { ref, onMounted, onUnmounted, watch, shallowRef } from 'vue'

import {
  Molecule,
  CollisionSystem,
  ReactionEngine,
  MolecularRenderer,
  MoleculePool,
  PerformanceMonitor
} from '../utils/molecular-simulation.js'

import {
  MOLECULE_TEMPLATES,
  REACTIONS,
  getRandomMoleculeType
} from '../utils/molecular-data.js'

export default {
  name: 'MolecularBackground',
  props: {
    temperature: {
      type: Number,
      default: 300
    },
    maxMolecules: {
      type: Number,
      default: 15  // 减少分子数量
    },
    paused: {
      type: Boolean,
      default: false
    }
  },
  emits: ['reaction', 'stats-update'],
  setup(props, { emit }) {
    const canvasRef = ref(null)
    const prefersReducedMotion = ref(false)

    let animationId = null
    let molecules = []
    let collisionSystem = null
    let reactionEngine = null
    let renderer = null
    let moleculePool = null
    let performanceMonitor = null
    let lastTime = 0
    let isRunning = false

    const checkReducedMotion = () => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      prefersReducedMotion.value = mediaQuery.matches

      mediaQuery.addEventListener('change', (e) => {
        prefersReducedMotion.value = e.matches
      })
    }

    const initializeMolecules = (width, height) => {
      molecules = []

      // 减少分子数量的分布
      const distribution = {
        EC: 2,
        DMC: 2,
        EMC: 2,
        DEC: 1,
        PC: 1,
        Li_plus: 2,
        PF6_minus: 2,
        BF4_minus: 1,
        FEC: 1,
        VC: 1
      }

      for (const [type, count] of Object.entries(distribution)) {
        const template = MOLECULE_TEMPLATES[type]
        if (!template) continue

        for (let i = 0; i < count && molecules.length < props.maxMolecules; i++) {
          const x = Math.random() * (width - 100) + 50
          const y = Math.random() * (height - 100) + 50
          const molecule = moleculePool.acquire(template, x, y, props.temperature)
          molecules.push(molecule)
        }
      }
    }

    const supplementMolecules = (width, height) => {
      const targetCount = Math.floor(props.maxMolecules * 0.7)

      while (molecules.length < targetCount) {
        const type = getRandomMoleculeType()
        const template = MOLECULE_TEMPLATES[type]
        if (!template) continue

        const side = Math.floor(Math.random() * 4)
        let x, y

        switch (side) {
          case 0:
            x = Math.random() * width
            y = 50
            break
          case 1:
            x = Math.random() * width
            y = height - 50
            break
          case 2:
            x = 50
            y = Math.random() * height
            break
          case 3:
            x = width - 50
            y = Math.random() * height
            break
        }

        const molecule = moleculePool.acquire(template, x, y, props.temperature)
        molecules.push(molecule)
      }
    }

    const animate = (currentTime) => {
      if (!isRunning) return

      if (prefersReducedMotion.value || props.paused) {
        animationId = requestAnimationFrame(animate)
        return
      }

      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05)
      lastTime = currentTime

      const canvas = canvasRef.value
      if (!canvas) {
        animationId = requestAnimationFrame(animate)
        return
      }

      const ctx = canvas.getContext('2d')

      // 更新分子位置
      molecules.forEach(molecule => {
        molecule.update(deltaTime, {
          width: canvas.width,
          height: canvas.height
        })
      })

      // 检测和处理碰撞
      const collisionInfos = collisionSystem.detectAndResolve(molecules)

      // 检查反应条件
      for (const collisionInfo of collisionInfos) {
        const reactionInfo = reactionEngine.checkReactionConditions(collisionInfo)

        if (reactionInfo.canReact) {
          const products = reactionEngine.executeReaction(
            reactionInfo,
            molecules,
            MOLECULE_TEMPLATES
          )

          emit('reaction', {
            reaction: reactionInfo.reaction,
            products: products.length
          })
        }
      }

      // 更新反应特效
      reactionEngine.updateReactionEffects()

      // 渲染
      renderer.render(molecules, reactionEngine.getActiveEffects())

      // 补充分子
      if (molecules.length < props.maxMolecules * 0.5) {
        supplementMolecules(canvas.width, canvas.height)
      }

      // 性能监控
      performanceMonitor.moleculeCount = molecules.length
      performanceMonitor.update()

      // 低性能时降低质量
      if (performanceMonitor.shouldReduceQuality() && molecules.length > 10) {
        molecules.splice(molecules.length - 3, 3)
      }

      // 定期发出统计信息
      if (performanceMonitor.frameCount === 0) {
        emit('stats-update', performanceMonitor.getStats())
      }

      animationId = requestAnimationFrame(animate)
    }

    const resizeCanvas = () => {
      const canvas = canvasRef.value
      if (!canvas) return

      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr

      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'

      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)

      if (renderer) {
        renderer.resize(canvas.width / dpr, canvas.height / dpr)
      }

      if (molecules.length === 0) {
        initializeMolecules(canvas.width / dpr, canvas.height / dpr)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationId) {
          cancelAnimationFrame(animationId)
          animationId = null
        }
      } else {
        if (isRunning && !animationId) {
          lastTime = performance.now()
          animate(lastTime)
        }
      }
    }

    onMounted(() => {
      checkReducedMotion()

      const canvas = canvasRef.value

      collisionSystem = new CollisionSystem()
      reactionEngine = new ReactionEngine(REACTIONS)
      moleculePool = new MoleculePool()
      performanceMonitor = new PerformanceMonitor()

      resizeCanvas()

      const ctx = canvas.getContext('2d')
      renderer = new MolecularRenderer(ctx, canvas.width, canvas.height)

      initializeMolecules(canvas.width, canvas.height)

      window.addEventListener('resize', resizeCanvas)
      document.addEventListener('visibilitychange', handleVisibilityChange)

      isRunning = true
      lastTime = performance.now()
      animate(lastTime)
    })

    onUnmounted(() => {
      isRunning = false

      if (animationId) {
        cancelAnimationFrame(animationId)
        animationId = null
      }

      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      if (moleculePool) {
        moleculePool.releaseAll()
      }

      molecules = []
      collisionSystem = null
      reactionEngine = null
      renderer = null
      moleculePool = null
      performanceMonitor = null
    })

    watch(() => props.temperature, (newTemp) => {
      molecules.forEach(molecule => {
        const currentSpeed = Math.sqrt(
          molecule.velocity.x ** 2 + molecule.velocity.y ** 2
        )
        const newSpeed = molecule.calculateThermalSpeed(newTemp)
        const ratio = currentSpeed > 0 ? newSpeed / currentSpeed : 1

        molecule.velocity.x *= ratio
        molecule.velocity.y *= ratio
      })
    })

    watch(() => props.paused, (paused) => {
      if (!paused && isRunning && !animationId) {
        lastTime = performance.now()
        animate(lastTime)
      }
    })

    return {
      canvasRef,
      prefersReducedMotion
    }
  }
}
</script>

<style scoped>
.molecular-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  /* 亮色背景 - 纯净的浅灰白色 */
  background: #f8fafc;
}

.molecular-background.reduced-motion {
  opacity: 0.5;
}
</style>
