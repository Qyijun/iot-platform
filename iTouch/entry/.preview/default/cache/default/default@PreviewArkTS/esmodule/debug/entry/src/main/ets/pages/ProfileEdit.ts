if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface ProfileEdit_Params {
    userInfo?: UserInfo;
    editDisplayName?: string;
    editEmail?: string;
    editPhone?: string;
    isLoading?: boolean;
    isSaving?: boolean;
    errorMessage?: string;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import http from "@ohos:net.http";
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
// 用户信息接口
interface UserInfo {
    username: string;
    displayName: string;
    email: string;
    phone: string;
    roles: string[];
}
class ProfileEdit extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__userInfo = new ObservedPropertyObjectPU({
            username: '',
            displayName: '',
            email: '',
            phone: '',
            roles: []
        }, this, "userInfo");
        this.__editDisplayName = new ObservedPropertySimplePU('', this, "editDisplayName");
        this.__editEmail = new ObservedPropertySimplePU('', this, "editEmail");
        this.__editPhone = new ObservedPropertySimplePU('', this, "editPhone");
        this.__isLoading = new ObservedPropertySimplePU(true, this, "isLoading");
        this.__isSaving = new ObservedPropertySimplePU(false, this, "isSaving");
        this.__errorMessage = new ObservedPropertySimplePU('', this, "errorMessage");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: ProfileEdit_Params) {
        if (params.userInfo !== undefined) {
            this.userInfo = params.userInfo;
        }
        if (params.editDisplayName !== undefined) {
            this.editDisplayName = params.editDisplayName;
        }
        if (params.editEmail !== undefined) {
            this.editEmail = params.editEmail;
        }
        if (params.editPhone !== undefined) {
            this.editPhone = params.editPhone;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.isSaving !== undefined) {
            this.isSaving = params.isSaving;
        }
        if (params.errorMessage !== undefined) {
            this.errorMessage = params.errorMessage;
        }
    }
    updateStateVars(params: ProfileEdit_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__userInfo.purgeDependencyOnElmtId(rmElmtId);
        this.__editDisplayName.purgeDependencyOnElmtId(rmElmtId);
        this.__editEmail.purgeDependencyOnElmtId(rmElmtId);
        this.__editPhone.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__isSaving.purgeDependencyOnElmtId(rmElmtId);
        this.__errorMessage.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__userInfo.aboutToBeDeleted();
        this.__editDisplayName.aboutToBeDeleted();
        this.__editEmail.aboutToBeDeleted();
        this.__editPhone.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__isSaving.aboutToBeDeleted();
        this.__errorMessage.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __userInfo: ObservedPropertyObjectPU<UserInfo>;
    get userInfo() {
        return this.__userInfo.get();
    }
    set userInfo(newValue: UserInfo) {
        this.__userInfo.set(newValue);
    }
    private __editDisplayName: ObservedPropertySimplePU<string>;
    get editDisplayName() {
        return this.__editDisplayName.get();
    }
    set editDisplayName(newValue: string) {
        this.__editDisplayName.set(newValue);
    }
    private __editEmail: ObservedPropertySimplePU<string>;
    get editEmail() {
        return this.__editEmail.get();
    }
    set editEmail(newValue: string) {
        this.__editEmail.set(newValue);
    }
    private __editPhone: ObservedPropertySimplePU<string>;
    get editPhone() {
        return this.__editPhone.get();
    }
    set editPhone(newValue: string) {
        this.__editPhone.set(newValue);
    }
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private __isSaving: ObservedPropertySimplePU<boolean>;
    get isSaving() {
        return this.__isSaving.get();
    }
    set isSaving(newValue: boolean) {
        this.__isSaving.set(newValue);
    }
    private __errorMessage: ObservedPropertySimplePU<string>;
    get errorMessage() {
        return this.__errorMessage.get();
    }
    set errorMessage(newValue: string) {
        this.__errorMessage.set(newValue);
    }
    aboutToAppear() {
        this.loadUserInfo();
    }
    async loadUserInfo() {
        this.isLoading = true;
        try {
            const res: Record<string, Object> = await httpService.getUserInfo() as Record<string, Object>;
            // 安全提取字符串字段
            const getString = (val: Object | string): string => {
                if (typeof val === 'string')
                    return val;
                if (val !== null && typeof val === 'object')
                    return JSON.stringify(val);
                return '';
            };
            // 安全提取数组字段
            const getArray = (val: Object | string[]): string[] => {
                if (Array.isArray(val))
                    return val.filter((v: Object | string) => typeof v === 'string') as string[];
                return [];
            };
            this.userInfo = {
                username: getString(res['username']),
                displayName: getString(res['displayName']) || getString(res['username']) || '用户',
                email: getString(res['email']),
                phone: getString(res['phone']),
                roles: getArray(res['roles'])
            };
            // 初始化编辑字段
            this.editDisplayName = this.userInfo.displayName;
            this.editEmail = this.userInfo.email;
            this.editPhone = this.userInfo.phone;
        }
        catch (e) {
            console.error('ProfileEdit', `加载用户信息失败: ${e}`);
            this.errorMessage = '加载用户信息失败';
        }
        this.isLoading = false;
    }
    /**
     * @throws
     */
    async saveProfile() {
        // 表单验证
        if (!this.editDisplayName || !this.editDisplayName.trim()) {
            promptAction.showToast({ message: '请输入昵称' });
            return;
        }
        if (this.editDisplayName.length > 50) {
            promptAction.showToast({ message: '昵称不能超过50个字符' });
            return;
        }
        if (this.editEmail) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.editEmail)) {
                promptAction.showToast({ message: '邮箱格式不正确' });
                return;
            }
        }
        if (this.editPhone) {
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(this.editPhone)) {
                promptAction.showToast({ message: '手机号格式不正确' });
                return;
            }
        }
        this.isSaving = true;
        this.errorMessage = '';
        try {
            const res: Record<string, Object> = await httpService.request('/api/auth/profile', {
                method: http.RequestMethod.PUT,
                extraData: {
                    displayName: this.editDisplayName.trim(),
                    email: this.editEmail.trim(),
                    phone: this.editPhone.trim()
                }
            }) as Record<string, Object>;
            if (res['success']) {
                promptAction.showToast({ message: '资料更新成功' });
                // 返回上一页
                setTimeout(() => {
                    router.back();
                }, 500);
            }
            else {
                this.errorMessage = res['error'] as string || '更新失败';
                promptAction.showToast({ message: this.errorMessage });
            }
        }
        catch (e) {
            console.error('ProfileEdit', `保存失败: ${e}`);
            this.errorMessage = '网络错误，请重试';
            promptAction.showToast({ message: '保存失败，请重试' });
        }
        this.isSaving = false;
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(145:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f0f2f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 顶部导航栏
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(147:7)", "entry");
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
            Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(148:9)", "entry");
            Text.fontSize(24);
            Text.fontColor('#333333');
            Text.onClick(() => {
                router.back();
            });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('编辑资料');
            Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(154:9)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.margin({ left: 12 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(158:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('保存');
            Button.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(159:9)", "entry");
            Button.fontSize(14);
            Button.fontColor('#1890ff');
            Button.backgroundColor('transparent');
            Button.enabled(!this.isSaving);
            Button.onClick(() => {
                this.saveProfile();
            });
        }, Button);
        Button.pop();
        // 顶部导航栏
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(174:9)", "entry");
                        Column.width('100%');
                        Column.layoutWeight(1);
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(175:11)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.color('#1890ff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('加载中...');
                        Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(179:11)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#999999');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(188:9)", "entry");
                        Scroll.layoutWeight(1);
                        Scroll.scrollBar(BarState.Auto);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(189:11)", "entry");
                        Column.padding({ left: 16, right: 16, bottom: 32 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 用户头像
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(191:13)", "entry");
                        // 用户头像
                        Column.margin({ top: 24, bottom: 8 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.editDisplayName ? this.editDisplayName.substring(0, 1).toUpperCase() : 'U');
                        Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(192:15)", "entry");
                        Text.fontSize(32);
                        Text.fontWeight(FontWeight.Bold);
                        Text.fontColor('#ffffff');
                        Text.width(80);
                        Text.height(80);
                        Text.textAlign(TextAlign.Center);
                        Text.backgroundColor('#1890ff');
                        Text.borderRadius(40);
                    }, Text);
                    Text.pop();
                    // 用户头像
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('点击头像更换');
                        Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(204:13)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.userInfo.roles && this.userInfo.roles.length > 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create();
                                    Row.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(209:15)", "entry");
                                    Row.margin({ top: 8 });
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    ForEach.create();
                                    const forEachItemGenFunction = _item => {
                                        const role = _item;
                                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                                            Text.create(role);
                                            Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(211:19)", "entry");
                                            Text.fontSize(11);
                                            Text.fontColor('#1890ff');
                                            Text.backgroundColor('#e6f7ff');
                                            Text.padding({ left: 8, right: 8, top: 2, bottom: 2 });
                                            Text.borderRadius(4);
                                        }, Text);
                                        Text.pop();
                                    };
                                    this.forEachUpdateFunction(elmtId, this.userInfo.roles, forEachItemGenFunction);
                                }, ForEach);
                                ForEach.pop();
                                Row.pop();
                            });
                        }
                        // 账号信息
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 账号信息
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(223:13)", "entry");
                        // 账号信息
                        Column.width('100%');
                        // 账号信息
                        Column.backgroundColor('#ffffff');
                        // 账号信息
                        Column.margin({ top: 24 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('账号信息');
                        Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(224:15)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#999999');
                        Text.width('100%');
                        Text.padding({ left: 16, top: 24, bottom: 12 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(230:15)", "entry");
                        Row.width('100%');
                        Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
                        Row.borderWidth({ bottom: 0.5 });
                        Row.borderColor('#f0f0f0');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('用户名');
                        Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(231:17)", "entry");
                        Text.fontSize(15);
                        Text.fontColor('#333333');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.userInfo.username);
                        Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(234:17)", "entry");
                        Text.fontSize(15);
                        Text.fontColor('#999999');
                        Text.margin({ left: 24 });
                    }, Text);
                    Text.pop();
                    Row.pop();
                    // 账号信息
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 基本信息
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(249:13)", "entry");
                        // 基本信息
                        Column.width('100%');
                        // 基本信息
                        Column.backgroundColor('#ffffff');
                        // 基本信息
                        Column.margin({ top: 16 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('基本信息');
                        Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(250:15)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#999999');
                        Text.width('100%');
                        Text.padding({ left: 16, top: 16, bottom: 8 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 昵称
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(257:15)", "entry");
                        // 昵称
                        Row.width('100%');
                        // 昵称
                        Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
                        // 昵称
                        Row.borderWidth({ bottom: 0.5 });
                        // 昵称
                        Row.borderColor('#f0f0f0');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('昵称');
                        Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(258:17)", "entry");
                        Text.fontSize(15);
                        Text.fontColor('#333333');
                        Text.width(70);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        TextInput.create({ text: this.editDisplayName, placeholder: '请输入昵称' });
                        TextInput.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(262:17)", "entry");
                        TextInput.fontSize(15);
                        TextInput.fontColor('#333333');
                        TextInput.backgroundColor('transparent');
                        TextInput.layoutWeight(1);
                        TextInput.margin({ left: 16 });
                        TextInput.onChange((value: string) => {
                            this.editDisplayName = value;
                        });
                    }, TextInput);
                    // 昵称
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 邮箱
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(278:15)", "entry");
                        // 邮箱
                        Row.width('100%');
                        // 邮箱
                        Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
                        // 邮箱
                        Row.borderWidth({ bottom: 0.5 });
                        // 邮箱
                        Row.borderColor('#f0f0f0');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('邮箱');
                        Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(279:17)", "entry");
                        Text.fontSize(15);
                        Text.fontColor('#333333');
                        Text.width(70);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        TextInput.create({ text: this.editEmail, placeholder: '请输入邮箱' });
                        TextInput.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(283:17)", "entry");
                        TextInput.fontSize(15);
                        TextInput.fontColor('#333333');
                        TextInput.backgroundColor('transparent');
                        TextInput.layoutWeight(1);
                        TextInput.margin({ left: 16 });
                        TextInput.onChange((value: string) => {
                            this.editEmail = value;
                        });
                    }, TextInput);
                    // 邮箱
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 手机号
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(299:15)", "entry");
                        // 手机号
                        Row.width('100%');
                        // 手机号
                        Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('手机号');
                        Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(300:17)", "entry");
                        Text.fontSize(15);
                        Text.fontColor('#333333');
                        Text.width(70);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        TextInput.create({ text: this.editPhone, placeholder: '请输入手机号' });
                        TextInput.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(304:17)", "entry");
                        TextInput.fontSize(15);
                        TextInput.fontColor('#333333');
                        TextInput.backgroundColor('transparent');
                        TextInput.layoutWeight(1);
                        TextInput.margin({ left: 16 });
                        TextInput.type(InputType.PhoneNumber);
                        TextInput.onChange((value: string) => {
                            this.editPhone = value;
                        });
                    }, TextInput);
                    // 手机号
                    Row.pop();
                    // 基本信息
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 保存按钮
                        Button.createWithLabel(this.isSaving ? '保存中...' : '保存');
                        Button.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(323:13)", "entry");
                        // 保存按钮
                        Button.width('100%');
                        // 保存按钮
                        Button.height(48);
                        // 保存按钮
                        Button.fontSize(16);
                        // 保存按钮
                        Button.fontColor('#ffffff');
                        // 保存按钮
                        Button.backgroundColor('#1890ff');
                        // 保存按钮
                        Button.borderRadius(24);
                        // 保存按钮
                        Button.margin({ top: 32 });
                        // 保存按钮
                        Button.enabled(!this.isSaving);
                        // 保存按钮
                        Button.onClick(() => {
                            this.saveProfile();
                        });
                    }, Button);
                    // 保存按钮
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.errorMessage) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.errorMessage);
                                    Text.debugLine("entry/src/main/ets/pages/ProfileEdit.ets(337:15)", "entry");
                                    Text.fontSize(12);
                                    Text.fontColor('#ff4d4f');
                                    Text.margin({ top: 12 });
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
                    Column.pop();
                    Scroll.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "ProfileEdit";
    }
}
registerNamedRoute(() => new ProfileEdit(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/ProfileEdit", pageFullPath: "entry/src/main/ets/pages/ProfileEdit", integratedHsp: "false", moduleType: "followWithHap" });
