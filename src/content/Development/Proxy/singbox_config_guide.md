# sing-box 配置文件完整教程：从零开始构建你的代理系统

本教程将手把手教你配置 sing-box，从最基础的概念到高级功能，让你能够独立编写和调试配置文件。

## 目录结构

- [基础概念](#基础概念)
- [最小可用配置](#最小可用配置)
- [配置文件结构详解](#配置文件结构详解)
- [逐步构建配置](#逐步构建配置)
- [常见协议配置](#常见协议配置)
- [进阶功能](#进阶功能)
- [调试与优化](#调试与优化)

## 基础概念

### 什么是 sing-box？

sing-box 是一个通用的代理平台，支持多种协议，可以作为客户端或服务端使用。它的配置采用 JSON 格式，主要包含以下核心组件：

```mermaid
graph LR
    A[入站 Inbound] --> B[路由 Route]
    B --> C[出站 Outbound]
    B --> D[DNS]
    D --> C
```

### 核心组件说明

| 组件 | 作用 | 必需 |
|------|------|------|
| **inbounds** | 接收连接的入口（如 tun、http、socks） | ✅ |
| **outbounds** | 发送连接的出口（如 direct、proxy） | ✅ |
| **route** | 决定流量如何转发的规则 | ✅ |
| **dns** | DNS 解析配置 | ❌ |
| **log** | 日志配置 | ❌ |
| **experimental** | 实验性功能（如 Clash API） | ❌ |

## 最小可用配置

让我们从最简单的配置开始：

```json
{
  "log": {
    "level": "info"
  },
  "inbounds": [
    {
      "type": "socks",
      "tag": "socks-in",
      "listen": "127.0.0.1",
      "listen_port": 1080
    }
  ],
  "outbounds": [
    {
      "type": "direct",
      "tag": "direct"
    }
  ]
}
```

这个配置：
1. 在本地 1080 端口开启 SOCKS5 代理
2. 所有流量直连到目标

保存为 `config.json`，运行：
```bash
sing-box run -c config.json
```

## 配置文件结构详解

### 1. 日志配置 (log)

```json
{
  "log": {
    "disabled": false,           // 是否禁用日志
    "level": "info",             // 日志级别：trace/debug/info/warn/error/fatal/panic
    "output": "stderr",          // 输出位置：stderr/文件路径
    "timestamp": true            // 是否显示时间戳
  }
}
```

**日志级别选择：**
- `trace/debug`：调试时使用，信息最详细
- `info`：日常使用，显示基本信息
- `warn/error`：生产环境，只显示问题

### 2. 入站配置 (inbounds)

#### HTTP 代理入站

```json
{
  "type": "http",
  "tag": "http-in",
  "listen": "127.0.0.1",
  "listen_port": 8080,
  "users": [                     // 可选：HTTP 认证
    {
      "username": "user",
      "password": "pass"
    }
  ],
  "set_system_proxy": false      // 是否设置为系统代理
}
```

#### SOCKS5 代理入站

```json
{
  "type": "socks",
  "tag": "socks-in",
  "listen": "0.0.0.0",          // 监听所有接口
  "listen_port": 1080,
  "users": [                     // 可选：SOCKS5 认证
    {
      "username": "user",
      "password": "pass"
    }
  ]
}
```

#### TUN 透明代理入站（推荐）

```json
{
  "type": "tun",
  "tag": "tun-in",
  "inet4_address": "172.19.0.1/30",      // IPv4 地址
  "inet6_address": "fdfe:dcba:9876::1/126", // IPv6 地址
  "mtu": 9000,                           // MTU 值
  "auto_route": true,                    // 自动配置路由
  "strict_route": true,                  // 严格路由（防止泄露）
  "stack": "mixed",                      // 网络栈：system/gvisor/mixed
  "sniff": true,                        // 协议嗅探
  "sniff_override_destination": true    // 使用嗅探结果覆盖目标
}
```

### 3. 出站配置 (outbounds)

#### Direct 直连出站

```json
{
  "type": "direct",
  "tag": "direct",
  "tcp_fast_open": true,           // TCP 快速打开
  "tcp_multi_path": false,         // MPTCP
  "udp_fragment": false,           // UDP 分片
  "domain_strategy": "prefer_ipv4" // 域名策略：prefer_ipv4/prefer_ipv6/ipv4_only/ipv6_only
}
```

#### Shadowsocks 出站

```json
{
  "type": "shadowsocks",
  "tag": "ss-proxy",
  "server": "example.com",
  "server_port": 8388,
  "method": "2022-blake3-aes-256-gcm",  // 加密方法
  "password": "your-password",
  "multiplex": {                        // 多路复用（可选）
    "enabled": true,
    "protocol": "h2mux",                // smux/yamux/h2mux
    "max_connections": 4,
    "min_streams": 4,
    "max_streams": 0,
    "padding": false
  }
}
```

#### Trojan 出站

```json
{
  "type": "trojan",
  "tag": "trojan-proxy",
  "server": "example.com",
  "server_port": 443,
  "password": "your-password",
  "tls": {
    "enabled": true,
    "server_name": "example.com",
    "insecure": false,              // 是否跳过证书验证
    "alpn": ["h2", "http/1.1"],    // ALPN 协议
    "utls": {                        // uTLS 指纹伪装（可选）
      "enabled": true,
      "fingerprint": "chrome"        // chrome/firefox/edge/safari/360/qq/ios/android/random
    }
  }
}
```

#### VMess 出站

```json
{
  "type": "vmess",
  "tag": "vmess-proxy",
  "server": "example.com",
  "server_port": 443,
  "uuid": "your-uuid",
  "security": "auto",               // auto/aes-128-gcm/chacha20-poly1305/none
  "alter_id": 0,
  "global_padding": false,
  "authenticated_length": true,
  "tls": {
    "enabled": true,
    "server_name": "example.com"
  },
  "transport": {                    // 传输层配置（可选）
    "type": "ws",                   // ws/http/quic/grpc
    "path": "/ws",
    "headers": {
      "Host": "example.com"
    }
  }
}
```

#### Hysteria2 出站

```json
{
  "type": "hysteria2",
  "tag": "hy2-proxy",
  "server": "example.com",
  "server_port": 443,
  "up_mbps": 100,                  // 上传带宽
  "down_mbps": 100,                // 下载带宽
  "password": "your-password",
  "tls": {
    "enabled": true,
    "server_name": "example.com",
    "alpn": ["h3"]
  }
}
```

#### 选择器出站（重要）

```json
{
  "type": "selector",
  "tag": "proxy",
  "outbounds": ["auto", "ss-proxy", "trojan-proxy", "direct"],
  "default": "auto",
  "interrupt_exist_connections": true
}
```

#### 自动选择出站

```json
{
  "type": "urltest",
  "tag": "auto",
  "outbounds": ["ss-proxy", "trojan-proxy", "vmess-proxy"],
  "url": "https://www.gstatic.com/generate_204",
  "interval": "3m",
  "tolerance": 50,
  "idle_timeout": "30m"
}
```

### 4. DNS 配置

```json
{
  "dns": {
    "servers": [
      {
        "tag": "google",
        "address": "tls://8.8.8.8",
        "address_resolver": "local",    // 用于解析 DNS 服务器地址的 DNS
        "address_strategy": "ipv4_only",
        "strategy": "ipv4_only",
        "detour": "proxy"               // 通过哪个出站查询
      },
      {
        "tag": "local",
        "address": "223.5.5.5",
        "detour": "direct"
      },
      {
        "tag": "block",
        "address": "rcode://success"    // 返回成功但无结果（用于屏蔽）
      }
    ],
    "rules": [
      {
        "domain": ["example.com"],      // 精确匹配域名
        "server": "local"
      },
      {
        "domain_suffix": [".cn"],       // 域名后缀匹配
        "server": "local"
      },
      {
        "domain_keyword": ["google"],   // 域名关键词
        "server": "google"
      },
      {
        "domain_regex": ["^ad\\."],     // 正则匹配
        "server": "block"
      },
      {
        "geosite": "cn",                // 地理站点
        "server": "local"
      },
      {
        "geosite": "category-ads-all",
        "server": "block",
        "disable_cache": true           // 禁用缓存
      }
    ],
    "final": "google",                  // 默认 DNS 服务器
    "strategy": "ipv4_only",            // 查询策略
    "disable_cache": false,
    "disable_expire": false,
    "independent_cache": false,
    "reverse_mapping": false,
    "fakeip": {                         // FakeIP 配置（可选）
      "enabled": false,
      "inet4_range": "198.18.0.0/15",
      "inet6_range": "fc00::/18"
    }
  }
}
```

### 5. 路由配置

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
      // 协议规则
      {
        "protocol": "dns",
        "action": "hijack-dns"          // DNS 劫持
      },
      {
        "protocol": ["quic"],
        "action": "reject"               // 拒绝 QUIC
      },
      
      // IP 规则
      {
        "ip_cidr": ["192.168.0.0/16", "10.0.0.0/8"],
        "outbound": "direct"
      },
      {
        "geoip": "private",
        "outbound": "direct"
      },
      
      // 域名规则
      {
        "domain": ["example.com"],
        "outbound": "direct"
      },
      {
        "domain_suffix": [".cn", ".中国"],
        "outbound": "direct"
      },
      {
        "domain_keyword": ["google", "youtube"],
        "outbound": "proxy"
      },
      {
        "domain_regex": ["^ad\\.", "^ads\\."],
        "action": "reject"
      },
      
      // 地理规则
      {
        "geosite": "cn",
        "geoip": "cn",
        "outbound": "direct"
      },
      {
        "geosite": ["netflix", "disney"],
        "outbound": "proxy"
      },
      {
        "geosite": "category-ads-all",
        "action": "reject"
      },
      
      // 端口规则
      {
        "port": [80, 443],
        "network": "tcp",
        "outbound": "proxy"
      },
      {
        "port_range": ["8000:8999"],
        "outbound": "direct"
      },
      
      // 进程规则（仅支持部分平台）
      {
        "process_name": ["telegram.exe", "Telegram"],
        "outbound": "proxy"
      },
      
      // 其他规则
      {
        "source_ip_cidr": ["192.168.1.100/32"],
        "outbound": "proxy"              // 特定源 IP
      },
      {
        "inbound": ["tun-in"],
        "outbound": "proxy"              // 特定入站
      },
      {
        "clash_mode": "global",         // Clash 模式
        "outbound": "proxy"
      }
    ],
    "final": "proxy",                   // 默认出站
    "auto_detect_interface": true,      // 自动检测接口
    "override_android_vpn": false,      // 覆盖 Android VPN
    "default_mark": 233                 // 默认标记（Linux）
  }
}
```

## 逐步构建配置

### 第一步：基础代理配置

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "mixed",
      "tag": "mixed-in",
      "listen": "127.0.0.1",
      "listen_port": 2080
    }
  ],
  "outbounds": [
    {
      "type": "shadowsocks",
      "tag": "proxy",
      "server": "your-server.com",
      "server_port": 8388,
      "method": "2022-blake3-aes-256-gcm",
      "password": "your-password"
    },
    {
      "type": "direct",
      "tag": "direct"
    }
  ],
  "route": {
    "rules": [
      {
        "geoip": "private",
        "outbound": "direct"
      }
    ],
    "final": "proxy"
  }
}
```

### 第二步：添加 DNS 配置

```json
{
  // ... 前面的配置
  "dns": {
    "servers": [
      {
        "tag": "google",
        "address": "tls://8.8.8.8",
        "detour": "proxy"
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
  }
}
```

### 第三步：添加分流规则

```json
{
  // ... 前面的配置
  "route": {
    "geoip": {
      "download_url": "https://github.com/SagerNet/sing-geoip/releases/latest/download/geoip.db"
    },
    "geosite": {
      "download_url": "https://github.com/SagerNet/sing-geosite/releases/latest/download/geosite.db"
    },
    "rules": [
      {
        "protocol": "dns",
        "action": "hijack-dns"
      },
      {
        "geoip": "private",
        "outbound": "direct"
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
    "final": "proxy"
  }
}
```

### 第四步：添加多节点和选择器

```json
{
  // ... 前面的配置
  "outbounds": [
    // 多个代理节点
    {
      "type": "shadowsocks",
      "tag": "ss-hk",
      "server": "hk.example.com",
      "server_port": 8388,
      "method": "2022-blake3-aes-256-gcm",
      "password": "password"
    },
    {
      "type": "trojan",
      "tag": "trojan-us",
      "server": "us.example.com",
      "server_port": 443,
      "password": "password",
      "tls": {
        "enabled": true,
        "server_name": "us.example.com"
      }
    },
    
    // 自动选择
    {
      "type": "urltest",
      "tag": "auto",
      "outbounds": ["ss-hk", "trojan-us"],
      "url": "https://www.gstatic.com/generate_204",
      "interval": "3m"
    },
    
    // 手动选择
    {
      "type": "selector",
      "tag": "proxy",
      "outbounds": ["auto", "ss-hk", "trojan-us", "direct"],
      "default": "auto"
    },
    
    {
      "type": "direct",
      "tag": "direct"
    }
  ]
}
```

### 第五步：添加 Clash API（可选）

```json
{
  // ... 前面的配置
  "experimental": {
    "clash_api": {
      "external_controller": "127.0.0.1:9090",
      "external_ui": "ui",
      "external_ui_download_url": "https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip",
      "external_ui_download_detour": "proxy",
      "secret": "your-secret-password",
      "default_mode": "rule",
      "store_mode": true,
      "store_selected": true,
      "cache_file": "cache.db",
      "cache_id": "default"
    }
  }
}
```

## 完整配置示例

### 客户端完整配置

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
        "address": "tls://8.8.8.8",
        "address_resolver": "local",
        "strategy": "ipv4_only",
        "detour": "proxy"
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
  },
  
  "inbounds": [
    {
      "type": "tun",
      "tag": "tun-in",
      "inet4_address": "172.19.0.1/30",
      "inet6_address": "fdfe:dcba:9876::1/126",
      "mtu": 9000,
      "auto_route": true,
      "strict_route": true,
      "stack": "mixed",
      "sniff": true,
      "sniff_override_destination": true
    }
  ],
  
  "outbounds": [
    // 代理节点
    {
      "type": "shadowsocks",
      "tag": "ss-hk",
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
      "tag": "trojan-us",
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
      "tag": "hy2-jp",
      "server": "jp.example.com",
      "server_port": 443,
      "password": "your-password",
      "tls": {
        "enabled": true,
        "server_name": "jp.example.com"
      }
    },
    
    // 分组
    {
      "type": "urltest",
      "tag": "auto",
      "outbounds": ["ss-hk", "trojan-us", "hy2-jp"],
      "url": "https://www.gstatic.com/generate_204",
      "interval": "3m",
      "tolerance": 50
    },
    {
      "type": "selector",
      "tag": "proxy",
      "outbounds": ["auto", "ss-hk", "trojan-us", "hy2-jp"],
      "default": "auto",
      "interrupt_exist_connections": true
    },
    {
      "type": "selector",
      "tag": "streaming",
      "outbounds": ["proxy", "ss-hk", "trojan-us", "hy2-jp"],
      "default": "proxy"
    },
    
    // 基础
    {
      "type": "direct",
      "tag": "direct"
    },
    {
      "type": "block",
      "tag": "block"
    },
    {
      "type": "dns",
      "tag": "dns-out"
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
      // 协议规则
      {
        "protocol": "dns",
        "action": "hijack-dns"
      },
      {
        "protocol": "quic",
        "action": "reject"
      },
      
      // 广告拦截
      {
        "geosite": "category-ads-all",
        "action": "reject"
      },
      
      // 直连规则
      {
        "geoip": "private",
        "outbound": "direct"
      },
      {
        "geosite": "cn",
        "geoip": "cn",
        "outbound": "direct"
      },
      
      // 流媒体
      {
        "geosite": ["netflix", "disney", "youtube"],
        "outbound": "streaming"
      },
      
      // 代理规则
      {
        "geosite": "geolocation-!cn",
        "outbound": "proxy"
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
      "secret": "change-me",
      "default_mode": "rule",
      "store_mode": true,
      "store_selected": true,
      "cache_file": "cache.db"
    }
  }
}
```

## 进阶功能

### 1. 规则集 (Rule Set)

```json
{
  "route": {
    "rule_set": [
      {
        "tag": "geoip-cn",
        "type": "remote",
        "format": "binary",
        "url": "https://example.com/geoip-cn.srs",
        "download_detour": "proxy",
        "update_interval": "7d"
      },
      {
        "tag": "custom-direct",
        "type": "local",
        "format": "source",
        "path": "direct.json"
      }
    ],
    "rules": [
      {
        "rule_set": ["geoip-cn", "custom-direct"],
        "outbound": "direct"
      }
    ]
  }
}
```

### 2. 多入站配置

```json
{
  "inbounds": [
    {
      "type": "tun",
      "tag": "tun-in",
      "inet4_address": "172.19.0.1/30",
      "auto_route": true
    },
    {
      "type": "http",
      "tag": "http-in",
      "listen": "127.0.0.1",
      "listen_port": 8080
    },
    {
      "type": "socks",
      "tag": "socks-in",
      "listen": "127.0.0.1",
      "listen_port": 1080
    }
  ]
}
```

### 3. 链式代理

```json
{
  "outbounds": [
    {
      "type": "shadowsocks",
      "tag": "ss-1",
      "server": "server1.com",
      "server_port": 8388,
      "method": "2022-blake3-aes-256-gcm",
      "password": "password1",
      "detour": "ss-2"  // 通过 ss-2 连接
    },
    {
      "type": "shadowsocks",
      "tag": "ss-2",
      "server": "server2.com",
      "server_port": 8388,
      "method": "2022-blake3-aes-256-gcm",
      "password": "password2"
    }
  ]
}
```

### 4. 负载均衡

```json
{
  "outbounds": [
    {
      "type": "loadbalance",
      "tag": "balance",
      "outbounds": ["proxy-1", "proxy-2", "proxy-3"],
      "strategy": "round_robin",  // round_robin/random/consistent_hash
      "check": {
        "interval": "30s",
        "sampling": 3,
        "destination": "https://www.gstatic.com/generate_204"
      }
    }
  ]
}
```

## 调试与优化

### 1. 检查配置

```bash
# 检查配置文件语法
sing-box check -c config.json

# 格式化配置文件
sing-box format -c config.json > formatted.json

# 合并多个配置文件
sing-box merge config1.json config2.json > merged.json
```

### 2. 日志调试

```json
{
  "log": {
    "level": "debug",  // 调试时使用 debug
    "output": "sing-box.log",
    "timestamp": true
  }
}
```

### 3. 性能优化

#### DNS 优化

```json
{
  "dns": {
    "servers": [
      {
        "tag": "google",
        "address": "https://dns.google/dns-query",  // DoH 更快
        "strategy": "ipv4_only",
        "detour": "proxy"
      }
    ],
    "disable_cache": false,
    "cache_size": 4096  // 增大缓存
  }
}
```

#### 连接优化

```json
{
  "outbounds": [
    {
      "type": "shadowsocks",
      "tag": "proxy",
      // ... 其他配置
      "tcp_fast_open": true,      // TCP 快速打开
      "tcp_keep_alive_interval": "30s",  // Keep-alive
      "multiplex": {
        "enabled": true,
        "protocol": "h2mux",
        "max_connections": 8,      // 增加连接数
        "min_streams": 4,
        "max_streams": 0
      }
    }
  ]
}
```

### 4. 常见问题排查

#### 问题：DNS 泄露

```json
{
  "route": {
    "rules": [
      {
        "protocol": "dns",
        "action": "hijack-dns"  // 确保 DNS 被劫持
      }
    ]
  },
  "dns": {
    "servers": [
      {
        "tag": "secure",
        "address": "tls://8.8.8.8",
        "detour": "proxy"  // DNS 查询走代理
      }
    ]
  }
}
```

#### 问题：TUN 模式无法启动

```bash
# Linux/macOS：需要 root 权限
sudo sing-box run -c config.json

# 或设置 CAP_NET_ADMIN 权限
sudo setcap cap_net_admin=+ep $(which sing-box)
```

#### 问题：流媒体无法访问

```json
{
  "route": {
    "rules": [
      {
        "geosite": ["netflix", "disney"],
        "outbound": "streaming"  // 使用专门的流媒体节点
      }
    ]
  }
}
```

## 配置模板

### 最简模板

```json
{
  "log": {"level": "info"},
  "inbounds": [
    {"type": "socks", "listen": "127.0.0.1", "listen_port": 1080}
  ],
  "outbounds": [
    {"type": "direct", "tag": "direct"}
  ]
}
```

### 推荐模板

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "dns": {
    "servers": [
      {"tag": "remote", "address": "tls://8.8.8.8", "detour": "proxy"},
      {"tag": "local", "address": "223.5.5.5", "detour": "direct"}
    ],
    "rules": [
      {"geosite": "cn", "server": "local"}
    ],
    "final": "remote"
  },
  "inbounds": [
    {
      "type": "tun",
      "inet4_address": "172.19.0.1/30",
      "auto_route": true,
      "sniff": true
    }
  ],
  "outbounds": [
    {"type": "selector", "tag": "proxy", "outbounds": ["auto", "direct"]},
    {"type": "urltest", "tag": "auto", "outbounds": ["node1", "node2"]},
    {"type": "shadowsocks", "tag": "node1", /* ... */},
    {"type": "trojan", "tag": "node2", /* ... */},
    {"type": "direct", "tag": "direct"}
  ],
  "route": {
    "rules": [
      {"geoip": "private", "outbound": "direct"},
      {"geosite": "cn", "outbound": "direct"},
      {"geosite": "category-ads", "action": "reject"}
    ],
    "final": "proxy"
  }
}
```

## 最佳实践

### 1. 配置组织

```
sing-box/
├── config.json          # 主配置
├── rules/              # 规则文件夹
│   ├── direct.json     # 直连规则
│   ├── proxy.json      # 代理规则
│   └── block.json      # 拦截规则
├── geoip.db           # IP 数据库
├── geosite.db         # 站点数据库
└── cache.db           # 缓存数据库
```

### 2. 安全建议

- 使用强密码和最新的加密方法
- 启用 TLS 验证 (`"insecure": false`)
- 定期更新 geo 数据库
- 使用 `strict_route` 防止流量泄露
- 设置 Clash API 密码

### 3. 性能建议

- 使用 `h2mux` 或 `yamux` 多路复用
- 启用 TCP Fast Open
- 合理设置 DNS 缓存
- 使用 `geoip`/`geosite` 而非大量域名规则
- 定期清理缓存文件

### 4. 维护建议

- 定期测试节点可用性
- 监控日志中的错误
- 备份配置文件
- 使用版本控制管理配置

## 总结

sing-box 的配置虽然看起来复杂，但遵循以下原则就能轻松掌握：

1. **从简单开始**：先配置最基础的功能，确保能用
2. **逐步添加**：根据需求逐步添加 DNS、路由规则等
3. **善用工具**：使用 `check`、`format` 等命令辅助
4. **参考文档**：官方文档是最权威的参考
5. **多做测试**：每次修改后都要测试确认

记住，没有完美的配置，只有最适合你的配置。根据自己的需求不断调整优化，才能获得最佳体验。
