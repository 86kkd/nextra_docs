# sing-box 节点切换配置完全指南

本文介绍如何配置 sing-box 实现类似 Clash Verge 的节点切换功能，既保留直接编辑配置文件的灵活性，又能通过 Web 面板或 GUI 轻松切换节点。

## 核心方案对比

### 方案一：纯 sing-box + Clash API 面板（推荐）

在 `config.json` 里增加一个 `selector` 出站作为"节点选择器"，把要选的服务器都挂进去；再开启 Clash API，用浏览器打开 Yacd / metacubexd 这类仪表盘就能点选节点，无需重启进程。

**优点：**
- 轻量级，无需额外客户端
- 配置简单，易于维护
- 支持远程控制

### 方案二：图形客户端

#### Android
- **sing-box for Android (SFA)**：直接在 App 里切换节点，支持按应用分流

#### Apple 平台
- **sing-box for iOS/macOS/tvOS (SFI/SFM/SFT)**：可管理本地/远程配置并一键切换
- 注意：App Store 上架状态偶尔会变动

#### Windows/Linux/macOS 桌面
- **GUI.for.SingBox**：社区 GUI，可生成/管理配置并切换节点（第三方项目）

> [!warning]
> 像 S-UI 这类 Web 面板偏向"服务端/多用户节点管理"，不是面向本地客户端的"选节点面板"，请勿混淆。

## 最小可用配置示例

> [!important]
> **版本说明**：以下配置适用于 sing-box 1.11.0+ 版本。
> - 在 1.13.0 版本中，`block` 和 `dns` 类型的 outbound 已被废弃
> - 改用 route rules 的 `action` 字段（如 `reject`、`hijack-dns`）
> - `direct` 类型仍然有效

### 完整配置文件结构（最新版本）

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },

  "dns": {
    "servers": [
      {
        "tag": "google",
        "address": "tls://8.8.8.8"
      },
      {
        "tag": "local",
        "address": "223.5.5.5",
        "detour": "direct"
      }
    ],
    "rules": [
      {
        "geosite": "cn",
        "server": "local"
      }
    ],
    "final": "google"
  },

  "inbounds": [
    {
      "type": "tun",
      "tag": "tun-in",
      "inet4_address": "172.19.0.1/30",
      "inet6_address": "fdfe:dcba:9876::1/126",
      "auto_route": true,
      "strict_route": true,
      "stack": "mixed",
      "sniff": true,
      "sniff_override_destination": true
    }
  ],

  "outbounds": [
    {
      "type": "shadowsocks",
      "tag": "proxy-hk",
      "server": "hk.example.com",
      "server_port": 8388,
      "method": "2022-blake3-aes-256-gcm",
      "password": "your-password",
      "multiplex": {
        "enabled": true,
        "protocol": "h2mux",
        "max_connections": 4
      }
    },
    {
      "type": "trojan",
      "tag": "proxy-us",
      "server": "us.example.com",
      "server_port": 443,
      "password": "your-password",
      "tls": {
        "enabled": true,
        "server_name": "us.example.com",
        "utls": {
          "enabled": true,
          "fingerprint": "chrome"
        }
      }
    },
    {
      "type": "hysteria2",
      "tag": "proxy-jp",
      "server": "jp.example.com",
      "server_port": 443,
      "password": "your-password",
      "tls": {
        "enabled": true,
        "server_name": "jp.example.com"
      }
    },

    {
      "type": "urltest",
      "tag": "auto",
      "outbounds": ["proxy-hk", "proxy-us", "proxy-jp"],
      "url": "https://www.gstatic.com/generate_204",
      "interval": "3m",
      "tolerance": 50,
      "idle_timeout": "30m",
      "interrupt_exist_connections": true
    },

    {
      "type": "selector",
      "tag": "proxy",
      "outbounds": ["auto", "proxy-hk", "proxy-us", "proxy-jp"],
      "default": "auto",
      "interrupt_exist_connections": true
    },

    {
      "type": "direct",
      "tag": "direct"
    }
  ],

  "route": {
    "geoip": {
      "path": "geoip.db",
      "download_url": "https://github.com/SagerNet/sing-geoip/releases/latest/download/geoip.db",
      "download_detour": "proxy"
    },
    "geosite": {
      "path": "geosite.db",
      "download_url": "https://github.com/SagerNet/sing-geosite/releases/latest/download/geosite.db",
      "download_detour": "proxy"
    },
    "rules": [
      {
        "protocol": "dns",
        "action": "hijack-dns"
      },
      {
        "geosite": "cn",
        "geoip": "cn",
        "outbound": "direct"
      },
      {
        "geosite": "category-ads-all",
        "action": "reject"
      }
    ],
    "final": "proxy",
    "auto_detect_interface": true
  },

  "experimental": {
    "clash_api": {
      "external_controller": "127.0.0.1:9090",
      "external_ui": "ui",
      "external_ui_download_url": "https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip",
      "external_ui_download_detour": "proxy",
      "secret": "change-me-to-strong-password",
      "default_mode": "rule",
      "store_mode": true,
      "store_selected": true,
      "store_fakeip": true,
      "cache_file": "cache.db",
      "cache_id": "default"
    }
  }
}
```

### 关键配置说明（最新版本）

#### 1. Selector 出站（节点选择器）

```json
{
  "type": "selector",
  "tag": "proxy",
  "outbounds": ["auto", "proxy-hk", "proxy-us", "proxy-jp"],
  "default": "auto",
  "interrupt_exist_connections": true  // 切换时中断现有连接
}
```

- `selector` 类型的出站就是"节点选择器"
- 把要切换的服务器 tag 都放到 `outbounds` 列表里
- 可以包含其他 selector 或 urltest 组
- `interrupt_exist_connections`：切换节点时是否中断现有连接（推荐开启）

#### 2. URLTest 自动选择

```json
{
  "type": "urltest",
  "tag": "auto",
  "outbounds": ["proxy-hk", "proxy-us", "proxy-jp"],
  "url": "https://www.gstatic.com/generate_204",
  "interval": "3m",
  "tolerance": 50,  // 容忍度（毫秒）
  "idle_timeout": "30m",  // 空闲超时
  "interrupt_exist_connections": true
}
```

- 自动测试节点延迟并选择最快的
- `interval`：测试间隔，默认 3m
- `tolerance`：容忍度，当新节点延迟低于当前节点延迟减去此值时才切换
- `idle_timeout`：空闲超时，默认 30m

#### 3. Clash API 配置（增强版）

```json
"experimental": {
  "clash_api": {
    "external_controller": "127.0.0.1:9090",
    "external_ui": "ui",
    "external_ui_download_url": "https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip",
    "external_ui_download_detour": "proxy",
    "secret": "change-me-to-strong-password",
    "default_mode": "rule",
    "store_mode": true,  // 存储模式设置
    "store_selected": true,  // 存储选择的节点
    "store_fakeip": true,
    "cache_file": "cache.db",  // 缓存文件
    "cache_id": "default"
  }
}
```

- `external_controller`：API 监听地址
- `secret`：API 密钥（安全认证）
- `external_ui`：Web UI 本地路径
- `external_ui_download_url`：自动下载 UI 的地址
- `store_selected`：持久化保存选择的节点
- `cache_file`：缓存数据库文件

## 使用方法

### 启动 sing-box

```bash
# 直接运行
sing-box run -c config.json

