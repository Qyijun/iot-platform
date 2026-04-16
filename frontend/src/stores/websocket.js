import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWebSocketStore = defineStore('websocket', () => {
  const ws = ref(null)
  const connected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const deviceData = ref(new Map())
  const onlineDevices = ref(new Map())
  
  const isConnected = computed(() => connected.value)
  const deviceList = computed(() => Array.from(onlineDevices.value.values()))
  
  const connect = () => {
    const wsUrl = `ws://${window.location.host}/ws`
    
    ws.value = new WebSocket(wsUrl)
    
    ws.value.onopen = () => {
      console.log('WebSocket连接成功')
      connected.value = true
      reconnectAttempts.value = 0
    }
    
    ws.value.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleMessage(message)
      } catch (err) {
        console.error('消息解析错误:', err)
      }
    }
    
    ws.value.onclose = () => {
      console.log('WebSocket连接关闭')
      connected.value = false
      attemptReconnect()
    }
    
    ws.value.onerror = (error) => {
      console.error('WebSocket错误:', error)
    }
  }
  
  const handleMessage = (message) => {
    switch (message.type) {
      case 'device_list':
        message.devices.forEach(device => {
          onlineDevices.value.set(device.deviceId, device)
        })
        break
        
      case 'status':
        onlineDevices.value.set(message.deviceId, {
          ...onlineDevices.value.get(message.deviceId),
          ...message.data,
          deviceId: message.deviceId
        })
        break
        
      case 'data':
        deviceData.value.set(message.deviceId, message.data)
        break
        
      case 'device_offline':
        onlineDevices.value.delete(message.deviceId)
        break
    }
  }
  
  const attemptReconnect = () => {
    if (reconnectAttempts.value < maxReconnectAttempts) {
      reconnectAttempts.value++
      setTimeout(() => {
        console.log(`尝试重连... (${reconnectAttempts.value}/${maxReconnectAttempts})`)
        connect()
      }, 3000 * reconnectAttempts.value)
    }
  }
  
  const send = (data) => {
    if (ws.value && connected.value) {
      ws.value.send(JSON.stringify(data))
    }
  }
  
  const subscribeDevice = (deviceId) => {
    send({ type: 'subscribe_device', deviceId })
  }
  
  const unsubscribeDevice = (deviceId) => {
    send({ type: 'unsubscribe_device', deviceId })
  }
  
  const sendCommand = (deviceId, command, params = {}) => {
    send({ type: 'send_command', deviceId, command, params })
  }
  
  const disconnect = () => {
    if (ws.value) {
      ws.value.close()
    }
  }
  
  return {
    connected,
    isConnected,
    deviceList,
    deviceData,
    connect,
    disconnect,
    send,
    subscribeDevice,
    unsubscribeDevice,
    sendCommand
  }
})
