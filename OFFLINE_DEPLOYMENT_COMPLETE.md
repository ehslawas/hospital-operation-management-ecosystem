# 🌐 Complete Offline Deployment Guide
## Hospital Management System - No Internet Required

---

## 📋 Overview

This guide shows you how to run the **entire Hospital Management System** (patient portal + staff portal) **completely offline** using Docker. No internet connection needed after initial setup!

---

## ✅ What Works Offline

- ✅ **Staff Login** (Employee ID + Password)
- ✅ **Patient Portal Login** (IC + PIN/DOB)
- ✅ **All pharmacy features** (dispensing, inventory, etc.)
- ✅ **All patient features** (dashboard, medications, health summary)
- ✅ **Database** (PostgreSQL running locally)
- ✅ **Full web application** (Next.js frontend + backend)
- ✅ **Print functions** (prescriptions, labels, reports)

---

## 🚀 Initial Setup (One-Time, Requires Internet)

### **Step 1: Install Docker Desktop**

1. Download Docker Desktop (if not installed): https://www.docker.com/products/docker-desktop
2. Install and start Docker Desktop
3. Verify installation:
   ```cmd
   docker --version
   docker-compose --version
   ```

### **Step 2: Pull Base Images (While Online)**

Pull the required Docker images while you have internet:

```cmd
docker pull postgres:16-alpine
docker pull node:18-alpine
```

### **Step 3: Build the Application**

Build the hospital management application:

```cmd
docker-compose -f docker-compose.hospital.yml build
```

This will:
- ✅ Download all Node.js dependencies
- ✅ Build the Next.js application
- ✅ Generate Prisma client
- ✅ Create optimized production image
- ⏱️ Takes ~5-10 minutes

---

## 💾 Save Docker Images for Offline Transfer (Optional)

If you want to deploy on **another computer without internet**:

### **On Computer with Internet:**

```cmd
REM Save all images to files
docker save postgres:16-alpine -o postgres-16-alpine.tar
docker save hospital-management:latest -o hospital-app.tar
```

Copy these `.tar` files to USB/external drive.

### **On Offline Computer:**

```cmd
REM Load images from files
docker load -i postgres-16-alpine.tar
docker load -i hospital-app.tar
```

---

## 🏥 Running Offline (After Setup)

### **Option 1: Use the Easy Batch File (Recommended)**

Just double-click:
```
START_HOSPITAL.bat
```

That's it! The system will:
- ✅ Start PostgreSQL database
- ✅ Start web application
- ✅ Run database migrations
- ✅ Show you access URLs

### **Option 2: Manual Start**

```cmd
docker-compose -f docker-compose.hospital.yml up -d
```

Wait ~30 seconds for startup, then access:
- **From this computer:** http://localhost:3001
- **From other computers:** http://[YOUR-IP]:3001

---

## 🔧 Database Setup (First Time Only)

### **Initialize Database Schema:**

```cmd
docker-compose -f docker-compose.hospital.yml exec hospital-app npx prisma db push
```

### **Seed Test Data:**

```cmd
docker-compose -f docker-compose.hospital.yml exec hospital-app npx prisma db seed
```

This creates:
- ✅ Test patients (including patient portal account)
- ✅ Sample medications
- ✅ Sample prescriptions
- ✅ Staff accounts

---

## 🔐 Login Credentials

### **Staff Login** (Main System)
- **URL:** http://localhost:3001/login
- **Username:** `admin`
- **Password:** `admin123`

### **Patient Portal Login**
- **URL:** http://localhost:3001/patient-portal/login
- **IC Number:** `940120126733`
- **Method:** PIN
- **PIN:** `123456`

---

## 🛠️ Common Commands

### **View Running Containers:**
```cmd
docker ps
```

### **View Logs:**
```cmd
REM All logs
docker-compose -f docker-compose.hospital.yml logs

REM App logs only
docker logs hospital_app

REM Database logs only
docker logs hospital_db
```

### **Stop System:**
```cmd
docker-compose -f docker-compose.hospital.yml down
```

### **Restart System:**
```cmd
docker-compose -f docker-compose.hospital.yml restart
```

### **Rebuild After Code Changes:**
```cmd
docker-compose -f docker-compose.hospital.yml up -d --build
```

---

## 🌐 Access from Other Devices

### **Find Your IP Address:**

```cmd
ipconfig
```

Look for "IPv4 Address" (e.g., `192.168.1.100`)

### **Access URLs:**

From any device on the same network (no internet needed):

- **Staff Portal:** `http://[YOUR-IP]:3001`
- **Patient Portal:** `http://[YOUR-IP]:3001/patient-portal/login`

### **Allow Firewall Access (Windows):**

