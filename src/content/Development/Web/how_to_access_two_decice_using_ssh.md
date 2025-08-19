# SSH Tunnel Setup - Connect Two Devices Through a Server

## Overview
Connect two devices without public IPs through a server with public IP using SSH tunneling. This guide provides three methods from simple to persistent solutions.

## Prerequisites
- **Server**: Public IPv4 address
- **Device 1**: The device you want to SSH from
- **Device 2**: The device you want to SSH to
- All devices have SSH installed and configured

## Method 1: SSH Port Forwarding (Simple but Manual)

This method requires manual setup each time but is the simplest to understand.

### On Device 1 (SSH from):
```bash
ssh -L 2222:localhost:22 user@your-server-ip
```
This creates a local port forward. Keep this terminal open.

### On Device 2 (SSH to):
```bash
ssh -R 2222:localhost:22 user@your-server-ip
```
This creates a reverse tunnel. Keep this terminal open.

### Connect from Device 1:
Open a new terminal on Device 1 and run:
```bash
ssh -p 2222 user@localhost
```

## Method 2: SSH ProxyJump (More Elegant)

This method uses SSH ProxyJump feature for cleaner connections.

### Step 1: Configure Device 1
Add to `~/.ssh/config` on Device 1:
```
Host device2
    HostName localhost
    User device2-user
    Port 2222
    ProxyJump user@your-server-ip
```

### Step 2: Create Reverse Tunnel on Device 2
Device 2 still needs to maintain the reverse tunnel:
```bash
ssh -R 2222:localhost:22 user@your-server-ip
```

### Step 3: Connect from Device 1
Simply run:
```bash
ssh device2
```

## Method 3: Persistent Solution with autossh (Production Ready)

This method keeps Device 2 always accessible through automatic reconnection.

### Server Configuration Required (If Connection Refused)

If the server refuses connections, you need to configure SSH daemon properly:

#### Edit SSH Configuration on Server:
```bash
sudo nano /etc/ssh/sshd_config
```

Add or modify these settings:
```
# Allow TCP forwarding
AllowTcpForwarding yes

# Allow gateway ports (for reverse tunnels)
GatewayPorts clientspecified
# Or use 'yes' for all interfaces (less secure)
# GatewayPorts yes

# Keep connections alive
ClientAliveInterval 30
ClientAliveCountMax 3

# Allow specific users (optional, more secure)
AllowUsers user1 user2

# Permit tunnel (some distributions need this)
PermitTunnel yes

# Max sessions per connection
MaxSessions 10

# Max startups (prevent connection refused under load)
MaxStartups 10:30:100
```

#### Apply Changes:
```bash
# Validate configuration
sudo sshd -t

# Restart SSH service
sudo systemctl restart sshd
# Or on older systems
sudo service ssh restart
```

#### Check Firewall Rules:
```bash
# Check if port 22 is open
sudo ufw status
# If using ufw, allow SSH
sudo ufw allow ssh

# For iptables
sudo iptables -L -n | grep 22
# Allow SSH if needed
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

#### Verify SSH is Listening:
```bash
# Check SSH is running
sudo systemctl status sshd
# Check listening ports
sudo ss -tlnp | grep :22
```

### Step 1: Install autossh on Device 2
```bash
# Ubuntu/Debian
sudo apt install autossh

# Fedora/RHEL  
sudo dnf install autossh

# Arch Linux
sudo pacman -S autossh
```

### Step 2: Setup SSH Key Authentication
On Device 2:
```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096

# Copy the key to your server
ssh-copy-id user@your-server-ip

# Test the connection (should login without password)
ssh user@your-server-ip
```

### Step 3: Quick Start with autossh
For immediate use:
```bash
autossh -M 0 -f -N -R 2222:localhost:22 -o "ServerAliveInterval 30" -o "ServerAliveCountMax 3" user@your-server-ip
```

### Step 4: Create Systemd Service (For Boot Persistence)
Create `/etc/systemd/system/ssh-tunnel.service` on Device 2:
```ini
[Unit]
Description=SSH Reverse Tunnel to Server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=YOUR_USERNAME
ExecStart=/usr/bin/autossh -M 0 -N \
  -o "ServerAliveInterval 30" \
  -o "ServerAliveCountMax 3" \
  -o "ExitOnForwardFailure=yes" \
  -o "StrictHostKeyChecking=no" \
  -R 2222:localhost:22 \
  user@YOUR_SERVER_IP
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable ssh-tunnel.service
sudo systemctl start ssh-tunnel.service
sudo systemctl status ssh-tunnel.service
```

### Step 5: Connect from Device 1
```bash
# Direct connection
ssh -t user@your-server-ip ssh -p 2222 localhost

# Or using SSH config (add to ~/.ssh/config on Device 1)
Host server
    HostName YOUR_SERVER_IP
    User user

Host device2
    HostName localhost
    Port 2222
    User device2-user
    ProxyJump server

# Then simply:
ssh device2
```

## Server Configuration (Optional but Recommended)

Edit `/etc/ssh/sshd_config` on your server:
```
GatewayPorts yes
ClientAliveInterval 30
ClientAliveCountMax 3
```

Restart SSH service:
```bash
sudo systemctl restart sshd
```

## Comparison of Methods

| Method | Persistence | Complexity | Use Case |
|--------|------------|------------|----------|
| **Port Forwarding** | Manual | Simple | Quick testing, temporary access |
| **ProxyJump** | Manual | Medium | Regular access with cleaner syntax |
| **autossh + systemd** | Automatic | Complex | Production, always-on access |

## Troubleshooting

### Check if tunnel is active:
```bash
# On Device 2
sudo journalctl -u ssh-tunnel.service -f
ps aux | grep autossh

# On Server
ss -tlnp | grep 2222
ssh -p 2222 localhost
```

### Common Issues:
1. **Connection drops**: Increase `ServerAliveInterval` to 60
2. **Permission denied**: Check SSH keys and user permissions
3. **Port already in use**: Change port 2222 to another value
4. **Firewall blocking**: Check firewall rules on all devices

## Security Best Practices

1. **Use non-standard ports**: Replace 2222 with random high port (30000-65535)
2. **Implement fail2ban**: Install on server to prevent brute force
3. **Use SSH keys only**: Disable password authentication
4. **Monitor access**: Regular check with `who`, `last`, `w` commands

## Multiple Devices

For connecting multiple devices, use different ports:
```bash
# Device 2
autossh -M 0 -f -N -R 2222:localhost:22 user@server-ip

# Device 3
autossh -M 0 -f -N -R 2223:localhost:22 user@server-ip

# Device 4
autossh -M 0 -f -N -R 2224:localhost:22 user@server-ip
```

Each device needs its own systemd service file with unique port configuration.