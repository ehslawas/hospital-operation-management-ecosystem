# 🌐 Hospital Management System - Offline Edition

## 🎯 Run Anywhere, No Internet Required!

This Hospital Management System works **completely offline** using Docker. Perfect for:
- 🏥 Remote clinics with limited internet
- 🚑 Emergency situations
- 🔒 High-security environments
- 💻 Offline demonstrations
- 🌍 Rural healthcare facilities

---

## ⚡ Super Quick Start

### **1. Make sure Docker Desktop is installed and running**

### **2. Run the setup (one time only):**
```cmd
SETUP_OFFLINE.bat
```

### **3. Access the system:**
- **Staff Portal:** http://localhost:3001
- **Patient Portal:** http://localhost:3001/patient-portal/login

**That's it!** 🎉

---

## 📚 Documentation

Choose your guide:

### **🚀 Quick Start** (For impatient people)
→ **OFFLINE_QUICK_START.md**
- 5-minute setup
- Basic commands
- Login credentials

### **📖 Complete Guide** (For detailed setup)
→ **OFFLINE_DEPLOYMENT_COMPLETE.md**
- Full installation steps
- Troubleshooting
- Advanced configuration
- Backup/restore
- Multi-computer deployment

### **📝 Setup Summary** (What was done)
→ **OFFLINE_SETUP_SUMMARY.md**
- Files created/updated
- Architecture overview
- Verification checklist

---

## ✨ What Works Offline

### **Staff Portal:**
- ✅ Pharmacy counter (all features)
- ✅ Dispensing & verification
- ✅ Inventory management
- ✅ Patient management
- ✅ Emergency department
- ✅ All ward management
- ✅ Reports & printing

### **Patient Portal:**
- ✅ Login with IC + PIN/DOB
- ✅ View medications
- ✅ View allergies
- ✅ View vital signs
- ✅ View lab results
- ✅ Print health summary
- ✅ Bilingual (English/Malay)

### **Infrastructure:**
- ✅ PostgreSQL database (local)
- ✅ Next.js web application (local)
- ✅ All data stored locally
- ✅ No external dependencies
- ✅ Works on Windows/Mac/Linux

---

## 🔐 Default Login

### **Staff:**
```
Username: admin
Password: admin123
```

### **Patient:**
```
IC: 940120126733
PIN: 123456
```

---

## 🌐 Access from Other Devices

### **Same Computer:**
```
http://localhost:3001
```

### **Other Computers/Phones (Same WiFi):**
```
http://[YOUR-IP]:3001
```

Find your IP:
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

---

## 💾 Data & Persistence

- ✅ **All data persists** across restarts
- ✅ **Database in Docker volume** (survives updates)
- ✅ **Easy backup** with pg_dump
- ✅ **Export to USB** for transfer

---

## 🛠️ Daily Operations

### **Start:**
```cmd
START_HOSPITAL.bat
```

### **Stop:**
```cmd
STOP_HOSPITAL.bat
```

### **Check Status:**
```cmd
docker ps
```

---

## 📦 Deploy to Another Computer (Offline)

### **Computer with Internet:**
1. Build: `docker-compose -f docker-compose.hospital.yml build`
2. Save: `docker save hospital-management:latest -o hospital-app.tar`
3. Copy to USB

### **Offline Computer:**
1. Load: `docker load -i hospital-app.tar`
2. Run: `SETUP_OFFLINE.bat`

Done! 🎉

---

## 🎓 How It Works

```
Your Computer (No Internet Needed!)
├── Docker Desktop
│   ├── hospital_app (Web Application)
│   │   └── Port: 3001
│   └── hospital_db (PostgreSQL Database)
│       └── Port: 5432
└── hospital_data (Persistent Storage)
    └── All your patient data
```

---

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't connect | Start Docker Desktop, wait 30 seconds |
| Port in use | Change port in docker-compose.hospital.yml |
| Database error | Restart containers with STOP → START |
| Other computers can't access | Check firewall, use IP not localhost |

---

## 📊 System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 10 GB
- Docker Desktop

**Recommended:**
- CPU: 4 cores
- RAM: 8 GB
- Storage: 20 GB SSD
- Docker Desktop (latest)

---

## 🎉 You're Ready!

Your hospital management system is:
- ✅ **100% offline capable**
- ✅ **Running locally in Docker**
- ✅ **Accessible from multiple devices**
- ✅ **Patient and staff portals active**
- ✅ **Data secure and persistent**

**No internet? No problem!** 🏥

---

## 📞 Quick Links

- **Quick Setup:** OFFLINE_QUICK_START.md
- **Full Guide:** OFFLINE_DEPLOYMENT_COMPLETE.md  
- **Summary:** OFFLINE_SETUP_SUMMARY.md
- **Main README:** README.md

---

**Made with ❤️ for offline healthcare delivery**

