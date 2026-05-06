<template>
  <div class="simulation-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="140px"
      label-position="left"
      size="default"
    >
      <!-- 任务名称 -->
      <el-form-item label="任务名称" prop="jobName" required>
        <el-input
          v-model="form.jobName"
          placeholder="请输入模拟任务名称"
          clearable
          @change="validateJobName"
        />
        <div class="form-tip">用于标识模拟任务的名称</div>
      </el-form-item>

      <!-- 任务说明 -->
      <el-form-item label="任务说明" prop="description" required>
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入计算任务的说明，描述任务的目的、意义、背景等"
        />
      </el-form-item>

      <!-- 电解液配方 -->
      <el-form-item label="电解液配方" prop="systemId">
        <div style="display: flex; gap: 10px;">
          <el-select
            v-model="form.systemId"
            placeholder="选择已保存的电解液配方"
            style="flex: 1;"
            clearable
            filterable
          >
            <el-option-group
              v-for="group in groupedSystems"
              :key="group.label"
              :label="group.label"
            >
              <el-option
                v-for="system in group.options"
                :key="system.id"
                :label="`${system.name} - ${system.saltFormula || '无盐'}`"
                :value="system.id"
              />
            </el-option-group>
          </el-select>
          <el-button
            type="primary"
            plain
            @click="showCreateSystemDialog = true"
            icon="el-icon-plus"
          >
            新建配方
          </el-button>
        </div>
        <div class="form-tip">请选择一个已保存的电解液配方，或点击新建配方创建</div>
      </el-form-item>

      <!-- 配方参数 - 只在选择配方后显示 -->
      <template v-if="form.systemId || selectedSystem">
        <el-divider content-position="left">配方参数</el-divider>

        <el-form-item label="锂盐种类" required>
          <el-select v-model="form.saltType" style="width: 100%;">
            <el-option label="六氟磷酸锂 (LiPF₆)" value="LiPF6" />
            <el-option label="双氟磺酰亚胺锂 (LiFSI)" value="LiFSI" />
            <el-option label="双三氟甲磺酰亚胺锂 (LiTFSI)" value="LiTFSI" />
            <el-option label="氯化钠 (NaCl)" value="NaCl" />
          </el-select>
        </el-form-item>

        <el-form-item label="溶剂类型" required>
          <el-select v-model="form.solventType" style="width: 100%;">
            <el-option label="EC/DMC 混合" value="EC_DMC" />
            <el-option label="纯 EC" value="EC" />
            <el-option label="纯 DMC" value="DMC" />
            <el-option label="EC/EMC 混合" value="EC_EMC" />
          </el-select>
        </el-form-item>

        <el-form-item label="盐浓度 (mol/L)" required>
          <div class="param-row" style="max-width: 300px;">
            <el-input-number
              v-model="form.concentration"
              :min="0"
              :step="0.1"
              :precision="2"
            />
            <span class="unit">mol/L</span>
          </div>
        </el-form-item>

        <el-form-item label="EC比例 (%)">
          <div class="param-row" style="max-width: 300px;">
            <el-input-number
              v-model="form.ecRatio"
              :min="0"
              :max="100"
              :step="1"
              :precision="0"
            />
            <span class="unit">%</span>
          </div>
        </el-form-item>

        <el-form-item label="DMC比例 (%)">
          <div class="param-row" style="max-width: 300px;">
            <el-input-number
              v-model="form.dmcRatio"
              :min="0"
              :max="100"
              :step="1"
              :precision="0"
            />
            <span class="unit">%</span>
          </div>
        </el-form-item>

        <el-form-item label="温度 (K)" required>
          <div class="param-row" style="max-width: 300px;">
            <el-input-number
              v-model="form.temperature"
              :min="0"
              :step="10"
              :precision="2"
            />
            <span class="unit">K</span>
          </div>
        </el-form-item>

        <el-form-item label="压力 (bar)">
          <div class="param-row" style="max-width: 300px;">
            <el-input-number
              v-model="form.pressure"
              :min="0"
              :step="0.1"
              :precision="2"
            />
            <span class="unit">bar</span>
          </div>
        </el-form-item>

      </template>

      <el-divider content-position="left">高级选项</el-divider>

      <!-- 参数配置 -->
      <el-form-item label="额外参数">
        <div style="margin-bottom: 10px;">
          <el-button
            type="text"
            size="small"
            @click="showAdvancedParams = !showAdvancedParams"
            icon="el-icon-setting"
          >
            {{ showAdvancedParams ? '隐藏高级参数' : '显示高级参数' }}
          </el-button>
        </div>

        <el-input
          v-if="showAdvancedParams"
          v-model="form.parameters"
          type="textarea"
          :rows="6"
          placeholder="请输入JSON格式的额外参数（可选）"
          resize="none"
          @blur="validateJSON"
        />
        <div v-else class="params-summary">
          <span v-if="form.parameters && form.parameters !== '{}'">
            已配置 {{ paramCount }} 个额外参数
          </span>
          <span v-else style="color: #909399;">
            使用默认参数
          </span>
        </div>
        <div class="form-tip">可配置能量最小化步数、采样间隔等高级参数</div>
      </el-form-item>

      <!-- 预计用时 -->
      <el-form-item label="预计用时">
        <div class="time-estimate">
          <el-tag :type="timeEstimateType">
            <!-- {{ estimatedTime }} -->
              3小时
          </el-tag>
        </div>
      </el-form-item>

      <!-- 表单操作 -->
      <el-form-item>
        <el-button
          type="primary"
          @click="submitForm"
          :loading="submitting"
          :disabled="!formValid"
          icon="el-icon-video-play"
        >
          提交模拟
        </el-button>
        <el-button @click="resetForm" icon="el-icon-refresh">
          重置
        </el-button>
        <el-button @click="$emit('cancel')" icon="el-icon-close">
          取消
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 创建电解液配方对话框 -->
    <el-dialog
      v-model="showCreateSystemDialog"
      title="新建电解液配方"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="systemFormRef"
        :model="newSystem"
        label-width="120px"
        size="small"
      >
        <el-form-item label="配方名称" prop="name" required>
          <el-input v-model="newSystem.name" placeholder="如：LiPF6 1M in EC/DMC 1:1" />
        </el-form-item>

        <el-form-item label="锂盐种类" prop="saltFormula" required>
          <el-select v-model="newSystem.saltFormula" style="width: 100%;">
            <el-option label="LiPF₆" value="LiPF6" />
            <el-option label="LiFSI" value="LiFSI" />
            <el-option label="LiTFSI" value="LiTFSI" />
            <el-option label="NaCl" value="NaCl" />
          </el-select>
        </el-form-item>

        <el-form-item label="溶剂类型" required>
          <el-select v-model="newSystem.solventType" style="width: 100%;">
            <el-option label="EC/DMC 混合" value="EC_DMC" />
            <el-option label="纯 EC" value="EC" />
            <el-option label="纯 DMC" value="DMC" />
            <el-option label="EC/EMC 混合" value="EC_EMC" />
            <el-option label="水" value="WATER" />
            <el-option label="其他" value="OTHER" />
          </el-select>
        </el-form-item>

        <el-form-item label="浓度 (mol/L)" required>
          <div class="param-row" style="max-width: 300px;">
            <el-input-number
              v-model="newSystem.concentration"
              :min="0"
              :step="0.1"
              :precision="2"
            />
            <span class="unit">mol/L</span>
          </div>
        </el-form-item>

        <el-form-item label="温度 (K)" required>
          <div class="param-row" style="max-width: 300px;">
            <el-input-number
              v-model="newSystem.temperature"
              :min="0"
              :step="10"
              :precision="2"
            />
            <span class="unit">K</span>
          </div>
        </el-form-item>

        <el-form-item label="压力 (bar)">
          <div class="param-row" style="max-width: 300px;">
            <el-input-number
              v-model="newSystem.pressure"
              :min="0"
              :step="0.1"
              :precision="2"
            />
            <span class="unit">bar</span>
          </div>
        </el-form-item>

        <el-form-item label="EC比例 (%)">
          <div class="param-row" style="max-width: 300px;">
            <el-input-number
              v-model="newSystem.ecRatio"
              :min="0"
              :max="100"
              :step="1"
              :precision="0"
            />
            <span class="unit">%</span>
          </div>
        </el-form-item>

        <el-form-item label="DMC比例 (%)">
          <div class="param-row" style="max-width: 300px;">
            <el-input-number
              v-model="newSystem.dmcRatio"
              :min="0"
              :max="100"
              :step="1"
              :precision="0"
            />
            <span class="unit">%</span>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateSystemDialog = false">取消</el-button>
        <el-button type="primary" @click="createSystem">保存配方</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { simulationApi, systemApi } from '../api.js'

