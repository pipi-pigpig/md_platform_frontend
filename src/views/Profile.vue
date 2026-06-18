<template>
  <div class="profile">
    <p style="color: #909399; margin-bottom: 20px;">查看和管理您的个人基本信息</p>

    <!-- 基本信息卡片 -->
    <el-card shadow="hover" style="margin-bottom: 20px;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 16px; font-weight: 500;">基本信息</span>
          <el-button
            v-if="!isEditing"
            type="primary"
            size="small"
            @click="startEditing"
          >
            编辑信息
          </el-button>
          <div v-else style="display: flex; gap: 10px;">
            <el-button size="small" @click="cancelEditing">取消</el-button>
            <el-button type="primary" size="small" :loading="saving" @click="saveProfile">保存</el-button>
          </div>
        </div>
      </template>

      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="profileRules"
        label-width="100px"
        label-position="right"
      >
        <el-row :gutter="40">
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input :value="userInfo.username" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input :value="userInfo.email" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="40">
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input
                v-if="isEditing"
                v-model="profileForm.realName"
                placeholder="请输入真实姓名"
                maxlength="50"
              />
              <span v-else class="field-value">{{ userInfo.realName || '--' }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属单位" prop="organization">
              <el-input
                v-if="isEditing"
                v-model="profileForm.organization"
                placeholder="请输入所属单位/院校"
                maxlength="200"
              />
              <span v-else class="field-value">{{ userInfo.organization || '--' }}</span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="40">
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input
                v-if="isEditing"
                v-model="profileForm.phone"
                placeholder="请输入联系电话"
                maxlength="20"
              />
              <span v-else class="field-value">{{ userInfo.phone || '--' }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户ID">
              <span class="field-value">{{ userInfo.userId || '--' }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 账号信息卡片 -->
    <el-card shadow="hover">
      <template #header>
        <span style="font-size: 16px; font-weight: 500;">账号信息</span>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="账号创建时间">
          {{ formatDate(userInfo.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="最后登录时间">
          {{ formatDate(userInfo.lastLoginTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="用户角色">
          {{ getRoleName(userInfo.roleId) }}
        </el-descriptions-item>
        <el-descriptions-item label="账号状态">
          <el-tag :type="userInfo.status === 1 ? 'success' : 'danger'" size="small">
            {{ userInfo.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { userApi } from '../api.js'

export default {
  name: 'Profile',
  setup() {
    const profileFormRef = ref(null)
    const isEditing = ref(false)
    const saving = ref(false)
    const loading = ref(false)

    const userInfo = reactive({
      userId: '',
      username: '',
      email: '',
      realName: '',
      organization: '',
      phone: '',
      roleId: null,
      status: null,
      createTime: '',
      lastLoginTime: ''
    })

    const profileForm = reactive({
      realName: '',
      organization: '',
      phone: ''
    })

    const validatePhone = (rule, value, callback) => {
      if (value && !/^1[3-9]\d{9}$/.test(value) && !/^\d{3,4}-?\d{7,8}$/.test(value)) {
        callback(new Error('请输入正确的手机号或固定电话'))
      } else {
        callback()
      }
    }

    const profileRules = {
      realName: [
        { max: 50, message: '真实姓名不超过50个字符', trigger: 'blur' }
      ],
      organization: [
        { max: 200, message: '所属单位不超过200个字符', trigger: 'blur' }
      ],
      phone: [
        { validator: validatePhone, trigger: 'blur' }
      ]
    }

    const loadProfile = async () => {
      loading.value = true
      try {
        const response = await userApi.getMe()
        const data = response.data
        Object.assign(userInfo, {
          userId: data.userId,
          username: data.username,
          email: data.email,
          realName: data.realName,
          organization: data.organization,
          phone: data.phone,
          roleId: data.roleId,
          status: data.status,
          createTime: data.createTime,
          lastLoginTime: data.lastLoginTime
        })
      } catch (error) {
        if (!error.silent) {
          ElMessage.error('加载个人信息失败')
        }
      } finally {
        loading.value = false
      }
    }

    const startEditing = () => {
      profileForm.realName = userInfo.realName || ''
      profileForm.organization = userInfo.organization || ''
      profileForm.phone = userInfo.phone || ''
      isEditing.value = true
    }

    const cancelEditing = () => {
      isEditing.value = false
      if (profileFormRef.value) {
        profileFormRef.value.clearValidate()
      }
    }

    const saveProfile = async () => {
      if (!profileFormRef.value) return

      try {
        await profileFormRef.value.validate()
      } catch {
        return
      }

      saving.value = true
      try {
        const response = await userApi.updateMe({
          realName: profileForm.realName,
          organization: profileForm.organization,
          phone: profileForm.phone
        })

        if (response.data && response.data.success) {
          // 后端响应只返回 {success, message}，用表单值更新本地状态
          Object.assign(userInfo, {
            realName: profileForm.realName,
            organization: profileForm.organization,
            phone: profileForm.phone
          })

          const userStr = localStorage.getItem('user')
          if (userStr) {
            const storedUser = JSON.parse(userStr)
            storedUser.realName = profileForm.realName
            storedUser.organization = profileForm.organization
            storedUser.phone = profileForm.phone
            localStorage.setItem('user', JSON.stringify(storedUser))
          }

          isEditing.value = false
          ElMessage.success('个人信息更新成功')
        } else {
          ElMessage.error(response.data?.message || '更新个人信息失败')
        }
      } catch (error) {
        if (!error.silent) {
          if (error.response?.data?.message) {
            ElMessage.error(error.response.data.message)
          } else {
            ElMessage.error('更新个人信息失败')
          }
        }
      } finally {
        saving.value = false
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '--'
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN')
    }

    const getRoleName = (roleId) => {
      if (roleId === 1) return '管理员'
      if (roleId === 2) return '普通用户'
      return roleId ? `角色${roleId}` : '--'
    }

    onMounted(() => {
      loadProfile()
    })

    return {
      profileFormRef,
      isEditing,
      saving,
      loading,
      userInfo,
      profileForm,
      profileRules,
      startEditing,
      cancelEditing,
      saveProfile,
      formatDate,
      getRoleName
    }
  }
}
</script>

<style scoped>
.profile {
  padding: 20px;
}

.field-value {
  font-size: 14px;
  color: #303133;
  line-height: 32px;
}

:deep(.el-form-item__label) {
  color: #606266;
  font-weight: 500;
}

:deep(.el-descriptions__label) {
  width: 120px;
  font-weight: 500;
}
</style>
