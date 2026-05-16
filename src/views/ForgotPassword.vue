<template>
  <div class="forgot-container">
    <MolecularBackground :temperature="300" :max-molecules="15" />

    <div class="forgot-content">
      <div class="brand-section">
        <h1 class="brand-title">电池电解液配方计算平台</h1>
        <p class="brand-subtitle">Battery Electrolyte Formulation Platform</p>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-label">RESET PASSWORD</span>
        </div>

        <div v-if="!emailSent" class="card-body">
          <p class="hint-text">请输入您的注册邮箱，我们将发送密码重置链接到该邮箱。</p>

          <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
            <div class="form-group">
              <label class="form-label">注册邮箱 <span class="required">*</span></label>
              <el-form-item prop="email">
                <el-input
                  v-model="form.email"
                  placeholder="请输入注册时使用的邮箱"
                  size="large"
                  class="form-input"
                  @keyup.enter="handleSubmit"
                />
              </el-form-item>
            </div>

            <el-form-item class="button-item">
              <el-button
                type="primary"
                size="large"
                class="submit-button"
                :loading="loading"
                @click="handleSubmit"
              >
                <span class="button-text">发送重置链接</span>
              </el-button>
            </el-form-item>
          </el-form>
        </div>

        <div v-else class="card-body">
          <div class="success-section">
            <div class="success-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="22" stroke="#0f172a" stroke-width="2" />
                <path d="M15 24L21 30L33 18" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <p class="success-title">重置邮件已发送</p>
            <p class="success-desc">
              我们已向 <strong>{{ form.email }}</strong> 发送了密码重置链接，请在30分钟内完成密码重置。
            </p>
            <p class="success-tip">如果没有收到邮件，请检查垃圾邮件文件夹。</p>
          </div>
        </div>

        <div class="card-footer">
          <span class="footer-text">想起密码了？</span>
          <el-button type="text" class="switch-btn" @click="goLogin">返回登录</el-button>
        </div>
      </div>

      <p class="copyright">&copy; 2026 Battery Electrolyte Formulation Platform</p>
    </div>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { authApi } from '../api.js'
import MolecularBackground from '../components/MolecularBackground.vue'

export default {
  name: 'ForgotPassword',
  components: { MolecularBackground },
  setup() {
    const router = useRouter()
    const formRef = ref(null)
    const loading = ref(false)
    const emailSent = ref(false)

    const form = reactive({
      email: ''
    })

    const rules = {
      email: [
        { required: true, message: '请输入邮箱地址', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ]
    }

    const handleSubmit = async () => {
      if (!formRef.value) return

      try {
        await formRef.value.validate()
      } catch {
        return
      }

      loading.value = true

      try {
        const response = await authApi.forgotPassword({ email: form.email })
        if (response.data.success) {
          emailSent.value = true
        } else {
          ElMessage.error(response.data.message || '发送失败')
        }
      } catch (error) {
        if (error.response?.data?.message) {
          ElMessage.error(error.response.data.message)
        } else {
          ElMessage.error('发送失败，请检查网络连接')
        }
      } finally {
        loading.value = false
      }
    }

    const goLogin = () => {
      router.push('/login')
    }

    return {
      formRef,
      form,
      rules,
      loading,
      emailSent,
      handleSubmit,
      goLogin
    }
  }
}
</script>

<style scoped>
.forgot-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  overflow: hidden;
}

.forgot-content {
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

.card {
  width: 460px;
  padding: 36px 36px 28px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: none;
  border-radius: 4px;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.04),
    0 8px 40px rgba(0, 0, 0, 0.06);
  animation: cardFadeIn 0.5s ease-out;
}

.card-header {
  margin-bottom: 24px;
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

.hint-text {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.form-group {
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

.success-section {
  text-align: center;
  padding: 12px 0;
}

.success-icon {
  margin-bottom: 20px;
  animation: scaleIn 0.4s ease-out;
}

.success-title {
  font-size: 18px;
  font-weight: 500;
  color: #0f172a;
  margin: 0 0 12px 0;
}

.success-desc {
  font-size: 14px;
  color: #475569;
  line-height: 1.7;
  margin: 0 0 8px 0;
}

.success-desc strong {
  color: #0f172a;
  font-weight: 500;
}

.success-tip {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

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

.copyright {
  font-size: 12px;
  color: #94a3b8;
  margin: 0;
  letter-spacing: 1px;
  animation: fadeIn 0.6s ease-out 0.3s both;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@media (max-width: 520px) {
  .card {
    width: 340px;
    padding: 28px 24px 20px;
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
