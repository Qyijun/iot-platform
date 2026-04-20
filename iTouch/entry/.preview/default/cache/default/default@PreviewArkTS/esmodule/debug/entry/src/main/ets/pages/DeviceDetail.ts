if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface DeviceDetail_Params {
    deviceId?: string;
    refreshTimer?: number;
    device?: Device | null;
    deviceData?: DeviceData | null;
    isLoading?: boolean;
    isSending?: boolean;
    isEditing?: boolean;
    editName?: string;
    editLocation?: string;
    lastUpdateTime?: string;
    showDeleteDialog?: boolean;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import { deviceViewModel } from "@normalized:N&&&entry/src/main/ets/viewmodels/DeviceViewModel&";
import type { Device, DeviceData } from '../models/Device';
class DeviceDetail extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__deviceId = new ObservedPropertySimplePU('', this, "deviceId");
        this.refreshTimer = -1;
        this.__device = new ObservedPropertyObjectPU(null, this, "device");
        this.__deviceData = new ObservedPropertyObjectPU(null, this, "deviceData");
        this.__isLoading = new ObservedPropertySimplePU(false, this, "isLoading");
        this.__isSending = new ObservedPropertySimplePU(false, this, "isSending");
        this.__isEditing = new ObservedPropertySimplePU(false, this, "isEditing");
        this.__editName = new ObservedPropertySimplePU('', this, "editName");
        this.__editLocation = new ObservedPropertySimplePU('', this, "editLocation");
        this.__lastUpdateTime = new ObservedPropertySimplePU('', this, "lastUpdateTime");
        this.__showDeleteDialog = new ObservedPropertySimplePU(false, this, "showDeleteDialog");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: DeviceDetail_Params) {
        if (params.deviceId !== undefined) {
            this.deviceId = params.deviceId;
        }
        if (params.refreshTimer !== undefined) {
            this.refreshTimer = params.refreshTimer;
        }
        if (params.device !== undefined) {
            this.device = params.device;
        }
        if (params.deviceData !== undefined) {
            this.deviceData = params.deviceData;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.isSending !== undefined) {
            this.isSending = params.isSending;
        }
        if (params.isEditing !== undefined) {
            this.isEditing = params.isEditing;
        }
        if (params.editName !== undefined) {
            this.editName = params.editName;
        }
        if (params.editLocation !== undefined) {
            this.editLocation = params.editLocation;
        }
        if (params.lastUpdateTime !== undefined) {
            this.lastUpdateTime = params.lastUpdateTime;
        }
        if (params.showDeleteDialog !== undefined) {
            this.showDeleteDialog = params.showDeleteDialog;
        }
    }
    updateStateVars(params: DeviceDetail_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__deviceId.purgeDependencyOnElmtId(rmElmtId);
        this.__device.purgeDependencyOnElmtId(rmElmtId);
        this.__deviceData.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__isSending.purgeDependencyOnElmtId(rmElmtId);
        this.__isEditing.purgeDependencyOnElmtId(rmElmtId);
        this.__editName.purgeDependencyOnElmtId(rmElmtId);
        this.__editLocation.purgeDependencyOnElmtId(rmElmtId);
        this.__lastUpdateTime.purgeDependencyOnElmtId(rmElmtId);
        this.__showDeleteDialog.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__deviceId.aboutToBeDeleted();
        this.__device.aboutToBeDeleted();
        this.__deviceData.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__isSending.aboutToBeDeleted();
        this.__isEditing.aboutToBeDeleted();
        this.__editName.aboutToBeDeleted();
        this.__editLocation.aboutToBeDeleted();
        this.__lastUpdateTime.aboutToBeDeleted();
        this.__showDeleteDialog.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __deviceId: ObservedPropertySimplePU<string>;
    get deviceId() {
        return this.__deviceId.get();
    }
    set deviceId(newValue: string) {
        this.__deviceId.set(newValue);
    }
    private refreshTimer: number; // 改为 private 非 @State
    private __device: ObservedPropertyObjectPU<Device | null>;
    get device() {
        return this.__device.get();
    }
    set device(newValue: Device | null) {
        this.__device.set(newValue);
    }
    private __deviceData: ObservedPropertyObjectPU<DeviceData | null>;
    get deviceData() {
        return this.__deviceData.get();
    }
    set deviceData(newValue: DeviceData | null) {
        this.__deviceData.set(newValue);
    }
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private __isSending: ObservedPropertySimplePU<boolean>;
    get isSending() {
        return this.__isSending.get();
    }
    set isSending(newValue: boolean) {
        this.__isSending.set(newValue);
    }
    private __isEditing: ObservedPropertySimplePU<boolean>;
    get isEditing() {
        return this.__isEditing.get();
    }
    set isEditing(newValue: boolean) {
        this.__isEditing.set(newValue);
    }
    private __editName: ObservedPropertySimplePU<string>;
    get editName() {
        return this.__editName.get();
    }
    set editName(newValue: string) {
        this.__editName.set(newValue);
    }
    private __editLocation: ObservedPropertySimplePU<string>;
    get editLocation() {
        return this.__editLocation.get();
    }
    set editLocation(newValue: string) {
        this.__editLocation.set(newValue);
    }
    private __lastUpdateTime: ObservedPropertySimplePU<string>;
    get lastUpdateTime() {
        return this.__lastUpdateTime.get();
    }
    set lastUpdateTime(newValue: string) {
        this.__lastUpdateTime.set(newValue);
    }
    private __showDeleteDialog: ObservedPropertySimplePU<boolean>; // 添加删除确认对话框状态
    get showDeleteDialog() {
        return this.__showDeleteDialog.get();
    }
    set showDeleteDialog(newValue: boolean) {
        this.__showDeleteDialog.set(newValue);
    }
    aboutToAppear() {
        const params = router.getParams() as Record<string, string>;
        const id = params?.deviceId || '';
        if (id) {
            this.deviceId = id;
            this.loadData();
            // 启动定时刷新（每5秒刷新一次）
            if (this.refreshTimer !== -1) {
                clearInterval(this.refreshTimer);
            }
            this.refreshTimer = setInterval(() => {
                this.loadData(true);
            }, 5000);
        }
    }
    aboutToDisappear() {
        // 停止定时刷新
        if (this.refreshTimer !== -1) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = -1;
        }
    }
    // 判断设备是否在线
    isDeviceOnline(device: Device | null): boolean {
        if (!device)
            return false;
        return device.status === 'online' || device.online === true || device.connected === true;
    }
    async loadData(silent: boolean = false) {
        if (!silent) {
            this.isLoading = true;
        }
        // 从API获取设备详情（包含最新数据）
        this.device = await deviceViewModel.loadDevice(this.deviceId);
        // 优先使用设备详情中的最新数据
        if (this.device?.data) {
            this.deviceData = this.device.data;
        }
        else {
            // 如果没有，尝试从历史数据获取
            this.deviceData = await deviceViewModel.loadDeviceData(this.deviceId);
        }
        // 更新时间戳
        const now = new Date();
        this.lastUpdateTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        if (!silent) {
            this.isLoading = false;
        }
    }
    async sendCommand(cmd: string) {
        this.isSending = true;
        await deviceViewModel.sendCommand(this.deviceId, cmd);
        this.isSending = false;
        setTimeout(() => {
            this.loadData();
        }, 1000);
    }
    // 显示删除确认对话框
    showDeleteConfirm() {
        this.showDeleteDialog = true;
    }
    // 执行删除设备
    async deleteDevice() {
        const success = await deviceViewModel.deleteDevice(this.deviceId);
        if (success) {
            promptAction.showToast({ message: '设备已删除' });
            router.back();
        }
        else {
            promptAction.showToast({ message: '删除失败' });
        }
        this.showDeleteDialog = false;
    }
    async updateDevice() {
        this.isEditing = false;
        const success = await deviceViewModel.updateDevice(this.deviceId, {
            name: this.editName,
            location: this.editLocation
        });
        if (success) {
            promptAction.showToast({ message: '设备信息已更新' });
            this.loadData();
        }
    }
    startEditing() {
        this.editName = this.device?.name || '';
        this.editLocation = this.device?.location || '';
        this.isEditing = true;
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(117:5)", "entry");
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(118:7)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f0f2f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 顶部导航
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(120:9)", "entry");
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
            // 返回按钮
            Text.create('<');
            Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(122:11)", "entry");
            // 返回按钮
            Text.fontSize(28);
            // 返回按钮
            Text.fontColor('#333333');
            // 返回按钮
            Text.onClick(() => router.back());
        }, Text);
        // 返回按钮
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.device?.name || '设备详情');
            Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(127:11)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.margin({ left: 16 });
            Text.layoutWeight(1);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 刷新按钮
            Text.create('↻');
            Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(134:11)", "entry");
            // 刷新按钮
            Text.fontSize(22);
            // 刷新按钮
            Text.fontColor('#666666');
            // 刷新按钮
            Text.onClick(() => this.loadData());
        }, Text);
        // 刷新按钮
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 编辑按钮
            Text.create('编辑');
            Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(140:11)", "entry");
            // 编辑按钮
            Text.fontSize(20);
            // 编辑按钮
            Text.fontColor('#666666');
            // 编辑按钮
            Text.margin({ left: 16 });
            // 编辑按钮
            Text.onClick(() => this.startEditing());
        }, Text);
        // 编辑按钮
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isDeviceOnline(ObservedObject.GetRawObject(this.device))) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('在线');
                        Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(147:13)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#52c41a');
                        Text.margin({ left: 16 });
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('离线');
                        Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(152:13)", "entry");
                        Text.fontSize(12);
                        Text.fontColor('#ff4d4f');
                        Text.margin({ left: 16 });
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        // 顶部导航
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 编辑弹窗
            if (this.isEditing) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(165:11)", "entry");
                        Column.width('100%');
                        Column.padding(20);
                        Column.backgroundColor('#ffffff');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('编辑设备');
                        Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(166:13)", "entry");
                        Text.fontSize(16);
                        Text.fontWeight(FontWeight.Medium);
                        Text.margin({ bottom: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        TextInput.create({ placeholder: '设备名称', text: this.editName });
                        TextInput.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(171:13)", "entry");
                        TextInput.width('100%');
                        TextInput.height(44);
                        TextInput.backgroundColor('#f5f5f5');
                        TextInput.borderRadius(8);
                        TextInput.onChange((value: string) => {
                            this.editName = value;
                        });
                    }, TextInput);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        TextInput.create({ placeholder: '安装位置', text: this.editLocation });
                        TextInput.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(180:13)", "entry");
                        TextInput.width('100%');
                        TextInput.height(44);
                        TextInput.margin({ top: 12 });
                        TextInput.backgroundColor('#f5f5f5');
                        TextInput.borderRadius(8);
                        TextInput.onChange((value: string) => {
                            this.editLocation = value;
                        });
                    }, TextInput);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(190:13)", "entry");
                        Row.margin({ top: 20 });
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('取消');
                        Button.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(191:15)", "entry");
                        Button.width('45%');
                        Button.height(40);
                        Button.backgroundColor('#f5f5f5');
                        Button.fontColor('#666666');
                        Button.onClick(() => this.isEditing = false);
                    }, Button);
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('保存');
                        Button.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(198:15)", "entry");
                        Button.width('45%');
                        Button.height(40);
                        Button.backgroundColor('#1890ff');
                        Button.onClick(() => this.updateDevice());
                    }, Button);
                    Button.pop();
                    Row.pop();
                    Column.pop();
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
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(213:11)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.layoutWeight(1);
                    }, LoadingProgress);
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Scroll.create();
                        Scroll.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(218:11)", "entry");
                        Scroll.layoutWeight(1);
                    }, Scroll);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(219:13)", "entry");
                        Column.padding(16);
                    }, Column);
                    // 实时数据卡片
                    this.DataCard.bind(this)();
                    // 控制按钮
                    this.ControlPanel.bind(this)();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // ========== 红色删除按钮 ==========
                        Button.createWithLabel('删除设备');
                        Button.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(227:15)", "entry");
                        // ========== 红色删除按钮 ==========
                        Button.width('100%');
                        // ========== 红色删除按钮 ==========
                        Button.height(48);
                        // ========== 红色删除按钮 ==========
                        Button.fontSize(16);
                        // ========== 红色删除按钮 ==========
                        Button.fontWeight(FontWeight.Medium);
                        // ========== 红色删除按钮 ==========
                        Button.fontColor('#ffffff');
                        // ========== 红色删除按钮 ==========
                        Button.backgroundColor('#ff4d4f');
                        // ========== 红色删除按钮 ==========
                        Button.borderRadius(12);
                        // ========== 红色删除按钮 ==========
                        Button.margin({ top: 24, bottom: 32 });
                        // ========== 红色删除按钮 ==========
                        Button.onClick(() => {
                            this.showDeleteConfirm();
                        });
                    }, Button);
                    // ========== 红色删除按钮 ==========
                    Button.pop();
                    Column.pop();
                    Scroll.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 删除确认对话框
            if (this.showDeleteDialog && this.device) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(251:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.backgroundColor('rgba(0,0,0,0.5)');
                        Column.justifyContent(FlexAlign.Center);
                        Column.onClick(() => {
                            this.showDeleteDialog = false;
                        });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(252:11)", "entry");
                        Column.width('80%');
                        Column.padding(20);
                        Column.backgroundColor('#ffffff');
                        Column.borderRadius(16);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('删除设备');
                        Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(253:13)", "entry");
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor('#333333');
                        Text.margin({ bottom: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(`确定要删除设备"${this.device.name}"吗？`);
                        Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(259:13)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#666666');
                        Text.margin({ bottom: 24 });
                        Text.textAlign(TextAlign.Center);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Divider.create();
                        Divider.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(265:13)", "entry");
                        Divider.color('#f0f0f0');
                    }, Divider);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(268:13)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('取消');
                        Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(269:15)", "entry");
                        Text.fontSize(16);
                        Text.fontColor('#666666');
                        Text.layoutWeight(1);
                        Text.textAlign(TextAlign.Center);
                        Text.padding({ top: 12, bottom: 12 });
                        Text.onClick(() => {
                            this.showDeleteDialog = false;
                        });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('删除');
                        Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(279:15)", "entry");
                        Text.fontSize(16);
                        Text.fontColor('#ff4d4f');
                        Text.layoutWeight(1);
                        Text.textAlign(TextAlign.Center);
                        Text.padding({ top: 12, bottom: 12 });
                        Text.onClick(() => {
                            this.deleteDevice();
                        });
                    }, Text);
                    Text.pop();
                    Row.pop();
                    Column.pop();
                    Column.pop();
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
    DataCard(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(309:5)", "entry");
            Column.width('100%');
            Column.padding(20);
            Column.backgroundColor('#ffffff');
            Column.borderRadius(12);
            Column.margin({ bottom: 16 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(310:7)", "entry");
            Row.margin({ bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('实时数据');
            Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(311:9)", "entry");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(314:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.lastUpdateTime) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('更新: ' + this.lastUpdateTime);
                        Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(316:11)", "entry");
                        Text.fontSize(11);
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
            Grid.create();
            Grid.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(323:7)", "entry");
            Grid.columnsTemplate('1fr 1fr');
            Grid.rowsTemplate('1fr 1fr');
            Grid.width('100%');
            Grid.height(160);
            Grid.columnsGap(12);
            Grid.rowsGap(12);
        }, Grid);
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
                GridItem.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(324:9)", "entry");
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.DataItem.bind(this)('温度', this.deviceData?.temperature?.toString() || '--', '°C', '#ff6b6b');
                GridItem.pop();
            };
            observedDeepRender();
        }
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
                GridItem.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(327:9)", "entry");
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.DataItem.bind(this)('湿度', this.deviceData?.humidity?.toString() || '--', '%', '#4ecdc4');
                GridItem.pop();
            };
            observedDeepRender();
        }
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
                GridItem.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(330:9)", "entry");
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.DataItem.bind(this)('LED', this.deviceData?.led ? '开' : '关', '', this.deviceData?.led ? '#52c41a' : '#d9d9d9');
                GridItem.pop();
            };
            observedDeepRender();
        }
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
                GridItem.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(333:9)", "entry");
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.DataItem.bind(this)('继电器', this.deviceData?.relay ? '开' : '关', '', this.deviceData?.relay ? '#52c41a' : '#d9d9d9');
                GridItem.pop();
            };
            observedDeepRender();
        }
        Grid.pop();
        Column.pop();
    }
    DataItem(label: string, value: string, unit: string, color: string, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(353:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(label === 'LED' || label === '继电器' ? (this.deviceData?.led ? '#f6ffed' : '#fafafa') : '#f9f9f9');
            Column.borderRadius(8);
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(value + unit);
            Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(354:7)", "entry");
            Text.fontSize(24);
            Text.fontWeight(FontWeight.Bold);
            Text.fontColor(color);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(label);
            Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(358:7)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
    }
    ControlPanel(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(372:5)", "entry");
            Column.width('100%');
            Column.padding(20);
            Column.backgroundColor('#ffffff');
            Column.borderRadius(12);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(373:7)", "entry");
            Row.margin({ bottom: 16 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('设备控制');
            Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(374:9)", "entry");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(377:9)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('点击开关进行控制');
            Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(378:9)", "entry");
            Text.fontSize(11);
            Text.fontColor('#bfbfbf');
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Grid.create();
            Grid.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(384:7)", "entry");
            Grid.columnsTemplate('1fr 1fr');
            Grid.rowsTemplate('1fr 1fr');
            Grid.width('100%');
            Grid.height(160);
            Grid.columnsGap(12);
            Grid.rowsGap(12);
        }, Grid);
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
                GridItem.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(385:9)", "entry");
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.ControlButton.bind(this)('开关1', 'switch1', this.deviceData?.switch1 || false);
                GridItem.pop();
            };
            observedDeepRender();
        }
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
                GridItem.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(388:9)", "entry");
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.ControlButton.bind(this)('开关2', 'switch2', this.deviceData?.switch2 || false);
                GridItem.pop();
            };
            observedDeepRender();
        }
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
                GridItem.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(391:9)", "entry");
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.ControlButton.bind(this)('LED', 'led', this.deviceData?.led || false);
                GridItem.pop();
            };
            observedDeepRender();
        }
        {
            const itemCreation2 = (elmtId, isInitialRender) => {
                GridItem.create(() => { }, false);
                GridItem.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(394:9)", "entry");
            };
            const observedDeepRender = () => {
                this.observeComponentCreation2(itemCreation2, GridItem);
                this.ControlButton.bind(this)('继电器', 'relay', this.deviceData?.relay || false);
                GridItem.pop();
            };
            observedDeepRender();
        }
        Grid.pop();
        Column.pop();
    }
    ControlButton(name: string, cmd: string, isOn: boolean, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(415:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor(isOn ? '#e6f7ff' : '#fafafa');
            Column.borderRadius(8);
            Column.justifyContent(FlexAlign.Center);
            Column.enabled(!this.isSending);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(name);
            Text.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(416:7)", "entry");
            Text.fontSize(14);
            Text.fontColor(isOn ? '#1890ff' : '#666666');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Toggle.create({ type: ToggleType.Switch, isOn: isOn });
            Toggle.debugLine("entry/src/main/ets/pages/DeviceDetail.ets(420:7)", "entry");
            Toggle.selectedColor('#1890ff');
            Toggle.margin({ top: 8 });
            Toggle.onChange((value: boolean) => {
                this.sendCommand(cmd + (value ? '_on' : '_off'));
            });
        }, Toggle);
        Toggle.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "DeviceDetail";
    }
}
registerNamedRoute(() => new DeviceDetail(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/DeviceDetail", pageFullPath: "entry/src/main/ets/pages/DeviceDetail", integratedHsp: "false", moduleType: "followWithHap" });
