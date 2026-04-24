if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface DeviceProvision_Params {
    isScanning?: boolean;
    discoveredDevices?: DiscoveredDevice[];
    selectedDevice?: DiscoveredDevice | null;
    ssid?: string;
    password?: string;
    isProvisioning?: boolean;
    scanProgress?: number;
    bluetoothEnabled?: boolean;
    currentWifi?: string;
    errorMessage?: string;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import type common from "@ohos:app.ability.common";
import { bluetoothService } from "@normalized:N&&&entry/src/main/ets/services/BluetoothService&";
import type { DiscoveredDevice } from "@normalized:N&&&entry/src/main/ets/services/BluetoothService&";
class DeviceProvision extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__isScanning = new ObservedPropertySimplePU(false, this, "isScanning");
        this.__discoveredDevices = new ObservedPropertyObjectPU([], this, "discoveredDevices");
        this.__selectedDevice = new ObservedPropertyObjectPU(null, this, "selectedDevice");
        this.__ssid = new ObservedPropertySimplePU('', this, "ssid");
        this.__password = new ObservedPropertySimplePU('', this, "password");
        this.__isProvisioning = new ObservedPropertySimplePU(false, this, "isProvisioning");
        this.__scanProgress = new ObservedPropertySimplePU(0, this, "scanProgress");
        this.__bluetoothEnabled = new ObservedPropertySimplePU(false, this, "bluetoothEnabled");
        this.__currentWifi = new ObservedPropertySimplePU('', this, "currentWifi");
        this.__errorMessage = new ObservedPropertySimplePU('', this, "errorMessage");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DeviceProvision_Params) {
        if (params.isScanning !== undefined) {
            this.isScanning = params.isScanning;
        }
        if (params.discoveredDevices !== undefined) {
            this.discoveredDevices = params.discoveredDevices;
        }
        if (params.selectedDevice !== undefined) {
            this.selectedDevice = params.selectedDevice;
        }
        if (params.ssid !== undefined) {
            this.ssid = params.ssid;
        }
        if (params.password !== undefined) {
            this.password = params.password;
        }
        if (params.isProvisioning !== undefined) {
            this.isProvisioning = params.isProvisioning;
        }
        if (params.scanProgress !== undefined) {
            this.scanProgress = params.scanProgress;
        }
        if (params.bluetoothEnabled !== undefined) {
            this.bluetoothEnabled = params.bluetoothEnabled;
        }
        if (params.currentWifi !== undefined) {
            this.currentWifi = params.currentWifi;
        }
        if (params.errorMessage !== undefined) {
            this.errorMessage = params.errorMessage;
        }
    }
    updateStateVars(params: DeviceProvision_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__isScanning.purgeDependencyOnElmtId(rmElmtId);
        this.__discoveredDevices.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedDevice.purgeDependencyOnElmtId(rmElmtId);
        this.__ssid.purgeDependencyOnElmtId(rmElmtId);
        this.__password.purgeDependencyOnElmtId(rmElmtId);
        this.__isProvisioning.purgeDependencyOnElmtId(rmElmtId);
        this.__scanProgress.purgeDependencyOnElmtId(rmElmtId);
        this.__bluetoothEnabled.purgeDependencyOnElmtId(rmElmtId);
        this.__currentWifi.purgeDependencyOnElmtId(rmElmtId);
        this.__errorMessage.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__isScanning.aboutToBeDeleted();
        this.__discoveredDevices.aboutToBeDeleted();
        this.__selectedDevice.aboutToBeDeleted();
        this.__ssid.aboutToBeDeleted();
        this.__password.aboutToBeDeleted();
        this.__isProvisioning.aboutToBeDeleted();
        this.__scanProgress.aboutToBeDeleted();
        this.__bluetoothEnabled.aboutToBeDeleted();
        this.__currentWifi.aboutToBeDeleted();
        this.__errorMessage.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __isScanning: ObservedPropertySimplePU<boolean>;
    get isScanning() {
        return this.__isScanning.get();
    }
    set isScanning(newValue: boolean) {
        this.__isScanning.set(newValue);
    }
    private __discoveredDevices: ObservedPropertyObjectPU<DiscoveredDevice[]>;
    get discoveredDevices() {
        return this.__discoveredDevices.get();
    }
    set discoveredDevices(newValue: DiscoveredDevice[]) {
        this.__discoveredDevices.set(newValue);
    }
    private __selectedDevice: ObservedPropertyObjectPU<DiscoveredDevice | null>;
    get selectedDevice() {
        return this.__selectedDevice.get();
    }
    set selectedDevice(newValue: DiscoveredDevice | null) {
        this.__selectedDevice.set(newValue);
    }
    private __ssid: ObservedPropertySimplePU<string>;
    get ssid() {
        return this.__ssid.get();
    }
    set ssid(newValue: string) {
        this.__ssid.set(newValue);
    }
    private __password: ObservedPropertySimplePU<string>;
    get password() {
        return this.__password.get();
    }
    set password(newValue: string) {
        this.__password.set(newValue);
    }
    private __isProvisioning: ObservedPropertySimplePU<boolean>;
    get isProvisioning() {
        return this.__isProvisioning.get();
    }
    set isProvisioning(newValue: boolean) {
        this.__isProvisioning.set(newValue);
    }
    private __scanProgress: ObservedPropertySimplePU<number>;
    get scanProgress() {
        return this.__scanProgress.get();
    }
    set scanProgress(newValue: number) {
        this.__scanProgress.set(newValue);
    }
    private __bluetoothEnabled: ObservedPropertySimplePU<boolean>;
    get bluetoothEnabled() {
        return this.__bluetoothEnabled.get();
    }
    set bluetoothEnabled(newValue: boolean) {
        this.__bluetoothEnabled.set(newValue);
    }
    private __currentWifi: ObservedPropertySimplePU<string>;
    get currentWifi() {
        return this.__currentWifi.get();
    }
    set currentWifi(newValue: string) {
        this.__currentWifi.set(newValue);
    }
    private __errorMessage: ObservedPropertySimplePU<string>;
    get errorMessage() {
        return this.__errorMessage.get();
    }
    set errorMessage(newValue: string) {
        this.__errorMessage.set(newValue);
    }
    aboutToAppear() {
        // 设置蓝牙服务上下文
        const context = getContext(this) as common.UIAbilityContext;
        bluetoothService.setContext(context);
        this.checkBluetooth();
        // 异步加载WiFi，不阻塞UI
        this.loadCurrentWifi();
    }
    aboutToDisappear() {
        bluetoothService.stopDiscovery();
    }
    // 检查蓝牙状态
    async checkBluetooth() {
        this.bluetoothEnabled = bluetoothService.isBluetoothEnabled();
        if (!this.bluetoothEnabled) {
            try {
                await bluetoothService.requestBluetooth();
                this.bluetoothEnabled = true;
            }
            catch (e) {
                this.errorMessage = '请开启蓝牙功能';
            }
        }
    }
    // 加载当前WiFi
    async loadCurrentWifi() {
        this.currentWifi = await bluetoothService.getCurrentWifi();
        if (this.currentWifi) {
            this.ssid = this.currentWifi;
        }
    }
    // 使用当前WiFi
    useCurrentWifi() {
        if (this.currentWifi) {
            this.ssid = this.currentWifi;
            promptAction.showToast({ message: `已选择: ${this.currentWifi}` });
        }
        else {
            promptAction.showToast({ message: '未检测到WiFi' });
        }
    }
    // 开始扫描
    async startScan() {
        this.errorMessage = '';
        this.isScanning = true;
        this.discoveredDevices = [];
        this.scanProgress = 0;
        this.selectedDevice = null;
        // 设置设备发现回调
        bluetoothService.setOnDeviceFound((device) => {
            // 检查是否已存在
            const exists = this.discoveredDevices.some(d => d.deviceId === device.deviceId);
            if (!exists) {
                this.discoveredDevices = [...this.discoveredDevices, device];
            }
        });
        try {
            await bluetoothService.startDiscovery();
            // 扫描进度更新
            const timer = setInterval(() => {
                this.scanProgress += 5;
                if (this.scanProgress >= 100) {
                    clearInterval(timer);
                    this.stopScan();
                }
            }, 500);
        }
        catch (e) {
            this.isScanning = false;
            this.errorMessage = '蓝牙扫描失败: ' + (e.message || '未知错误');
            promptAction.showToast({ message: this.errorMessage });
        }
    }
    // 停止扫描
    stopScan() {
        this.isScanning = false;
        this.scanProgress = 100;
        bluetoothService.stopDiscovery();
        promptAction.showToast({ message: `扫描完成，发现 ${this.discoveredDevices.length} 个设备` });
    }
    // 选择设备
    selectDevice(device: DiscoveredDevice) {
        this.selectedDevice = device;
        promptAction.showToast({ message: `已选择: ${device.deviceName}` });
    }
    // 开始配网
    async startProvision() {
        if (!this.selectedDevice) {
            promptAction.showToast({ message: '请先选择要配网的设备' });
            return;
        }
        if (!this.ssid.trim()) {
            promptAction.showToast({ message: '请输入 WiFi 名称' });
            return;
        }
        if (!this.password.trim()) {
            promptAction.showToast({ message: '请输入 WiFi 密码' });
            return;
        }
        this.isProvisioning = true;
        this.errorMessage = '';
        try {
            const result = await bluetoothService.provisionDevice(this.selectedDevice.deviceId, {
                ssid: this.ssid.trim(),
                password: this.password.trim()
            });
            if (result) {
                promptAction.showToast({ message: '配网成功！设备将自动重启' });
                setTimeout(() => router.back(), 2000);
            }
            else {
                this.errorMessage = '配网失败，请重试';
            }
        }
        catch (e) {
            this.errorMessage = '配网失败: ' + (e.message || '未知错误');
            promptAction.showToast({ message: this.errorMessage });
        }
        finally {
            this.isProvisioning = false;
        }
    }
    // 获取信号强度图标
    getSignalIcon(rssi: number): string {
        if (rssi >= -50)
            return '📶';
        if (rssi >= -70)
            return '📱';
        if (rssi >= -85)
            return '📵';
        return '❌';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(163:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f0f2f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 顶部导航
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(165:7)", "entry");
            // 顶部导航
            Row.width('100%');
            // 顶部导航
            Row.height(56);
            // 顶部导航
            Row.padding({ left: 16, right: 16 });
            // 顶部导航
            Row.backgroundColor('#ffffff');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('<');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(166:9)", "entry");
            Text.fontSize(28);
            Text.fontColor('#333333');
            Text.onClick(() => router.back());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('蓝牙配网');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(171:9)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.margin({ left: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(176:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 蓝牙状态指示
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(179:9)", "entry");
            // 蓝牙状态指示
            Row.onClick(() => this.checkBluetooth());
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.bluetoothEnabled ? '🔵' : '⚫');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(180:11)", "entry");
            Text.fontSize(12);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.bluetoothEnabled ? '蓝牙已开' : '蓝牙关闭');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(182:11)", "entry");
            Text.fontSize(11);
            Text.fontColor(this.bluetoothEnabled ? '#52c41a' : '#ff4d4f');
        }, Text);
        Text.pop();
        // 蓝牙状态指示
        Row.pop();
        // 顶部导航
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(193:7)", "entry");
            Scroll.layoutWeight(1);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(194:9)", "entry");
            Column.padding(16);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 扫描区域
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(196:11)", "entry");
            // 扫描区域
            Column.width('100%');
            // 扫描区域
            Column.backgroundColor('#ffffff');
            // 扫描区域
            Column.borderRadius(16);
            // 扫描区域
            Column.margin({ top: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('📡');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(197:13)", "entry");
            Text.fontSize(48);
            Text.margin({ top: 20 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('扫描周围蓝牙设备');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(201:13)", "entry");
            Text.fontSize(16);
            Text.fontColor('#333333');
            Text.margin({ top: 12 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isScanning) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`扫描中... ${this.scanProgress}%`);
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(207:15)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#1890ff');
                        Text.margin({ top: 8 });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(213:13)", "entry");
            Button.width('80%');
            Button.height(44);
            Button.backgroundColor(this.isScanning ? '#ff4d4f' : '#1890ff');
            Button.borderRadius(22);
            Button.onClick(() => {
                if (this.isScanning) {
                    this.stopScan();
                }
                else {
                    this.startScan();
                }
            });
            Button.margin({ top: 20 });
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(214:15)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isScanning) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(216:19)", "entry");
                        LoadingProgress.width(18);
                        LoadingProgress.height(18);
                        LoadingProgress.color('#ffffff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('  停止扫描');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(220:19)", "entry");
                        Text.fontColor('#ffffff');
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔍 开始扫描');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(223:19)", "entry");
                        Text.fontColor('#ffffff');
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        Row.pop();
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('确保设备已进入配网模式');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(241:13)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
            Text.margin({ top: 12, bottom: 16 });
        }, Text);
        Text.pop();
        // 扫描区域
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 设备列表
            if (this.discoveredDevices.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(253:13)", "entry");
                        Column.width('100%');
                        Column.padding(16);
                        Column.backgroundColor('#ffffff');
                        Column.borderRadius(12);
                        Column.margin({ top: 12 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(254:15)", "entry");
                        Row.width('100%');
                        Row.margin({ bottom: 12 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('发现设备');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(255:17)", "entry");
                        Text.fontSize(16);
                        Text.fontWeight(FontWeight.Medium);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(` (${this.discoveredDevices.length})`);
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(258:17)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#1890ff');
                    }, Text);
                    Text.pop();
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const device = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create();
                                Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(266:17)", "entry");
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Row.create();
                                Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(267:19)", "entry");
                                Row.width('100%');
                                Row.padding(12);
                                Row.backgroundColor(this.selectedDevice?.deviceId === device.deviceId ? '#e6f7ff' : '#fafafa');
                                Row.borderRadius(12);
                                Row.borderWidth(this.selectedDevice?.deviceId === device.deviceId ? 1 : 0);
                                Row.borderColor('#1890ff');
                                Row.onClick(() => {
                                    this.selectDevice(device);
                                });
                            }, Row);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create();
                                Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(268:21)", "entry");
                                Column.width(44);
                                Column.height(44);
                                Column.backgroundColor(this.selectedDevice?.deviceId === device.deviceId ? '#e6f7ff' : '#f5f5f5');
                                Column.borderRadius(10);
                                Column.justifyContent(FlexAlign.Center);
                                Column.alignItems(HorizontalAlign.Center);
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('📱');
                                Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(269:23)", "entry");
                                Text.fontSize(28);
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(this.getSignalIcon(device.rssi));
                                Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(271:23)", "entry");
                                Text.fontSize(10);
                                Text.position({ x: 32, y: 32 });
                            }, Text);
                            Text.pop();
                            Column.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create();
                                Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(282:21)", "entry");
                                Column.alignItems(HorizontalAlign.Start);
                                Column.margin({ left: 12 });
                                Column.layoutWeight(1);
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(device.deviceName);
                                Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(283:23)", "entry");
                                Text.fontSize(15);
                                Text.fontWeight(FontWeight.Medium);
                                Text.fontColor('#333333');
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(device.deviceId);
                                Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(287:23)", "entry");
                                Text.fontSize(11);
                                Text.fontColor('#999999');
                                Text.margin({ top: 2 });
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(`信号: ${device.rssi} dBm`);
                                Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(291:23)", "entry");
                                Text.fontSize(11);
                                Text.fontColor(device.rssi >= -70 ? '#52c41a' : '#faad14');
                                Text.margin({ top: 2 });
                            }, Text);
                            Text.pop();
                            Column.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Radio.create({ value: device.deviceId, group: 'devices' });
                                Radio.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(300:21)", "entry");
                                Radio.checked(this.selectedDevice?.deviceId === device.deviceId);
                                Radio.onChange((checked: boolean) => {
                                    if (checked) {
                                        this.selectDevice(device);
                                    }
                                });
                            }, Radio);
                            Row.pop();
                            Column.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.discoveredDevices, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
                });
            }
            // WiFi 配置
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // WiFi 配置
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(328:11)", "entry");
            // WiFi 配置
            Column.width('100%');
            // WiFi 配置
            Column.padding(16);
            // WiFi 配置
            Column.backgroundColor('#ffffff');
            // WiFi 配置
            Column.borderRadius(12);
            // WiFi 配置
            Column.margin({ top: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('WiFi 配置');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(329:13)", "entry");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.width('100%');
            Text.margin({ bottom: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 当前WiFi提示
            if (this.currentWifi) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(337:15)", "entry");
                        Row.width('100%');
                        Row.margin({ bottom: 16 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('📶 当前已连接: ');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(338:17)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#666666');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.currentWifi);
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(341:17)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#1890ff');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(344:17)", "entry");
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('使用此网络');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(345:17)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#52c41a');
                        Text.onClick(() => this.useCurrentWifi());
                    }, Text);
                    Text.pop();
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('WiFi 名称 (SSID)');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(354:13)", "entry");
            Text.fontSize(12);
            Text.fontColor('#666666');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '请输入WiFi名称', text: this.ssid });
            TextInput.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(359:13)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.margin({ top: 8, bottom: 16 });
            TextInput.onChange((value: string) => {
                this.ssid = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('WiFi 密码');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(369:13)", "entry");
            Text.fontSize(12);
            Text.fontColor('#666666');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '请输入WiFi密码', text: this.password });
            TextInput.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(374:13)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.margin({ top: 8 });
            TextInput.type(InputType.Password);
            TextInput.onChange((value: string) => {
                this.password = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.errorMessage) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.errorMessage);
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(386:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#ff4d4f');
                        Text.margin({ top: 8 });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(392:13)", "entry");
            Button.width('100%');
            Button.height(48);
            Button.backgroundColor('#52c41a');
            Button.borderRadius(24);
            Button.margin({ top: 24 });
            Button.enabled(!!this.selectedDevice && !!this.ssid.trim() && !!this.password.trim() && !this.isProvisioning);
            Button.opacity(!!this.selectedDevice && !!this.ssid.trim() && !!this.password.trim() ? 1 : 0.5);
            Button.onClick(() => this.startProvision());
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(393:15)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isProvisioning) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(395:19)", "entry");
                        LoadingProgress.width(18);
                        LoadingProgress.height(18);
                        LoadingProgress.color('#ffffff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('  配网中...');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(399:19)", "entry");
                        Text.fontColor('#ffffff');
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🚀 开始配网');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(402:19)", "entry");
                        Text.fontColor('#ffffff');
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        Row.pop();
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('设备将收到WiFi信息并自动连接');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(416:13)", "entry");
            Text.fontSize(11);
            Text.fontColor('#999999');
            Text.margin({ top: 12, bottom: 16 });
        }, Text);
        Text.pop();
        // WiFi 配置
        Column.pop();
        Column.pop();
        Scroll.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "DeviceProvision";
    }
}
registerNamedRoute(() => new DeviceProvision(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/DeviceProvision", pageFullPath: "entry/src/main/ets/pages/DeviceProvision", integratedHsp: "false", moduleType: "followWithHap" });
