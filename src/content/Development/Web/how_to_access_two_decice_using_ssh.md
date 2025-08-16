# How to Keep Device 2 Always Accessible via SSH Tunnel

Overview

You'll create a persistent reverse SSH tunnel from Device 2 to your server, allowing Device 1 to connect through the server at any time.

Step 1: Install autossh on Device 2

# Ubuntu/Debian
sudo apt install autossh

# Fedora/RHEL  
sudo dnf install autossh

# Arch Linux
sudo pacman -S autossh

Step 2: Set up SSH Key Authentication

On Device 2, generate and copy SSH key to your server:
# Generate SSH key (if you don't have one)
ssh-keygen -t rsa -b 4096

# Copy the key to your server
ssh-copy-id user@your-server-ip

# Test the connection (should login without password)
ssh user@your-server-ip

Step 3: Create Systemd Service

Create a service file on Device 2:
sudo nano /etc/systemd/system/ssh-tunnel.service

Add this content (replace placeholders):
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

Step 4: Enable and Start the Service

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable ssh-tunnel.service

# Start the service now
sudo systemctl start ssh-tunnel.service

# Check status
sudo systemctl status ssh-tunnel.service

Step 5: Configure Server (Optional but Recommended)

On your server, edit /etc/ssh/sshd_config:
sudo nano /etc/ssh/sshd_config

Add or modify these lines:
GatewayPorts yes
ClientAliveInterval 30
ClientAliveCountMax 3

Restart SSH service:
sudo systemctl restart sshd

Step 6: Connect from Device 1

Now you can SSH from Device 1 to Device 2:
# First SSH to your server
ssh user@your-server-ip

# Then from the server, connect to Device 2
ssh -p 2222 localhost

Or in one command from Device 1:
ssh -t user@your-server-ip ssh -p 2222 localhost

Alternative: Using SSH Config on Device 1

Create ~/.ssh/config on Device 1:
Host server
    HostName YOUR_SERVER_IP
    User user

Host device2
    HostName localhost
    Port 2222
    User device2-user
    ProxyJump server

Then simply:
ssh device2

Troubleshooting

Check if tunnel is active on Device 2:

# Check service logs
sudo journalctl -u ssh-tunnel.service -f

# Check if autossh process is running
ps aux | grep autossh

# Test connection locally
ssh -p 2222 localhost

If tunnel keeps dropping:

1. Increase ServerAliveInterval to 60
2. Check firewall rules on server
3. Ensure Device 2 has stable internet
4. Check server's SSH logs: sudo tail -f /var/log/auth.log

Security Tips

1. Use non-standard ports: Instead of 2222, use a random high port (e.g., 43721)
2. Limit access on server: Add firewall rules to only allow specific IPs
3. Use fail2ban: Install on server to prevent brute force attacks
4. Monitor connections: Regularly check who and last commands on server

Multiple Devices

For multiple devices, use different ports:
- Device 2: -R 2222:localhost:22
- Device 3: -R 2223:localhost:22
- Device 4: -R 2224:localhost:22

Each device needs its own systemd service file with unique port configuration.
