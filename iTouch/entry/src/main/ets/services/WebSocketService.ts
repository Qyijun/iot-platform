// WebSocket 服务 - 设备实时数据推送
import webSocket from '@ohos.net.webSocket';
import promptAction from '@ohos.promptAction';

interface WebSocketMessage {
  type: 'device_data' | 'alert' | 'command_response' | 'status';
  deviceId?: string;
  data?: Record<string, any>;
  timestamp?: number;
}

type MessageHandler = (message: WebSocketMessage) => void;
type StatusHandler = (connected: boolean) => void;

class WebSocketService {
  private ws: webSocket.WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private messageHandlers: MessageHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  private serverUrl: string = '';
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;

  // 连接 WebSocket 服务器
  connect(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.ws) {
        resolve();
        return;
      }

      this.serverUrl = url;
      
      try {
        this.ws = webSocket.createWebSocket();
        
        this.ws.on('open', () => {
          console.info('WebSocket connected');
          this.isConnected = true;
          this.startHeartbeat();
          this.notifyStatusChange(true);
          resolve();
        });

        this.ws.on('message', (_err: Error | undefined, data: string | ArrayBuffer) => {
          if (typeof data === 'string') {
            this.handleMessage(data);
          }
        });

        this.ws.on('close', (_err: Error | undefined, data: { code: number; reason: string }) => {
          console.info('WebSocket closed:', data);
          this.isConnected = false;
          this.stopHeartbeat();
          this.notifyStatusChange(false);
          this.scheduleReconnect();
        });

        this.ws.on('error', (err: Error) => {
          console.error('WebSocket error:', err);
          this.isConnected = false;
          this.notifyStatusChange(false);
        });

        // 连接
        this.ws.connect(url).then((result: boolean) => {
          console.info('WebSocket connect result:', result);
        }).catch((err: Error) => {
          console.error('WebSocket connect error:', err);
          reject(err);
        });

      } catch (e) {
        console.error('Create WebSocket failed:', e);
        reject(e);
      }
    });
  }

  // 断开连接
  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      try {
        this.ws.close();
        this.ws = null;
      } catch (e) {
        console.error('WebSocket disconnect failed:', e);
      }
    }
    
    this.isConnected = false;
    this.notifyStatusChange(false);
  }

  // 发送消息
  send(message: WebSocketMessage): boolean {
    if (!this.isConnected || !this.ws) {
      console.warn('WebSocket not connected');
      return false;
    }

    try {
      const data = JSON.stringify(message);
      this.ws.send(data);
      return true;
    } catch (e) {
      console.error('WebSocket send failed:', e);
      return false;
    }
  }

  // 发送设备命令
  sendCommand(deviceId: string, command: string, params?: Record<string, any>): boolean {
    return this.send({
      type: 'command_response',
      deviceId,
      data: { command, params },
      timestamp: Date.now()
    });
  }

  // 处理接收到的消息
  private handleMessage(data: string) {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      console.info('WebSocket message:', JSON.stringify(message));

      // 根据消息类型处理
      switch (message.type) {
        case 'device_data':
          promptAction.showToast({ message: '收到设备数据更新' });
          break;
        case 'alert':
          promptAction.showToast({ message: '收到设备告警: ' + message.data?.message });
          break;
      }

      // 通知所有处理器
      this.messageHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (e) {
          console.error('Message handler error:', e);
        }
      });
    } catch (e) {
      console.error('Parse message failed:', e);
    }
  }

  // 添加消息处理器
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  // 移除消息处理器
  offMessage(handler: MessageHandler): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index >= 0) {
      this.messageHandlers.splice(index, 1);
    }
  }

  // 添加状态变化处理器
  onStatusChange(handler: StatusHandler): void {
    this.statusHandlers.push(handler);
  }

  // 移除状态变化处理器
  offStatusChange(handler: StatusHandler): void {
    const index = this.statusHandlers.indexOf(handler);
    if (index >= 0) {
      this.statusHandlers.splice(index, 1);
    }
  }

  // 通知状态变化
  private notifyStatusChange(connected: boolean): void {
    this.statusHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (e) {
        console.error('Status handler error:', e);
      }
    });
  }

  // 心跳保活
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        this.send({ type: 'status', timestamp: Date.now() });
      }
    }, 30000); // 每 30 秒发送一次心跳
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 定时重连
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    console.info('Scheduling reconnect...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.serverUrl) {
        this.connect(this.serverUrl).catch(() => {
          // 重连失败，等待下一次定时
        });
      }
    }, 5000); // 5 秒后重连
  }

  // 获取连接状态
  getStatus(): boolean {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService();
