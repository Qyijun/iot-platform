if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface VideoMonitor_Params {
    cameras?: Camera[];
    isLoading?: boolean;
    errorMessage?: string;
    refreshing?: boolean;
    showAddDialog?: boolean;
    showEditDialog?: boolean;
    showDeleteDialog?: boolean;
    selectedCamera?: Camera | null;
    searchText?: string;
    formName?: string;
    formIp?: string;
    formPort?: string;
    formUsername?: string;
    formPassword?: string;
    formLocation?: string;
    showScanDialog?: boolean;
    isScanning?: boolean;
    scanStatus?: string;
    discoveredDevices?: DiscoveredCamera[];
    onAddConfirm?: DialogCallback;
    onEditConfirm?: DialogCallback;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import { videoService } from "@normalized:N&&&entry/src/main/ets/services/VideoService&";
class Camera {
    id: string = '';
    name: string = '';
    ip: string = '';
    location: string = '';
    port: number = 554;
    username: string = 'admin';
    password: string = '';
    rtspPath: string = '/Streaming/Channels/101';
    status: string = 'offline';
}
class DiscoveredCamera {
    ip: string = '';
    port: number = 80;
    name: string = '';
    manufacturer: string = 'ONVIF';
    type: string = 'Camera';
}
class CameraUpdate {
    name: string = '';
    ip: string = '';
    port: number = 554;
    username: string = 'admin';
    password: string = '';
    location: string = '';
}
type DialogCallback = () => void;
class VideoMonitor extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__cameras = new ObservedPropertyObjectPU([], this, "cameras");
        this.__isLoading = new ObservedPropertySimplePU(true, this, "isLoading");
        this.__errorMessage = new ObservedPropertySimplePU('', this, "errorMessage");
        this.__refreshing = new ObservedPropertySimplePU(false, this, "refreshing");
        this.__showAddDialog = new ObservedPropertySimplePU(false, this, "showAddDialog");
        this.__showEditDialog = new ObservedPropertySimplePU(false, this, "showEditDialog");
        this.__showDeleteDialog = new ObservedPropertySimplePU(false, this, "showDeleteDialog");
        this.__selectedCamera = new ObservedPropertyObjectPU(null, this, "selectedCamera");
        this.__searchText = new ObservedPropertySimplePU('', this, "searchText");
        this.__formName = new ObservedPropertySimplePU('', this, "formName");
        this.__formIp = new ObservedPropertySimplePU('', this, "formIp");
        this.__formPort = new ObservedPropertySimplePU('554', this, "formPort");
        this.__formUsername = new ObservedPropertySimplePU('admin', this, "formUsername");
        this.__formPassword = new ObservedPropertySimplePU('', this, "formPassword");
        this.__formLocation = new ObservedPropertySimplePU('', this, "formLocation");
        this.__showScanDialog = new ObservedPropertySimplePU(false, this, "showScanDialog");
        this.__isScanning = new ObservedPropertySimplePU(false, this, "isScanning");
        this.__scanStatus = new ObservedPropertySimplePU('', this, "scanStatus");
        this.__discoveredDevices = new ObservedPropertyObjectPU([], this, "discoveredDevices");
        this.onAddConfirm = () => { };
        this.onEditConfirm = () => { };
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: VideoMonitor_Params) {
        if (params.cameras !== undefined) {
            this.cameras = params.cameras;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.errorMessage !== undefined) {
            this.errorMessage = params.errorMessage;
        }
        if (params.refreshing !== undefined) {
            this.refreshing = params.refreshing;
        }
        if (params.showAddDialog !== undefined) {
            this.showAddDialog = params.showAddDialog;
        }
        if (params.showEditDialog !== undefined) {
            this.showEditDialog = params.showEditDialog;
        }
        if (params.showDeleteDialog !== undefined) {
            this.showDeleteDialog = params.showDeleteDialog;
        }
        if (params.selectedCamera !== undefined) {
            this.selectedCamera = params.selectedCamera;
        }
        if (params.searchText !== undefined) {
            this.searchText = params.searchText;
        }
        if (params.formName !== undefined) {
            this.formName = params.formName;
        }
        if (params.formIp !== undefined) {
            this.formIp = params.formIp;
        }
        if (params.formPort !== undefined) {
            this.formPort = params.formPort;
        }
        if (params.formUsername !== undefined) {
            this.formUsername = params.formUsername;
        }
        if (params.formPassword !== undefined) {
            this.formPassword = params.formPassword;
        }
        if (params.formLocation !== undefined) {
            this.formLocation = params.formLocation;
        }
        if (params.showScanDialog !== undefined) {
            this.showScanDialog = params.showScanDialog;
        }
        if (params.isScanning !== undefined) {
            this.isScanning = params.isScanning;
        }
        if (params.scanStatus !== undefined) {
            this.scanStatus = params.scanStatus;
        }
        if (params.discoveredDevices !== undefined) {
            this.discoveredDevices = params.discoveredDevices;
        }
        if (params.onAddConfirm !== undefined) {
            this.onAddConfirm = params.onAddConfirm;
        }
        if (params.onEditConfirm !== undefined) {
            this.onEditConfirm = params.onEditConfirm;
        }
    }
    updateStateVars(params: VideoMonitor_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__cameras.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__errorMessage.purgeDependencyOnElmtId(rmElmtId);
        this.__refreshing.purgeDependencyOnElmtId(rmElmtId);
        this.__showAddDialog.purgeDependencyOnElmtId(rmElmtId);
        this.__showEditDialog.purgeDependencyOnElmtId(rmElmtId);
        this.__showDeleteDialog.purgeDependencyOnElmtId(rmElmtId);
        this.__selectedCamera.purgeDependencyOnElmtId(rmElmtId);
        this.__searchText.purgeDependencyOnElmtId(rmElmtId);
        this.__formName.purgeDependencyOnElmtId(rmElmtId);
        this.__formIp.purgeDependencyOnElmtId(rmElmtId);
        this.__formPort.purgeDependencyOnElmtId(rmElmtId);
        this.__formUsername.purgeDependencyOnElmtId(rmElmtId);
        this.__formPassword.purgeDependencyOnElmtId(rmElmtId);
        this.__formLocation.purgeDependencyOnElmtId(rmElmtId);
        this.__showScanDialog.purgeDependencyOnElmtId(rmElmtId);
        this.__isScanning.purgeDependencyOnElmtId(rmElmtId);
        this.__scanStatus.purgeDependencyOnElmtId(rmElmtId);
        this.__discoveredDevices.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__cameras.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__errorMessage.aboutToBeDeleted();
        this.__refreshing.aboutToBeDeleted();
        this.__showAddDialog.aboutToBeDeleted();
        this.__showEditDialog.aboutToBeDeleted();
        this.__showDeleteDialog.aboutToBeDeleted();
        this.__selectedCamera.aboutToBeDeleted();
        this.__searchText.aboutToBeDeleted();
        this.__formName.aboutToBeDeleted();
        this.__formIp.aboutToBeDeleted();
        this.__formPort.aboutToBeDeleted();
        this.__formUsername.aboutToBeDeleted();
        this.__formPassword.aboutToBeDeleted();
        this.__formLocation.aboutToBeDeleted();
        this.__showScanDialog.aboutToBeDeleted();
        this.__isScanning.aboutToBeDeleted();
        this.__scanStatus.aboutToBeDeleted();
        this.__discoveredDevices.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __cameras: ObservedPropertyObjectPU<Camera[]>;
    get cameras() {
        return this.__cameras.get();
    }
    set cameras(newValue: Camera[]) {
        this.__cameras.set(newValue);
    }
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private __errorMessage: ObservedPropertySimplePU<string>;
    get errorMessage() {
        return this.__errorMessage.get();
    }
    set errorMessage(newValue: string) {
        this.__errorMessage.set(newValue);
    }
    private __refreshing: ObservedPropertySimplePU<boolean>;
    get refreshing() {
        return this.__refreshing.get();
    }
    set refreshing(newValue: boolean) {
        this.__refreshing.set(newValue);
    }
    private __showAddDialog: ObservedPropertySimplePU<boolean>;
    get showAddDialog() {
        return this.__showAddDialog.get();
    }
    set showAddDialog(newValue: boolean) {
        this.__showAddDialog.set(newValue);
    }
    private __showEditDialog: ObservedPropertySimplePU<boolean>;
    get showEditDialog() {
        return this.__showEditDialog.get();
    }
    set showEditDialog(newValue: boolean) {
        this.__showEditDialog.set(newValue);
    }
    private __showDeleteDialog: ObservedPropertySimplePU<boolean>;
    get showDeleteDialog() {
        return this.__showDeleteDialog.get();
    }
    set showDeleteDialog(newValue: boolean) {
        this.__showDeleteDialog.set(newValue);
    }
    private __selectedCamera: ObservedPropertyObjectPU<Camera | null>;
    get selectedCamera() {
        return this.__selectedCamera.get();
    }
    set selectedCamera(newValue: Camera | null) {
        this.__selectedCamera.set(newValue);
    }
    private __searchText: ObservedPropertySimplePU<string>;
    get searchText() {
        return this.__searchText.get();
    }
    set searchText(newValue: string) {
        this.__searchText.set(newValue);
    }
    private __formName: ObservedPropertySimplePU<string>;
    get formName() {
        return this.__formName.get();
    }
    set formName(newValue: string) {
        this.__formName.set(newValue);
    }
    private __formIp: ObservedPropertySimplePU<string>;
    get formIp() {
        return this.__formIp.get();
    }
    set formIp(newValue: string) {
        this.__formIp.set(newValue);
    }
    private __formPort: ObservedPropertySimplePU<string>;
    get formPort() {
        return this.__formPort.get();
    }
    set formPort(newValue: string) {
        this.__formPort.set(newValue);
    }
    private __formUsername: ObservedPropertySimplePU<string>;
    get formUsername() {
        return this.__formUsername.get();
    }
    set formUsername(newValue: string) {
        this.__formUsername.set(newValue);
    }
    private __formPassword: ObservedPropertySimplePU<string>;
    get formPassword() {
        return this.__formPassword.get();
    }
    set formPassword(newValue: string) {
        this.__formPassword.set(newValue);
    }
    private __formLocation: ObservedPropertySimplePU<string>;
    get formLocation() {
        return this.__formLocation.get();
    }
    set formLocation(newValue: string) {
        this.__formLocation.set(newValue);
    }
    // 扫描相关
    private __showScanDialog: ObservedPropertySimplePU<boolean>;
    get showScanDialog() {
        return this.__showScanDialog.get();
    }
    set showScanDialog(newValue: boolean) {
        this.__showScanDialog.set(newValue);
    }
    private __isScanning: ObservedPropertySimplePU<boolean>;
    get isScanning() {
        return this.__isScanning.get();
    }
    set isScanning(newValue: boolean) {
        this.__isScanning.set(newValue);
    }
    private __scanStatus: ObservedPropertySimplePU<string>;
    get scanStatus() {
        return this.__scanStatus.get();
    }
    set scanStatus(newValue: string) {
        this.__scanStatus.set(newValue);
    }
    private __discoveredDevices: ObservedPropertyObjectPU<DiscoveredCamera[]>;
    get discoveredDevices() {
        return this.__discoveredDevices.get();
    }
    set discoveredDevices(newValue: DiscoveredCamera[]) {
        this.__discoveredDevices.set(newValue);
    }
    private onAddConfirm: DialogCallback;
    private onEditConfirm: DialogCallback;
    aboutToAppear() {
        this.loadCameras();
    }
    async loadCameras(): Promise<void> {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            const list = await videoService.getCameraList();
            this.cameras = list as Camera[];
            if (this.cameras.length === 0) {
                this.errorMessage = '暂无摄像头配置\n点击右上角 + 添加';
            }
        }
        catch (e) {
            this.errorMessage = `加载失败: ${e}`;
            promptAction.showToast({ message: this.errorMessage });
        }
        this.isLoading = false;
        this.refreshing = false;
    }
    onRefresh(): void {
        this.refreshing = true;
        this.loadCameras();
    }
    getFilteredCameras(): Camera[] {
        if (!this.searchText || this.searchText.trim() === '') {
            return this.cameras;
        }
        const keyword = this.searchText.toLowerCase();
        return this.cameras.filter((cam: Camera) => {
            return cam.name.toLowerCase().includes(keyword) ||
                cam.ip.toLowerCase().includes(keyword) ||
                cam.location.toLowerCase().includes(keyword);
        });
    }
    // 扫描局域网摄像头
    async startScan(): Promise<void> {
        this.showScanDialog = true;
        this.isScanning = true;
        this.scanStatus = '正在扫描局域网...';
        this.discoveredDevices = [];
        try {
            const result = await videoService.discoverDevices();
            if (result.success) {
                this.discoveredDevices = result.devices as DiscoveredCamera[];
                this.scanStatus = `发现 ${this.discoveredDevices.length} 个设备`;
            }
            else {
                this.scanStatus = '扫描失败';
            }
        }
        catch (e) {
            this.scanStatus = `扫描失败: ${e}`;
        }
        this.isScanning = false;
    }
    // 添加扫描到的设备
    async addDiscoveredDevice(device: DiscoveredCamera): Promise<void> {
        try {
            const camera = await videoService.addCamera({
                ip: device.ip,
                port: device.port,
                name: device.name || `摄像头-${device.ip}`,
                username: 'admin',
                password: '',
                location: ''
            });
            if (camera) {
                promptAction.showToast({ message: '添加成功' });
                this.discoveredDevices = this.discoveredDevices.filter(d => d.ip !== device.ip);
                this.loadCameras();
            }
        }
        catch (e) {
            promptAction.showToast({ message: `添加失败: ${e}` });
        }
    }
    // 添加所有扫描到的设备
    async addAllDevices(): Promise<void> {
        for (const device of this.discoveredDevices) {
            await this.addDiscoveredDevice(device);
        }
        if (this.discoveredDevices.length === 0) {
            this.showScanDialog = false;
            promptAction.showToast({ message: '添加完成' });
        }
    }
    openVideo(camera: Camera): void {
        router.pushUrl({
            url: 'pages/VideoPlayer',
            params: { cameraId: camera.id }
        });
    }
    showAdd(): void {
        this.formName = '';
        this.formIp = '';
        this.formPort = '554';
        this.formUsername = 'admin';
        this.formPassword = '';
        this.formLocation = '';
        this.showAddDialog = true;
        this.onAddConfirm = () => this.addCamera();
    }
    showEdit(camera: Camera): void {
        this.selectedCamera = camera;
        this.formName = camera.name;
        this.formIp = camera.ip;
        this.formPort = camera.port.toString();
        this.formUsername = camera.username;
        this.formPassword = camera.password;
        this.formLocation = camera.location;
        this.showEditDialog = true;
        this.onEditConfirm = () => this.updateCamera();
    }
    showDelete(camera: Camera): void {
        this.selectedCamera = camera;
        this.showDeleteDialog = true;
    }
    async addCamera(): Promise<void> {
        if (!this.formName || !this.formIp) {
            promptAction.showToast({ message: '请填写名称和IP地址' });
            return;
        }
        try {
            const result = await videoService.addCamera({
                name: this.formName,
                ip: this.formIp,
                port: parseInt(this.formPort) || 554,
                username: this.formUsername,
                password: this.formPassword,
                location: this.formLocation
            });
            if (result) {
                promptAction.showToast({ message: '添加成功' });
                this.showAddDialog = false;
                this.loadCameras();
            }
            else {
                promptAction.showToast({ message: '添加失败' });
            }
        }
        catch (e) {
            promptAction.showToast({ message: `添加失败: ${e}` });
        }
    }
    async updateCamera(): Promise<void> {
        if (!this.selectedCamera || !this.formName || !this.formIp) {
            promptAction.showToast({ message: '请填写完整信息' });
            return;
        }
        try {
            const result = await videoService.updateCameraByForm(this.selectedCamera.id, this.formName, this.formIp, parseInt(this.formPort) || 554, this.formUsername, this.formPassword, this.formLocation);
            if (result) {
                promptAction.showToast({ message: '更新成功' });
                this.showEditDialog = false;
                this.loadCameras();
            }
            else {
                promptAction.showToast({ message: '更新失败' });
            }
        }
        catch (e) {
            promptAction.showToast({ message: `更新失败: ${e}` });
        }
    }
    async deleteCamera(): Promise<void> {
        if (!this.selectedCamera)
            return;
        try {
            const success = await videoService.deleteCamera(this.selectedCamera.id);
            if (success) {
                promptAction.showToast({ message: '删除成功' });
                this.showDeleteDialog = false;
                this.loadCameras();
            }
            else {
                promptAction.showToast({ message: '删除失败' });
            }
        }
        catch (e) {
            promptAction.showToast({ message: `删除失败: ${e}` });
        }
    }
    getStatusColor(status: string): string {
        return status === 'online' ? '#52c41a' : '#d9d9d9';
    }
    getStatusText(status: string): string {
        return status === 'online' ? '在线' : '离线';
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(283:5)", "entry");
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(284:7)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#f5f5f5');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(285:9)", "entry");
            Row.width('100%');
            Row.height(56);
            Row.padding({ left: 16, right: 16 });
            Row.backgroundColor('#ffffff');
            Row.shadow({
                radius: 4,
                color: 'rgba(0,0,0,0.05)',
                offsetY: 2
            });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(286:11)", "entry");
            Button.width(40);
            Button.height(40);
            Button.backgroundColor('transparent');
            Button.onClick(() => router.back());
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('‹');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(287:13)", "entry");
            Text.fontSize(24);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('家庭监控');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(296:11)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Blank.create();
            Blank.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(301:11)", "entry");
        }, Blank);
        Blank.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 扫描按钮
            Button.createWithChild();
            Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(304:11)", "entry");
            // 扫描按钮
            Button.width(40);
            // 扫描按钮
            Button.height(40);
            // 扫描按钮
            Button.backgroundColor('transparent');
            // 扫描按钮
            Button.onClick(() => this.startScan());
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('📡');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(305:13)", "entry");
            Text.fontSize(18);
        }, Text);
        Text.pop();
        // 扫描按钮
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(313:11)", "entry");
            Button.width(40);
            Button.height(40);
            Button.backgroundColor('transparent');
            Button.onClick(() => this.showAdd());
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('+');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(314:13)", "entry");
            Text.fontSize(24);
            Text.fontColor('#1890ff');
        }, Text);
        Text.pop();
        Button.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            // 搜索栏
            Search.create({
                placeholder: '搜索摄像头名称/IP/位置',
                value: this.searchText
            });
            Search.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(334:9)", "entry");
            // 搜索栏
            Search.width('100%');
            // 搜索栏
            Search.height(40);
            // 搜索栏
            Search.margin({ left: 16, right: 16, top: 8, bottom: 8 });
            // 搜索栏
            Search.backgroundColor('#f5f5f5');
            // 搜索栏
            Search.placeholderColor('#999999');
            // 搜索栏
            Search.fontColor('#333333');
            // 搜索栏
            Search.onChange((value: string) => {
                this.searchText = value;
            });
        }, Search);
        // 搜索栏
        Search.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(349:11)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(350:13)", "entry");
                        LoadingProgress.width(48);
                        LoadingProgress.height(48);
                        LoadingProgress.color('#1890ff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('加载摄像头...');
                        Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(354:13)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#999999');
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    Column.pop();
                });
            }
            else if (this.errorMessage) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(363:11)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('📷');
                        Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(364:13)", "entry");
                        Text.fontSize(64);
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.errorMessage);
                        Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(366:13)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#666666');
                        Text.textAlign(TextAlign.Center);
                        Text.margin({ top: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('刷新');
                        Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(371:13)", "entry");
                        Button.margin({ top: 24 });
                        Button.onClick(() => this.loadCameras());
                    }, Button);
                    Button.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        List.create();
                        List.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(379:11)", "entry");
                        List.width('100%');
                        List.layoutWeight(1);
                        List.padding({ left: 16, right: 16, top: 16 });
                        List.backgroundColor('#f5f5f5');
                        List.edgeEffect(EdgeEffect.Spring);
                    }, List);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        ForEach.create();
                        const forEachItemGenFunction = _item => {
                            const camera = _item;
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
                                    ListItem.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(381:15)", "entry");
                                };
                                const deepRenderFunction = (elmtId, isInitialRender) => {
                                    itemCreation(elmtId, isInitialRender);
                                    this.CameraItem.bind(this)(camera);
                                    ListItem.pop();
                                };
                                this.observeComponentCreation2(itemCreation2, ListItem);
                                ListItem.pop();
                            }
                        };
                        this.forEachUpdateFunction(elmtId, this.getFilteredCameras(), forEachItemGenFunction);
                    }, ForEach);
                    ForEach.pop();
                    List.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.showAddDialog) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.DialogMask.bind(this)();
                    this.AddFormDialog.bind(this)();
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
            if (this.showEditDialog) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.DialogMask.bind(this)();
                    this.EditFormDialog.bind(this)();
                });
            }
            // 扫描对话框
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            // 扫描对话框
            if (this.showScanDialog) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(409:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.position({ x: 0, y: 0 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(410:11)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.backgroundColor('rgba(0,0,0,0.5)');
                        Column.onClick(() => this.showScanDialog = false);
                    }, Column);
                    Column.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(420:9)", "entry");
                        Column.width('80%');
                        Column.height(this.discoveredDevices.length > 0 ? '70%' : 'auto');
                        Column.backgroundColor('#ffffff');
                        Column.borderRadius(12);
                        Column.position({ x: '10%', y: '15%' });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        // 标题栏
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(422:11)", "entry");
                        // 标题栏
                        Row.width('100%');
                        // 标题栏
                        Row.padding(16);
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('扫描局域网摄像头');
                        Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(423:13)", "entry");
                        Text.fontSize(16);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor('#333333');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(428:13)", "entry");
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithChild();
                        Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(430:13)", "entry");
                        Button.width(32);
                        Button.height(32);
                        Button.backgroundColor('transparent');
                        Button.onClick(() => this.showScanDialog = false);
                    }, Button);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('×');
                        Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(431:15)", "entry");
                        Text.fontSize(24);
                        Text.fontColor('#999999');
                    }, Text);
                    Text.pop();
                    Button.pop();
                    // 标题栏
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Divider.create();
                        Divider.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(443:11)", "entry");
                        Divider.color('#eeeeee');
                    }, Divider);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        // 扫描状态
                        if (this.isScanning) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(447:13)", "entry");
                                    Column.width('100%');
                                    Column.padding(32);
                                    Column.justifyContent(FlexAlign.Center);
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    LoadingProgress.create();
                                    LoadingProgress.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(448:15)", "entry");
                                    LoadingProgress.width(48);
                                    LoadingProgress.height(48);
                                    LoadingProgress.color('#1890ff');
                                }, LoadingProgress);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.scanStatus);
                                    Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(452:15)", "entry");
                                    Text.fontSize(14);
                                    Text.fontColor('#666666');
                                    Text.margin({ top: 16 });
                                }, Text);
                                Text.pop();
                                Column.pop();
                            });
                        }
                        else if (this.discoveredDevices.length === 0) {
                            this.ifElseBranchUpdateFunction(1, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(461:13)", "entry");
                                    Column.width('100%');
                                    Column.padding(32);
                                    Column.justifyContent(FlexAlign.Center);
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('📷');
                                    Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(462:15)", "entry");
                                    Text.fontSize(64);
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.scanStatus || '点击下方按钮开始扫描');
                                    Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(464:15)", "entry");
                                    Text.fontSize(14);
                                    Text.fontColor('#666666');
                                    Text.margin({ top: 16 });
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithLabel('重新扫描');
                                    Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(468:15)", "entry");
                                    Button.margin({ top: 24 });
                                    Button.onClick(() => this.startScan());
                                }, Button);
                                Button.pop();
                                Column.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(2, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    // 发现列表
                                    Text.create(`发现 ${this.discoveredDevices.length} 个设备`);
                                    Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(477:13)", "entry");
                                    // 发现列表
                                    Text.fontSize(14);
                                    // 发现列表
                                    Text.fontColor('#666666');
                                    // 发现列表
                                    Text.padding(16);
                                }, Text);
                                // 发现列表
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    List.create();
                                    List.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(482:13)", "entry");
                                    List.width('100%');
                                    List.layoutWeight(1);
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
                                                ListItem.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(484:17)", "entry");
                                            };
                                            const deepRenderFunction = (elmtId, isInitialRender) => {
                                                itemCreation(elmtId, isInitialRender);
                                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                    Row.create();
                                                    Row.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(485:19)", "entry");
                                                    Row.width('100%');
                                                    Row.padding({ left: 16, right: 16, top: 12, bottom: 12 });
                                                }, Row);
                                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                    Column.create();
                                                    Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(486:21)", "entry");
                                                    Column.alignItems(HorizontalAlign.Start);
                                                }, Column);
                                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                    Text.create(device.name || `摄像头-${device.ip}`);
                                                    Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(487:23)", "entry");
                                                    Text.fontSize(14);
                                                    Text.fontColor('#333333');
                                                }, Text);
                                                Text.pop();
                                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                    Text.create(device.ip);
                                                    Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(490:23)", "entry");
                                                    Text.fontSize(12);
                                                    Text.fontColor('#999999');
                                                    Text.margin({ top: 4 });
                                                }, Text);
                                                Text.pop();
                                                Column.pop();
                                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                    Blank.create();
                                                    Blank.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(497:21)", "entry");
                                                }, Blank);
                                                Blank.pop();
                                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                    Button.createWithLabel('添加');
                                                    Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(499:21)", "entry");
                                                    Button.fontSize(12);
                                                    Button.height(28);
                                                    Button.onClick(() => this.addDiscoveredDevice(device));
                                                }, Button);
                                                Button.pop();
                                                Row.pop();
                                                ListItem.pop();
                                            };
                                            this.observeComponentCreation2(itemCreation2, ListItem);
                                            ListItem.pop();
                                        }
                                    };
                                    this.forEachUpdateFunction(elmtId, this.discoveredDevices, forEachItemGenFunction);
                                }, ForEach);
                                ForEach.pop();
                                List.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    // 添加全部按钮
                                    Row.create();
                                    Row.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(513:13)", "entry");
                                    // 添加全部按钮
                                    Row.width('100%');
                                    // 添加全部按钮
                                    Row.padding(16);
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithLabel('添加全部');
                                    Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(514:15)", "entry");
                                    Button.width('100%');
                                    Button.height(40);
                                    Button.onClick(() => this.addAllDevices());
                                }, Button);
                                Button.pop();
                                // 添加全部按钮
                                Row.pop();
                            });
                        }
                    }, If);
                    If.pop();
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
            if (this.showDeleteDialog) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(531:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.position({ x: 0, y: 0 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(532:11)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.backgroundColor('rgba(0,0,0,0.5)');
                        Column.onClick(() => this.showDeleteDialog = false);
                    }, Column);
                    Column.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(542:9)", "entry");
                        Column.width('80%');
                        Column.padding(24);
                        Column.backgroundColor('#ffffff');
                        Column.borderRadius(16);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('确认删除');
                        Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(543:11)", "entry");
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor('#333333');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('确定要删除摄像头吗？');
                        Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(548:11)", "entry");
                        Text.fontSize(14);
                        Text.fontColor('#666666');
                        Text.textAlign(TextAlign.Center);
                        Text.margin({ top: 12, bottom: 24 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(554:11)", "entry");
                        Row.width('100%');
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('取消');
                        Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(555:13)", "entry");
                        Button.width('45%');
                        Button.backgroundColor('#f5f5f5');
                        Button.fontColor('#666666');
                        Button.onClick(() => this.showDeleteDialog = false);
                    }, Button);
                    Button.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('删除');
                        Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(561:13)", "entry");
                        Button.width('45%');
                        Button.backgroundColor('#ff4d4f');
                        Button.fontColor('#ffffff');
                        Button.onClick(() => this.deleteCamera());
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
        Stack.pop();
    }
    DialogMask(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(581:5)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.position({ x: 0, y: 0 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(582:7)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('rgba(0,0,0,0.5)');
        }, Column);
        Column.pop();
        Column.pop();
    }
    AddFormDialog(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(594:5)", "entry");
            Column.width('85%');
            Column.padding(24);
            Column.backgroundColor('#ffffff');
            Column.borderRadius(16);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('添加摄像头');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(595:7)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
            Text.margin({ bottom: 20 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '摄像头名称', text: this.formName });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(601:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 12 });
            TextInput.onChange((value: string) => this.formName = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'IP地址', text: this.formIp });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(609:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 12 });
            TextInput.onChange((value: string) => this.formIp = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '端口 (默认554)', text: this.formPort });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(617:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 12 });
            TextInput.onChange((value: string) => this.formPort = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '用户名', text: this.formUsername });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(625:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 12 });
            TextInput.onChange((value: string) => this.formUsername = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '密码', text: this.formPassword });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(633:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 12 });
            TextInput.onChange((value: string) => this.formPassword = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '位置', text: this.formLocation });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(641:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 20 });
            TextInput.onChange((value: string) => this.formLocation = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(649:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('取消');
            Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(650:9)", "entry");
            Button.width('45%');
            Button.backgroundColor('#f5f5f5');
            Button.fontColor('#666666');
            Button.onClick(() => this.showAddDialog = false);
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('确定');
            Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(656:9)", "entry");
            Button.width('45%');
            Button.backgroundColor('#1890ff');
            Button.fontColor('#ffffff');
            Button.onClick(() => this.addCamera());
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
    }
    EditFormDialog(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(672:5)", "entry");
            Column.width('85%');
            Column.padding(24);
            Column.backgroundColor('#ffffff');
            Column.borderRadius(16);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('编辑摄像头');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(673:7)", "entry");
            Text.fontSize(18);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
            Text.margin({ bottom: 20 });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '摄像头名称', text: this.formName });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(679:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 12 });
            TextInput.onChange((value: string) => this.formName = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: 'IP地址', text: this.formIp });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(687:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 12 });
            TextInput.onChange((value: string) => this.formIp = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '端口 (默认554)', text: this.formPort });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(695:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 12 });
            TextInput.onChange((value: string) => this.formPort = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '用户名', text: this.formUsername });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(703:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 12 });
            TextInput.onChange((value: string) => this.formUsername = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '密码', text: this.formPassword });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(711:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 12 });
            TextInput.onChange((value: string) => this.formPassword = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ placeholder: '位置', text: this.formLocation });
            TextInput.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(719:7)", "entry");
            TextInput.width('100%');
            TextInput.height(44);
            TextInput.borderRadius(8);
            TextInput.backgroundColor('#f5f5f5');
            TextInput.margin({ bottom: 20 });
            TextInput.onChange((value: string) => this.formLocation = value);
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(727:7)", "entry");
            Row.width('100%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('取消');
            Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(728:9)", "entry");
            Button.width('45%');
            Button.backgroundColor('#f5f5f5');
            Button.fontColor('#666666');
            Button.onClick(() => this.showEditDialog = false);
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('保存');
            Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(734:9)", "entry");
            Button.width('45%');
            Button.backgroundColor('#1890ff');
            Button.fontColor('#ffffff');
            Button.onClick(() => this.updateCamera());
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
    }
    CameraItem(camera: Camera, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(750:5)", "entry");
            Column.width('100%');
            Column.backgroundColor('#ffffff');
            Column.borderRadius(12);
            Column.margin({ bottom: 12 });
            Column.onClick(() => this.openVideo(camera));
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(751:7)", "entry");
            Row.width('100%');
            Row.padding(16);
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(752:9)", "entry");
            Column.width(56);
            Column.height(56);
            Column.backgroundColor('#e6f7ff');
            Column.borderRadius(12);
            Column.justifyContent(FlexAlign.Center);
            Column.margin({ right: 12 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('📹');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(753:11)", "entry");
            Text.fontSize(32);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(763:9)", "entry");
            Column.layoutWeight(1);
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(camera.name);
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(764:11)", "entry");
            Text.fontSize(16);
            Text.fontWeight(FontWeight.Medium);
            Text.fontColor('#333333');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(769:11)", "entry");
            Row.margin({ top: 4 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(camera.location || '未知位置');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(770:13)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(' • ');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(773:13)", "entry");
            Text.fontSize(12);
            Text.fontColor('#d9d9d9');
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(camera.ip);
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(776:13)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create({ space: 8 });
            Row.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(785:9)", "entry");
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(786:11)", "entry");
            Button.width(36);
            Button.height(36);
            Button.backgroundColor('#f0f0f0');
            Button.borderRadius(18);
            Button.onClick(() => this.showEdit(camera));
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('✏️');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(787:13)", "entry");
            Text.fontSize(18);
        }, Text);
        Text.pop();
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(796:11)", "entry");
            Button.width(36);
            Button.height(36);
            Button.backgroundColor('#fff1f0');
            Button.borderRadius(18);
            Button.onClick(() => this.showDelete(camera));
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🗑️');
            Text.debugLine("entry/src/main/ets/pages/VideoMonitor.ets(797:13)", "entry");
            Text.fontSize(18);
        }, Text);
        Text.pop();
        Button.pop();
        Row.pop();
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "VideoMonitor";
    }
}
registerNamedRoute(() => new VideoMonitor(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/VideoMonitor", pageFullPath: "entry/src/main/ets/pages/VideoMonitor", integratedHsp: "false", moduleType: "followWithHap" });
