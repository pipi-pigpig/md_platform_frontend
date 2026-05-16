<template>
  <div class="systems">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>电解液配方管理</h2>
      <el-button type="primary" @click="openCreateDialog">
        新建配方
      </el-button>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索配方名称..."
        prefix-icon="el-icon-search"
        class="search-input"
        clearable
        @input="handleFilterChange"
      />

      <el-select
        v-model="saltFilter"
        placeholder="锂盐筛选"
        clearable
        class="filter-select"
        @change="handleFilterChange"
      >
        <el-option label="LiPF6" value="LiPF6" />
        <el-option label="LiFSI" value="LiFSI" />
        <el-option label="LiTFSI" value="LiTFSI" />
        <el-option label="NaCl" value="NaCl" />
      </el-select>

      <el-select
        v-model="solventFilter"
        placeholder="溶剂筛选"
        clearable
        class="filter-select"
        @change="handleFilterChange"
      >
        <el-option label="EC" value="EC" />
        <el-option label="DMC" value="DMC" />
        <el-option label="EMC" value="EMC" />
        <el-option label="DEC" value="DEC" />
        <el-option label="水" value="WATER" />
      </el-select>

      <div class="spacer"></div>
    </div>

    <!-- 创建/编辑配方对话框 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditing ? '编辑电解液配方' : '新建电解液配方'"
      width="640px"
      align-center
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="80px" class="system-form">
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">基本信息</div>
          <el-form-item label="配方名称" required>
            <el-input v-model="formData.name" placeholder="例如：LiPF6 1M in EC/DMC (3:7)" />
          </el-form-item>
          <el-form-item label="任务描述">
            <el-input v-model="formData.taskDescription" type="textarea" :rows="2" placeholder="可选：配方用途说明" />
          </el-form-item>
        </div>

        <!-- 溶剂配置 -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-title">溶剂配置</span>
            <el-button type="primary" size="small" plain @click="addSolvent">添加</el-button>
          </div>
          <div v-if="!formData.solventInfo?.solvents?.length" class="empty-hint">
            请添加至少一种溶剂
          </div>
          <div v-for="(solvent, index) in (formData.solventInfo?.solvents || [])" :key="index" class="item-row">
            <el-select v-model="solvent.name" placeholder="选择溶剂" class="item-select">
              <el-option label="EC (碳酸乙烯酯)" value="EC" />
              <el-option label="DMC (碳酸二甲酯)" value="DMC" />
              <el-option label="EMC (碳酸甲乙酯)" value="EMC" />
              <el-option label="DEC (碳酸二乙酯)" value="DEC" />
              <el-option label="PC (碳酸丙烯酯)" value="PC" />
              <el-option label="水 (H2O)" value="WATER" />
              <el-option label="乙腈 (ACN)" value="ACN" />
            </el-select>
            <el-input-number v-model="solvent.moleFraction" :min="0" :max="1" :step="0.1" :precision="2" class="item-number" />
            <span class="field-unit">摩尔分数</span>
            <el-button type="text" @click="removeSolvent(index)" class="delete-text">删除</el-button>
          </div>
          <div v-if="showSolventSumError" class="error-tip">
            摩尔分数之和须为 1.0（当前: {{ solventSum.toFixed(2) }}）
          </div>
        </div>

        <!-- 盐配置 -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-title">锂盐配置</span>
            <el-button type="primary" size="small" plain @click="addSalt">添加</el-button>
          </div>
          <div v-if="formData.saltInfo.length === 0" class="empty-hint">
            请添加至少一种锂盐
          </div>
          <div v-for="(salt, index) in formData.saltInfo" :key="index" class="item-row">
            <el-select v-model="salt.name" placeholder="选择锂盐" class="item-select" @change="updateSaltIons(salt)">
              <el-option label="LiPF6 (六氟磷酸锂)" value="LiPF6" />
              <el-option label="LiFSI (双氟磺酰亚胺锂)" value="LiFSI" />
              <el-option label="LiTFSI (双三氟甲磺酰亚胺锂)" value="LiTFSI" />
              <el-option label="LiBF4 (四氟硼酸锂)" value="LiBF4" />
              <el-option label="NaCl (氯化钠)" value="NaCl" />
            </el-select>
            <el-input-number v-model="salt.concentration" :min="0" :max="5" :step="0.1" :precision="2" class="item-number" />
            <span class="field-unit">mol/L</span>
            <el-button type="text" @click="removeSalt(index)" class="delete-text">删除</el-button>
          </div>
        </div>

        <!-- 添加剂配置（可选） -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-title">添加剂</span>
            <span class="optional-tag">可选</span>
            <el-button type="primary" size="small" plain @click="addAdditive">添加</el-button>
          </div>
          <div v-if="formData.additiveInfo.length === 0" class="empty-hint muted">
            暂无添加剂
          </div>
          <div v-for="(additive, index) in formData.additiveInfo" :key="index" class="item-row">
            <el-input v-model="additive.name" placeholder="名称" class="item-input" />
            <el-input-number v-model="additive.concentration" :min="0" :step="0.01" :precision="3" class="item-number" />
            <span class="field-unit">mol/L</span>
            <el-button type="text" @click="removeAdditive(index)" class="delete-text">删除</el-button>
          </div>
        </div>

        <!-- 模拟参数 -->
        <div class="form-section">
          <div class="section-title">模拟参数</div>
          <div class="params-row">
            <el-form-item label="温度 (K)">
              <el-input-number v-model="formData.temperature" :min="0" :max="1000" :step="10" class="params-number" />
            </el-form-item>
            <el-form-item label="压力 (bar)">
              <el-input-number v-model="formData.pressure" :min="0" :step="0.1" class="params-number" />
            </el-form-item>
          </div>

          <div class="sub-section">
            <div class="sub-title">盒子尺寸 (Å)</div>
            <div class="box-size-row">
              <div class="box-item">
                <span class="box-label">X</span>
                <el-input-number v-model="formData.boxSize.x" :min="10" :max="200" :step="5" size="small" />
              </div>
              <div class="box-item">
                <span class="box-label">Y</span>
                <el-input-number v-model="formData.boxSize.y" :min="10" :max="200" :step="5" size="small" />
              </div>
              <div class="box-item">
                <span class="box-label">Z</span>
                <el-input-number v-model="formData.boxSize.z" :min="10" :max="200" :step="5" size="small" />
              </div>
            </div>
          </div>

          <el-form-item label="边界条件">
            <el-select v-model="formData.boundaryConditions" class="boundary-select">
              <el-option label="周期性边界 (p p p)" value="p p p" />
              <el-option label="非周期性边界 (f f f)" value="f f f" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showFormDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm">{{ isEditing ? '保存' : '创建' }}</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 配方列表 -->
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>配方列表</span>
          <el-button @click="loadSystems" :loading="loading">
            刷新
          </el-button>
        </div>
      </template>

      <el-table :data="filteredSystems" v-loading="loading">
        <el-table-column prop="name" label="配方名称" min-width="240" show-overflow-tooltip />
        <el-table-column label="溶剂" min-width="120">
          <template #default="scope">
            {{ formatSolventInfo(scope.row.solventInfo) }}
          </template>
        </el-table-column>
        <el-table-column label="锂盐" min-width="100">
          <template #default="scope">
            {{ formatSaltInfo(scope.row.saltInfo) }}
          </template>
        </el-table-column>
        <el-table-column label="温度(K)" width="85" align="center">
          <template #default="scope">
            {{ scope.row.temperature || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="155">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="editSystem(scope.row)">修改</el-button>
              <el-button type="danger" size="small" @click="deleteSystem(scope.row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { systemApi } from '../api.js'

const SALT_IONS_MAP = {
  'LiPF6': { cation: 'Li+', anion: 'PF6-' },
  'LiFSI': { cation: 'Li+', anion: 'FSI-' },
  'LiTFSI': { cation: 'Li+', anion: 'TFSI-' },
  'LiBF4': { cation: 'Li+', anion: 'BF4-' },
  'NaCl': { cation: 'Na+', anion: 'Cl-' }
}

export default {
  name: 'SystemsView',
  data() {
    return {
      loading: false,
      systems: [],
      showFormDialog: false,
      isEditing: false,
      showSolventSumError: false,
      searchQuery: '',
      saltFilter: '',
      solventFilter: '',
      formData: this.getEmptyFormData()
    }
  },
  computed: {
    solventSum() {
      const solvents = this.formData?.solventInfo?.solvents || []
      return solvents.reduce((sum, s) => sum + (s.moleFraction || 0), 0)
    },
    filteredSystems() {
      return this.systems.filter(system => {
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase()
          if (!system.name.toLowerCase().includes(query)) {
            return false
          }
        }
        if (this.saltFilter) {
          let saltNames = []
          if (Array.isArray(system.saltInfo)) {
            saltNames = system.saltInfo.map(s => s.name)
          }
          if (!saltNames.includes(this.saltFilter)) {
            return false
          }
        }
        if (this.solventFilter) {
          let solventNames = []
          if (Array.isArray(system.solventInfo)) {
            solventNames = system.solventInfo.map(s => s.name)
          } else if (system.solventInfo?.solvents) {
            solventNames = system.solventInfo.solvents.map(s => s.name)
          }
          if (!solventNames.includes(this.solventFilter)) {
            return false
          }
        }
        return true
      })
    }
  },
  mounted() {
    this.loadSystems()
  },
  methods: {
    getEmptyFormData() {
      return {
        name: '',
        taskDescription: '',
        solventInfo: {
          solvents: [{ name: 'EC', moleFraction: 0.3 }, { name: 'DMC', moleFraction: 0.7 }]
        },
        saltInfo: [{ name: 'LiPF6', cation: 'Li+', anion: 'PF6-', concentration: 1.0 }],
        additiveInfo: [],
        temperature: 298.15,
        pressure: 1.0,
        boxSize: { x: 40.0, y: 40.0, z: 40.0 },
        boundaryConditions: 'p p p'
      }
    },

    openCreateDialog() {
      this.isEditing = false
      this.formData = this.getEmptyFormData()
      this.showSolventSumError = false
      this.showFormDialog = true
    },

    addSolvent() {
      this.formData.solventInfo.solvents.push({ name: '', moleFraction: 0 })
    },

    removeSolvent(index) {
      this.formData.solventInfo.solvents.splice(index, 1)
    },

    addSalt() {
      this.formData.saltInfo.push({ name: '', cation: '', anion: '', concentration: 1.0 })
    },

    removeSalt(index) {
      this.formData.saltInfo.splice(index, 1)
    },

    updateSaltIons(salt) {
      const ions = SALT_IONS_MAP[salt.name]
      if (ions) {
        salt.cation = ions.cation
        salt.anion = ions.anion
      }
    },

    addAdditive() {
      this.formData.additiveInfo.push({ name: '', concentration: 0 })
    },

    removeAdditive(index) {
      this.formData.additiveInfo.splice(index, 1)
    },

    async loadSystems() {
      this.loading = true
      try {
        const response = await systemApi.getAll()
        this.systems = response.data || []
      } catch (error) {
        // 如果是静默错误（请求被取消），不显示提示
        if (error.silent) {
          return
        }
        console.error('加载配方列表失败:', error)
        this.$message.error('加载配方列表失败')
      } finally {
        this.loading = false
      }
    },

    async submitForm() {
      if (!this.formData.name?.trim()) {
        this.$message.error('请输入配方名称')
        return
      }

      const solvents = this.formData?.solventInfo?.solvents || []
      if (solvents.length === 0) {
        this.$message.error('请添加至少一种溶剂')
        return
      }

      if (!this.formData.saltInfo || this.formData.saltInfo.length === 0) {
        this.$message.error('请添加至少一种锂盐')
        return
      }

      const solventSum = this.solventSum
      if (Math.abs(solventSum - 1.0) > 0.001) {
        this.showSolventSumError = true
        this.$message.error(`溶剂摩尔分数之和必须等于 1.0（当前: ${solventSum.toFixed(2)}）`)
        return
      }
      this.showSolventSumError = false

      try {
        if (this.isEditing) {
          await systemApi.update(this.formData.id, this.formData)
          this.$message.success('配方更新成功')
        } else {
          await systemApi.create(this.formData)
          this.$message.success('配方创建成功')
        }
        this.showFormDialog = false
        this.loadSystems()
      } catch (error) {
        console.error('保存配方失败:', error)
        this.$message.error('保存配方失败')
      }
    },

    editSystem(system) {
      this.isEditing = true
      this.showSolventSumError = false

      // 解析溶剂信息
      let solventInfo = { solvents: [] }
      if (system.solventInfo) {
        let rawSolvent = system.solventInfo
        if (typeof rawSolvent === 'string') {
          try {
            rawSolvent = JSON.parse(rawSolvent)
          } catch (e) {
            rawSolvent = []
          }
        }
        // 支持两种格式转换
        if (Array.isArray(rawSolvent)) {
          // 数据库格式: [{"name": "EC", "mole_ratio": 3}, ...]
          const totalRatio = rawSolvent.reduce((sum, s) => sum + (s.mole_ratio || 0), 0)
          solventInfo.solvents = rawSolvent.map(s => ({
            name: s.name,
            moleFraction: totalRatio > 0 ? s.mole_ratio / totalRatio : 0
          }))
        } else if (rawSolvent.solvents && Array.isArray(rawSolvent.solvents)) {
          // 前端格式: {"solvents": [{"name": "EC", "moleFraction": 0.3}]}
          solventInfo = rawSolvent
        }
      }

      // 解析盐信息
      let saltInfo = []
      if (system.saltInfo) {
        let rawSalt = system.saltInfo
        if (typeof rawSalt === 'string') {
          try {
            rawSalt = JSON.parse(rawSalt)
          } catch (e) {
            rawSalt = []
          }
        }
        if (Array.isArray(rawSalt)) {
          // 转换数据库格式到前端格式
          saltInfo = rawSalt.map(s => ({
            name: s.name,
            cation: s.cation_id ? this.getCationName(s.cation_id) : 'Li+',
            anion: s.anion_id ? this.getAnionName(s.anion_id) : this.getAnionFromSalt(s.name),
            concentration: s.concentration_mol_L || s.concentration || 1.0
          }))
        }
      }

      // 解析添加剂信息
      let additiveInfo = []
      if (system.additiveInfo) {
        let rawAdditive = system.additiveInfo
        if (typeof rawAdditive === 'string') {
          try {
            rawAdditive = JSON.parse(rawAdditive)
          } catch (e) {
            rawAdditive = []
          }
        }
        if (Array.isArray(rawAdditive)) {
          additiveInfo = rawAdditive.map(a => ({
            name: a.name,
            concentration: a.concentration || a.mass_fraction || 0
          }))
        }
      }

      // 解析盒子尺寸
      let boxSize = { x: 40.0, y: 40.0, z: 40.0 }
      if (system.boxSize) {
        if (typeof system.boxSize === 'string') {
          try {
            boxSize = JSON.parse(system.boxSize)
          } catch (e) {}
        } else {
          boxSize = system.boxSize
        }
      }

      this.formData = {
        id: system.id,
        name: system.name,
        taskDescription: system.taskDescription || '',
        solventInfo: solventInfo,
        saltInfo: saltInfo.length > 0 ? saltInfo : [{ name: 'LiPF6', cation: 'Li+', anion: 'PF6-', concentration: 1.0 }],
        additiveInfo: additiveInfo,
        temperature: system.temperature || 298.15,
        pressure: system.pressure || 1.0,
        boxSize: boxSize,
        boundaryConditions: system.boundaryConditions || 'p p p'
      }

      this.showFormDialog = true
    },

    // 辅助方法：从盐名称推断阴离子
    getAnionFromSalt(saltName) {
      const anionMap = {
        'LiPF6': 'PF6-',
        'LiFSI': 'FSI-',
        'LiTFSI': 'TFSI-',
        'LiBF4': 'BF4-',
        'NaCl': 'Cl-'
      }
      return anionMap[saltName] || ''
    },

    // 辅助方法：根据ID获取阳离子名称
    getCationName(id) {
      const cations = { 1: 'Li+', 2: 'Li+', 5: 'Na+' }
      return cations[id] || 'Li+'
    },

    // 辅助方法：根据ID获取阴离子名称
    getAnionName(id) {
      const anions = { 2: 'PF6-', 6: 'Cl-', 10: 'TFSI-' }
      return anions[id] || ''
    },

    async deleteSystem(system) {
      try {
        await this.$confirm(`确定要删除配方 "${system.name}"?`, '确认删除', {
          type: 'warning'
        })

        await systemApi.delete(system.id)
        this.$message.success('配方已删除')
        this.loadSystems()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除配方失败')
        }
      }
    },

    formatSolventInfo(solventInfo) {
      if (!solventInfo) return '-'
      let solvents = solventInfo
      if (typeof solventInfo === 'string') {
        if (solventInfo.trim() === '' || solventInfo === 'null') return '-'
        try {
          solvents = JSON.parse(solventInfo)
        } catch (e) {
          return '-'
        }
      }
      // 支持两种格式：
      // 格式1: {"solvents": [{"name": "EC", "moleFraction": 0.3}]}
      // 格式2: [{"name": "EC", "mole_ratio": 3, "molecule_count": 250}]
      let solventList = null
      if (Array.isArray(solvents)) {
        // 格式2: 直接是数组
        solventList = solvents
      } else if (solvents && solvents.solvents && Array.isArray(solvents.solvents)) {
        // 格式1: 包含 solvents 属性
        solventList = solvents.solvents
      }
      if (!solventList || solventList.length === 0) return '-'

      // 计算总比例（用于格式2）
      const totalRatio = solventList.reduce((sum, s) => sum + (s.mole_ratio || s.moleFraction || 0), 0)

      return solventList.map(s => {
        let fraction
        if (s.moleFraction !== undefined) {
          fraction = (s.moleFraction * 100).toFixed(0)
        } else if (s.mole_ratio !== undefined && totalRatio > 0) {
          fraction = ((s.mole_ratio / totalRatio) * 100).toFixed(0)
        } else {
          fraction = '?'
        }
        return `${s.name || '?'} ${fraction}%`
      }).join(' / ')
    },

    formatSaltInfo(saltInfo) {
      if (!saltInfo) return '-'
      let salts = saltInfo
      if (typeof saltInfo === 'string') {
        if (saltInfo.trim() === '' || saltInfo === 'null') return '-'
        try {
          salts = JSON.parse(saltInfo)
        } catch (e) {
          return '-'
        }
      }
      if (!Array.isArray(salts) || salts.length === 0) return '-'
      return salts.map(s => {
        const conc = s.concentration || s.concentration_mol_L || '?'
        return `${s.name || '?'} ${conc}M`
      }).join(', ')
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },

    handleFilterChange() {}
  }
}
</script>

