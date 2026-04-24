import type { User } from '../models/Device';
import { httpService } from "@normalized:N&&&entry/src/main/ets/services/HttpService&";
import { webSocketService } from "@normalized:N&&&entry/src/main/ets/services/WebSocketService&";
import promptAction from "@ohos:promptAction";
export class UserViewModel {
    private currentUser: User | null = null;
    async login(username: string, password: string): Promise<boolean> {
        try {
            console.info('>>> login: 开始登录 <<<');
            console.info('用户名:', username);
            console.info('服务器地址:', httpService.getBaseUrl());
            const res = await httpService.login(username, password);
            console.info('登录响应:', JSON.stringify(res));
            const resData = res as Record<string, Object>;
            // 检查是否成功（可能返回 { token, username, ... } 或 { code: 0, data: {...} }）
            if (resData.token || resData.success === true || resData.code === 0) {
                // 后端返回格式：{ token, username, displayName, roles, permissions }
                // 或格式：{ code: 0, data: { token, user: {...} } }
                let token = '';
                if (resData.token) {
                    // 平铺格式
                    token = resData.token as string;
                    console.info('Token 来源: 平铺格式');
                    this.currentUser = {
                        id: resData.id as string || '',
                        username: resData.username as string || username,
                        displayName: resData.displayName as string || username
                    } as User;
                }
                else {
                    // 标准格式
                    const data = resData.data as Record<string, Object>;
                    token = data.token as string;
                    console.info('Token 来源: 标准格式');
                    this.currentUser = data.user as User;
                }
                console.info('Token 值:', token.substring(0, 20) + '...');
                // 设置 token 到 HttpService（这是唯一的 token 存储位置）
                await httpService.setToken(token);
                console.info('>>> login: Token 已设置到 httpService <<<');
                console.info('>>> login: httpService.hasToken() =', httpService.hasToken(), '<<<');
                // 连接 WebSocket
                try {
                    const baseUrl = httpService.getBaseUrl();
                    console.info('WebSocket初始化: ' + baseUrl);
                    webSocketService.init(baseUrl);
                    webSocketService.setToken(token);
                    webSocketService.connect();
                }
                catch (e) {
                    console.error('WebSocket连接失败:', e);
                }
                promptAction.showToast({ message: '登录成功' });
                console.info('>>> login: 返回 true，准备跳转 <<<');
                return true;
            }
            const msg = (resData.message as string) || (resData.error as string) || '用户名或密码错误';
            promptAction.showToast({ message: msg });
            return false;
        }
        catch (e) {
            const errMsg = e instanceof Error ? e.message : '网络连接失败，请检查服务器设置';
            console.error('登录失败:', errMsg);
            promptAction.showToast({ message: errMsg });
            return false;
        }
    }
    async logout() {
        webSocketService.disconnect();
        await httpService.clearToken();
        this.currentUser = null;
    }
    async getUserInfo(): Promise<Object> {
        try {
            return await httpService.getUserInfo();
        }
        catch (e) {
            console.error('Get user info failed:', e);
            return { code: -1, message: '获取用户信息失败' };
        }
    }
    getCurrentUser(): User | null {
        return this.currentUser;
    }
    isLoggedIn(): boolean {
        return this.currentUser !== null || httpService.hasToken();
    }
}
export const userViewModel = new UserViewModel();
