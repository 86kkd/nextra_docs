# 检测 VPN/代理的可行方案与工具清单

> 目的：在不单纯依赖 IP 的前提下，综合网络层特征、行为、设备指纹与威胁情报，更可靠地识别 VPN/代理/TOR 使用。

## 总览

- **网络层特征**：端口/协议、TLS 指纹（JA3/JA3S）、包长与流量统计。
- **行为模式**：地理位置异常、延迟/抖动异常、多账号共享出口。
- **设备与环境**：浏览器/设备指纹、DNS 泄漏、时区与语言不一致。
- **第三方情报**：商用/开源 VPN/代理数据库与信誉评分。

建议以“多信号融合”为原则，再结合可解释的阈值或模型来决策。

## 一、网络层特征检测

- **端口与协议**
  - 常见：OpenVPN（UDP 1194/443）、WireGuard（UDP 任意端口，握手特征明显）、IPSec、L2TP、SSTP 等。
  - 结合 NetFlow/PCAP 统计握手与持续会话的特征。
- **TLS 指纹（JA3/JA3S）**
  - 不同客户端的 TLS ClientHello/ServerHello 会产生稳定的指纹，可用于识别特定 VPN 客户端族。
  - 工具：`Zeek`、`Suricata` 支持 JA3/JA3S 提取与匹配。
- **包长/时序特征**
  - 加密隧道常呈现特定的包长分布与保活行为。可结合 `Zeek`、`Wireshark`、流量统计（如 `pmacct`）做特征聚合。

## 二、行为模式检测

- **地理位置快速切换**：短时间跨国登录；结合设备指纹与历史常驻地判断。
- **延迟与抖动**：VPN 通常增加 RTT 与抖动。建立业务基线，计算偏离度（Z-Score/百分位）。
- **多账号共用出口**：同一 IP/CIDR 对多账号频繁登录，疑似代理或共用节点。

## 三、设备与环境特征

- **浏览器/设备指纹**：User-Agent、Canvas/WebGL、字体、分辨率、音频指纹等。
  - 开源方案：`FingerprintJS Open Source`、`ClientJS`（较旧）。
- **DNS 泄漏**：若业务可观察到真实 DNS 请求来源（DoH/DoT 例外），可与声明位置比对。
- **时区与语言**：浏览器 `Intl` 时区、`Accept-Language` 与账号宣称位置不一致时提升风险。

## 四、第三方情报与检测服务（带链接）

- [IPinfo Proxy & VPN Detection](https://ipinfo.io/products/proxy-detection)
- [IPQualityScore (IPQS) Proxy/VPN/TOR Detection](https://www.ipqualityscore.com/proxy-detection)
- [proxycheck.io](https://proxycheck.io)
- [IP2Proxy](https://www.ip2proxy.com)
- [vpnapi.io](https://vpnapi.io)
- [GetIPIntel](https://getipintel.net)
- [Tor Project Exit List](https://check.torproject.org/torbulkexitlist)

提示：覆盖率、实时性、费用与误报率各有权衡，建议“多源比对 + 本地缓存 + 灰度阈值”。

## 五、实操清单（落地指南）

1. **接入一到两个情报源**（商用 + 备选开源），对高风险 IP 标注标签与置信度。
2. **融合业务信号**：
   - 账号维度：登录地变更、设备更换、失败重试、风控历史。
   - 会话维度：RTT 抖动、UA 变更、Cookie/指纹稳定度。
3. **设定阈值与策略**：
   - 风险分 ≥ X：触发二次验证（短信/邮件/OAuth Recheck）。
   - 风险分 ≥ Y：限制敏感操作（提现/大量改密）。
4. **存证与可解释性**：在审计表记录证据（来源、时间、指标）。
5. **持续评估**：每月抽样复核误报/漏报，更新指纹与名单。

## 六、隐私与合规

- 告知用户风控逻辑的大类目的（不暴露细节），提供申诉通道。
- 遵守数据最小化与留存周期要求，避免采集与业务无关的敏感数据。

---

需要的话，我可以补充一份“服务端中间件集成示例”（Node.js/Go/Python），演示如何并行调用多个情报源并缓存结果。
