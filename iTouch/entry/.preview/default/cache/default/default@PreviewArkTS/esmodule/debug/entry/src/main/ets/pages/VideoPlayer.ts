if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
interface VideoPlayer_Params {
    camera?: CameraData | null;
    streamUrl?: StreamUrlData | null;
    isLoading?: boolean;
    isPlaying?: boolean;
    errorMessage?: string;
    showControls?: boolean;
    recording?: boolean;
    showPlaybackDialog?: boolean;
    playbackList?: RecordItem[];
    isLoadingPlayback?: boolean;
    cameraId?: string;
    controlTimer?: number;
}
import router from "@ohos:router";
import promptAction from "@ohos:promptAction";
import { videoService } from "@normalized:N&&&entry/src/main/ets/services/VideoService&";
class CameraData {
    id: string = '';
    name: string = '';
    ip: string = '';
    location: string = '';
    status: string = '';
}
class StreamUrlData {
    cameraId: string = '';
    cameraName: string = '';
    rtspUrl: string = '';
    flvUrl: string = '';
    hlsUrl: string = '';
    wsFlvUrl: string = '';
}
class RecordItem {
    filename: string = '';
    startTime: string = '';
    endTime: string = '';
    duration: number = 0;
    size: number = 0;
}
class MotionResult {
    success: boolean = false;
    recordings: RecordItem[] = [];
}
class VideoPlayer extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__camera = new ObservedPropertyObjectPU(null, this, "camera");
        this.__streamUrl = new ObservedPropertyObjectPU(null, this, "streamUrl");
        this.__isLoading = new ObservedPropertySimplePU(true, this, "isLoading");
        this.__isPlaying = new ObservedPropertySimplePU(false, this, "isPlaying");
        this.__errorMessage = new ObservedPropertySimplePU('', this, "errorMessage");
        this.__showControls = new ObservedPropertySimplePU(true, this, "showControls");
        this.__recording = new ObservedPropertySimplePU(false, this, "recording");
        this.__showPlaybackDialog = new ObservedPropertySimplePU(false, this, "showPlaybackDialog");
        this.__playbackList = new ObservedPropertyObjectPU([], this, "playbackList");
        this.__isLoadingPlayback = new ObservedPropertySimplePU(false, this, "isLoadingPlayback");
        this.cameraId = '';
        this.controlTimer = -1;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params: VideoPlayer_Params) {
        if (params.camera !== undefined) {
            this.camera = params.camera;
        }
        if (params.streamUrl !== undefined) {
            this.streamUrl = params.streamUrl;
        }
        if (params.isLoading !== undefined) {
            this.isLoading = params.isLoading;
        }
        if (params.isPlaying !== undefined) {
            this.isPlaying = params.isPlaying;
        }
        if (params.errorMessage !== undefined) {
            this.errorMessage = params.errorMessage;
        }
        if (params.showControls !== undefined) {
            this.showControls = params.showControls;
        }
        if (params.recording !== undefined) {
            this.recording = params.recording;
        }
        if (params.showPlaybackDialog !== undefined) {
            this.showPlaybackDialog = params.showPlaybackDialog;
        }
        if (params.playbackList !== undefined) {
            this.playbackList = params.playbackList;
        }
        if (params.isLoadingPlayback !== undefined) {
            this.isLoadingPlayback = params.isLoadingPlayback;
        }
        if (params.cameraId !== undefined) {
            this.cameraId = params.cameraId;
        }
        if (params.controlTimer !== undefined) {
            this.controlTimer = params.controlTimer;
        }
    }
    updateStateVars(params: VideoPlayer_Params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__camera.purgeDependencyOnElmtId(rmElmtId);
        this.__streamUrl.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoading.purgeDependencyOnElmtId(rmElmtId);
        this.__isPlaying.purgeDependencyOnElmtId(rmElmtId);
        this.__errorMessage.purgeDependencyOnElmtId(rmElmtId);
        this.__showControls.purgeDependencyOnElmtId(rmElmtId);
        this.__recording.purgeDependencyOnElmtId(rmElmtId);
        this.__showPlaybackDialog.purgeDependencyOnElmtId(rmElmtId);
        this.__playbackList.purgeDependencyOnElmtId(rmElmtId);
        this.__isLoadingPlayback.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__camera.aboutToBeDeleted();
        this.__streamUrl.aboutToBeDeleted();
        this.__isLoading.aboutToBeDeleted();
        this.__isPlaying.aboutToBeDeleted();
        this.__errorMessage.aboutToBeDeleted();
        this.__showControls.aboutToBeDeleted();
        this.__recording.aboutToBeDeleted();
        this.__showPlaybackDialog.aboutToBeDeleted();
        this.__playbackList.aboutToBeDeleted();
        this.__isLoadingPlayback.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    private __camera: ObservedPropertyObjectPU<CameraData | null>;
    get camera() {
        return this.__camera.get();
    }
    set camera(newValue: CameraData | null) {
        this.__camera.set(newValue);
    }
    private __streamUrl: ObservedPropertyObjectPU<StreamUrlData | null>;
    get streamUrl() {
        return this.__streamUrl.get();
    }
    set streamUrl(newValue: StreamUrlData | null) {
        this.__streamUrl.set(newValue);
    }
    private __isLoading: ObservedPropertySimplePU<boolean>;
    get isLoading() {
        return this.__isLoading.get();
    }
    set isLoading(newValue: boolean) {
        this.__isLoading.set(newValue);
    }
    private __isPlaying: ObservedPropertySimplePU<boolean>;
    get isPlaying() {
        return this.__isPlaying.get();
    }
    set isPlaying(newValue: boolean) {
        this.__isPlaying.set(newValue);
    }
    private __errorMessage: ObservedPropertySimplePU<string>;
    get errorMessage() {
        return this.__errorMessage.get();
    }
    set errorMessage(newValue: string) {
        this.__errorMessage.set(newValue);
    }
    private __showControls: ObservedPropertySimplePU<boolean>;
    get showControls() {
        return this.__showControls.get();
    }
    set showControls(newValue: boolean) {
        this.__showControls.set(newValue);
    }
    private __recording: ObservedPropertySimplePU<boolean>;
    get recording() {
        return this.__recording.get();
    }
    set recording(newValue: boolean) {
        this.__recording.set(newValue);
    }
    private __showPlaybackDialog: ObservedPropertySimplePU<boolean>;
    get showPlaybackDialog() {
        return this.__showPlaybackDialog.get();
    }
    set showPlaybackDialog(newValue: boolean) {
        this.__showPlaybackDialog.set(newValue);
    }
    private __playbackList: ObservedPropertyObjectPU<RecordItem[]>;
    get playbackList() {
        return this.__playbackList.get();
    }
    set playbackList(newValue: RecordItem[]) {
        this.__playbackList.set(newValue);
    }
    private __isLoadingPlayback: ObservedPropertySimplePU<boolean>;
    get isLoadingPlayback() {
        return this.__isLoadingPlayback.get();
    }
    set isLoadingPlayback(newValue: boolean) {
        this.__isLoadingPlayback.set(newValue);
    }
    private cameraId: string;
    private controlTimer: number;
    aboutToAppear() {
        const params = router.getParams() as Record<string, string>;
        if (params && params.cameraId) {
            this.cameraId = params.cameraId;
            this.loadCamera();
        }
        else {
            this.errorMessage = '未提供摄像头ID';
            this.isLoading = false;
        }
    }
    aboutToDisappear() {
        if (this.controlTimer > 0) {
            clearTimeout(this.controlTimer);
        }
    }
    async loadCamera() {
        this.isLoading = true;
        this.errorMessage = '';
        try {
            const cameraInfo = await videoService.getCamera(this.cameraId);
            if (!cameraInfo) {
                this.errorMessage = '摄像头不存在';
                this.isLoading = false;
                return;
            }
            this.camera = cameraInfo as CameraData;
            const streamInfo = await videoService.getStreamUrl(this.cameraId);
            if (streamInfo) {
                this.streamUrl = streamInfo as StreamUrlData;
                this.isPlaying = true;
            }
            else {
                this.errorMessage = '无法获取视频流';
            }
        }
        catch (e) {
            this.errorMessage = `加载失败: ${e}`;
        }
        this.isLoading = false;
    }
    async captureImage() {
        if (!this.camera)
            return;
        try {
            promptAction.showToast({ message: '正在抓拍...' });
            const result = await videoService.captureImage(this.cameraId);
            if (result.success && result.data) {
                promptAction.showToast({
                    message: `抓拍成功: ${result.data.filename}`,
                    duration: 3000
                });
            }
            else {
                promptAction.showToast({
                    message: result.error || '抓拍失败',
                    duration: 2000
                });
            }
        }
        catch (e) {
            promptAction.showToast({ message: `抓拍失败: ${e}` });
        }
    }
    async startRecording() {
        if (!this.camera)
            return;
        if (this.recording) {
            promptAction.showToast({ message: '正在停止录像...' });
            this.recording = false;
            return;
        }
        try {
            promptAction.showToast({ message: '开始录像（60秒）...' });
            const result = await videoService.startRecording(this.cameraId, 60);
            if (result.success) {
                this.recording = true;
                promptAction.showToast({
                    message: `录像开始: ${result.data?.filename || 'recording'}`,
                    duration: 2000
                });
                setTimeout(() => {
                    this.recording = false;
                    promptAction.showToast({ message: '录像已停止' });
                }, 60000);
            }
            else {
                promptAction.showToast({
                    message: result.error || '录像失败',
                    duration: 2000
                });
            }
        }
        catch (e) {
            promptAction.showToast({ message: `录像失败: ${e}` });
        }
    }
    async loadPlaybackList() {
        this.isLoadingPlayback = true;
        try {
            const result = await videoService.getMotionEvents(this.cameraId);
            if (result.success && result.recordings) {
                this.playbackList = result.recordings as RecordItem[];
            }
            else {
                this.playbackList = [];
            }
        }
        catch (e) {
            this.playbackList = [];
        }
        this.isLoadingPlayback = false;
    }
    showPlayback() {
        this.showPlaybackDialog = true;
        this.loadPlaybackList();
    }
    playRecording(item: RecordItem) {
        promptAction.showToast({ message: `播放: ${item.filename}` });
    }
    hideControls() {
        this.showControls = false;
        if (this.controlTimer > 0) {
            clearTimeout(this.controlTimer);
        }
        this.controlTimer = setTimeout(() => {
            this.showControls = true;
        }, 5000) as number;
    }
    goBack() {
        router.back();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Stack.create();
            Stack.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(201:5)", "entry");
            Stack.width('100%');
            Stack.height('100%');
        }, Stack);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(202:7)", "entry");
            Column.width('100%');
            Column.height('100%');
            Column.backgroundColor('#000000');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.isLoading) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(204:11)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        LoadingProgress.create();
                        LoadingProgress.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(205:13)", "entry");
                        LoadingProgress.width(60);
                        LoadingProgress.height(60);
                        LoadingProgress.color('#1890ff');
                    }, LoadingProgress);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('加载摄像头...');
                        Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(209:13)", "entry");
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
                        Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(218:11)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.justifyContent(FlexAlign.Center);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('⚠️');
                        Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(219:13)", "entry");
                        Text.fontSize(48);
                        Text.margin({ bottom: 16 });
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create(this.errorMessage);
                        Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(222:13)", "entry");
                        Text.fontSize(16);
                        Text.fontColor('#666666');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithLabel('重新加载');
                        Button.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(225:13)", "entry");
                        Button.margin({ top: 24 });
                        Button.onClick(() => this.loadCamera());
                    }, Button);
                    Button.pop();
                    Column.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(233:11)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Stack.create();
                        Stack.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(234:13)", "entry");
                        Stack.width('100%');
                        Stack.layoutWeight(1);
                    }, Stack);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(235:15)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.backgroundColor('#000000');
                        Column.onClick(() => this.hideControls());
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.isPlaying && this.streamUrl) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(237:19)", "entry");
                                    Column.width('100%');
                                    Column.height('100%');
                                    Column.justifyContent(FlexAlign.Center);
                                    Column.backgroundColor('#1a1a1a');
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.streamUrl.cameraName);
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(238:21)", "entry");
                                    Text.fontSize(18);
                                    Text.fontColor('#ffffff');
                                    Text.fontWeight(FontWeight.Medium);
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('RTSP: ' + this.streamUrl.rtspUrl.substring(0, 50) + '...');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(243:21)", "entry");
                                    Text.fontSize(12);
                                    Text.fontColor('#cccccc');
                                    Text.margin({ top: 8 });
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('视频流加载中...');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(248:21)", "entry");
                                    Text.fontSize(14);
                                    Text.fontColor('#999999');
                                    Text.margin({ top: 24 });
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create();
                                    Row.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(253:21)", "entry");
                                    Row.width(60);
                                    Row.height(60);
                                    Row.backgroundColor('rgba(24, 144, 255, 0.8)');
                                    Row.borderRadius(30);
                                    Row.justifyContent(FlexAlign.Center);
                                    Row.margin({ top: 20 });
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('▶');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(254:23)", "entry");
                                    Text.fontSize(24);
                                    Text.fontColor('#ffffff');
                                }, Text);
                                Text.pop();
                                Row.pop();
                                Column.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(1, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('视频加载中...');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(270:19)", "entry");
                                    Text.fontSize(16);
                                    Text.fontColor('#999999');
                                }, Text);
                                Text.pop();
                            });
                        }
                    }, If);
                    If.pop();
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.showControls) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(281:17)", "entry");
                                    Column.width('100%');
                                    Column.alignItems(HorizontalAlign.Start);
                                    Column.linearGradient({
                                        angle: 180,
                                        colors: [['rgba(0,0,0,0.7)', 0], ['rgba(0,0,0,0)', 1]]
                                    });
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create();
                                    Row.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(282:19)", "entry");
                                    Row.width('100%');
                                    Row.padding({ left: 16, right: 16, top: 16, bottom: 16 });
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithChild();
                                    Button.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(283:21)", "entry");
                                    Button.width(40);
                                    Button.height(40);
                                    Button.backgroundColor('rgba(0, 0, 0, 0.5)');
                                    Button.borderRadius(20);
                                    Button.onClick(() => this.goBack());
                                }, Button);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('‹');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(284:23)", "entry");
                                    Text.fontSize(24);
                                    Text.fontColor('#ffffff');
                                }, Text);
                                Text.pop();
                                Button.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.camera?.name || '摄像头');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(294:21)", "entry");
                                    Text.fontSize(18);
                                    Text.fontColor('#ffffff');
                                    Text.fontWeight(FontWeight.Medium);
                                    Text.margin({ left: 12 });
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Blank.create();
                                    Blank.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(300:21)", "entry");
                                }, Blank);
                                Blank.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    If.create();
                                    if (this.recording) {
                                        this.ifElseBranchUpdateFunction(0, () => {
                                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                Row.create();
                                                Row.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(303:23)", "entry");
                                                Row.padding({ left: 8, right: 8, top: 4, bottom: 4 });
                                                Row.backgroundColor('rgba(0,0,0,0.5)');
                                                Row.borderRadius(4);
                                            }, Row);
                                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                Circle.create();
                                                Circle.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(304:25)", "entry");
                                                Circle.width(8);
                                                Circle.height(8);
                                                Circle.fill('#ff4d4f');
                                            }, Circle);
                                            this.observeComponentCreation2((elmtId, isInitialRender) => {
                                                Text.create('REC');
                                                Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(308:25)", "entry");
                                                Text.fontSize(12);
                                                Text.fontColor('#ff4d4f');
                                                Text.margin({ left: 4 });
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
                        if (this.showControls) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(330:17)", "entry");
                                    Column.width('100%');
                                    Column.padding({ left: 16, right: 16, bottom: 24 });
                                    Column.linearGradient({
                                        angle: 0,
                                        colors: [['rgba(0,0,0,0)', 0], ['rgba(0,0,0,0.7)', 1]]
                                    });
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create();
                                    Row.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(331:19)", "entry");
                                    Row.width('100%');
                                    Row.margin({ bottom: 16 });
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Blank.create();
                                    Blank.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(332:21)", "entry");
                                }, Blank);
                                Blank.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithChild();
                                    Button.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(334:21)", "entry");
                                    Button.backgroundColor('rgba(0,0,0,0.5)');
                                    Button.borderRadius(20);
                                    Button.padding({ left: 16, right: 16, top: 10, bottom: 10 });
                                    Button.onClick(() => this.captureImage());
                                    Button.margin({ right: 12 });
                                }, Button);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(335:23)", "entry");
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('📷');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(336:25)", "entry");
                                    Text.fontSize(26);
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('抓拍');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(338:25)", "entry");
                                    Text.fontSize(11);
                                    Text.fontColor('#ffffff');
                                    Text.margin({ top: 4 });
                                }, Text);
                                Text.pop();
                                Column.pop();
                                Button.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithChild();
                                    Button.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(350:21)", "entry");
                                    Button.backgroundColor('rgba(0,0,0,0.5)');
                                    Button.borderRadius(20);
                                    Button.padding({ left: 16, right: 16, top: 10, bottom: 10 });
                                    Button.onClick(() => this.startRecording());
                                    Button.margin({ right: 12 });
                                }, Button);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(351:23)", "entry");
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.recording ? '⏹' : '⏺');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(352:25)", "entry");
                                    Text.fontSize(26);
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.recording ? '停止' : '录像');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(354:25)", "entry");
                                    Text.fontSize(11);
                                    Text.fontColor(this.recording ? '#ff4d4f' : '#ffffff');
                                    Text.margin({ top: 4 });
                                }, Text);
                                Text.pop();
                                Column.pop();
                                Button.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Button.createWithChild();
                                    Button.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(366:21)", "entry");
                                    Button.backgroundColor('rgba(0,0,0,0.5)');
                                    Button.borderRadius(20);
                                    Button.padding({ left: 16, right: 16, top: 10, bottom: 10 });
                                    Button.onClick(() => this.showPlayback());
                                }, Button);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(367:23)", "entry");
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('📋');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(368:25)", "entry");
                                    Text.fontSize(26);
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('回放');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(370:25)", "entry");
                                    Text.fontSize(11);
                                    Text.fontColor('#ffffff');
                                    Text.margin({ top: 4 });
                                }, Text);
                                Text.pop();
                                Column.pop();
                                Button.pop();
                                Row.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Row.create();
                                    Row.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(384:19)", "entry");
                                    Row.width('100%');
                                }, Row);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.camera?.location || '');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(385:21)", "entry");
                                    Text.fontSize(12);
                                    Text.fontColor('#cccccc');
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(' • ');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(388:21)", "entry");
                                    Text.fontSize(12);
                                    Text.fontColor('#666666');
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.camera?.ip || '');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(391:21)", "entry");
                                    Text.fontSize(12);
                                    Text.fontColor('#cccccc');
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Blank.create();
                                    Blank.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(394:21)", "entry");
                                }, Blank);
                                Blank.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create(this.isPlaying ? '已连接' : '未连接');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(395:21)", "entry");
                                    Text.fontSize(12);
                                    Text.fontColor(this.isPlaying ? '#52c41a' : '#ff4d4f');
                                }, Text);
                                Text.pop();
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
                    Column.pop();
                });
            }
        }, If);
        If.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.showPlaybackDialog) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(421:9)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.position({ x: 0, y: 0 });
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(422:11)", "entry");
                        Column.width('100%');
                        Column.height('100%');
                        Column.backgroundColor('rgba(0,0,0,0.5)');
                        Column.onClick(() => this.showPlaybackDialog = false);
                    }, Column);
                    Column.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Column.create();
                        Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(428:11)", "entry");
                        Column.width('90%');
                        Column.padding(20);
                        Column.backgroundColor('#ffffff');
                        Column.borderRadius(16);
                    }, Column);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                        Row.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(429:13)", "entry");
                        Row.width('100%');
                        Row.margin({ bottom: 16 });
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('录像回放');
                        Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(430:15)", "entry");
                        Text.fontSize(18);
                        Text.fontWeight(FontWeight.Medium);
                        Text.fontColor('#333333');
                    }, Text);
                    Text.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Blank.create();
                        Blank.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(435:15)", "entry");
                    }, Blank);
                    Blank.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Button.createWithChild();
                        Button.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(437:15)", "entry");
                        Button.width(32);
                        Button.height(32);
                        Button.backgroundColor('transparent');
                        Button.onClick(() => this.showPlaybackDialog = false);
                    }, Button);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('✕');
                        Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(438:17)", "entry");
                        Text.fontSize(20);
                        Text.fontColor('#999999');
                    }, Text);
                    Text.pop();
                    Button.pop();
                    Row.pop();
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        If.create();
                        if (this.isLoadingPlayback) {
                            this.ifElseBranchUpdateFunction(0, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(451:15)", "entry");
                                    Column.width('100%');
                                    Column.height(200);
                                    Column.justifyContent(FlexAlign.Center);
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    LoadingProgress.create();
                                    LoadingProgress.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(452:17)", "entry");
                                    LoadingProgress.width(40);
                                    LoadingProgress.height(40);
                                    LoadingProgress.color('#1890ff');
                                }, LoadingProgress);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('加载中...');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(456:17)", "entry");
                                    Text.fontSize(14);
                                    Text.fontColor('#999999');
                                    Text.margin({ top: 12 });
                                }, Text);
                                Text.pop();
                                Column.pop();
                            });
                        }
                        else if (this.playbackList.length === 0) {
                            this.ifElseBranchUpdateFunction(1, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Column.create();
                                    Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(465:15)", "entry");
                                    Column.width('100%');
                                    Column.height(200);
                                    Column.justifyContent(FlexAlign.Center);
                                }, Column);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('📹');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(466:17)", "entry");
                                    Text.fontSize(48);
                                    Text.margin({ bottom: 12 });
                                }, Text);
                                Text.pop();
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    Text.create('暂无录像记录');
                                    Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(469:17)", "entry");
                                    Text.fontSize(14);
                                    Text.fontColor('#999999');
                                }, Text);
                                Text.pop();
                                Column.pop();
                            });
                        }
                        else {
                            this.ifElseBranchUpdateFunction(2, () => {
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    List.create();
                                    List.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(477:15)", "entry");
                                    List.width('100%');
                                    List.height(300);
                                }, List);
                                this.observeComponentCreation2((elmtId, isInitialRender) => {
                                    ForEach.create();
                                    const forEachItemGenFunction = _item => {
                                        const item = _item;
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
                                                ListItem.onClick(() => this.playRecording(item));
                                                ListItem.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(479:19)", "entry");
                                            };
                                            const deepRenderFunction = (elmtId, isInitialRender) => {
                                                itemCreation(elmtId, isInitialRender);
                                                this.PlaybackItem.bind(this)(item);
                                                ListItem.pop();
                                            };
                                            this.observeComponentCreation2(itemCreation2, ListItem);
                                            ListItem.pop();
                                        }
                                    };
                                    this.forEachUpdateFunction(elmtId, this.playbackList, forEachItemGenFunction);
                                }, ForEach);
                                ForEach.pop();
                                List.pop();
                            });
                        }
                    }, If);
                    If.pop();
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
    PlaybackItem(item: RecordItem, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(505:5)", "entry");
            Row.width('100%');
            Row.padding({ top: 12, bottom: 12 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(506:7)", "entry");
            Column.width(48);
            Column.height(48);
            Column.backgroundColor('#f0f0f0');
            Column.borderRadius(8);
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('🎬');
            Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(507:9)", "entry");
            Text.fontSize(24);
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(516:7)", "entry");
            Column.layoutWeight(1);
            Column.margin({ left: 12 });
            Column.alignItems(HorizontalAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(item.filename);
            Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(517:9)", "entry");
            Text.fontSize(14);
            Text.fontColor('#333333');
            Text.maxLines(1);
            Text.textOverflow({ overflow: TextOverflow.Ellipsis });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(item.startTime + ' | ' + item.duration.toString() + 's');
            Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(523:9)", "entry");
            Text.fontSize(12);
            Text.fontColor('#999999');
            Text.margin({ top: 4 });
        }, Text);
        Text.pop();
        Column.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(532:7)", "entry");
            Button.backgroundColor('#e6f7ff');
            Button.borderRadius(16);
            Button.padding({ left: 12, right: 12, top: 6, bottom: 6 });
            Button.onClick(() => this.playRecording(item));
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('▶');
            Text.debugLine("entry/src/main/ets/pages/VideoPlayer.ets(533:9)", "entry");
            Text.fontSize(14);
            Text.fontColor('#1890ff');
        }, Text);
        Text.pop();
        Button.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName(): string {
        return "VideoPlayer";
    }
}
registerNamedRoute(() => new VideoPlayer(undefined, {}), "", { bundleName: "com.iot.itouch", moduleName: "entry", pagePath: "pages/VideoPlayer", pageFullPath: "entry/src/main/ets/pages/VideoPlayer", integratedHsp: "false", moduleType: "followWithHap" });