Run as Administrator:
```cmd
netsh advfirewall firewall add rule name="Hospital System" dir=in action=allow protocol=TCP localport=3001
```

---

## 💾 Data Persistence

All data is stored in Docker volumes and **persists after restart**:

- **Database data:** `hospital_data` volume
- **Location:** Docker's internal storage
- **Survives:** System restart, Docker restart, computer restart

### **Backup Database:**

```cmd
docker exec hospital_db pg_dump -U hospital hospital_management > backup.sql
```

### **Restore Database:**

```cmd
docker exec -i hospital_db psql -U hospital hospital_management < backup.sql
```

---

## 🔍 Troubleshooting

### **"Cannot connect to Docker daemon"**
- ✅ Start Docker Desktop
- ✅ Wait for Docker to fully start

### **"Port 3001 already in use"**
Edit `docker-compose.hospital.yml`:
```yaml
ports:
  - '3002:3000'  # Change 3001 to 3002
```

### **"Port 5432 already in use"**
Another PostgreSQL is running:
- Stop other PostgreSQL service
- Or change port in docker-compose.yml

### **"Database connection failed"**
```cmd
REM Check if database is ready
docker logs hospital_db

REM Restart containers
docker-compose -f docker-compose.hospital.yml restart
```

### **"Cannot access from other computers"**
1. Check firewall settings
2. Verify both computers on same network
3. Try: `http://[IP]:3001` not `http://localhost:3001`

---

## 🎯 Performance Tips

### **Faster Startup:**
Keep containers running instead of stopping them:
```cmd
REM Don't use 'down', use 'stop' instead
docker-compose -f docker-compose.hospital.yml stop

REM Resume quickly
docker-compose -f docker-compose.hospital.yml start
```

### **Resource Limits:**
Edit `docker-compose.hospital.yml` to limit resources:
```yaml
hospital-app:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
```

---

## 📊 System Requirements

### **Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 10 GB free
- OS: Windows 10/11, Linux, macOS

### **Recommended:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 20 GB free
- SSD recommended

---

## 🔄 Updating the System

### **Step 1: Stop Current System**
```cmd
docker-compose -f docker-compose.hospital.yml down
```

### **Step 2: Backup Data (Important!)**
```cmd
docker exec hospital_db pg_dump -U hospital hospital_management > backup_$(date +%Y%m%d).sql
```

### **Step 3: Pull Latest Code**
```cmd
git pull
```
Or copy updated files from USB/network

### **Step 4: Rebuild**
```cmd
docker-compose -f docker-compose.hospital.yml build --no-cache
```

### **Step 5: Restart**
```cmd
docker-compose -f docker-compose.hospital.yml up -d
```

### **Step 6: Run Migrations**
```cmd
docker-compose -f docker-compose.hospital.yml exec hospital-app npx prisma migrate deploy
```

---

## 🎓 Understanding the Stack

```
┌─────────────────────────────────────────┐
│  Users (Staff/Patients)                 │
│  Access via web browser                 │
│  http://[IP]:3001                       │
└──────────────┬──────────────────────────┘
               │ (No Internet Required)
┌──────────────▼──────────────────────────┐
│  Docker Network (hospital_network)      │
│                                         │
│  ┌───────────────┐  ┌───────────────┐ │
│  │ hospital_app  │  │ hospital_db   │ │
│  │ (Next.js)     │──│ (PostgreSQL)  │ │
│  │ Port: 3000    │  │ Port: 5432    │ │
│  └───────────────┘  └───────────────┘ │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ hospital_data (Docker Volume)   │  │
│  │ Persistent database storage     │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 🎉 Success Checklist

After setup, verify everything works:

- [ ] Can access http://localhost:3001
- [ ] Staff login works
- [ ] Patient portal accessible at /patient-portal/login
- [ ] Patient can login with IC and PIN
- [ ] Can view patient medications
- [ ] Can print health summary
- [ ] System works after computer restart
- [ ] Can access from other computers on network
- [ ] No internet connection required

---

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose -f docker-compose.hospital.yml logs`
2. Verify Docker is running: `docker ps`
3. Check this guide's troubleshooting section
4. Restart containers: `docker-compose -f docker-compose.hospital.yml restart`

---

## 🌟 Key Benefits of Docker Offline Deployment

✅ **No Internet Required** - Run anywhere, anytime  
✅ **Consistent Environment** - Works same on all computers  
✅ **Easy Deployment** - Copy Docker images to USB  
✅ **Data Persistence** - Database survives restarts  
✅ **Isolated** - Doesn't interfere with other software  
✅ **Scalable** - Can run multiple instances  
✅ **Portable** - Move between computers easily  

---

**You now have a fully functional, offline hospital management system! 🏥**

