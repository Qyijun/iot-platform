import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWebSocketStore = defineStore('websocket', () => {
  const ws = ref(null)
  const connected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5
  const deviceData = ref(new Map())
  const onlineDevices = ref(new Map())
  // 系统信息缓存（用于页面加载时显示）
  const systemCache = ref(new Map())
  // 最后收到的消息（用于OTA等状态）
  const lastMessage = ref(null)
  
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
    // 保存最后收到的消息
    lastMessage.value = message

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

      // 处理心跳消息（ESP32发送的心跳）
      case 'heartbeat':
        // 保存系统信息到缓存（页面加载时可用）
        const cached = systemCache.value.get(message.deviceId) || {}
        systemCache.value.set(message.deviceId, {
          ...cached,
          uptime: message.data.uptime,
          free_heap: message.data.free_heap,
          ip: message.data.ip,
          version: message.data.version,
          rssi: message.data.rssi
        })
        // 更新实时数据
        deviceData.value.set(message.deviceId, {
          ...deviceData.value.get(message.deviceId),
          voltage: message.data.voltage,
          rssi: message.data.rssi,
          uptime: message.data.uptime,
          free_heap: message.data.free_heap,
          ip: message.data.ip,
          version: message.data.version
        })
        break

      // 处理遥测消息（ESP32发送的传感器数据）
      case 'telemetry':
        deviceData.value.set(message.deviceId, {
          ...deviceData.value.get(message.deviceId),
          temperature: message.data.temperature,
          humidity: message.data.humidity,
          battery: message.data.battery,
          rssi: message.data.rssi
        })
        break

      case 'device_offline':
        onlineDevices.value.delete(message.deviceId)
        break

      // OTA 消息类型（后端广播的）
      case 'ota_progress':
      case 'ota_complete':
      case 'ota_error':
        // 这些消息已经在 lastMessage 中保存，前端通过 $subscribe 监听
        console.log(`OTA消息: ${message.type}`, message)
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
    systemCache,
    lastMessage,
    connect,
    disconnect,
    send,
    subscribeDevice,
    unsubscribeDevice,
    sendCommand
  }
})
