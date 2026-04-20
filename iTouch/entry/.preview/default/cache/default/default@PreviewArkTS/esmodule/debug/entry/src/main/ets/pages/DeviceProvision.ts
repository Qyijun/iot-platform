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
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import { bluetoothService } from "@normalized:N&&&entry/src/main/ets/services/BluetoothService&";
interface DiscoveredDevice {
    deviceId: string;
    deviceName: string;
    rssi: number;
}
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
    }
    aboutToBeDeleted() {
        this.__isScanning.aboutToBeDeleted();
        this.__discoveredDevices.aboutToBeDeleted();
        this.__selectedDevice.aboutToBeDeleted();
        this.__ssid.aboutToBeDeleted();
        this.__password.aboutToBeDeleted();
        this.__isProvisioning.aboutToBeDeleted();
        this.__scanProgress.aboutToBeDeleted();
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
    aboutToDisappear() {
        bluetoothService.stopDiscovery();
    }
    async startScan() {
        this.isScanning = true;
        this.discoveredDevices = [];
        this.scanProgress = 0;
        bluetoothService.setOnDeviceFound((device) => {
            this.discoveredDevices = [...this.discoveredDevices, device];
        });
        try {
            await bluetoothService.startDiscovery();
            // 扫描 10 秒
            const timer = setInterval(() => {
                this.scanProgress += 10;
                if (this.scanProgress >= 100) {
                    clearInterval(timer);
                    this.isScanning = false;
                    bluetoothService.stopDiscovery();
                }
            }, 1000);
        }
        catch (e) {
            this.isScanning = false;
            promptAction.showToast({ message: '蓝牙扫描失败: ' + e.message });
        }
    }
    stopScan() {
        this.isScanning = false;
        bluetoothService.stopDiscovery();
    }
    async startProvision() {
        if (!this.selectedDevice) {
            promptAction.showToast({ message: '请先选择设备' });
            return;
        }
        if (!this.ssid) {
            promptAction.showToast({ message: '请输入 WiFi 名称' });
            return;
        }
        if (!this.password) {
            promptAction.showToast({ message: '请输入 WiFi 密码' });
            return;
        }
        this.isProvisioning = true;
        try {
            const result = await bluetoothService.provisionDevice(this.selectedDevice.deviceId, {
                ssid: this.ssid,
                password: this.password
            });
            if (result) {
                promptAction.showToast({ message: '配网成功！' });
                setTimeout(() => router.back(), 1500);
            }
        }
        finally {
            this.isProvisioning = false;
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(90:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f0f2f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 顶部导航
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(92:7)", "entry");
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
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(93:9)", "entry");
            Text.fontSize(28);
            Text.fontColor('#333333');
            Text.onClick(() => router.back());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('蓝牙配网');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(98:9)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.margin({ left: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(103:9)", "entry");
        }, Blank);
        Blank.pop();
        // 顶部导航
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(110:7)", "entry");
            Scroll.layoutWeight(1);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(111:9)", "entry");
            Column.padding(16);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 扫描区域
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(113:11)", "entry");
            // 扫描区域
            Column.width('100%');
            // 扫描区域
            Column.padding(16);
            // 扫描区域
            Column.backgroundColor('#ffffff');
            // 扫描区域
            Column.borderRadius(12);
            // 扫描区域
            Column.margin({ top: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(114:13)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('发现设备');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(115:15)", "entry");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(119:15)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isScanning) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`${this.scanProgress}%`);
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(122:17)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#1890ff');
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
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(129:13)", "entry");
            Button.width('100%');
            Button.height(44);
            Button.backgroundColor(this.isScanning ? '#ff4d4f' : '#1890ff');
            Button.borderRadius(8);
            Button.onClick(() => {
                if (this.isScanning) {
                    this.stopScan();
                }
                else {
                    this.startScan();
                }
            });
            Button.margin({ top: 16 });
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(130:15)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isScanning) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(132:19)", "entry");
                        LoadingProgress.width(16);
                        LoadingProgress.height(16);
                        LoadingProgress.color('#ffffff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('  扫描中...');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(136:19)", "entry");
                        Text.fontColor('#ffffff');
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('开始扫描');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(139:19)", "entry");
                        Text.fontColor('#ffffff');
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        Row.pop();
        Button.pop();
        // 扫描区域
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 设备列表
            if (this.discoveredDevices.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(165:13)", "entry");
                        Column.width('100%');
                        Column.padding(16);
                        Column.backgroundColor('#ffffff');
                        Column.borderRadius(12);
                        Column.margin({ top: 12 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`发现 ${this.discoveredDevices.length} 个设备`);
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(166:15)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#666666');
                        Text.margin({ bottom: 12 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const device = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Row.create();
                                Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(172:17)", "entry");
                                Row.width('100%');
                                Row.padding(12);
                                Row.backgroundColor(this.selectedDevice?.deviceId === device.deviceId ? '#e6f7ff' : '#fafafa');
                                Row.borderRadius(8);
                                Row.margin({ bottom: 8 });
                                Row.onClick(() => {
                                    this.selectedDevice = device;
                                });
                            }, Row);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create();
                                Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(173:19)", "entry");
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('📡');
                                Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(174:21)", "entry");
                                Text.fontSize(24);
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(device.deviceName);
                                Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(176:21)", "entry");
                                Text.fontSize(14);
                                Text.margin({ top: 4 });
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(`信号: ${device.rssi} dBm`);
                                Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(179:21)", "entry");
                                Text.fontSize(11);
                                Text.fontColor('#999999');
                            }, Text);
                            Text.pop();
                            Column.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Blank.create();
                                Blank.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(184:19)", "entry");
                            }, Blank);
                            Blank.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Radio.create({ value: device.deviceId, group: 'devices' });
                                Radio.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(186:19)", "entry");
                                Radio.checked(this.selectedDevice?.deviceId === device.deviceId);
                                Radio.onChange((checked: boolean) => {
                                    if (checked) {
                                        this.selectedDevice = device;
                                    }
                                });
                            }, Radio);
                            Row.pop();
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
            Column.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(212:11)", "entry");
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
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(213:13)", "entry");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.width('100%');
            Text.margin({ bottom: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('WiFi 名称');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(219:13)", "entry");
            Text.fontSize(12);
            Text.fontColor('#666666');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '请输入 WiFi 名称', text: this.ssid });
            TextInput.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(224:13)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.margin({ top: 8, bottom: 16 });
            TextInput.onChange((value: string) => {
                this.ssid = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('WiFi 密码');
            Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(232:13)", "entry");
            Text.fontSize(12);
            Text.fontColor('#666666');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '请输入 WiFi 密码', text: this.password });
            TextInput.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(237:13)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.margin({ top: 8 });
            TextInput.type(InputType.Password);
            TextInput.onChange((value: string) => {
                this.password = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(246:13)", "entry");
            Button.width('100%');
            Button.height(44);
            Button.backgroundColor('#52c41a');
            Button.borderRadius(8);
            Button.margin({ top: 24 });
            Button.enabled(!!this.selectedDevice && !!this.ssid && !!this.password && !this.isProvisioning);
            Button.onClick(() => this.startProvision());
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(247:15)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isProvisioning) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(249:19)", "entry");
                        LoadingProgress.width(16);
                        LoadingProgress.height(16);
                        LoadingProgress.color('#ffffff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('  配网中...');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(253:19)", "entry");
                        Text.fontColor('#ffffff');
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('开始配网');
                        Text.debugLine("entry/src/main/ets/pages/DeviceProvision.ets(256:19)", "entry");
                        Text.fontColor('#ffffff');
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        Row.pop();
        Button.pop();
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
