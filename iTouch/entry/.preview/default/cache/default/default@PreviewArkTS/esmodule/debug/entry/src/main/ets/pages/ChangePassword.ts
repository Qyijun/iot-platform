if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ChangePassword_Params {
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    isSaving?: boolean;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import http from "@ohos:net.http";
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
class ChangePassword extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__oldPassword = new ObservedPropertySimplePU('', this, "oldPassword");
        this.__newPassword = new ObservedPropertySimplePU('', this, "newPassword");
        this.__confirmPassword = new ObservedPropertySimplePU('', this, "confirmPassword");
        this.__isSaving = new ObservedPropertySimplePU(false, this, "isSaving");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ChangePassword_Params) {
        if (params.oldPassword !== undefined) {
            this.oldPassword = params.oldPassword;
        }
        if (params.newPassword !== undefined) {
            this.newPassword = params.newPassword;
        }
        if (params.confirmPassword !== undefined) {
            this.confirmPassword = params.confirmPassword;
        }
        if (params.isSaving !== undefined) {
            this.isSaving = params.isSaving;
        }
    }
    updateStateVars(params: ChangePassword_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__oldPassword.purgeDependencyOnElmtId(rmElmtId);
        this.__newPassword.purgeDependencyOnElmtId(rmElmtId);
        this.__confirmPassword.purgeDependencyOnElmtId(rmElmtId);
        this.__isSaving.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__oldPassword.aboutToBeDeleted();
        this.__newPassword.aboutToBeDeleted();
        this.__confirmPassword.aboutToBeDeleted();
        this.__isSaving.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __oldPassword: ObservedPropertySimplePU<string>;
    get oldPassword() {
        return this.__oldPassword.get();
    }
    set oldPassword(newValue: string) {
        this.__oldPassword.set(newValue);
    }
    private __newPassword: ObservedPropertySimplePU<string>;
    get newPassword() {
        return this.__newPassword.get();
    }
    set newPassword(newValue: string) {
        this.__newPassword.set(newValue);
    }
    private __confirmPassword: ObservedPropertySimplePU<string>;
    get confirmPassword() {
        return this.__confirmPassword.get();
    }
    set confirmPassword(newValue: string) {
        this.__confirmPassword.set(newValue);
    }
    private __isSaving: ObservedPropertySimplePU<boolean>;
    get isSaving() {
        return this.__isSaving.get();
    }
    set isSaving(newValue: boolean) {
        this.__isSaving.set(newValue);
    }
    async changePassword() {
        // 表单验证
        if (!this.oldPassword) {
            promptAction.showToast({ message: '请输入当前密码' });
            return;
        }
        if (!this.newPassword) {
            promptAction.showToast({ message: '请输入新密码' });
            return;
        }
        if (this.newPassword.length < 6) {
            promptAction.showToast({ message: '新密码至少6个字符' });
            return;
        }
        if (!this.confirmPassword) {
            promptAction.showToast({ message: '请确认新密码' });
            return;
        }
        if (this.newPassword !== this.confirmPassword) {
            promptAction.showToast({ message: '两次输入的密码不一致' });
            return;
        }
        if (this.oldPassword === this.newPassword) {
            promptAction.showToast({ message: '新密码不能与当前密码相同' });
            return;
        }
        this.isSaving = true;
        try {
            const res: Record<string, Object> = await httpService.request('/api/auth/change-password', {
                method: http.RequestMethod.PUT,
                extraData: {
                    oldPassword: this.oldPassword,
                    newPassword: this.newPassword
                }
            }) as Record<string, Object>;
            if (res['success']) {
                promptAction.showToast({ message: '密码修改成功' });
                setTimeout(() => {
                    router.back();
                }, 1000);
            }
            else {
                promptAction.showToast({ message: res['error'] as string || '修改失败' });
            }
        }
        catch (e) {
            console.error('ChangePassword', `修改失败: ${e}`);
            promptAction.showToast({ message: '网络错误，请重试' });
        }
        this.isSaving = false;
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ChangePassword.ets(75:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f0f2f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 顶部导航栏
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/ChangePassword.ets(77:7)", "entry");
            // 顶部导航栏
            Row.width('100%');
            // 顶部导航栏
            Row.height(56);
            // 顶部导航栏
            Row.padding({ left: 16, right: 16 });
            // 顶部导航栏
            Row.backgroundColor('#ffffff');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('←');
            Text.debugLine("entry/src/main/ets/pages/ChangePassword.ets(78:9)", "entry");
            Text.fontSize(24);
            Text.fontColor('#333333');
            Text.onClick(() => {
                router.back();
            });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('修改密码');
            Text.debugLine("entry/src/main/ets/pages/ChangePassword.ets(84:9)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.margin({ left: 12 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/ChangePassword.ets(88:9)", "entry");
        }, Blank);
        Blank.pop();
        // 顶部导航栏
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/pages/ChangePassword.ets(95:7)", "entry");
            Scroll.layoutWeight(1);
            Scroll.scrollBar(BarState.Auto);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ChangePassword.ets(96:9)", "entry");
            Column.padding({ left: 20, right: 20, top: 20 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 当前密码
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ChangePassword.ets(98:11)", "entry");
            // 当前密码
            Column.width('100%');
            // 当前密码
            Column.margin({ top: 20 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('当前密码');
            Text.debugLine("entry/src/main/ets/pages/ChangePassword.ets(99:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
            Text.width('100%');
            Text.margin({ bottom: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '请输入当前密码' });
            TextInput.debugLine("entry/src/main/ets/pages/ChangePassword.ets(105:13)", "entry");
            TextInput.width('100%');
            TextInput.height(48);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.type(InputType.Password);
            TextInput.onChange((value: string) => {
                this.oldPassword = value;
            });
        }, TextInput);
        // 当前密码
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 新密码
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ChangePassword.ets(119:11)", "entry");
            // 新密码
            Column.width('100%');
            // 新密码
            Column.margin({ top: 20 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('新密码');
            Text.debugLine("entry/src/main/ets/pages/ChangePassword.ets(120:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
            Text.width('100%');
            Text.margin({ bottom: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '请输入新密码（至少6位）' });
            TextInput.debugLine("entry/src/main/ets/pages/ChangePassword.ets(126:13)", "entry");
            TextInput.width('100%');
            TextInput.height(48);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.type(InputType.Password);
            TextInput.onChange((value: string) => {
                this.newPassword = value;
            });
        }, TextInput);
        // 新密码
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 确认新密码
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ChangePassword.ets(140:11)", "entry");
            // 确认新密码
            Column.width('100%');
            // 确认新密码
            Column.margin({ top: 20 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('确认新密码');
            Text.debugLine("entry/src/main/ets/pages/ChangePassword.ets(141:13)", "entry");
            Text.fontSize(14);
            Text.fontColor('#666666');
            Text.width('100%');
            Text.margin({ bottom: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '请再次输入新密码' });
            TextInput.debugLine("entry/src/main/ets/pages/ChangePassword.ets(147:13)", "entry");
            TextInput.width('100%');
            TextInput.height(48);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.type(InputType.Password);
            TextInput.onChange((value: string) => {
                this.confirmPassword = value;
            });
        }, TextInput);
        // 确认新密码
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 提示
            Text.create('密码至少6个字符，建议使用字母、数字组合');
            Text.debugLine("entry/src/main/ets/pages/ChangePassword.ets(161:11)", "entry");
            // 提示
            Text.fontSize(12);
            // 提示
            Text.fontColor('#999999');
            // 提示
            Text.margin({ top: 12 });
        }, Text);
        // 提示
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 提交按钮
            Button.createWithLabel('确认修改');
            Button.debugLine("entry/src/main/ets/pages/ChangePassword.ets(167:11)", "entry");
            // 提交按钮
            Button.width('100%');
            // 提交按钮
            Button.height(48);
            // 提交按钮
            Button.fontSize(16);
            // 提交按钮
            Button.fontColor('#ffffff');
            // 提交按钮
            Button.backgroundColor('#1890ff');
            // 提交按钮
            Button.borderRadius(24);
            // 提交按钮
            Button.margin({ top: 40 });
            // 提交按钮
            Button.enabled(!this.isSaving);
            // 提交按钮
            Button.onClick(() => this.changePassword());
        }, Button);
        // 提交按钮
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isSaving) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/ChangePassword.ets(179:13)", "entry");
                        LoadingProgress.width(24);
                        LoadingProgress.height(24);
                        LoadingProgress.margin({ top: 16 });
                    }, LoadingProgress);
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
        Scroll.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "ChangePassword";
    }
}
registerNamedRoute(() => new ChangePassword(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/ChangePassword", pageFullPath: "entry/src/main/ets/pages/ChangePassword", integratedHsp: "false", moduleType: "followWithHap" });
