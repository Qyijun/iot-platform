if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Mine_Params {
    userInfo?: UserInfo;
    isInTab?: boolean;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
// 定义用户信息接口
interface UserInfo {
    username: string;
    nickname: string;
    avatar?: string;
    email?: string;
}
export class Mine extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__userInfo = new ObservedPropertyObjectPU({
            username: 'user',
            nickname: 'iTouch User'
        }, this, "userInfo");
        this.__isInTab = new SynchedPropertySimpleOneWayPU(params.isInTab, this, "isInTab");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Mine_Params) {
        if (params.userInfo !== undefined) {
            this.userInfo = params.userInfo;
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
        this.__isInTab.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__userInfo.aboutToBeDeleted();
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
    private __isInTab: SynchedPropertySimpleOneWayPU<boolean>;
    get isInTab() {
        return this.__isInTab.get();
    }
    set isInTab(newValue: boolean) {
        this.__isInTab.set(newValue);
    }
    aboutToAppear() {
        // 可以在这里从服务器加载用户信息
        this.loadUserInfo();
    }
    async loadUserInfo() {
        // TODO: 从服务器加载用户信息
        // 暂时使用默认值
        this.userInfo = {
            username: 'user',
            nickname: 'iTouch User'
        };
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Mine.ets(36:5)", "entry");
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
                        Row.debugLine("entry/src/main/ets/pages/Mine.ets(39:9)", "entry");
                        Row.width('100%');
                        Row.height(56);
                        Row.padding({ left: 16, right: 16 });
                        Row.backgroundColor('#ffffff');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('←');
                        Text.debugLine("entry/src/main/ets/pages/Mine.ets(40:11)", "entry");
                        Text.fontSize(24);
                        Text.fontColor('#333333');
                        Text.onClick(() => {
                            router.back();
                        });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('我的');
                        Text.debugLine("entry/src/main/ets/pages/Mine.ets(46:11)", "entry");
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Medium);
                        Text.margin({ left: 12 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/Mine.ets(50:11)", "entry");
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
            Scroll.debugLine("entry/src/main/ets/pages/Mine.ets(58:7)", "entry");
            Scroll.layoutWeight(1);
            Scroll.scrollBar(BarState.Auto);
        }, Scroll);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Mine.ets(59:9)", "entry");
            Column.padding({ left: 16, right: 16 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 用户信息卡片
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Mine.ets(61:11)", "entry");
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
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 头像
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Mine.ets(63:13)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('👤');
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(64:15)", "entry");
            Text.fontSize(28);
            Text.width(60);
            Text.height(60);
            Text.textAlign(TextAlign.Center);
            Text.backgroundColor('#1890ff');
            Text.borderRadius(30);
            Text.fontColor('#ffffff');
        }, Text);
        Text.pop();
        // 头像
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 用户信息
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Mine.ets(75:13)", "entry");
            // 用户信息
            Column.alignItems(HorizontalAlign.Start);
            // 用户信息
            Column.margin({ left: 16 });
            // 用户信息
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.userInfo.nickname);
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(76:15)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('查看个人资料');
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(80:15)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        // 用户信息
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('›');
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(89:13)", "entry");
            Text.fontSize(18);
            Text.fontColor('#cccccc');
        }, Text);
        Text.pop();
        // 用户信息卡片
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 设置列表
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Mine.ets(100:11)", "entry");
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
        this.SettingItem.bind(this)('🔒', '账号安全', '');
        this.SettingItem.bind(this)('🔔', '消息通知', '');
        this.SettingItem.bind(this)('❓', '帮助中心', '');
        this.SettingItem.bind(this)('ℹ️', '关于我们', '');
        // 设置列表
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 退出登录按钮
            Button.createWithLabel('退出登录');
            Button.debugLine("entry/src/main/ets/pages/Mine.ets(114:11)", "entry");
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
            Row.debugLine("entry/src/main/ets/pages/Mine.ets(144:5)", "entry");
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
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(145:7)", "entry");
            Text.fontSize(18);
            Text.width(32);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(title);
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(148:7)", "entry");
            Text.fontSize(16);
            Text.fontColor('#333333');
            Text.margin({ left: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/Mine.ets(153:7)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('›');
            Text.debugLine("entry/src/main/ets/pages/Mine.ets(155:7)", "entry");
            Text.fontSize(18);
            Text.fontColor('#cccccc');
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
