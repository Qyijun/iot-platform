import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import axios from 'axios'

// 获取保存的服务器地址
const getSavedBaseUrl = () => {
  return localStorage.getItem('apiBaseUrl') || ''
}

// 创建 axios 实例
const createAxiosInstance = (baseURL = '') => {
  const instance = axios.create({
    baseURL: baseURL || undefined,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return instance
}

export const useApiConfigStore = defineStore('apiConfig', () => {
  // 当前配置的服务器地址
  const baseUrl = ref(getSavedBaseUrl())
  
  // axios 实例
  const api = createAxiosInstance(baseUrl.value)
  
  // Token 刷新用的 axios（无 Authorization header）
  const authApi = createAxiosInstance(baseUrl.value)
  
  // 保存服务器地址
  const setBaseUrl = (url) => {
    baseUrl.value = url
    localStorage.setItem('apiBaseUrl', url)
    
    // 更新 axios 实例的 baseURL
    api.defaults.baseURL = url || undefined
    authApi.defaults.baseURL = url || undefined
  }
  
  // 清除配置
  const clearBaseUrl = () => {
    setBaseUrl('')
  }
  
  // 初始化：从 localStorage 恢复配置
  const init = () => {
    const saved = getSavedBaseUrl()
    if (saved) {
      setBaseUrl(saved)
    }
  }
  
  // 初始化
  init()
  
  return {
    baseUrl,
    api,
    authApi,
    setBaseUrl,
    clearBaseUrl
  }
})
