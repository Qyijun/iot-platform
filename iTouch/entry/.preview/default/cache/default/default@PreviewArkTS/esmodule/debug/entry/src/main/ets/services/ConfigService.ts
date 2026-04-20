// 配置服务 - 动态服务器配置
export interface ServerConfig {
    protocol: string;
    host: string;
    port: number;
}
const DEFAULT_CONFIG: ServerConfig = {
    protocol: 'http',
    host: '192.168.3.11',
    port: 3000
};
class ConfigService {
    private config: ServerConfig = DEFAULT_CONFIG;
    init() {
        // 简单内存存储模式
    }
    getBaseUrl(): string {
        const p = this.config.protocol;
        const h = this.config.host;
        const pt = this.config.port;
        const hostPart = h.includes(':') ? `[${h}]` : h;
        return `${p}://${hostPart}:${pt}`;
    }
    getWsUrl(): string {
        const h = this.config.host;
        const pt = this.config.port;
        const hostPart = h.includes(':') ? `[${h}]` : h;
        return `ws://${hostPart}:${pt}/ws`;
    }
    getConfig(): ServerConfig {
        return { ...this.config };
    }
    setConfig(config: ServerConfig) {
        this.config = config;
    }
    reset() {
        this.config = DEFAULT_CONFIG;
    }
}
export const configService = new ConfigService();
