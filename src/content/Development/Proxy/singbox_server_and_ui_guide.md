# sing-box 服务端搭建与 UI 管理完整教程

本教程将详细介绍如何搭建 sing-box 服务端、配置各种安全协议，以及使用 Web UI 管理和切换节点。

## 目录

- [服务端搭建](#服务端搭建)
  - [系统要求与安装](#系统要求与安装)
  - [Reality 服务端（推荐）](#reality-服务端推荐)
  - [Hysteria2 服务端](#hysteria2-服务端)
  - [Trojan 服务端](#trojan-服务端)
  - [VMess 服务端](#vmess-服务端)
  - [TUIC 服务端](#tuic-服务端)
- [UI 管理界面](#ui-管理界面)
  - [Clash Meta UI 配置](#clash-meta-ui-配置)
  - [sing-box Web UI](#sing-box-web-ui)
  - [节点切换与管理](#节点切换与管理)
- [进阶配置](#进阶配置)
  - [多协议共存](#多协议共存)
  - [负载均衡](#负载均衡)
  - [自动化部署](#自动化部署)

## 服务端搭建

### 系统要求与安装

#### 系统要求
- **操作系统**: Linux (Ubuntu 20.04+, Debian 11+, CentOS 8+)
- **CPU**: 1 核心以上
- **内存**: 512MB 以上
- **网络**: 具有公网 IP 的 VPS

#### 安装 sing-box

```bash
# 方法一：使用官方安装脚本
bash <(curl -fsSL https://sing-box.app/deb-install.sh)

# 方法二：手动下载安装（以 Linux amd64 为例）
VERSION=$(curl -s https://api.github.com/repos/SagerNet/sing-box/releases/latest | grep tag_name | cut -d '"' -f 4)
wget -O sing-box.tar.gz https://github.com/SagerNet/sing-box/releases/download/${VERSION}/sing-box-${VERSION#v}-linux-amd64.tar.gz
tar -xzf sing-box.tar.gz
sudo mv sing-box-*/sing-box /usr/local/bin/
sudo chmod +x /usr/local/bin/sing-box

# 验证安装
sing-box version
```

#### 创建系统服务

```bash
# 创建 systemd 服务文件
sudo tee /etc/systemd/system/sing-box.service > /dev/null <<EOF
[Unit]
Description=sing-box service
Documentation=https://sing-box.sagernet.org
After=network.target nss-lookup.target

[Service]
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW
ExecStart=/usr/local/bin/sing-box run -c /etc/sing-box/config.json
ExecReload=/bin/kill -HUP \$MAINPID
Restart=on-failure
RestartSec=10
LimitNOFILE=infinity

[Install]
WantedBy=multi-user.target
EOF

# 创建配置目录
sudo mkdir -p /etc/sing-box

# 重载 systemd
sudo systemctl daemon-reload
```

### Reality 服务端（推荐）

Reality 是目前最安全的协议之一，能够有效对抗主动探测和流量识别。它通过伪装成标准的 TLS 1.3 流量，使得流量特征与正常的 HTTPS 访问几乎无法区分。

#### Reality 配置

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "vless",
      "tag": "vless-reality-in",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "name": "user1",
          "uuid": "YOUR_UUID",                 // 使用 uuidgen 或 sing-box generate uuid 生成
          "flow": "xtls-rprx-vision"           // Reality 流控，提供最佳性能
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "www.microsoft.com",    // 伪装的 SNI（可选其他知名网站）
        "reality": {
          "enabled": true,
          "handshake": {
            "server": "www.microsoft.com",     // 握手服务器，需要支持 TLS 1.3
            "server_port": 443
          },
          "private_key": "YOUR_PRIVATE_KEY",   // 使用下面的命令生成
          "short_id": [                         // 短 ID 列表（8位16进制）
            "0123456789abcdef"
          ]
        }
      },
      "multiplex": {                            // 多路复用配置
        "enabled": true,
        "padding": true,                        // 添加填充，增强安全性
        "brutal": {
          "enabled": true,
          "up_mbps": 100,
          "down_mbps": 100
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

#### 生成 Reality 密钥对

```bash
# 生成 Reality 密钥对
sing-box generate reality-keypair

# 输出示例：
# PrivateKey: YOUR_PRIVATE_KEY  (服务端使用)
# PublicKey: YOUR_PUBLIC_KEY    (客户端使用)

# 生成 UUID
uuidgen
# 或
sing-box generate uuid

# 生成短 ID（可选，使用默认值也可以）
openssl rand -hex 8
```

#### Reality 多用户配置

```json
{
  "inbounds": [
    {
      "type": "vless",
      "tag": "reality-multi-user",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "name": "user1",
          "uuid": "UUID_USER1",
          "flow": "xtls-rprx-vision"
        },
        {
          "name": "user2",
          "uuid": "UUID_USER2",
          "flow": "xtls-rprx-vision"
        },
        {
          "name": "user3",
          "uuid": "UUID_USER3",
          "flow": "xtls-rprx-vision"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "www.cloudflare.com",   // 可选其他支持 TLS 1.3 的网站
        "reality": {
          "enabled": true,
          "handshake": {
            "server": "www.cloudflare.com",
            "server_port": 443
          },
          "private_key": "YOUR_PRIVATE_KEY",
          "short_id": [
            "0123456789abcdef",
            "fedcba9876543210",                // 可以设置多个短 ID
            "1234567890abcdef"
          ]
        }
      }
    }
  ]
}
```

### Hysteria2 服务端

Hysteria2 是基于 QUIC 协议的新一代代理协议，具有优秀的抗封锁能力和极高的传输效率。

#### 基础配置

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "hysteria2",
      "tag": "hy2-in",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "name": "user1",
          "password": "YOUR_HYSTERIA2_PASSWORD"  // 使用强密码
        }
      ],
      "masquerade": "https://www.bing.com",     // 伪装网址，访问无效路径时跳转
      "tls": {
        "enabled": true,
        "alpn": ["h3"],                        // QUIC 使用 HTTP/3
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

#### 带宽优化配置

```json
{
  "inbounds": [
    {
      "type": "hysteria2",
      "tag": "hy2-optimized",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "name": "user1",
          "password": "YOUR_PASSWORD"
        },
        {
          "name": "user2",
          "password": "USER2_PASSWORD"
        }
      ],
      "ignore_client_bandwidth": false,        // 不忽略客户端带宽设置
      "up_mbps": 100,                          // 服务器上传带宽（根据实际调整）
      "down_mbps": 100,                        // 服务器下载带宽
      "masquerade": "https://www.bing.com",
      "tls": {
        "enabled": true,
        "alpn": ["h3"],
        "certificate_path": "/path/to/cert.pem",
        "key_path": "/path/to/key.pem"
      }
    }
  ]
}
```

### Trojan 服务端

#### 申请 SSL 证书

```bash
# 安装 certbot
sudo apt update && sudo apt install -y certbot

# 申请证书（替换 your-domain.com 为你的域名）
sudo certbot certonly --standalone -d your-domain.com

# 证书位置
# 证书: /etc/letsencrypt/live/your-domain.com/fullchain.pem
# 私钥: /etc/letsencrypt/live/your-domain.com/privkey.pem
```

#### Trojan 配置

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
          "password": "YOUR_TROJAN_PASSWORD"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "your-domain.com",     // 你的域名
        "alpn": ["h2", "http/1.1"],
        "certificate_path": "/etc/letsencrypt/live/your-domain.com/fullchain.pem",
        "key_path": "/etc/letsencrypt/live/your-domain.com/privkey.pem"
      },
      "fallback": {                           // 回落配置，伪装成网站
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

#### 配置伪装网站（可选）

```bash
# 安装 Nginx
sudo apt install -y nginx

# 配置 Nginx 监听 80 端口
sudo tee /etc/nginx/sites-available/fallback > /dev/null <<EOF
server {
    listen 127.0.0.1:80;
    server_name _;
    
    location / {
        root /var/www/html;
        index index.html;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/fallback /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### TUIC 服务端

TUIC 是另一个基于 QUIC 的协议，提供了优秀的性能和安全性。

#### TUIC v5 配置

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
          "name": "user1",
          "uuid": "YOUR_UUID",
          "password": "YOUR_PASSWORD"
        }
      ],
      "congestion_control": "bbr",              // 拥塞控制算法
      "auth_timeout": "3s",
      "zero_rtt_handshake": false,
      "heartbeat": "10s",
      "tls": {
        "enabled": true,
        "server_name": "your-domain.com",
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

### VMess 服务端

#### 基础 VMess 配置

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "vmess",
      "tag": "vmess-in",
      "listen": "::",
      "listen_port": 10086,
      "users": [
        {
          "name": "user1",
          "uuid": "YOUR_UUID",            // 使用 uuidgen 生成
          "alterId": 0                    // 现代配置推荐设为 0
        }
      ]
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

#### VMess + WebSocket + TLS 配置

```json
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "inbounds": [
    {
      "type": "vmess",
      "tag": "vmess-ws-in",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "name": "user1",
          "uuid": "YOUR_UUID"
        }
      ],
      "transport": {
        "type": "ws",
        "path": "/vmess",                // WebSocket 路径
        "headers": {
          "Host": "your-domain.com"
        },
        "max_early_data": 2048,
        "early_data_header_name": "Sec-WebSocket-Protocol"
      },
      "tls": {
        "enabled": true,
        "server_name": "your-domain.com",
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

#### 生成 UUID

```bash
# Linux/macOS
uuidgen

# 或使用 sing-box
sing-box generate uuid
```


## UI 管理界面

### Clash Meta UI 配置

#### 启用 Clash API

在服务端配置中添加 experimental 部分：

```json
{
  "log": {
    "level": "info"
  },
  "experimental": {
    "clash_api": {
      "external_controller": "0.0.0.0:9090",    // API 监听地址
      "external_ui": "ui",                      // UI 目录
      "external_ui_download_url": "https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip",
      "external_ui_download_detour": "direct",
      "secret": "YOUR_API_SECRET",              // API 密钥，请修改
      "default_mode": "rule",                   // 默认模式：rule/global/direct
      "store_mode": true,                       // 存储模式设置
      "store_selected": true,                   // 存储节点选择
      "store_fakeip": true,                     // 存储 FakeIP
      "cache_file": "cache.db",                 // 缓存文件
      "cache_id": "default"                     // 缓存 ID
    }
  },
  "inbounds": [
    // ... 你的入站配置
  ],
  "outbounds": [
    // 添加选择器出站
    {
      "type": "selector",
      "tag": "节点选择",
      "outbounds": ["自动选择", "香港节点", "美国节点", "日本节点", "direct"],
      "default": "自动选择"
    },
    {
      "type": "urltest",
      "tag": "自动选择",
      "outbounds": ["香港节点", "美国节点", "日本节点"],
      "url": "https://www.gstatic.com/generate_204",
      "interval": "3m",
      "tolerance": 50
    },
    // ... 其他节点配置
  ]
}
```

#### 访问 Web UI

1. **自动下载 UI**：首次启动时，sing-box 会自动下载 UI 文件
2. **访问地址**：`http://your-server-ip:9090/ui`
3. **输入密钥**：使用配置中的 `secret` 进行认证

#### 常用 Web UI

```json
{
  "experimental": {
    "clash_api": {
      "external_controller": "0.0.0.0:9090",
      "external_ui": "ui",
      // 可选择不同的 UI
      
      // 1. Yacd-meta (推荐，功能齐全)
      "external_ui_download_url": "https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip",
      
      // 2. Yacd (经典版)
      // "external_ui_download_url": "https://github.com/haishanh/yacd/archive/gh-pages.zip",
      
      // 3. Clash Dashboard (原版)
      // "external_ui_download_url": "https://github.com/Dreamacro/clash-dashboard/archive/gh-pages.zip",
      
      "secret": "YOUR_SECRET"
    }
  }
}
```

### sing-box Web UI

#### 使用 SUI (S-UI) 管理面板

SUI 是专为 sing-box 设计的 Web 管理面板，提供完整的节点管理功能。

##### 安装 SUI

```bash
# 一键安装脚本
bash <(curl -Ls https://raw.githubusercontent.com/xxxxx/s-ui/master/install.sh)

# 或手动安装
git clone https://github.com/xxxxx/s-ui.git
cd s-ui
npm install
npm run build
npm start
```

##### SUI 配置

```json
{
  "web": {
    "enabled": true,
    "address": "0.0.0.0:8080",
    "username": "admin",
    "password": "admin123",
    "database": "./sui.db"
  },
  "sing-box": {
    "config_path": "/etc/sing-box/config.json",
    "executable": "/usr/local/bin/sing-box"
  }
}
```

### 节点切换与管理

#### 使用 API 切换节点

```bash
# 获取当前配置
curl -X GET "http://localhost:9090/configs" \
  -H "Authorization: Bearer YOUR_SECRET"

# 切换代理模式
curl -X PATCH "http://localhost:9090/configs" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"mode":"global"}'  # rule/global/direct

# 选择特定节点
curl -X PUT "http://localhost:9090/proxies/节点选择" \
  -H "Authorization: Bearer YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name":"香港节点"}'

# 测试节点延迟
curl -X GET "http://localhost:9090/proxies/香港节点/delay?timeout=5000&url=https://www.gstatic.com/generate_204" \
  -H "Authorization: Bearer YOUR_SECRET"
```

#### Python 脚本管理节点

```python
#!/usr/bin/env python3
"""
sing-box 节点管理脚本
用于自动化管理和切换节点
"""

import requests
import json
from typing import Dict, List, Optional

class SingBoxManager:
    def __init__(self, api_url: str, secret: str):
        """
        初始化 sing-box 管理器
        
        Args:
            api_url: API 地址，如 http://localhost:9090
            secret: API 密钥
        """
        self.api_url = api_url
        self.headers = {"Authorization": f"Bearer {secret}"}
    
    def get_proxies(self) -> Dict:
        """获取所有代理节点"""
        response = requests.get(
            f"{self.api_url}/proxies",
            headers=self.headers
        )
        return response.json()
    
    def switch_node(self, selector: str, node: str) -> bool:
        """
        切换节点
        
        Args:
            selector: 选择器名称
            node: 节点名称
        """
        response = requests.put(
            f"{self.api_url}/proxies/{selector}",
            headers=self.headers,
            json={"name": node}
        )
        return response.status_code == 204
    
    def test_delay(self, node: str, timeout: int = 5000) -> Optional[int]:
        """
        测试节点延迟
        
        Args:
            node: 节点名称
            timeout: 超时时间（毫秒）
        
        Returns:
            延迟时间（毫秒），失败返回 None
        """
        response = requests.get(
            f"{self.api_url}/proxies/{node}/delay",
            headers=self.headers,
            params={
                "timeout": timeout,
                "url": "https://www.gstatic.com/generate_204"
            }
        )
        if response.status_code == 200:
            return response.json().get("delay")
        return None
    
    def auto_select_best_node(self, selector: str = "节点选择") -> str:
        """
        自动选择延迟最低的节点
        
        Args:
            selector: 选择器名称
        
        Returns:
            最佳节点名称
        """
        proxies = self.get_proxies()
        selector_info = proxies["proxies"][selector]
        
        best_node = None
        best_delay = float('inf')
        
        for node_name in selector_info["all"]:
            if node_name in ["direct", "reject", "block"]:
                continue
            
            delay = self.test_delay(node_name)
            if delay and delay < best_delay:
                best_delay = delay
                best_node = node_name
        
        if best_node:
            self.switch_node(selector, best_node)
            print(f"已切换到最佳节点: {best_node} (延迟: {best_delay}ms)")
        
        return best_node
    
    def get_traffic_stats(self) -> Dict:
        """获取流量统计"""
        response = requests.get(
            f"{self.api_url}/traffic",
            headers=self.headers
        )
        return response.json()
    
    def get_connections(self) -> List[Dict]:
        """获取当前连接"""
        response = requests.get(
            f"{self.api_url}/connections",
            headers=self.headers
        )
        return response.json().get("connections", [])
    
    def close_connection(self, connection_id: str) -> bool:
        """关闭指定连接"""
        response = requests.delete(
            f"{self.api_url}/connections/{connection_id}",
            headers=self.headers
        )
        return response.status_code == 204
    
    def close_all_connections(self) -> bool:
        """关闭所有连接"""
        response = requests.delete(
            f"{self.api_url}/connections",
            headers=self.headers
        )
        return response.status_code == 204

# 使用示例
if __name__ == "__main__":
    # 初始化管理器
    manager = SingBoxManager(
        api_url="http://localhost:9090",
        secret="YOUR_SECRET"
    )
    
    # 获取所有节点
    proxies = manager.get_proxies()
    print("可用节点:", proxies["proxies"]["节点选择"]["all"])
    
    # 自动选择最佳节点
    best = manager.auto_select_best_node()
    
    # 手动切换节点
    # manager.switch_node("节点选择", "香港节点")
    
    # 获取流量统计
    # stats = manager.get_traffic_stats()
    # print(f"上传: {stats['up']} bytes, 下载: {stats['down']} bytes")
```

#### 自动化节点监控脚本

```bash
#!/bin/bash
# 节点健康检查脚本

API_URL="http://localhost:9090"
SECRET="YOUR_SECRET"

# 检查所有节点健康状态
check_nodes() {
    echo "检查节点状态..."
    
    # 获取所有节点
    nodes=$(curl -s -H "Authorization: Bearer $SECRET" \
        "$API_URL/proxies" | jq -r '.proxies["节点选择"].all[]')
    
    for node in $nodes; do
        if [[ "$node" == "direct" || "$node" == "reject" ]]; then
            continue
        fi
        
        # 测试延迟
        delay=$(curl -s -H "Authorization: Bearer $SECRET" \
            "$API_URL/proxies/$node/delay?timeout=5000&url=https://www.gstatic.com/generate_204" \
            | jq -r '.delay // "超时"')
        
        echo "节点: $node - 延迟: $delay ms"
    done
}

# 自动切换到最佳节点
auto_switch() {
    echo "寻找最佳节点..."
    
    best_node=""
    best_delay=999999
    
    nodes=$(curl -s -H "Authorization: Bearer $SECRET" \
        "$API_URL/proxies" | jq -r '.proxies["节点选择"].all[]')
    
    for node in $nodes; do
        if [[ "$node" == "direct" || "$node" == "reject" ]]; then
            continue
        fi
        
        delay=$(curl -s -H "Authorization: Bearer $SECRET" \
            "$API_URL/proxies/$node/delay?timeout=5000&url=https://www.gstatic.com/generate_204" \
            | jq -r '.delay // 999999')
        
        if [[ $delay -lt $best_delay ]]; then
            best_delay=$delay
            best_node=$node
        fi
    done
    
    if [[ -n "$best_node" ]]; then
        echo "切换到节点: $best_node (延迟: $best_delay ms)"
        curl -X PUT -H "Authorization: Bearer $SECRET" \
            -H "Content-Type: application/json" \
            -d "{\"name\":\"$best_node\"}" \
            "$API_URL/proxies/节点选择"
    fi
}

# 主函数
case "$1" in
    check)
        check_nodes
        ;;
    switch)
        auto_switch
        ;;
    *)
        echo "用法: $0 {check|switch}"
        exit 1
        ;;
esac
```

## 进阶配置

### 多协议共存

#### 单端口多协议（使用 Trojan + VMess）

```json
{
  "log": {
    "level": "info"
  },
  "inbounds": [
    {
      "type": "mixed",
      "tag": "mixed-in",
      "listen": "::",
      "listen_port": 443,
      "sniff": true,
      "sniff_override_destination": true,
      "set_system_proxy": false,
      "users": []
    },
    {
      "type": "trojan",
      "tag": "trojan-in",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "name": "trojan-user",
          "password": "trojan-password"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "your-domain.com",
        "certificate_path": "/path/to/cert.pem",
        "key_path": "/path/to/key.pem"
      },
      "fallback": {
        "server": "127.0.0.1",
        "server_port": 8080
      }
    },
    {
      "type": "vmess",
      "tag": "vmess-in",
      "listen": "127.0.0.1",
      "listen_port": 8080,
      "users": [
        {
          "name": "vmess-user",
          "uuid": "your-uuid"
        }
      ],
      "transport": {
        "type": "ws",
        "path": "/vmess"
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

### 负载均衡

#### 多服务器负载均衡配置

```json
{
  "outbounds": [
    {
      "type": "direct",
      "tag": "direct"
    },
    {
      "type": "loadbalance",
      "tag": "load-balance",
      "outbounds": ["server1", "server2", "server3"],
      "strategy": "consistent_hash",    // round_robin | random | consistent_hash
      "check": {
        "alive": true,
        "interval": "30s",
        "timeout": "5s",
        "destination": "https://www.gstatic.com/generate_204"
      }
    },
    {
      "type": "vless",
      "tag": "server1",
      "server": "server1.example.com",
      "server_port": 443,
      "uuid": "uuid1",
      "flow": "xtls-rprx-vision",
      "tls": {
        "enabled": true,
        "server_name": "www.microsoft.com",
        "reality": {
          "enabled": true,
          "public_key": "PUBLIC_KEY_1",
          "short_id": "0123456789abcdef"
        }
      }
    },
    {
      "type": "hysteria2",
      "tag": "server2",
      "server": "server2.example.com",
      "server_port": 443,
      "password": "password2",
      "tls": {
        "enabled": true,
        "server_name": "server2.example.com",
        "alpn": ["h3"]
      }
    },
    {
      "type": "tuic",
      "tag": "server3",
      "server": "server3.example.com",
      "server_port": 443,
      "uuid": "uuid3",
      "password": "password3",
      "congestion_control": "bbr",
      "tls": {
        "enabled": true,
        "server_name": "server3.example.com",
        "alpn": ["h3"]
      }
    }
  ],
  "route": {
    "final": "load-balance"
  }
}
```

### 自动化部署

#### Docker 部署

```dockerfile
# Dockerfile
FROM alpine:latest

RUN apk add --no-cache ca-certificates tzdata
RUN set -ex \
    && VERSION=$(wget -qO- https://api.github.com/repos/SagerNet/sing-box/releases/latest | grep tag_name | cut -d '"' -f 4) \
    && wget -O sing-box.tar.gz https://github.com/SagerNet/sing-box/releases/download/${VERSION}/sing-box-${VERSION#v}-linux-amd64.tar.gz \
    && tar -xzf sing-box.tar.gz \
    && mv sing-box-*/sing-box /usr/local/bin/ \
    && rm -rf sing-box* \
    && chmod +x /usr/local/bin/sing-box

COPY config.json /etc/sing-box/config.json

ENTRYPOINT ["/usr/local/bin/sing-box"]
CMD ["run", "-c", "/etc/sing-box/config.json"]
```

#### Docker Compose 配置

```yaml
version: '3.8'

services:
  sing-box:
    image: ghcr.io/sagernet/sing-box:latest
    container_name: sing-box
    restart: unless-stopped
    network_mode: host
    cap_add:
      - NET_ADMIN
      - NET_RAW
    volumes:
      - ./config.json:/etc/sing-box/config.json:ro
      - ./ssl:/etc/ssl:ro
      - ./data:/var/lib/sing-box
    environment:
      - TZ=Asia/Shanghai
    command: run -c /etc/sing-box/config.json

  # Web UI (可选)
  yacd:
    image: haishanh/yacd:latest
    container_name: yacd
    restart: unless-stopped
    ports:
      - "9090:80"
    depends_on:
      - sing-box
```

#### 一键部署脚本

```bash
#!/bin/bash
# sing-box 一键部署脚本

set -e

# 配置变量
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"
REALITY_PRIVATE_KEY=$(sing-box generate reality-keypair | grep PrivateKey | cut -d' ' -f2)
REALITY_PUBLIC_KEY=$(sing-box generate reality-keypair | grep PublicKey | cut -d' ' -f2)
HY2_PASSWORD=$(openssl rand -hex 16)
TROJAN_PASSWORD=$(openssl rand -hex 16)
UUID=$(uuidgen)
API_SECRET=$(openssl rand -hex 16)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}开始部署 sing-box 服务端...${NC}"

# 1. 更新系统
echo -e "${YELLOW}更新系统...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git nginx certbot python3-certbot-nginx

# 2. 安装 sing-box
echo -e "${YELLOW}安装 sing-box...${NC}"
bash <(curl -fsSL https://sing-box.app/deb-install.sh)

# 3. 申请证书
echo -e "${YELLOW}申请 SSL 证书...${NC}"
certbot certonly --standalone -d $DOMAIN --email $EMAIL --agree-tos --non-interactive

# 4. 创建配置文件
echo -e "${YELLOW}创建配置文件...${NC}"
mkdir -p /etc/sing-box

cat > /etc/sing-box/config.json << EOF
{
  "log": {
    "level": "info",
    "timestamp": true
  },
  "experimental": {
    "clash_api": {
      "external_controller": "0.0.0.0:9090",
      "external_ui": "ui",
      "external_ui_download_url": "https://github.com/MetaCubeX/Yacd-meta/archive/gh-pages.zip",
      "secret": "$API_SECRET",
      "default_mode": "rule"
    }
  },
  "inbounds": [
    {
      "type": "vless",
      "tag": "reality-in",
      "listen": "::",
      "listen_port": 443,
      "users": [
        {
          "name": "user",
          "uuid": "$UUID",
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
          "private_key": "$REALITY_PRIVATE_KEY",
          "short_id": ["0123456789abcdef"]
        }
      }
    },
    {
      "type": "hysteria2",
      "tag": "hy2-in",
      "listen": "::",
      "listen_port": 8443,
      "users": [
        {
          "name": "user",
          "password": "$HY2_PASSWORD"
        }
      ],
      "masquerade": "https://www.bing.com",
      "tls": {
        "enabled": true,
        "alpn": ["h3"],
        "certificate_path": "/etc/letsencrypt/live/$DOMAIN/fullchain.pem",
        "key_path": "/etc/letsencrypt/live/$DOMAIN/privkey.pem"
      }
    },
    {
      "type": "trojan",
      "tag": "trojan-in",
      "listen": "::",
      "listen_port": 8443,
      "users": [
        {
          "name": "user",
          "password": "$TROJAN_PASSWORD"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "$DOMAIN",
        "certificate_path": "/etc/letsencrypt/live/$DOMAIN/fullchain.pem",
        "key_path": "/etc/letsencrypt/live/$DOMAIN/privkey.pem"
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
EOF

# 5. 创建 systemd 服务
echo -e "${YELLOW}创建系统服务...${NC}"
cat > /etc/systemd/system/sing-box.service << EOF
[Unit]
Description=sing-box service
After=network.target nss-lookup.target

[Service]
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW
AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW
ExecStart=/usr/bin/sing-box run -c /etc/sing-box/config.json
Restart=on-failure
RestartSec=10
LimitNOFILE=infinity

[Install]
WantedBy=multi-user.target
EOF

# 6. 启动服务
echo -e "${YELLOW}启动服务...${NC}"
systemctl daemon-reload
systemctl enable sing-box
systemctl start sing-box

# 7. 配置防火墙
echo -e "${YELLOW}配置防火墙...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8443/tcp
ufw allow 9090/tcp
ufw --force enable

# 8. 输出配置信息
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "域名: ${YELLOW}$DOMAIN${NC}"
echo -e "Reality (VLESS):"
echo -e "  端口: ${YELLOW}443${NC}"
echo -e "  UUID: ${YELLOW}$UUID${NC}"
echo -e "  公钥: ${YELLOW}$REALITY_PUBLIC_KEY${NC}"
echo -e "  短 ID: ${YELLOW}0123456789abcdef${NC}"
echo -e "Hysteria2:"
echo -e "  端口: ${YELLOW}8443${NC}"
echo -e "  密码: ${YELLOW}$HY2_PASSWORD${NC}"
echo -e "Trojan:"
echo -e "  端口: ${YELLOW}8443${NC}"
echo -e "  密码: ${YELLOW}$TROJAN_PASSWORD${NC}"
echo -e "Web UI:"
echo -e "  地址: ${YELLOW}http://$DOMAIN:9090/ui${NC}"
echo -e "  密钥: ${YELLOW}$API_SECRET${NC}"
echo -e "${GREEN}========================================${NC}"

# 保存配置信息
cat > ~/sing-box-info.txt << EOF
域名: $DOMAIN
Reality (VLESS):
  端口: 443
  UUID: $UUID
  公钥: $REALITY_PUBLIC_KEY
  短 ID: 0123456789abcdef
Hysteria2:
  端口: 8443
  密码: $HY2_PASSWORD
Trojan:
  端口: 8443
  密码: $TROJAN_PASSWORD
Web UI:
  地址: http://$DOMAIN:9090/ui
  密钥: $API_SECRET
EOF

echo -e "${YELLOW}配置信息已保存到 ~/sing-box-info.txt${NC}"
```

## 客户端配置示例

### 连接到服务端的客户端配置

```json
{
  "log": {
    "level": "info"
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
      "outbounds": ["auto", "reality", "hysteria2", "trojan", "direct"],
      "default": "auto"
    },
    {
      "type": "urltest",
      "tag": "auto",
      "outbounds": ["reality", "hysteria2", "trojan"],
      "url": "https://www.gstatic.com/generate_204",
      "interval": "3m"
    },
    {
      "type": "vless",
      "tag": "reality",
      "server": "your-server.com",
      "server_port": 443,
      "uuid": "YOUR_UUID",
      "flow": "xtls-rprx-vision",
      "tls": {
        "enabled": true,
        "server_name": "www.microsoft.com",
        "utls": {
          "enabled": true,
          "fingerprint": "chrome"
        },
        "reality": {
          "enabled": true,
          "public_key": "YOUR_PUBLIC_KEY",
          "short_id": "0123456789abcdef"
        }
      }
    },
    {
      "type": "hysteria2",
      "tag": "hysteria2",
      "server": "your-server.com",
      "server_port": 8443,
      "password": "YOUR_HY2_PASSWORD",
      "tls": {
        "enabled": true,
        "server_name": "your-server.com",
        "alpn": ["h3"]
      }
    },
    {
      "type": "trojan",
      "tag": "trojan",
      "server": "your-server.com",
      "server_port": 8443,
      "password": "YOUR_TROJAN_PASSWORD",
      "tls": {
        "enabled": true,
        "server_name": "your-server.com"
      }
    },
    {
      "type": "direct",
      "tag": "direct"
    },
    {
      "type": "block",
      "tag": "block"
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
        "geoip": "private",
        "outbound": "direct"
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
      "secret": "YOUR_CLIENT_SECRET",
      "default_mode": "rule"
    }
  }
}
```

## 故障排查

### 常见问题解决

#### 1. 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep :443
lsof -i :443

# 结束占用进程
kill -9 $(lsof -t -i:443)
```

#### 2. 证书更新

```bash
# 设置定时任务自动更新证书
crontab -e

# 添加以下内容（每天凌晨 2 点检查）
0 2 * * * certbot renew --quiet && systemctl reload sing-box
```

#### 3. 服务无法启动

```bash
# 检查配置文件
sing-box check -c /etc/sing-box/config.json

# 查看详细日志
journalctl -u sing-box -f --no-pager

# 手动运行调试
sing-box run -c /etc/sing-box/config.json -D
```

#### 4. 性能优化

```bash
# 优化系统参数
cat >> /etc/sysctl.conf << EOF
# TCP 优化
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
net.ipv4.tcp_fastopen=3
net.ipv4.tcp_syncookies=1
net.ipv4.tcp_tw_reuse=1
net.ipv4.tcp_fin_timeout=30
net.ipv4.tcp_keepalive_time=1200
net.ipv4.tcp_max_syn_backlog=8192
net.ipv4.tcp_max_tw_buckets=5000

# 文件描述符
fs.file-max=65535
fs.inotify.max_user_instances=8192

# 缓冲区
net.core.rmem_max=67108864
net.core.wmem_max=67108864
net.ipv4.tcp_rmem=4096 87380 67108864
net.ipv4.tcp_wmem=4096 65536 67108864
EOF

sysctl -p
```

## 总结

本教程涵盖了 sing-box 服务端的完整搭建流程，包括：

1. **安全协议配置**：Reality（推荐）、Hysteria2、Trojan、VMess、TUIC
2. **Web UI 管理**：Clash API、专用管理面板
3. **节点切换**：API 调用、自动化脚本
4. **进阶功能**：多协议共存、负载均衡、Docker 部署
5. **故障排查**：常见问题和优化方案

选择合适的协议和配置，根据实际需求调整参数，即可搭建稳定高效的代理服务。建议定期更新 sing-box 版本，关注安全更新，确保服务安全稳定运行。