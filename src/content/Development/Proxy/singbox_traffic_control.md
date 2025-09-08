# sing-box 用户流量控制与限制

本文介绍如何为 sing-box 代理服务实现用户流量控制、配额管理和自动限制功能。

## 核心架构

流量控制系统包含以下组件：
- **流量统计模块**：实时记录每个用户的流量使用
- **配额管理系统**：设置和管理用户流量限制
- **自动控制器**：达到限制时自动禁用账户
- **Web 管理面板**：可视化管理界面

## 方案一：使用 sing-box + 流量统计脚本

### 1. 服务器配置（支持多用户）

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
  ],
  "stats": {
    "enabled": true,
    "inbounds": ["trojan-in"],
    "outbounds": ["direct"],
    "users": ["user1", "user2", "user3"]
  }
}
```

### 2. 流量监控脚本

创建 `/opt/singbox-traffic/traffic_monitor.py`：

```python
#!/usr/bin/env python3
import json
import sqlite3
import subprocess
import time
from datetime import datetime, timedelta
import os
import sys

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
                email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'active',
                monthly_quota INTEGER DEFAULT 100,  -- GB
                total_quota INTEGER DEFAULT 0,      -- GB, 0 means unlimited
                reset_day INTEGER DEFAULT 1         -- 每月重置日期
            )
        ''')
        
        # 流量记录表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS traffic_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                upload_bytes INTEGER DEFAULT 0,
                download_bytes INTEGER DEFAULT 0,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (username) REFERENCES users(username)
            )
        ''')
        
        # 月度统计表
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS monthly_stats (
                username TEXT NOT NULL,
                month TEXT NOT NULL,
                upload_bytes INTEGER DEFAULT 0,
                download_bytes INTEGER DEFAULT 0,
                PRIMARY KEY (username, month),
                FOREIGN KEY (username) REFERENCES users(username)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def get_traffic_stats(self):
        """从 sing-box 获取流量统计"""
        try:
            # 使用 sing-box API 获取统计信息
            result = subprocess.run(
                ["curl", "-s", "http://127.0.0.1:9090/stats"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return json.loads(result.stdout)
            return None
        except Exception as e:
            print(f"获取流量统计失败: {e}")
            return None
    
    def update_traffic(self, username, upload, download):
        """更新用户流量"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 记录流量日志
        cursor.execute('''
            INSERT INTO traffic_logs (username, upload_bytes, download_bytes)
            VALUES (?, ?, ?)
        ''', (username, upload, download))
        
        # 更新月度统计
        current_month = datetime.now().strftime('%Y-%m')
        cursor.execute('''
            INSERT INTO monthly_stats (username, month, upload_bytes, download_bytes)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(username, month) DO UPDATE SET
                upload_bytes = upload_bytes + ?,
                download_bytes = download_bytes + ?
        ''', (username, current_month, upload, download, upload, download))
        
        conn.commit()
        conn.close()
    
    def check_quota(self, username):
        """检查用户配额"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 获取用户配额设置
        cursor.execute('''
            SELECT monthly_quota, total_quota, reset_day, status
            FROM users WHERE username = ?
        ''', (username,))
        user = cursor.fetchone()
        
        if not user:
            conn.close()
            return True  # 用户不存在，允许使用
        
        monthly_quota, total_quota, reset_day, status = user
        
        if status != 'active':
            conn.close()
            return False  # 用户已被禁用
        
        # 检查月度流量
        current_month = datetime.now().strftime('%Y-%m')
        cursor.execute('''
            SELECT upload_bytes + download_bytes as total
            FROM monthly_stats
            WHERE username = ? AND month = ?
        ''', (username, current_month))
        
        result = cursor.fetchone()
        monthly_used = result[0] if result else 0
        monthly_used_gb = monthly_used / (1024**3)
        
        # 检查总流量（如果设置了）
        if total_quota > 0:
            cursor.execute('''
                SELECT SUM(upload_bytes + download_bytes) as total
                FROM traffic_logs
                WHERE username = ?
            ''', (username,))
            total_used = cursor.fetchone()[0] or 0
            total_used_gb = total_used / (1024**3)
            
            if total_used_gb >= total_quota:
                self.disable_user(username, "总流量超限")
                conn.close()
                return False
        
        # 检查月度流量
        if monthly_used_gb >= monthly_quota:
            self.disable_user(username, "月流量超限")
            conn.close()
            return False
        
        conn.close()
        return True
    
    def disable_user(self, username, reason=""):
        """禁用用户"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users SET status = 'disabled'
            WHERE username = ?
        ''', (username,))
        
        conn.commit()
        conn.close()
        
        # 更新 sing-box 配置
        self.update_singbox_config()
        
        # 记录日志
        print(f"用户 {username} 已被禁用: {reason}")
        
    def enable_user(self, username):
        """启用用户"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users SET status = 'active'
            WHERE username = ?
        ''', (username,))
        
        conn.commit()
        conn.close()
        
        # 更新 sing-box 配置
        self.update_singbox_config()
    
    def update_singbox_config(self):
        """更新 sing-box 配置文件"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 获取所有活跃用户
        cursor.execute('''
            SELECT username, password
            FROM users
            WHERE status = 'active'
        ''')
        active_users = cursor.fetchall()
        
        # 读取当前配置
        with open(self.config_path, 'r') as f:
            config = json.load(f)
        
        # 更新用户列表
        users_list = []
        for username, password in active_users:
            users_list.append({
                "name": username,
                "password": password
            })
        
        # 更新配置
        for inbound in config.get('inbounds', []):
            if inbound.get('type') in ['trojan', 'vmess']:
                inbound['users'] = users_list
        
        # 写回配置文件
        with open(self.config_path, 'w') as f:
            json.dump(config, f, indent=2)
        
        # 重启 sing-box
        subprocess.run(["systemctl", "restart", "sing-box"])
        
        conn.close()
    
    def reset_monthly_quota(self):
        """重置月度配额"""
        today = datetime.now().day
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 查找需要重置的用户
        cursor.execute('''
            SELECT username FROM users
            WHERE reset_day = ? AND status = 'disabled'
        ''', (today,))
        
        users_to_reset = cursor.fetchall()
        
        for (username,) in users_to_reset:
            # 检查是否因为月流量超限被禁用
            cursor.execute('''
                SELECT monthly_quota FROM users WHERE username = ?
            ''', (username,))
            monthly_quota = cursor.fetchone()[0]
            
            current_month = datetime.now().strftime('%Y-%m')
            cursor.execute('''
                SELECT upload_bytes + download_bytes as total
                FROM monthly_stats
                WHERE username = ? AND month = ?
            ''', (username, current_month))
            
            result = cursor.fetchone()
            if result:
                monthly_used_gb = result[0] / (1024**3)
                if monthly_used_gb >= monthly_quota:
                    # 重新启用用户
                    self.enable_user(username)
                    print(f"用户 {username} 月度配额已重置并重新启用")
        
        conn.close()
    
    def monitor_loop(self):
        """主监控循环"""
        while True:
            try:
                # 获取流量统计
                stats = self.get_traffic_stats()
                if stats:
                    for user_stat in stats.get('users', []):
                        username = user_stat['name']
                        upload = user_stat.get('upload', 0)
                        download = user_stat.get('download', 0)
                        
                        # 更新流量记录
                        self.update_traffic(username, upload, download)
                        
                        # 检查配额
                        self.check_quota(username)
                
                # 检查是否需要重置月度配额
                self.reset_monthly_quota()
                
                # 每5分钟检查一次
                time.sleep(300)
                
            except KeyboardInterrupt:
                print("监控程序已停止")
                break
            except Exception as e:
                print(f"监控出错: {e}")
                time.sleep(60)

if __name__ == "__main__":
    monitor = TrafficMonitor()
    monitor.monitor_loop()
```

### 3. Web 管理面板

创建 `/opt/singbox-traffic/web_panel.py`：

```python
#!/usr/bin/env python3
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
import sqlite3
import json
import hashlib
import secrets
from datetime import datetime
import os

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)

DB_PATH = "/opt/singbox-traffic/traffic.db"
ADMIN_PASSWORD_HASH = hashlib.sha256("your-admin-password".encode()).hexdigest()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    if 'logged_in' not in session:
        return redirect(url_for('login'))
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 获取所有用户统计
    cursor.execute('''
        SELECT 
            u.username,
            u.email,
            u.status,
            u.monthly_quota,
            u.total_quota,
            COALESCE(ms.upload_bytes + ms.download_bytes, 0) as monthly_used,
            COALESCE(total.total_bytes, 0) as total_used
        FROM users u
        LEFT JOIN monthly_stats ms ON u.username = ms.username 
            AND ms.month = strftime('%Y-%m', 'now')
        LEFT JOIN (
            SELECT username, SUM(upload_bytes + download_bytes) as total_bytes
            FROM traffic_logs
            GROUP BY username
        ) total ON u.username = total.username
        ORDER BY u.username
    ''')
    
    users = cursor.fetchall()
    conn.close()
    
    return render_template('dashboard.html', users=users)

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        password = request.form.get('password')
        if hashlib.sha256(password.encode()).hexdigest() == ADMIN_PASSWORD_HASH:
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            return render_template('login.html', error='密码错误')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('login'))

@app.route('/api/user/<username>', methods=['GET', 'PUT', 'DELETE'])
def manage_user(username):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        if user:
            return jsonify(dict(user))
        return jsonify({'error': 'User not found'}), 404
    
    elif request.method == 'PUT':
        data = request.json
        cursor.execute('''
            UPDATE users 
            SET monthly_quota = ?, total_quota = ?, status = ?, reset_day = ?
            WHERE username = ?
        ''', (
            data.get('monthly_quota', 100),
            data.get('total_quota', 0),
            data.get('status', 'active'),
            data.get('reset_day', 1),
            username
        ))
        conn.commit()
        
        # 如果状态改变，更新 sing-box 配置
        if 'status' in data:
            os.system('python3 /opt/singbox-traffic/update_config.py')
        
        return jsonify({'success': True})
    
    elif request.method == 'DELETE':
        cursor.execute('DELETE FROM users WHERE username = ?', (username,))
        conn.commit()
        os.system('python3 /opt/singbox-traffic/update_config.py')
        return jsonify({'success': True})
    
    conn.close()

@app.route('/api/add_user', methods=['POST'])
def add_user():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    
    # 生成随机密码
    password = secrets.token_urlsafe(16)
    
    cursor.execute('''
        INSERT INTO users (username, password, email, monthly_quota, total_quota)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        data['username'],
        password,
        data.get('email', ''),
        data.get('monthly_quota', 100),
        data.get('total_quota', 0)
    ))
    
    conn.commit()
    conn.close()
    
    # 更新 sing-box 配置
    os.system('python3 /opt/singbox-traffic/update_config.py')
    
    return jsonify({'success': True, 'password': password})

@app.route('/api/reset_traffic/<username>', methods=['POST'])
def reset_traffic(username):
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    
    current_month = datetime.now().strftime('%Y-%m')
    cursor.execute('''
        DELETE FROM monthly_stats 
        WHERE username = ? AND month = ?
    ''', (username, current_month))
    
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

@app.route('/api/stats')
def get_stats():
    if 'logged_in' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 获取总体统计
    cursor.execute('''
        SELECT 
            COUNT(*) as total_users,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
            SUM(upload_bytes + download_bytes) as total_traffic
        FROM users u
        LEFT JOIN traffic_logs t ON u.username = t.username
    ''')
    
    stats = dict(cursor.fetchone())
    conn.close()
    
    return jsonify(stats)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=False)
