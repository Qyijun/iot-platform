if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Index_Params {
    isChecking?: boolean;
}
import router from "@ohos:router";
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__isChecking = new ObservedPropertySimplePU(true, this, "isChecking");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Index_Params) {
        if (params.isChecking !== undefined) {
            this.isChecking = params.isChecking;
        }
    }
    updateStateVars(params: Index_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__isChecking.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__isChecking.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __isChecking: ObservedPropertySimplePU<boolean>;
    get isChecking() {
        return this.__isChecking.get();
    }
    set isChecking(newValue: boolean) {
        this.__isChecking.set(newValue);
    }
    aboutToAppear() {
        // Context 已在 EntryAbility 中初始化
        this.checkLoginStatus();
    }
    async checkLoginStatus() {
        this.isChecking = true;
        // 先确保 token 从 Preference 加载完成
        await httpService.ensureTokenLoaded();
        // 检查登录状态
        const hasToken = httpService.hasToken();
        console.info('>>> Index: checkLoginStatus, hasToken=', hasToken, '<<<');
        if (hasToken) {
            // 有 token，跳转首页
            console.info('>>> Index: 跳转 Home <<<');
            router.replaceUrl({ url: 'pages/Home' });
        }
        else {
            // 无 token，跳转登录页
            console.info('>>> Index: 跳转 LoginPage <<<');
            router.replaceUrl({ url: 'pages/LoginPage' });
        }
        this.isChecking = false;
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Index.ets(38:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.justifyContent(FlexAlign.Center);
            Column.backgroundColor('#f0f2f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            LoadingProgress.create();
            LoadingProgress.debugLine("entry/src/main/ets/pages/Index.ets(39:7)", "entry");
            LoadingProgress.width(48);
            LoadingProgress.height(48);
        }, LoadingProgress);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('加载中...');
            Text.debugLine("entry/src/main/ets/pages/Index.ets(42:7)", "entry");
            Text.fontSize(14);
            Text.fontColor('#999999');
            Text.margin({ top: 16 });
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/Index", pageFullPath: "entry/src/main/ets/pages/Index", integratedHsp: "false", moduleType: "followWithHap" });
