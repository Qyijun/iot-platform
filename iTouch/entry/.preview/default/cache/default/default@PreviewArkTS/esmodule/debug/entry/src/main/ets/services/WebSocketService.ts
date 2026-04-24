import webSocket from "@ohos:net.webSocket";
import hilog from "@ohos:hilog";
const TAG = 'WebSocketService';
const DOMAIN = 0xFF03;
// 告警数据结构
export interface AlertData {
    id: number;
    alert_type: string;
    alert_level: string;
    device_id: string;
    device_name: string;
    message: string;
    details: string | null;
    is_read: number;
    created_at: string;
}
// 告警回调类型
export type AlertCallback = (alert: AlertData) => void;
// 设备数据回调类型
export type DeviceDataCallback = (data: Record<string, string>) => void;
// 连接状态回调类型
export type ConnectionCallback = (connected: boolean) => void;
class WebSocketService {
    private ws: webSocket.WebSocket | null = null;
    private isConnected: boolean = false;
    private reconnectTimer: number | null = null;
    private alertCallbacks: AlertCallback[] = [];
    private deviceDataCallbacks: DeviceDataCallback[] = [];
    private connectionCallbacks: ConnectionCallback[] = [];
    private baseUrl: string = '';
    private token: string = '';
    private subscribedDevices: Set<string> = new Set();
    // 初始化
    init(baseUrl: string): void {
        this.baseUrl = baseUrl;
        hilog.info(DOMAIN, TAG, '初始化WebSocket服务: %{public}s', baseUrl);
    }
    // 设置Token
    setToken(token: string): void {
        this.token = token;
    }
    // 获取Token
    getToken(): string {
        return this.token;
    }
    // 连接到WebSocket服务器
    connect(): void {
        if (this.isConnected) {
            hilog.info(DOMAIN, TAG, 'WebSocket已连接，跳过');
            return;
        }
        if (!this.baseUrl) {
            hilog.error(DOMAIN, TAG, '请先调用init初始化baseUrl');
            return;
        }
        // 将http(s)转换为ws(s)
        const wsUrl = this.baseUrl.replace(/^http/, 'ws') + '/ws';
        hilog.info(DOMAIN, TAG, '正在连接WebSocket: %{public}s', wsUrl);
        try {
            // 创建WebSocket连接
            this.ws = webSocket.createWebSocket();
            const fullUrl = this.token ? `${wsUrl}?token=${encodeURIComponent(this.token)}` : wsUrl;
            // 设置打开回调
            this.ws.on('open', (err, value) => {
                if (err) {
                    hilog.error(DOMAIN, TAG, 'WebSocket打开失败: %{public}s', JSON.stringify(err));
                    this.scheduleReconnect();
                    return;
                }
                hilog.info(DOMAIN, TAG, 'WebSocket连接已打开');
                this.isConnected = true;
                this.notifyConnectionChange(true);
                // 重新订阅之前订阅的设备
                this.subscribedDevices.forEach(deviceId => {
                    this.sendSubscription(deviceId);
                });
            });
            // 设置消息回调
            this.ws.on('message', (err, value) => {
                if (err) {
                    hilog.error(DOMAIN, TAG, 'WebSocket消息错误: %{public}s', JSON.stringify(err));
                    return;
                }
                const message = value as string;
                if (message) {
                    this.handleMessage(message);
                }
            });
            // 设置关闭回调
            this.ws.on('close', (err, value) => {
                hilog.info(DOMAIN, TAG, 'WebSocket连接已关闭, code=%{public}d', value.code);
                this.isConnected = false;
                this.notifyConnectionChange(false);
                this.scheduleReconnect();
            });
            // 设置错误回调
            this.ws.on('error', (err) => {
                hilog.error(DOMAIN, TAG, 'WebSocket错误: %{public}s', JSON.stringify(err));
                this.isConnected = false;
                this.notifyConnectionChange(false);
            });
            // 发起连接
            this.ws.connect(fullUrl);
        }
        catch (e) {
            hilog.error(DOMAIN, TAG, 'WebSocket连接异常: %{public}s', JSON.stringify(e));
            this.scheduleReconnect();
        }
    }
    // 发送订阅消息
    private sendSubscription(deviceId: string): void {
        if (this.ws && this.isConnected) {
            this.send({
                type: 'subscribe_device',
                deviceId: deviceId
            });
        }
    }
    // 调度重连
    private scheduleReconnect(): void {
        if (this.reconnectTimer !== null) {
            return;
        }
        hilog.info(DOMAIN, TAG, '5秒后尝试重连...');
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (!this.isConnected) {
                this.connect();
            }
        }, 5000);
    }
    // 断开连接
    disconnect(): void {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.subscribedDevices.clear();
        this.notifyConnectionChange(false);
        hilog.info(DOMAIN, TAG, 'WebSocket已断开');
    }
    // 处理收到的消息
    private handleMessage(message: string): void {
        try {
            const data: Record<string, string> = JSON.parse(message);
            const type = data['type'];
            hilog.info(DOMAIN, TAG, '收到WebSocket消息: %{public}s', type);
            switch (type) {
                case 'device_online':
                case 'device_offline':
                case 'command_success':
                case 'command_failed':
                case 'ota_progress':
                case 'ota_complete':
                case 'ota_error':
                    // 这些都是告警类型消息
                    this.notifyAlert(data);
                    break;
                case 'device_data':
                case 'telemetry':
                    // 设备数据消息
                    this.notifyDeviceData(data);
                    break;
                case 'device_list':
                    // 设备列表消息（连接时服务器发送）
                    hilog.info(DOMAIN, TAG, '当前在线设备: %{public}s', data['devices']);
                    break;
            }
        }
        catch (e) {
            hilog.error(DOMAIN, TAG, '消息解析失败: %{public}s, 原始内容: %{public}s', JSON.stringify(e), message.substring(0, 200));
        }
    }
    // 通知告警
    private notifyAlert(alert: Record<string, string>): void {
        hilog.info(DOMAIN, TAG, '新告警: %{public}s', alert['message'] || alert['alert_type']);
        for (let i = 0; i < this.alertCallbacks.length; i++) {
            try {
                const parsedAlert: AlertData = {
                    id: parseInt(alert['id'] || '0', 10),
                    alert_type: alert['alert_type'] || '',
                    alert_level: alert['alert_level'] || '',
                    device_id: alert['device_id'] || '',
                    device_name: alert['device_name'] || '',
                    message: alert['message'] || '',
                    details: alert['details'] || null,
                    is_read: parseInt(alert['is_read'] || '0', 10),
                    created_at: alert['created_at'] || new Date().toISOString()
                };
                this.alertCallbacks[i](parsedAlert);
            }
            catch (e) {
                hilog.error(DOMAIN, TAG, '告警回调执行失败: %{public}s', JSON.stringify(e));
            }
        }
    }
    // 通知设备数据
    private notifyDeviceData(data: Record<string, string>): void {
        for (let i = 0; i < this.deviceDataCallbacks.length; i++) {
            try {
                this.deviceDataCallbacks[i](data);
            }
            catch (e) {
                hilog.error(DOMAIN, TAG, '设备数据回调执行失败: %{public}s', JSON.stringify(e));
            }
        }
    }
    // 通知连接状态变化
    private notifyConnectionChange(connected: boolean): void {
        for (let i = 0; i < this.connectionCallbacks.length; i++) {
            try {
                this.connectionCallbacks[i](connected);
            }
            catch (e) {
                hilog.error(DOMAIN, TAG, '连接状态回调执行失败: %{public}s', JSON.stringify(e));
            }
        }
    }
    // 订阅告警
    subscribeAlert(callback: AlertCallback): () => void {
        this.alertCallbacks.push(callback);
        return () => {
            const index = this.alertCallbacks.indexOf(callback);
            if (index > -1) {
                this.alertCallbacks.splice(index, 1);
            }
        };
    }
    // 订阅设备数据
    subscribeDeviceData(callback: DeviceDataCallback): () => void {
        this.deviceDataCallbacks.push(callback);
        return () => {
            const index = this.deviceDataCallbacks.indexOf(callback);
            if (index > -1) {
                this.deviceDataCallbacks.splice(index, 1);
            }
        };
    }
    // 订阅连接状态
    subscribeConnection(callback: ConnectionCallback): () => void {
        this.connectionCallbacks.push(callback);
        callback(this.isConnected);
        return () => {
            const index = this.connectionCallbacks.indexOf(callback);
            if (index > -1) {
                this.connectionCallbacks.splice(index, 1);
            }
        };
    }
    // 订阅设备（用于接收该设备的数据更新）
    subscribeDevice(deviceId: string): void {
        this.subscribedDevices.add(deviceId);
        this.sendSubscription(deviceId);
    }
    // 取消订阅设备
    unsubscribeDevice(deviceId: string): void {
        this.subscribedDevices.delete(deviceId);
        this.send({
            type: 'unsubscribe_device',
            deviceId: deviceId
        });
    }
    // 获取连接状态
    getConnectionStatus(): boolean {
        return this.isConnected;
    }
    // 发送消息
    send(data: Record<string, string>): boolean {
        if (!this.ws || !this.isConnected) {
            hilog.warn(DOMAIN, TAG, 'WebSocket未连接，无法发送消息');
            return false;
        }
        const jsonStr = JSON.stringify(data);
        hilog.info(DOMAIN, TAG, '发送WebSocket消息: %{public}s', jsonStr);
        this.ws.send(jsonStr);
        return true;
    }
    // 发送设备命令
    sendCommand(deviceId: string, command: string, params?: Record<string, string>): boolean {
        return this.send({
            type: 'send_command',
            deviceId: deviceId,
            command: command,
            params: params ? JSON.stringify(params) : '{}'
        });
    }
}
export const webSocketService = new WebSocketService();
