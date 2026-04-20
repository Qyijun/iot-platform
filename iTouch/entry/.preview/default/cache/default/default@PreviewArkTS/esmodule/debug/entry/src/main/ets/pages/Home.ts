if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Home_Params {
    currentTab?: number;
    devices?: Device[];
    filteredDevices?: Device[];
    isLoading?: boolean;
    alerts?: Record<string, Object>[];
    alertsLoading?: boolean;
    searchKeyword?: string;
    debugInfo?: string;
    tabController?: TabsController;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import { deviceViewModel } from "@normalized:N&&&entry/src/main/ets/viewmodels/DeviceViewModel&";
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
import type { Device } from '../models/Device';
import { Mine } from "@normalized:N&&&entry/src/main/ets/pages/Mine&";
const TAG = 'Home';
const DOMAIN = 0xFF02;
// 使用 console 替代 hilog
const logInfo = (tag: string, message: string) => {
    console.info(`[${tag}] ${message}`);
};
const logError = (tag: string, message: string) => {
    console.error(`[${tag}] ${message}`);
};
class Home extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__currentTab = new ObservedPropertySimplePU(0, this, "currentTab");
        this.__devices = new ObservedPropertyObjectPU([], this, "devices");
        this.__filteredDevices = new ObservedPropertyObjectPU([], this, "filteredDevices");
        this.__isLoading = new ObservedPropertySimplePU(false, this, "isLoading");
        this.__alerts = new ObservedPropertyObjectPU([], this, "alerts");
        this.__alertsLoading = new ObservedPropertySimplePU(false, this, "alertsLoading");
        this.__searchKeyword = new ObservedPropertySimplePU('', this, "searchKeyword");
        this.__debugInfo = new ObservedPropertySimplePU('', this, "debugInfo");
        this.tabController = new TabsController();
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Home_Params) {
        if (params.currentTab !== undefined) {
            this.currentTab = params.currentTab;
        }
        if (params.devices !== undefined) {
            this.devices = params.devices;
        }
        if (params.filteredDevices !== undefined) {
            this.filteredDevices = params.filteredDevices;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.alerts !== undefined) {
            this.alerts = params.alerts;
        }
        if (params.alertsLoading !== undefined) {
            this.alertsLoading = params.alertsLoading;
        }
        if (params.searchKeyword !== undefined) {
            this.searchKeyword = params.searchKeyword;
        }
        if (params.debugInfo !== undefined) {
            this.debugInfo = params.debugInfo;
        }
        if (params.tabController !== undefined) {
            this.tabController = params.tabController;
        }
    }
    updateStateVars(params: Home_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__currentTab.purgeDependencyOnElmtId(rmElmtId);
        this.__devices.purgeDependencyOnElmtId(rmElmtId);
        this.__filteredDevices.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__alerts.purgeDependencyOnElmtId(rmElmtId);
        this.__alertsLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__searchKeyword.purgeDependencyOnElmtId(rmElmtId);
        this.__debugInfo.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__currentTab.aboutToBeDeleted();
        this.__devices.aboutToBeDeleted();
        this.__filteredDevices.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__alerts.aboutToBeDeleted();
        this.__alertsLoading.aboutToBeDeleted();
        this.__searchKeyword.aboutToBeDeleted();
        this.__debugInfo.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __currentTab: ObservedPropertySimplePU<number>;
    get currentTab() {
        return this.__currentTab.get();
    }
    set currentTab(newValue: number) {
        this.__currentTab.set(newValue);
    }
    private __devices: ObservedPropertyObjectPU<Device[]>;
    get devices() {
        return this.__devices.get();
    }
    set devices(newValue: Device[]) {
        this.__devices.set(newValue);
    }
    private __filteredDevices: ObservedPropertyObjectPU<Device[]>;
    get filteredDevices() {
        return this.__filteredDevices.get();
    }
    set filteredDevices(newValue: Device[]) {
        this.__filteredDevices.set(newValue);
    }
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private __alerts: ObservedPropertyObjectPU<Record<string, Object>[]>;
    get alerts() {
        return this.__alerts.get();
    }
    set alerts(newValue: Record<string, Object>[]) {
        this.__alerts.set(newValue);
    }
    private __alertsLoading: ObservedPropertySimplePU<boolean>;
    get alertsLoading() {
        return this.__alertsLoading.get();
    }
    set alertsLoading(newValue: boolean) {
        this.__alertsLoading.set(newValue);
    }
    private __searchKeyword: ObservedPropertySimplePU<string>;
    get searchKeyword() {
        return this.__searchKeyword.get();
    }
    set searchKeyword(newValue: string) {
        this.__searchKeyword.set(newValue);
    }
    private __debugInfo: ObservedPropertySimplePU<string>;
    get debugInfo() {
        return this.__debugInfo.get();
    }
    set debugInfo(newValue: string) {
        this.__debugInfo.set(newValue);
    }
    private tabController: TabsController;
    aboutToAppear() {
        logInfo(TAG, '=== Home: aboutToAppear ===');
        this.checkAuthAndLoad();
    }
    checkAuthAndLoad() {
        logInfo(TAG, '>>> Home: checkAuthAndLoad <<<');
        httpService.ensureTokenLoaded();
        const hasToken = httpService.hasToken();
        this.debugInfo = '服务器: ' + httpService.getBaseUrl() + '\n已登录: ' + hasToken;
        if (hasToken) {
            this.loadDevices();
        }
        else {
            router.replaceUrl({ url: 'pages/LoginPage' });
        }
    }
    onPageShow() {
        logInfo(TAG, '>>> Home: onPageShow <<<');
        if (this.currentTab === 0) {
            this.loadDevices();
        }
    }
    async loadDevices() {
        this.isLoading = true;
        this.debugInfo = '加载中，请稍候...';
        httpService.ensureTokenLoaded();
        try {
            this.devices = await deviceViewModel.loadDevices();
            this.filteredDevices = [...this.devices];
            this.debugInfo = `服务器: ${httpService.getBaseUrl()}\n设备数量: ${this.devices.length}`;
            logInfo(TAG, `loadDevices成功: ${this.devices.length}个设备`);
        }
        catch (e) {
            const errMsg = e instanceof Error ? e.message : '未知错误';
            this.debugInfo = '错误: ' + errMsg;
            logError(TAG, `loadDevices失败: ${errMsg}`);
            promptAction.showToast({ message: '加载设备失败: ' + errMsg });
        }
        this.isLoading = false;
    }
    onSearchChanged(text: string) {
        this.searchKeyword = text;
        if (!text || text.trim() === '') {
            this.filteredDevices = [...this.devices];
        }
        else {
            const keyword = text.toLowerCase();
            this.filteredDevices = this.devices.filter((d: Device) => (d.name && d.name.toLowerCase().includes(keyword)) ||
                (d.type && d.type.toLowerCase().includes(keyword)) ||
                (d.location && d.location.toLowerCase().includes(keyword)) ||
                (d.ip && d.ip.toLowerCase().includes(keyword)));
        }
    }
    async loadAlerts() {
        this.alertsLoading = true;
        this.alerts = await deviceViewModel.loadAlerts();
        this.alertsLoading = false;
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(101:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f5f7fa');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // ========== 顶部栏 - 始终显示 ==========
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(103:7)", "entry");
            // ========== 顶部栏 - 始终显示 ==========
            Column.width('100%');
            // ========== 顶部栏 - 始终显示 ==========
            Column.padding({ left: 20, right: 16, top: 12, bottom: 12 });
            // ========== 顶部栏 - 始终显示 ==========
            Column.backgroundColor('#ffffff');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 标题行
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(105:9)", "entry");
            // 标题行
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(106:11)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('iTouch');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(107:13)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 只在设备页面显示设备数量
            if (this.currentTab === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`${this.filteredDevices.length} 个设备`);
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(113:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                        Text.margin({ top: 2 });
                    }, Text);
                    Text.pop();
                });
            }
            else if (this.currentTab === 1) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`${this.alerts.length} 个告警`);
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(118:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                        Text.margin({ top: 2 });
                    }, Text);
                    Text.pop();
                });
            }
            else if (this.currentTab === 2) {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('地图视图');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(123:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                        Text.margin({ top: 2 });
                    }, Text);
                    Text.pop();
                });
            }
            else if (this.currentTab === 3) {
                this.ifElseBranchUpdateFunction(3, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('个人中心');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(128:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                        Text.margin({ top: 2 });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(4, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/Home.ets(136:11)", "entry");
        }, Blank);
        Blank.pop();
        // 标题行
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 搜索栏 - 只在设备页面显示
            if (this.currentTab === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Search.create({ placeholder: '搜索设备名称、类型...', value: this.searchKeyword });
                        Search.debugLine("entry/src/main/ets/pages/Home.ets(149:11)", "entry");
                        Search.width('100%');
                        Search.height(40);
                        Search.backgroundColor('#f0f2f5');
                        Search.borderRadius(20);
                        Search.margin({ top: 12 });
                        Search.onChange((value: string) => {
                            this.onSearchChanged(value);
                        });
                    }, Search);
                    Search.pop();
                });
            }
            else if (this.currentTab === 1) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 告警页面的搜索栏（可选）
                        Search.create({ placeholder: '搜索告警...', value: '' });
                        Search.debugLine("entry/src/main/ets/pages/Home.ets(160:11)", "entry");
                        // 告警页面的搜索栏（可选）
                        Search.width('100%');
                        // 告警页面的搜索栏（可选）
                        Search.height(40);
                        // 告警页面的搜索栏（可选）
                        Search.backgroundColor('#f0f2f5');
                        // 告警页面的搜索栏（可选）
                        Search.borderRadius(20);
                        // 告警页面的搜索栏（可选）
                        Search.margin({ top: 12 });
                        // 告警页面的搜索栏（可选）
                        Search.onChange((value: string) => {
                            // 实现告警搜索逻辑
                        });
                    }, Search);
                    // 告警页面的搜索栏（可选）
                    Search.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 其他页面不需要搜索栏，添加一个占位保持高度一致
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/Home.ets(171:11)", "entry");
                        // 其他页面不需要搜索栏，添加一个占位保持高度一致
                        Blank.height(52);
                    }, Blank);
                    // 其他页面不需要搜索栏，添加一个占位保持高度一致
                    Blank.pop();
                });
            }
        }, If);
        If.pop();
        // ========== 顶部栏 - 始终显示 ==========
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // ========== Tabs 内容区 ==========
            Tabs.create({ barPosition: BarPosition.End, controller: this.tabController });
            Tabs.debugLine("entry/src/main/ets/pages/Home.ets(180:7)", "entry");
            // ========== Tabs 内容区 ==========
            Tabs.onChange((index: number) => {
                this.currentTab = index;
                if (index === 0) {
                    this.loadDevices();
                }
                else if (index === 1) {
                    this.loadAlerts();
                }
            });
            // ========== Tabs 内容区 ==========
            Tabs.layoutWeight(1);
        }, Tabs);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                this.DeviceListView.bind(this)();
            });
            TabContent.tabBar({ builder: () => {
                    this.TabBarBuilder.call(this, '设备', '📱', 0);
                } });
            TabContent.debugLine("entry/src/main/ets/pages/Home.ets(181:9)", "entry");
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                this.AlertView.bind(this)();
            });
            TabContent.tabBar({ builder: () => {
                    this.TabBarBuilder.call(this, '告警', '⚠️', 1);
                } });
            TabContent.debugLine("entry/src/main/ets/pages/Home.ets(186:9)", "entry");
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                this.MapView.bind(this)();
            });
            TabContent.tabBar({ builder: () => {
                    this.TabBarBuilder.call(this, '地图', '🗺️', 2);
                } });
            TabContent.debugLine("entry/src/main/ets/pages/Home.ets(191:9)", "entry");
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new Mine(this, { isInTab: true }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Home.ets", line: 197, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    isInTab: true
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                isInTab: true
                            });
                        }
                    }, { name: "Mine" });
                }
            });
            TabContent.tabBar({ builder: () => {
                    this.TabBarBuilder.call(this, '我的', '👤', 3);
                } });
            TabContent.debugLine("entry/src/main/ets/pages/Home.ets(196:9)", "entry");
        }, TabContent);
        TabContent.pop();
        // ========== Tabs 内容区 ==========
        Tabs.pop();
        Column.pop();
    }
    TabBarBuilder(title: string, icon: string, index: number, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(218:5)", "entry");
            Column.width(60);
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(icon);
            Text.debugLine("entry/src/main/ets/pages/Home.ets(219:7)", "entry");
            Text.fontSize(22);
            Text.fontColor(this.currentTab === index ? '#1890ff' : '#999999');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(title);
            Text.debugLine("entry/src/main/ets/pages/Home.ets(222:7)", "entry");
            Text.fontSize(11);
            Text.fontColor(this.currentTab === index ? '#1890ff' : '#999999');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
    }
    DeviceListView(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(233:5)", "entry");
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(235:9)", "entry");
                        Column.width('100%');
                        Column.layoutWeight(1);
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/Home.ets(236:11)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.color('#1890ff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('加载中...');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(240:11)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#999999');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else if (this.filteredDevices.length === 0) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(249:9)", "entry");
                        Column.width('100%');
                        Column.layoutWeight(1);
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.searchKeyword ? '🔍' : '📱');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(250:11)", "entry");
                        Text.fontSize(48);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.searchKeyword ? '未找到设备' : '暂无设备');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(252:11)", "entry");
                        Text.fontSize(16);
                        Text.fontColor('#666666');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.debugInfo);
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(257:11)", "entry");
                        Text.fontSize(11);
                        Text.fontColor('#ff6600');
                        Text.textAlign(TextAlign.Center);
                        Text.margin({ top: 12 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.searchKeyword ? '试试其他关键词' : '点击下方按钮添加设备');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(263:11)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                        Text.margin({ top: 8 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (!this.searchKeyword) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithLabel('刷新');
                                    Button.debugLine("entry/src/main/ets/pages/Home.ets(268:13)", "entry");
                                    Button.margin({ top: 24 });
                                    Button.backgroundColor('#1890ff');
                                    Button.borderRadius(20);
                                    Button.width(120);
                                    Button.onClick(() => this.loadDevices());
                                }, Button);
                                Button.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(280:9)", "entry");
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 工具栏：刷新 + 添加设备
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Home.ets(282:11)", "entry");
                        // 工具栏：刷新 + 添加设备
                        Row.width('100%');
                        // 工具栏：刷新 + 添加设备
                        Row.padding({ left: 16, right: 16, bottom: 12 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 刷新按钮
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Home.ets(284:13)", "entry");
                        // 刷新按钮
                        Row.onClick(() => this.loadDevices());
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔄');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(285:15)", "entry");
                        Text.fontSize(16);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('刷新');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(287:15)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#1890ff');
                        Text.margin({ left: 4 });
                    }, Text);
                    Text.pop();
                    // 刷新按钮
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/Home.ets(294:13)", "entry");
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 添加设备按钮
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Home.ets(297:13)", "entry");
                        // 添加设备按钮
                        Row.onClick(() => {
                            router.pushUrl({ url: 'pages/AddDevice' });
                        });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('+');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(298:15)", "entry");
                        Text.fontSize(16);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('添加设备');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(300:15)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#1890ff');
                        Text.margin({ left: 4 });
                    }, Text);
                    Text.pop();
                    // 添加设备按钮
                    Row.pop();
                    // 工具栏：刷新 + 添加设备
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        List.create();
                        List.debugLine("entry/src/main/ets/pages/Home.ets(312:11)", "entry");
                        List.layoutWeight(1);
                        List.padding({ left: 16, right: 16 });
                    }, List);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const device = _item;
                            {
                                const itemCreation = (elmtId, isInitialRender) => {
                                    ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                                    ListItem.create(deepRenderFunction, true);
                                    if (!isInitialRender) {
                                        ListItem.pop();
                                    }
                                    ViewStackProcessor.StopGetAccessRecording();
                                };
                                const itemCreation2 = (elmtId, isInitialRender) => {
                                    ListItem.create(deepRenderFunction, true);
                                    ListItem.debugLine("entry/src/main/ets/pages/Home.ets(314:15)", "entry");
                                };
                                const deepRenderFunction = (elmtId, isInitialRender) => {
                                    itemCreation(elmtId, isInitialRender);
                                    this.DeviceCard.bind(this)(device);
                                    ListItem.pop();
                                };
                                this.observeComponentCreation2(itemCreation2, ListItem);
                                ListItem.pop();
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.filteredDevices, forEachItemGenFunction, (device: Device) => device.id, false, false);
                    }, ForEach);
                    ForEach.pop();
                    List.pop();
                    Column.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    DeviceCard(device: Device, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(330:5)", "entry");
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor('#ffffff');
            Column.borderRadius(16);
            Column.margin({ bottom: 12 });
            Column.shadow({ radius: 8, color: 'rgba(0,0,0,0.04)', offsetY: 2 });
            Column.onClick(() => {
                const deviceId = device.device_id || device.deviceId || device.id || '';
                router.pushUrl({ url: 'pages/DeviceDetail', params: { deviceId: deviceId } });
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(331:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(332:9)", "entry");
            Column.width(52);
            Column.height(52);
            Column.backgroundColor(device.online === true || device.connected === true || device.status === 'online' ? '#e6f7ff' : '#f0f0f0');
            Column.borderRadius(14);
            Column.justifyContent(FlexAlign.Center);
            Column.alignItems(HorizontalAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.getDeviceIcon(device.type));
            Text.debugLine("entry/src/main/ets/pages/Home.ets(333:11)", "entry");
            Text.fontSize(26);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(343:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
            Column.margin({ left: 14 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(device.name);
            Text.debugLine("entry/src/main/ets/pages/Home.ets(344:11)", "entry");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(device.location || device.ip || '位置未知');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(348:11)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(357:9)", "entry");
            Column.alignItems(HorizontalAlign.End);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(358:11)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create();
            Circle.debugLine("entry/src/main/ets/pages/Home.ets(359:13)", "entry");
            Circle.width(8);
            Circle.height(8);
            Circle.fill(device.online === true || device.connected === true || device.status === 'online' ? '#52c41a' : '#d9d9d9');
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(device.online === true || device.connected === true || device.status === 'online' ? '在线' : '离线');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(363:13)", "entry");
            Text.fontSize(11);
            Text.fontColor(device.online === true || device.connected === true || device.status === 'online' ? '#52c41a' : '#999999');
            Text.margin({ left: 4 });
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(device.type || 'ESP32');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(369:11)", "entry");
            Text.fontSize(10);
            Text.fontColor('#bfbfbf');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('>');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(376:9)", "entry");
            Text.fontSize(16);
            Text.fontColor('#d9d9d9');
            Text.margin({ left: 8 });
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
    }
    getDeviceIcon(type?: string): string {
        const t = (type || '').toUpperCase();
        if (t.includes('AUTO') || t.includes('DISCOVER'))
            return '📡';
        if (t.includes('DHT'))
            return '🌡️';
        if (t.includes('RELAY'))
            return '🔌';
        if (t.includes('LED'))
            return '💡';
        if (t.includes('SENSOR'))
            return '📊';
        return '📱';
    }
    AlertView(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(407:5)", "entry");
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.alertsLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(409:9)", "entry");
                        Column.width('100%');
                        Column.layoutWeight(1);
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/Home.ets(410:11)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.color('#1890ff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('加载中...');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(414:11)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#999999');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else if (this.alerts.length === 0) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(423:9)", "entry");
                        Column.width('100%');
                        Column.layoutWeight(1);
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔔');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(424:11)", "entry");
                        Text.fontSize(48);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('暂无告警');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(426:11)", "entry");
                        Text.fontSize(16);
                        Text.fontColor('#666666');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('设备运行正常');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(430:11)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#52c41a');
                        Text.margin({ top: 8 });
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        List.create();
                        List.debugLine("entry/src/main/ets/pages/Home.ets(439:9)", "entry");
                        List.width('100%');
                        List.layoutWeight(1);
                        List.padding({ left: 16, right: 16, top: 12 });
                    }, List);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const alert = _item;
                            {
                                const itemCreation = (elmtId, isInitialRender) => {
                                    ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                                    ListItem.create(deepRenderFunction, true);
                                    if (!isInitialRender) {
                                        ListItem.pop();
                                    }
                                    ViewStackProcessor.StopGetAccessRecording();
                                };
                                const itemCreation2 = (elmtId, isInitialRender) => {
                                    ListItem.create(deepRenderFunction, true);
                                    ListItem.debugLine("entry/src/main/ets/pages/Home.ets(441:13)", "entry");
                                };
                                const deepRenderFunction = (elmtId, isInitialRender) => {
                                    itemCreation(elmtId, isInitialRender);
                                    this.AlertItem.bind(this)(alert);
                                    ListItem.pop();
                                };
                                this.observeComponentCreation2(itemCreation2, ListItem);
                                ListItem.pop();
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.alerts, forEachItemGenFunction, (alert: Record<string, Object>) => JSON.stringify(alert), false, false);
                    }, ForEach);
                    ForEach.pop();
                    List.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('刷新告警');
            Button.debugLine("entry/src/main/ets/pages/Home.ets(451:7)", "entry");
            Button.margin({ top: 16, bottom: 32 });
            Button.backgroundColor('#1890ff');
            Button.borderRadius(20);
            Button.width(120);
            Button.height(40);
            Button.onClick(() => this.loadAlerts());
        }, Button);
        Button.pop();
        Column.pop();
    }
    AlertItem(alert: Record<string, Object>, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(465:5)", "entry");
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor('#ffffff');
            Column.borderRadius(12);
            Column.margin({ bottom: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(466:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.getAlertLevelIcon(alert.level as string));
            Text.debugLine("entry/src/main/ets/pages/Home.ets(467:9)", "entry");
            Text.fontSize(20);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(470:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.margin({ left: 12 });
            Column.layoutWeight(1);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create((alert.message as string) || '未知告警');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(471:11)", "entry");
            Text.fontSize(14);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create((alert.deviceName as string) || '');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(474:11)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create((alert.createdAt as string) || '');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(483:9)", "entry");
            Text.fontSize(11);
            Text.fontColor('#bfbfbf');
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
    }
    getAlertLevelIcon(level: string): string {
        switch (level) {
            case 'error': return '🔴';
            case 'warning': return '🟡';
            default: return '🔵';
        }
    }
    MapView(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(506:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🗺️');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(507:7)", "entry");
            Text.fontSize(48);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('设备地图');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(509:7)", "entry");
            Text.fontSize(16);
            Text.fontColor('#666666');
            Text.margin({ top: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('功能开发中');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(513:7)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
            Text.margin({ top: 8 });
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Home";
    }
}
registerNamedRoute(() => new Home(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/Home", pageFullPath: "entry/src/main/ets/pages/Home", integratedHsp: "false", moduleType: "followWithHap" });
