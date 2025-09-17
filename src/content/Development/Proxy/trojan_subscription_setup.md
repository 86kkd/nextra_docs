# Trojan 多节点部署与订阅服务完整方案

本教程将手把手教你搭建两个 Trojan 节点服务器，配置订阅服务，并在客户端实现 UI 切换和 TUN 模式。

## 架构概览

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Server 1   │     │  Server 2   │     │ Subscription │
│   Trojan    │     │   Trojan    │     │   Service    │
└──────┬──────┘     └──────┬──────┘     └──────┬───────┘
       │                   │                    │
       └───────────────────┴────────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Client    │
                    │  sing-box   │
                    │   + UI      │
                    └─────────────┘
```

## 第一步：服务器部署

### 1.1 服务器1配置（香港节点）

```bash
# SSH 登录到服务器1
ssh root@server1-ip

# 更新系统
apt update && apt upgrade -y

# 安装必要工具
apt install -y curl wget certbot nginx

# 安装 sing-box
bash <(curl -fsSL https://sing-box.app/deb-install.sh)
```

#### 申请SSL证书

```bash
# Certbot 命令详解
# certbot certonly：只获取证书，不安装（不修改web服务器配置）
# --standalone：使用独立模式，certbot会临时启动一个web服务器来验证域名所有权
#              要求：80端口必须空闲，如果nginx/apache正在运行需要先停止
# -d hk.example.com：指定要申请证书的域名，可以多个 -d domain1 -d domain2
# --email your@email.com：（可选但推荐）提供邮箱用于：
#                        1. 接收证书过期提醒（剩余20天时会发邮件）
#                        2. 紧急安全通知
#                        3. 账户恢复
#                        如果不提供，使用 --register-unsafely-without-email
# --agree-tos：同意Let's Encrypt服务条款（Terms of Service）
#             不加此参数会进入交互模式要求手动确认
#             TOS主要内容：证书有效期90天、需要遵守使用规范等
# --non-interactive：非交互模式，不会询问任何问题
#                   适合脚本自动化，出错直接失败

# 基础用法（会进入交互模式）
certbot certonly --standalone -d hk.example.com

# 推荐用法（提供邮箱，自动化运行）
certbot certonly --standalone \
  -d hk.example.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# 不提供邮箱的用法（不推荐，收不到过期提醒）
certbot certonly --standalone \
  -d hk.example.com \
  --register-unsafely-without-email \
  --agree-tos \
  --non-interactive

# 申请多个域名的证书（SAN证书）
certbot certonly --standalone \
  -d hk.example.com \
  -d www.hk.example.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# 使用nginx插件（如果nginx正在运行）
certbot certonly --nginx \
  -d hk.example.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive

# 测试模式（不会真正申请，用于调试）
certbot certonly --standalone \
  -d hk.example.com \
  --dry-run
```

##### Certbot 其他重要参数说明

```bash
# --webroot：使用webroot模式，不需要停止web服务器
#           需要指定网站根目录 -w /var/www/html
certbot certonly --webroot \
  -w /var/www/html \
  -d hk.example.com

# --preferred-challenges：指定验证方式
#   http-01：通过HTTP验证（默认，需要80端口）
#   dns-01：通过DNS TXT记录验证（支持通配符证书）
#   tls-sni-01：已废弃
certbot certonly --standalone \
  -d hk.example.com \
  --preferred-challenges http-01

# --force-renewal：强制更新证书（即使未过期）
certbot certonly --standalone \
  -d hk.example.com \
  --force-renewal

# --expand：扩展现有证书（添加新域名）
certbot certonly --standalone \
  -d hk.example.com \
  -d new.example.com \
  --expand

# --cert-name：指定证书名称（默认使用第一个域名）
certbot certonly --standalone \
  -d hk.example.com \
  --cert-name my-custom-name

# --key-type：指定密钥类型（默认rsa）
#   rsa：RSA 2048/3072/4096
#   ecdsa：ECDSA secp256r1/secp384r1
certbot certonly --standalone \
  -d hk.example.com \
  --key-type ecdsa
```

##### 证书文件位置说明

```bash
# 证书申请成功后，文件保存在：
# /etc/letsencrypt/live/hk.example.com/
#   ├── cert.pem       # 服务器证书（你的证书）
#   ├── chain.pem      # 中间证书链
#   ├── fullchain.pem  # 完整证书链（cert.pem + chain.pem）
#   ├── privkey.pem    # 私钥文件（需要保密）
#   └── README         # 说明文件

# 实际文件存储在 /etc/letsencrypt/archive/
# live目录下是符号链接，始终指向最新版本

# 查看证书信息
certbot certificates

# 查看证书详细内容
openssl x509 -in /etc/letsencrypt/live/hk.example.com/cert.pem -text -noout
```

##### 常见问题处理

```bash
# 问题1：80端口被占用
# 解决方案：
# 1. 临时停止占用80端口的服务
systemctl stop nginx  # 或 apache2
certbot certonly --standalone -d hk.example.com
systemctl start nginx

# 2. 使用webroot模式（不需要停止服务）
certbot certonly --webroot -w /var/www/html -d hk.example.com

# 3. 使用DNS验证（不需要80端口）
certbot certonly --manual \
  --preferred-challenges dns \
  -d hk.example.com

# 问题2：域名解析错误
# 检查DNS解析
dig hk.example.com
nslookup hk.example.com
# 确保域名A记录指向服务器IP

# 问题3：防火墙阻止
# 确保80和443端口开放
ufw allow 80/tcp
ufw allow 443/tcp
# 或
iptables -I INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT -p tcp --dport 443 -j ACCEPT

# 问题4：申请频率限制
# Let's Encrypt限制：
# - 每个域名每周50个证书
# - 每个IP每3小时5次失败
# - 每个账户每3小时300个新订单
# 解决：使用 --dry-run 测试，确认无误后再正式申请
```

#### 创建 Trojan 配置

```bash
cat > /etc/sing-box/config.json << 'EOF'
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
          "password": "your-strong-password-hk"  
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "hk.example.com",
        "alpn": ["h2", "http/1.1"],
        "certificate_path": "/etc/letsencrypt/live/hk.example.com/fullchain.pem",
        "key_path": "/etc/letsencrypt/live/hk.example.com/privkey.pem"
      },
      "fallback": {
        "server": "127.0.0.1",
        "server_port": 80
      },
      "multiplex": {
        "enabled": true,
        "padding": false,
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
EOF
```

#### 配置伪装站点

```bash
# 配置 Nginx 作为伪装
cat > /etc/nginx/sites-available/default << 'EOF'
server {
    listen 127.0.0.1:80;
    server_name _;
    
    location / {
        return 200 "Welcome to nginx!";
        add_header Content-Type text/plain;
    }
}
EOF

systemctl restart nginx
```

##### 自动续期配置

```bash
# Let's Encrypt证书有效期只有90天，需要定期续期

# 方法1：使用crontab（推荐）
# 添加定时任务，每天凌晨2:30检查并续期
crontab -e
# 添加以下行：
# 30 2 * * * certbot renew --quiet --post-hook "systemctl reload sing-box"
# --quiet：安静模式，只在出错时输出
# --post-hook：续期成功后执行的命令

# 方法2：使用systemd timer
# 创建timer文件
cat > /etc/systemd/system/certbot-renew.timer << 'EOF'
[Unit]
Description=Run certbot twice daily

[Timer]
OnCalendar=*-*-* 00,12:00:00
RandomizedDelaySec=3600
Persistent=true

[Install]
WantedBy=timers.target
EOF

# 创建service文件
cat > /etc/systemd/system/certbot-renew.service << 'EOF'
[Unit]
Description=Certbot Renewal

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet --post-hook "systemctl reload sing-box"
EOF

# 启用timer
systemctl enable certbot-renew.timer
systemctl start certbot-renew.timer

# 查看timer状态
systemctl list-timers | grep certbot

# 手动测试续期（不会真正续期，除非快过期）
certbot renew --dry-run
```

#### 启动服务

```bash
# systemd 服务文件详解
cat > /etc/systemd/system/sing-box.service << 'EOF'
[Unit]
Description=sing-box service                     # 服务描述
After=network.target nss-lookup.target           # 在网络和DNS服务启动后启动

[Service]
# 能力边界集：限制服务只能使用这些权限
CapabilityBoundingSet=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW
# CAP_NET_ADMIN：允许网络管理操作（路由、防火墙等）
# CAP_NET_BIND_SERVICE：允许绑定小于1024的端口（如80、443）
# CAP_NET_RAW：允许使用原始socket（ICMP等）

AmbientCapabilities=CAP_NET_ADMIN CAP_NET_BIND_SERVICE CAP_NET_RAW
# 环境能力：设置进程的有效能力集

ExecStart=/usr/bin/sing-box run -c /etc/sing-box/config.json  # 启动命令
Restart=on-failure      # 失败时自动重启
RestartSec=10          # 重启前等待10秒
LimitNOFILE=infinity   # 不限制文件描述符数量（处理大量连接）

[Install]
WantedBy=multi-user.target   # 在多用户模式下启动
EOF

# systemctl 命令详解
# systemctl daemon-reload：重新加载 systemd 管理器配置
#                        修改或新增 service 文件后必须执行
systemctl daemon-reload

# systemctl enable sing-box：设置开机自启
#                          创建符号链接到 /etc/systemd/system/multi-user.target.wants/
systemctl enable sing-box

# systemctl start sing-box：立即启动服务
#   其他常用命令：
#   systemctl stop sing-box    # 停止服务
#   systemctl restart sing-box # 重启服务
#   systemctl status sing-box  # 查看状态
#   systemctl disable sing-box # 禁止开机自启
systemctl start sing-box

# 查看服务状态和日志
systemctl status sing-box
journalctl -u sing-box -f    # 实时查看日志
journalctl -u sing-box -n 50 # 查看最近50行日志

# UFW 防火墙配置详解
# ufw (Uncomplicated Firewall) 是 Ubuntu/Debian的简化防火墙工具

# 允许SSH端口（重要！否则可能无法远程连接）
ufw allow 22/tcp

# 允许HTTP端口（certbot验证需要）
ufw allow 80/tcp

# 允许HTTPS端口（Trojan使用）
ufw allow 443/tcp

# --force：非交互模式启用（不询问确认）
# 注意：启用前确保已添加SSH规则！
ufw --force enable

# 查看防火墙状态
ufw status verbose

# 其他常用UFW命令：
# ufw allow from 192.168.1.0/24  # 允许特定网段
# ufw delete allow 80/tcp         # 删除规则
# ufw disable                     # 禁用防火墙
# ufw reset                       # 重置防火墙规则

# 如果使用 iptables（CentOS/RHEL）：
iptables -I INPUT -p tcp --dport 22 -j ACCEPT
iptables -I INPUT -p tcp --dport 80 -j ACCEPT
iptables -I INPUT -p tcp --dport 443 -j ACCEPT
iptables-save > /etc/iptables/rules.v4  # 保存规则
```

### 1.2 服务器2配置（美国节点）

在服务器2上重复上述步骤，仅需修改：
- 域名：`us.example.com`
- 密码：`your-strong-password-us`

## 第二步：订阅服务搭建

### 方案A：Cloudflare Workers（推荐，免费）

#### Cloudflare Workers 介绍

Cloudflare Workers 是一个无服务器（Serverless）计算平台：
- **免费额度**：每天 100,000 次请求
- **全球部署**：自动部署到全球 200+ 个数据中心
- **无需服务器**：不用管理服务器，不用担心维护
- **高可用性**：自动故障转移，无单点故障

#### 创建 Worker 步骤

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击左侧 **Workers & Pages**
3. 点击 **Create Application** → **Create Worker**
4. 输入名称（如 `my-subscription`）
5. 点击 **Deploy**
6. 点击 **Edit Code** 编辑代码

```javascript
// Cloudflare Worker 代码详解

// 监听 fetch 事件（当有请求到达时触发）
addEventListener('fetch', event => {
  // 使用 handleRequest 函数处理请求
  event.respondWith(handleRequest(event.request))
})

// 主处理函数
async function handleRequest(request) {
  // 解析请求 URL
  const url = new URL(request.url)
  
  // 验证密钥（防止订阅泄露）
  // 订阅链接格式：https://xxx.workers.dev/?key=your-subscription-key
  const AUTH_KEY = 'your-subscription-key'  // 请修改为复杂的随机字符串
  
  // 从URL参数获取key
  // url.searchParams 是 URLSearchParams 对象，用于处理URL查询参数
  if (url.searchParams.get('key') !== AUTH_KEY) {
    // 密钥错误，返回401未授权
    return new Response('Unauthorized', { 
      status: 401,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
  }
  
  // 支持自定义参数（可选）
  const clientType = url.searchParams.get('client') || 'sing-box'  // 客户端类型
  const format = url.searchParams.get('format') || 'json'          // 返回格式
  const mode = (url.searchParams.get('mode') || 'tun').toLowerCase() // 运行模式：tun | proxy
  
  // 根据 mode 选择入站：
  // - tun（默认）：VPN/TUN 模式，适合 Android/iOS/桌面端全局接管
  // - proxy：返回本地混合代理入站（mixed），适合不能用 TUN 的设备/场景
  const inbounds = mode === 'proxy'
    ? [
      {
        "type": "mixed",
        "tag": "mixed-in",
        "listen": "127.0.0.1",
        "listen_port": 7890
      }
    ]
    : [
      {
        "type": "tun",
        "tag": "tun-in",
        "inet4_address": "172.19.0.1/30",
        "inet6_address": "fdfe:dcba:9876::1/126",
        "auto_route": true,
        "strict_route": true,
        "sniff": true,
        "sniff_override_destination": true,
        "stack": "system"
      }
    ]
  
  // sing-box 客户端配置
  const config = {
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
    "inbounds": inbounds,
    "outbounds": [
      {
        "type": "selector",
        "tag": "proxy",
        "outbounds": ["auto", "香港-HK", "美国-US", "direct"],
        "default": "auto"
      },
      {
        "type": "urltest",
        "tag": "auto",
        "outbounds": ["香港-HK", "美国-US"],
        "url": "https://www.gstatic.com/generate_204",
        "interval": "3m",
        "tolerance": 50
      },
      {
        "type": "trojan",
        "tag": "香港-HK",
        "server": "hk.example.com",
        "server_port": 443,
        "password": "your-strong-password-hk",
        "tls": {
          "enabled": true,
          "server_name": "hk.example.com",
          "insecure": false
        },
        "multiplex": {
          "enabled": true,
          "protocol": "h2mux",
          "max_connections": 4,
          "min_streams": 4,
          "padding": false
        }
      },
      {
        "type": "trojan",
        "tag": "美国-US",
        "server": "us.example.com",
        "server_port": 443,
        "password": "your-strong-password-us",
        "tls": {
          "enabled": true,
          "server_name": "us.example.com",
          "insecure": false
        },
        "multiplex": {
          "enabled": true,
          "protocol": "h2mux",
          "max_connections": 4,
          "min_streams": 4,
          "padding": false
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
        "external_ui_download_detour": "proxy",
        "secret": "your-api-secret",
        "default_mode": "rule",
        "access_control_allow_origin": [],
        "access_control_allow_private_network": false
      },
      "cache_file": {
        "enabled": true,
        "path": "cache.db",
        "cache_id": "",
        "store_fakeip": true,
        "store_rdrc": true,
        "rdrc_timeout": "7d"
      }
    }
  }
  
  return new Response(JSON.stringify(config, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}
```

部署后得到订阅链接：`https://your-worker.workers.dev/?key=your-subscription-key`

### 方案B：GitHub + jsDelivr（备选）

创建私有仓库存储配置，通过 jsDelivr CDN 分发：

1. 创建 GitHub 私有仓库
2. 上传配置文件 `config.json`
3. 创建 Release
4. 订阅链接：`https://cdn.jsdelivr.net/gh/username/repo@release/config.json`

## 第三步：客户端配置

### 3.1 Windows 客户端

#### 方法1：sing-box + Web UI

```powershell
# 1. 下载 sing-box
# 访问 https://github.com/SagerNet/sing-box/releases
# 下载 sing-box-x.x.x-windows-amd64.zip

# 2. 下载订阅配置
Invoke-WebRequest -Uri "https://your-worker.workers.dev/?key=your-subscription-key" -OutFile config.json

# 3. 启动 sing-box（管理员权限）
.\sing-box.exe run -c config.json

# 4. 访问 Web UI
# 浏览器打开 http://127.0.0.1:9090/ui
```

#### 方法2：使用 GUI 客户端

推荐使用 [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev)：

1. 下载安装 Clash Verge Rev
2. 设置 → 订阅 → 新建
3. 输入订阅链接
4. 更新订阅
5. 启用 TUN 模式

### 3.2 macOS 客户端

```bash
# 使用 Homebrew 安装
brew install sing-box

# 下载配置
curl -o ~/sing-box-config.json "https://your-worker.workers.dev/?key=your-subscription-key"

# 启动（需要 sudo 权限用于 TUN）
sudo sing-box run -c ~/sing-box-config.json
```

### 3.3 Linux 客户端

```bash
# 下载 sing-box 详解

# 获取最新版本号
# curl -s：静默模式，不显示进度条
# grep tag_name：提取版本标签
# cut -d '"' -f 4：以双引号为分隔符，取第4个字段
VERSION=$(curl -s https://api.github.com/repos/SagerNet/sing-box/releases/latest | grep tag_name | cut -d '"' -f 4)
echo "最新版本：$VERSION"

# 下载二进制文件
# ${VERSION#v}：删除版本号前的 'v' 字符（v1.8.0 → 1.8.0）
wget https://github.com/SagerNet/sing-box/releases/download/${VERSION}/sing-box-${VERSION#v}-linux-amd64.tar.gz

# 解压文件
tar -xzf sing-box-*.tar.gz

# 移动到系统路径
sudo mv sing-box-*/sing-box /usr/local/bin/

# 清理下载文件
rm -rf sing-box-*

# 验证安装
sing-box version

# 配置 Linux capabilities（TUN 模式需要）
# setcap：设置文件能力
# cap_net_admin=eip：
#   e (effective)：有效能力
#   i (inheritable)：可继承能力
#   p (permitted)：允许的能力
# 这样普通用户也能使用 TUN 模式，无需 root
sudo setcap cap_net_admin=eip /usr/local/bin/sing-box

# 验证 capabilities
getcap /usr/local/bin/sing-box
# 输出：/usr/local/bin/sing-box cap_net_admin=eip

# 创建服务
sudo tee /etc/systemd/system/sing-box-client.service > /dev/null <<EOF
[Unit]
Description=sing-box client
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/sing-box run -c /etc/sing-box/client.json
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# 下载配置
sudo curl -o /etc/sing-box/client.json "https://your-worker.workers.dev/?key=your-subscription-key"

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable sing-box-client
sudo systemctl start sing-box-client
```

### 3.4 Android 客户端

使用 [SFA (sing-box for Android)](https://github.com/SagerNet/sing-box/releases)：

1. 安装 APK
2. 点击 + → 从链接导入
3. 输入订阅链接
4. 启用配置
5. 开启 VPN

### 3.5 iOS 客户端

使用 [Shadowrocket](https://apps.apple.com/app/shadowrocket/id932747118)（付费）：

1. 添加订阅
2. 输入订阅链接
3. 更新订阅
4. 选择节点连接

## 第四步：UI 管理与节点切换

### 4.1 Web UI 使用

打开浏览器访问：`http://127.0.0.1:9090/ui`

功能说明：
- **Proxies**：查看和切换节点
- **Logs**：查看实时日志
- **Connections**：查看当前连接
- **Rules**：查看分流规则
- **Config**：查看当前配置

### 4.2 API 控制节点

```bash
# Clash API 详解
# sing-box 实现了 Clash API 的子集，用于控制和管理

# 1. 查看所有代理节点
# GET /proxies：获取所有代理组和节点信息
curl -X GET "http://127.0.0.1:9090/proxies" \
  -H "Authorization: Bearer your-api-secret" | jq .
# 返回结构：
# {
#   "proxies": {
#     "proxy": {           # 选择器组
#       "all": [...],      # 所有可用节点
#       "now": "auto",     # 当前选中的节点
#       "type": "Selector" # 类型
#     },
#     "香港-HK": {         # 单个节点
#       "type": "Trojan",
#       "history": []      # 延迟历史
#     }
#   }
# }

# 2. 切换节点
# PUT /proxies/{selector}：切换选择器的节点
# {selector}：选择器名称（通常是 "proxy"）
# 请求体：{"name": "节点名称"}

# 切换到香港节点
curl -X PUT "http://127.0.0.1:9090/proxies/proxy" \
  -H "Authorization: Bearer your-api-secret" \
  -H "Content-Type: application/json" \
  -d '{"name":"香港-HK"}'
# 返回：204 No Content（成功）

# 切换到自动选择
curl -X PUT "http://127.0.0.1:9090/proxies/proxy" \
  -H "Authorization: Bearer your-api-secret" \
  -H "Content-Type: application/json" \
  -d '{"name":"auto"}'

# 3. 测试节点延迟
# GET /proxies/{name}/delay：测试指定节点的延迟
# 参数：
#   timeout：超时时间（毫秒）
#   url：测试URL（通常用Google的204页面）
curl -X GET "http://127.0.0.1:9090/proxies/香港-HK/delay?timeout=5000&url=https://www.gstatic.com/generate_204" \
  -H "Authorization: Bearer your-api-secret"
# 返回：{"delay": 123}  # 延迟毫秒数

# 4. 获取当前配置信息
curl -X GET "http://127.0.0.1:9090/configs" \
  -H "Authorization: Bearer your-api-secret"
# 返回：{"mode": "rule"}  # rule/global/direct

# 5. 切换代理模式
# PATCH /configs：更新配置
curl -X PATCH "http://127.0.0.1:9090/configs" \
  -H "Authorization: Bearer your-api-secret" \
  -H "Content-Type: application/json" \
  -d '{"mode":"global"}'  # rule（规则）/global（全局）/direct（直连）

# 6. 查看当前连接
curl -X GET "http://127.0.0.1:9090/connections" \
  -H "Authorization: Bearer your-api-secret"
# 返回所有活动连接的详细信息

# 7. 关闭所有连接
curl -X DELETE "http://127.0.0.1:9090/connections" \
  -H "Authorization: Bearer your-api-secret"
```

### 4.3 快捷切换脚本

创建 `switch-node.ps1`（Windows PowerShell）：

```powershell
$apiUrl = "http://127.0.0.1:9090"
$secret = "your-api-secret"

function Show-Menu {
    Write-Host "========== 节点切换 ==========" -ForegroundColor Cyan
    Write-Host "1. 香港节点"
    Write-Host "2. 美国节点"
    Write-Host "3. 自动选择"
    Write-Host "4. 测试延迟"
    Write-Host "0. 退出"
    Write-Host "==============================" -ForegroundColor Cyan
}

function Switch-Node($nodeName) {
    $headers = @{
        "Authorization" = "Bearer $secret"
        "Content-Type" = "application/json"
    }
    $body = @{name = $nodeName} | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$apiUrl/proxies/proxy" -Method PUT -Headers $headers -Body $body
        Write-Host "已切换到: $nodeName" -ForegroundColor Green
    } catch {
        Write-Host "切换失败: $_" -ForegroundColor Red
    }
}

function Test-Nodes {
    $headers = @{"Authorization" = "Bearer $secret"}
    
    @("香港-HK", "美国-US") | ForEach-Object {
        try {
            $response = Invoke-RestMethod -Uri "$apiUrl/proxies/$_/delay?timeout=5000&url=https://www.gstatic.com/generate_204" -Headers $headers
            Write-Host "$_`: $($response.delay)ms" -ForegroundColor Green
        } catch {
            Write-Host "$_`: 超时" -ForegroundColor Red
        }
    }
}

do {
    Show-Menu
    $choice = Read-Host "请选择"
    
    switch ($choice) {
        "1" { Switch-Node "香港-HK" }
        "2" { Switch-Node "美国-US" }
        "3" { Switch-Node "auto" }
        "4" { Test-Nodes }
        "0" { break }
        default { Write-Host "无效选择" -ForegroundColor Yellow }
    }
    
    if ($choice -ne "0") {
        Write-Host ""
        Read-Host "按回车继续"
        Clear-Host
    }
} while ($choice -ne "0")
```

## 第五步：TUN 模式配置

### Windows TUN 配置

1. 安装 [WinTun 驱动](https://www.wintun.net/)
2. 以管理员权限运行 sing-box
3. TUN 会自动接管系统流量

### macOS TUN 配置

```bash
# 需要 root 权限
sudo sing-box run -c config.json
```

### Linux TUN 配置

```bash
# 方法1：使用 capabilities
sudo setcap cap_net_admin=eip /usr/local/bin/sing-box
sing-box run -c config.json

# 方法2：使用 root
sudo sing-box run -c config.json
```

### TUN 模式验证

```bash
# 检查路由表
ip route show table all

# 检查 DNS
nslookup google.com

# 检查 IP 地址
curl ipinfo.io
```

## 故障排查

### 问题1：无法连接服务器

```bash
# 检查服务器状态
systemctl status sing-box

# 查看日志
journalctl -u sing-box -f

# 测试端口
telnet hk.example.com 443
```

### 问题2：TUN 模式不工作

```bash
# Windows：检查是否有管理员权限
# Linux：检查 capabilities
getcap /usr/local/bin/sing-box

# 检查 TUN 设备
ip link show | grep tun
```

### 问题3：节点延迟高

```bash
# 使用 mtr 诊断
mtr hk.example.com

# 检查 TCP 优化
sysctl net.ipv4.tcp_congestion_control
```

### 问题4：订阅无法更新

```bash
# 测试订阅链接
curl -v "https://your-worker.workers.dev/?key=your-subscription-key"

# 检查 DNS
nslookup your-worker.workers.dev
```

## 优化建议

### 服务端优化

```bash
# TCP 优化
cat >> /etc/sysctl.conf << EOF
net.core.default_qdisc=fq
net.ipv4.tcp_congestion_control=bbr
net.ipv4.tcp_fastopen=3
EOF

sysctl -p
```

### 客户端优化

1. 开启多路复用（multiplex）
2. 调整 DNS 服务器
3. 使用合适的分流规则
4. 定期更新 sing-box 版本

## 安全建议

1. **使用强密码**：至少16位随机字符
2. **定期更新证书**：设置 cron 自动续期
3. **限制访问**：使用防火墙限制端口
4. **监控日志**：定期检查异常连接
5. **订阅加密**：使用密钥保护订阅链接

## 总结

通过本教程，你已经：

✅ 在两个服务器上部署了 Trojan 节点  
✅ 配置了订阅服务（Cloudflare Workers）  
✅ 客户端可以导入订阅并使用  
✅ 实现了 Web UI 节点切换  
✅ 配置了 TUN 全局代理模式  

现在你可以：
- 通过 Web UI (`http://127.0.0.1:9090/ui`) 管理节点
- 使用脚本快速切换节点
- 享受稳定的代理服务

记得定期检查服务器状态和更新配置！