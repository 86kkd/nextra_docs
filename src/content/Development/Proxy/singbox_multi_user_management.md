# sing-box 多用户管理与流量监控完整方案

本教程详细介绍如何设置多用户系统，监控每个用户的流量使用情况，并实现用量限制。

## 目录

- [多用户配置方案](#多用户配置方案)
- [流量统计与监控](#流量统计与监控)
- [用户管理面板](#用户管理面板)
- [自动化管理脚本](#自动化管理脚本)

## 多用户配置方案

### 方案一：sing-box 原生多用户（简单）

sing-box 支持在单个入站中配置多个用户：

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

**限制**：原生方式不支持单独统计每个用户的流量。

### 方案二：多端口方案（推荐）

为每个用户分配独立端口，便于流量统计：

```json
{
  "inbounds": [
    {
      "type": "trojan",
      "tag": "user1-trojan",
      "listen": "::",
      "listen_port": 8001,
      "users": [
        {
          "name": "user1",
          "password": "user1_password"
        }
      ],
      "tls": {
        "enabled": true,
        "server_name": "your-domain.com",
        "certificate_path": "/path/to/cert.pem",
        "key_path": "/path/to/key.pem"
      }
    },
    {
      "type": "trojan",
      "tag": "user2-trojan",
      "listen": "::",
      "listen_port": 8002,
      "users": [
        {
          "name": "user2",
          "password": "user2_password"
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

### 方案三：使用 X-UI 管理面板（最方便）

X-UI 是一个功能强大的多协议代理管理面板，支持：
- 多用户管理
- 流量统计
- 用量限制
- 到期时间设置
- Web 界面管理

#### 安装 X-UI

```bash
# 一键安装脚本
bash <(curl -Ls https://raw.githubusercontent.com/vaxilu/x-ui/master/install.sh)

# 或者使用 3X-UI（更新的分支）
bash <(curl -Ls https://raw.githubusercontent.com/mhsanaei/3x-ui/master/install.sh)
```

#### X-UI 特性

- **用户管理**：创建、编辑、删除用户
- **流量限制**：设置每个用户的流量上限
- **时间限制**：设置账号到期时间
- **流量统计**：实时查看每个用户的流量使用
- **多协议支持**：VMess、VLESS、Trojan、Shadowsocks
- **订阅管理**：为每个用户生成独立订阅链接

## 流量统计与监控

### 方法一：使用 iptables 统计流量

```bash
#!/bin/bash
# traffic-monitor.sh - 基于端口的流量统计

# 创建 iptables 链
create_chains() {
    iptables -N TRAFFIC_IN 2>/dev/null || true
    iptables -N TRAFFIC_OUT 2>/dev/null || true
    
    # 添加到 INPUT 和 OUTPUT 链
    iptables -I INPUT -j TRAFFIC_IN
    iptables -I OUTPUT -j TRAFFIC_OUT
}

# 为每个用户添加规则
add_user_rules() {
    local user=$1
    local port=$2
    
    # 入站流量
    iptables -A TRAFFIC_IN -p tcp --dport $port -m comment --comment "$user-in"
    # 出站流量
    iptables -A TRAFFIC_OUT -p tcp --sport $port -m comment --comment "$user-out"
}

# 获取用户流量
get_user_traffic() {
    local user=$1
    
    # 获取入站流量（字节）
    local in_bytes=$(iptables -nvxL TRAFFIC_IN | grep "$user-in" | awk '{print $2}')
    # 获取出站流量（字节）
    local out_bytes=$(iptables -nvxL TRAFFIC_OUT | grep "$user-out" | awk '{print $2}')
    
    echo "用户: $user"
    echo "下载: $(numfmt --to=iec-i --suffix=B $in_bytes)"
    echo "上传: $(numfmt --to=iec-i --suffix=B $out_bytes)"
    echo "总计: $(numfmt --to=iec-i --suffix=B $((in_bytes + out_bytes)))"
}

# 重置用户流量统计
reset_user_traffic() {
    local user=$1
    iptables -Z TRAFFIC_IN
    iptables -Z TRAFFIC_OUT
}

# 初始化
create_chains

# 添加用户规则
add_user_rules "user1" 8001
add_user_rules "user2" 8002
add_user_rules "user3" 8003

# 查看所有用户流量
for user in user1 user2 user3; do
    get_user_traffic $user
    echo "---"
done
```

### 方法二：使用 sing-box 统计 API

sing-box 提供了统计 API，可以获取连接和流量信息：

```python
#!/usr/bin/env python3
# traffic_stats.py - sing-box 流量统计

import requests
import json
import sqlite3
from datetime import datetime
import time

class TrafficMonitor:
    def __init__(self, api_url="http://127.0.0.1:9090", api_secret="your-secret"):
        self.api_url = api_url
        self.headers = {"Authorization": f"Bearer {api_secret}"}
        self.init_database()
    
    def init_database(self):
        """初始化数据库"""
        self.conn = sqlite3.connect('traffic.db')
        self.cursor = self.conn.cursor()
        
        # 创建用户表
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                port INTEGER,
                traffic_limit BIGINT DEFAULT 0,  -- 流量限制（字节）
                traffic_used BIGINT DEFAULT 0,   -- 已用流量（字节）
                expire_date DATE,                 -- 到期时间
                status TEXT DEFAULT 'active',     -- active/suspended/expired
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 创建流量记录表
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS traffic_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT,
                upload BIGINT,
                download BIGINT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (username) REFERENCES users(username)
            )
        ''')
        
        self.conn.commit()
    
    def add_user(self, username, password, port, traffic_limit_gb=100, expire_days=30):
        """添加用户"""
        traffic_limit = traffic_limit_gb * 1024 * 1024 * 1024  # 转换为字节
        expire_date = datetime.now().timestamp() + (expire_days * 86400)
        
        try:
            self.cursor.execute('''
                INSERT INTO users (username, password, port, traffic_limit, expire_date)
                VALUES (?, ?, ?, ?, ?)
            ''', (username, password, port, traffic_limit, expire_date))
            self.conn.commit()
            print(f"用户 {username} 添加成功")
            return True
        except sqlite3.IntegrityError:
            print(f"用户 {username} 已存在")
            return False
    
    def get_connections(self):
        """获取当前连接"""
        response = requests.get(f"{self.api_url}/connections", headers=self.headers)
        if response.status_code == 200:
            return response.json().get('connections', [])
        return []
    
    def update_traffic(self):
        """更新流量统计"""
        connections = self.get_connections()
        
        # 按用户统计流量
        user_traffic = {}
        for conn in connections:
            # 根据端口识别用户
            port = conn.get('metadata', {}).get('destinationPort')
            user = self.get_user_by_port(port)
            
            if user:
                if user not in user_traffic:
                    user_traffic[user] = {'upload': 0, 'download': 0}
                
                user_traffic[user]['upload'] += conn.get('upload', 0)
                user_traffic[user]['download'] += conn.get('download', 0)
        
        # 更新数据库
        for username, traffic in user_traffic.items():
            self.cursor.execute('''
                UPDATE users 
                SET traffic_used = traffic_used + ?
                WHERE username = ?
            ''', (traffic['upload'] + traffic['download'], username))
            
            # 记录日志
            self.cursor.execute('''
                INSERT INTO traffic_logs (username, upload, download)
                VALUES (?, ?, ?)
            ''', (username, traffic['upload'], traffic['download']))
        
        self.conn.commit()
    
    def get_user_by_port(self, port):
        """根据端口获取用户"""
        self.cursor.execute('SELECT username FROM users WHERE port = ?', (port,))
        result = self.cursor.fetchone()
        return result[0] if result else None
    
    def check_limits(self):
        """检查用户限制"""
        # 检查流量限制
        self.cursor.execute('''
            SELECT username, traffic_used, traffic_limit 
            FROM users 
            WHERE status = 'active' AND traffic_limit > 0
        ''')
        
        for username, used, limit in self.cursor.fetchall():
            if used >= limit:
                self.suspend_user(username, '流量超限')
        
        # 检查到期时间
        current_time = datetime.now().timestamp()
        self.cursor.execute('''
            SELECT username 
            FROM users 
            WHERE status = 'active' AND expire_date < ?
        ''', (current_time,))
        
        for (username,) in self.cursor.fetchall():
            self.suspend_user(username, '账号过期')
    
    def suspend_user(self, username, reason):
        """暂停用户"""
        self.cursor.execute('''
            UPDATE users SET status = 'suspended' WHERE username = ?
        ''', (username,))
        self.conn.commit()
        
        print(f"用户 {username} 已暂停：{reason}")
        
        # TODO: 更新 sing-box 配置，移除该用户
        self.update_singbox_config()
    
    def update_singbox_config(self):
        """更新 sing-box 配置"""
        # 获取所有活跃用户
        self.cursor.execute('''
            SELECT username, password, port 
            FROM users 
            WHERE status = 'active'
        ''')
        
        users = self.cursor.fetchall()
        
        # 生成新配置
        config = self.generate_config(users)
        
        # 保存配置
        with open('/etc/sing-box/config.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        # 重载服务
        import subprocess
        subprocess.run(['systemctl', 'reload', 'sing-box'])
    
    def generate_config(self, users):
        """生成 sing-box 配置"""
        inbounds = []
        
        for username, password, port in users:
            inbounds.append({
                "type": "trojan",
                "tag": f"{username}-trojan",
                "listen": "::",
                "listen_port": port,
                "users": [
                    {
                        "name": username,
                        "password": password
                    }
                ],
                "tls": {
                    "enabled": True,
                    "server_name": "your-domain.com",
                    "certificate_path": "/path/to/cert.pem",
                    "key_path": "/path/to/key.pem"
                }
            })
        
        return {
            "log": {"level": "info"},
            "inbounds": inbounds,
            "outbounds": [{"type": "direct", "tag": "direct"}]
        }
    
    def get_user_stats(self, username):
        """获取用户统计"""
        self.cursor.execute('''
            SELECT traffic_used, traffic_limit, expire_date, status
            FROM users
            WHERE username = ?
        ''', (username,))
        
        result = self.cursor.fetchone()
        if result:
            used, limit, expire, status = result
            return {
                "username": username,
                "traffic_used": self.format_bytes(used),
                "traffic_limit": self.format_bytes(limit) if limit > 0 else "无限制",
                "traffic_remaining": self.format_bytes(limit - used) if limit > 0 else "无限制",
                "expire_date": datetime.fromtimestamp(expire).strftime('%Y-%m-%d'),
                "status": status
            }
        return None
    
    def format_bytes(self, bytes):
        """格式化字节数"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes < 1024.0:
                return f"{bytes:.2f} {unit}"
            bytes /= 1024.0
        return f"{bytes:.2f} PB"
    
    def run_monitor(self, interval=60):
        """运行监控"""
        print(f"开始监控，每 {interval} 秒更新一次...")
        
        while True:
            try:
                # 更新流量
                self.update_traffic()
                
                # 检查限制
                self.check_limits()
                
                # 显示统计
                self.show_all_users_stats()
                
                time.sleep(interval)
                
            except KeyboardInterrupt:
                print("\n监控已停止")
                break
            except Exception as e:
                print(f"错误: {e}")
                time.sleep(interval)
    
    def show_all_users_stats(self):
        """显示所有用户统计"""
        print("\n" + "="*60)
        print(f"用户流量统计 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*60)
        
        self.cursor.execute('SELECT username FROM users')
        for (username,) in self.cursor.fetchall():
            stats = self.get_user_stats(username)
            if stats:
                print(f"\n用户: {stats['username']} ({stats['status']})")
                print(f"  已用流量: {stats['traffic_used']}")
                print(f"  流量限制: {stats['traffic_limit']}")
                print(f"  剩余流量: {stats['traffic_remaining']}")
                print(f"  到期时间: {stats['expire_date']}")

# 使用示例
if __name__ == "__main__":
    monitor = TrafficMonitor()
    
    # 添加用户
    monitor.add_user("alice", "alice_password", 8001, traffic_limit_gb=100, expire_days=30)
    monitor.add_user("bob", "bob_password", 8002, traffic_limit_gb=50, expire_days=30)
    monitor.add_user("charlie", "charlie_password", 8003, traffic_limit_gb=200, expire_days=60)
    
    # 运行监控
    monitor.run_monitor(interval=60)
```

## 用户管理面板

### Web 管理界面

创建一个简单的 Web 管理界面：

```python
# web_panel.py - Flask 用户管理面板

from flask import Flask, render_template, request, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import hashlib
import secrets

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100))
    port = db.Column(db.Integer, unique=True)
    traffic_limit = db.Column(db.BigInteger, default=0)  # 字节
    traffic_used = db.Column(db.BigInteger, default=0)   # 字节
    expire_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'port': self.port,
            'traffic_used': self.format_bytes(self.traffic_used),
            'traffic_limit': self.format_bytes(self.traffic_limit),
            'traffic_percentage': (self.traffic_used / self.traffic_limit * 100) if self.traffic_limit > 0 else 0,
            'expire_date': self.expire_date.strftime('%Y-%m-%d') if self.expire_date else 'Never',
            'status': self.status,
            'days_remaining': (self.expire_date - datetime.now()).days if self.expire_date else -1
        }
    
    @staticmethod
    def format_bytes(bytes):
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes < 1024.0:
                return f"{bytes:.2f} {unit}"
            bytes /= 1024.0
        return f"{bytes:.2f} PB"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/users')
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.json
    
    # 生成端口号（8001-8999）
    existing_ports = [u.port for u in User.query.all()]
    port = 8001
    while port in existing_ports:
        port += 1
    
    # 创建用户
    user = User(
        username=data['username'],
        password=hashlib.sha256(data['password'].encode()).hexdigest(),
        email=data.get('email'),
        port=port,
        traffic_limit=int(data.get('traffic_limit', 100)) * 1024**3,  # GB to bytes
        expire_date=datetime.now() + timedelta(days=int(data.get('expire_days', 30)))
    )
    
    db.session.add(user)
    db.session.commit()
    
    # 更新 sing-box 配置
    update_singbox_config()
    
    return jsonify({'success': True, 'user': user.to_dict()})

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    
    if 'traffic_limit' in data:
        user.traffic_limit = int(data['traffic_limit']) * 1024**3
    if 'expire_days' in data:
        user.expire_date = datetime.now() + timedelta(days=int(data['expire_days']))
    if 'status' in data:
        user.status = data['status']
    
    db.session.commit()
    update_singbox_config()
    
    return jsonify({'success': True, 'user': user.to_dict()})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    update_singbox_config()
    
    return jsonify({'success': True})

@app.route('/api/users/<int:user_id>/reset-traffic', methods=['POST'])
def reset_traffic(user_id):
    user = User.query.get_or_404(user_id)
    user.traffic_used = 0
    db.session.commit()
    
    return jsonify({'success': True})

def update_singbox_config():
    """更新 sing-box 配置文件"""
    active_users = User.query.filter_by(status='active').all()
    
    # 生成配置...
    # 重载 sing-box...
    pass

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### HTML 模板

```html
<!-- templates/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>用户管理面板</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h1 {
            color: #333;
            margin-bottom: 30px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        
        .users-table {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
        }
        
        td {
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .status-active {
            color: #4caf50;
        }
        
        .status-suspended {
            color: #f44336;
        }
        
        .progress-bar {
            width: 100%;
            height: 10px;
            background: #eee;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transition: width 0.3s;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin: 0 2px;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-danger {
            background: #f44336;
            color: white;
        }
        
        .btn-success {
            background: #4caf50;
            color: white;
        }
        
        .add-user-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            font-size: 30px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 多用户管理面板</h1>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="total-users">0</div>
                <div class="stat-label">总用户数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="active-users">0</div>
                <div class="stat-label">活跃用户</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="total-traffic">0 GB</div>
                <div class="stat-label">总流量消耗</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="online-users">0</div>
                <div class="stat-label">在线用户</div>
            </div>
        </div>
        
        <div class="users-table">
            <table>
                <thead>
                    <tr>
                        <th>用户名</th>
                        <th>端口</th>
                        <th>流量使用</th>
                        <th>到期时间</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody id="users-tbody">
                    <!-- 用户数据将在这里动态添加 -->
                </tbody>
            </table>
        </div>
        
        <button class="add-user-btn" onclick="showAddUserModal()">+</button>
    </div>
    
    <script>
        // 加载用户数据
        async function loadUsers() {
            const response = await fetch('/api/users');
            const users = await response.json();
            
            const tbody = document.getElementById('users-tbody');
            tbody.innerHTML = '';
            
            let totalUsers = 0;
            let activeUsers = 0;
            let totalTraffic = 0;
            
            users.forEach(user => {
                totalUsers++;
                if (user.status === 'active') activeUsers++;
                
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td>${user.username}</td>
                    <td>${user.port}</td>
                    <td>
                        <div>${user.traffic_used} / ${user.traffic_limit}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${user.traffic_percentage}%"></div>
                        </div>
                    </td>
                    <td>${user.expire_date} (${user.days_remaining} 天)</td>
                    <td class="status-${user.status}">${user.status}</td>
                    <td>
                        <button class="btn btn-primary" onclick="editUser(${user.id})">编辑</button>
                        <button class="btn btn-success" onclick="resetTraffic(${user.id})">重置流量</button>
                        <button class="btn btn-danger" onclick="deleteUser(${user.id})">删除</button>
                    </td>
                `;
            });
            
            // 更新统计
            document.getElementById('total-users').textContent = totalUsers;
            document.getElementById('active-users').textContent = activeUsers;
        }
        
        // 定时刷新
        loadUsers();
        setInterval(loadUsers, 5000);
        
        // 用户操作函数
        async function resetTraffic(userId) {
            if (confirm('确定要重置该用户的流量统计吗？')) {
                await fetch(`/api/users/${userId}/reset-traffic`, { method: 'POST' });
                loadUsers();
            }
        }
        
        async function deleteUser(userId) {
            if (confirm('确定要删除该用户吗？')) {
                await fetch(`/api/users/${userId}`, { method: 'DELETE' });
                loadUsers();
            }
        }
        
        function showAddUserModal() {
            // 显示添加用户弹窗
            const username = prompt('用户名：');
            const password = prompt('密码：');
            const traffic_limit = prompt('流量限制（GB）：', '100');
            const expire_days = prompt('有效天数：', '30');
            
            if (username && password) {
                fetch('/api/users', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        username,
                        password,
                        traffic_limit,
                        expire_days
                    })
                }).then(() => loadUsers());
            }
        }
    </script>
</body>
</html>
```

## 自动化管理脚本

### 批量用户管理脚本

```bash
#!/bin/bash
# user-manager.sh - 批量用户管理脚本

CONFIG_FILE="/etc/sing-box/config.json"
USER_DB="/etc/sing-box/users.db"

# 添加用户
add_user() {
    local username=$1
    local password=$2
    local traffic_limit=$3  # GB
    local expire_days=$4
    local port=$5
    
    # 生成用户配置
    echo "$username|$password|$port|$traffic_limit|$expire_days|$(date +%s)" >> $USER_DB
    
    echo "用户 $username 添加成功"
    echo "端口: $port"
    echo "密码: $password"
    echo "流量限制: ${traffic_limit}GB"
    echo "有效期: ${expire_days}天"
    
    # 更新配置
    update_config
}

# 批量添加用户
batch_add_users() {
    local prefix=$1
    local count=$2
    local traffic_limit=$3
    local expire_days=$4
    local start_port=8001
    
    for i in $(seq 1 $count); do
        username="${prefix}${i}"
        password=$(openssl rand -hex 8)
        port=$((start_port + i - 1))
        
        add_user "$username" "$password" "$traffic_limit" "$expire_days" "$port"
    done
}

# 更新配置文件
update_config() {
    # 读取所有用户
    local users=()
    while IFS='|' read -r username password port traffic_limit expire_days created; do
        # 检查是否过期
        local current_time=$(date +%s)
        local expire_time=$((created + expire_days * 86400))
        
        if [ $current_time -lt $expire_time ]; then
            users+=("{\"name\":\"$username\",\"password\":\"$password\",\"port\":$port}")
        fi
    done < $USER_DB
    
    # 生成新配置
    # ... 省略配置生成代码
    
    # 重载服务
    systemctl reload sing-box
}

# 导出用户订阅
export_subscription() {
    local username=$1
    local user_info=$(grep "^$username|" $USER_DB)
    
    if [ -z "$user_info" ]; then
        echo "用户不存在"
        return 1
    fi
    
    IFS='|' read -r name password port _ _ _ <<< "$user_info"
    
    # 生成 Trojan URL
    local trojan_url="trojan://${password}@your-domain.com:${port}#${name}"
    
    echo "订阅链接："
    echo "$trojan_url"
    
    # 生成二维码
    echo "$trojan_url" | qrencode -t UTF8
}

# 检查用户状态
check_user_status() {
    local username=$1
    local user_info=$(grep "^$username|" $USER_DB)
    
    if [ -z "$user_info" ]; then
        echo "用户不存在"
        return 1
    fi
    
    IFS='|' read -r name password port traffic_limit expire_days created <<< "$user_info"
    
    # 计算剩余天数
    local current_time=$(date +%s)
    local expire_time=$((created + expire_days * 86400))
    local remaining_days=$(( (expire_time - current_time) / 86400 ))
    
    echo "用户: $name"
    echo "端口: $port"
    echo "流量限制: ${traffic_limit}GB"
    echo "剩余天数: ${remaining_days}天"
    
    # 获取流量使用（从 iptables）
    local traffic=$(iptables -nvxL | grep "dpt:$port" | awk '{sum+=$2} END {print sum}')
    if [ -n "$traffic" ]; then
        local traffic_gb=$(echo "scale=2; $traffic / 1024 / 1024 / 1024" | bc)
        echo "已用流量: ${traffic_gb}GB"
    fi
}

# 主菜单
show_menu() {
    echo "====== 用户管理系统 ======"
    echo "1. 添加单个用户"
    echo "2. 批量添加用户"
    echo "3. 查看用户状态"
    echo "4. 导出用户订阅"
    echo "5. 删除用户"
    echo "6. 重置用户流量"
    echo "7. 延长用户期限"
    echo "0. 退出"
    echo "========================="
}

# 主程序
main() {
    while true; do
        show_menu
        read -p "请选择操作: " choice
        
        case $choice in
            1)
                read -p "用户名: " username
                read -p "密码（留空自动生成）: " password
                [ -z "$password" ] && password=$(openssl rand -hex 8)
                read -p "流量限制（GB）: " traffic_limit
                read -p "有效天数: " expire_days
                read -p "端口: " port
                add_user "$username" "$password" "$traffic_limit" "$expire_days" "$port"
                ;;
            2)
                read -p "用户名前缀: " prefix
                read -p "用户数量: " count
                read -p "流量限制（GB）: " traffic_limit
                read -p "有效天数: " expire_days
                batch_add_users "$prefix" "$count" "$traffic_limit" "$expire_days"
                ;;
            3)
                read -p "用户名: " username
                check_user_status "$username"
                ;;
            4)
                read -p "用户名: " username
                export_subscription "$username"
                ;;
            0)
                echo "退出"
                exit 0
                ;;
            *)
                echo "无效选择"
                ;;
        esac
        
        echo
        read -p "按回车继续..."
    done
}

# 初始化
[ ! -f "$USER_DB" ] && touch "$USER_DB"

# 运行主程序
main
```

## 最佳实践建议

### 1. 流量限制策略

- **日流量限制**：防止突发大流量
- **月流量限制**：总体控制
- **速度限制**：限制带宽使用

### 2. 用户分组管理

```json
{
  "groups": {
    "vip": {
      "traffic_limit": "500GB",
      "speed_limit": "100Mbps",
      "expire_days": 365
    },
    "premium": {
      "traffic_limit": "200GB",
      "speed_limit": "50Mbps",
      "expire_days": 90
    },
    "basic": {
      "traffic_limit": "50GB",
      "speed_limit": "10Mbps",
      "expire_days": 30
    }
  }
}
```

### 3. 自动化任务

```bash
# crontab -e
# 每小时更新流量统计
0 * * * * /usr/local/bin/update_traffic.sh

# 每天凌晨检查过期用户
0 0 * * * /usr/local/bin/check_expired_users.sh

# 每月1号重置流量
0 0 1 * * /usr/local/bin/reset_monthly_traffic.sh
```

### 4. 监控告警

- 流量超过 80% 时发送提醒
- 账号即将到期提醒
- 异常流量检测

## 总结

多用户管理的关键点：

1. **用户隔离**：每个用户独立端口或标签
2. **流量统计**：准确记录每个用户的使用量
3. **限制策略**：流量限制、时间限制、速度限制
4. **自动化管理**：自动检查、自动停用、自动续期
5. **友好界面**：Web 管理面板，方便操作
6. **数据持久化**：使用数据库存储用户信息

推荐使用 X-UI 或 3X-UI 等成熟的管理面板，它们已经实现了完整的多用户管理功能。如果需要定制化功能，可以基于本教程的脚本进行开发。