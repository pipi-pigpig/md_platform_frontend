import axios from 'axios'

// 会话版本号 - 用于跟踪请求的有效性
// 每次登出时会递增，使所有旧会话的请求失效
let currentSessionVersion = Date.now()

// 存储所有pending请求的取消函数
const pendingRequests = new Map()

// 生成请求的唯一标识
function generateRequestKey(config) {
    const { method, url } = config
    return `${method}-${url}`
}

// 添加请求到pending列表
function addPendingRequest(config) {
    const requestKey = generateRequestKey(config)
    if (pendingRequests.has(requestKey)) {
        const cancel = pendingRequests.get(requestKey)
        cancel && cancel()
    }
    config.requestKey = requestKey
    const controller = new AbortController()
    config.signal = controller.signal
    pendingRequests.set(requestKey, () => controller.abort())
}

// 从pending列表移除请求
function removePendingRequest(config) {
    const requestKey = config.requestKey || generateRequestKey(config)
    if (pendingRequests.has(requestKey)) {
        pendingRequests.delete(requestKey)
    }
}

// 取消所有pending请求
export function cancelAllRequests() {
    pendingRequests.forEach((cancel) => {
        cancel && cancel()
    })
    pendingRequests.clear()
}

// 使当前会话失效（登出时调用）
// 递增版本号并取消所有pending请求
export function invalidateSession() {
    currentSessionVersion = Date.now()
    cancelAllRequests()
}

// 获取当前会话版本号
export function getSessionVersion() {
    return currentSessionVersion
}

// 兼容旧API：设置登出状态
// true = 使会话失效，false = 无操作（新会话在登录时自动开始）
export function setLoggedOut(status) {
    if (status) {
        invalidateSession()
    }
    // 注意：不再需要在登录前调用 setLoggedOut(false)
    // 新会话版本在 invalidateSession() 中自动生成
}

// 检查请求是否属于当前有效会话
function isRequestFromCurrentSession(config) {
    const requestSessionVersion = config._sessionVersion
    return requestSessionVersion === currentSessionVersion
}

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
        // 记录请求发起时的会话版本
        config._sessionVersion = currentSessionVersion

        // 添加token
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // 添加到pending列表
        addPendingRequest(config)

        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器
api.interceptors.response.use(
    response => {
        // 请求成功，从pending列表移除
        removePendingRequest(response.config)
        return response
    },
    error => {
        // 请求失败，从pending列表移除
        if (error.config) {
            removePendingRequest(error.config)
        }

        // 如果是请求被取消，静默处理
        if (axios.isCancel(error) || error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
            return Promise.reject({ ...error, silent: true })
        }

        // 检查请求是否来自当前有效会话
        // 如果会话版本不匹配，说明请求属于已登出的旧会话，静默处理
        if (error.config && !isRequestFromCurrentSession(error.config)) {
            return Promise.reject({ ...error, silent: true })
        }

        // 统一错误处理
        if (error.response) {
            switch (error.response.status) {
                case 401:
                    // 未授权，清除 token 并跳转到登录页
                    localStorage.removeItem('token')
                    localStorage.removeItem('user')
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login'
                    }
                    // 标记为静默错误，不显示提示
                    error.silent = true
                    break
                case 403:
                    // 权限不足，可能是token过期，静默处理
                    error.silent = true
                    break
                case 404:
                    // 资源不存在，静默处理
                    error.silent = true
                    break
                case 500:
                    console.warn('服务器内部错误')
                    break
            }
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

// 电解液系统API（对接后端 management 模块 /api/electrolyte-systems）
export const systemApi = {
    // 分页查询配方列表（F-E004）
    // 返回 { success, data: { total, page, pageSize, list: [...] } }
    list: ({ keyword, page = 1, pageSize = 20 } = {}) =>
        api.get('/electrolyte-systems', {
            params: { keyword, page, page_size: pageSize }
        }),

    // 获取配方详情（F-E005）
    getById: (id) => api.get(`/electrolyte-systems/${id}`),

    // 创建配方（F-E001）
    create: (data) => api.post('/electrolyte-systems', data),

    // 更新配方（F-E002）
    update: (id, data) => api.put(`/electrolyte-systems/${id}`, data),

    // 删除配方（F-E003）
    delete: (id) => api.delete(`/electrolyte-systems/${id}`),

    // 搜索配方（F-E004 关键词搜索）
    search: (keyword, page = 1, pageSize = 20) =>
        api.get('/electrolyte-systems/search', {
            params: { keyword, page, page_size: pageSize }
        }),

    // 保存为模板（F-E006）
    saveAsTemplate: (id, isPublic = false) =>
        api.put(`/electrolyte-systems/${id}/template`, { is_public: isPublic }),

    // 从模板复用创建新配方（F-E007）
    copy: (id, newName) =>
        api.post(`/electrolyte-systems/${id}/copy`, { new_name: newName })
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
    logout: () => api.post('/auth/logout'),
    forgotPassword: (data) => api.post('/auth/password-reset/request', data),
    resetPassword: (data) => api.post('/auth/password-reset/confirm', data)
}

// 用户管理API
export const userApi = {
    // 获取当前登录用户信息（F-U004 查看）
    getMe: () => api.get('/users/me'),
    // 更新当前登录用户信息（F-U004 修改）
    updateMe: (data) => api.put('/users/me', data),
    // 修改当前登录用户密码
    changePassword: (data) => api.put('/users/me/password', data),

    // 以下为管理员接口，本次联调暂不使用
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
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