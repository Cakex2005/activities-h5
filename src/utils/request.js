import axios from 'axios'
import { showToast } from 'vant'

const request = axios.create({
    baseURL: '/api',
    timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
    config => {
        const token = localStorage.getItem('student_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }

        // 添加请求日志
        console.log(`[API请求] ${config.method.toUpperCase()} ${config.url}`, {
            参数: config.params || config.data,
            headers: config.headers
        })

        return config
    },
    error => {
        console.error('[API请求失败]', error)
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    response => {
        const res = response.data

        // 添加响应日志
        console.log(`[API响应] ${response.config.method.toUpperCase()} ${response.config.url}`, {
            状态码: res.code,
            消息: res.message,
            数据: res.data
        })

        if (res.code !== 200) {
            showToast(res.message || '操作失败')
            return Promise.reject(new Error(res.message || 'Error'))
        }
        return res
    },
    error => {
        console.error('[API响应错误]', {
            URL: error.config?.url,
            状态码: error.response?.status,
            错误信息: error.response?.data?.message || error.message
        })
        showToast(error.response?.data?.message || '网络错误')
        return Promise.reject(error)
    }
)

export default request
