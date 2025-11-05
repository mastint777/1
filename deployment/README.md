# Deployment Configuration

This directory contains systemd service files for deploying the YouTube Analytics application to a VPS/VDS.

## Files

- `backend.service` - Systemd service for the FastAPI backend
- `frontend.service` - Systemd service for the Next.js frontend

## Automatic Deployment

The GitHub Actions workflow (`.github/workflows/deploy-to-vds.yml`) automatically deploys both services when you push to the `main` branch.

### Prerequisites on VPS

Before the automatic deployment can work, ensure your VPS has:

1. **Git** installed:
   ```bash
   sudo apt update
   sudo apt install -y git
   ```

2. **Python 3** and **venv**:
   ```bash
   sudo apt install -y python3 python3-venv python3-pip
   ```

3. **Node.js** and **npm** (version 18 or higher):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

4. **Repository Secrets** configured in GitHub:
   - `VDS_HOST` - Your VPS IP address or hostname
   - `VDS_USER` - SSH username (usually `root`)
   - `VDS_PASSWORD` - SSH password for the user

### What the Workflow Does

1. **Clones/Updates Repository** - Clones to `/opt/1` or pulls latest changes
2. **Backend Setup**:
   - Creates Python virtual environment
   - Installs dependencies from `requirements.txt`
   - Installs systemd service
   - Restarts backend service
3. **Frontend Setup**:
   - Installs npm dependencies
   - Builds the Next.js application
   - Installs systemd service
   - Restarts frontend service
4. **Verifies** both services are running

### Service Ports

- **Backend**: Runs on port 8000
- **Frontend**: Runs on port 3000

### Manual Service Management

If you need to manually manage the services on the VPS:

```bash
# Check status
sudo systemctl status backend
sudo systemctl status frontend

# View logs
sudo journalctl -u backend -f
sudo journalctl -u frontend -f

# Restart services
sudo systemctl restart backend
sudo systemctl restart frontend

# Stop services
sudo systemctl stop backend
sudo systemctl stop frontend

# Start services
sudo systemctl start backend
sudo systemctl start frontend
```

## Manual Installation

If you prefer to set up services manually:

1. SSH to your VPS:
   ```bash
   ssh user@your-vps-ip
   ```

2. Clone the repository:
   ```bash
   sudo mkdir -p /opt
   cd /opt
   sudo git clone https://github.com/mastint777/1.git
   ```

3. Copy service files:
   ```bash
   sudo cp /opt/1/deployment/backend.service /etc/systemd/system/
   sudo cp /opt/1/deployment/frontend.service /etc/systemd/system/
   ```

4. Set up backend:
   ```bash
   cd /opt/1/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   deactivate
   ```

5. Set up frontend:
   ```bash
   cd /opt/1/frontend
   npm install
   npm run build
   ```

6. Enable and start services:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable backend frontend
   sudo systemctl start backend frontend
   ```

7. Verify:
   ```bash
   sudo systemctl status backend
   sudo systemctl status frontend
   ```

## Environment Variables

Both services may require environment variables. Create `.env` files in the respective directories:

- `/opt/1/backend/.env` - Backend environment variables
- `/opt/1/frontend/.env.local` - Frontend environment variables

See `.env.example` files in each directory for required variables.

## Troubleshooting

### Backend not starting

1. Check logs:
   ```bash
   sudo journalctl -u backend -n 50
   ```

2. Verify Python dependencies:
   ```bash
   cd /opt/1/backend
   source venv/bin/activate
   pip list
   ```

3. Test manually:
   ```bash
   cd /opt/1/backend
   source venv/bin/activate
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

### Frontend not starting

1. Check logs:
   ```bash
   sudo journalctl -u frontend -n 50
   ```

2. Verify build completed:
   ```bash
   ls -la /opt/1/frontend/.next
   ```

3. Test manually:
   ```bash
   cd /opt/1/frontend
   npm start
   ```

### Port already in use

If ports 8000 or 3000 are already in use, you can modify the service files to use different ports:

1. Edit the service file:
   ```bash
   sudo nano /etc/systemd/system/backend.service
   ```

2. Change the port in the `ExecStart` line

3. Reload and restart:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart backend
   ```

## Security Recommendations

1. **Use SSH keys** instead of passwords for GitHub Actions
2. **Configure firewall** to only allow necessary ports:
   ```bash
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

3. **Set up reverse proxy** (nginx) to handle HTTPS and proxy to backend/frontend
4. **Use environment variables** for sensitive data, never commit secrets to the repository
5. **Regularly update** system packages and dependencies

## Next Steps

After deployment:

1. Configure nginx as a reverse proxy
2. Set up SSL certificates with Let's Encrypt
3. Configure domain names for frontend and backend
4. Set up monitoring and logging
5. Configure automated backups
