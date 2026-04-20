import http from "@ohos:net.http";
import hilog from "@ohos:hilog";
import dataPreferences from "@ohos:data.preferences";
import { configService } from "@normalized:N&&&entry/src/main/ets/services/ConfigService&";
const TAG = 'HttpService';
const DOMAIN = 0xFF01;
// 从配置服务获取动态地址
const getBaseUrl = () => configService.getBaseUrl();
// Storage keys
const STORAGE_KEY_TOKEN = 'auth_token';
const PREFERENCES_NAME = 'iot_app_prefs';
// 全局 Preferences 实例
let preferences: dataPreferences.Preferences | null = null;
let preferencesReady: boolean = false;
let initPromise: Promise<void> | null = null;
// ========== Preferences 持久化存储 ==========
// 初始化 Preferences（可多次调用，保证只初始化一次）
export async function initPreferences(context: any): Promise<void> {
    if (preferencesReady && preferences) {
        hilog.info(DOMAIN, TAG, '=== Preferences 已初始化，跳过 ===');
        return;
    }
    if (initPromise) {
        hilog.info(DOMAIN, TAG, '=== Preferences 初始化已在进行中，等待 ===');
        return initPromise;
    }
    initPromise = doInitPreferences(context);
    return initPromise;
}
async function doInitPreferences(context: any): Promise<void> {
    hilog.info(DOMAIN, TAG, '=== Preferences 开始初始化 ===');
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            hilog.info(DOMAIN, TAG, '=== Preferences 初始化尝试 %{public}d/3 ===', attempt);
            preferences = await dataPreferences.getPreferences(context, PREFERENCES_NAME);
            preferencesReady = true;
            hilog.info(DOMAIN, TAG, '=== Preferences 初始化成功 ===');
            // 验证初始化：尝试读取一次
            const testToken = preferences.getSync(STORAGE_KEY_TOKEN, '__test__') as string;
            hilog.info(DOMAIN, TAG, '=== Preferences 测试读取: %{public}s ===', testToken);
            return;
        }
        catch (e) {
            lastError = e as Error;
            hilog.error(DOMAIN, TAG, '=== Preferences 初始化失败 (尝试 %{public}d): %{public}s ===', attempt, JSON.stringify(e));
            if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
    hilog.error(DOMAIN, TAG, '=== Preferences 初始化全部失败: %{public}s ===', JSON.stringify(lastError));
}
// 等待 Preferences 初始化完成
export async function waitForPreferences(): Promise<void> {
    // 如果已就绪，直接返回
    if (preferencesReady && preferences) {
        hilog.info(DOMAIN, TAG, '=== waitForPreferences: 已就绪 ===');
        return;
    }
    hilog.info(DOMAIN, TAG, '=== waitForPreferences: 等待初始化... ===');
    let retries = 0;
    while (!preferencesReady && retries < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }
    if (preferencesReady && preferences) {
        hilog.info(DOMAIN, TAG, '=== Preferences 已就绪 (等待 %{public}00ms) ===', retries);
    }
    else {
        hilog.error(DOMAIN, TAG, '=== Preferences 初始化超时 ===');
        // 重置状态，允许重新初始化
        initPromise = null;
    }
}
// 加载 token (同步) - 等待 Preferences 初始化
function loadTokenSync(): string {
    if (!preferences) {
        hilog.warn(DOMAIN, TAG, '=== loadToken: Preferences 未初始化, 返回空 ===');
        return '';
    }
    try {
        const token = preferences.getSync(STORAGE_KEY_TOKEN, '') as string;
        hilog.info(DOMAIN, TAG, '=== loadToken: 读取结果, token=%{public}s ===', token ? token.substring(0, 20) + '...' : '空');
        return token;
    }
    catch (e) {
        hilog.error(DOMAIN, TAG, '=== loadToken: 失败: %{public}s ===', JSON.stringify(e));
        return '';
    }
}
// 保存 token
async function saveToken(token: string): Promise<void> {
    if (!preferences) {
        hilog.error(DOMAIN, TAG, '=== saveToken: Preferences 未初始化，尝试等待 ===');
        await waitForPreferences();
    }
    if (!preferences) {
        hilog.error(DOMAIN, TAG, '=== saveToken: Preferences 初始化失败，无法保存Token ===');
        return;
    }
    hilog.info(DOMAIN, TAG, '=== saveToken: 保存 Token: %{public}s ===', token ? token.substring(0, 20) + '...' : '空');
    try {
        await preferences.put(STORAGE_KEY_TOKEN, token);
        await preferences.flush();
        // 验证保存
        const saved = preferences.getSync(STORAGE_KEY_TOKEN, '') as string;
        hilog.info(DOMAIN, TAG, '=== Token 已保存, 验证读取: %{public}s ===', saved ? saved.substring(0, 20) + '...' : '空');
    }
    catch (e) {
        hilog.error(DOMAIN, TAG, '=== 保存 Token 失败: %{public}s ===', JSON.stringify(e));
    }
}
// 删除 token
async function deleteToken(): Promise<void> {
    if (!preferences) {
        hilog.warn(DOMAIN, TAG, '=== deleteToken: Preferences 未初始化 ===');
        return;
    }
    hilog.info(DOMAIN, TAG, '=== deleteToken: 删除 Token ===');
    try {
        await preferences.delete(STORAGE_KEY_TOKEN);
        await preferences.flush();
        hilog.info(DOMAIN, TAG, '=== Token 已从 Preferences 删除 ===');
    }
    catch (e) {
        hilog.error(DOMAIN, TAG, '=== 删除 Token 失败: %{public}s ===', JSON.stringify(e));
    }
}
// initAppContext - 初始化并等待 Preferences 准备就绪
export async function initAppContext(context: any): Promise<void> {
    hilog.info(DOMAIN, TAG, '=== initAppContext: 开始初始化 ===');
    await initPreferences(context);
    await waitForPreferences();
    hilog.info(DOMAIN, TAG, '=== initAppContext: 完成 ===');
}
// 测试连接 - 使用登录接口测试（不需要token）
export async function testConnection(): Promise<{
    success: boolean;
    message: string;
}> {
    const httpRequest = http.createHttp();
    const url = getBaseUrl();
    return new Promise((resolve) => {
        console.info('测试连接:', url);
        httpRequest.request(url + '/api/auth/login', {
            method: http.RequestMethod.POST,
            header: [{ key: 'Content-Type', value: 'application/json' }],
            extraData: { username: '_test_', password: '_test_' },
            connectTimeout: 5000,
            readTimeout: 5000
        }, (err: Error | undefined, data: http.HttpResponse) => {
            httpRequest.destroy();
            if (err) {
                console.error('连接失败:', err);
                resolve({ success: false, message: '连接失败: ' + String(err) });
            }
            else {
                console.info('响应状态:', data.responseCode);
                // 401 表示服务器正常但需要认证，说明连接成功
                if (data.responseCode === 401) {
                    resolve({ success: true, message: '连接成功 (服务器正常)' });
                }
                else if (data.responseCode === 200 || data.responseCode === 400) {
                    resolve({ success: true, message: '连接成功 (API正常)' });
                }
                else {
                    resolve({ success: false, message: '连接异常 (' + data.responseCode + ')' });
                }
            }
        });
    });
}
interface RequestOptions {
    method?: http.RequestMethod;
    header?: object;
    extraData?: object | string;
}
export class HttpService {
    private _token: string = '';
    private _tokenLoaded: boolean = false;
    getBaseUrl(): string {
        return getBaseUrl();
    }
    get token(): string {
        return this._token;
    }
    // 初始化：确保 token 已加载（同步）
    ensureTokenLoaded(): void {
        if (!this._tokenLoaded) {
            this._token = loadTokenSync();
            this._tokenLoaded = true;
            hilog.info(DOMAIN, TAG, '=== ensureTokenLoaded: token已加载, hasToken=%{public}s ===', String(!!this._token));
        }
    }
    async setToken(token: string): Promise<void> {
        hilog.info(DOMAIN, TAG, '=== HttpService.setToken 被调用 ===');
        hilog.info(DOMAIN, TAG, 'Token: %{public}s', token ? token.substring(0, 20) + '...' : '空');
        // 先等待 Preferences 就绪
        await waitForPreferences();
        this._token = token;
        this._tokenLoaded = true;
        // 保存到 Preferences
        await saveToken(token);
    }
    async clearToken(): Promise<void> {
        hilog.info(DOMAIN, TAG, 'HttpService.clearToken 被调用');
        this._token = '';
        this._tokenLoaded = false;
        await deleteToken();
    }
    hasToken(): boolean {
        return !!this._token;
    }
    async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
        // 等待 Preferences 初始化完成
        hilog.info(DOMAIN, TAG, '=== request: 开始请求, url=%{public}s ===', url);
        hilog.info(DOMAIN, TAG, '=== request: preferencesReady=%{public}s ===', String(preferencesReady));
        await waitForPreferences();
        // 确保 token 已加载
        hilog.info(DOMAIN, TAG, '=== request: 当前 _tokenLoaded=%{public}s ===', String(this._tokenLoaded));
        this.ensureTokenLoaded();
        hilog.info(DOMAIN, TAG, '=== request: ensureTokenLoaded 完成, hasToken=%{public}s ===', String(!!this._token));
        const httpRequest = http.createHttp();
        const header: Record<string, string> = {};
        if (this._token) {
            header['Authorization'] = `Bearer ${this._token}`;
        }
        header['Content-Type'] = 'application/json';
        const headerArray = Object.entries(header).map(([k, v]) => ({ key: k, value: v }));
        // 构建完整URL，如果需要的话添加token到query参数
        let fullUrl = `${this.getBaseUrl()}${url}`;
        if (this._token) {
            const separator = url.includes('?') ? '&' : '?';
            fullUrl = `${fullUrl}${separator}token=${this._token}`;
        }
        hilog.info(DOMAIN, TAG, '>>> HttpService.request START <<<');
        hilog.info(DOMAIN, TAG, 'URL: %{public}s', url);
        hilog.info(DOMAIN, TAG, 'fullUrl: %{public}s', fullUrl);
        hilog.info(DOMAIN, TAG, 'hasToken: %{public}s', String(!!this._token));
        hilog.info(DOMAIN, TAG, 'Token值: %{public}s', this._token ? this._token.substring(0, 30) + '...' : '无');
        hilog.info(DOMAIN, TAG, 'Header数组: %{public}s', JSON.stringify(headerArray));
        hilog.info(DOMAIN, TAG, '>>> HttpService.request END <<<');
        return new Promise((resolve, reject) => {
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            // 超时控制 - 10秒
            timeoutId = setTimeout(() => {
                try {
                    httpRequest.destroy();
                }
                catch (e) {
                    // ignore destroy error
                }
                reject(new Error('请求超时，请检查网络'));
            }, 10000);
            httpRequest.request(fullUrl, {
                method: options.method || http.RequestMethod.GET,
                header: headerArray,
                extraData: options.extraData,
                connectTimeout: 10000,
                readTimeout: 10000
            }, (err: Error | undefined, data: http.HttpResponse) => {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }
                try {
                    httpRequest.destroy();
                }
                catch (e) {
                    // ignore destroy error
                }
                if (err) {
                    hilog.error(DOMAIN, TAG, 'HttpService: 网络错误 %{public}s', err.message);
                    reject(new Error('网络错误'));
                    return;
                }
                // 解析响应数据
                let responseData: Record<string, Object> = {};
                try {
                    responseData = JSON.parse(data.result as string);
                }
                catch {
                    // 如果解析失败，创建模拟的响应结构
                }
                hilog.info(DOMAIN, TAG, 'HttpService: %{public}s 响应状态=%{public}d', url, data.responseCode);
                if (data.responseCode >= 200 && data.responseCode < 300) {
                    // 2xx 成功
                    try {
                        resolve(JSON.parse(data.result as string));
                    }
                    catch {
                        resolve(data.result as T);
                    }
                }
                else if (data.responseCode === 401) {
                    hilog.error(DOMAIN, TAG, 'HttpService: 401 未授权');
                    resolve({
                        code: 401,
                        success: false,
                        message: responseData.message || '未授权，请重新登录'
                    } as T);
                }
                else if (data.responseCode === 403) {
                    hilog.error(DOMAIN, TAG, 'HttpService: 403 禁止访问');
                    resolve({
                        code: 403,
                        success: false,
                        message: responseData.message || '禁止访问'
                    } as T);
                }
                else {
                    hilog.error(DOMAIN, TAG, 'HttpService: 服务器错误 %{public}d', data.responseCode);
                    reject(new Error(`服务器错误 (${data.responseCode})`));
                }
            });
        });
    }
    // 登录
    async login(username: string, password: string): Promise<any> {
        return this.request('/api/auth/login', {
            method: http.RequestMethod.POST,
            extraData: { username, password }
        });
    }
    // 获取设备列表
    async getDevices(): Promise<any> {
        return this.request('/api/devices');
    }
    // 获取设备详情
    async getDevice(id: string): Promise<any> {
        return this.request(`/api/devices/${id}`);
    }
    // 获取设备数据
    async getDeviceData(id: string): Promise<any> {
        return this.request(`/api/devices/${id}/data`);
    }
    // 发送设备控制命令
    async sendCommand(deviceId: string, command: string, params?: Record<string, Object>): Promise<Object> {
        return this.request(`/api/devices/${deviceId}/command`, {
            method: http.RequestMethod.POST,
            extraData: { command, ...params }
        });
    }
    // 获取告警列表
    async getAlerts(): Promise<Object> {
        return this.request('/api/alerts');
    }
    // 获取用户信息
    async getUserInfo(): Promise<Object> {
        return this.request('/api/auth/me');
    }
    // 诊断：验证Token是否有效
    async verifyToken(): Promise<{
        valid: boolean;
        error?: string;
        hint?: string;
    }> {
        await waitForPreferences();
        this.ensureTokenLoaded();
        hilog.info(DOMAIN, TAG, '=== verifyToken: 开始验证 ===');
        hilog.info(DOMAIN, TAG, 'Token: %{public}s', this._token ? this._token.substring(0, 30) + '...' : '无');
        const httpRequest = http.createHttp();
        const url = this.getBaseUrl() + '/api/auth/verify-token';
        return new Promise((resolve) => {
            httpRequest.request(url, {
                method: http.RequestMethod.GET,
                header: [{
                        key: 'Authorization',
                        value: `Bearer ${this._token}`
                    }],
                connectTimeout: 5000,
                readTimeout: 5000
            }, (err: Error | undefined, data: http.HttpResponse) => {
                httpRequest.destroy();
                if (err) {
                    hilog.error(DOMAIN, TAG, 'verifyToken: 网络错误 %{public}s', err.message);
                    resolve({ valid: false, error: err.message });
                    return;
                }
                try {
                    const result = JSON.parse(data.result as string);
                    hilog.info(DOMAIN, TAG, 'verifyToken: 结果 valid=%{public}s', String(result.valid));
                    if (result.error) {
                        hilog.error(DOMAIN, TAG, 'verifyToken: 错误 %{public}s', result.error);
                    }
                    if (result.hint) {
                        hilog.warn(DOMAIN, TAG, 'verifyToken: 提示 %{public}s', result.hint);
                    }
                    resolve(result);
                }
                catch {
                    resolve({ valid: false, error: '响应解析失败' });
                }
            });
        });
    }
    // ===== 设备管理 API =====
    // 创建设备
    async createDevice(params: {
        name: string;
        type: string;
        location?: string;
        deviceKey?: string;
    }): Promise<Object> {
        return this.request('/api/devices', {
            method: http.RequestMethod.POST,
            extraData: params
        });
    }
    // 更新设备
    async updateDevice(id: string, params: {
        name?: string;
        location?: string;
    }): Promise<Object> {
        return this.request(`/api/devices/${id}`, {
            method: http.RequestMethod.PUT,
            extraData: params
        });
    }
    // 删除设备
    async deleteDevice(id: string): Promise<Object> {
        return this.request(`/api/devices/${id}`, {
            method: http.RequestMethod.DELETE
        });
    }
}
export const httpService = new HttpService();
