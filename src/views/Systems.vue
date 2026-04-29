<template>
  <div class="systems">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>电解液配方管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <i class="el-icon-plus"></i> 新建配方
      </el-button>
    </div>

    <!-- 搜索筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索配方名称、锂盐种类、溶剂类型..."
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
        <el-option label="六氟磷酸锂" value="LiPF6" />
        <el-option label="双氟磺酰亚胺锂" value="LiFSI" />
        <el-option label="双三氟甲磺酰亚胺锂" value="LiTFSI" />
        <el-option label="氯化钠" value="NaCl" />
        <el-option label="其他" value="OTHER" />
      </el-select>

      <el-select
        v-model="solventFilter"
        placeholder="溶剂筛选"
        clearable
        class="filter-select"
        @change="handleFilterChange"
      >
        <el-option label="水" value="WATER" />
        <el-option label="乙腈" value="ACETONITRILE" />
        <el-option label="二甲基亚砜" value="DMSO" />
        <el-option label="乙醇" value="ETHANOL" />
        <el-option label="EC/DMC混合" value="EC_DMC" />
        <el-option label="其他" value="OTHER" />
      </el-select>

      <div class="spacer"></div>
    </div>

    <!-- 创建配方对话框 -->
    <el-dialog v-model="showCreateDialog" title="新建电解液配方" width="500px">
      <el-form :model="newSystem" label-width="120px">
        <el-form-item label="配方名称" required>
          <el-input v-model="newSystem.name" placeholder="例如：LiPF6 1M in EC/DMC" />
        </el-form-item>

        <el-form-item label="锂盐种类" required>
          <el-select v-model="newSystem.saltFormula" style="width: 100%;">
            <el-option label="六氟磷酸锂" value="LiPF6" />
            <el-option label="双氟磺酰亚胺锂" value="LiFSI" />
            <el-option label="双三氟甲磺酰亚胺锂" value="LiTFSI" />
            <el-option label="氯化钠" value="NaCl" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item label="溶剂类型" required>
          <el-select v-model="newSystem.solventType" style="width: 100%;">
            <el-option label="水" value="WATER" />
            <el-option label="乙腈" value="ACETONITRILE" />
            <el-option label="二甲基亚砜" value="DMSO" />
            <el-option label="乙醇" value="ETHANOL" />
            <el-option label="EC/DMC混合" value="EC_DMC" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item label="盐浓度 (mol/L)">
          <el-input-number v-model="newSystem.concentration" :min="0" :step="0.1" />
        </el-form-item>

        <el-form-item label="温度 (K)">
          <el-input-number v-model="newSystem.temperature" :min="0" :step="10" />
        </el-form-item>

        <el-form-item label="压力 (bar)">
          <el-input-number v-model="newSystem.pressure" :min="0" :step="0.1" />
        </el-form-item>

        <el-form-item label="EC比例 (%)" v-if="newSystem.solventType === 'EC_DMC'">
          <el-input-number v-model="newSystem.ecRatio" :min="0" :max="100" :step="5" />
        </el-form-item>

        <el-form-item label="DMC比例 (%)" v-if="newSystem.solventType === 'EC_DMC'">
          <el-input-number v-model="newSystem.dmcRatio" :min="0" :max="100" :step="5" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createSystem">创建</el-button>
      </template>
    </el-dialog>

    <!-- 编辑配方对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑电解液配方" width="500px">
      <el-form :model="editingSystem" label-width="120px">
        <el-form-item label="配方名称" required>
          <el-input v-model="editingSystem.name" placeholder="例如：LiPF6 1M in EC/DMC" />
        </el-form-item>

        <el-form-item label="锂盐种类" required>
          <el-select v-model="editingSystem.saltFormula" style="width: 100%;">
            <el-option label="六氟磷酸锂" value="LiPF6" />
            <el-option label="双氟磺酰亚胺锂" value="LiFSI" />
            <el-option label="双三氟甲磺酰亚胺锂" value="LiTFSI" />
            <el-option label="氯化钠" value="NaCl" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item label="溶剂类型" required>
          <el-select v-model="editingSystem.solventType" style="width: 100%;">
            <el-option label="水" value="WATER" />
            <el-option label="乙腈" value="ACETONITRILE" />
            <el-option label="二甲基亚砜" value="DMSO" />
            <el-option label="乙醇" value="ETHANOL" />
            <el-option label="EC/DMC混合" value="EC_DMC" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item label="盐浓度 (mol/L)">
          <el-input-number v-model="editingSystem.concentration" :min="0" :step="0.1" />
        </el-form-item>

        <el-form-item label="温度 (K)">
          <el-input-number v-model="editingSystem.temperature" :min="0" :step="10" />
        </el-form-item>

        <el-form-item label="压力 (bar)">
          <el-input-number v-model="editingSystem.pressure" :min="0" :step="0.1" />
        </el-form-item>

        <el-form-item label="EC比例 (%)" v-if="editingSystem.solventType === 'EC_DMC'">
          <el-input-number v-model="editingSystem.ecRatio" :min="0" :max="100" :step="5" />
        </el-form-item>

        <el-form-item label="DMC比例 (%)" v-if="editingSystem.solventType === 'EC_DMC'">
          <el-input-number v-model="editingSystem.dmcRatio" :min="0" :max="100" :step="5" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updateSystem">保存</el-button>
      </template>
    </el-dialog>

    <!-- 配方列表 -->
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>配方列表</span>
          <el-button @click="loadSystems" :loading="loading">
            <i class="el-icon-refresh"></i> 刷新
          </el-button>
        </div>
      </template>

      <el-table :data="filteredSystems" v-loading="loading">
        <el-table-column prop="name" label="配方名称" width="200" />
        <el-table-column prop="saltFormula" label="锂盐种类" width="150" />
        <el-table-column prop="solventType" label="溶剂类型" width="120" />
        <el-table-column prop="concentration" label="浓度 (mol/L)" width="120">
          <template #default="scope">
            {{ scope.row.concentration || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="temperature" label="温度 (K)" width="100">
          <template #default="scope">
            {{ scope.row.temperature || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="scope">
            <div class="action-buttons">
              <el-button
                type="primary"
                size="small"
                @click="editSystem(scope.row)"
              >
                修改
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="deleteSystem(scope.row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { systemApi } from '../api.js'

export default {
  name: 'SystemsView',
  data() {
    return {
      loading: false,
      systems: [],
      showCreateDialog: false,
      showEditDialog: false,
      // 搜索筛选
      searchQuery: '',
      saltFilter: '',
      solventFilter: '',
      newSystem: {
        name: '',
        saltFormula: 'LiPF6',
        solventType: 'EC_DMC',
        concentration: 1.0,
        temperature: 298.15,
        pressure: 1.0,
        ecRatio: 50,
        dmcRatio: 50
      },
      editingSystem: {
        id: null,
        name: '',
        saltFormula: 'LiPF6',
        solventType: 'EC_DMC',
        concentration: 1.0,
        temperature: 298.15,
        pressure: 1.0,
        ecRatio: 50,
        dmcRatio: 50
      }
    }
  },
  computed: {
    filteredSystems() {
      return this.systems.filter(system => {
        // 关键词搜索
        if (this.searchQuery) {
          const query = this.searchQuery.toLowerCase()
          const matchesName = system.name.toLowerCase().includes(query)
          const matchesSalt = (system.saltFormula || '').toLowerCase().includes(query)
          const matchesSolvent = (system.solventType || '').toLowerCase().includes(query)
          if (!matchesName && !matchesSalt && !matchesSolvent) {
            return false
          }
        }
        // 锂盐筛选
        if (this.saltFilter && system.saltFormula !== this.saltFilter) {
          return false
        }
        // 溶剂筛选
        if (this.solventFilter && system.solventType !== this.solventFilter) {
          return false
        }
        return true
      })
    }
  },
  mounted() {
    this.loadSystems()
  },
  methods: {
    async loadSystems() {
      this.loading = true
      try {
        const response = await systemApi.getAll()
        this.systems = response.data || []
      } catch (error) {
        console.error('加载配方列表失败:', error)
        this.$message.error('加载配方列表失败')
      } finally {
        this.loading = false
      }
    },

    async createSystem() {
      if (!this.newSystem.name.trim()) {
        this.$message.error('请输入配方名称')
        return
      }

      try {
        await systemApi.create(this.newSystem)
        this.showCreateDialog = false
        this.$message.success('配方创建成功')
        this.newSystem = {
          name: '',
          saltFormula: 'LiPF6',
          solventType: 'EC_DMC',
          concentration: 1.0,
          temperature: 298.15,
          pressure: 1.0,
          ecRatio: 50,
          dmcRatio: 50
        }
        this.loadSystems()
      } catch (error) {
        console.error('创建配方失败:', error)
        this.$message.error('创建配方失败')
      }
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

    editSystem(system) {
      const cachedData = localStorage.getItem('system_edit_' + system.id)
      let cached = null
      if (cachedData) {
        try { cached = JSON.parse(cachedData) } catch(e) {}
      }

      this.editingSystem = {
        id: system.id,
        name: cached?.name ?? system.name,
        saltFormula: cached?.saltFormula ?? system.saltFormula ?? 'LiPF6',
        solventType: cached?.solventType ?? system.solventType ?? 'EC_DMC',
        concentration: cached?.concentration ?? system.concentration ?? 1.0,
        temperature: cached?.temperature ?? system.temperature ?? 298.15,
        pressure: cached?.pressure ?? system.pressure ?? 1.0,
        ecRatio: cached?.ecRatio ?? system.ecRatio ?? 50,
        dmcRatio: cached?.dmcRatio ?? system.dmcRatio ?? 50
      }
      this.showEditDialog = true
    },

    async updateSystem() {
      if (!this.editingSystem.name.trim()) {
        this.$message.error('请输入配方名称')
        return
      }

      try {
        await systemApi.update(this.editingSystem.id, this.editingSystem)
        this.showEditDialog = false
        this.$message.success('配方更新成功')
        localStorage.setItem('system_edit_' + this.editingSystem.id, JSON.stringify({
          name: this.editingSystem.name,
          saltFormula: this.editingSystem.saltFormula,
          solventType: this.editingSystem.solventType,
          concentration: this.editingSystem.concentration,
          temperature: this.editingSystem.temperature,
          pressure: this.editingSystem.pressure,
          ecRatio: this.editingSystem.ecRatio,
          dmcRatio: this.editingSystem.dmcRatio
        }))
        this.loadSystems()
      } catch (error) {
        console.error('更新配方失败:', error)
        this.$message.error('更新配方失败')
      }
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },

    handleFilterChange() {
      // Computed property automatically handles filtering
      // This method is just for explicit event handling
    }
  }
}
</script>

<style scoped>
.systems {
  padding: 20px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-input {
  flex: 1;
  min-width: 280px;
}

.filter-select {
  width: 180px;
}

.spacer {
  flex: 2;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.action-buttons .el-button {
  text-align: center;
  width: 60px !important;
  display: inline-flex !important;
  justify-content: center;
  align-items: center;
}
</style>
