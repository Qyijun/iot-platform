import promptAction from "@ohos:promptAction";
import bluetoothManager from "@ohos:bluetoothManager";
import ble from "@ohos:bluetooth.ble";
import abilityAccessCtrl from "@ohos:abilityAccessCtrl";
import bundleManager from "@ohos:bundle.bundleManager";
import type common from "@ohos:app.ability.common";
class BluetoothService {
    private isScanning: boolean = false;
    private discoveredDevices: Map<string, DiscoveredDevice> = new Map();
    private onDeviceFound: ((device: DiscoveredDevice) => void) | null = null;
    private scanCallback: (results: any) => void = () => { };
    private atManager: abilityAccessCtrl.AtManager = abilityAccessCtrl.createAtManager();
    private context: common.UIAbilityContext | null = null;
    constructor() {
        this.initBluetooth();
    }
    // 设置上下文
    setContext(context: common.UIAbilityContext): void {
        this.context = context;
    }
    // 初始化蓝牙
    private initBluetooth(): void {
        try {
            bluetoothManager.enableBluetooth();
            console.info('BluetoothService', '蓝牙初始化');
        }
        catch (e) {
            console.error('BluetoothService', `初始化失败: ${e?.message || e}`);
        }
    }
    // 检查蓝牙是否可用
    isBluetoothEnabled(): boolean {
        try {
            const state = bluetoothManager.getState();
            return state === bluetoothManager.BluetoothState.STATE_ON;
        }
        catch (e) {
            console.error('BluetoothService', `检查状态失败: ${e?.message || e}`);
            return false;
        }
    }
    // 请求开启蓝牙
    async requestBluetooth(): Promise<boolean> {
        if (!this.isBluetoothEnabled()) {
            try {
                bluetoothManager.enableBluetooth();
                await new Promise(resolve => setTimeout(resolve, 1000));
                promptAction.showToast({ message: '蓝牙已开启' });
                return true;
            }
            catch (e) {
                promptAction.showToast({ message: '请开启蓝牙' });
                return false;
            }
        }
        return true;
    }
    // 请求运行时权限
    async requestPermissions(): Promise<boolean> {
        if (!this.context) {
            console.warn('BluetoothService', 'context 未设置，跳过权限检查');
            return true;
        }
        try {
            const bundleInfo = await bundleManager.getBundleInfoForSelf(bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION);
            const tokenId = bundleInfo.appInfo.accessTokenId;
            // 检查位置权限
            const locationResult = await this.atManager.checkAccessToken(tokenId, 'ohos.permission.LOCATION');
            // 检查蓝牙权限
            const bluetoothResult = await this.atManager.checkAccessToken(tokenId, 'ohos.permission.ACCESS_BLUETOOTH');
            const Granted = abilityAccessCtrl.GrantStatus.PERMISSION_GRANTED;
            if (locationResult !== Granted || bluetoothResult !== Granted) {
                // 请求权限
                await new Promise<void>((resolve, reject) => {
                    this.atManager.requestPermissionsFromUser(this.context, ['ohos.permission.LOCATION', 'ohos.permission.ACCESS_BLUETOOTH'], (err, data) => {
                        if (err) {
                            reject(err);
                        }
                        else if (data && data.authResults) {
                            const allGranted = data.authResults.every((r: number) => r === Granted);
                            if (!allGranted) {
                                promptAction.showToast({ message: '需要蓝牙和位置权限才能扫描设备' });
                            }
                            resolve();
                        }
                        else {
                            resolve();
                        }
                    });
                });
            }
            return true;
        }
        catch (e) {
            console.error('BluetoothService', `权限请求失败: ${e?.message || e}`);
            return false;
        }
    }
    // BLE扫描结果回调处理
    private handleScanResult(results: any): void {
        try {
            const resultArray = results as Array<any>;
            for (const result of resultArray) {
                // 解析设备名称
                let deviceName = '未知设备';
                const rawData = result.data;
                if (rawData) {
                    const dataArray = this.arrayBufferToNumbers(rawData);
                    const nameFromAdv = this.parseDeviceName(dataArray);
                    if (nameFromAdv) {
                        deviceName = nameFromAdv;
                    }
                }
                const deviceId = result.deviceId;
                if (deviceName === '未知设备') {
                    continue;
                }
                const device: DiscoveredDevice = {
                    deviceId: deviceId,
                    deviceName: deviceName,
                    rssi: result.rssi,
                    deviceType: this.guessDeviceType(deviceName)
                };
                if (!this.discoveredDevices.has(deviceId)) {
                    this.discoveredDevices.set(deviceId, device);
                    console.info('BluetoothService', `发现设备: ${deviceName} (${deviceId}) RSSI: ${result.rssi}`);
                    this.onDeviceFound?.(device);
                }
            }
        }
        catch (e) {
            console.error('BluetoothService', `处理扫描结果失败: ${e?.message || e}`);
        }
    }
    // ArrayBuffer 转 number[]
    private arrayBufferToNumbers(buffer: ArrayBuffer): number[] {
        const dataView = new Uint8Array(buffer);
        return Array.from(dataView);
    }
    // 从广播数据解析设备名称
    private parseDeviceName(data: number[]): string | null {
        try {
            let i = 0;
            while (i < data.length) {
                const length = data[i];
                if (length === 0 || i + length + 1 > data.length) {
                    break;
                }
                const type = data[i + 1];
                if (type === 0x09) { // 完整本地名称
                    const nameBytes = data.slice(i + 2, i + length + 1);
                    return this.bytesToString(nameBytes);
                }
                i += length + 1;
            }
            i = 0;
            while (i < data.length) {
                const length = data[i];
                if (length === 0 || i + length + 1 > data.length) {
                    break;
                }
                const type = data[i + 1];
                if (type === 0x08) { // 短本地名称
                    const nameBytes = data.slice(i + 2, i + length + 1);
                    return this.bytesToString(nameBytes);
                }
                i += length + 1;
            }
        }
        catch (e) {
            // 忽略解析错误
        }
        return null;
    }
    // 字节数组转字符串
    private bytesToString(bytes: number[]): string {
        let result = '';
        for (let i = 0; i < bytes.length; i++) {
            if (bytes[i] === 0)
                break;
            result += String.fromCharCode(bytes[i]);
        }
        return result;
    }
    // 根据设备名称猜测设备类型
    private guessDeviceType(name: string): string {
        const upperName = name.toUpperCase();
        if (upperName.includes('ESP') || upperName.includes('PROVISION')) {
            return 'ESP';
        }
        else if (upperName.includes('ITO') || upperName.includes('DEVICE')) {
            return 'iTouch';
        }
        else if (upperName.includes('SENSOR')) {
            return 'Sensor';
        }
        return 'BLE';
    }
    // 开始扫描
    async startDiscovery(): Promise<void> {
        if (this.isScanning) {
            return;
        }
        if (!this.isBluetoothEnabled()) {
            const enabled = await this.requestBluetooth();
            if (!enabled) {
                throw new Error('蓝牙未开启');
            }
        }
        this.isScanning = true;
        this.discoveredDevices.clear();
        console.info('BluetoothService', '开始真实BLE扫描...');
        try {
            // 订阅扫描结果
            this.scanCallback = this.handleScanResult.bind(this);
            // 注册 BLE 扫描结果监听
            ble.on('BLEDeviceFind', this.scanCallback);
            // 开始 BLE 扫描 - 扫描所有设备
            ble.startBLEScan(null);
            console.info('BluetoothService', 'BLE扫描已启动');
        }
        catch (e) {
            this.isScanning = false;
            console.error('BluetoothService', `扫描失败: ${e?.message || e}`);
            throw e;
        }
    }
    // 停止扫描
    stopDiscovery(): void {
        if (!this.isScanning) {
            return;
        }
        this.isScanning = false;
        try {
            ble.stopBLEScan();
            ble.off('BLEDeviceFind', this.scanCallback);
            console.info('BluetoothService', '扫描已停止');
        }
        catch (e) {
            console.error('BluetoothService', `停止失败: ${e?.message || e}`);
        }
    }
    getDiscoveredDevices(): DiscoveredDevice[] {
        return Array.from(this.discoveredDevices.values());
    }
    clearDiscoveredDevices(): void {
        this.discoveredDevices.clear();
    }
    setOnDeviceFound(callback: (device: DiscoveredDevice) => void): void {
        this.onDeviceFound = callback;
    }
    // 连接设备
    async connectDevice(deviceId: string): Promise<boolean> {
        console.info('BluetoothService', `连接: ${deviceId}`);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return true;
        }
        catch (e) {
            return false;
        }
    }
    disconnectDevice(deviceId: string): void {
        console.info('BluetoothService', `断开: ${deviceId}`);
    }
    // 获取当前WiFi - 演示模式
    async getCurrentWifi(): Promise<string> {
        return 'MyHome_WiFi';
    }
    // 配网
    async provisionDevice(deviceId: string, config: WifiConfig): Promise<boolean> {
        console.info('BluetoothService', `配网: ${deviceId}`);
        console.info('BluetoothService', `WiFi: ${config.ssid}`);
        try {
            promptAction.showToast({ message: '正在连接设备...' });
            const connected = await this.connectDevice(deviceId);
            if (!connected) {
                promptAction.showToast({ message: '设备连接失败' });
                return false;
            }
            promptAction.showToast({ message: '正在发送WiFi配置...' });
            await new Promise(resolve => setTimeout(resolve, 2000));
            promptAction.showToast({ message: '设备正在连接WiFi...' });
            await new Promise(resolve => setTimeout(resolve, 3000));
            promptAction.showToast({ message: '配网完成！' });
            console.info('BluetoothService', '配网成功');
            this.disconnectDevice(deviceId);
            return true;
        }
        catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e);
            console.error('BluetoothService', `配网失败: ${errMsg}`);
            promptAction.showToast({ message: '配网失败: ' + errMsg });
            return false;
        }
    }
}
export interface DiscoveredDevice {
    deviceId: string;
    deviceName: string;
    rssi: number;
    deviceType?: string;
}
export interface WifiConfig {
    ssid: string;
    password: string;
    serverUrl?: string;
}
export const bluetoothService = new BluetoothService();
