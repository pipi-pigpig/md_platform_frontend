<template>
  <div class="systems">
    <!-- 搜索筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索配方名称..."
        prefix-icon="el-icon-search"
        class="search-input"
        clearable
        @keyup.enter="doSearch"
        @clear="doSearch"
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
      <el-button type="primary" @click="openCreateDialog">
        新建配方
      </el-button>
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

      <div v-loading="loading">
        <el-empty v-if="filteredSystems.length === 0" description="暂无配方数据" />

        <el-table
          v-else
          ref="formulaTableRef"
          :data="filteredSystems"
          stripe
          style="width: 100%"
          row-key="id"
          :default-sort="{ prop: 'createdAt', order: 'descending' }"
          @sort-change="handleSortChange"
          @row-click="handleRowClick"
          @expand-change="handleExpandChange"
        >
          <!-- 展开列：点击行首箭头展开详情 -->
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-wrapper" :data-row-id="row.id" @click.stop>
                <div class="expand-body">
                <!-- 基本信息 -->
                <div class="detail-section">
                  <div class="detail-title">基本信息</div>
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="配方名称">{{ row.name }}</el-descriptions-item>
                    <el-descriptions-item label="总原子数">{{ row.totalAtomCount ?? '-' }}</el-descriptions-item>
                    <el-descriptions-item label="任务说明">{{ row.taskDescription || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="边界条件">{{ row.boundaryConditions || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="创建时间">{{ formatDate(row.createdAt) }}</el-descriptions-item>
                    <el-descriptions-item label="更新时间">{{ formatDate(row.updatedAt) }}</el-descriptions-item>
                  </el-descriptions>
                </div>

                <!-- 溶剂配置 -->
                <div class="detail-section">
                  <div class="detail-title">溶剂配置</div>
                  <div v-if="row.solvents.length === 0" class="detail-empty">无溶剂数据</div>
                  <div v-else class="detail-list">
                    <div v-for="(s, idx) in row.solvents" :key="idx" class="detail-list-item">
                      <span class="item-name">{{ s.name }}</span>
                      <span class="item-meta">摩尔分数 {{ (s.moleFraction * 100).toFixed(1) }}%</span>
                    </div>
                  </div>
                </div>

                <!-- 锂盐配置 -->
                <div class="detail-section">
                  <div class="detail-title">锂盐配置</div>
                  <div v-if="row.salts.length === 0" class="detail-empty">无锂盐</div>
                  <div v-else class="detail-list">
                    <div v-for="(s, idx) in row.salts" :key="idx" class="detail-list-item">
                      <span class="item-name">{{ s.name }}</span>
                      <span class="item-meta">{{ s.cation }} / {{ s.anion }} · {{ s.concentration }} mol/L</span>
                    </div>
                  </div>
                </div>

                <!-- 添加剂 -->
                <div class="detail-section">
                  <div class="detail-title">添加剂</div>
                  <div v-if="row.additives.length === 0" class="detail-empty muted">无</div>
                  <div v-else class="detail-list">
                    <div v-for="(a, idx) in row.additives" :key="idx" class="detail-list-item">
                      <span class="item-name">{{ a.name }}</span>
                      <span class="item-meta">{{ a.concentration }} mol/L</span>
                    </div>
                  </div>
                </div>

                <!-- 模拟参数 -->
                <div class="detail-section">
                  <div class="detail-title">模拟参数</div>
                  <el-descriptions :column="2" border size="small">
                    <el-descriptions-item label="温度">{{ row.temperature || '-' }} K</el-descriptions-item>
                    <el-descriptions-item label="压强">{{ row.pressure || '-' }} bar</el-descriptions-item>
                    <el-descriptions-item label="盒子尺寸">
                      {{ row.boxSize?.x ?? '-' }} × {{ row.boxSize?.y ?? '-' }} × {{ row.boxSize?.z ?? '-' }} Å
                    </el-descriptions-item>
                    <el-descriptions-item label="是否模板">
                      <el-tag :type="row.isPublicTemplate ? 'success' : 'info'" size="small">
                        {{ row.isPublicTemplate ? '公开模板' : '私有配方' }}
                      </el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <!-- 配方名称列（可排序） -->
          <el-table-column prop="name" label="配方名称" min-width="200" sortable="custom" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="cell-name">{{ row.name }}</span>
              <el-tag v-if="row.isPublicTemplate" type="success" size="small" style="margin-left: 6px;">模板</el-tag>
            </template>
          </el-table-column>

          <!-- 溶剂列 -->
          <el-table-column label="溶剂" min-width="140">
            <template #default="{ row }">
              {{ row.solventInfoDisplay }}
            </template>
          </el-table-column>

          <!-- 锂盐列 -->
          <el-table-column label="锂盐" min-width="120">
            <template #default="{ row }">
              {{ row.saltInfoDisplay }}
            </template>
          </el-table-column>

          <!-- 温度列 -->
          <el-table-column label="温度(K)" width="100" align="center">
            <template #default="{ row }">
              {{ row.temperature || '-' }}
            </template>
          </el-table-column>

          <!-- 创建时间列（可排序） -->
          <el-table-column prop="createdAt" label="创建时间" min-width="160" sortable="custom">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>

          <!-- 操作列 -->
          <el-table-column label="操作" width="300" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-buttons" @click.stop>
                <el-button type="primary" size="small" @click="editSystem(row)">修改</el-button>
                <el-button type="success" size="small" @click="saveAsTemplate(row)">存为模板</el-button>
                <el-button type="warning" size="small" @click="copyFromTemplate(row)">复用</el-button>
                <el-button type="danger" size="small" @click="deleteSystem(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container" v-if="total > 0">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @size-change="loadSystems"
            @current-change="loadSystems"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { systemApi, formatHelper } from '../api.js'
import { ElectrolyteFormula } from '../models/ElectrolyteFormula.js'

export default {
  name: 'SystemsView',
  data() {
    return {
      loading: false,
      systems: [],
      showFormDialog: false,
      isEditing: false,
      searchQuery: '',
      saltFilter: '',
      solventFilter: '',
      formData: ElectrolyteFormula.defaultFormData(),
      // 分页参数
      currentPage: 1,
      pageSize: 10,
      total: 0
    }
  },
  computed: {
    solventSum() {
      const solvents = this.formData?.solventInfo?.solvents || []
      return solvents.reduce((sum, s) => sum + (s.moleFraction || 0), 0)
    },
    // 摩尔分数之和偏离 1.0 时自动显示错误提示（响应式计算属性）
    showSolventSumError() {
      return this.solventSum > 0 && Math.abs(this.solventSum - 1.0) > 0.001
    },
    // 前端补充筛选：在已加载的分页数据中按盐/溶剂过滤（排序由 el-table 内置 sort-change 处理）
    filteredSystems() {
      return this.systems.filter(system => {
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
    openCreateDialog() {
      this.isEditing = false
      // 用 Object.assign 保留原响应式对象，避免整体替换导致 v-model 失效
      const fresh = ElectrolyteFormula.defaultFormData()
      Object.assign(this.formData, fresh)
      // 嵌套对象需要单独替换，否则引用仍指向旧对象
      this.formData.solventInfo = { solvents: fresh.solventInfo.solvents.map(s => ({ ...s })) }
      this.formData.saltInfo = fresh.saltInfo.map(s => ({ ...s }))
      this.formData.additiveInfo = []
      this.formData.boxSize = { ...fresh.boxSize }
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
      const ionsMap = {
        'LiPF6': { cation: 'Li+', anion: 'PF6-' },
        'LiFSI': { cation: 'Li+', anion: 'FSI-' },
        'LiTFSI': { cation: 'Li+', anion: 'TFSI-' },
        'LiBF4': { cation: 'Li+', anion: 'BF4-' },
        'NaCl': { cation: 'Na+', anion: 'Cl-' }
      }
      const ions = ionsMap[salt.name]
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

    async loadSystems(page) {
      if (page) this.currentPage = page
      this.loading = true
      try {
        const response = await systemApi.list({
          keyword: this.searchQuery || undefined,
          page: this.currentPage,
          pageSize: this.pageSize
        })
        const pageData = response.data?.data || {}
        this.total = pageData.total || 0
        const list = pageData.list || []
        // 列表响应不含 solventInfo/saltInfo，对每条调 getById 补全详情
        const detailResults = await Promise.all(
          list.map(item => systemApi.getById(item.id).catch(() => null))
        )
        this.systems = list.map((item, index) => {
          const detail = detailResults[index]?.data?.data
          return new ElectrolyteFormula(detail || item)
        })
      } catch (error) {
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
        this.$message.error(`溶剂摩尔分数之和必须等于 1.0（当前: ${solventSum.toFixed(2)}）`)
        return
      }

      try {
        if (this.isEditing) {
          const response = await systemApi.update(this.formData.id, this.formData)
          if (response.data.success) {
            this.$message.success('配方更新成功')
          } else {
            this.$message.error(response.data.message || '配方更新失败')
            return
          }
        } else {
          const response = await systemApi.create(this.formData)
          if (response.data.success) {
            this.$message.success('配方创建成功')
          } else {
            this.$message.error(response.data.message || '配方创建失败')
            return
          }
        }
        this.showFormDialog = false
        this.loadSystems()
      } catch (error) {
        if (error.response?.data?.message) {
          this.$message.error(error.response.data.message)
        } else if (!error.silent) {
          this.$message.error('保存配方失败')
        }
      }
    },

    editSystem(system) {
      this.isEditing = true

      // 使用 Object.assign 保留原响应式对象，避免整体替换导致 v-model 失效
      // 嵌套对象/数组用深拷贝，避免编辑时污染原列表数据
      const solvents = system.solvents.length > 0
        ? system.solvents.map(s => ({ name: s.name, moleFraction: s.moleFraction }))
        : [{ name: 'EC', moleFraction: 0.3 }, { name: 'DMC', moleFraction: 0.7 }]
      const salts = system.salts.length > 0
        ? system.salts.map(s => ({ name: s.name, cation: s.cation, anion: s.anion, concentration: s.concentration }))
        : [{ name: 'LiPF6', cation: 'Li+', anion: 'PF6-', concentration: 1.0 }]
      const additives = system.additives.map(a => ({ name: a.name, concentration: a.concentration }))

      Object.assign(this.formData, {
        id: system.id,
        name: system.name,
        taskDescription: system.taskDescription || '',
        solventInfo: { solvents },
        saltInfo: salts,
        additiveInfo: additives,
        temperature: system.temperature || 298.15,
        pressure: system.pressure || 1.0,
        boxSize: { x: system.boxSize?.x ?? 40, y: system.boxSize?.y ?? 40, z: system.boxSize?.z ?? 40 },
        boundaryConditions: system.boundaryConditions || 'p p p'
      })

      this.showFormDialog = true
    },

    async deleteSystem(system) {
      try {
        await this.$confirm(`确定要删除配方 "${system.name}"?`, '确认删除', {
          type: 'warning'
        })

        const response = await systemApi.delete(system.id)
        if (response.data.success) {
          this.$message.success('配方已删除')
          this.loadSystems()
        } else {
          this.$message.error(response.data.message || '删除配方失败')
        }
      } catch (error) {
        if (error === 'cancel') return
        if (error.response?.data?.message) {
          this.$message.error(error.response.data.message)
        } else if (!error.silent) {
          this.$message.error('删除配方失败')
        }
      }
    },

    // F-E006: 配方保存为模板
    async saveAsTemplate(system) {
      try {
        await this.$confirm(`确定将配方 "${system.name}" 保存为公开模板?`, '确认', {
          type: 'info'
        })
        const response = await systemApi.saveAsTemplate(system.id, true)
        if (response.data.success) {
          this.$message.success('模板保存成功')
          this.loadSystems()
        } else {
          this.$message.error(response.data.message || '模板保存失败')
        }
      } catch (error) {
        if (error === 'cancel') return
        if (error.response?.data?.message) {
          this.$message.error(error.response.data.message)
        } else if (!error.silent) {
          this.$message.error('模板保存失败')
        }
      }
    },

    // F-E007: 从模板复用创建新配方
    async copyFromTemplate(system) {
      try {
        const { value: newName } = await this.$prompt('请输入新配方名称:', '复用配方', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValue: `${system.name}_副本`,
          inputValidator: (val) => (val && val.trim() ? true : '配方名称不能为空')
        })

        const response = await systemApi.copy(system.id, newName.trim())
        if (response.data.success) {
          this.$message.success('配方复用成功')
          this.loadSystems()
        } else {
          this.$message.error(response.data.message || '配方复用失败')
        }
      } catch (error) {
        if (error === 'cancel') return
        if (error.response?.data?.message) {
          this.$message.error(error.response.data.message)
        } else if (!error.silent) {
          this.$message.error('配方复用失败')
        }
      }
    },

    formatDate(dateString) {
      return formatHelper.formatDate(dateString)
    },

    // 搜索回调（回车/清空时触发）
    doSearch() {
      this.currentPage = 1
      this.loadSystems()
    },

    // 盐/溶剂筛选变更时重置到第一页
    handleFilterChange() {
      this.currentPage = 1
    },

    // 点击行任意位置切换展开状态（操作按钮区已 @click.stop 阻止冒泡）
    handleRowClick(row, column, event) {
      // 点击展开图标列时不重复触发（el-table 自身会处理）
      if (column && column.type === 'expand') return

      // 判断当前行是否已展开：el-table 维护的展开状态无法直接读取，
      // 通过 DOM 检查该 row 后是否有展开内容 tr
      const tableEl = this.$refs.formulaTableRef?.$el
      const expandedTr = this.findExpandedTr(row)
      if (expandedTr) {
        // 已展开 → 收起：先过渡 wrapper 高度到 0，再调用 toggleRowExpansion 让 el-table 移除
        const wrapper = expandedTr.querySelector('.expand-wrapper')
        if (wrapper) {
          const targetHeight = wrapper.scrollHeight
          wrapper.style.transition = 'none'
          wrapper.style.height = targetHeight + 'px'
          wrapper.style.overflow = 'hidden'
          void wrapper.offsetHeight
          requestAnimationFrame(() => {
            wrapper.style.transition = 'height 0.3s ease-in-out'
            requestAnimationFrame(() => {
              wrapper.style.height = '0px'
            })
          })
          setTimeout(() => {
            this.$refs.formulaTableRef?.toggleRowExpansion(row, false)
          }, 340)
        } else {
          this.$refs.formulaTableRef?.toggleRowExpansion(row, false)
        }
      } else {
        // 未展开 → 展开：先 toggle 让 el-table 插入展开 tr
        this.$refs.formulaTableRef?.toggleRowExpansion(row, true)
        this.$nextTick(() => {
          const newExpandedTr = this.findExpandedTr(row)
          const wrapper = newExpandedTr?.querySelector('.expand-wrapper')
          if (wrapper) {
            const targetHeight = wrapper.scrollHeight
            wrapper.style.transition = 'none'
            wrapper.style.height = '0px'
            wrapper.style.overflow = 'hidden'
            void wrapper.offsetHeight
            requestAnimationFrame(() => {
              wrapper.style.transition = 'height 0.3s ease-in-out'
              requestAnimationFrame(() => {
                wrapper.style.height = targetHeight + 'px'
              })
            })
            setTimeout(() => {
              if (wrapper.style.height !== '0px') wrapper.style.height = 'auto'
            }, 360)
          }
        })
      }
    },

    // 根据 row.id 找到对应的展开内容 tr
    findExpandedTr(row) {
      const tableEl = this.$refs.formulaTableRef?.$el
      if (!tableEl) return null
      const wrapper = tableEl.querySelector(`.expand-wrapper[data-row-id="${row.id}"]`)
      return wrapper?.closest('tr') || null
    },

    // el-table 内部 expand-change 事件（图标点击触发）- 不做处理，由 handleRowClick 统一控制
    handleExpandChange() {},

    // el-table 列排序变化（与模拟任务页面一致的排序交互）
    handleSortChange({ prop, order }) {
      if (!prop || !order) {
        this.systems = [...this.systems]
        return
      }
      const dir = order === 'ascending' ? 1 : -1
      this.systems = [...this.systems].sort((a, b) => {
        let av = a[prop]
        let bv = b[prop]
        if (prop === 'createdAt' || prop === 'updatedAt') {
          av = av ? new Date(av).getTime() : 0
          bv = bv ? new Date(bv).getTime() : 0
        }
        if (av == null) return 1
        if (bv == null) return -1
        if (av < bv) return -1 * dir
        if (av > bv) return 1 * dir
        return 0
      })
    }
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

/* ===== 表格展开详情 ===== */
.cell-name {
  font-weight: 500;
  color: #303133;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* 展开内容分区 - 紧凑（过渡由 JS 控制外层 td 的 height） */
.expand-body {
  padding: 8px 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #fbfdff;
}

/* 展开图标旋转过渡 */
:deep(.el-table__expand-icon) {
  transition: transform 0.25s ease;
}

:deep(.el-table__expand-icon--expanded) {
  transform: rotate(90deg);
}

/* 行 hover 过渡 + 鼠标手势 */
:deep(.el-table__row) {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.detail-section {
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}

.detail-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-title {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 6px;
  padding-left: 6px;
  border-left: 3px solid #409eff;
  line-height: 1.4;
}

.detail-empty {
  color: #909399;
  font-size: 12px;
  padding: 2px 0;
}

.detail-empty.muted {
  color: #c0c4cc;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 10px;
  background: #f5f7fa;
  border-radius: 3px;
  font-size: 12px;
  line-height: 1.6;
}

.detail-list-item .item-name {
  font-weight: 500;
  color: #303133;
  min-width: 60px;
}

.detail-list-item .item-meta {
  color: #606266;
  flex: 1;
}

/* 展开区 el-descriptions 紧凑 */
.detail-section :deep(.el-descriptions__cell) {
  padding: 4px 8px !important;
}

.detail-section :deep(.el-descriptions__label) {
  font-size: 12px !important;
  width: 80px !important;
}

.detail-section :deep(.el-descriptions__content) {
  font-size: 12px !important;
}

/* 分页（统一风格：与模拟任务页面一致） */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
  background: white;
  border-radius: 0 0 8px 8px;
}
</style>