```

### 4. HTML 模板

创建 `/opt/singbox-traffic/templates/dashboard.html`：

```html
<!DOCTYPE html>
<html>
<head>
    <title>流量管理面板</title>
    <meta charset="utf-8">
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
        
        .header {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }
        
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        
        .users-table {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: #f8f9fa;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #dee2e6;
        }
        
        td {
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
        }
        
        .status-active {
            color: #28a745;
            font-weight: 600;
        }
        
        .status-disabled {
            color: #dc3545;
            font-weight: 600;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #007bff, #0056b3);
            transition: width 0.3s;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            transition: opacity 0.3s;
        }
        
        .btn:hover {
            opacity: 0.8;
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
        }
        
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        
        .btn-success {
            background: #28a745;
            color: white;
        }
        
        .actions {
            display: flex;
            gap: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>流量管理面板</h1>
            <div style="float: right;">
                <button class="btn btn-primary" onclick="addUser()">添加用户</button>
                <a href="/logout" class="btn btn-danger">退出</a>
            </div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="total-users">-</div>
                <div class="stat-label">总用户数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="active-users">-</div>
                <div class="stat-label">活跃用户</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="total-traffic">-</div>
                <div class="stat-label">总流量</div>
            </div>
        </div>
        
        <div class="users-table">
            <table>
                <thead>
                    <tr>
                        <th>用户名</th>
                        <th>状态</th>
                        <th>月流量使用</th>
                        <th>总流量使用</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {% for user in users %}
                    <tr>
                        <td>{{ user.username }}</td>
                        <td>
                            <span class="status-{{ user.status }}">
                                {{ '活跃' if user.status == 'active' else '禁用' }}
                            </span>
                        </td>
                        <td>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: {{ (user.monthly_used / (user.monthly_quota * 1024**3) * 100) if user.monthly_quota > 0 else 0 }}%"></div>
                            </div>
                            {{ '%.2f' | format(user.monthly_used / 1024**3) }} / {{ user.monthly_quota }} GB
                        </td>
                        <td>
                            {{ '%.2f' | format(user.total_used / 1024**3) }} GB
                        </td>
                        <td>
                            <div class="actions">
                                {% if user.status == 'active' %}
                                <button class="btn btn-danger" onclick="toggleUser('{{ user.username }}', 'disable')">禁用</button>
                                {% else %}
                                <button class="btn btn-success" onclick="toggleUser('{{ user.username }}', 'enable')">启用</button>
                                {% endif %}
                                <button class="btn btn-primary" onclick="resetTraffic('{{ user.username }}')">重置流量</button>
                            </div>
                        </td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        // 加载统计数据
        fetch('/api/stats')
            .then(r => r.json())
            .then(data => {
                document.getElementById('total-users').textContent = data.total_users || 0;
                document.getElementById('active-users').textContent = data.active_users || 0;
                document.getElementById('total-traffic').textContent = 
                    ((data.total_traffic || 0) / (1024**3)).toFixed(2) + ' GB';
            });
        
        function addUser() {
            const username = prompt('输入用户名:');
            if (!username) return;
            
            const monthly = prompt('月流量限制 (GB):', '100');
            const total = prompt('总流量限制 (GB, 0=无限):', '0');
            
            fetch('/api/add_user', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    username: username,
                    monthly_quota: parseInt(monthly),
                    total_quota: parseInt(total)
                })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    alert(`用户已创建\n密码: ${data.password}`);
                    location.reload();
                }
            });
        }
        
        function toggleUser(username, action) {
            const status = action === 'enable' ? 'active' : 'disabled';
            fetch(`/api/user/${username}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({status: status})
            })
            .then(() => location.reload());
        }
        
        function resetTraffic(username) {
            if (!confirm(`确定要重置 ${username} 的流量统计吗？`)) return;
            
            fetch(`/api/reset_traffic/${username}`, {
                method: 'POST'
            })
            .then(() => location.reload());
        }
    </script>
</body>
</html>
```

### 5. 安装和部署脚本

创建 `/opt/singbox-traffic/install.sh`：

```bash
#!/bin/bash

# 安装依赖
apt update
apt install -y python3 python3-pip

# 安装 Python 包
pip3 install flask

# 创建目录
mkdir -p /opt/singbox-traffic/templates

# 创建 systemd 服务 - 流量监控
cat > /etc/systemd/system/singbox-traffic-monitor.service << EOF
[Unit]
Description=sing-box Traffic Monitor
After=network.target sing-box.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/singbox-traffic
ExecStart=/usr/bin/python3 /opt/singbox-traffic/traffic_monitor.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 创建 systemd 服务 - Web 面板
cat > /etc/systemd/system/singbox-traffic-web.service << EOF
[Unit]
Description=sing-box Traffic Web Panel
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/singbox-traffic
ExecStart=/usr/bin/python3 /opt/singbox-traffic/web_panel.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 重载 systemd
systemctl daemon-reload

# 启动服务
systemctl enable singbox-traffic-monitor
systemctl enable singbox-traffic-web
systemctl start singbox-traffic-monitor
systemctl start singbox-traffic-web

echo "流量控制系统已安装"
echo "Web 面板地址: http://your-server:8080"
echo "默认管理员密码: your-admin-password"
```

## 方案二：使用 V2Ray-Core + V2Ray-Stats

如果你需要更精细的流量控制，可以使用 V2Ray-Core 的统计功能：

### V2Ray 配置示例

```json
{
  "stats": {},
  "api": {
    "tag": "api",
    "services": ["StatsService"]
  },
  "policy": {
    "levels": {
      "0": {
        "statsUserUplink": true,
        "statsUserDownlink": true
      }
    },
    "system": {
      "statsInboundUplink": true,
      "statsInboundDownlink": true,
      "statsOutboundUplink": true,
      "statsOutboundDownlink": true
    }
  },
  "inbounds": [
    {
      "tag": "api",
      "port": 10085,
      "protocol": "dokodemo-door",
      "settings": {
        "address": "127.0.0.1"
      }
    },
    {
      "tag": "trojan",
      "port": 443,
      "protocol": "trojan",
      "settings": {
        "clients": [
          {
            "password": "password1",
            "email": "user1@example.com",
            "level": 0
          }
        ]
      }
    }
  ],
  "routing": {
    "rules": [
      {
        "type": "field",
        "inboundTag": ["api"],
        "outboundTag": "api"
      }
    ]
  }
}
```

## 方案三：使用 Nginx 流量统计模块

对于基于 Nginx 的代理，可以使用 nginx-module-vts：

```nginx
http {
    vhost_traffic_status_zone;
    
    server {
        listen 8080;
        location /status {
            vhost_traffic_status_display;
            vhost_traffic_status_display_format json;
        }
    }
    
    server {
        listen 443 ssl;
        server_name your-domain.com;
        
        # 为每个用户设置独立的 location
        location /user1/ {
            vhost_traffic_status_filter_by_set_key $uri user1::$server_name;
            proxy_pass http://backend;
        }
    }
}
```

## 用户配额管理最佳实践

### 1. 配额策略设置

```python
# 配额策略示例
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
    },
    'unlimited': {
        'monthly_quota': 0,        # 无限
        'speed_limit': 0,          # 无限
        'concurrent_connections': 0 # 无限
    }
}
```

### 2. 自动化管理脚本

```bash
#!/bin/bash
# 每日运行的维护脚本

# 检查并禁用超额用户
python3 /opt/singbox-traffic/check_quotas.py

# 清理过期日志
find /opt/singbox-traffic/logs -type f -mtime +30 -delete

# 备份数据库
cp /opt/singbox-traffic/traffic.db /backup/traffic-$(date +%Y%m%d).db

# 发送日报
python3 /opt/singbox-traffic/send_report.py
```

### 3. 监控告警

```python
# 告警脚本
def check_alerts():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 检查即将超额的用户（80%）
    cursor.execute('''
        SELECT username, email, 
               (monthly_used * 100.0 / (monthly_quota * 1024^3)) as usage_percent
        FROM user_stats
        WHERE usage_percent > 80 AND usage_percent < 100
    ''')
    
    for user in cursor.fetchall():
        send_email(user['email'], 
                  f"流量警告：您已使用 {user['usage_percent']:.1f}% 的月度流量")
    
    conn.close()
```

## 常见问题

### 1. 如何实现速度限制？

在 sing-box 配置中添加：

```json
{
  "inbounds": [
    {
      "type": "trojan",
      "settings": {
        "clients": [{
          "password": "password",
          "level": 1
        }]
      }
    }
  ],
  "policy": {
    "levels": {
      "1": {
        "connIdle": 300,
        "downlinkOnly": 1024,  // KB/s
        "uplinkOnly": 1024     // KB/s
      }
    }
  }
}
```

### 2. 如何防止用户共享账号？

```python
def check_concurrent_connections(username):
    """检查并发连接数"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT COUNT(DISTINCT ip_address) as unique_ips
        FROM active_connections
        WHERE username = ? 
        AND last_seen > datetime('now', '-5 minutes')
    ''', (username,))
    
    unique_ips = cursor.fetchone()[0]
    
    if unique_ips > 3:  # 超过3个不同IP
        log_suspicious_activity(username, f"检测到 {unique_ips} 个不同IP同时使用")
        # 可选：自动禁用账号
        disable_user(username, "疑似共享账号")
    
    conn.close()
```

### 3. 如何实现流量包购买？

```python
def purchase_traffic_package(username, package_gb):
    """购买流量包"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 添加到用户的额外流量
    cursor.execute('''
        UPDATE users 
        SET bonus_traffic = bonus_traffic + ?
        WHERE username = ?
    ''', (package_gb * 1024**3, username))
    
    # 记录购买历史
    cursor.execute('''
        INSERT INTO purchase_history (username, package_gb, purchase_date)
        VALUES (?, ?, datetime('now'))
    ''', (username, package_gb))
    
    conn.commit()
    conn.close()
```

## 总结

通过以上方案，你可以实现：

1. **精确的流量统计** - 记录每个用户的上传/下载流量
2. **灵活的配额管理** - 设置月度、总量限制
3. **自动化控制** - 超额自动禁用，到期自动重置
4. **可视化管理** - Web 面板实时查看和管理
5. **告警通知** - 流量预警和异常检测

选择合适的方案取决于你的具体需求和技术栈。建议从简单的脚本开始，逐步增加功能。