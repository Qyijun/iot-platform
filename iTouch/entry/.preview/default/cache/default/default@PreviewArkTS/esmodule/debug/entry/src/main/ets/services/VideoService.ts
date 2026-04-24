import http from "@ohos:net.http";
import { configService } from "@normalized:N&&&entry/src/main/ets/services/ConfigService&";
const TAG = 'VideoService';
class Camera {
    id: string = '';
    name: string = '';
    ip: string = '';
    location: string = '';
    status: string = '';
    port: number = 554;
    username: string = 'admin';
    password: string = '';
    rtspPath: string = '/Streaming/Channels/101';
    streamUrl?: string;
}
class StreamUrl {
    cameraId: string = '';
    cameraName: string = '';
    rtspUrl: string = '';
    flvUrl: string = '';
    hlsUrl: string = '';
    wsFlvUrl: string = '';
}
class CaptureResult {
    success: boolean = false;
    data?: {
        url: string;
        filename: string;
        timestamp: string;
    };
    error?: string;
}
class RecordResult {
    success: boolean = false;
    data?: {
        filename: string;
        url: string;
        duration: number;
        status: string;
    };
    error?: string;
}
class MotionResult {
    success: boolean = false;
    recordings: RecordItem[] = [];
    error?: string;
}
class RecordItem {
    filename: string = '';
    startTime: string = '';
    endTime: string = '';
    duration: number = 0;
    size: number = 0;
}
class VideoService {
    private baseUrl: string;
    constructor() {
        this.baseUrl = configService.getBaseUrl();
    }
    async getCameraList(): Promise<Camera[]> {
        try {
            const url = `${this.baseUrl}/api/video/cameras`;
            const httpRequest = http.createHttp();
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.GET,
                connectTimeout: 10000,
                readTimeout: 10000
            });
            const result = JSON.parse(response.result as string);
            httpRequest.destroy();
            if (result.success) {
                return result.data || [];
            }
            return [];
        }
        catch (e) {
            console.error(TAG, `获取摄像头列表失败: ${e}`);
            return [];
        }
    }
    async getCamera(cameraId: string): Promise<Camera | null> {
        try {
            const url = `${this.baseUrl}/api/video/cameras/${cameraId}`;
            const httpRequest = http.createHttp();
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.GET,
                connectTimeout: 10000,
                readTimeout: 10000
            });
            const result = JSON.parse(response.result as string);
            httpRequest.destroy();
            if (result.success) {
                return result.data;
            }
            return null;
        }
        catch (e) {
            console.error(TAG, `获取摄像头信息失败: ${e}`);
            return null;
        }
    }
    async getStreamUrl(cameraId: string): Promise<StreamUrl | null> {
        try {
            const url = `${this.baseUrl}/api/video/stream/${cameraId}/url`;
            const httpRequest = http.createHttp();
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.GET,
                connectTimeout: 10000,
                readTimeout: 10000
            });
            const result = JSON.parse(response.result as string);
            httpRequest.destroy();
            if (result.success) {
                return result.data;
            }
            return null;
        }
        catch (e) {
            console.error(TAG, `获取流地址失败: ${e}`);
            return null;
        }
    }
    async captureImage(cameraId: string): Promise<CaptureResult> {
        try {
            const url = `${this.baseUrl}/api/video/cameras/${cameraId}/capture`;
            const httpRequest = http.createHttp();
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.POST,
                header: { 'Content-Type': 'application/json' },
                connectTimeout: 15000,
                readTimeout: 15000
            });
            const result = JSON.parse(response.result as string);
            httpRequest.destroy();
            return result;
        }
        catch (e) {
            console.error(TAG, `抓拍失败: ${e}`);
            return { success: false, error: `抓拍失败: ${e}` };
        }
    }
    async startRecording(cameraId: string, duration: number = 60): Promise<RecordResult> {
        try {
            const url = `${this.baseUrl}/api/video/cameras/${cameraId}/record`;
            const httpRequest = http.createHttp();
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.POST,
                header: { 'Content-Type': 'application/json' },
                extraData: JSON.stringify({ duration }),
                connectTimeout: 15000,
                readTimeout: 15000
            });
            const result = JSON.parse(response.result as string);
            httpRequest.destroy();
            return result;
        }
        catch (e) {
            console.error(TAG, `开始录像失败: ${e}`);
            return { success: false, error: `录像失败: ${e}` };
        }
    }
    async getMotionEvents(cameraId: string, startTime?: string, endTime?: string): Promise<MotionResult> {
        try {
            let url = `${this.baseUrl}/api/video/cameras/${cameraId}/motion`;
            if (startTime && endTime) {
                url += `?startTime=${startTime}&endTime=${endTime}`;
            }
            const httpRequest = http.createHttp();
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.GET,
                connectTimeout: 10000,
                readTimeout: 10000
            });
            const result = JSON.parse(response.result as string);
            httpRequest.destroy();
            return result;
        }
        catch (e) {
            console.error(TAG, `获取移动事件失败: ${e}`);
            return { success: false, recordings: [], error: `获取失败: ${e}` };
        }
    }
    async addCamera(config: {
        ip: string;
        port?: number;
        username?: string;
        password?: string;
        name?: string;
        location?: string;
    }): Promise<Camera | null> {
        try {
            const url = `${this.baseUrl}/api/video/cameras`;
            const httpRequest = http.createHttp();
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.POST,
                header: { 'Content-Type': 'application/json' },
                extraData: JSON.stringify(config),
                connectTimeout: 10000,
                readTimeout: 10000
            });
            const result = JSON.parse(response.result as string);
            httpRequest.destroy();
            if (result.success) {
                return result.data;
            }
            return null;
        }
        catch (e) {
            console.error(TAG, `添加摄像头失败: ${e}`);
            return null;
        }
    }
    async updateCamera(cameraId: string, config: Record<string, string | number>): Promise<Camera | null> {
        try {
            const url = `${this.baseUrl}/api/video/cameras/${cameraId}`;
            const httpRequest = http.createHttp();
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.PUT,
                header: { 'Content-Type': 'application/json' },
                extraData: JSON.stringify(config),
                connectTimeout: 10000,
                readTimeout: 10000
            });
            const result = JSON.parse(response.result as string);
            httpRequest.destroy();
            if (result.success) {
                return result.data;
            }
            return null;
        }
        catch (e) {
            console.error(TAG, `更新摄像头失败: ${e}`);
            return null;
        }
    }
    async updateCameraByForm(cameraId: string, name: string, ip: string, port: number, username: string, password: string, location: string): Promise<Camera | null> {
        return this.updateCamera(cameraId, { name, ip, port, username, password, location });
    }
    async deleteCamera(cameraId: string): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/api/video/cameras/${cameraId}`;
            const httpRequest = http.createHttp();
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.DELETE,
                connectTimeout: 10000,
                readTimeout: 10000
            });
            const result = JSON.parse(response.result as string);
            httpRequest.destroy();
            return result.success;
        }
        catch (e) {
            console.error(TAG, `删除摄像头失败: ${e}`);
            return false;
        }
    }
    async discoverDevices(): Promise<Record<string, Object>> {
        try {
            const url = `${this.baseUrl}/api/video/discover`;
            const httpRequest = http.createHttp();
            const response = await httpRequest.request(url, {
                method: http.RequestMethod.GET,
                connectTimeout: 30000,
                readTimeout: 30000
            });
            const result = JSON.parse(response.result as string);
            httpRequest.destroy();
            return result;
        }
        catch (e) {
            console.error(TAG, `设备发现失败: ${e}`);
            return { success: false, devices: [] };
        }
    }
}
export const videoService = new VideoService();
