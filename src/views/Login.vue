<template>
  <div class="login-container">
    <MolecularBackground :temperature="300" :max-molecules="15" />

    <div class="login-content">
      <div class="brand-section">
        <h1 class="brand-title">电池电解液配方计算平台</h1>
        <p class="brand-subtitle">Battery Electrolyte Formulation Platform</p>
      </div>

      <div
        class="card-stack"
        :style="stackHeight ? { height: stackHeight + 'px' } : {}"
      >
        <!-- 登录卡片 -->
        <div
          ref="loginCardRef"
          class="card"
          :class="showRegister ? 'card-back' : 'card-front'"
        >
          <div class="card-header">
            <span class="card-label">SIGN IN</span>
          </div>

          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" label-width="0">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <el-form-item prop="username">
                <el-input
                  v-model="loginForm.username"
                  placeholder="请输入用户名"
                  size="large"
                  class="form-input"
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
                  class="form-input"
                  @keyup.enter="handleLogin"
                />
              </el-form-item>
            </div>

            <el-form-item class="button-item">
              <el-button
                type="primary"
                size="large"
                class="submit-button"
                :loading="loginLoading"
                @click="handleLogin"
              >
                <span class="button-text">登录</span>
              </el-button>
            </el-form-item>
          </el-form>

          <div class="card-footer">
            <el-button type="text" class="switch-btn" @click="goForgotPassword">忘记密码</el-button>
            <span class="footer-divider">|</span>
            <span class="footer-text">还没有账号？</span>
            <el-button type="text" class="switch-btn" @click="switchToRegister">立即注册</el-button>
          </div>
        </div>

        <!-- 注册卡片 -->
        <div
          ref="registerCardRef"
          class="card"
          :class="showRegister ? 'card-front' : 'card-back'"
        >
          <div class="card-header">
            <span class="card-label">SIGN UP</span>
          </div>

          <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" label-width="0">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">用户名 <span class="required">*</span></label>
                <el-form-item prop="username">
                  <el-input
                    v-model="registerForm.username"
                    placeholder="字母数字下划线"
                    size="large"
                    class="form-input"
                  />
                </el-form-item>
              </div>
              <div class="form-group">
                <label class="form-label">邮箱 <span class="required">*</span></label>
                <el-form-item prop="email">
                  <el-input
                    v-model="registerForm.email"
                    placeholder="邮箱地址"
                    size="large"
                    class="form-input"
                  />
                </el-form-item>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">密码 <span class="required">*</span></label>
                <el-form-item prop="password">
                  <el-input
                    v-model="registerForm.password"
                    type="password"
                    placeholder="含大小写数字符号"
                    size="large"
                    show-password
                    class="form-input"
                  />
                </el-form-item>
              </div>
              <div class="form-group">
                <label class="form-label">确认密码 <span class="required">*</span></label>
                <el-form-item prop="confirmPassword">
                  <el-input
                    v-model="registerForm.confirmPassword"
                    type="password"
                    placeholder="再次输入密码"
                    size="large"
                    show-password
                    class="form-input"
                  />
                </el-form-item>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">真实姓名</label>
                <el-form-item prop="realName">
                  <el-input
                    v-model="registerForm.realName"
                    placeholder="选填"
                    size="large"
                    class="form-input"
                  />
                </el-form-item>
              </div>
              <div class="form-group">
                <label class="form-label">所属单位</label>
                <el-form-item prop="organization">
                  <el-input
                    v-model="registerForm.organization"
                    placeholder="选填"
                    size="large"
                    class="form-input"
                  />
                </el-form-item>
              </div>
            </div>

            <el-form-item class="button-item">
              <el-button
                type="primary"
                size="large"
                class="submit-button"
                :loading="registerLoading"
                @click="handleRegister"
              >
                <span class="button-text">注册</span>
              </el-button>
            </el-form-item>
          </el-form>

          <div class="card-footer">
            <span class="footer-text">已有账号？</span>
            <el-button type="text" class="switch-btn" @click="switchToLogin">返回登录</el-button>
          </div>
        </div>
      </div>

      <p class="copyright">&copy; 2026 Battery Electrolyte Formulation Platform</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '../api.js'
import MolecularBackground from '../components/MolecularBackground.vue'

