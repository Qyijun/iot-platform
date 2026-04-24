if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ServerSettings_Params {
    protocol?: string;
    host?: string;
    port?: string;
    testing?: boolean;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import { configService } from "@normalized:N&&&entry/src/main/ets/services/ConfigService&";
import { testConnection } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
class ServerSettings extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__protocol = new ObservedPropertySimplePU('http', this, "protocol");
        this.__host = new ObservedPropertySimplePU('', this, "host");
        this.__port = new ObservedPropertySimplePU('3000', this, "port");
        this.__testing = new ObservedPropertySimplePU(false, this, "testing");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ServerSettings_Params) {
        if (params.protocol !== undefined) {
            this.protocol = params.protocol;
        }
        if (params.host !== undefined) {
            this.host = params.host;
        }
        if (params.port !== undefined) {
            this.port = params.port;
        }
        if (params.testing !== undefined) {
            this.testing = params.testing;
        }
    }
    updateStateVars(params: ServerSettings_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__protocol.purgeDependencyOnElmtId(rmElmtId);
        this.__host.purgeDependencyOnElmtId(rmElmtId);
        this.__port.purgeDependencyOnElmtId(rmElmtId);
        this.__testing.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__protocol.aboutToBeDeleted();
        this.__host.aboutToBeDeleted();
        this.__port.aboutToBeDeleted();
        this.__testing.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __protocol: ObservedPropertySimplePU<string>;
    get protocol() {
        return this.__protocol.get();
    }
    set protocol(newValue: string) {
        this.__protocol.set(newValue);
    }
    private __host: ObservedPropertySimplePU<string>;
    get host() {
        return this.__host.get();
    }
    set host(newValue: string) {
        this.__host.set(newValue);
    }
    private __port: ObservedPropertySimplePU<string>;
    get port() {
        return this.__port.get();
    }
    set port(newValue: string) {
        this.__port.set(newValue);
    }
    private __testing: ObservedPropertySimplePU<boolean>;
    get testing() {
        return this.__testing.get();
    }
    set testing(newValue: boolean) {
        this.__testing.set(newValue);
    }
    aboutToAppear() {
        const config = configService.getConfig();
        this.protocol = config.protocol;
        this.host = config.host;
        this.port = String(config.port);
    }
    async testConnection() {
        if (!this.host.trim()) {
            promptAction.showToast({ message: '请输入服务器地址' });
            return;
        }
        this.testing = true;
        try {
            // 保存配置
            configService.setConfig({
                protocol: this.protocol,
                host: this.host.trim(),
                port: parseInt(this.port) || 3000
            });
            // 测试连接
            const result = await testConnection();
            promptAction.showToast({ message: result.message });
        }
        catch (e) {
            promptAction.showToast({ message: '连接失败' });
        }
        finally {
            this.testing = false;
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ServerSettings.ets(48:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f0f2f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 顶部导航
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/ServerSettings.ets(50:7)", "entry");
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
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(51:9)", "entry");
            Text.fontSize(24);
            Text.onClick(() => router.back());
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('服务器设置');
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(55:9)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('');
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(60:9)", "entry");
            Text.width(24);
        }, Text);
        Text.pop();
        // 顶部导航
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/pages/ServerSettings.ets(68:7)", "entry");
            Scroll.layoutWeight(1);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ServerSettings.ets(69:9)", "entry");
            Column.padding(16);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 说明文字
            Text.create('配置后端服务器地址，用于API请求和WebSocket连接');
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(71:11)", "entry");
            // 说明文字
            Text.fontSize(14);
            // 说明文字
            Text.fontColor('#666666');
            // 说明文字
            Text.width('100%');
            // 说明文字
            Text.padding(16);
        }, Text);
        // 说明文字
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 协议选择
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ServerSettings.ets(78:11)", "entry");
            // 协议选择
            Column.width('100%');
            // 协议选择
            Column.padding(16);
            // 协议选择
            Column.backgroundColor('#ffffff');
            // 协议选择
            Column.margin({ top: 1 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('协议');
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(79:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
            Text.width('100%');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/ServerSettings.ets(84:13)", "entry");
            Row.width('100%');
            Row.margin({ top: 8 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Radio.create({ value: 'http', group: 'protocol' });
            Radio.debugLine("entry/src/main/ets/pages/ServerSettings.ets(85:15)", "entry");
            Radio.checked(this.protocol === 'http');
            Radio.onChange((isChecked: boolean) => {
                if (isChecked)
                    this.protocol = 'http';
            });
        }, Radio);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('HTTP');
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(91:15)", "entry");
            Text.fontSize(14);
            Text.margin({ right: 32 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Radio.create({ value: 'https', group: 'protocol' });
            Radio.debugLine("entry/src/main/ets/pages/ServerSettings.ets(95:15)", "entry");
            Radio.checked(this.protocol === 'https');
            Radio.onChange((isChecked: boolean) => {
                if (isChecked)
                    this.protocol = 'https';
            });
        }, Radio);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('HTTPS');
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(101:15)", "entry");
            Text.fontSize(14);
        }, Text);
        Text.pop();
        Row.pop();
        // 协议选择
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 服务器地址
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ServerSettings.ets(113:11)", "entry");
            // 服务器地址
            Column.width('100%');
            // 服务器地址
            Column.padding(16);
            // 服务器地址
            Column.backgroundColor('#ffffff');
            // 服务器地址
            Column.margin({ top: 1 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('服务器地址');
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(114:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '例如: 192.168.1.100', text: this.host });
            TextInput.debugLine("entry/src/main/ets/pages/ServerSettings.ets(118:13)", "entry");
            TextInput.width('100%');
            TextInput.height(48);
            TextInput.margin({ top: 8 });
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.fontSize(16);
            TextInput.onChange((value: string) => {
                this.host = value;
            });
        }, TextInput);
        // 服务器地址
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 端口号
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ServerSettings.ets(135:11)", "entry");
            // 端口号
            Column.width('100%');
            // 端口号
            Column.padding(16);
            // 端口号
            Column.backgroundColor('#ffffff');
            // 端口号
            Column.margin({ top: 1 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('端口号');
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(136:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '3000', text: this.port });
            TextInput.debugLine("entry/src/main/ets/pages/ServerSettings.ets(140:13)", "entry");
            TextInput.width('100%');
            TextInput.height(48);
            TextInput.margin({ top: 8 });
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.fontSize(16);
            TextInput.type(InputType.Number);
            TextInput.onChange((value: string) => {
                this.port = value;
            });
        }, TextInput);
        // 端口号
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 预览地址
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ServerSettings.ets(158:11)", "entry");
            // 预览地址
            Column.width('100%');
            // 预览地址
            Column.padding(16);
            // 预览地址
            Column.backgroundColor('#ffffff');
            // 预览地址
            Column.margin({ top: 1 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('当前地址');
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(159:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(`${this.protocol}://${this.host || '(未设置)'}:${this.port || '3000'}`);
            Text.debugLine("entry/src/main/ets/pages/ServerSettings.ets(163:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#1890ff');
            Text.margin({ top: 8 });
        }, Text);
        Text.pop();
        // 预览地址
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 测试连接按钮
            Button.createWithLabel(this.testing ? '测试中...' : '测试连接');
            Button.debugLine("entry/src/main/ets/pages/ServerSettings.ets(174:11)", "entry");
            // 测试连接按钮
            Button.width('100%');
            // 测试连接按钮
            Button.height(48);
            // 测试连接按钮
            Button.fontSize(16);
            // 测试连接按钮
            Button.fontColor('#ffffff');
            // 测试连接按钮
            Button.backgroundColor('#1890ff');
            // 测试连接按钮
            Button.borderRadius(8);
            // 测试连接按钮
            Button.margin({ top: 24 });
            // 测试连接按钮
            Button.enabled(!this.testing);
            // 测试连接按钮
            Button.onClick(() => this.testConnection());
        }, Button);
        // 测试连接按钮
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 保存按钮
            Button.createWithLabel('保存设置');
            Button.debugLine("entry/src/main/ets/pages/ServerSettings.ets(186:11)", "entry");
            // 保存按钮
            Button.width('100%');
            // 保存按钮
            Button.height(48);
            // 保存按钮
            Button.fontSize(16);
            // 保存按钮
            Button.fontColor('#ffffff');
            // 保存按钮
            Button.backgroundColor('#52c41a');
            // 保存按钮
            Button.borderRadius(8);
            // 保存按钮
            Button.margin({ top: 16 });
            // 保存按钮
            Button.onClick(() => {
                configService.setConfig({
                    protocol: this.protocol,
                    host: this.host.trim(),
                    port: parseInt(this.port) || 3000
                });
                promptAction.showToast({ message: '设置已保存' });
                router.back();
            });
        }, Button);
        // 保存按钮
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 重置按钮
            Button.createWithLabel('恢复默认');
            Button.debugLine("entry/src/main/ets/pages/ServerSettings.ets(205:11)", "entry");
            // 重置按钮
            Button.width('100%');
            // 重置按钮
            Button.height(48);
            // 重置按钮
            Button.fontSize(16);
            // 重置按钮
            Button.fontColor('#666666');
            // 重置按钮
            Button.backgroundColor('#ffffff');
            // 重置按钮
            Button.borderRadius(8);
            // 重置按钮
            Button.margin({ top: 16 });
            // 重置按钮
            Button.borderWidth(1);
            // 重置按钮
            Button.borderColor('#d9d9d9');
            // 重置按钮
            Button.onClick(() => {
                configService.reset();
                const config = configService.getConfig();
                this.protocol = config.protocol;
                this.host = config.host;
                this.port = String(config.port);
                promptAction.showToast({ message: '已恢复默认设置' });
            });
        }, Button);
        // 重置按钮
        Button.pop();
        Column.pop();
        Scroll.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "ServerSettings";
    }
}
registerNamedRoute(() => new ServerSettings(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/ServerSettings", pageFullPath: "entry/src/main/ets/pages/ServerSettings", integratedHsp: "false", moduleType: "followWithHap" });
