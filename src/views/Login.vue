<template>
  <div class="login-container">
    <!-- 分子动力学背景 -->
    <MolecularBackground
      :temperature="300"
      :max-molecules="15"
    />

    <!-- 主内容区 -->
    <div class="login-content">
      <!-- 品牌区域 -->
      <div class="brand-section">
        <h1 class="brand-title">电池电解液配方计算平台</h1>
        <p class="brand-subtitle">Battery Electrolyte Formulation Platform</p>
      </div>

      <!-- 登录卡片 -->
      <div class="login-card">
        <div class="card-header">
          <span class="card-label">SIGN IN</span>
        </div>

        <el-form ref="loginFormRef" :model="loginForm" :rules="rules" label-width="0">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                class="login-input"
              />
            </el-form-item>
          </div>

          <div class="form-group">
            <label class="form-label">密码</label>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                class="login-input"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
          </div>

          <el-form-item class="button-item">
            <el-button
              type="primary"
              size="large"
              class="login-button"
              :loading="loading"
              @click="handleLogin"
            >
              <span class="button-text">登录</span>
            </el-button>
          </el-form-item>

          <div class="card-footer">
            <span class="footer-text">还没有账号？</span>
            <el-button type="text" class="register-btn" @click="showRegister = true">
              立即注册
            </el-button>
          </div>
        </el-form>
      </div>

      <!-- 底部版权 -->
      <p class="copyright">© 2026 Battery Electrolyte Formulation Platform</p>
    </div>

    <!-- 注册对话框 -->
    <el-dialog v-model="showRegister" title="用户注册" width="420px" class="register-dialog">
      <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="registerForm.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="组织" prop="organization">
          <el-input v-model="registerForm.organization" placeholder="请输入所属组织" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRegister = false">取消</el-button>
        <el-button type="primary" :loading="registerLoading" @click="handleRegister">注册</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '../api.js'
import MolecularBackground from '../components/MolecularBackground.vue'

export default {
  name: 'Login',
  components: {
    MolecularBackground
  },
  setup() {
    const router = useRouter()
    const loginFormRef = ref(null)
    const registerFormRef = ref(null)
    const loading = ref(false)
    const registerLoading = ref(false)
    const showRegister = ref(false)

    const loginForm = reactive({
      username: 'admin',
      password: 'admin123'
    })

    const registerForm = reactive({
      username: '',
      password: '',
      confirmPassword: '',
      realName: '',
      email: '',
      organization: ''
    })

    const rules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }

    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    const registerRules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' }
      ],
      email: [
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ]
    }

    const handleLogin = async () => {
      if (!loginFormRef.value) return

      try {
        await loginFormRef.value.validate()
      } catch {
        return
      }

      loading.value = true

      try {
        const response = await authApi.login(loginForm)
        if (response.data.success) {
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('user', JSON.stringify(response.data.user))

          ElMessage.success('登录成功')
          router.push('/dashboard')
        } else {
          ElMessage.error(response.data.message || '登录失败')
        }
      } catch (error) {
        ElMessage.error('登录失败，请检查网络连接')
      } finally {
        loading.value = false
      }
    }

    const handleRegister = async () => {
      if (!registerFormRef.value) return

      try {
        await registerFormRef.value.validate()
      } catch {
        return
      }

      registerLoading.value = true

      try {
        const response = await authApi.register({
          username: registerForm.username,
          password: registerForm.password,
          realName: registerForm.realName,
          email: registerForm.email,
          organization: registerForm.organization
        })

        if (response.data.success) {
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('user', JSON.stringify(response.data.user))

          ElMessage.success('注册成功')
          showRegister.value = false
          router.push('/dashboard')
        } else {
          ElMessage.error(response.data.message || '注册失败')
        }
      } catch (error) {
        ElMessage.error('注册失败，请检查网络连接')
      } finally {
        registerLoading.value = false
      }
    }

    return {
      loginFormRef,
      registerFormRef,
      loginForm,
      registerForm,
      rules,
      registerRules,
      loading,
      registerLoading,
      showRegister,
      handleLogin,
      handleRegister
    }
  }
}
</script>

