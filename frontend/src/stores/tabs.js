import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useTabsStore = defineStore('tabs', () => {
  // 打开的标签页列表
  const tabs = ref([
    { path: '/dashboard', title: '首页', name: 'Dashboard', closable: false }
  ])
  
  // 当前激活的标签
  const activeTab = ref('/dashboard')
  
  // 添加标签
  const addTab = (route) => {
    // 如果已存在，直接激活
    const exists = tabs.value.find(tab => tab.path === route.path)
    if (exists) {
      activeTab.value = route.path
      return
    }
    
    // 添加新标签
    tabs.value.push({
      path: route.path,
      title: route.meta?.title || '未命名',
      name: route.name,
      closable: true
    })
    activeTab.value = route.path
  }
  
  // 关闭标签
  const closeTab = (path) => {
    const index = tabs.value.findIndex(tab => tab.path === path)
    if (index === -1) return
    
    // 如果关闭的是当前激活标签，需要切换
    if (activeTab.value === path) {
      // 优先切换到左边，否则右边
      const nextTab = tabs.value[index - 1] || tabs.value[index + 1]
      if (nextTab) {
        activeTab.value = nextTab.path
      }
    }
    
    tabs.value.splice(index, 1)
  }
  
  // 关闭其他标签
  const closeOtherTabs = (path) => {
    const current = tabs.value.find(tab => tab.path === path)
    tabs.value = tabs.value.filter(tab => !tab.closable || tab.path === path)
    activeTab.value = path
  }
  
  // 关闭所有标签
  const closeAllTabs = () => {
    tabs.value = tabs.value.filter(tab => !tab.closable)
    activeTab.value = tabs.value[0]?.path || '/dashboard'
  }
  
  // 设置激活标签
  const setActiveTab = (path) => {
    activeTab.value = path
  }
  
  return {
    tabs,
    activeTab,
    addTab,
    closeTab,
    closeOtherTabs,
    closeAllTabs,
    setActiveTab
  }
})
