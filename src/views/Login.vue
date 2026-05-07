<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="login-header">
          <h2>分子动力学模拟平台</h2>
          <p>用户登录</p>
        </div>
      </template>

      <el-form ref="loginFormRef" :model="loginForm" :rules="rules" label-width="0">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>

        <el-form-item>
          <el-button
            type="text"
            @click="showRegister = true"
          >
            没有账号？点击注册
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 注册对话框 -->
    <el-dialog v-model="showRegister" title="用户注册" width="400px">
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
import { User, Lock } from '@element-plus/icons-vue'
import { authApi } from '../api.js'

export default {
  name: 'Login',
  components: {
    User,
    Lock
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
          // 存储 token 和用户信息
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
          // 注册成功后自动登录
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
      User,
      Lock,
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
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
}

.login-header {
  text-align: center;
}

.login-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
}

.login-header p {
  margin: 0;
  color: #909399;
}
</style>
