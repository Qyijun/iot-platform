if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Home_Params {
    currentTab?: number;
    devices?: Device[];
    filteredDevices?: Device[];
    isLoading?: boolean;
    alerts?: AlertInfo[];
    alertsLoading?: boolean;
    searchKeyword?: string;
    debugInfo?: string;
    currentAlertTab?: number;
    filteredAlertsInTab?: AlertInfo[];
    showDiscoverDialog?: boolean;
    discoverDeviceList?: DiscoverDevice[];
    isDiscovering?: boolean;
    discoveringStatus?: string;
    tabController?: TabsController;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import { deviceViewModel } from "@normalized:N&&&entry/src/main/ets/viewmodels/DeviceViewModel&";
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
import { webSocketService } from "@normalized:N&&&entry/src/main/ets/services/WebSocketService&";
import type { AlertData } from "@normalized:N&&&entry/src/main/ets/services/WebSocketService&";
import type { Device } from '../models/Device';
import { Mine } from "@normalized:N&&&entry/src/main/ets/pages/Mine&";
const TAG = 'Home';
const DOMAIN = 0xFF02;
// 告警信息接口
interface AlertInfo {
    id: number;
    alert_type: string;
    alert_level: string;
    device_id: string;
    device_name: string;
    message: string;
    details: string | null;
    is_read: number;
    created_at: string;
}
// 发现设备数据结构
interface DiscoverDevice {
    deviceId: string;
    ip: string;
    rssi?: number;
    version?: string;
    lastSeen?: number;
}
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
        this.__currentAlertTab = new ObservedPropertySimplePU(0, this, "currentAlertTab");
        this.__filteredAlertsInTab = new ObservedPropertyObjectPU([], this, "filteredAlertsInTab");
        this.__showDiscoverDialog = new ObservedPropertySimplePU(false, this, "showDiscoverDialog");
        this.__discoverDeviceList = new ObservedPropertyObjectPU([], this, "discoverDeviceList");
        this.__isDiscovering = new ObservedPropertySimplePU(false, this, "isDiscovering");
        this.__discoveringStatus = new ObservedPropertySimplePU('', this, "discoveringStatus");
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
        if (params.currentAlertTab !== undefined) {
            this.currentAlertTab = params.currentAlertTab;
        }
        if (params.filteredAlertsInTab !== undefined) {
            this.filteredAlertsInTab = params.filteredAlertsInTab;
        }
        if (params.showDiscoverDialog !== undefined) {
            this.showDiscoverDialog = params.showDiscoverDialog;
        }
        if (params.discoverDeviceList !== undefined) {
            this.discoverDeviceList = params.discoverDeviceList;
        }
        if (params.isDiscovering !== undefined) {
            this.isDiscovering = params.isDiscovering;
        }
        if (params.discoveringStatus !== undefined) {
            this.discoveringStatus = params.discoveringStatus;
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
        this.__currentAlertTab.purgeDependencyOnElmtId(rmElmtId);
        this.__filteredAlertsInTab.purgeDependencyOnElmtId(rmElmtId);
        this.__showDiscoverDialog.purgeDependencyOnElmtId(rmElmtId);
        this.__discoverDeviceList.purgeDependencyOnElmtId(rmElmtId);
        this.__isDiscovering.purgeDependencyOnElmtId(rmElmtId);
        this.__discoveringStatus.purgeDependencyOnElmtId(rmElmtId);
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
        this.__currentAlertTab.aboutToBeDeleted();
        this.__filteredAlertsInTab.aboutToBeDeleted();
        this.__showDiscoverDialog.aboutToBeDeleted();
        this.__discoverDeviceList.aboutToBeDeleted();
        this.__isDiscovering.aboutToBeDeleted();
        this.__discoveringStatus.aboutToBeDeleted();
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
    private __alerts: ObservedPropertyObjectPU<AlertInfo[]>;
    get alerts() {
        return this.__alerts.get();
    }
    set alerts(newValue: AlertInfo[]) {
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
    private __currentAlertTab: ObservedPropertySimplePU<number>; // 0=全部, 1=未读, 2=已读
    get currentAlertTab() {
        return this.__currentAlertTab.get();
    }
    set currentAlertTab(newValue: number) {
        this.__currentAlertTab.set(newValue);
    }
    private __filteredAlertsInTab: ObservedPropertyObjectPU<AlertInfo[]>;
    get filteredAlertsInTab() {
        return this.__filteredAlertsInTab.get();
    }
    set filteredAlertsInTab(newValue: AlertInfo[]) {
        this.__filteredAlertsInTab.set(newValue);
    }
    // 发现设备相关状态
    private __showDiscoverDialog: ObservedPropertySimplePU<boolean>;
    get showDiscoverDialog() {
        return this.__showDiscoverDialog.get();
    }
    set showDiscoverDialog(newValue: boolean) {
        this.__showDiscoverDialog.set(newValue);
    }
    private __discoverDeviceList: ObservedPropertyObjectPU<DiscoverDevice[]>;
    get discoverDeviceList() {
        return this.__discoverDeviceList.get();
    }
    set discoverDeviceList(newValue: DiscoverDevice[]) {
        this.__discoverDeviceList.set(newValue);
    }
    private __isDiscovering: ObservedPropertySimplePU<boolean>;
    get isDiscovering() {
        return this.__isDiscovering.get();
    }
    set isDiscovering(newValue: boolean) {
        this.__isDiscovering.set(newValue);
    }
    private __discoveringStatus: ObservedPropertySimplePU<string>;
    get discoveringStatus() {
        return this.__discoveringStatus.get();
    }
    set discoveringStatus(newValue: string) {
        this.__discoveringStatus.set(newValue);
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
            this.loadAlerts();
            // 如果WebSocket未连接，启动它
            if (!webSocketService.getConnectionStatus()) {
                this.startWebSocket();
            }
        }
        else {
            router.replaceUrl({ url: 'pages/LoginPage' });
        }
    }
    // 启动WebSocket连接
    startWebSocket(): void {
        const baseUrl = httpService.getBaseUrl();
        const token = httpService.token;
        logInfo(TAG, '启动WebSocket: ' + baseUrl);
        logInfo(TAG, 'Token存在: ' + (token ? '是' : '否'));
        // 初始化WebSocket服务
        webSocketService.init(baseUrl);
        if (token) {
            webSocketService.setToken(token);
        }
        // 订阅连接状态变化
        webSocketService.subscribeConnection((connected: boolean) => {
            logInfo(TAG, 'WebSocket连接状态: ' + (connected ? '已连接✓' : '断开✗'));
            if (!connected) {
                promptAction.showToast({
                    message: 'WebSocket断开，请检查网络',
                    duration: 2000
                });
            }
        });
        // 订阅告警推送
        webSocketService.subscribeAlert((alert: AlertData) => {
            logInfo(TAG, '收到告警推送: type=' + alert.alert_type + ', msg=' + alert.message);
            this.handleNewAlert(alert);
            promptAction.showToast({
                message: '收到告警: ' + alert.message,
                duration: 3000
            });
        });
        // 订阅设备数据推送（遥测数据）
        webSocketService.subscribeDeviceData((data: Record<string, Object>) => {
            logInfo(TAG, '收到设备数据: ' + JSON.stringify(data));
            this.handleDeviceData(data);
        });
        // 连接WebSocket
        webSocketService.connect();
        logInfo(TAG, 'WebSocket连接请求已发送');
    }
    // 处理新收到的告警
    handleNewAlert(alert: AlertData): void {
        // 构建新告警对象
        const newAlert: AlertInfo = {
            id: alert.id || Date.now(),
            alert_type: alert.alert_type,
            alert_level: alert.alert_level,
            device_id: alert.device_id,
            device_name: alert.device_name,
            message: alert.message,
            details: alert.details,
            is_read: 0,
            created_at: alert.created_at || new Date().toISOString()
        };
        // 检查是否已存在（根据ID或内容去重）
        const exists = this.alerts.some(a => (a.id > 0 && a.id === newAlert.id) ||
            (a.message === newAlert.message && a.device_id === newAlert.device_id));
        if (!exists) {
            const updatedAlerts: AlertInfo[] = [newAlert];
            for (let i = 0; i < this.alerts.length; i++) {
                updatedAlerts.push(this.alerts[i]);
            }
            this.alerts = updatedAlerts;
            this.filterAlertsInTab();
            // 如果当前在告警Tab，显示提示
            if (this.currentTab === 1) {
                promptAction.showToast({
                    message: '收到新告警: ' + newAlert.message,
                    duration: 3000
                });
            }
        }
    }
    // 处理设备数据（遥测数据）
    handleDeviceData(data: Record<string, Object>): void {
        const deviceId = data.device_id || data.deviceId || '';
        if (!deviceId)
            return;
        // 更新设备列表中的数据
        for (let i = 0; i < this.devices.length; i++) {
            const d = this.devices[i];
            if (d.device_id === deviceId || d.deviceId === deviceId || d.id === deviceId) {
                // 更新设备数据
                d.data = {
                    temperature: data.temperature as number,
                    humidity: data.humidity as number,
                    battery: data.battery as number,
                    rssi: data.rssi as number,
                    switch1: data.switch1 as boolean,
                    switch2: data.switch2 as boolean,
                    led: data.led as boolean
                };
                break;
            }
        }
        // 同步更新 filteredDevices
        this.filteredDevices = [...this.devices];
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
    // 发现设备
    async startDiscover() {
        this.showDiscoverDialog = true;
        this.isDiscovering = true;
        this.discoveringStatus = '正在搜索附近的设备...';
        this.discoverDeviceList = [];
        try {
            const res: any = await httpService.discoverDevices();
            logInfo(TAG, '发现设备结果: ' + JSON.stringify(res));
            if (res?.devices && Array.isArray(res.devices)) {
                this.discoverDeviceList = res.devices as DiscoverDevice[];
                this.discoveringStatus = `发现 ${this.discoverDeviceList.length} 个未入库设备`;
            }
            else {
                this.discoveringStatus = '未发现未入库的设备';
            }
        }
        catch (e) {
            const errMsg = e instanceof Error ? e.message : '未知错误';
            logError(TAG, '发现设备失败: ' + errMsg);
            this.discoveringStatus = '搜索失败: ' + errMsg;
            promptAction.showToast({ message: '发现设备失败' });
        }
        this.isDiscovering = false;
    }
    // 添加单个设备
    async addSingleDevice(device: DiscoverDevice) {
        try {
            const res: any = await httpService.createDevice({
                deviceKey: device.deviceId,
                name: `设备_${device.deviceId.slice(-6)}`,
                type: 'ESP32'
            });
            logInfo(TAG, '添加设备结果: ' + JSON.stringify(res));
            if (res?.success || res?.code === 0) {
                promptAction.showToast({ message: '添加成功' });
                // 从发现列表移除
                this.discoverDeviceList = this.discoverDeviceList.filter(d => d.deviceId !== device.deviceId);
                // 刷新设备列表
                await this.loadDevices();
                if (this.discoverDeviceList.length === 0) {
                    this.discoveringStatus = '所有设备已添加完成';
                }
            }
            else {
                promptAction.showToast({ message: res?.message || res?.error || '添加失败' });
            }
        }
        catch (e) {
            const errMsg = e instanceof Error ? e.message : '未知错误';
            logError(TAG, '添加设备失败: ' + errMsg);
            promptAction.showToast({ message: '添加失败: ' + errMsg });
        }
    }
    // 批量添加所有设备
    async addAllDiscoveredDevices() {
        if (this.discoverDeviceList.length === 0) {
            promptAction.showToast({ message: '没有设备可添加' });
            return;
        }
        let successCount = 0;
        for (const device of this.discoverDeviceList) {
            try {
                const res: any = await httpService.createDevice({
                    deviceKey: device.deviceId,
                    name: `设备_${device.deviceId.slice(-6)}`,
                    type: 'ESP32'
                });
                if (res?.success || res?.code === 0) {
                    successCount++;
                }
            }
            catch (e) {
                // 跳过失败的
            }
        }
        promptAction.showToast({ message: `成功添加 ${successCount} 个设备` });
        this.showDiscoverDialog = false;
        await this.loadDevices();
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
        const rawAlerts: Record<string, Object>[] = await deviceViewModel.loadAlerts();
        // 转换为 AlertInfo 类型
        const serverAlerts: AlertInfo[] = rawAlerts.map((item): AlertInfo => ({
            id: Number(item['id']) || 0,
            alert_type: String(item['alert_type'] || ''),
            alert_level: String(item['alert_level'] || ''),
            device_id: String(item['device_id'] || ''),
            device_name: String(item['device_name'] || ''),
            message: String(item['message'] || ''),
            details: item['details'] ? String(item['details']) : null,
            is_read: Number(item['is_read']) || 0,
            created_at: String(item['created_at'] || new Date().toISOString())
        }));
        // 合并已有告警，避免覆盖 WebSocket 推送的告警
        const existingIds = new Set<number>();
        const mergedAlerts: AlertInfo[] = [...this.alerts];
        for (let i = 0; i < mergedAlerts.length; i++) {
            existingIds.add(mergedAlerts[i].id);
        }
        // 添加服务器返回的告警（排除已存在的）
        for (let i = 0; i < serverAlerts.length; i++) {
            if (!existingIds.has(serverAlerts[i].id)) {
                mergedAlerts.push(serverAlerts[i]);
            }
        }
        // 按时间倒序排列
        mergedAlerts.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return timeB - timeA;
        });
        this.alerts = mergedAlerts;
        this.filterAlertsInTab();
        this.alertsLoading = false;
    }
    filterAlertsInTab(): void {
        let filtered: AlertInfo[] = this.alerts;
        if (this.currentAlertTab === 1) {
            // 未读
            filtered = this.alerts.filter((a: AlertInfo) => a.is_read === 0);
        }
        else if (this.currentAlertTab === 2) {
            // 已读
            filtered = this.alerts.filter((a: AlertInfo) => a.is_read === 1);
        }
        this.filteredAlertsInTab = filtered;
    }
    formatAlertTime(time: string): string {
        if (!time)
            return '';
        try {
            const date: Date = new Date(time);
            const now: Date = new Date();
            const diff: number = now.getTime() - date.getTime();
            if (diff < 60000)
                return '刚刚';
            if (diff < 3600000)
                return `${Math.floor(diff / 60000)}分钟前`;
            if (diff < 86400000)
                return `${Math.floor(diff / 3600000)}小时前`;
            return `${Math.floor(diff / 86400000)}天前`;
        }
        catch {
            return time;
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.debugLine("entry/src/main/ets/pages/Home.ets(397:5)", "entry");
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(398:7)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f5f7fa');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // ========== 顶部栏 - 始终显示 ==========
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(400:9)", "entry");
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
            Row.debugLine("entry/src/main/ets/pages/Home.ets(402:11)", "entry");
            // 标题行
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(403:13)", "entry");
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('iTouch');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(404:15)", "entry");
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
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(410:17)", "entry");
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
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(415:17)", "entry");
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
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(420:17)", "entry");
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
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(425:17)", "entry");
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
            Blank.debugLine("entry/src/main/ets/pages/Home.ets(433:13)", "entry");
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
                        Search.debugLine("entry/src/main/ets/pages/Home.ets(446:13)", "entry");
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
                        Search.debugLine("entry/src/main/ets/pages/Home.ets(457:13)", "entry");
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
                        Blank.debugLine("entry/src/main/ets/pages/Home.ets(468:13)", "entry");
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
            Tabs.debugLine("entry/src/main/ets/pages/Home.ets(477:9)", "entry");
            // ========== Tabs 内容区 ==========
            Tabs.onChange((index: number) => {
                this.currentTab = index;
                if (index === 0) {
                    this.loadDevices();
                }
                else if (index === 1) {
                    this.loadAlerts();
                }
                else if (index === 2) {
                    // 监控Tab - 跳转到监控页面
                    router.pushUrl({ url: 'pages/VideoMonitor' });
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
            TabContent.debugLine("entry/src/main/ets/pages/Home.ets(478:11)", "entry");
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                this.AlertView.bind(this)();
            });
            TabContent.tabBar({ builder: () => {
                    this.TabBarBuilder.call(this, '告警', '⚠️', 1);
                } });
            TabContent.debugLine("entry/src/main/ets/pages/Home.ets(483:11)", "entry");
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                this.VideoView.bind(this)();
            });
            TabContent.tabBar({ builder: () => {
                    this.TabBarBuilder.call(this, '监控', '📹', 2);
                } });
            TabContent.debugLine("entry/src/main/ets/pages/Home.ets(488:11)", "entry");
        }, TabContent);
        TabContent.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TabContent.create(() => {
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new Mine(this, { isInTab: true }, undefined, elmtId, () => { }, { page: "entry/src/main/ets/pages/Home.ets", line: 494, col: 13 });
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
            TabContent.debugLine("entry/src/main/ets/pages/Home.ets(493:11)", "entry");
        }, TabContent);
        TabContent.pop();
        // ========== Tabs 内容区 ==========
        Tabs.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 发现设备弹窗（浮在最上层）
            if (this.showDiscoverDialog) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.DiscoverDialogContent.bind(this)();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Stack.pop();
    }
    TabBarBuilder(title: string, icon: string, index: number, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(526:5)", "entry");
            Column.width(60);
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(icon);
            Text.debugLine("entry/src/main/ets/pages/Home.ets(527:7)", "entry");
            Text.fontSize(22);
            Text.fontColor(this.currentTab === index ? '#1890ff' : '#999999');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(title);
            Text.debugLine("entry/src/main/ets/pages/Home.ets(530:7)", "entry");
            Text.fontSize(11);
            Text.fontColor(this.currentTab === index ? '#1890ff' : '#999999');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
    }
    // ========== 视频监控视图 ==========
    VideoView(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(542:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f5f7fa');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 监控页面入口卡片
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(544:7)", "entry");
            // 监控页面入口卡片
            Column.width('100%');
            // 监控页面入口卡片
            Column.layoutWeight(1);
            // 监控页面入口卡片
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('📹');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(545:9)", "entry");
            Text.fontSize(64);
            Text.margin({ bottom: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('家庭监控');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(549:9)", "entry");
            Text.fontSize(20);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('点击查看停车场实时监控画面');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(554:9)", "entry");
            Text.fontSize(14);
            Text.fontColor('#999999');
            Text.margin({ top: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('进入监控');
            Button.debugLine("entry/src/main/ets/pages/Home.ets(559:9)", "entry");
            Button.fontSize(16);
            Button.fontColor('#ffffff');
            Button.backgroundColor('#1890ff');
            Button.borderRadius(24);
            Button.padding({ left: 32, right: 32, top: 12, bottom: 12 });
            Button.margin({ top: 24 });
            Button.onClick(() => {
                router.pushUrl({ url: 'pages/VideoMonitor' });
            });
        }, Button);
        Button.pop();
        // 监控页面入口卡片
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 快捷功能区
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(575:7)", "entry");
            // 快捷功能区
            Row.width('100%');
            // 快捷功能区
            Row.padding({ top: 24, bottom: 24 });
            // 快捷功能区
            Row.backgroundColor('#ffffff');
            // 快捷功能区
            Row.border({ width: { top: 1 }, color: '#f0f0f0' });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(576:9)", "entry");
            Column.layoutWeight(1);
            Column.justifyContent(FlexAlign.Center);
            Column.onClick(() => router.pushUrl({ url: 'pages/VideoMonitor' }));
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🎥');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(577:11)", "entry");
            Text.fontSize(24);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('实时视频');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(579:11)", "entry");
            Text.fontSize(12);
            Text.fontColor('#666666');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(588:9)", "entry");
            Column.layoutWeight(1);
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('📸');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(589:11)", "entry");
            Text.fontSize(24);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('抓拍');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(591:11)", "entry");
            Text.fontSize(12);
            Text.fontColor('#666666');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(599:9)", "entry");
            Column.layoutWeight(1);
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('⏺️');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(600:11)", "entry");
            Text.fontSize(24);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('录像');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(602:11)", "entry");
            Text.fontSize(12);
            Text.fontColor('#666666');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(610:9)", "entry");
            Column.layoutWeight(1);
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🚗');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(611:11)", "entry");
            Text.fontSize(24);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('车牌识别');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(613:11)", "entry");
            Text.fontSize(12);
            Text.fontColor('#666666');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        // 快捷功能区
        Row.pop();
        Column.pop();
    }
    DeviceListView(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(633:5)", "entry");
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(635:9)", "entry");
                        Column.width('100%');
                        Column.layoutWeight(1);
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/Home.ets(636:11)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.color('#1890ff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('加载中...');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(640:11)", "entry");
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
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(649:9)", "entry");
                        Column.width('100%');
                        Column.layoutWeight(1);
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.searchKeyword ? '🔍' : '📱');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(650:11)", "entry");
                        Text.fontSize(48);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.searchKeyword ? '未找到设备' : '暂无设备');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(652:11)", "entry");
                        Text.fontSize(16);
                        Text.fontColor('#666666');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.debugInfo);
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(657:11)", "entry");
                        Text.fontSize(11);
                        Text.fontColor('#ff6600');
                        Text.textAlign(TextAlign.Center);
                        Text.margin({ top: 12 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.searchKeyword ? '试试其他关键词' : '点击下方按钮添加设备');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(663:11)", "entry");
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
                                    Button.debugLine("entry/src/main/ets/pages/Home.ets(668:13)", "entry");
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
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(680:9)", "entry");
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 工具栏：刷新 + 发现设备 + 添加设备
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Home.ets(682:11)", "entry");
                        // 工具栏：刷新 + 发现设备 + 添加设备
                        Row.width('100%');
                        // 工具栏：刷新 + 发现设备 + 添加设备
                        Row.padding({ left: 16, right: 16, bottom: 12 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 刷新按钮
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Home.ets(684:13)", "entry");
                        // 刷新按钮
                        Row.onClick(() => this.loadDevices());
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔄');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(685:15)", "entry");
                        Text.fontSize(16);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('刷新');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(687:15)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#1890ff');
                        Text.margin({ left: 4 });
                    }, Text);
                    Text.pop();
                    // 刷新按钮
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/Home.ets(694:13)", "entry");
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 发现设备按钮
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Home.ets(697:13)", "entry");
                        // 发现设备按钮
                        Row.onClick(() => this.startDiscover());
                        // 发现设备按钮
                        Row.margin({ right: 16 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('📡');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(698:15)", "entry");
                        Text.fontSize(14);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('发现设备');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(700:15)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#1890ff');
                        Text.margin({ left: 4 });
                    }, Text);
                    Text.pop();
                    // 发现设备按钮
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 添加设备按钮
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Home.ets(709:13)", "entry");
                        // 添加设备按钮
                        Row.onClick(() => {
                            router.pushUrl({ url: 'pages/AddDevice' });
                        });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('+');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(710:15)", "entry");
                        Text.fontSize(16);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('添加设备');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(712:15)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#1890ff');
                        Text.margin({ left: 4 });
                    }, Text);
                    Text.pop();
                    // 添加设备按钮
                    Row.pop();
                    // 工具栏：刷新 + 发现设备 + 添加设备
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        List.create();
                        List.debugLine("entry/src/main/ets/pages/Home.ets(724:11)", "entry");
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
                                    ListItem.debugLine("entry/src/main/ets/pages/Home.ets(726:15)", "entry");
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
                        this.forEachUpdateFunction(elmtId, this.filteredDevices, forEachItemGenFunction, (device: Device) => {
                            // 安全的key提取，确保唯一性
                            return device.id || device.device_id || device.deviceId || `device_${Math.random().toString(36).substring(7)}`;
                        }, false, false);
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
            Column.debugLine("entry/src/main/ets/pages/Home.ets(745:5)", "entry");
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor('#ffffff');
            Column.borderRadius(16);
            Column.margin({ bottom: 12 });
            Column.shadow({ radius: 8, color: 'rgba(0,0,0,0.04)', offsetY: 2 });
            Column.onClick(() => {
                // 安全获取设备ID
                const deviceId = device.device_id || device.deviceId || device.id || '';
                console.info('=== 点击设备, 获取到的deviceId:', deviceId);
                console.info('=== 设备完整信息:', JSON.stringify(device));
                if (!deviceId || deviceId === 'undefined' || deviceId === 'null') {
                    promptAction.showToast({ message: '设备ID无效，无法查看详情' });
                    return;
                }
                router.pushUrl({ url: 'pages/DeviceDetail', params: { deviceId: deviceId } });
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(746:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(747:9)", "entry");
            Column.width(52);
            Column.height(52);
            Column.backgroundColor(device.online === true || device.connected === true || device.status === 'online' ? '#e6f7ff' : '#f0f0f0');
            Column.borderRadius(14);
            Column.justifyContent(FlexAlign.Center);
            Column.alignItems(HorizontalAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.getDeviceIcon(device.type));
            Text.debugLine("entry/src/main/ets/pages/Home.ets(748:11)", "entry");
            Text.fontSize(26);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(758:9)", "entry");
            Column.alignItems(HorizontalAlign.Start);
            Column.layoutWeight(1);
            Column.margin({ left: 14 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(device.name);
            Text.debugLine("entry/src/main/ets/pages/Home.ets(759:11)", "entry");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(device.location || device.ip || '位置未知');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(763:11)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 实时数据
            if (device.data) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Home.ets(769:13)", "entry");
                        Row.margin({ top: 4 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (device.data.temperature !== undefined) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(`🌡️ ${device.data.temperature}°C`);
                                    Text.debugLine("entry/src/main/ets/pages/Home.ets(771:17)", "entry");
                                    Text.fontSize(11);
                                    Text.fontColor('#666666');
                                    Text.margin({ right: 12 });
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
                        if (device.data.humidity !== undefined) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(`💧 ${device.data.humidity}%`);
                                    Text.debugLine("entry/src/main/ets/pages/Home.ets(777:17)", "entry");
                                    Text.fontSize(11);
                                    Text.fontColor('#666666');
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
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(789:9)", "entry");
            Column.alignItems(HorizontalAlign.End);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(device.type || 'ESP32');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(790:11)", "entry");
            Text.fontSize(10);
            Text.fontColor('#bfbfbf');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 在线离线指示器
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(794:11)", "entry");
            // 在线离线指示器
            Row.margin({ top: 6 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create();
            Circle.debugLine("entry/src/main/ets/pages/Home.ets(795:13)", "entry");
            Circle.width(8);
            Circle.height(8);
            Circle.fill(device.online === true || device.connected === true || device.status === 'online' ? '#52c41a' : '#d9d9d9');
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(device.online === true || device.connected === true || device.status === 'online' ? '在线' : '离线');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(799:13)", "entry");
            Text.fontSize(11);
            Text.fontColor(device.online === true || device.connected === true || device.status === 'online' ? '#52c41a' : '#999999');
            Text.margin({ left: 4 });
        }, Text);
        Text.pop();
        // 在线离线指示器
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('>');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(808:9)", "entry");
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
    getAlertIcon(type: string): string {
        if (type === 'device_online')
            return '📱';
        if (type === 'device_offline')
            return '📴';
        if (type === 'command_success')
            return '✅';
        if (type === 'command_failed')
            return '❌';
        if (type === 'ota_progress')
            return '📦';
        if (type === 'ota_complete')
            return '✅';
        if (type === 'ota_error')
            return '❌';
        if (type === 'warning')
            return '⚠️';
        if (type === 'error')
            return '🔴';
        return 'ℹ️';
    }
    AlertView(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(861:5)", "entry");
            Column.width('100%');
            Column.height('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 告警 Tab - 直接显示告警列表
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(863:7)", "entry");
            // 告警 Tab - 直接显示告警列表
            Column.width('100%');
            // 告警 Tab - 直接显示告警列表
            Column.layoutWeight(1);
            // 告警 Tab - 直接显示告警列表
            Column.backgroundColor('#f5f7fa');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(864:9)", "entry");
            Row.width('100%');
            Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
            Row.backgroundColor('#ffffff');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('⚠️');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(865:11)", "entry");
            Text.fontSize(18);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('告警中心');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(867:11)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
            Text.margin({ left: 8 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/Home.ets(872:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.alerts.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`共 ${this.alerts.length} 条`);
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(874:13)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
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
            // 标签栏：全部/未读/已读
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(884:9)", "entry");
            // 标签栏：全部/未读/已读
            Row.width('100%');
            // 标签栏：全部/未读/已读
            Row.padding({ left: 20, right: 20, top: 8, bottom: 8 });
            // 标签栏：全部/未读/已读
            Row.backgroundColor('#ffffff');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const tab = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create();
                    Column.debugLine("entry/src/main/ets/pages/Home.ets(886:13)", "entry");
                    Column.layoutWeight(1);
                    Column.onClick(() => {
                        this.currentAlertTab = index;
                        this.filterAlertsInTab();
                    });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(tab);
                    Text.debugLine("entry/src/main/ets/pages/Home.ets(887:15)", "entry");
                    Text.fontSize(14);
                    Text.fontColor(this.currentAlertTab === index ? '#1890ff' : '#666666');
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    if (this.currentAlertTab === index) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.debugLine("entry/src/main/ets/pages/Home.ets(891:17)", "entry");
                                Divider.width(40);
                                Divider.strokeWidth(2);
                                Divider.color('#1890ff');
                                Divider.margin({ top: 4 });
                            }, Divider);
                        });
                    }
                    else {
                        this.ifElseBranchUpdateFunction(1, () => {
                        });
                    }
                }, If);
                If.pop();
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, ['全部', '未读', '已读'], forEachItemGenFunction, (tab: string) => tab, true, false);
        }, ForEach);
        ForEach.pop();
        // 标签栏：全部/未读/已读
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 告警列表（下拉刷新）
            Refresh.create({ refreshing: this.alertsLoading, offset: 0, friction: 100 });
            Refresh.debugLine("entry/src/main/ets/pages/Home.ets(910:9)", "entry");
            // 告警列表（下拉刷新）
            Refresh.onStateChange((state: RefreshStatus) => {
                if (state === RefreshStatus.Refresh) {
                    this.loadAlerts();
                }
            });
            // 告警列表（下拉刷新）
            Refresh.layoutWeight(1);
        }, Refresh);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.filteredAlertsInTab.length === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(912:13)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('📋');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(913:15)", "entry");
                        Text.fontSize(48);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('暂无告警');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(915:15)", "entry");
                        Text.fontSize(16);
                        Text.fontColor('#666666');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('所有设备运行正常');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(919:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                        Text.margin({ top: 8 });
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        List.create();
                        List.debugLine("entry/src/main/ets/pages/Home.ets(928:13)", "entry");
                        List.width('100%');
                        List.height('100%');
                        List.padding({ left: 16, right: 16, top: 8 });
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
                                    ListItem.debugLine("entry/src/main/ets/pages/Home.ets(930:17)", "entry");
                                };
                                const deepRenderFunction = (elmtId, isInitialRender) => {
                                    itemCreation(elmtId, isInitialRender);
                                    this.AlertListItem.bind(this)(alert);
                                    ListItem.pop();
                                };
                                this.observeComponentCreation2(itemCreation2, ListItem);
                                ListItem.pop();
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.filteredAlertsInTab, forEachItemGenFunction, (alert: Record<string, Object>, idx: number) => String(idx), false, true);
                    }, ForEach);
                    ForEach.pop();
                    List.pop();
                });
            }
        }, If);
        If.pop();
        // 告警列表（下拉刷新）
        Refresh.pop();
        // 告警 Tab - 直接显示告警列表
        Column.pop();
        Column.pop();
    }
    AlertListItem(alert: Record<string, Object>, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(957:5)", "entry");
            Column.width('100%');
            Column.padding({ top: 12, bottom: 12, left: 16, right: 16 });
            Column.backgroundColor((alert['is_read'] as number) === 1 ? '#ffffff' : '#fffbe6');
            Column.borderRadius(12);
            Column.margin({ bottom: 8 });
            Column.border({
                width: 1,
                color: (alert['is_read'] as number) === 1 ? '#f0f0f0' : '#ffe58f'
            });
            Column.onClick(async () => {
                // 标记为已读
                if ((alert['is_read'] as number) !== 1) {
                    const alertId = String(alert['id'] || '');
                    if (alertId && alertId !== 'undefined' && alertId !== 'null') {
                        try {
                            await httpService.markAlertRead(alertId);
                            // 从当前列表移除
                            this.alerts = this.alerts.filter(a => String(a.id) !== alertId);
                            this.filterAlertsInTab();
                        }
                        catch (e) {
                            console.error(TAG, `标记已读失败: ${e}`);
                        }
                    }
                }
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(958:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 告警图标
            Text.create(this.getAlertIcon(alert['alert_type'] as string));
            Text.debugLine("entry/src/main/ets/pages/Home.ets(960:9)", "entry");
            // 告警图标
            Text.fontSize(24);
        }, Text);
        // 告警图标
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(963:9)", "entry");
            Column.layoutWeight(1);
            Column.margin({ left: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(alert['message'] as string || '未知告警');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(964:11)", "entry");
            Text.fontSize(14);
            Text.fontColor('#333333');
            Text.maxLines(2);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(970:11)", "entry");
            Row.margin({ top: 4 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(alert['device_name'] as string || '');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(971:13)", "entry");
            Text.fontSize(11);
            Text.fontColor('#999999');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' • ');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(974:13)", "entry");
            Text.fontSize(11);
            Text.fontColor('#d9d9d9');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.formatAlertTime(alert['created_at'] as string));
            Text.debugLine("entry/src/main/ets/pages/Home.ets(977:13)", "entry");
            Text.fontSize(11);
            Text.fontColor('#999999');
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 未读：显示"标记已读"按钮，已读：显示勾
            if ((alert['is_read'] as number) !== 1) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('标记已读');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(988:11)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#ffffff');
                        Text.backgroundColor('#1890ff');
                        Text.padding({ left: 12, right: 12, top: 6, bottom: 6 });
                        Text.borderRadius(14);
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('已读');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(995:11)", "entry");
                        Text.fontSize(11);
                        Text.fontColor('#999999');
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
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
            Column.debugLine("entry/src/main/ets/pages/Home.ets(1039:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🗺️');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(1040:7)", "entry");
            Text.fontSize(48);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('设备地图');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(1042:7)", "entry");
            Text.fontSize(16);
            Text.fontColor('#666666');
            Text.margin({ top: 16 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('功能开发中');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(1046:7)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
            Text.margin({ top: 8 });
        }, Text);
        Text.pop();
        Column.pop();
    }
    // 发现设备弹窗内容
    DiscoverDialogContent(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.debugLine("entry/src/main/ets/pages/Home.ets(1059:5)", "entry");
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 背景遮罩
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(1061:7)", "entry");
            // 背景遮罩
            Column.width('100%');
            // 背景遮罩
            Column.height('100%');
            // 背景遮罩
            Column.backgroundColor('rgba(0,0,0,0.5)');
            // 背景遮罩
            Column.onClick(() => {
                this.showDiscoverDialog = false;
            });
        }, Column);
        // 背景遮罩
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 弹窗内容（居中显示）
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Home.ets(1070:7)", "entry");
            // 弹窗内容（居中显示）
            Column.width('85%');
            // 弹窗内容（居中显示）
            Column.constraintSize({ maxHeight: '70%' });
            // 弹窗内容（居中显示）
            Column.backgroundColor('#ffffff');
            // 弹窗内容（居中显示）
            Column.borderRadius(16);
            // 弹窗内容（居中显示）
            Column.align(Alignment.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 标题栏
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(1072:9)", "entry");
            // 标题栏
            Row.width('100%');
            // 标题栏
            Row.padding({ left: 20, right: 12, top: 16, bottom: 16 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('📡 发现设备');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(1073:11)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/Home.ets(1078:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('×');
            Text.debugLine("entry/src/main/ets/pages/Home.ets(1080:11)", "entry");
            Text.fontSize(24);
            Text.fontColor('#999999');
            Text.onClick(() => {
                this.showDiscoverDialog = false;
            });
        }, Text);
        Text.pop();
        // 标题栏
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/pages/Home.ets(1090:9)", "entry");
            Divider.color('#f0f0f0');
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 状态信息
            if (this.isDiscovering) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(1095:11)", "entry");
                        Column.width('100%');
                        Column.padding({ top: 40, bottom: 40 });
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/Home.ets(1096:13)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.color('#1890ff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.discoveringStatus);
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(1100:13)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#666666');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else if (this.discoverDeviceList.length === 0) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(1109:11)", "entry");
                        Column.width('100%');
                        Column.padding({ top: 40, bottom: 40 });
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔍');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(1110:13)", "entry");
                        Text.fontSize(48);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.discoveringStatus);
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(1112:13)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#666666');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('请确保有设备已连接MQTT服务器');
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(1116:13)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
                        Text.margin({ top: 8 });
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 设备列表
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/Home.ets(1126:11)", "entry");
                        // 设备列表
                        Scroll.layoutWeight(1);
                        // 设备列表
                        Scroll.width('100%');
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Home.ets(1127:13)", "entry");
                        Column.padding({ left: 16, right: 16 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`发现 ${this.discoverDeviceList.length} 个未入库设备`);
                        Text.debugLine("entry/src/main/ets/pages/Home.ets(1128:15)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#666666');
                        Text.width('100%');
                        Text.padding({ top: 12, bottom: 12 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const device = _item;
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Row.create();
                                Row.debugLine("entry/src/main/ets/pages/Home.ets(1135:17)", "entry");
                                Row.width('100%');
                                Row.padding({ top: 12, bottom: 12, left: 16, right: 16 });
                                Row.backgroundColor('#f9f9f9');
                                Row.borderRadius(12);
                                Row.margin({ bottom: 8 });
                            }, Row);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create();
                                Column.debugLine("entry/src/main/ets/pages/Home.ets(1136:19)", "entry");
                                Column.width(44);
                                Column.height(44);
                                Column.backgroundColor('#e6f7ff');
                                Column.borderRadius(10);
                                Column.justifyContent(FlexAlign.Center);
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create('📱');
                                Text.debugLine("entry/src/main/ets/pages/Home.ets(1137:21)", "entry");
                                Text.fontSize(24);
                            }, Text);
                            Text.pop();
                            Column.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Column.create();
                                Column.debugLine("entry/src/main/ets/pages/Home.ets(1146:19)", "entry");
                                Column.alignItems(HorizontalAlign.Start);
                                Column.margin({ left: 12 });
                                Column.layoutWeight(1);
                            }, Column);
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(device.deviceId);
                                Text.debugLine("entry/src/main/ets/pages/Home.ets(1147:21)", "entry");
                                Text.fontSize(14);
                                Text.fontWeight(FontWeight.Medium);
                                Text.fontColor('#333333');
                            }, Text);
                            Text.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(device.ip || 'IP未知');
                                Text.debugLine("entry/src/main/ets/pages/Home.ets(1151:21)", "entry");
                                Text.fontSize(12);
                                Text.fontColor('#999999');
                                Text.margin({ top: 2 });
                            }, Text);
                            Text.pop();
                            Column.pop();
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Button.createWithLabel('添加');
                                Button.debugLine("entry/src/main/ets/pages/Home.ets(1160:19)", "entry");
                                Button.fontSize(12);
                                Button.height(32);
                                Button.backgroundColor('#52c41a');
                                Button.borderRadius(16);
                                Button.onClick(() => this.addSingleDevice(device));
                            }, Button);
                            Button.pop();
                            Row.pop();
                        };
                        this.forEachUpdateFunction(elmtId, this.discoverDeviceList, forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    Column.pop();
                    // 设备列表
                    Scroll.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Divider.create();
            Divider.debugLine("entry/src/main/ets/pages/Home.ets(1180:9)", "entry");
            Divider.color('#f0f0f0');
        }, Divider);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 底部按钮
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Home.ets(1184:9)", "entry");
            // 底部按钮
            Row.width('100%');
            // 底部按钮
            Row.padding(16);
            // 底部按钮
            Row.justifyContent(FlexAlign.End);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('刷新');
            Button.debugLine("entry/src/main/ets/pages/Home.ets(1185:11)", "entry");
            Button.fontSize(14);
            Button.height(40);
            Button.backgroundColor('#f5f5f5');
            Button.fontColor('#666666');
            Button.borderRadius(20);
            Button.onClick(() => this.startDiscover());
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.discoverDeviceList.length > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('一键添加全部');
                        Button.debugLine("entry/src/main/ets/pages/Home.ets(1194:13)", "entry");
                        Button.fontSize(14);
                        Button.height(40);
                        Button.backgroundColor('#52c41a');
                        Button.fontColor('#ffffff');
                        Button.borderRadius(20);
                        Button.margin({ left: 12 });
                        Button.onClick(() => this.addAllDiscoveredDevices());
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
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('关闭');
            Button.debugLine("entry/src/main/ets/pages/Home.ets(1204:11)", "entry");
            Button.fontSize(14);
            Button.height(40);
            Button.backgroundColor('#1890ff');
            Button.fontColor('#ffffff');
            Button.borderRadius(20);
            Button.margin({ left: 12 });
            Button.onClick(() => {
                this.showDiscoverDialog = false;
            });
        }, Button);
        Button.pop();
        // 底部按钮
        Row.pop();
        // 弹窗内容（居中显示）
        Column.pop();
        Stack.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Home";
    }
}
registerNamedRoute(() => new Home(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/Home", pageFullPath: "entry/src/main/ets/pages/Home", integratedHsp: "false", moduleType: "followWithHap" });
