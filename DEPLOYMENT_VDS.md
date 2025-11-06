# VDS/VPS Deployment Guide

This guide explains how to deploy the YouTube Analytics System to your own VDS/VPS server using GitHub Actions.

## Prerequisites

1. **VDS/VPS Server Requirements**:
   - Ubuntu 20.04 or later (recommended) or any Linux distribution
   - At least 1GB RAM
   - At least 10GB disk space
   - SSH access with root or sudo privileges
   - Python 3.8 or higher installed
   - Node.js 18.x or higher installed
   - Git installed

2. **GitHub Repository**:
   - Push access to your repository
   - Ability to add secrets

## Step 1: Prepare Your Server

SSH into your server and install required software:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3 and pip
sudo apt install -y python3 python3-pip python3-venv

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Verify installations
python3 --version  # Should be 3.8+
node --version     # Should be 18.x+
npm --version
git --version
```

## Step 2: Configure GitHub Secrets

The deployment workflow requires the following secrets to be configured in your GitHub repository:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of the following:

### Required Secrets

| Secret Name | Description | Example Value |
|------------|-------------|---------------|
| `VDS_HOST` | Your server's IP address or domain | `192.168.1.100` or `example.com` |
| `VDS_USER` | SSH username (usually `root` or your user) | `root` |
| `VDS_PASSWORD` | SSH password for the user | `your-secure-password` |

### Optional Secrets

| Secret Name | Description | Default Value |
|------------|-------------|---------------|
| `VDS_PORT` | SSH port number | `22` |

### Important Notes:

- **VDS_HOST**: Should be ONLY the IP address or hostname, without any protocol prefix (no `http://`, `https://`, or `ssh://`)
  - ✅ Correct: `192.168.1.100` or `example.com`
  - ❌ Wrong: `ssh://192.168.1.100` or `https://example.com`

- **VDS_USER**: The user should have sudo privileges without password prompt for systemd commands, or be root

- **VDS_PASSWORD**: Use a strong password. For production, consider using SSH keys instead (see Advanced Configuration below)

## Step 3: Trigger Deployment

There are two ways to trigger the deployment:

### Option A: Automatic Deployment (on push to main)

Simply push changes to the `main` branch:

```bash
git add .
git commit -m "Deploy to VDS"
git push origin main
```

The deployment will start automatically.

### Option B: Manual Deployment

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click **Deploy to VDS** workflow
4. Click **Run workflow** button
5. Select branch (usually `main`)
6. Click **Run workflow**

## Step 4: Monitor Deployment

1. Go to **Actions** tab in your repository
2. Click on the running workflow
3. Click on the **deploy** job
4. Watch the logs in real-time

The deployment process includes:
- Cloning/updating the repository on the server
- Setting up Python virtual environment
- Installing backend dependencies
- Building the frontend
- Installing and starting systemd services
- Verifying both services are running

## Step 5: Verify Deployment

After successful deployment, verify your services are running:

### Check Backend

```bash
# SSH into your server
ssh your-user@your-server-ip

# Check backend status
sudo systemctl status backend.service

# Check backend logs
sudo journalctl -u backend.service -f

# Test backend API
curl http://localhost:8000/health
```

### Check Frontend

```bash
# Check frontend status
sudo systemctl status frontend.service

# Check frontend logs
sudo journalctl -u frontend.service -f

# Test frontend (if serving on port 3000)
curl http://localhost:3000
```

### Access Your Application

- **Backend API**: `http://your-server-ip:8000`
- **Frontend**: `http://your-server-ip:3000`
- **API Documentation**: `http://your-server-ip:8000/docs`

## Troubleshooting

### Deployment Fails with SSH Connection Error

**Error**: `dial tcp: address tcp/xxxx: unknown port`

**Solutions**:
1. Verify `VDS_HOST` secret contains ONLY the IP/hostname (no `ssh://` prefix)
2. Check that port 22 is open on your server's firewall
3. Verify SSH credentials are correct
4. If using a custom SSH port, set the `VDS_PORT` secret

```bash
# On your server, check if SSH is running
sudo systemctl status ssh

# Check firewall rules
sudo ufw status

# Allow SSH through firewall if needed
sudo ufw allow 22/tcp
```

### Python or Node.js Not Found

**Error**: `python3 not found` or `node not found`

**Solution**: Install missing software on your server:

```bash
# Install Python 3
sudo apt install -y python3 python3-pip python3-venv

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Permission Denied Errors

**Error**: `Permission denied` when copying systemd files or running systemctl

**Solutions**:
1. Ensure your user has sudo privileges
2. Configure passwordless sudo for systemctl commands:

```bash
# Edit sudoers file
sudo visudo

# Add this line (replace 'your-user' with your username):
your-user ALL=(ALL) NOPASSWD: /bin/systemctl, /bin/cp, /bin/journalctl
```

Or use `root` user for deployment.

### Services Fail to Start

**Check backend logs**:
```bash
sudo journalctl -u backend.service -n 100 --no-pager
```

**Check frontend logs**:
```bash
sudo journalctl -u frontend.service -n 100 --no-pager
```

**Common issues**:
- Missing environment variables (configure in systemd service files)
- Port already in use (check with `sudo lsof -i :8000` or `sudo lsof -i :3000`)
- Missing dependencies (check logs for import errors)

### Restart Services Manually

```bash
# Restart backend
sudo systemctl restart backend.service

# Restart frontend
sudo systemctl restart frontend.service

# Restart both
sudo systemctl restart backend.service frontend.service
```

## Advanced Configuration

### Using SSH Keys Instead of Password

For better security, use SSH key authentication:

1. Generate SSH key pair (on your local machine or in GitHub Actions):
```bash
ssh-keygen -t ed25519 -C "github-actions" -f deploy_key
```

2. Add public key to server:
```bash
# On your server
echo "your-public-key-content" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

3. Update GitHub workflow to use key instead of password:
   - Remove `VDS_PASSWORD` secret
   - Add `VDS_SSH_KEY` secret with the private key content
   - Modify workflow to use `key: ${{ secrets.VDS_SSH_KEY }}`

### Custom Installation Directory

To use a different directory than `/opt/1`:

1. Modify the workflow file (`.github/workflows/deploy-to-vds.yml`)
2. Change all occurrences of `/opt/1` to your preferred path
3. Update systemd service files accordingly

### Environment Variables for Backend

Add environment variables in `/opt/1/deployment/backend.service`:

```ini
[Service]
Environment="PATH=/opt/1/backend/venv/bin"
Environment="YOUTUBE_API_KEYS=your-api-keys-here"
Environment="DATABASE_URL=sqlite:////opt/1/backend/youtube_analytics.db"
Environment="CORS_ORIGINS=http://your-frontend-domain.com"
```

### Using a Reverse Proxy (Nginx)

To serve your application on standard ports (80/443):

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/youtube-analytics
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/youtube-analytics /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Automatic Deployment on Schedule

To deploy automatically on a schedule, add this to your workflow file:

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch: {}
  schedule:
    - cron: '0 2 * * 0'  # Every Sunday at 2 AM UTC
```

## Security Best Practices

1. **Use SSH keys** instead of passwords
2. **Configure firewall** to allow only necessary ports
3. **Keep secrets secure** - never commit them to the repository
4. **Regularly update** your server and dependencies
5. **Use HTTPS** with SSL/TLS certificates (Let's Encrypt)
6. **Monitor logs** regularly for suspicious activity
7. **Backup your data** regularly

## Updating Your Deployment

To update your deployment after making changes:

```bash
# Make your changes
git add .
git commit -m "Update application"
git push origin main
```

The GitHub Actions workflow will automatically deploy the updates to your server.

## Manual Deployment (Alternative)

If you prefer to deploy manually without GitHub Actions:

```bash
# SSH into your server
ssh your-user@your-server-ip

# Navigate to project directory
cd /opt/1

# Pull latest changes
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
sudo systemctl restart backend.service

# Update frontend
cd ../frontend
npm install
npm run build
sudo systemctl restart frontend.service
```

## Support

If you encounter issues not covered in this guide:

1. Check the GitHub Actions logs for detailed error messages
2. Review server logs: `sudo journalctl -u backend.service -f`
3. Verify all prerequisites are installed correctly
4. Ensure firewall allows necessary connections
5. Check that secrets are configured correctly

## Cost Estimate

- **VDS/VPS Server**: $5-20/month (depending on provider and specs)
- **Domain Name** (optional): $10-15/year
- **SSL Certificate**: Free (Let's Encrypt)

**Total**: ~$5-20/month + optional domain
