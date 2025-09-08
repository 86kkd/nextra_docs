# sing-box Direct Outbound 与 Route Rules 深度解析

本文详细解析 sing-box 中 direct outbound 和 route rules 的关系、区别以及在 1.13.0 版本后的重大变化，帮助你理解何时使用 outbound 引用，何时使用 rule actions。

## 版本演进与废弃说明

### sing-box 版本时间线

| 版本 | 变化 | 影响 |
|------|------|------|
| < 1.11.0 | 传统模式 | 所有流量必须通过 outbound 处理 |
| 1.11.0 | 引入 rule actions | 开始支持不依赖 outbound 的处理方式 |
| 1.13.0 | 废弃特殊 outbound | `block` 和 `dns` 类型被移除，`direct` 保留 |
| 当前 (1.13.0+) | 混合模式 | outbound 和 action 共存 |

### 被废弃的 Outbound

```json
// ❌ 1.13.0 后不再支持
{
  "outbounds": [
    {"type": "block", "tag": "block"},  // 已废弃
    {"type": "dns", "tag": "dns-out"}   // 已废弃
  ]
}

// ✅ 仍然有效
{
  "outbounds": [
    {"type": "direct", "tag": "direct"}  // 继续支持
  ]
}
```

## Direct Outbound 详解

### 基本配置

```json
{
  "type": "direct",
  "tag": "direct",
  
  // 可选的高级配置
  "override_address": "1.1.1.1",     // 覆盖目标地址（1.13.0 废弃）
  "override_port": 443,              // 覆盖目标端口（1.13.0 废弃）
  "proxy_protocol": 0,               // 代理协议版本
  
  // 网络优化
  "bind_interface": "en0",           // 绑定网络接口
  "inet4_bind_address": "0.0.0.0",   // IPv4 绑定地址
  "inet6_bind_address": "::",        // IPv6 绑定地址
  "routing_mark": 233,               // Linux 路由标记
  "reuse_addr": true,                // 地址重用
  "connect_timeout": "5s",           // 连接超时
  "tcp_fast_open": true,             // TCP 快速打开
  "tcp_multi_path": true,            // MPTCP
  "udp_fragment": true,              // UDP 分片
  "domain_strategy": "prefer_ipv4",  // 域名解析策略
  
  // 分离的拨号字段
  "detour": "another-out",           // 通过其他出站连接
  "bind_interface": "en0",           // 绑定接口
  "protect_path": "/run/vpn.sock"    // Android VPN 保护路径
}
```

### Direct Outbound 的应用场景

#### 1. 需要特定网络配置

```json
{
  "type": "direct",
  "tag": "direct-wlan",
  "bind_interface": "wlan0",  // 强制使用 WiFi
  "tcp_fast_open": true,
  "domain_strategy": "prefer_ipv4"
}
```

#### 2. 多网卡分流

```json
{
  "outbounds": [
    {
      "type": "direct",
      "tag": "direct-eth",
      "bind_interface": "eth0"  // 有线网络
    },
    {
      "type": "direct",
      "tag": "direct-wlan",
      "bind_interface": "wlan0"  // 无线网络
    },
    {
      "type": "direct",
      "tag": "direct-cell",
      "bind_interface": "rmnet0"  // 移动网络
    }
  ]
}
```

#### 3. 策略路由

```json
{
  "type": "direct",
  "tag": "direct-marked",
  "routing_mark": 0x233,  // Linux 策略路由标记
  "protect_path": "/run/vpn/protect.sock"  // VPN 保护
}
```

## Route Rules 详解

### Rule 的基本结构

```json
{
  "route": {
    "rules": [
      {
        // 匹配条件（可组合）
        "inbound": ["tun-in"],              // 入站标签
        "ip_version": 4,                    // IP 版本
        "network": ["tcp", "udp"],          // 网络协议
        "protocol": ["http", "tls", "dns"], // 应用协议
        "domain": ["example.com"],          // 域名
        "domain_suffix": [".cn"],           // 域名后缀
        "domain_keyword": ["google"],       // 域名关键词
        "domain_regex": ["^ad\\."],         // 域名正则
        "geosite": ["cn", "netflix"],       // 地理站点
        "source_geoip": ["cn"],             // 源 IP 地理位置
        "geoip": ["cn", "private"],         // 目标 IP 地理位置
        "source_ip_cidr": ["192.168.0.0/16"], // 源 IP CIDR
        "ip_cidr": ["10.0.0.0/8"],         // 目标 IP CIDR
        "source_port": [1080, 8080],        // 源端口
        "source_port_range": ["1000:2000"], // 源端口范围
        "port": [80, 443],                  // 目标端口
        "port_range": ["8000:9000"],        // 目标端口范围
        "process_name": ["telegram"],       // 进程名
        "user": ["root"],                   // 用户
        "user_id": [1000],                  // 用户 ID
        "clash_mode": "direct",             // Clash 模式
        "rule_set": ["my_ruleset"],         // 规则集引用
        
        // 处理方式（二选一）
        "outbound": "direct",                // 方式1：使用 outbound
        // 或
        "action": "route"                    // 方式2：使用 action
      }
    ]
  }
}
```