<style scoped>
.systems {
  padding: 20px;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.search-input {
  flex: 1;
  min-width: 200px;
}

.filter-select {
  width: 140px;
}

.spacer {
  flex: 2;
}

/* 表单 */
.system-form {
  max-height: 55vh;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 20px;
}

.form-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.optional-tag {
  font-size: 12px;
  padding: 2px 6px;
  background: #f0f2f5;
  color: #909399;
  border-radius: 4px;
  font-weight: 400;
}

/* 列表项 - flex布局 */
.item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f2f6fc;
}

.item-row:last-child {
  border-bottom: none;
}

.item-select {
  flex: 1;
  min-width: 0;
}

.item-input {
  flex: 1;
  min-width: 0;
}

.item-number {
  width: 120px;
  flex-shrink: 0;
}

.field-unit {
  width: 60px;
  flex-shrink: 0;
  color: #909399;
  font-size: 13px;
}

.delete-text {
  width: 40px;
  flex-shrink: 0;
  color: #909399;
  padding: 0;
  font-size: 13px;
}

.delete-text:hover {
  color: #f56c6c;
}

/* 空提示 */
.empty-hint {
  padding: 20px 0;
  text-align: center;
  color: #909399;
  font-size: 13px;
}

.empty-hint.muted {
  color: #c0c4cc;
}

/* 错误提示 */
.error-tip {
  color: #f56c6c;
  font-size: 13px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef0f0;
  border-radius: 4px;
}

/* 参数行 */
.params-row {
  display: flex;
  gap: 24px;
}

.params-row .el-form-item {
  margin-bottom: 0;
}

.params-number {
  width: 140px;
}

/* 子分区 */
.sub-section {
  margin: 16px 0;
  padding: 14px;
  background: #fafbfc;
  border-radius: 4px;
}

.sub-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
}

/* 盒子尺寸 */
.box-size-row {
  display: flex;
  gap: 16px;
}

.box-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.box-label {
  width: 16px;
  font-size: 13px;
  color: #606266;
}

.boundary-select {
  width: 200px;
}

/* 弹窗底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-buttons .el-button {
  width: 60px;
}
</style>
