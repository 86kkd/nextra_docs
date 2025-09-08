# sing-box 代理系统完整指南

本文档是 sing-box 代理系统的综合指南，整合了客户端配置、服务端部署、流量管理、协议解析等所有内容。

## 📚 快速导航

- [基础概念](#基础概念) - 了解 sing-box 核心架构
- [客户端配置](#客户端配置) - 从零开始配置客户端
- [服务端部署](#服务端部署) - 搭建各种协议服务器
- [节点管理](#节点管理) - UI面板与节点切换
- [流量控制](#流量控制) - 多用户与流量限制
- [高级协议](#高级协议) - Reality、Hysteria2 等新协议
- [工具与脚本](#工具与脚本) - 配置生成器和自动化工具

---

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

| 组件 | 作用 | 必需 | 说明 |
|------|------|------|------|
| **inbounds** | 接收连接的入口 | ✅ | 如 tun、http、socks |
| **outbounds** | 发送连接的出口 | ✅ | 如 direct、proxy、selector |
| **route** | 流量路由规则 | ✅ | 决定流量如何转发 |
| **dns** | DNS 解析配置 | ❌ | 建议配置以优化解析 |
| **log** | 日志配置 | ❌ | 调试时很有用 |
| **experimental** | 实验性功能 | ❌ | Clash API、缓存等 |

### 版本重要变化

| 版本 | 重要变化 | 影响 |
|------|---------|------|
| < 1.8.0 | 传统配置结构 | clash_api 和 cache_file 在同一级 |
| 1.8.0+ | 配置结构调整 | cache_file 从 clash_api 中分离 |
| 1.11.0+ | 引入 rule actions | 支持不依赖 outbound 的处理方式 |
| 1.13.0+ | 废弃特殊 outbound | `block` 和 `dns` 类型被移除 |

---

## 客户端配置

### 最小可用配置

从最简单的配置开始：

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

### 完整客户端配置（带节点切换）

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
  },
  
  "inbounds": [
    {
      "type": "tun",
      "tag": "tun-in",
      "inet4_address": "172.19.0.1/30",
      "auto_route": true,
      "strict_route": true,
      "sniff": true,
      "sniff_override_destination": true
    }
  ],
  
  "outbounds": [
    {
      "type": "selector",
      "tag": "proxy",
      "outbounds": ["auto", "hk-1", "us-1", "jp-1", "direct"],
      "default": "auto"
    },
    {
      "type": "urltest",
      "tag": "auto",
      "outbounds": ["hk-1", "us-1", "jp-1"],
      "url": "https://www.gstatic.com/generate_204",
      "interval": "3m",
      "tolerance": 50
    },
    {
      "type": "trojan",
      "tag": "hk-1",
      "server": "hk.example.com",
      "server_port": 443,
      "password": "your-password",
      "tls": {
        "enabled": true,
        "server_name": "hk.example.com"
      }
    },
    {
      "type": "direct",
      "tag": "direct"
    }
  ],
  
  "route": {
    "rules": [
      {
        "protocol": "dns",
        "action": "hijack-dns"
      },
      {
        "geosite": "category-ads-all",
        "action": "reject"
      },
      {
        "geosite": "cn",
        "geoip": "cn",
        "outbound": "direct"
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
      "secret": "your-api-secret"
    },
    "cache_file": {
      "enabled": true,
      "path": "cache.db"
    }
  }
}
```

### TUN 模式详解

TUN 模式可以接管系统所有流量，实现真正的全局代理：

```json
{
  "type": "tun",
  "tag": "tun-in",
  
  // 网络配置
  "inet4_address": "172.19.0.1/30",  // IPv4 地址
  "inet6_address": "fdfe:dcba:9876::1/126",  // IPv6 地址（可选）
  
  // 路由配置
  "auto_route": true,           // 自动配置系统路由
  "strict_route": true,         // 严格路由（防止流量泄露）
  
  // 流量嗅探
  "sniff": true,                // 启用协议嗅探
  "sniff_override_destination": true,  // 使用嗅探结果覆盖目标
  
  // 平台特定
  "stack": "system",            // 网络栈：system/gvisor/mixed
  "mtu": 9000,                  // 最大传输单元
  
  // Windows 特定
  "platform": {
    "http_proxy": {
      "enabled": true,
      "server": "127.0.0.1",
      "server_port": 7890
    }
  }
}
```

#### TUN 模式权限要求

**Linux:**
```bash
# 方法1：使用 capabilities
sudo setcap cap_net_admin=eip /usr/local/bin/sing-box

# 方法2：使用 root 运行
sudo sing-box run -c config.json
```

**macOS:**
```bash
# 需要 root 权限
sudo sing-box run -c config.json
```

**Windows:**
```powershell
# 以管理员身份运行
sing-box run -c config.json
```

---

## 服务端部署

### 系统要求与安装

#### 系统要求
- **操作系统**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- **CPU**: 1 核心以上
- **内存**: 512MB 以上
- **网络**: 具有公网 IP 的 VPS

#### 快速安装

```bash
# 使用官方安装脚本
bash <(curl -fsSL https://sing-box.app/deb-install.sh)

# 验证安装
sing-box version

# 创建配置目录
mkdir -p /etc/sing-box
```

### Reality 服务端（最新推荐）

Reality 是最新的伪装协议，能够完美模拟标准 TLS 1.3 流量：

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "vless",
      "tag": "vless-reality",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "uuid": "8d5c4a2e-3f5b-4c1d-a8b9-7e6f5d4c3b2a",
          "flow": "xtls-rprx-vision"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "www.microsoft.com",
        "reality": {
          "enabled": true,
          "handshake": {
            "server": "www.microsoft.com",
            "server_port": 443
          },
          "private_key": "YOUR_PRIVATE_KEY",
          "short_id": [
            "0123456789abcdef"
          ]
        }
      }
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

生成 Reality 密钥对：
```bash
sing-box generate reality-keypair
```

### Hysteria2 服务端（UDP优化）

Hysteria2 基于 QUIC，适合高延迟、高丢包环境：

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "hysteria2",
      "tag": "hysteria2-in",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "name": "user1",
          "password": "your-password"
        }
      ],
      "masquerade": "https://www.bing.com",
      "tls": {
        "enabled": true,
        "alpn": ["h3"],
        "certificate_path": "/etc/letsencrypt/live/your-domain.com/fullchain.pem",
        "key_path": "/etc/letsencrypt/live/your-domain.com/privkey.pem"
      }
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

### Trojan 服务端（经典稳定）

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "trojan",
      "tag": "trojan-in",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "name": "user1",
          "password": "your-strong-password"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "your-domain.com",
        "certificate_path": "/etc/letsencrypt/live/your-domain.com/fullchain.pem",
        "key_path": "/etc/letsencrypt/live/your-domain.com/privkey.pem"
      },
      "fallback": {
        "server": "127.0.0.1",
        "server_port": 80
      },
      "multiplex": {
        "enabled": true,
        "padding": false
      }
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

### TUIC v5 服务端（最新UDP协议）

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "tuic",
      "tag": "tuic-in",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "uuid": "8d5c4a2e-3f5b-4c1d-a8b9-7e6f5d4c3b2a",
          "password": "your-password"
        }
      ],
      "congestion_control": "bbr",
      "zero_rtt_handshake": true,
      "tls": {
        "enabled": true,
        "alpn": ["h3"],
        "certificate_path": "/etc/letsencrypt/live/your-domain.com/fullchain.pem",
        "key_path": "/etc/letsencrypt/live/your-domain.com/privkey.pem"
      }
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

### 证书申请与管理

```bash
# 安装 certbot
apt install -y certbot

# 申请证书（确保80端口未被占用）
certbot certonly --standalone \
  -d your-domain.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# 设置自动续期
crontab -e
# 添加：0 2 * * * certbot renew --quiet && systemctl restart sing-box
```

### 系统服务配置

创建 `/etc/systemd/system/sing-box.service`：

```ini
[Unit]
Description=sing-box service
Documentation=https://sing-box.sagernet.org
After=network.target nss-lookup.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/sing-box run -c /etc/sing-box/config.json
Restart=on-failure
RestartSec=10
LimitNOFILE=infinity

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
systemctl daemon-reload
systemctl enable sing-box
systemctl start sing-box
systemctl status sing-box
```

---

## 节点管理

### Web UI 配置

sing-box 支持通过 Clash API 使用各种 Web UI：

#### 推荐的 UI 面板

1. **Yacd-meta**（功能最全）
   - 地址：http://yacd.metacubex.one
   - 特点：支持规则测试、连接查看、日志

2. **metacubexd**（现代化设计）
   - 地址：http://d.metacubex.one
   - 特点：界面美观、支持深色模式

3. **Clash Dashboard**（经典）
   - 地址：http://clash.razord.top
   - 特点：简洁稳定

#### 启用 Clash API

在配置文件中添加：

```json
{
  "experimental": {
    "clash_api": {
      "external_controller": "127.0.0.1:9090",
      "external_ui": "ui",
      "external_ui_download_url": "https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip",
      "external_ui_download_detour": "proxy",
      "secret": "your-secret-key",
      "default_mode": "rule"
    }
  }
}
```

访问 UI：
1. 打开浏览器访问 http://127.0.0.1:9090/ui
2. 或访问在线面板，输入：
   - 地址：http://127.0.0.1:9090
   - 密钥：your-secret-key

### 节点选择器配置

使用 `selector` 类型的 outbound 实现节点切换：

```json
{
  "outbounds": [
    {
      "type": "selector",
      "tag": "proxy",
      "outbounds": ["auto", "🇭🇰 香港", "🇺🇸 美国", "🇯🇵 日本", "direct"],
      "default": "auto",
      "interrupt_exist_connections": true
    },
    {
      "type": "urltest",
      "tag": "auto",
      "outbounds": ["🇭🇰 香港", "🇺🇸 美国", "🇯🇵 日本"],
      "url": "https://www.gstatic.com/generate_204",
      "interval": "3m",
      "tolerance": 50
    }
  ]
}
```

### 订阅服务配置

使用 Cloudflare Workers 创建订阅服务：

```javascript
// worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  
  // 验证订阅密钥
  if (key !== 'your-subscription-key') {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // 配置内容
  const config = {
    "log": { "level": "info" },
    "outbounds": [
      {
        "type": "trojan",
        "tag": "香港-01",
        "server": "hk1.example.com",
        "server_port": 443,
        "password": "password1",
        "tls": { "enabled": true }
      },
      {
        "type": "trojan", 
        "tag": "美国-01",
        "server": "us1.example.com",
        "server_port": 443,
        "password": "password2",
        "tls": { "enabled": true }
      }
    ]
  }
  
  return new Response(JSON.stringify(config, null, 2), {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'cache-control': 'no-cache'
    }
  })
}
```

---

## 流量控制

### 多用户配置

在单个入站中配置多用户：

```json
{
  "inbounds": [
    {
      "type": "trojan",
      "tag": "trojan-in",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "name": "user1",
          "password": "password1"
        },
        {
          "name": "user2",
          "password": "password2"
        },
        {
          "name": "user3",
          "password": "password3"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "your-domain.com",
        "certificate_path": "/path/to/cert.pem",
        "key_path": "/path/to/key.pem"
      }
    }
  ]
}
```

### 流量统计与限制

#### 启用统计功能

```json
{
  "stats": {
    "enabled": true,
    "inbounds": ["trojan-in"],
    "outbounds": ["direct"],
    "users": ["user1", "user2", "user3"]
  }
}
```

#### 流量监控脚本

创建 `/opt/singbox-traffic/monitor.py`：

```python
#!/usr/bin/env python3
import json
import sqlite3
import subprocess
import time
from datetime import datetime

class TrafficMonitor:
    def __init__(self):
        self.db_path = "/opt/singbox-traffic/traffic.db"
        self.config_path = "/etc/sing-box/config.json"
        self.init_database()
    
    def init_database(self):
        """初始化数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 用户表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password TEXT NOT NULL,
                monthly_quota INTEGER DEFAULT 100,  -- GB
                status TEXT DEFAULT 'active'
            )
        ''')
        
        # 流量记录表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS traffic_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                upload_bytes INTEGER DEFAULT 0,
                download_bytes INTEGER DEFAULT 0,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def check_quota(self, username):
        """检查用户配额"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 获取本月使用量
        cursor.execute('''
            SELECT SUM(upload_bytes + download_bytes) as total
            FROM traffic_logs
            WHERE username = ? 
            AND strftime('%Y-%m', timestamp) = strftime('%Y-%m', 'now')
        ''', (username,))
        
        monthly_used = cursor.fetchone()[0] or 0
        monthly_used_gb = monthly_used / (1024**3)
        
        # 获取配额
        cursor.execute('SELECT monthly_quota FROM users WHERE username = ?', (username,))
        quota = cursor.fetchone()
        
        if quota and monthly_used_gb >= quota[0]:
            self.disable_user(username)
            return False
        
        conn.close()
        return True
    
    def disable_user(self, username):
        """禁用超额用户"""
        # 更新数据库状态
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET status = 'disabled' WHERE username = ?", (username,))
        conn.commit()
        conn.close()
        
        # 更新配置文件并重启服务
        self.update_config()
        subprocess.run(["systemctl", "restart", "sing-box"])

if __name__ == "__main__":
    monitor = TrafficMonitor()
    # 主循环监控逻辑
```

### 用户配额策略

```python
QUOTA_POLICIES = {
    'free': {
        'monthly_quota': 10,      # 10GB/月
        'speed_limit': 1024,       # 1MB/s
        'concurrent_connections': 2
    },
    'basic': {
        'monthly_quota': 100,      # 100GB/月
        'speed_limit': 5120,       # 5MB/s
        'concurrent_connections': 5
    },
    'premium': {
        'monthly_quota': 500,      # 500GB/月
        'speed_limit': 10240,      # 10MB/s
        'concurrent_connections': 10
    }
}
```

---

## 高级协议

### VLESS + VISION + Reality 组合

这是目前最先进的协议组合，提供最强的抗检测能力：

#### 核心优势

1. **VLESS**：轻量级数据传输
   - 无状态设计
   - UUID 认证
   - 高性能

2. **VISION**：解决 TLS-in-TLS 问题
   - 智能流控
   - 零拷贝转发
   - 降低特征

3. **Reality**：完美 TLS 伪装
   - 模拟真实 TLS 1.3
   - 无需真实证书
   - 动态指纹

#### 服务端配置

```json
{
  "inbounds": [
    {
      "type": "vless",
      "tag": "vless-reality",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "uuid": "8d5c4a2e-3f5b-4c1d-a8b9-7e6f5d4c3b2a",
          "flow": "xtls-rprx-vision"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "www.microsoft.com",
        "reality": {
          "enabled": true,
          "handshake": {
            "server": "www.microsoft.com",
            "server_port": 443
          },
          "private_key": "YOUR_PRIVATE_KEY",
          "short_id": ["0123456789abcdef"]
        }
      }
    }
  ]
}
```

### 协议选择建议

| 场景 | 推荐协议 | 理由 |
|------|----------|------|
| 最强抗检测 | VLESS+Reality | 完美伪装，无特征 |
| 高延迟环境 | Hysteria2 | QUIC基础，优化传输 |
| 稳定可靠 | Trojan | 成熟稳定，兼容性好 |
| UDP 游戏 | TUIC v5 | 原生UDP，低延迟 |
| 简单部署 | VMess+WS+TLS | CDN支持，易配置 |

---

## 工具与脚本

### 在线配置生成器

访问配置生成器：
- 地址：`/tools/config-generator.html`
- 功能：
  - 自动生成强密码
  - 批量配置生成
  - 一键下载配置
  - 包含安装脚本

### 一键部署脚本

```bash
#!/bin/bash
# sing-box 一键部署脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}sing-box 一键部署脚本${NC}"

# 检查系统
if [[ ! -f /etc/debian_version && ! -f /etc/redhat-release ]]; then
    echo -e "${RED}不支持的系统${NC}"
    exit 1
fi

# 安装 sing-box
echo -e "${YELLOW}正在安装 sing-box...${NC}"
bash <(curl -fsSL https://sing-box.app/deb-install.sh)

# 申请证书
read -p "输入域名: " domain
read -p "输入邮箱: " email

certbot certonly --standalone \
    -d $domain \
    --email $email \
    --agree-tos \
    --non-interactive

# 生成配置
echo -e "${YELLOW}正在生成配置...${NC}"
cat > /etc/sing-box/config.json << EOF
{
  "log": {"level": "info"},
  "inbounds": [{
    "type": "trojan",
    "listen": "::",
    "listen_port": 443,
    "users": [{
      "password": "$(openssl rand -base64 32)"
    }],
    "tls": {
      "enabled": true,
      "server_name": "$domain",
      "certificate_path": "/etc/letsencrypt/live/$domain/fullchain.pem",
      "key_path": "/etc/letsencrypt/live/$domain/privkey.pem"
    }
  }],
  "outbounds": [{
    "type": "direct"
  }]
}
EOF

# 启动服务
systemctl enable sing-box
systemctl start sing-box

echo -e "${GREEN}部署完成！${NC}"
```

### 性能优化

#### TCP 优化

```bash
# 添加到 /etc/sysctl.conf
cat >> /etc/sysctl.conf << EOF
# TCP 优化
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
net.ipv4.tcp_fastopen=3
net.ipv4.tcp_syncookies=1
net.ipv4.tcp_tw_reuse=1
net.ipv4.tcp_fin_timeout=30
net.ipv4.tcp_max_syn_backlog=8192

# 连接数优化
net.core.somaxconn=32768
net.ipv4.tcp_max_tw_buckets=5000
net.netfilter.nf_conntrack_max=2000000
EOF

# 应用配置
sysctl -p
```

#### 文件描述符限制

```bash
# 添加到 /etc/security/limits.conf
cat >> /etc/security/limits.conf << EOF
* soft nofile 1000000
* hard nofile 1000000
root soft nofile 1000000
root hard nofile 1000000
EOF
```

---

## 故障排查

### 常见问题

#### 1. 端口被占用
```bash
# 查看占用
lsof -i :443
# 终止进程
kill -9 $(lsof -t -i:443)
```

#### 2. TUN 模式无法启动
```bash
# Linux: 添加权限
sudo setcap cap_net_admin=eip /usr/local/bin/sing-box

# 检查 TUN 模块
lsmod | grep tun
# 加载模块
sudo modprobe tun
```

#### 3. 证书过期
```bash
# 手动续期
certbot renew
systemctl restart sing-box

# 检查自动续期
systemctl status certbot.timer
```

#### 4. 无法连接节点
```bash
# 检查服务状态
systemctl status sing-box

# 查看日志
journalctl -u sing-box -f

# 测试连接
curl -x socks5://127.0.0.1:1080 https://www.google.com
```

### 调试技巧

#### 启用详细日志
```json
{
  "log": {
    "level": "debug",
    "timestamp": true,
    "output": "/var/log/sing-box.log"
  }
}
```

#### 配置检查
```bash
# 验证配置
sing-box check -c /etc/sing-box/config.json

# 格式化配置
sing-box format -c /etc/sing-box/config.json
```

#### 性能监控
```bash
# CPU 和内存
htop

# 网络连接
ss -tunlp | grep sing-box

# 流量统计
iftop -i eth0
```

---

## 安全建议

### 基础安全

1. **使用强密码**
   - 至少16位随机字符
   - 定期更换密码
   - 不同用户使用不同密码

2. **限制访问**
   ```bash
   # 防火墙规则
   ufw allow 443/tcp
   ufw allow 443/udp
   ufw default deny incoming
   ufw enable
   ```

3. **隐藏特征**
   - 使用 Reality 或 Trojan 协议
   - 配置回落服务
   - 避免使用默认端口

### 高级安全

1. **流量混淆**
   ```json
   {
     "multiplex": {
       "enabled": true,
       "protocol": "h2mux",
       "max_connections": 4,
       "padding": true
     }
   }
   ```

2. **访问控制**
   ```bash
   # 限制 SSH
   sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config
   systemctl restart sshd
   ```

3. **日志管理**
   ```bash
   # 日志轮转
   cat > /etc/logrotate.d/sing-box << EOF
   /var/log/sing-box.log {
       daily
       rotate 7
       compress
       delaycompress
       missingok
       notifempty
   }
   EOF
   ```

---

## 相关资源

### 官方资源
- [sing-box 官方文档](https://sing-box.sagernet.org/)
- [GitHub 仓库](https://github.com/SagerNet/sing-box)
- [Telegram 群组](https://t.me/sing_box)

### 客户端下载
- [Android](https://github.com/SagerNet/sing-box-for-android)
- [iOS/macOS](https://apps.apple.com/app/sing-box)
- [Windows GUI](https://github.com/GUI-for-Cores/GUI.for.SingBox)

### UI 面板
- [Yacd-meta](http://yacd.metacubex.one)
- [metacubexd](http://d.metacubex.one)
- [Clash Dashboard](http://clash.razord.top)

---

## 更新日志

- **2024-12**: 更新至 sing-box 1.13.0+，添加 Reality 和 TUIC v5 支持
- **2024-11**: 整合多个文档，优化结构
- **2024-10**: 添加流量控制和多用户管理
- **2024-09**: 初始版本发布

---

*本文档持续更新中，如有问题请提交 Issue。*