### Route Actions 类型

#### 1. route - 路由动作

```json
{
  "geosite": "cn",
  "action": "route",           // 继续路由
  "outbound": "direct"         // 可选：指定 outbound
}

// 等价于
{
  "geosite": "cn",
  "outbound": "direct"         // 直接指定 outbound
}
```

#### 2. reject - 拒绝连接

```json
// 返回错误
{
  "geosite": "category-ads",
  "action": "reject"           // 替代 outbound: "block"
}

// 静默丢弃
{
  "geosite": "phishing",
  "action": "reject-drop"      // 不返回错误
}
```

#### 3. hijack-dns - DNS 劫持

```json
{
  "protocol": "dns",
  "action": "hijack-dns"        // 替代 outbound: "dns-out"
}
```

#### 4. sniff - 协议嗅探

```json
{
  "port": 443,
  "action": "sniff",            // 继续嗅探
  "sniff_timeout": "300ms"
}
```

#### 5. resolve - 域名解析

```json
{
  "domain": ["example.com"],
  "action": "resolve",          // 强制解析域名
  "server": "local",            // 使用指定 DNS 服务器
  "disable_cache": false        // 是否禁用缓存
}
```

## Direct vs Route：深度对比

### 概念层面

| 特性 | Direct Outbound | Route Action |
|------|----------------|--------------|
| **定义** | 一种出站连接类型 | 路由规则的处理动作 |
| **层级** | 连接层 | 路由层 |
| **职责** | 建立实际的网络连接 | 决定流量如何处理 |
| **配置位置** | `outbounds` 数组 | `route.rules` 数组 |
| **可复用性** | 可被多个规则引用 | 仅在当前规则生效 |

### 使用场景对比

#### 场景1：简单直连

```json
// 使用 outbound（传统方式）
{
  "outbounds": [
    {"type": "direct", "tag": "direct"}
  ],
  "route": {
    "rules": [
      {
        "geosite": "cn",
        "outbound": "direct"  // 引用 outbound
      }
    ]
  }
}

// 使用 action（新方式）
{
  "route": {
    "rules": [
      {
        "geosite": "cn",
        "action": "route"     // 不需要 outbound
      }
    ]
  }
}
```

#### 场景2：需要特定配置

```json
// 必须使用 outbound
{
  "outbounds": [
    {
      "type": "direct",
      "tag": "direct-fast",
      "bind_interface": "eth0",     // 特定接口
      "tcp_fast_open": true,        // TCP 优化
      "domain_strategy": "ipv4_only" // 解析策略
    }
  ],
  "route": {
    "rules": [
      {
        "geosite": "cn",
        "outbound": "direct-fast"   // 使用特定配置
      }
    ]
  }
}

// action 无法实现（缺少配置能力）
{
  "route": {
    "rules": [
      {
        "geosite": "cn",
        "action": "route"  // ❌ 无法指定接口、TCP 选项等
      }
    ]
  }
}
```

## 实战配置示例

