// 本地存储服务 - 基于内存存储
// 注意：此版本在 App 重启后需要重新登录
// 如需持久化登录状态，可以使用 AppStorage 或 dataPreferences

interface LocalDevice {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline';
  location?: string;
  data?: Record<string, Object>;
}

// 全局登录状态标志（模块级别，在整个应用生命周期内有效）
let globalIsLoggedIn: boolean = false;

class LocalStorageService {
  private devicesCache: LocalDevice[] = [];
  private tokenCache: string = '';
  private initialized: boolean = false;

  init(_context?: object): void {
    if (this.initialized) return;
    this.initialized = true;
    console.info('LocalStorage initialized, isLoggedIn=', globalIsLoggedIn);
  }

  // 保存设备列表
  async saveDevices(devices: LocalDevice[]): Promise<void> {
    this.devicesCache = devices;
  }

  // 获取缓存的设备列表
  async getDevices(): Promise<LocalDevice[]> {
    return this.devicesCache;
  }

  // 保存单个设备数据
  async saveDevice(device: LocalDevice): Promise<void> {
    const index = this.devicesCache.findIndex(d => d.id === device.id);
    if (index >= 0) {
      this.devicesCache[index] = device;
    } else {
      this.devicesCache.push(device);
    }
  }

  // 保存认证令牌
  async saveToken(token: string): Promise<void> {
    this.tokenCache = token;
    globalIsLoggedIn = true;
    console.info('LocalStorage.saveToken: token已保存, globalIsLoggedIn=true');
  }

  // 获取认证令牌
  async getToken(): Promise<string> {
    return this.tokenCache;
  }

  // 检查是否已登录
  checkLoginStatus(): boolean {
    console.info('LocalStorage.checkLoginStatus: globalIsLoggedIn=', globalIsLoggedIn);
    return globalIsLoggedIn;
  }

  // 清除所有数据
  async clear(): Promise<void> {
    this.devicesCache = [];
    this.tokenCache = '';
    globalIsLoggedIn = false;
    console.info('LocalStorage.clear: 已清除登录状态');
  }
}

export const localStorageService = new LocalStorageService();
