# 🌐 Network Access Guide - Hospital Management System

## ❌ Problem: "This site can't be reached"

You're seeing this error because:
1. **Wrong IP Address** - Your IP address changed
2. **Windows Firewall** - Blocking port 3001 from network access
3. **Docker Network** - Needs proper configuration

---

## ✅ SOLUTION: 3-Step Fix

### Step 1: Find Your Correct IP Address

Your computer's IP address is: **192.168.137.56** (as of now)

**Note**: This IP can change if you:
- Reconnect to Wi-Fi
- Restart your router
- Connect to a different network

To check your current IP:
```bash
ipconfig
```
Look for "IPv4 Address" under "Wireless LAN adapter Wi-Fi" or "Ethernet adapter"

---

### Step 2: Open Windows Firewall for Port 3001

**METHOD 1: Using the Script (EASIEST)**

1. Find the file: `SETUP_FIREWALL.bat`
2. **Right-click** on it
3. Select **"Run as administrator"**
4. Click **"Yes"** when Windows asks for permission
5. Wait for "✅ Firewall rule created successfully!"

**METHOD 2: Manual (If script doesn't work)**

1. Press **Windows + R**
2. Type: `wf.msc` and press Enter
3. Click "Inbound Rules" on the left
4. Click "New Rule..." on the right
5. Select "Port" → Next
6. Select "TCP" → Type `3001` → Next
7. Select "Allow the connection" → Next
8. Check all profiles (Domain, Private, Public) → Next
9. Name: `Hospital System Port 3001` → Finish

---

### Step 3: Access the Application

**From YOUR computer (where server is running):**
```
http://localhost:3001
```

**From OTHER computers (same network):**
```
http://192.168.137.56:3001
```

---

## 🔍 Quick Diagnostic Test

Run these commands in PowerShell to check everything:

```powershell
# 1. Check your IP address
ipconfig | Select-String "IPv4"

# 2. Check if Docker is running
docker ps

# 3. Check if port 3001 is listening
netstat -ano | findstr ":3001"

# 4. Test local access
Test-NetConnection -ComputerName localhost -Port 3001

# 5. Test network access (from same computer)
Test-NetConnection -ComputerName 192.168.137.56 -Port 3001
```

All should show "TcpTestSucceeded : True"

---

## 🔧 Common Issues & Solutions

### Issue 1: IP Address Changed
**Symptoms**: URL worked before, now doesn't work

**Solution**:
1. Check your current IP: `ipconfig`
2. Update the URL with new IP
3. Share new URL with staff

**Better Solution**: Use computer name instead
```
http://YOUR-COMPUTER-NAME:3001
```

To find your computer name:
```powershell
hostname
```

---

### Issue 2: Firewall Still Blocking
**Symptoms**: localhost:3001 works, but network IP doesn't

**Check if rule exists**:
```powershell
Get-NetFirewallRule -DisplayName "*Hospital*" | Select-Object DisplayName, Enabled
```

**If rule exists but still blocked**:
1. Disable Windows Firewall temporarily (for testing only):
   - Control Panel → Windows Defender Firewall
   - Turn Windows Defender Firewall on or off
   - Turn off for Private networks (testing only!)
   - Try accessing again
   - **Don't forget to turn it back on!**

2. If it works with firewall off, the rule needs to be recreated

---

### Issue 3: Docker Binding to Wrong Interface
**Symptoms**: Even with firewall off, can't access via network IP

**Check Docker binding**:
```powershell
netstat -ano | findstr ":3001"
```

Should show: `0.0.0.0:3001` (listening on all interfaces)

**If it shows** `127.0.0.1:3001` (localhost only):

1. Stop containers:
   ```powershell
   docker-compose -f docker-compose.hospital.yml down
   ```

2. Edit `docker-compose.hospital.yml`:
   Change:
   ```yaml
   ports:
     - '3001:3000'
   ```
   To:
   ```yaml
   ports:
     - '0.0.0.0:3001:3000'
   ```

3. Restart:
   ```powershell
   docker-compose -f docker-compose.hospital.yml up -d
   ```

---

### Issue 4: Antivirus Blocking Access
**Symptoms**: Everything looks correct but still can't connect

**Solution**:
1. Temporarily disable antivirus (testing only)
2. If it works, add exception for:
   - Port 3001
   - Docker Desktop
   - C:\Users\60113\hospital-management

---

### Issue 5: Router/Network Configuration
**Symptoms**: Some computers can access, others can't

**Solutions**:
1. **Check if devices are on same network**:
   - All devices should have IP addresses in same range
   - Example: All should be 192.168.137.xxx

2. **Check network isolation**:
   - Some routers have "AP Isolation" or "Client Isolation"
   - This blocks devices from seeing each other
   - Disable in router settings

3. **Network Type**:
   - Windows must recognize network as "Private"
   - Not "Public" (more restrictive)
   - Change in: Settings → Network & Internet → Wi-Fi → Properties

---

## 📱 Accessing from Mobile Devices

### From Hospital Staff Phones/Tablets

**If on same Wi-Fi:**
```
http://192.168.137.56:3001
```

**Create QR Code for easy access:**
1. Go to: https://www.qr-code-generator.com/
2. Select "URL"
3. Enter: http://192.168.137.56:3001
4. Download QR code
5. Print and post in office
6. Staff can scan to access system

---

## 🔐 Security Considerations

### For Internal Hospital Network (Recommended)

**Current Setup**: Good for private hospital network
- ✅ Works offline
- ✅ No internet required
- ✅ Fast (local network)
- ⚠️ No encryption (HTTP only)

**Recommendations**:
1. **Use only on private hospital network**
2. **Do not expose to internet**
3. **Consider VPN for remote access**
4. **Regular backups**

### For External Access (Advanced)

If you need access from outside the hospital:

1. **Set up HTTPS** (secure connection)
2. **Use VPN** (Virtual Private Network)
3. **Configure router port forwarding** (not recommended without HTTPS)
4. **Consider cloud backup version**

---

## 🎯 Best Practices for Hospital Deployment

### Option 1: Dedicated Server Computer (RECOMMENDED)

**Setup**:
- Use a dedicated Windows PC
- Never turn it off
- Connect via Ethernet (not Wi-Fi)
- Use UPS (Uninterruptible Power Supply)

**Benefits**:
- ✅ Consistent IP address
- ✅ Always available
- ✅ Better performance
- ✅ More reliable

**Set Static IP**:
1. Open: Control Panel → Network and Sharing Center
2. Click your connection
3. Properties → Internet Protocol Version 4
4. Select "Use the following IP address"
5. IP: 192.168.137.100 (choose unused IP)
6. Subnet: 255.255.255.0
7. Gateway: 192.168.137.1 (your router IP)
8. DNS: 8.8.8.8 (Google DNS)

Then staff always use: `http://192.168.137.100:3001`

---

### Option 2: Use Computer Name (EASIER)

Instead of IP address, use computer name:

**Find your computer name**:
```powershell
hostname
```

**Example**: If computer name is `HOSPITAL-PC`

Staff access via:
```
http://HOSPITAL-PC:3001
```

**Benefits**:
- ✅ Works even if IP changes
- ✅ Easier to remember
- ✅ No configuration needed

**May require**:
- Network discovery enabled
- All computers in same workgroup

---

## 🚀 Quick Reference Card

### For Server Administrator

| Task | Command/File |
|------|--------------|
| Start server | `START_HOSPITAL.bat` |
| Stop server | `STOP_HOSPITAL.bat` |
| Setup firewall | `SETUP_FIREWALL.bat` (as admin) |
| Open browser | `OPEN_BROWSER.bat` |
| Check IP | `ipconfig` |
| Check status | `docker ps` |

### For Staff Access

**On Server Computer:**
```
http://localhost:3001
```

**From Other Computers:**
```
http://192.168.137.56:3001
```
(Replace IP with current server IP)

**Login:**
```
Employee ID: hosplawas
Password: lawas2025
Department: Administrator
```

---

## 🆘 Emergency Troubleshooting

### Nothing Works!

**Nuclear Option** (fixes most issues):

1. **Stop everything**:
   ```powershell
   docker-compose -f docker-compose.hospital.yml down
   ```

2. **Restart Docker Desktop**:
   - Right-click Docker icon in system tray
   - Select "Quit Docker Desktop"
   - Wait 10 seconds
   - Start Docker Desktop again
   - Wait for it to fully start

3. **Start server again**:
   ```powershell
   docker-compose -f docker-compose.hospital.yml up -d
   ```

4. **Wait 2 minutes** for everything to initialize

5. **Add firewall rule**:
   - Run `SETUP_FIREWALL.bat` as administrator

6. **Test**:
   ```
   http://localhost:3001
   ```

---

## 📞 Still Having Issues?

### Collect This Information:

1. **Your IP address**:
   ```powershell
   ipconfig | Select-String "IPv4"
   ```

2. **Docker status**:
   ```powershell
   docker ps -a
   ```

3. **Port status**:
   ```powershell
   netstat -ano | findstr ":3001"
   ```

4. **Firewall rules**:
   ```powershell
   Get-NetFirewallRule -DisplayName "*Hospital*"
   ```

5. **Application logs**:
   ```powershell
   docker logs hospital_app --tail 50
   ```

6. **Error message** (take screenshot)

---

## ✅ Success Checklist

Before declaring victory, test:

- [ ] Can access from server computer: http://localhost:3001
- [ ] Can access from server via IP: http://192.168.137.56:3001
- [ ] Can access from another computer: http://192.168.137.56:3001
- [ ] Can login successfully
- [ ] Can navigate between pages
- [ ] System works after server restart
- [ ] System works after computer restart

---

## 📊 Network Diagram

```
                    Hospital Network (192.168.137.x)
                              |
        +--------------------+--------------------+
        |                    |                    |
  [Server PC]          [Staff PC 1]         [Staff PC 2]
  192.168.137.56      192.168.137.101     192.168.137.102
  (Runs Docker)       (Browser Access)    (Browser Access)
        |                    |                    |
        |                    |                    |
  localhost:3001 -----> 192.168.137.56:3001 <-----+
        |
   [Docker Containers]
   - hospital_app (Port 3001)
   - hospital_db  (Port 5432)
```

---

**© 2025 Hospital Management System**  
**Last Updated**: October 13, 2025  
**For**: Hospital Lawas Offline Deployment