### 完整的混合配置

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
      "auto_route": true,
      "strict_route": true
    }
  ],
  
  "outbounds": [
    // 代理节点
    {
      "type": "shadowsocks",
      "tag": "proxy",
      "server": "example.com",
      "server_port": 8388,
      "method": "2022-blake3-aes-256-gcm",
      "password": "password"
    },
    
    // 直连出站（带特定配置）
    {
      "type": "direct",
      "tag": "direct",
      "tcp_fast_open": true,
      "domain_strategy": "prefer_ipv4"
    },
    
    // 分接口直连
    {
      "type": "direct",
      "tag": "direct-wifi",
      "bind_interface": "wlan0"
    },
    
    // 选择器
    {
      "type": "selector",
      "tag": "select",
      "outbounds": ["proxy", "direct"],
      "default": "proxy"
    }
  ],
  
  "route": {
    "geoip": {
      "path": "geoip.db",
      "download_url": "https://github.com/SagerNet/sing-geoip/releases/latest/download/geoip.db"
    },
    "geosite": {
      "path": "geosite.db",
      "download_url": "https://github.com/SagerNet/sing-geosite/releases/latest/download/geosite.db"
    },
    "rules": [
      // DNS 劫持（使用 action）
      {
        "protocol": "dns",
        "action": "hijack-dns"
      },
      
      // 广告拦截（使用 action）
      {
        "geosite": "category-ads-all",
        "action": "reject"
      },
      
      // 恶意网站（静默丢弃）
      {
        "geosite": "phishing",
        "action": "reject-drop"
      },
      
      // 国内直连（使用 outbound）
      {
        "geosite": "cn",
        "geoip": "cn",
        "outbound": "direct"
      },
      
      // 局域网直连（使用 action）
      {
        "geoip": "private",
        "action": "route"  // 简单直连用 action
      },
      
      // WiFi 下载（使用特定 outbound）
      {
        "port_range": ["8000:8999"],
        "network": "tcp",
        "outbound": "direct-wifi"  // 需要绑定接口
      },
      
      // 流媒体
      {
        "geosite": ["netflix", "disney"],
        "outbound": "proxy"
      }
    ],
    "final": "select",
    "auto_detect_interface": true
  },
  
  "experimental": {
    "clash_api": {
      "external_controller": "127.0.0.1:9090",
      "secret": "password"
    }
  }
}
```

## 最佳实践建议

### 何时使用 Direct Outbound

1. **需要特定网络配置时**
   - 绑定网络接口
   - TCP/UDP 优化选项
   - 域名解析策略

2. **需要复用配置时**
   - 多个规则使用相同的直连配置
   - 便于统一管理和修改

3. **兼容性考虑**
   - 与其他工具配合
   - 迁移旧配置

### 何时使用 Route Action

1. **简单的流量处理**
   - 基本的直连需求
   - 拒绝/丢弃流量
   - DNS 劫持

2. **不需要特殊配置**
   - 默认网络设置即可
   - 无需绑定接口

3. **追求配置简洁**
   - 减少配置复杂度
   - 一次性规则

### 混合使用策略

```json
{
  "outbounds": [
    // 保留必要的 direct outbound
    {
      "type": "direct",
      "tag": "direct",
      "tcp_fast_open": true  // 通用优化
    },
    {
      "type": "direct",
      "tag": "direct-special",
      "bind_interface": "eth0"  // 特殊需求
    }
  ],
  
  "route": {
    "rules": [
      // 简单规则用 action
      {"geoip": "private", "action": "route"},
      {"geosite": "ads", "action": "reject"},
      {"protocol": "dns", "action": "hijack-dns"},
      
      // 复杂需求用 outbound
      {"geosite": "cn", "outbound": "direct"},
      {"port": 8080, "outbound": "direct-special"}
    ]
  }
}
```

## 迁移指南

### 从旧版本迁移

```json
// 旧配置（< 1.11.0）
{
  "outbounds": [
    {"type": "direct", "tag": "direct"},
    {"type": "block", "tag": "block"},     // 将被废弃
    {"type": "dns", "tag": "dns-out"}      // 将被废弃
  ],
  "route": {
    "rules": [
      {"geoip": "cn", "outbound": "direct"},
      {"geosite": "ads", "outbound": "block"},
      {"protocol": "dns", "outbound": "dns-out"}
    ]
  }
}

// 新配置（1.13.0+）
{
  "outbounds": [
    {"type": "direct", "tag": "direct"}    // 保留
  ],
  "route": {
    "rules": [
      {"geoip": "cn", "outbound": "direct"},      // 可选：保持不变
      {"geosite": "ads", "action": "reject"},     // 必须：改用 action
      {"protocol": "dns", "action": "hijack-dns"} // 必须：改用 action
    ]
  }
}
```

### 兼容性处理

```bash
# 如果需要临时使用废弃功能
export ENABLE_DEPRECATED_SPECIAL_OUTBOUNDS=true
sing-box run -c config.json

# 建议：尽快完成迁移
sing-box migrate -c old_config.json > new_config.json
```

## 性能考量

### Direct Outbound 的开销

- **内存占用**：每个 outbound 实例占用固定内存
- **管理开销**：需要维护 outbound 池
- **查找时间**：规则匹配时需要查找 outbound

### Route Action 的优势

- **更少的内存**：不创建额外的 outbound 实例
- **更快的处理**：直接在路由层处理
- **更好的缓存**：规则结果可缓存

### 性能对比

```bash
# 测试配置性能
sing-box check -c config.json --stats

# 基准测试
sing-box bench -c config.json -n 10000
```

## 常见问题解答

### Q1: 为什么保留 direct 而废弃 block 和 dns？

**答**：`direct` 包含复杂的网络配置选项（接口绑定、TCP 优化等），这些功能在 action 中难以实现。而 `block` 和 `dns` 的功能相对简单，可以完全由 action 替代。

### Q2: 使用 action 会影响性能吗？

**答**：通常 action 性能更好，因为减少了 outbound 查找开销。但对于需要复杂配置的场景，使用 direct outbound 仍是必要的。

### Q3: 可以完全不用 direct outbound 吗？

**答**：技术上可以（使用 `action: "route"`），但不推荐。保留至少一个 direct outbound 可以提供更好的灵活性和兼容性。

### Q4: 如何选择使用 outbound 还是 action？

**判断标准**：
- 需要特定网络配置 → 使用 outbound
- 只需要简单处理 → 使用 action
- 配置需要复用 → 使用 outbound
- 一次性规则 → 使用 action

## 总结

1. **Direct outbound 仍然重要**：提供了 action 无法替代的网络配置能力
2. **Route action 更简洁**：适合简单的流量处理需求
3. **混合使用是最佳实践**：根据具体需求选择合适的方式
4. **及时迁移废弃功能**：`block` 和 `dns` outbound 应尽快迁移到 action

理解 direct outbound 和 route rules 的区别与联系，能帮助你写出更优雅、高效的 sing-box 配置。记住：它们不是对立的，而是互补的关系。