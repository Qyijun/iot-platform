if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface AddDevice_Params {
    name?: string;
    type?: string;
    location?: string;
    deviceKey?: string;
    isSubmitting?: boolean;
    deviceTypes?: string[];
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
import { deviceViewModel } from "@normalized:N&&&entry/src/main/ets/viewmodels/DeviceViewModel&";
import type { ApiResponse } from '../models/Device';
class AddDevice extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__name = new ObservedPropertySimplePU('', this, "name");
        this.__type = new ObservedPropertySimplePU('ESP32', this, "type");
        this.__location = new ObservedPropertySimplePU('', this, "location");
        this.__deviceKey = new ObservedPropertySimplePU('', this, "deviceKey");
        this.__isSubmitting = new ObservedPropertySimplePU(false, this, "isSubmitting");
        this.deviceTypes = ['ESP32', 'DHT22', 'Relay', 'LED', 'Custom'];
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: AddDevice_Params) {
        if (params.name !== undefined) {
            this.name = params.name;
        }
        if (params.type !== undefined) {
            this.type = params.type;
        }
        if (params.location !== undefined) {
            this.location = params.location;
        }
        if (params.deviceKey !== undefined) {
            this.deviceKey = params.deviceKey;
        }
        if (params.isSubmitting !== undefined) {
            this.isSubmitting = params.isSubmitting;
        }
        if (params.deviceTypes !== undefined) {
            this.deviceTypes = params.deviceTypes;
        }
    }
    updateStateVars(params: AddDevice_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__name.purgeDependencyOnElmtId(rmElmtId);
        this.__type.purgeDependencyOnElmtId(rmElmtId);
        this.__location.purgeDependencyOnElmtId(rmElmtId);
        this.__deviceKey.purgeDependencyOnElmtId(rmElmtId);
        this.__isSubmitting.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__name.aboutToBeDeleted();
        this.__type.aboutToBeDeleted();
        this.__location.aboutToBeDeleted();
        this.__deviceKey.aboutToBeDeleted();
        this.__isSubmitting.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __name: ObservedPropertySimplePU<string>;
    get name() {
        return this.__name.get();
    }
    set name(newValue: string) {
        this.__name.set(newValue);
    }
    private __type: ObservedPropertySimplePU<string>;
    get type() {
        return this.__type.get();
    }
    set type(newValue: string) {
        this.__type.set(newValue);
    }
    private __location: ObservedPropertySimplePU<string>;
    get location() {
        return this.__location.get();
    }
    set location(newValue: string) {
        this.__location.set(newValue);
    }
    private __deviceKey: ObservedPropertySimplePU<string>;
    get deviceKey() {
        return this.__deviceKey.get();
    }
    set deviceKey(newValue: string) {
        this.__deviceKey.set(newValue);
    }
    private __isSubmitting: ObservedPropertySimplePU<boolean>;
    get isSubmitting() {
        return this.__isSubmitting.get();
    }
    set isSubmitting(newValue: boolean) {
        this.__isSubmitting.set(newValue);
    }
    private deviceTypes: string[];
    async submit() {
        if (!this.name.trim()) {
            promptAction.showToast({ message: '请输入设备名称' });
            return;
        }
        this.isSubmitting = true;
        try {
            const res = await httpService.createDevice({
                name: this.name.trim(),
                type: this.type,
                location: this.location.trim() || undefined,
                deviceKey: this.deviceKey.trim() || undefined
            });
            const result = res as ApiResponse<Object>;
            if (result.code === 0 || result.success) {
                promptAction.showToast({ message: '设备添加成功' });
                // 刷新设备列表
                await deviceViewModel.loadDevices();
                router.back();
            }
            else {
                promptAction.showToast({ message: result.message || '添加失败' });
            }
        }
        catch (e) {
            promptAction.showToast({ message: '添加失败，请检查网络' });
        }
        finally {
            this.isSubmitting = false;
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/AddDevice.ets(52:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f0f2f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 顶部导航
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/AddDevice.ets(54:7)", "entry");
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
            Text.debugLine("entry/src/main/ets/pages/AddDevice.ets(55:9)", "entry");
            Text.fontSize(24);
            Text.onClick(() => router.back());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('添加设备');
            Text.debugLine("entry/src/main/ets/pages/AddDevice.ets(59:9)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('');
            Text.debugLine("entry/src/main/ets/pages/AddDevice.ets(64:9)", "entry");
            Text.width(24);
        }, Text);
        Text.pop();
        // 顶部导航
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/pages/AddDevice.ets(72:7)", "entry");
            Scroll.layoutWeight(1);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/AddDevice.ets(73:9)", "entry");
            Column.padding(16);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 设备名称
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/AddDevice.ets(75:11)", "entry");
            // 设备名称
            Column.width('100%');
            // 设备名称
            Column.padding(16);
            // 设备名称
            Column.backgroundColor('#ffffff');
            // 设备名称
            Column.margin({ top: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('设备名称 *');
            Text.debugLine("entry/src/main/ets/pages/AddDevice.ets(76:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '请输入设备名称', text: this.name });
            TextInput.debugLine("entry/src/main/ets/pages/AddDevice.ets(80:13)", "entry");
            TextInput.width('100%');
            TextInput.height(48);
            TextInput.margin({ top: 8 });
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.fontSize(16);
            TextInput.onChange((value: string) => {
                this.name = value;
            });
        }, TextInput);
        // 设备名称
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 设备类型
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/AddDevice.ets(97:11)", "entry");
            // 设备类型
            Column.width('100%');
            // 设备类型
            Column.padding(16);
            // 设备类型
            Column.backgroundColor('#ffffff');
            // 设备类型
            Column.margin({ top: 1 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('设备类型');
            Text.debugLine("entry/src/main/ets/pages/AddDevice.ets(98:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/AddDevice.ets(102:13)", "entry");
            Row.margin({ top: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const t = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(t);
                    Text.debugLine("entry/src/main/ets/pages/AddDevice.ets(104:17)", "entry");
                    Text.fontSize(14);
                    Text.padding({ left: 16, right: 16, top: 8, bottom: 8 });
                    Text.fontColor(this.type === t ? '#ffffff' : '#666666');
                    Text.backgroundColor(this.type === t ? '#1890ff' : '#f5f5f5');
                    Text.borderRadius(20);
                    Text.margin({ right: 12 });
                    Text.onClick(() => {
                        this.type = t;
                    });
                }, Text);
                Text.pop();
            };
            this.forEachUpdateFunction(elmtId, this.deviceTypes, forEachItemGenFunction);
        }, ForEach);
        ForEach.pop();
        Row.pop();
        // 设备类型
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 安装位置
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/AddDevice.ets(124:11)", "entry");
            // 安装位置
            Column.width('100%');
            // 安装位置
            Column.padding(16);
            // 安装位置
            Column.backgroundColor('#ffffff');
            // 安装位置
            Column.margin({ top: 1 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('安装位置');
            Text.debugLine("entry/src/main/ets/pages/AddDevice.ets(125:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '如：客厅、卧室、厨房', text: this.location });
            TextInput.debugLine("entry/src/main/ets/pages/AddDevice.ets(129:13)", "entry");
            TextInput.width('100%');
            TextInput.height(48);
            TextInput.margin({ top: 8 });
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.fontSize(16);
            TextInput.onChange((value: string) => {
                this.location = value;
            });
        }, TextInput);
        // 安装位置
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 设备密钥 (可选)
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/AddDevice.ets(146:11)", "entry");
            // 设备密钥 (可选)
            Column.width('100%');
            // 设备密钥 (可选)
            Column.padding(16);
            // 设备密钥 (可选)
            Column.backgroundColor('#ffffff');
            // 设备密钥 (可选)
            Column.margin({ top: 1 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('设备密钥 (可选)');
            Text.debugLine("entry/src/main/ets/pages/AddDevice.ets(147:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '设备的唯一标识密钥', text: this.deviceKey });
            TextInput.debugLine("entry/src/main/ets/pages/AddDevice.ets(151:13)", "entry");
            TextInput.width('100%');
            TextInput.height(48);
            TextInput.margin({ top: 8 });
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.fontSize(16);
            TextInput.onChange((value: string) => {
                this.deviceKey = value;
            });
        }, TextInput);
        // 设备密钥 (可选)
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 说明
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/AddDevice.ets(168:11)", "entry");
            // 说明
            Column.width('100%');
            // 说明
            Column.padding(16);
            // 说明
            Column.backgroundColor('#f5f5f5');
            // 说明
            Column.margin({ top: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('💡 提示');
            Text.debugLine("entry/src/main/ets/pages/AddDevice.ets(169:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('设备密钥是ESP32烧录固件时设置的唯一标识，用于绑定设备到您的账户。');
            Text.debugLine("entry/src/main/ets/pages/AddDevice.ets(173:13)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
            Text.margin({ top: 8 });
        }, Text);
        Text.pop();
        // 说明
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 提交按钮
            Button.createWithLabel(this.isSubmitting ? '添加中...' : '添加设备');
            Button.debugLine("entry/src/main/ets/pages/AddDevice.ets(184:11)", "entry");
            // 提交按钮
            Button.width('100%');
            // 提交按钮
            Button.height(48);
            // 提交按钮
            Button.fontSize(16);
            // 提交按钮
            Button.fontColor('#ffffff');
            // 提交按钮
            Button.backgroundColor('#52c41a');
            // 提交按钮
            Button.borderRadius(8);
            // 提交按钮
            Button.margin({ top: 32 });
            // 提交按钮
            Button.enabled(!this.isSubmitting);
            // 提交按钮
            Button.onClick(() => this.submit());
        }, Button);
        // 提交按钮
        Button.pop();
        Column.pop();
        Scroll.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "AddDevice";
    }
}
registerNamedRoute(() => new AddDevice(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/AddDevice", pageFullPath: "entry/src/main/ets/pages/AddDevice", integratedHsp: "false", moduleType: "followWithHap" });
