import type { Device, DeviceData } from '../models/Device';
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
import promptAction from "@ohos:promptAction";
export class DeviceViewModel {
    private devices: Device[] = [];
    private selectedDevice: Device | null = null;
    async loadDevices(): Promise<Device[]> {
        try {
            console.info('=== loadDevices 开始 ===');
            const res = await httpService.getDevices() as any;
            console.info('设备列表响应类型:', typeof res);
            console.info('设备列表响应:', JSON.stringify(res).substring(0, 500));
            // 兼容两种格式：数组或 {code:0, data:[...]}
            if (Array.isArray(res)) {
                console.info('响应是数组，设备数量:', res.length);
                this.devices = res;
                return this.devices;
            }
            if (res.code === 0 || res.success === true) {
                console.info('响应是标准格式，设备数量:', res.data?.length);
                this.devices = res.data || [];
                return this.devices;
            }
            // 处理错误响应
            console.error('API返回错误:', res);
            const msg = res.message || res.error || res.msg || '获取设备列表失败';
            console.error('将显示错误:', msg);
            promptAction.showToast({ message: msg });
            this.devices = [];
            return this.devices;
        }
        catch (e) {
            const errMsg = e instanceof Error ? e.message : '网络错误，请检查服务器设置';
            console.error('获取设备列表失败:', errMsg);
            promptAction.showToast({ message: errMsg });
            this.devices = [];
            return this.devices;
        }
    }
    async loadDevice(id: string): Promise<Device | null> {
        try {
            const res = await httpService.getDevice(id) as any;
            console.info('=== loadDevice 响应:', JSON.stringify(res).substring(0, 500));
            // 情况1: 直接返回设备对象（后端直接返回设备详情）
            if (res && (res.id || res.device_id || res.deviceId)) {
                this.selectedDevice = res;
                console.info('=== loadDevice: 直接设备对象, id=' + (res.id || res.device_id));
                return this.selectedDevice;
            }
            // 情况2: 标准格式 {code: 0, data: {...}}
            if (res.code === 0 || res.success === true) {
                this.selectedDevice = res.data;
                return this.selectedDevice;
            }
            // 情况3: 数组格式
            if (Array.isArray(res)) {
                this.selectedDevice = res.find(d => d.id === id || d.device_id === id || d.deviceId === id) || res[0];
                return this.selectedDevice;
            }
            console.warn('=== loadDevice: 未匹配的响应格式');
            return null;
        }
        catch (e) {
            console.error('获取设备详情失败:', e);
            return null;
        }
    }
    async loadDeviceData(id: string): Promise<DeviceData | null> {
        try {
            const res = await httpService.getDeviceData(id) as any;
            console.info('=== loadDeviceData 响应:', JSON.stringify(res).substring(0, 500));
            // 情况1: 直接返回数据对象
            if (res && (res.temperature !== undefined || res.humidity !== undefined || res.led !== undefined)) {
                return res;
            }
            // 情况2: 标准格式 {code: 0, data: {...}}
            if (res.code === 0 || res.success === true) {
                return res.data;
            }
            // 情况3: 数组格式，取第一条
            if (Array.isArray(res) && res.length > 0) {
                return res[0];
            }
            return null;
        }
        catch (e) {
            console.error('获取设备数据失败:', e);
            return null;
        }
    }
    async sendCommand(deviceId: string, command: string, params?: Record<string, Object>): Promise<boolean> {
        try {
            const res = await httpService.sendCommand(deviceId, command, params);
            const resObj = res as Record<string, Object>;
            if (resObj.code === 0 || resObj.success) {
                promptAction.showToast({ message: '命令发送成功' });
                return true;
            }
            promptAction.showToast({ message: (resObj.message as string) || '命令发送失败' });
            return false;
        }
        catch (e) {
            console.error('Send command failed:', e);
            promptAction.showToast({ message: '命令发送失败' });
            return false;
        }
    }
    async updateDevice(deviceId: string, params: {
        name?: string;
        location?: string;
    }): Promise<boolean> {
        try {
            const res = await httpService.updateDevice(deviceId, params);
            const resObj = res as Record<string, Object>;
            if (resObj.code === 0 || resObj.success) {
                promptAction.showToast({ message: '设备更新成功' });
                return true;
            }
            promptAction.showToast({ message: (resObj.message as string) || '更新失败' });
            return false;
        }
        catch (e) {
            console.error('Update device failed:', e);
            promptAction.showToast({ message: '更新失败' });
            return false;
        }
    }
    async deleteDevice(deviceId: string): Promise<boolean> {
        try {
            const res = await httpService.deleteDevice(deviceId);
            const resObj = res as Record<string, Object>;
            if (resObj.code === 0 || resObj.success) {
                promptAction.showToast({ message: '设备已删除' });
                return true;
            }
            promptAction.showToast({ message: (resObj.message as string) || '删除失败' });
            return false;
        }
        catch (e) {
            console.error('Delete device failed:', e);
            promptAction.showToast({ message: '删除失败' });
            return false;
        }
    }
    async loadAlerts(): Promise<Record<string, Object>[]> {
        try {
            const res = await httpService.getAlerts() as any;
            if (Array.isArray(res)) {
                return res;
            }
            if (res.code === 0 || res.success) {
                return (res.data as Record<string, Object>[]) || [];
            }
            return [];
        }
        catch (e) {
            console.error('获取告警列表失败:', e);
            return [];
        }
    }
    getDevices(): Device[] {
        return this.devices;
    }
    getSelectedDevice(): Device | null {
        return this.selectedDevice;
    }
    // 根据ID从设备列表中查找设备
    async findDevice(deviceId: string): Promise<Device | null> {
        // 如果已有设备列表，直接查找
        if (this.devices.length > 0) {
            const found = this.devices.find(d => d.id === deviceId ||
                d.deviceId === deviceId ||
                d.device_id === deviceId);
            if (found)
                return found;
        }
        // 否则从API获取
        return await this.loadDevice(deviceId);
    }
    updateDeviceData(deviceId: string, data: DeviceData) {
        const device = this.devices.find(d => d.id === deviceId);
        if (device) {
            device.data = data;
        }
        if (this.selectedDevice?.id === deviceId) {
            this.selectedDevice.data = data;
        }
    }
}
export const deviceViewModel = new DeviceViewModel();
