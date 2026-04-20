import promptAction from "@ohos:promptAction";
interface DiscoveredDevice {
    deviceId: string;
    deviceName: string;
    rssi: number;
    serviceUuids: string[];
}
interface WifiConfig {
    ssid: string;
    password: string;
    serverUrl?: string;
}
class BluetoothService {
    private isDiscovering: boolean = false;
    private discoveredDevices: DiscoveredDevice[] = [];
    private onDeviceFound: ((device: DiscoveredDevice) => void) | null = null;
    // 检查蓝牙是否可用
    isBluetoothEnabled(): boolean {
        return true; // 模拟模式始终返回 true
    }
    // 开启蓝牙发现（模拟）
    async startDiscovery(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isDiscovering) {
                resolve();
                return;
            }
            this.isDiscovering = true;
            this.discoveredDevices = [];
            console.info('Bluetooth discovery started (simulated)');
            // 模拟发现设备
            setTimeout(() => {
                const mockDevices: DiscoveredDevice[] = [
                    { deviceId: 'AA:BB:CC:DD:EE:01', deviceName: 'ESP32-Device-001', rssi: -65, serviceUuids: [] },
                    { deviceId: 'AA:BB:CC:DD:EE:02', deviceName: 'ESP32-Sensor', rssi: -72, serviceUuids: [] }
                ];
                mockDevices.forEach(device => {
                    this.discoveredDevices.push(device);
                    this.onDeviceFound?.(device);
                });
                this.isDiscovering = false;
                resolve();
            }, 3000);
        });
    }
    // 停止蓝牙发现
    stopDiscovery(): void {
        this.isDiscovering = false;
        console.info('Bluetooth discovery stopped');
    }
    // 获取已发现的设备列表
    getDiscoveredDevices(): DiscoveredDevice[] {
        return this.discoveredDevices;
    }
    // 清除发现列表
    clearDiscoveredDevices(): void {
        this.discoveredDevices = [];
    }
    // 配网（模拟）
    async provisionDevice(deviceId: string, config: WifiConfig): Promise<boolean> {
        return new Promise((resolve) => {
            console.info('Provisioning device:', deviceId, config);
            setTimeout(() => {
                promptAction.showToast({ message: '配网成功！设备将自动重启' });
                resolve(true);
            }, 1500);
        });
    }
    // 设置设备发现回调
    setOnDeviceFound(callback: (device: DiscoveredDevice) => void): void {
        this.onDeviceFound = callback;
    }
    // 断开连接
    disconnectDevice(deviceId: string): void {
        console.info('Disconnecting device:', deviceId);
    }
}
export const bluetoothService = new BluetoothService();
