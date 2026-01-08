# 🚀 Offline Quick Start

## One-Time Setup (5 minutes)

1. **Make sure Docker Desktop is running**

2. **Run the setup script:**
   ```
   Double-click: SETUP_OFFLINE.bat
   ```

3. **Wait for completion** (~5-10 minutes)

That's it! ✅

---

## Daily Use

### **Start the System:**
```
Double-click: START_HOSPITAL.bat
```

### **Stop the System:**
```
Double-click: STOP_HOSPITAL.bat
```

---

## Access

### **From This Computer:**
- Staff Portal: http://localhost:3001
- Patient Portal: http://localhost:3001/patient-portal/login

### **From Other Computers (Same Network):**
- Replace `localhost` with your computer's IP address
- Example: http://192.168.1.100:3001

---

## Login

### **Staff:**
- Username: `admin`
- Password: `admin123`

### **Patient:**
- IC: `940120126733`
- PIN: `123456`

---

## Key Features

✅ **Works completely offline** (no internet needed)  
✅ **Data persists** (survives restarts)  
✅ **Access from multiple devices** (on same network)  
✅ **Both portals available** (staff + patient)  

---

## Troubleshooting

### "Can't connect"
- Make sure Docker Desktop is running
- Wait 30 seconds after starting
- Try: http://localhost:3001

### "Port already in use"
- Another instance might be running
- Run: `docker ps` to check
- Stop with: STOP_HOSPITAL.bat

---

For detailed documentation, see: **OFFLINE_DEPLOYMENT_COMPLETE.md**