# 或作为系统服务
sudo systemctl start sing-box
```

### 访问 Web 面板

1. 浏览器打开：`http://127.0.0.1:9090/ui`
2. 首次访问会自动下载 Yacd-meta 静态页面
3. 在 **Proxies/代理** 页面点选节点
4. 切换立即生效，无需重启

### 使用第三方面板

除了默认的 Yacd-meta，你还可以使用：

- **metacubexd**：功能更丰富的面板
  ```
  http://d.metacubex.one
  ```
  
- **Yacd**：经典面板
  ```
  http://yacd.haishan.me
  ```

连接时输入你的 API 地址和密钥即可。

## 高级配置技巧

### 1. 分组策略（最新版本）

```json
{
  "outbounds": [
    // 香港节点组
    {
      "type": "urltest",
      "tag": "HK-Auto",
      "outbounds": ["HK-1", "HK-2", "HK-3"],
      "url": "https://www.gstatic.com/generate_204",
      "interval": "3m",
      "tolerance": 50
    },
    
    // 美国节点组
    {
      "type": "urltest",
      "tag": "US-Auto",
      "outbounds": ["US-1", "US-2", "US-3"],
      "url": "https://www.gstatic.com/generate_204",
      "interval": "3m",
      "tolerance": 50
    },
    
    // 主选择器
    {
      "type": "selector",
      "tag": "Proxy",
      "outbounds": ["HK-Auto", "US-Auto", "direct"],
      "default": "HK-Auto",
      "interrupt_exist_connections": true
    }
  ]
}
```

### 2. 规则分流（最新版本）

```json
{
  "route": {
    "geoip": {
      "path": "geoip.db",
      "download_url": "https://github.com/SagerNet/sing-geoip/releases/latest/download/geoip.db",
      "download_detour": "proxy"
    },
    "geosite": {
      "path": "geosite.db",
      "download_url": "https://github.com/SagerNet/sing-geosite/releases/latest/download/geosite.db",
      "download_detour": "proxy"
    },
    "rules": [
      // DNS 流量（使用 action 而非 outbound）
      {
        "protocol": "dns",
        "action": "hijack-dns"
      },
      // 国内直连
      {
        "geoip": "cn",
        "geosite": "cn",
        "outbound": "direct"
      },
      // 广告拦截（使用 action 而非 outbound）
      {
        "geosite": "category-ads-all",
        "action": "reject"
      },
      // 流媒体走特定节点
      {
        "geosite": ["netflix", "disney"],
        "outbound": "US-Auto"
      },
      // Telegram
      {
        "geosite": "telegram",
        "geoip": "telegram",
        "outbound": "proxy"
      }
    ],
    "final": "proxy",
    "auto_detect_interface": true
  }
}
```

### 3. 使用 Rule Actions（替代废弃的特殊 outbound）

