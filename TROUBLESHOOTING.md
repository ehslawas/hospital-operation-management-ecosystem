# 🔧 Hospital Management System - Troubleshooting Guide

## ✅ Quick Health Check

### Step 1: Is Docker Running?
```bash
docker --version
```
- ✅ Should show: Docker version 28.x.x or similar
- ❌ If error: Start Docker Desktop application

### Step 2: Are Containers Running?
```bash
docker ps
```
- ✅ Should show 2 containers: `hospital_app` and `hospital_db` with status "Up"
- ❌ If not running: See "How to Start Server" below

### Step 3: Can You Access the Website?
Open browser and go to: **http://localhost:3001**

- ✅ Shows login page: Everything is working!
- ❌ Cannot connect: See solutions below

---

## 🚀 How to Start Server

### Option 1: Using the Batch File (EASIEST)
Double-click: `START_HOSPITAL.bat`

### Option 2: Using Command Line
```bash
cd c:\Users\60113\hospital-management
docker-compose -f docker-compose.hospital.yml up -d
```

Wait 1-2 minutes for the server to start, then access: **http://localhost:3001**

---

## 🛑 How to Stop Server

### Option 1: Using the Batch File
Double-click: `STOP_HOSPITAL.bat`

### Option 2: Using Command Line
```bash
cd c:\Users\60113\hospital-management
docker-compose -f docker-compose.hospital.yml down
```

---

## 🔍 Common Problems & Solutions

### Problem 1: "This site can't be reached"
**Symptoms**: Browser shows connection error

**Solutions**:
1. Check if Docker Desktop is running (look for whale icon in system tray)
2. Check if containers are running: `docker ps`
3. If containers not running, start them: `START_HOSPITAL.bat`
4. Wait 2 minutes after starting for app to be ready
5. Try accessing: http://localhost:3001

### Problem 2: "Page loading forever"
**Symptoms**: Browser shows loading but never completes

**Solutions**:
1. **First time loading takes 30-80 seconds** - this is normal! Wait patiently.
2. Check logs: `docker logs hospital_app --tail 20`
3. Look for "Ready in X.Xs" message in logs
4. Try refreshing the page after 2 minutes

### Problem 3: "Cannot find module" or Error 500
**Symptoms**: Error page displayed

**Solutions**:
1. Restart the containers:
   ```bash
   docker-compose -f docker-compose.hospital.yml restart
   ```
2. If still not working, rebuild:
   ```bash
   docker-compose -f docker-compose.hospital.yml down
   docker-compose -f docker-compose.hospital.yml up -d
   ```

### Problem 4: Database Connection Error
**Symptoms**: "Failed to connect to database"

**Solutions**:
1. Check if database container is healthy:
   ```bash
   docker ps
   ```
   Look for "healthy" status on `hospital_db`
2. Restart database:
   ```bash
   docker restart hospital_db
   ```
3. Wait 30 seconds, then restart app:
   ```bash
   docker restart hospital_app
   ```

### Problem 5: Docker Desktop not starting
**Symptoms**: "Docker daemon is not running"

**Solutions**:
1. Restart your computer
2. Open Docker Desktop manually from Start Menu
3. Wait for Docker to fully start (whale icon stops animating)
4. Try starting the hospital system again

### Problem 6: Port 3001 already in use
**Symptoms**: "Port 3001 is already allocated"

**Solutions**:
1. Check what's using the port:
   ```bash
   netstat -ano | findstr :3001
   ```
2. Stop the other application, or
3. Edit `docker-compose.hospital.yml` and change port 3001 to 3002:
   ```yaml
   ports:
     - '3002:3000'  # Changed from 3001
   ```
4. Restart containers
5. Access at: http://localhost:3002

---

## 📊 Useful Commands

### View Application Logs
```bash
docker logs hospital_app --tail 50
```

### View Database Logs
```bash
docker logs hospital_db --tail 50
```

### View Live Logs (Press Ctrl+C to stop)
```bash
docker logs -f hospital_app
```

### Restart Everything
```bash
docker-compose -f docker-compose.hospital.yml restart
```

### Check Container Status
```bash
docker ps -a
```

### Remove Everything and Start Fresh
```bash
# WARNING: This will delete all data!
docker-compose -f docker-compose.hospital.yml down -v
docker-compose -f docker-compose.hospital.yml up -d
```

---

## 🌐 Access URLs

### From Your Computer
- **Main URL**: http://localhost:3001
- **Alternative**: http://127.0.0.1:3001

### From Other Computers on Same Network
- **Network URL**: http://192.168.0.102:3001
- Replace `192.168.0.102` with your computer's actual IP address

### How to Find Your IP Address
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter

---

## 🔐 Default Login Credentials

- **Employee ID**: hosplawas
- **Password**: lawas2025
- **Department**: Administrator

---

## 📱 Internet Status

### ✅ No Internet Required
Your hospital system runs **100% offline** on your local network. No internet connection needed!

### When You Have Internet
You can also access the cloud backup version (if configured):
- Cloud URL: https://hospital-management-jza89w8pu-ehslawas-projects.vercel.app

---

## 🔄 Auto-Start on Boot

To make the hospital system start automatically when you login:

1. Double-click: `SETUP_AUTOSTART.bat`
2. The system will now start every time you log in to Windows

To disable auto-start:
1. Press Windows + R
2. Type: `shell:startup`
3. Delete "Hospital System.lnk"

---

## 🆘 Emergency Procedures

### If Everything Fails
1. Restart your computer
2. Open Docker Desktop
3. Wait for Docker to fully start
4. Run: `START_HOSPITAL.bat`
5. Wait 2 minutes
6. Access: http://localhost:3001

### If Still Not Working
1. Check if Docker Desktop is installed properly
2. Check if Windows is blocking Docker (Windows Security)
3. Try reinstalling Docker Desktop
4. Contact IT support

---

## 💡 Performance Tips

### Slow Performance
1. Increase Docker Desktop memory allocation:
   - Open Docker Desktop
   - Settings → Resources
   - Increase Memory to at least 4GB
   - Click "Apply & Restart"

2. Close unnecessary applications to free up resources

3. Check if antivirus is scanning Docker files (exclude Docker folder)

---

## 📞 Quick Reference

| What You Want | Command/Action |
|---------------|----------------|
| Start server | Run `START_HOSPITAL.bat` |
| Stop server | Run `STOP_HOSPITAL.bat` |
| Access website | http://localhost:3001 |
| View logs | `docker logs hospital_app` |
| Restart | `docker-compose -f docker-compose.hospital.yml restart` |
| Check status | `docker ps` |

---

## ✅ System Requirements

- Windows 10/11 (64-bit)
- Docker Desktop installed
- At least 4GB RAM
- At least 10GB free disk space

---

**Last Updated**: October 13, 2025  
**Version**: 1.0

Need more help? Check the other documentation files:
- `OFFLINE_DEPLOYMENT_GUIDE.md` - Full deployment guide
- `START_HERE.md` - Getting started guide
- `README.md` - Project overview

