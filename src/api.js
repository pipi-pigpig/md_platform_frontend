import axios from 'axios'

// 创建axios实例
const api = axios.create({
    baseURL: '/api',
    timeout: 60000, // 60秒超时（模拟可能需要更长时间）
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器
api.interceptors.request.use(
    config => {
        // 可以在这里添加认证token等
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器
api.interceptors.response.use(
    response => {
        return response
    },
    error => {
        // 统一错误处理
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    console.error('未授权，请重新登录')
                    break
                case 403:
                    console.error('拒绝访问')
                    break
                case 404:
                    console.error('请求的资源不存在')
                    break
                case 500:
                    console.error('服务器内部错误')
                    break
                default:
                    console.error('请求错误', error.response.status)
            }
        } else if (error.request) {
            console.error('网络错误，请检查网络连接')
        } else {
            console.error('请求配置错误', error.message)
        }
        return Promise.reject(error)
    }
)

// 模拟任务API
export const simulationApi = {
    // 获取所有模拟任务
    getAll: () => api.get('/simulations'),

    // 获取单个模拟任务
    getById: (id) => api.get(`/simulations/${id}`),

    // 创建模拟任务
    create: (data) => api.post('/simulations', data),

    // 取消模拟任务
    cancel: (id) => api.post(`/simulations/${id}/cancel`),

    // 删除模拟任务
    delete: (id) => api.delete(`/simulations/${id}`),

    // 获取统计信息
    getStats: () => api.get('/simulations/stats'),

    // 下载结果文件
    downloadFile: (id, filename) =>
        api.get(`/simulations/${id}/download/${filename}`, {
            responseType: 'blob'
        }),

    // 根据状态获取模拟任务
    getByStatus: (status) => api.get(`/simulations/status/${status}`),

    // 根据软件获取模拟任务
    getBySoftware: (software) => api.get(`/simulations/software/${software}`),

    // 更新任务状态
    updateStatus: (id, status) => api.put(`/simulations/${id}/status`, { status }),

    // 获取输入文件模板
    getTemplate: (software) => api.get(`/simulations/template/${software}`),

    // 获取任务文件列表
    getFiles: (id) => api.get(`/simulations/${id}/files`),

    // 获取作业执行进度（如果有的话）
    getProgress: (id) => api.get(`/simulations/${id}/progress`)
}

// 电解液系统API
export const systemApi = {
    // 获取所有系统
    getAll: () => api.get('/systems'),

    // 获取单个系统
    getById: (id) => api.get(`/systems/${id}`),

    // 创建系统
    create: (data) => api.post('/systems', data),

    // 更新系统
    update: (id, data) => api.put(`/systems/${id}`, data),

    // 删除系统
    delete: (id) => api.delete(`/systems/${id}`),

    // 搜索系统
    search: (keyword) => api.get(`/systems/search?keyword=${keyword}`),

    // 获取所有盐的配方
    getSaltFormulas: () => api.get('/systems/salt-formulas'),

    // 根据溶剂类型获取系统
    getBySolvent: (solventType) => api.get(`/systems/solvent/${solventType}`)
}

// 文件管理API
export const fileApi = {
    // 上传文件
    upload: (formData) => api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // 下载文件
    download: (filepath) => api.get(`/files/download?path=${encodeURIComponent(filepath)}`, {
        responseType: 'blob'
    }),

    // 列出文件
    list: (directory) => api.get(`/files/list?directory=${encodeURIComponent(directory)}`),

    // 删除文件
    delete: (filepath) => api.delete(`/files?path=${encodeURIComponent(filepath)}`)
}

// 系统监控API
export const monitorApi = {
    // 获取系统状态
    getSystemStatus: () => api.get('/monitor/system'),

    // 获取容器状态
    getContainerStatus: () => api.get('/monitor/containers'),

    // 获取GPU状态
    getGPUStatus: () => api.get('/monitor/gpu'),

    // 获取CPU使用率
    getCPUUsage: () => api.get('/monitor/cpu'),

    // 获取内存使用率
    getMemoryUsage: () => api.get('/monitor/memory'),

    // 获取磁盘使用率
    getDiskUsage: () => api.get('/monitor/disk')
}

// 健康检查API
export const healthApi = {
    // 检查后端健康状态
    checkBackend: () => api.get('/health'),

    // 检查数据库连接
    checkDatabase: () => api.get('/health/db'),

    // 检查Docker连接
    checkDocker: () => api.get('/health/docker'),

    // 检查MD引擎状态
    checkMDEndine: () => api.get('/health/md-engine')
}

// 用户认证API
export const authApi = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout')
}

// 用户管理API
export const userApi = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    getByUsername: (username) => api.get(`/users/username/${username}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`)
}

// 分子模板API
export const moleculeApi = {
    getAll: () => api.get('/molecules'),
    getById: (id) => api.get(`/molecules/${id}`),
    getByName: (name) => api.get(`/molecules/name/${name}`),
    getByType: (type) => api.get(`/molecules/type/${type}`),
    getSystemTemplates: () => api.get('/molecules/system'),
    create: (data) => api.post('/molecules', data),
    update: (id, data) => api.put(`/molecules/${id}`, data),
    delete: (id) => api.delete(`/molecules/${id}`)
}

// 计算结果API
export const resultApi = {
    getAll: () => api.get('/results'),
    getById: (id) => api.get(`/results/${id}`),
    getByJobId: (jobId) => api.get(`/results/job/${jobId}`),
    create: (data) => api.post('/results', data),
    delete: (id) => api.delete(`/results/${id}`)
}

// 工具函数：处理文件下载
export const downloadHelper = {
    downloadBlob: (blob, filename) => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    },

    saveTextAsFile: (text, filename) => {
        const blob = new Blob([text], { type: 'text/plain' })
        downloadHelper.downloadBlob(blob, filename)
    },

    saveJSONAsFile: (json, filename) => {
        const text = JSON.stringify(json, null, 2)
        downloadHelper.saveTextAsFile(text, filename)
    }
}

// 工具函数：格式化时间
export const formatHelper = {
    formatDate: (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN')
    },

    formatDuration: (seconds) => {
        if (!seconds) return ''
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        if (hours > 0) {
            return `${hours}小时 ${minutes}分钟 ${secs}秒`
        } else if (minutes > 0) {
            return `${minutes}分钟 ${secs}秒`
        } else {
            return `${secs}秒`
        }
    },

    formatFileSize: (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
}

export default api