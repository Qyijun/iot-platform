if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface Alerts_Params {
    alerts?: AlertCardData[];
    filteredAlerts?: AlertCardData[];
    isLoading?: boolean;
    selectedTab?: number;
    unreadCount?: number;
    isConnected?: boolean;
    searchKeyword?: string;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import http from "@ohos:net.http";
import { configService } from "@normalized:N&&&entry/src/main/ets/services/ConfigService&";
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
import { webSocketService } from "@normalized:N&&&entry/src/main/ets/services/WebSocketService&";
import type { AlertData } from "@normalized:N&&&entry/src/main/ets/services/WebSocketService&";
// 日志标签
const TAG: string = 'Alerts';
// 安全获取错误消息
function getErrorMessage(e: Error): string {
    const msg = e?.message;
    return typeof msg === 'string' ? msg : '未知错误';
}
// 告警卡片数据（用于UI）
class AlertCardData {
    id: number = 0;
    alert_type: string = '';
    alert_level: string = 'info';
    device_id: string = '';
    device_name: string = '';
    message: string = '';
    details: string | null = null;
    is_read: boolean = false;
    created_at: string = '';
}
// 告警级别颜色
function getAlertColor(level: string): string {
    if (level === 'success')
        return '#52c41a';
    if (level === 'warning')
        return '#faad14';
    if (level === 'error')
        return '#ff4d4f';
    return '#1890ff';
}
// 告警图标
function getAlertIcon(type: string): string {
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
// 告警类型名称
function getAlertTypeName(type: string): string {
    if (type === 'device_online')
        return '设备上线';
    if (type === 'device_offline')
        return '设备离线';
    if (type === 'command_success')
        return '命令成功';
    if (type === 'command_failed')
        return '命令失败';
    if (type === 'ota_progress')
        return 'OTA升级中';
    if (type === 'ota_complete')
        return 'OTA完成';
    if (type === 'ota_error')
        return 'OTA失败';
    return type;
}
class Alerts extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__alerts = new ObservedPropertyObjectPU([], this, "alerts");
        this.__filteredAlerts = new ObservedPropertyObjectPU([], this, "filteredAlerts");
        this.__isLoading = new ObservedPropertySimplePU(false, this, "isLoading");
        this.__selectedTab = new ObservedPropertySimplePU(0, this, "selectedTab");
        this.__unreadCount = new ObservedPropertySimplePU(0, this, "unreadCount");
        this.__isConnected = new ObservedPropertySimplePU(false, this, "isConnected");
        this.__searchKeyword = new ObservedPropertySimplePU('', this, "searchKeyword");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: Alerts_Params) {
        if (params.alerts !== undefined) {
            this.alerts = params.alerts;
        }
        if (params.filteredAlerts !== undefined) {
            this.filteredAlerts = params.filteredAlerts;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.selectedTab !== undefined) {
            this.selectedTab = params.selectedTab;
        }
        if (params.unreadCount !== undefined) {
            this.unreadCount = params.unreadCount;
        }
        if (params.isConnected !== undefined) {
            this.isConnected = params.isConnected;
        }
        if (params.searchKeyword !== undefined) {
            this.searchKeyword = params.searchKeyword;
        }
    }
    updateStateVars(params: Alerts_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__alerts.purgeDependencyOnElmtId(rmElmtId);
        this.__filteredAlerts.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedTab.purgeDependencyOnElmtId(rmElmtId);
        this.__unreadCount.purgeDependencyOnElmtId(rmElmtId);
        this.__isConnected.purgeDependencyOnElmtId(rmElmtId);
        this.__searchKeyword.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__alerts.aboutToBeDeleted();
        this.__filteredAlerts.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__selectedTab.aboutToBeDeleted();
        this.__unreadCount.aboutToBeDeleted();
        this.__isConnected.aboutToBeDeleted();
        this.__searchKeyword.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __alerts: ObservedPropertyObjectPU<AlertCardData[]>;
    get alerts() {
        return this.__alerts.get();
    }
    set alerts(newValue: AlertCardData[]) {
        this.__alerts.set(newValue);
    }
    private __filteredAlerts: ObservedPropertyObjectPU<AlertCardData[]>;
    get filteredAlerts() {
        return this.__filteredAlerts.get();
    }
    set filteredAlerts(newValue: AlertCardData[]) {
        this.__filteredAlerts.set(newValue);
    }
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private __selectedTab: ObservedPropertySimplePU<number>; // 0=全部, 1=未读, 2=已读
    get selectedTab() {
        return this.__selectedTab.get();
    }
    set selectedTab(newValue: number) {
        this.__selectedTab.set(newValue);
    }
    private __unreadCount: ObservedPropertySimplePU<number>;
    get unreadCount() {
        return this.__unreadCount.get();
    }
    set unreadCount(newValue: number) {
        this.__unreadCount.set(newValue);
    }
    private __isConnected: ObservedPropertySimplePU<boolean>;
    get isConnected() {
        return this.__isConnected.get();
    }
    set isConnected(newValue: boolean) {
        this.__isConnected.set(newValue);
    }
    private __searchKeyword: ObservedPropertySimplePU<string>;
    get searchKeyword() {
        return this.__searchKeyword.get();
    }
    set searchKeyword(newValue: string) {
        this.__searchKeyword.set(newValue);
    }
    aboutToAppear(): void {
        console.info(TAG, '=== Alerts: aboutToAppear ===');
        this.loadAlerts();
        this.setupConnection();
    }
    aboutToDisappear(): void {
        console.info(TAG, '=== Alerts: aboutToDisappear ===');
        webSocketService.disconnect();
    }
    onPageShow(): void {
        console.info(TAG, '=== Alerts: onPageShow ===');
        this.loadAlerts();
    }
    setupConnection(): void {
        const baseUrl = configService.getBaseUrl();
        console.info(TAG, 'WebSocket初始化: ' + baseUrl);
        webSocketService.init(baseUrl);
        // 订阅告警推送
        webSocketService.subscribeAlert((alert) => {
            console.info(TAG, '收到告警推送: ' + alert.alert_type + ', ' + alert.message);
            this.handleNewAlert(alert);
        });
        // 订阅连接状态
        webSocketService.subscribeConnection((connected: boolean) => {
            this.isConnected = connected;
            console.info(TAG, 'WebSocket连接状态: ' + (connected ? '已连接' : '断开'));
        });
        webSocketService.connect();
    }
    // 处理新收到的告警
    handleNewAlert(alert: AlertData): void {
        // 检查是否已存在
        const exists = this.alerts.some(a => a.id === alert.id);
        if (exists) {
            return;
        }
        const newAlert = new AlertCardData();
        newAlert.id = alert.id || Date.now();
        newAlert.alert_type = alert.alert_type || '';
        newAlert.alert_level = alert.alert_level || 'info';
        newAlert.device_id = alert.device_id || '';
        newAlert.device_name = alert.device_name || '';
        newAlert.message = alert.message || '';
        newAlert.details = alert.details;
        newAlert.is_read = false;
        newAlert.created_at = alert.created_at || new Date().toISOString();
        // 添加到列表头部
        const updated = [newAlert];
        for (let i = 0; i < this.alerts.length; i++) {
            updated.push(this.alerts[i]);
        }
        this.alerts = updated;
        // 更新未读数
        this.unreadCount++;
        this.filterAlerts();
        promptAction.showToast({ message: '收到告警: ' + newAlert.message });
    }
    formatTime(time: string): string {
        if (!time)
            return '';
        try {
            const date: Date = new Date(time);
            const now: Date = new Date();
            const diff: number = now.getTime() - date.getTime();
            if (diff < 60000) {
                return '刚刚';
            }
            else if (diff < 3600000) {
                return `${Math.floor(diff / 60000)}分钟前`;
            }
            else if (diff < 86400000) {
                return `${Math.floor(diff / 3600000)}小时前`;
            }
            else {
                return `${Math.floor(diff / 86400000)}天前`;
            }
        }
        catch {
            return time;
        }
    }
    loadAlerts(): void {
        this.isLoading = true;
        const req: http.HttpRequest = http.createHttp();
        const url: string = '/api/alerts';
        httpService.request(url, { method: http.RequestMethod.GET })
            .then((result: Record<string, Object>): void => {
            try {
                req.destroy();
            }
            catch (e) {
                // ignore
            }
            this.isLoading = false;
            const alertsArr: Array<Record<string, Object>> = result['alerts'] as Array<Record<string, Object>>;
            const unreadCountVal: number = result['unreadCount'] as number || 0;
            if (alertsArr && Array.isArray(alertsArr)) {
                // 记录已有的告警ID
                const existingIds = new Set<number>();
                for (let i = 0; i < this.alerts.length; i++) {
                    existingIds.add(this.alerts[i].id);
                }
                // 添加服务器返回的新告警
                for (let i: number = 0; i < alertsArr.length; i++) {
                    const item: Record<string, Object> = alertsArr[i];
                    const id = item['id'] as number || 0;
                    // 跳过已存在的告警
                    if (existingIds.has(id)) {
                        continue;
                    }
                    const alert: AlertCardData = new AlertCardData();
                    alert.id = id;
                    alert.alert_type = item['alert_type'] as string || '';
                    alert.alert_level = item['alert_level'] as string || 'info';
                    alert.device_id = item['device_id'] as string || '';
                    alert.device_name = item['device_name'] as string || '';
                    alert.message = item['message'] as string || '';
                    alert.details = item['details'] as string | null;
                    const isReadVal: number = item['is_read'] as number || 0;
                    alert.is_read = isReadVal === 1;
                    alert.created_at = item['created_at'] as string || '';
                    this.alerts.push(alert);
                }
                // 按时间倒序排列
                this.alerts.sort((a, b) => {
                    const timeA = new Date(a.created_at).getTime();
                    const timeB = new Date(b.created_at).getTime();
                    return timeB - timeA;
                });
                this.unreadCount = unreadCountVal;
                console.info(TAG, `加载成功: 总数=${this.alerts.length}, 未读=${this.unreadCount}`);
            }
            else {
                console.warn(TAG, '返回数据格式异常');
            }
            this.filterAlerts();
        })
            .catch((e: Error): void => {
            try {
                req.destroy();
            }
            catch (err) {
                // ignore
            }
            this.isLoading = false;
            console.error(TAG, `加载告警失败: ${getErrorMessage(e)}`);
            promptAction.showToast({ message: '加载告警失败' });
            this.filterAlerts();
        });
    }
    filterAlerts(): void {
        console.info(TAG, `filterAlerts: 当前标签=${this.selectedTab}, 未读数量=${this.unreadCount}, 总告警数=${this.alerts.length}`);
        let filtered: AlertCardData[] = [...this.alerts];
        // 根据标签筛选
        if (this.selectedTab === 1) {
            filtered = filtered.filter((a: AlertCardData): boolean => !a.is_read);
            console.info(TAG, `筛选未读: ${filtered.length}条`);
        }
        else if (this.selectedTab === 2) {
            filtered = filtered.filter((a: AlertCardData): boolean => a.is_read);
            console.info(TAG, `筛选已读: ${filtered.length}条`);
        }
        else {
            console.info(TAG, `显示全部: ${filtered.length}条`);
        }
        // 关键词搜索
        if (this.searchKeyword && this.searchKeyword.trim()) {
            const keyword: string = this.searchKeyword.toLowerCase().trim();
            filtered = filtered.filter((a: AlertCardData): boolean => {
                const msgMatch: boolean = a.message ? a.message.toLowerCase().includes(keyword) : false;
                const nameMatch: boolean = a.device_name ? a.device_name.toLowerCase().includes(keyword) : false;
                const idMatch: boolean = a.device_id ? a.device_id.toLowerCase().includes(keyword) : false;
                return msgMatch || nameMatch || idMatch;
            });
            console.info(TAG, `搜索关键词"${keyword}"后: ${filtered.length}条`);
        }
        this.filteredAlerts = filtered;
    }
    markAsRead(alert: AlertCardData): void {
        if (alert.is_read)
            return;
        const req: http.HttpRequest = http.createHttp();
        const url: string = `/api/alerts/${alert.id}/read`;
        httpService.request(url, { method: http.RequestMethod.PUT })
            .then((): void => {
            try {
                req.destroy();
            }
            catch (e) {
                // ignore
            }
            alert.is_read = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
            this.filterAlerts();
            console.info(TAG, `标记已读成功: alertId=${alert.id}`);
        })
            .catch((e: Error): void => {
            try {
                req.destroy();
            }
            catch (err) {
                // ignore
            }
            console.error(TAG, `标记已读失败: ${getErrorMessage(e)}`);
        });
    }
    markAllAsRead(): void {
        const req: http.HttpRequest = http.createHttp();
        const url: string = '/api/alerts/read-all';
        httpService.request(url, { method: http.RequestMethod.PUT })
            .then((): void => {
            try {
                req.destroy();
            }
            catch (e) {
                // ignore
            }
            for (let i: number = 0; i < this.alerts.length; i++) {
                this.alerts[i].is_read = true;
            }
            this.unreadCount = 0;
            this.filterAlerts();
            promptAction.showToast({ message: '已全部标记为已读' });
            console.info(TAG, '全部标记已读成功');
        })
            .catch((e: Error): void => {
            try {
                req.destroy();
            }
            catch (err) {
                // ignore
            }
            console.error(TAG, `标记全部已读失败: ${getErrorMessage(e)}`);
        });
    }
    deleteAlert(alert: AlertCardData): void {
        const req: http.HttpRequest = http.createHttp();
        const url: string = `/api/alerts/${alert.id}`;
        httpService.request(url, { method: http.RequestMethod.DELETE })
            .then((): void => {
            try {
                req.destroy();
            }
            catch (e) {
                // ignore
            }
            this.alerts = this.alerts.filter((a: AlertCardData): boolean => a !== alert);
            if (!alert.is_read) {
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
            this.filterAlerts();
            promptAction.showToast({ message: '告警已删除' });
            console.info(TAG, `删除告警成功: alertId=${alert.id}`);
        })
            .catch((e: Error): void => {
            try {
                req.destroy();
            }
            catch (err) {
                // ignore
            }
            console.error(TAG, `删除告警失败: ${getErrorMessage(e)}`);
        });
    }
    clearAll(): void {
        const req: http.HttpRequest = http.createHttp();
        const url: string = '/api/alerts';
        httpService.request(url, { method: http.RequestMethod.DELETE })
            .then((): void => {
            try {
                req.destroy();
            }
            catch (e) {
                // ignore
            }
            this.alerts = [];
            this.filteredAlerts = [];
            this.unreadCount = 0;
            promptAction.showToast({ message: '告警已清空' });
            console.info(TAG, '清空所有告警成功');
        })
            .catch((e: Error): void => {
            try {
                req.destroy();
            }
            catch (err) {
                // ignore
            }
            console.error(TAG, `清空告警失败: ${getErrorMessage(e)}`);
        });
    }
    refreshAlerts(): void {
        console.info(TAG, '刷新告警列表');
        this.selectedTab = 0;
        this.searchKeyword = '';
        this.loadAlerts();
    }
    initialRender(): void {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.debugLine("entry/src/main/ets/pages/Alerts.ets(395:5)", "entry");
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Alerts.ets(396:7)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f5f7fa');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Alerts.ets(397:9)", "entry");
            Column.width('100%');
            Column.padding({ left: 20, right: 16, top: 12, bottom: 12 });
            Column.backgroundColor('#ffffff');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Alerts.ets(398:11)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('告警中心');
            Text.debugLine("entry/src/main/ets/pages/Alerts.ets(399:13)", "entry");
            Text.fontSize(22);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/Alerts.ets(404:13)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Alerts.ets(406:13)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Circle.create();
            Circle.debugLine("entry/src/main/ets/pages/Alerts.ets(407:15)", "entry");
            Circle.width(8);
            Circle.height(8);
            Circle.fill(this.isConnected ? '#52c41a' : '#d9d9d9');
        }, Circle);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.isConnected ? '实时' : '离线');
            Text.debugLine("entry/src/main/ets/pages/Alerts.ets(411:15)", "entry");
            Text.fontSize(12);
            Text.fontColor(this.isConnected ? '#52c41a' : '#999999');
            Text.margin({ left: 4 });
        }, Text);
        Text.pop();
        Row.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.unreadCount > 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Alerts.ets(420:13)", "entry");
                        Row.width('100%');
                        Row.margin({ top: 4 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`有 ${this.unreadCount} 条未读告警`);
                        Text.debugLine("entry/src/main/ets/pages/Alerts.ets(421:15)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#ff4d4f');
                    }, Text);
                    Text.pop();
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
            Search.create({ placeholder: '搜索告警...', value: this.searchKeyword });
            Search.debugLine("entry/src/main/ets/pages/Alerts.ets(429:11)", "entry");
            Search.width('100%');
            Search.height(40);
            Search.backgroundColor('#f0f2f5');
            Search.borderRadius(20);
            Search.margin({ top: 12 });
            Search.onChange((value: string): void => {
                this.searchKeyword = value;
                this.filterAlerts();
            });
        }, Search);
        Search.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 标签栏
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Alerts.ets(445:9)", "entry");
            // 标签栏
            Row.width('100%');
            // 标签栏
            Row.padding({ left: 20, right: 20, top: 12, bottom: 12 });
            // 标签栏
            Row.backgroundColor('#ffffff');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index: number) => {
                const tab = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Column.create();
                    Column.debugLine("entry/src/main/ets/pages/Alerts.ets(447:13)", "entry");
                    Column.layoutWeight(1);
                    Column.onClick((): void => {
                        console.info(TAG, `切换标签: ${tab}, index=${index}`);
                        this.selectedTab = index;
                        this.filterAlerts();
                    });
                }, Column);
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(tab);
                    Text.debugLine("entry/src/main/ets/pages/Alerts.ets(448:15)", "entry");
                    Text.fontSize(14);
                    Text.fontColor(this.selectedTab === index ? '#1890ff' : '#666666');
                    Text.fontWeight(this.selectedTab === index ? FontWeight.Medium : FontWeight.Normal);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    // 下划线指示器
                    if (this.selectedTab === index) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.debugLine("entry/src/main/ets/pages/Alerts.ets(455:17)", "entry");
                                Divider.width(40);
                                Divider.strokeWidth(2);
                                Divider.color('#1890ff');
                                Divider.margin({ top: 4 });
                            }, Divider);
                        });
                    }
                    else {
                        this.ifElseBranchUpdateFunction(1, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Divider.create();
                                Divider.debugLine("entry/src/main/ets/pages/Alerts.ets(461:17)", "entry");
                                Divider.width(40);
                                Divider.strokeWidth(0);
                                Divider.margin({ top: 6 });
                            }, Divider);
                        });
                    }
                }, If);
                If.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    If.create();
                    // 显示数量
                    if (index === 1 && this.unreadCount > 0) {
                        this.ifElseBranchUpdateFunction(0, () => {
                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                Text.create(`${this.unreadCount}`);
                                Text.debugLine("entry/src/main/ets/pages/Alerts.ets(469:17)", "entry");
                                Text.fontSize(10);
                                Text.fontColor('#ffffff');
                                Text.backgroundColor('#ff4d4f');
                                Text.borderRadius(10);
                                Text.padding({ left: 4, right: 4, top: 2, bottom: 2 });
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
                Column.pop();
            };
            this.forEachUpdateFunction(elmtId, ['全部', '未读', '已读'], forEachItemGenFunction, (tab: string, index: number): string => `${index}_${tab}`, true, true);
        }, ForEach);
        ForEach.pop();
        // 标签栏
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Alerts.ets(491:11)", "entry");
                        Column.width('100%');
                        Column.layoutWeight(1);
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/Alerts.ets(492:13)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.color('#1890ff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('加载中...');
                        Text.debugLine("entry/src/main/ets/pages/Alerts.ets(496:13)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#999999');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else if (this.filteredAlerts.length === 0) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/Alerts.ets(505:11)", "entry");
                        Column.width('100%');
                        Column.layoutWeight(1);
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('🔔');
                        Text.debugLine("entry/src/main/ets/pages/Alerts.ets(506:13)", "entry");
                        Text.fontSize(48);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.getEmptyMessage());
                        Text.debugLine("entry/src/main/ets/pages/Alerts.ets(508:13)", "entry");
                        Text.fontSize(16);
                        Text.fontColor('#666666');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.getEmptySubMessage());
                        Text.debugLine("entry/src/main/ets/pages/Alerts.ets(512:13)", "entry");
                        Text.fontSize(12);
                        Text.fontColor(this.selectedTab === 1 ? '#faad14' : '#52c41a');
                        Text.margin({ top: 8 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.selectedTab !== 0 || this.searchKeyword) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithLabel('查看全部');
                                    Button.debugLine("entry/src/main/ets/pages/Alerts.ets(517:15)", "entry");
                                    Button.fontSize(12);
                                    Button.height(32);
                                    Button.backgroundColor('#e6f7ff');
                                    Button.fontColor('#1890ff');
                                    Button.borderRadius(16);
                                    Button.margin({ top: 16 });
                                    Button.onClick((): void => {
                                        this.selectedTab = 0;
                                        this.searchKeyword = '';
                                        this.filterAlerts();
                                    });
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
                        Column.debugLine("entry/src/main/ets/pages/Alerts.ets(535:11)", "entry");
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 操作按钮栏
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/Alerts.ets(537:13)", "entry");
                        // 操作按钮栏
                        Row.width('100%');
                        // 操作按钮栏
                        Row.padding({ left: 16, right: 16, bottom: 12 });
                        // 操作按钮栏
                        Row.justifyContent(FlexAlign.Start);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('刷新');
                        Button.debugLine("entry/src/main/ets/pages/Alerts.ets(538:15)", "entry");
                        Button.fontSize(12);
                        Button.height(32);
                        Button.backgroundColor('#f5f5f5');
                        Button.fontColor('#666666');
                        Button.borderRadius(16);
                        Button.onClick((): void => this.refreshAlerts());
                    }, Button);
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.unreadCount > 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithLabel('全部已读');
                                    Button.debugLine("entry/src/main/ets/pages/Alerts.ets(547:17)", "entry");
                                    Button.fontSize(12);
                                    Button.height(32);
                                    Button.backgroundColor('#e6f7ff');
                                    Button.fontColor('#1890ff');
                                    Button.borderRadius(16);
                                    Button.margin({ left: 12 });
                                    Button.onClick((): void => this.markAllAsRead());
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
                        If.create();
                        if (this.alerts.length > 0) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithLabel('清空');
                                    Button.debugLine("entry/src/main/ets/pages/Alerts.ets(558:17)", "entry");
                                    Button.fontSize(12);
                                    Button.height(32);
                                    Button.backgroundColor('#fff2e8');
                                    Button.fontColor('#fa541c');
                                    Button.borderRadius(16);
                                    Button.margin({ left: 12 });
                                    Button.onClick((): void => this.clearAll());
                                }, Button);
                                Button.pop();
                            });
                        }
                        // 显示当前筛选结果数量
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                            });
                        }
                    }, If);
                    If.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 显示当前筛选结果数量
                        Text.create(`共${this.filteredAlerts.length}条`);
                        Text.debugLine("entry/src/main/ets/pages/Alerts.ets(569:15)", "entry");
                        // 显示当前筛选结果数量
                        Text.fontSize(12);
                        // 显示当前筛选结果数量
                        Text.fontColor('#999999');
                        // 显示当前筛选结果数量
                        Text.margin({ left: 12 });
                    }, Text);
                    // 显示当前筛选结果数量
                    Text.pop();
                    // 操作按钮栏
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 告警列表
                        List.create();
                        List.debugLine("entry/src/main/ets/pages/Alerts.ets(579:13)", "entry");
                        // 告警列表
                        List.width('100%');
                        // 告警列表
                        List.layoutWeight(1);
                        // 告警列表
                        List.padding({ left: 16, right: 16 });
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
                                    ListItem.debugLine("entry/src/main/ets/pages/Alerts.ets(581:17)", "entry");
                                };
                                const deepRenderFunction = (elmtId, isInitialRender) => {
                                    itemCreation(elmtId, isInitialRender);
                                    this.AlertCard.bind(this)(alert);
                                    ListItem.pop();
                                };
                                this.observeComponentCreation2(itemCreation2, ListItem);
                                ListItem.pop();
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.filteredAlerts, forEachItemGenFunction, (alert: AlertCardData): string => `alert_${alert.id}`, false, false);
                    }, ForEach);
                    ForEach.pop();
                    // 告警列表
                    List.pop();
                    Column.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 返回按钮
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Alerts.ets(597:7)", "entry");
            // 返回按钮
            Column.width('100%');
            // 返回按钮
            Column.height('100%');
            // 返回按钮
            Column.alignItems(HorizontalAlign.Start);
            // 返回按钮
            Column.padding({ left: 16, top: 16 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('返回');
            Button.debugLine("entry/src/main/ets/pages/Alerts.ets(598:9)", "entry");
            Button.width(60);
            Button.height(36);
            Button.fontSize(14);
            Button.backgroundColor('rgba(0, 0, 0, 0.5)');
            Button.borderRadius(18);
            Button.onClick((): void => router.back());
        }, Button);
        Button.pop();
        // 返回按钮
        Column.pop();
        Stack.pop();
    }
    // 获取空状态提示消息
    getEmptyMessage(): string {
        if (this.selectedTab === 1) {
            return '暂无未读告警';
        }
        else if (this.selectedTab === 2) {
            return '暂无已读告警';
        }
        else if (this.searchKeyword) {
            return '未找到相关告警';
        }
        return '暂无告警';
    }
    // 获取空状态提示子消息
    getEmptySubMessage(): string {
        if (this.selectedTab === 1) {
            return '所有告警都已读';
        }
        else if (this.selectedTab === 2) {
            return '还没有已读的告警';
        }
        else if (this.searchKeyword) {
            return '试试其他关键词';
        }
        return '设备运行正常';
    }
    AlertCard(alert: AlertCardData, parent = null): void {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Alerts.ets(641:5)", "entry");
            Column.width('100%');
            Column.padding(16);
            Column.backgroundColor(alert.is_read ? '#fafafa' : '#ffffff');
            Column.borderRadius(16);
            Column.margin({ bottom: 12 });
            Column.border({
                width: 1,
                color: alert.is_read ? '#f0f0f0' : getAlertColor(alert.alert_level) + '30'
            });
            Column.onClick((): void => {
                if (!alert.is_read) {
                    this.markAsRead(alert);
                }
            });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 主内容区
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Alerts.ets(643:7)", "entry");
            // 主内容区
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 图标区域
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Alerts.ets(645:9)", "entry");
            // 图标区域
            Column.width(48);
            // 图标区域
            Column.height(48);
            // 图标区域
            Column.backgroundColor(getAlertColor(alert.alert_level) + '15');
            // 图标区域
            Column.borderRadius(12);
            // 图标区域
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(getAlertIcon(alert.alert_type));
            Text.debugLine("entry/src/main/ets/pages/Alerts.ets(646:11)", "entry");
            Text.fontSize(24);
        }, Text);
        Text.pop();
        // 图标区域
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 文字信息区域
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Alerts.ets(656:9)", "entry");
            // 文字信息区域
            Column.alignItems(HorizontalAlign.Start);
            // 文字信息区域
            Column.layoutWeight(1);
            // 文字信息区域
            Column.margin({ left: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Alerts.ets(657:11)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(getAlertTypeName(alert.alert_type));
            Text.debugLine("entry/src/main/ets/pages/Alerts.ets(658:13)", "entry");
            Text.fontSize(14);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (!alert.is_read) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Circle.create();
                        Circle.debugLine("entry/src/main/ets/pages/Alerts.ets(664:15)", "entry");
                        Circle.width(8);
                        Circle.height(8);
                        Circle.fill('#ff4d4f');
                        Circle.margin({ left: 8 });
                    }, Circle);
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
            Text.create(alert.message);
            Text.debugLine("entry/src/main/ets/pages/Alerts.ets(672:11)", "entry");
            Text.fontSize(13);
            Text.fontColor('#666666');
            Text.margin({ top: 4 });
            Text.maxLines(2);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (alert.device_name) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(alert.device_name);
                        Text.debugLine("entry/src/main/ets/pages/Alerts.ets(680:13)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#999999');
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
        // 文字信息区域
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 时间区域
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/Alerts.ets(691:9)", "entry");
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.formatTime(alert.created_at || ''));
            Text.debugLine("entry/src/main/ets/pages/Alerts.ets(692:11)", "entry");
            Text.fontSize(11);
            Text.fontColor('#bfbfbf');
        }, Text);
        Text.pop();
        // 时间区域
        Column.pop();
        // 主内容区
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 操作按钮区
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/Alerts.ets(700:7)", "entry");
            // 操作按钮区
            Row.width('100%');
            // 操作按钮区
            Row.justifyContent(FlexAlign.End);
            // 操作按钮区
            Row.margin({ top: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (alert.device_id) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('设备详情');
                        Button.debugLine("entry/src/main/ets/pages/Alerts.ets(702:11)", "entry");
                        Button.fontSize(11);
                        Button.height(28);
                        Button.backgroundColor('#f0f2f5');
                        Button.fontColor('#666666');
                        Button.borderRadius(14);
                        Button.onClick((): void => {
                            router.pushUrl({ url: 'pages/DeviceDetail', params: { deviceId: alert.device_id } });
                        });
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
            If.create();
            if (!alert.is_read) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('标记已读');
                        Button.debugLine("entry/src/main/ets/pages/Alerts.ets(714:11)", "entry");
                        Button.fontSize(11);
                        Button.height(28);
                        Button.backgroundColor('#e6f7ff');
                        Button.fontColor('#1890ff');
                        Button.borderRadius(14);
                        Button.margin({ left: 8 });
                        Button.onClick((): void => this.markAsRead(alert));
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
            Button.createWithLabel('删除');
            Button.debugLine("entry/src/main/ets/pages/Alerts.ets(724:9)", "entry");
            Button.fontSize(11);
            Button.height(28);
            Button.backgroundColor('#fff2f0');
            Button.fontColor('#ff4d4f');
            Button.borderRadius(14);
            Button.margin({ left: 8 });
            Button.onClick((): void => this.deleteAlert(alert));
        }, Button);
        Button.pop();
        // 操作按钮区
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "Alerts";
    }
}
registerNamedRoute(() => new Alerts(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/Alerts", pageFullPath: "entry/src/main/ets/pages/Alerts", integratedHsp: "false", moduleType: "followWithHap" });