在 sing-box 1.13.0 中，`block` 和 `dns` 类型的 outbound 已被废弃，改用 rule actions：

```json
{
  "route": {
    "rules": [
      // DNS 处理
      {
        "protocol": "dns",
        "action": "hijack-dns"  // 替代 outbound: "dns-out"
      },
      
      // 直连（两种方式都可以）
      {
        "geosite": "cn",
        "geoip": "cn",
        "outbound": "direct"  // 方式1：引用 direct outbound
      },
      // 或
      {
        "geosite": "cn",
        "geoip": "cn", 
        "action": "route"  // 方式2：使用 route action（更简洁）
      },
      
      // 拒绝流量
      {
        "geosite": "category-ads-all",
        "action": "reject"  // 返回错误（替代 outbound: "block"）
      },
      {
        "geosite": "phishing",
        "action": "reject-drop"  // 静默丢弃，不返回错误
      }
    ]
  }
}
```

#### 完整的 Action 类型：

| Action | 说明 | 替代的 outbound |
|--------|------|----------------|
| `route` | 继续路由匹配或使用指定 outbound | - |
| `reject` | 拒绝连接并返回错误 | `type: "block"` |
| `reject-drop` | 静默丢弃，不返回错误 | `type: "block"` |
| `hijack-dns` | 劫持 DNS 查询 | `type: "dns"` |
| `sniff` | 继续协议嗅探 | - |

> [!tip]
> - `direct` outbound 仍然有效，可以保留用于需要特定配置的场景
> - 简单的直连可以直接用 `action: "route"` 代替
> - 如果你的 sing-box 版本 < 1.11.0，仍需使用旧的 outbound 方式

### 4. DNS 配置（重要）

```json
{
  "dns": {
    "servers": [
      {
        "tag": "google",
        "address": "tls://8.8.8.8",
        "address_resolver": "local",
        "strategy": "ipv4_only"
      },
      {
        "tag": "local",
        "address": "223.5.5.5",
        "detour": "direct"
      },
      {
        "tag": "block",
        "address": "rcode://success"
      }
    ],
    "rules": [
      {
        "geosite": "category-ads-all",
        "server": "block",
        "disable_cache": true
      },
      {
        "geosite": "cn",
        "server": "local"
      },
      {
        "geosite": "geolocation-!cn",
        "server": "google"
      }
    ],
    "final": "google",
    "strategy": "ipv4_only",
    "disable_cache": false,
    "disable_expire": false
  }
}
```

## 常见问题解决

### Q1: 忘记设置 secret 的安全风险

如果把 API 绑定在 `0.0.0.0`，务必设置 `secret`，否则存在安全风险：

```json
{
  "clash_api": {
    "external_controller": "0.0.0.0:9090",  // 危险！
    "secret": "use-very-strong-password-here"  // 必须设置强密码
  }
}
```

### Q2: 首次访问 UI 加载缓慢

首次访问需要下载 UI 资源，可以预先下载并配置本地路径：

```json
{
  "clash_api": {
    "external_ui": "ui",  // 本地 UI 目录
    "external_ui_download_url": "https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip",
    "external_ui_download_detour": "proxy"  // 通过代理下载
  }
}
```

### Q3: 节点切换不生效

检查以下几点：
1. `route.final` 是否指向 selector
2. selector 中是否包含了所有节点
3. Clash API 是否正常运行

### Q4: 移动端配置同步

可以使用远程配置功能：

```json
{
  "providers": {
    "my-config": {
      "type": "remote",
      "path": "https://example.com/config.json",
      "interval": "24h"
    }
  }
}
```

## GUI 客户端配置

### GUI.for.SingBox 使用

1. 下载对应平台的客户端
2. 导入或创建配置文件
3. 在界面中直接切换节点

**优点：**
- 图形化配置生成
- 可视化节点管理
- 支持配置文件导入导出

### 移动端 SFA 配置

1. 安装 sing-box for Android
2. 导入配置文件或扫描二维码
3. 在应用内切换节点和查看日志

**特色功能：**
- 按应用分流
- 电池优化
- 通知栏快捷开关

## 性能优化建议

### 1. 减少不必要的规则

```json
{
  "route": {
    "rule_set": [
      {
        "type": "remote",
        "tag": "geoip-cn",
        "format": "binary",
        "url": "https://example.com/geoip-cn.srs"
      }
    ]
  }
}
```

### 2. 合理设置测试间隔

```json
{
  "type": "urltest",
  "interval": "5m",  // 不要设置太频繁
  "tolerance": 50  // 容差值（ms）
}
```

### 3. 使用缓存

```json
{
  "dns": {
    "cache": {
      "enabled": true,
      "size": 4096
    }
  }
}
```

## 总结

通过合理配置 sing-box 的 selector 和 Clash API，可以实现灵活的节点切换功能。主要优势：

1. **无需重启**：通过 API 实时切换
2. **多种选择**：Web 面板、GUI 客户端、移动端
3. **灵活配置**：支持分组、自动选择、负载均衡
4. **跨平台**：全平台支持

选择适合自己的方案，享受便捷的代理切换体验。记住始终保护好你的 API 密钥，避免配置泄露。