export default {
  name: 'SimulationForm',
  emits: ['submit', 'cancel'],
  data() {
    return {
      // 表单数据
      form: {
        jobName: '',
        description: '',
        computingUnit: '',
        systemId: null,
        // 配方组成
        saltType: 'LiPF6',
        solventType: 'EC_DMC',
        concentration: 1.0,
        ecRatio: 50,
        dmcRatio: 50,
        temperature: 298.15,
        pressure: 1.0,
        // 高级参数
        parameters: '{}',
      },

      // 表单验证规则
      rules: {
        jobName: [
          { required: true, message: '请输入任务名称', trigger: 'blur' },
          { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '请输入任务说明', trigger: 'blur' }
        ],
        systemId: [
          { required: true, message: '请选择电解液配方', trigger: 'change' }
        ],
        saltType: [
          { required: true, message: '请选择锂盐种类', trigger: 'change' }
        ],
        solventType: [
          { required: true, message: '请选择溶剂类型', trigger: 'change' }
        ],
        concentration: [
          { required: true, message: '请设置盐浓度', trigger: 'blur' }
        ],
        temperature: [
          { required: true, message: '请设置温度', trigger: 'blur' }
        ]
      },

      // 状态
      submitting: false,
      systems: [],
      showAdvancedParams: false,
      showCreateSystemDialog: false,

      // 新建电解液配方表单
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

      // 缓存已存在的任务名称，避免重复
      existingJobNames: []
    }
  },

  computed: {
    // 系统分组
    groupedSystems() {
      const groups = [
        { label: '锂离子电池', options: [] },
        { label: '钠离子电池', options: [] },
        { label: '水系电解液', options: [] },
        { label: '其他配方', options: [] }
      ]

      this.systems.forEach(system => {
        const salt = system.saltFormula || ''
        let group

        if (salt.includes('Li')) {
          group = groups[0]
        } else if (salt.includes('Na')) {
          group = groups[1]
        } else if (salt.includes('Na')) {
          group = groups[2]
        } else {
          group = groups[3]
        }

        group.options.push(system)
      })

      return groups.filter(group => group.options.length > 0)
    },

    // 参数数量
    paramCount() {
      try {
        const params = JSON.parse(this.form.parameters)
        return Object.keys(params).length
      } catch {
        return 0
      }
    },

    // 估算总步数 - 使用默认模拟参数
    totalSteps() {
      return Math.round(10 * 1000 / 0.001)
    },

    // 时间估算 - 使用默认模拟参数
    estimatedTime() {
      // 使用中等体系大小估算，默认值
      const baseHours = 10 * 3 / 5

      if (baseHours < 1) {
        return `预计约 ${Math.round(baseHours * 60)} 分钟`
      } else if (baseHours < 24) {
        return `预计约 ${Math.round(baseHours)} 小时`
      } else {
        return `预计约 ${Math.round(baseHours / 24)} 天`
      }
    },

    timeEstimateType() {
      return 'warning'
    },

    // 获取选中的配方
    selectedSystem() {
      if (!this.form.systemId) return null
      return this.systems.find(s => s.id === this.form.systemId)
    },

    // 表单是否有效
    formValid() {
      return this.form.jobName &&
             this.form.systemId &&
             this.form.saltType &&
             this.form.solventType &&
             this.form.concentration &&
             this.form.temperature &&
             !this.existingJobNames.includes(this.form.jobName.trim())
    }
  },

  mounted() {
    this.loadSystems()
    this.loadExistingJobNames()
  },

  watch: {
    // 监听配方选择变化，自动填充配方参数
    'form.systemId': {
      handler(newVal) {
        if (newVal) {
          const selected = this.systems.find(s => s.id === newVal)
          if (selected) {
            // 从选中的配方填充表单参数
            this.form.saltType = selected.saltFormula || 'LiPF6'
            // 溶剂类型映射：后端格式 "EC/DMC" -> 前端格式 "EC_DMC"
            this.form.solventType = this.mapSolventType(selected.solventType)
            this.form.concentration = selected.concentration || 1.0
            this.form.temperature = selected.temperature || 298.15
            this.form.pressure = selected.pressure || 1.0
            this.form.ecRatio = selected.ecRatio || 50
            this.form.dmcRatio = selected.dmcRatio || 50
          }
        }
      },
      immediate: true
    }
  },

  methods: {
    // 溶剂类型映射：后端格式转前端格式
    mapSolventType(backendType) {
      if (!backendType) return 'EC_DMC'
      // 处理后端返回的格式，如 "EC/DMC" -> "EC_DMC"
      const typeMap = {
        'EC/DMC': 'EC_DMC',
        'EC/EMC': 'EC_EMC',
        'EC': 'EC',
        'DMC': 'DMC',
        'WATER': 'WATER',
        'OTHER': 'OTHER'
      }
      return typeMap[backendType] || backendType.replace('/', '_')
    },

    // 加载配方列表
    async loadSystems() {
      try {
        const response = await systemApi.getAll()
        this.systems = response.data || []
      } catch (error) {
        console.error('加载配方列表失败:', error)
        this.$message.error('加载配方列表失败')
      }
    },

    // 加载已存在的任务名称
    async loadExistingJobNames() {
      try {
        const response = await simulationApi.getAll()
        const jobs = response.data || []
        this.existingJobNames = jobs.map(job => job.jobName.trim())
      } catch (error) {
        console.error('加载任务列表失败:', error)
      }
    },

    // 验证任务名称是否重复
    validateJobName() {
      const name = this.form.jobName.trim()
      if (this.existingJobNames.includes(name)) {
        this.$message.warning('任务名称已存在，请使用其他名称')
      }
    },

    // 加载模板
    async loadTemplate() {
      try {
        const response = await simulationApi.getTemplate('LAMMPS')
        this.form.parameters = JSON.stringify({
          ...JSON.parse(this.form.parameters),
          template: response.data
        }, null, 2)
        this.$message.success('模板加载成功')
      } catch (error) {
        console.error('加载模板失败:', error)
        this.$message.error('加载模板失败')
      }
    },

    // 验证JSON格式
    validateJSON() {
      try {
        if (this.form.parameters && this.form.parameters.trim()) {
          JSON.parse(this.form.parameters)
        }
      } catch (error) {
        this.$message.error('JSON格式错误，请检查参数格式')
        return false
      }
      return true
    },

    // 创建新配方
    async createSystem() {
      // 检查溶剂比例总和为100%（当溶剂类型是混合时）
      if (this.newSystem.solventType.includes('_')) {
        const total = (this.newSystem.ecRatio || 0) + (this.newSystem.dmcRatio || 0)
        if (total !== 100) {
          this.$message.warning(`当前溶剂比例总和为 ${total}%，建议调整为 100%`)
        }
      }

      try {
        const response = await systemApi.create(this.newSystem)
        this.systems.push(response.data)
        this.form.systemId = response.data.id

        this.showCreateSystemDialog = false
        this.$message.success('电解液配方保存成功')

        // 重置新建配方表单
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
      } catch (error) {
        console.error('创建配方失败:', error)
        this.$message.error('创建配方失败: ' + (error.response?.data?.message || error.message))
      }
    },

    // 提交表单
    async submitForm() {
      // 验证表单
      if (!this.$refs.formRef) {
        await this.$nextTick()
      }

      if (!this.$refs.formRef) {
        this.$message.error('表单验证失败')
        return
      }

      const valid = await this.$refs.formRef.validate()
      if (!valid) {
        this.$message.error('请检查表单输入')
        return
      }

      // 验证任务名称是否重复
      if (this.existingJobNames.includes(this.form.jobName.trim())) {
        this.$message.error('任务名称已存在，请使用其他名称')
        return
      }

      // 验证JSON格式
      if (!this.validateJSON()) {
        return
      }

      // 检查溶剂比例总和为100%（当溶剂类型是混合时）
      if (this.form.solventType.includes('_')) {
        const total = (this.form.ecRatio || 0) + (this.form.dmcRatio || 0)
        if (total !== 100) {
          this.$message.warning(`当前溶剂比例总和为 ${total}%，建议调整为 100%`)
        }
      }

      // 准备表单数据
      const formData = {
        jobName: this.form.jobName.trim(),
        description: this.form.description,
        computingUnit: this.form.computingUnit,
        software: 'LAMMPS', // 固定使用LAMMPS
        hardwareUsed: 'GPU', // 固定使用GPU加速
        systemId: this.form.systemId,
        // 模拟参数
        parameters: JSON.stringify({
          saltType: this.form.saltType,
          solventType: this.form.solventType,
          concentration: this.form.concentration,
          ecRatio: this.form.ecRatio,
          dmcRatio: this.form.dmcRatio,
          temperature: this.form.temperature,
          pressure: this.form.pressure,
          totalSteps: this.totalSteps,
          ...JSON.parse(this.form.parameters)
        })
      }

      this.submitting = true
      try {
        this.$emit('submit', formData)
      } catch (error) {
        console.error('提交表单失败:', error)
        this.$message.error('提交失败: ' + error.message)
      } finally {
        this.submitting = false
      }
    },

    // 重置表单
    resetForm() {
      if (this.$refs.formRef) {
        this.$refs.formRef.resetFields()
      }
      this.form = {
        jobName: '',
        description: '',
        computingUnit: '',
        systemId: null,
        saltType: 'LiPF6',
        solventType: 'EC_DMC',
        concentration: 1.0,
        ecRatio: 50,
        dmcRatio: 50,
        temperature: 298.15,
        pressure: 1.0,
        parameters: '{}'
      }
      this.$message.success('表单已重置')
    }
  }
}
</script>

<style scoped>
.simulation-form {
  padding: 10px;
  background: white;
  border-radius: 8px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.param-row .unit {
  color: #606266;
  font-size: 14px;
  min-width: 30px;
}

.params-summary {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.time-estimate {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.el-slider {
  margin-top: 10px;
}

.el-divider {
  margin: 20px 0;
}
</style>
