# iTouch - IoT物联网控制应用

## 项目简介
基于鸿蒙原生开发的物联网设备控制应用

## 开发环境
- DevEco Studio 6.0+
- HarmonyOS SDK 6.0+
- ArkTS/ArkUI

## 项目结构
```
iTouch/
├── entry/src/main/
│   ├── ets/
│   │   ├── pages/           # 页面
│   │   ├── viewmodels/      # ViewModel
│   │   ├── services/        # 服务层
│   │   ├── models/          # 数据模型
│   │   ├── utils/           # 工具类
│   │   └── entryability/    # 入口
│   └── resources/           # 资源文件
├── hvigor/                  # 构建配置
└── AppScope/                # 应用配置
```

## 功能模块
1. 设备列表 - 查看所有设备
2. 设备详情 - 实时数据、控制
3. 告警中心 - 设备告警
4. 我的 - 个人中心

## API对接
- 登录: POST /api/auth/login
- 设备列表: GET /api/devices
- 设备详情: GET /api/devices/:id
- 设备控制: POST /api/devices/:id/command
- 实时推送: WebSocket /ws

## 开发进度
- [ ] 阶段1: 基础框架 + 用户认证 + 设备列表
- [ ] 阶段2: 设备详情 + 实时数据 + 控制功能
- [ ] 阶段3: 告警推送 + 数据图表
- [ ] 阶段4: 蓝牙配网 + OTA升级