export default {
  name: 'Login',
  components: { MolecularBackground },
  setup() {
    const router = useRouter()
    const loginFormRef = ref(null)
    const registerFormRef = ref(null)
    const loginCardRef = ref(null)
    const registerCardRef = ref(null)
    const loginLoading = ref(false)
    const registerLoading = ref(false)
    const showRegister = ref(false)
    const stackHeight = ref(null)

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

    const loginRules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    }

    const validateUsername = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入用户名'))
      } else if (value.length < 4 || value.length > 50) {
        callback(new Error('用户名长度为4-50个字符'))
      } else if (!/^[a-zA-Z0-9_]+$/.test(value)) {
        callback(new Error('用户名仅允许字母、数字和下划线'))
      } else {
        callback()
      }
    }

    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (value.length < 8 || value.length > 32) {
        callback(new Error('密码长度为8-32个字符'))
      } else if (!/[a-z]/.test(value)) {
        callback(new Error('密码需包含小写字母'))
      } else if (!/[A-Z]/.test(value)) {
        callback(new Error('密码需包含大写字母'))
      } else if (!/[0-9]/.test(value)) {
        callback(new Error('密码需包含数字'))
      } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
        callback(new Error('密码需包含特殊符号'))
      } else {
        if (registerForm.confirmPassword) {
          registerFormRef.value.validateField('confirmPassword')
        }
        callback()
      }
    }

    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请确认密码'))
      } else if (value !== registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    const registerRules = {
      username: [{ validator: validateUsername, trigger: 'blur' }],
      password: [{ validator: validatePassword, trigger: 'blur' }],
      confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ],
      realName: [
        { max: 50, message: '真实姓名不超过50个字符', trigger: 'blur' }
      ],
      organization: [
        { max: 200, message: '所属单位不超过200个字符', trigger: 'blur' }
      ]
    }

    const updateStackHeight = () => {
      nextTick(() => {
        const activeCard = showRegister.value
          ? registerCardRef.value
          : loginCardRef.value
        if (activeCard) {
          stackHeight.value = activeCard.offsetHeight
        }
      })
    }

    const switchToRegister = () => {
      showRegister.value = true
      updateStackHeight()
    }

    const switchToLogin = () => {
      showRegister.value = false
      updateStackHeight()
    }

    const goForgotPassword = () => {
      router.push('/forgot-password')
    }

    const handleLogin = async () => {
      if (!loginFormRef.value) return

      try {
        await loginFormRef.value.validate()
      } catch {
        return
      }

      loginLoading.value = true

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
        loginLoading.value = false
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
          ElMessage.success('注册成功，请登录')
          showRegister.value = false
          updateStackHeight()
        } else {
          ElMessage.error(response.data.message || '注册失败')
        }
      } catch (error) {
        if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message)
        } else {
          ElMessage.error('注册失败，请检查网络连接')
        }
      } finally {
        registerLoading.value = false
      }
    }

    onMounted(() => {
      updateStackHeight()
    })

    watch(showRegister, () => {
      updateStackHeight()
    })

    return {
      showRegister,
      stackHeight,
      loginFormRef,
      registerFormRef,
      loginCardRef,
      registerCardRef,
      loginForm,
      registerForm,
      loginRules,
      registerRules,
      loginLoading,
      registerLoading,
      handleLogin,
      handleRegister,
      switchToRegister,
      switchToLogin,
      goForgotPassword
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

/* ========== 卡片抽叠 ========== */
.card-stack {
  position: relative;
  width: 460px;
  transition: height 0.55s cubic-bezier(0.23, 1, 0.32, 1);
}

.card {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 36px 36px 28px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: none;
  border-radius: 4px;
  transition:
    transform 0.55s cubic-bezier(0.23, 1, 0.32, 1),
    opacity 0.45s cubic-bezier(0.23, 1, 0.32, 1),
    filter 0.45s cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 0.55s cubic-bezier(0.23, 1, 0.32, 1);
}

.card-front {
  transform: translate(0, 0) scale(1);
  opacity: 1;
  filter: blur(0);
  z-index: 2;
  pointer-events: auto;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 40px rgba(0, 0, 0, 0.06);
}

.card-back {
  transform: translate(16px, 12px) scale(0.95);
  opacity: 0;
  filter: blur(6px);
  z-index: 1;
  pointer-events: none;
  box-shadow: none;
}

/* ========== 卡片内部 ========== */
.card-header {
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e2e8f0;
}

.card-label {
  font-size: 15px;
  font-weight: 500;
  color: #94a3b8;
  letter-spacing: 3px;
  text-transform: uppercase;
}

.form-group {
  margin-bottom: 16px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #334155;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.required {
  color: #ef4444;
  font-size: 12px;
}

/* ========== 输入框 ========== */
.form-input :deep(.el-input__wrapper) {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: none;
  transition: all 0.2s ease;
  padding: 2px 12px;
}

.form-input :deep(.el-input__wrapper:hover) {
  border-color: #cbd5e1;
  background: #fff;
}

.form-input :deep(.el-input__wrapper.is-focus) {
  border-color: #0f172a;
  background: #fff;
  box-shadow: none;
}

.form-input :deep(.el-input__inner) {
  color: #0f172a;
  font-size: 14px;
  font-weight: 400;
}

.form-input :deep(.el-input__inner::placeholder) {
  color: #94a3b8;
  font-weight: 400;
}

.form-input :deep(.el-form-item__error) {
  font-size: 11px;
  padding-top: 2px;
}

/* ========== 按钮 ========== */
.button-item {
  margin-top: 20px;
  margin-bottom: 0;
}

.submit-button {
  width: 100%;
  height: 46px;
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

.submit-button:hover {
  background: #1e293b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
}

/* ========== 卡片底部 ========== */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 20px;
  border-top: 1px solid #f1f5f9;
  padding-top: 16px;
}

.footer-text {
  font-size: 14px;
  color: #94a3b8;
}

.switch-btn {
  font-size: 14px;
  color: #475569;
  font-weight: 500;
  padding: 0;
}

.switch-btn:hover {
  color: #0f172a;
}

.footer-divider {
  font-size: 14px;
  color: #cbd5e1;
  margin: 0 4px;
}

/* ========== 版权 ========== */
.copyright {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  letter-spacing: 1px;
  animation: fadeIn 0.6s ease-out 0.3s both;
}

/* ========== 动画 ========== */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ========== 响应式 ========== */
@media (max-width: 520px) {
  .card-stack {
    width: 340px;
  }

  .card {
    padding: 28px 24px 20px;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .brand-title {
    font-size: 26px;
    letter-spacing: 4px;
  }

  .brand-subtitle {
    font-size: 11px;
  }
}
</style>
