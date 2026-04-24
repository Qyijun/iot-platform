if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Mine_Params {
    userInfo?: UserInfo;
    isLoading?: boolean;
    isInTab?: boolean;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
// 定义用户信息接口
interface UserInfo {
    username: string;
    nickname: string;
    avatar?: string;
    email?: string;
    displayName?: string;
    phone?: string;
    roles?: string[];
}
export class Mine extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__userInfo = new ObservedPropertyObjectPU({
            username: '',
            nickname: '加载中...'
        }, this, "userInfo");
        this.__isLoading = new ObservedPropertySimplePU(true, this, "isLoading");
        this.__isInTab = new SynchedPropertySimpleOneWayPU(params.isInTab, this, "isInTab");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Mine_Params) {
        if (params.userInfo !== undefined) {
            this.userInfo = params.userInfo;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.isInTab === undefined) {
            this.__isInTab.set(true);
        }
    }
    updateStateVars(params: Mine_Params) {
        this.__isInTab.reset(params.isInTab);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__userInfo.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__isInTab.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__userInfo.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__isInTab.aboutToBeDeleted();
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
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private __isInTab: SynchedPropertySimpleOneWayPU<boolean>;
    get isInTab() {
        return this.__isInTab.get();
    }
    set isInTab(newValue: boolean) {
        this.__isInTab.set(newValue);
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
            // 后端 /api/auth/me 直接返回用户对象: { id, username, displayName, roles, email, ... }
            this.userInfo = {
                username: getString(res['username']) || getString(res['user_id']),
                nickname: getString(res['displayName']) || getString(res['nickname']) || getString(res['username']) || '用户',
                avatar: getString(res['avatar']),
                email: getString(res['email']),
                phone: getString(res['phone']),
                roles: getArray(res['roles'])
            };
            console.info('Mine', `用户信息加载成功: ${this.userInfo.nickname}`);
        }
        catch (e) {
            console.error('Mine', `加载用户信息失败: ${e}`);
            // 使用默认显示
            this.userInfo = {
                username: 'user',
                nickname: 'iTouch User'
            };
        }
        this.isLoading = false;
    }
    // 获取用户头像显示
    getAvatarText(): string {
        if (this.userInfo.nickname && this.userInfo.nickname !== '加载中...') {
            return this.userInfo.nickname.substring(0, 1).toUpperCase();
        }
        return '👤';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Mine.ets(83:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f0f2f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 顶部导航栏 - 只在独立页面时显示
            if (!this.isInTab) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Mine.ets(86:9)", "entry");
                        Row.width('100%');
                        Row.height(56);
                        Row.padding({ left: 16, right: 16 });
                        Row.backgroundColor('#ffffff');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('←');
                        Text.debugLine("entry/src/main/ets/pages/Mine.ets(87:11)", "entry");
                        Text.fontSize(24);
                        Text.fontColor('#333333');
                        Text.onClick(() => {
                            router.back();
                        });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('我的');
                        Text.debugLine("entry/src/main/ets/pages/Mine.ets(93:11)", "entry");
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Medium);
                        Text.margin({ left: 12 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/Mine.ets(97:11)", "entry");
                    }, Blank);
                    Blank.pop();
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
            Scroll.create();
            Scroll.debugLine("entry/src/main/ets/pages/Mine.ets(105:7)", "entry");
            Scroll.layoutWeight(1);
            Scroll.scrollBar(BarState.Auto);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Mine.ets(106:9)", "entry");
            Column.padding({ left: 16, right: 16 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 用户信息卡片
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Mine.ets(108:11)", "entry");
            // 用户信息卡片
            Row.width('100%');
            // 用户信息卡片
            Row.padding(20);
            // 用户信息卡片
            Row.backgroundColor('#ffffff');
            // 用户信息卡片
            Row.borderRadius(12);
            // 用户信息卡片
            Row.margin({ top: 16 });
            // 用户信息卡片
            Row.onClick(() => {
                router.pushUrl({ url: 'pages/ProfileEdit' });
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 头像
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Mine.ets(110:13)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.getAvatarText());
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(111:15)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#ffffff');
            Text.width(60);
            Text.height(60);
            Text.textAlign(TextAlign.Center);
            Text.backgroundColor('#1890ff');
            Text.borderRadius(30);
        }, Text);
        Text.pop();
        // 头像
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 用户信息
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Mine.ets(123:13)", "entry");
            // 用户信息
            Column.alignItems(HorizontalAlign.Start);
            // 用户信息
            Column.margin({ left: 16 });
            // 用户信息
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.userInfo.nickname);
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(124:15)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.userInfo.email) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.userInfo.email);
                        Text.debugLine("entry/src/main/ets/pages/Mine.ets(130:17)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                        Text.margin({ top: 4 });
                    }, Text);
                    Text.pop();
                });
            }
            else if (this.userInfo.username) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`账号: ${this.userInfo.username}`);
                        Text.debugLine("entry/src/main/ets/pages/Mine.ets(135:17)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                        Text.margin({ top: 4 });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.userInfo.phone) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.userInfo.phone);
                        Text.debugLine("entry/src/main/ets/pages/Mine.ets(142:17)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#1890ff');
                        Text.margin({ top: 2 });
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
            If.create();
            if (this.userInfo.roles && this.userInfo.roles.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.userInfo.roles.join(', '));
                        Text.debugLine("entry/src/main/ets/pages/Mine.ets(149:17)", "entry");
                        Text.fontSize(11);
                        Text.fontColor('#1890ff');
                        Text.backgroundColor('#e6f7ff');
                        Text.padding({ left: 8, right: 8, top: 2, bottom: 2 });
                        Text.borderRadius(4);
                        Text.margin({ top: 6 });
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
        // 用户信息
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('编辑');
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(162:13)", "entry");
            Text.fontSize(13);
            Text.fontColor('#1890ff');
            Text.margin({ right: 8 });
        }, Text);
        Text.pop();
        // 用户信息卡片
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 设置列表
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Mine.ets(177:11)", "entry");
            // 设置列表
            Column.width('100%');
            // 设置列表
            Column.backgroundColor('#ffffff');
            // 设置列表
            Column.borderRadius(12);
            // 设置列表
            Column.margin({ top: 16 });
        }, Column);
        this.SettingItem.bind(this)('🔌', '蓝牙配网', 'pages/DeviceProvision');
        this.SettingItem.bind(this)('⚙️', '服务器设置', 'pages/ServerSettings');
        this.SettingItem.bind(this)('🔒', '修改密码', 'pages/ChangePassword');
        this.SettingItem.bind(this)('🔔', '消息通知', '');
        this.SettingItem.bind(this)('❓', '帮助中心', '');
        this.SettingItem.bind(this)('ℹ️', '关于我们', '');
        // 设置列表
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 退出登录按钮
            Button.createWithLabel('退出登录');
            Button.debugLine("entry/src/main/ets/pages/Mine.ets(191:11)", "entry");
            // 退出登录按钮
            Button.width('100%');
            // 退出登录按钮
            Button.height(48);
            // 退出登录按钮
            Button.fontSize(16);
            // 退出登录按钮
            Button.fontColor('#ff4d4f');
            // 退出登录按钮
            Button.backgroundColor('#ffffff');
            // 退出登录按钮
            Button.borderRadius(12);
            // 退出登录按钮
            Button.margin({ top: 32, bottom: 32 });
            // 退出登录按钮
            Button.onClick(() => {
                promptAction.showToast({
                    message: '确认退出登录？',
                    duration: 2000
                });
                setTimeout(() => {
                    router.replaceUrl({ url: 'pages/LoginPage' });
                }, 500);
            });
        }, Button);
        // 退出登录按钮
        Button.pop();
        Column.pop();
        Scroll.pop();
        Column.pop();
    }
    SettingItem(icon: string, title: string, url: string, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Mine.ets(221:5)", "entry");
            Row.width('100%');
            Row.padding({ left: 12, right: 12, top: 14, bottom: 14 });
            Row.borderWidth({ bottom: 0.5 });
            Row.borderColor('#f0f0f0');
            Row.onClick(() => {
                if (url && url.length > 0) {
                    router.pushUrl({ url: url });
                }
                else {
                    promptAction.showToast({ message: '功能开发中' });
                }
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(icon);
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(222:7)", "entry");
            Text.fontSize(18);
            Text.width(32);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(title);
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(225:7)", "entry");
            Text.fontSize(16);
            Text.fontColor('#333333');
            Text.margin({ left: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/Mine.ets(230:7)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('›');
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(232:7)", "entry");
            Text.fontSize(18);
            Text.fontColor('#cccccc');
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Mine";
    }
}
registerNamedRoute(() => new Mine(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/Mine", pageFullPath: "entry/src/main/ets/pages/Mine", integratedHsp: "false", moduleType: "followWithHap" });