<style scoped>
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
}

.login-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}

/* 品牌区域 */
.brand-section {
  text-align: center;
  animation: fadeInDown 0.6s ease-out;
}

.brand-title {
  font-size: 34px;
  font-weight: 300;
  color: #0f172a;
  margin: 0 0 10px 0;
  letter-spacing: 6px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.brand-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 0;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-weight: 400;
}

/* 登录卡片 - 极简高级风格 */
.login-card {
  width: 380px;
  padding: 40px 36px 32px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: none;
  border-radius: 4px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 40px rgba(0, 0, 0, 0.06);
  animation: fadeInUp 0.6s ease-out 0.15s both;
}

.card-header {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.card-label {
  font-size: 15px;
  font-weight: 500;
  color: #94a3b8;
  letter-spacing: 3px;
  text-transform: uppercase;
}

/* 表单组 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
}

/* 输入框 - 简约风格 */
.login-input :deep(.el-input__wrapper) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: none;
  transition: all 0.2s ease;
  padding: 4px 12px;
}

.login-input :deep(.el-input__wrapper:hover) {
  border-color: #cbd5e1;
  background: #fff;
}

.login-input :deep(.el-input__wrapper.is-focus) {
  border-color: #0f172a;
  background: #fff;
  box-shadow: none;
}

.login-input :deep(.el-input__inner) {
  color: #0f172a;
  font-size: 15px;
  font-weight: 400;
}

.login-input :deep(.el-input__inner::placeholder) {
  color: #94a3b8;
  font-weight: 400;
}

/* 按钮 */
.button-item {
  margin-top: 28px;
  margin-bottom: 0;
}

.login-button {
  width: 100%;
  height: 50px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 1px;
  border-radius: 4px;
  background: #0f172a;
  border: none;
  transition: all 0.2s ease;
}

.button-text {
  letter-spacing: 2px;
  text-transform: uppercase;
}

.login-button:hover {
  background: #1e293b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
}

/* 卡片底部 */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
  border-top: 1px solid #f1f5f9;
}

.footer-text {
  font-size: 14px;
  color: #94a3b8;
}

.register-btn {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
  padding: 0;
}

.register-btn:hover {
  color: #0f172a;
}

/* 底部版权 */
.copyright {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  letter-spacing: 1px;
  animation: fadeIn 0.6s ease-out 0.3s both;
}

/* 动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    width: 340px;
    padding: 32px 28px 24px;
  }

  .brand-title {
    font-size: 26px;
    letter-spacing: 4px;
  }

  .brand-subtitle {
    font-size: 11px;
  }
}

/* 注册对话框样式 */
:deep(.el-dialog) {
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: none;
  border-radius: 4px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.1);
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #f1f5f9;
  padding: 20px 24px;
}

:deep(.el-dialog__title) {
  color: #0f172a;
  font-weight: 500;
  font-size: 15px;
  letter-spacing: 0.5px;
}

:deep(.el-dialog__body) {
  padding: 28px 24px;
}

:deep(.el-dialog__footer) {
  border-top: 1px solid #f1f5f9;
  padding: 16px 24px;
}

:deep(.el-form-item__label) {
  color: #475569;
  font-size: 13px;
  font-weight: 500;
}

:deep(.el-dialog .el-input__wrapper) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: none;
}

:deep(.el-dialog .el-input__wrapper:hover) {
  border-color: #cbd5e1;
}

:deep(.el-dialog .el-input__wrapper.is-focus) {
  border-color: #0f172a;
  box-shadow: none;
}

:deep(.el-dialog .el-input__inner) {
  color: #0f172a;
}

:deep(.el-dialog .el-input__inner::placeholder) {
  color: #94a3b8;
}

/* 表单验证错误样式 */
.login-input :deep(.el-form-item__error) {
  font-size: 11px;
  padding-top: 4px;
}
</style>
