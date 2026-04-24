if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface LoginPage_Params {
    username?: string;
    password?: string;
    isLoading?: boolean;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import { userViewModel } from "@normalized:N&&&entry/src/main/ets/viewmodels/UserViewModel&";
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
class LoginPage extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__username = new ObservedPropertySimplePU('', this, "username");
        this.__password = new ObservedPropertySimplePU('', this, "password");
        this.__isLoading = new ObservedPropertySimplePU(false, this, "isLoading");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: LoginPage_Params) {
        if (params.username !== undefined) {
            this.username = params.username;
        }
        if (params.password !== undefined) {
            this.password = params.password;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
    }
    updateStateVars(params: LoginPage_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__username.purgeDependencyOnElmtId(rmElmtId);
        this.__password.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__username.aboutToBeDeleted();
        this.__password.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __username: ObservedPropertySimplePU<string>;
    get username() {
        return this.__username.get();
    }
    set username(newValue: string) {
        this.__username.set(newValue);
    }
    private __password: ObservedPropertySimplePU<string>;
    get password() {
        return this.__password.get();
    }
    set password(newValue: string) {
        this.__password.set(newValue);
    }
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/LoginPage.ets(15:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f0f2f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // Logo区域
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/LoginPage.ets(18:7)", "entry");
            // Logo区域
            Column.margin({ top: 40, bottom: 60 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Image.create({ "id": 16777223, "type": 20000, params: [], "bundleName": "com.iot.itouch", "moduleName": "entry" });
            Image.debugLine("entry/src/main/ets/pages/LoginPage.ets(19:9)", "entry");
            Image.width(80);
            Image.height(80);
            Image.borderRadius(20);
            Image.backgroundColor('#1890ff');
        }, Image);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('iTouch');
            Text.debugLine("entry/src/main/ets/pages/LoginPage.ets(25:9)", "entry");
            Text.fontSize(32);
            Text.fontWeight(FontWeight.Bold);
            Text.margin({ top: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('物联网设备控制');
            Text.debugLine("entry/src/main/ets/pages/LoginPage.ets(30:9)", "entry");
            Text.fontSize(14);
            Text.fontColor('#999999');
            Text.margin({ top: 8 });
        }, Text);
        Text.pop();
        // Logo区域
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 顶部设置按钮
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/LoginPage.ets(37:7)", "entry");
            // 顶部设置按钮
            Row.width('85%');
            // 顶部设置按钮
            Row.margin({ top: 20 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/LoginPage.ets(38:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('⚙️ 服务器设置');
            Text.debugLine("entry/src/main/ets/pages/LoginPage.ets(39:9)", "entry");
            Text.fontSize(14);
            Text.fontColor('#1890ff');
            Text.onClick(() => {
                router.pushUrl({ url: 'pages/ServerSettings' });
            });
        }, Text);
        Text.pop();
        // 顶部设置按钮
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 登录表单
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/LoginPage.ets(49:7)", "entry");
            // 登录表单
            Column.width('85%');
            // 登录表单
            Column.padding(24);
            // 登录表单
            Column.backgroundColor('#ffffff');
            // 登录表单
            Column.borderRadius(16);
            // 登录表单
            Column.shadow({
                radius: 20,
                color: 'rgba(0,0,0,0.1)',
                offsetX: 0,
                offsetY: 4
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '请输入用户名' });
            TextInput.debugLine("entry/src/main/ets/pages/LoginPage.ets(50:9)", "entry");
            TextInput.width('100%');
            TextInput.height(48);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.margin({ bottom: 16 });
            TextInput.onChange((value: string) => {
                this.username = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '请输入密码' });
            TextInput.debugLine("entry/src/main/ets/pages/LoginPage.ets(60:9)", "entry");
            TextInput.width('100%');
            TextInput.height(48);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.borderRadius(8);
            TextInput.type(InputType.Password);
            TextInput.margin({ bottom: 24 });
            TextInput.onChange((value: string) => {
                this.password = value;
            });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('登 录');
            Button.debugLine("entry/src/main/ets/pages/LoginPage.ets(71:9)", "entry");
            Button.width('100%');
            Button.height(48);
            Button.fontSize(16);
            Button.borderRadius(8);
            Button.backgroundColor('#1890ff');
            Button.fontColor('#ffffff');
            Button.enabled(!this.isLoading);
            Button.onClick(() => this.handleLogin());
        }, Button);
        Button.pop();
        // 登录表单
        Column.pop();
        Column.pop();
    }
    async handleLogin() {
        if (!this.username || !this.password) {
            promptAction.showToast({ message: '请输入用户名和密码' });
            return;
        }
        this.isLoading = true;
        console.info('>>> LoginPage: 点击登录 <<<');
        console.info('>>> LoginPage: 用户名=' + this.username + ' <<<');
        console.info('>>> LoginPage: 密码长度=' + this.password.length + ' <<<');
        const success = await userViewModel.login(this.username, this.password);
        console.info('>>> LoginPage: 登录结果=' + success + ' <<<');
        console.info('>>> LoginPage: httpService.hasToken()=' + httpService.hasToken() + ' <<<');
        this.isLoading = false;
        if (success) {
            console.info('>>> LoginPage: 跳转到首页 <<<');
            router.replaceUrl({ url: 'pages/Home' });
        }
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "LoginPage";
    }
}
registerNamedRoute(() => new LoginPage(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/LoginPage", pageFullPath: "entry/src/main/ets/pages/LoginPage", integratedHsp: "false", moduleType: "followWithHap" });
