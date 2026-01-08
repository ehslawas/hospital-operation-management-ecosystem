# 🏥 Offline Deployment Guide - Hospital Internet Outage Solution

## Problem
Hospital needs to continue operations even when internet connection is lost. The current Vercel deployment requires internet access.

## Solution
Deploy a **local server** inside the hospital network that runs independently of internet connectivity.

---

## 🎯 Two Deployment Options

### Option 1: Local Development Server (Quick Start)
**Best for**: Testing, development, small deployments

### Option 2: Production Docker Server (Recommended)
**Best for**: Hospital production use, high availability

---

# Option 1: Local Development Server

## Quick Start (No Internet Required)

### Step 1: One-Time Setup (Requires Internet)
```bash
# 1. Install Node.js (one-time, requires internet)
# Download from: https://nodejs.org/ (LTS version)

# 2. Install dependencies (one-time, requires internet)
cd C:\Users\60113\hospital-management
npm install

# 3. Set up environment variables
# Create .env.local file with database settings
```

### Step 2: Start Local Server (No Internet)
```bash
# Navigate to project folder
cd C:\Users\60113\hospital-management

# Start the server
npm run dev

# Server will start on:
# http://localhost:3000 (or 3001 if 3000 is busy)
# http://192.168.0.102:3001 (accessible from other computers in hospital)
```

### Step 3: Access from Hospital Computers
```
Any computer in the hospital network can access:
http://192.168.0.102:3001

Login with:
Employee ID: hosplawas
Password: lawas2025
Department: Administrator
```

### ✅ Advantages
- Quick to start
- Easy to update
- Good for testing

### ❌ Limitations
- Requires keeping terminal open
- Less reliable for 24/7 operation
- Manual restart if server crashes

---

# Option 2: Production Docker Server (RECOMMENDED)

## Full Production Deployment

### Prerequisites (One-Time Setup)

1. **Install Docker Desktop for Windows**
   - Download: https://www.docker.com/products/docker-desktop
   - Install and restart computer
   - Verify: `docker --version`

2. **Install PostgreSQL Database**
   - Option A: Use Docker (recommended)
   - Option B: Install PostgreSQL locally

### Step 1: Create Production Docker Setup

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Create `docker-compose.production.yml`:
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: hospital-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: hospital_admin
      POSTGRES_PASSWORD: SecureHospitalPassword2025!
      POSTGRES_DB: hospital_management
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    networks:
      - hospital-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hospital_admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Next.js Application
  hospital-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: hospital-app
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql://hospital_admin:SecureHospitalPassword2025!@postgres:5432/hospital_management
      NODE_ENV: production
    ports:
      - "80:3000"    # HTTP access on port 80
      - "3000:3000"  # Alternative port
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - hospital-network
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads

  # Nginx Reverse Proxy (Optional - for HTTPS)
  nginx:
    image: nginx:alpine
    container_name: hospital-nginx
    restart: unless-stopped
    ports:
      - "443:443"  # HTTPS
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - hospital-app
    networks:
      - hospital-network

volumes:
  postgres_data:
    driver: local

networks:
  hospital-network:
    driver: bridge
```

### Step 2: Configuration Files

Create `.env.production`:
```env
# Database
DATABASE_URL=postgresql://hospital_admin:SecureHospitalPassword2025!@postgres:5432/hospital_management

# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Security (Change these!)
SESSION_SECRET=change-this-to-random-secure-string
ENCRYPTION_KEY=another-random-secure-string-32-chars

# Hospital Settings
HOSPITAL_NAME=Hospital Lawas
HOSPITAL_CODE=LAWAS
```

Create `nginx.conf` (if using HTTPS):
```nginx
events {
    worker_connections 1024;
}

http {
    upstream hospital_app {
        server hospital-app:3000;
    }

    server {
        listen 80;
        server_name hospital.local;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl;
        server_name hospital.local;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://hospital_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Step 3: Deploy Production Server

```bash
# 1. Navigate to project
cd C:\Users\60113\hospital-management

# 2. Build and start all services
docker-compose -f docker-compose.production.yml up -d

# 3. Check status
docker-compose -f docker-compose.production.yml ps

# 4. View logs
docker-compose -f docker-compose.production.yml logs -f hospital-app
```

### Step 4: Initialize Database

```bash
# Run database migrations
docker-compose -f docker-compose.production.yml exec hospital-app npx prisma migrate deploy

# Seed initial data
docker-compose -f docker-compose.production.yml exec hospital-app npx prisma db seed
```

### Step 5: Access the System

```
From any hospital computer:
http://192.168.0.102        (HTTP on port 80)
http://192.168.0.102:3000   (Alternative port)
https://192.168.0.102       (HTTPS if configured)

Login:
Employee ID: hosplawas
Password: lawas2025
Department: Administrator
```

---

## 🔒 Production Security Setup

### 1. Change Database Password
```bash
# Edit docker-compose.production.yml
# Change: POSTGRES_PASSWORD to a strong password
# Update: DATABASE_URL with the new password
```

### 2. Set Up Automatic Backups
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U hospital_admin hospital_management > ./backups/backup_$DATE.sql
# Keep only last 30 days
find ./backups -name "backup_*.sql" -mtime +30 -delete
EOF

# Make executable
chmod +x backup.sh

# Add to Windows Task Scheduler to run daily
```

### 3. Configure Firewall
```powershell
# Allow only hospital network access
# Windows Firewall > Inbound Rules > New Rule
# Allow Port 80, 443, 3000
# Scope: Local subnet only (192.168.0.0/24)
```

---

## 🔄 Server Management Commands

### Start Server
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Stop Server
```bash
docker-compose -f docker-compose.production.yml down
```

### Restart Server
```bash
docker-compose -f docker-compose.production.yml restart
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.production.yml logs -f

# Just the app
docker-compose -f docker-compose.production.yml logs -f hospital-app

# Just the database
docker-compose -f docker-compose.production.yml logs -f postgres
```

### Update Application
```bash
# 1. Pull latest code
git pull

# 2. Rebuild and restart
docker-compose -f docker-compose.production.yml up -d --build
```

### Backup Database
```bash
# Manual backup
docker-compose -f docker-compose.production.yml exec postgres \
  pg_dump -U hospital_admin hospital_management > backup.sql
```

### Restore Database
```bash
# Restore from backup
docker-compose -f docker-compose.production.yml exec -T postgres \
  psql -U hospital_admin hospital_management < backup.sql
```

---

## 📋 Quick Reference: Internet vs No Internet

### With Internet ✅
- Access cloud version: https://hospital-management-jza89w8pu-ehslawas-projects.vercel.app
- Automatic updates
- Managed hosting
- Always latest version

### Without Internet ❌ (Use Local Server)
- Access local server: http://192.168.0.102
- Runs on hospital network
- No internet required
- Data stays in hospital

---

## 🎯 Recommended Deployment Strategy

### Hybrid Approach (Best for Hospitals)

```
┌─────────────────────────────────────────┐
│  Primary: Local Docker Server          │
│  - Always available (no internet)       │
│  - Fast (local network)                 │
│  - Data in hospital                     │
│  - http://192.168.0.102                 │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Backup: Cloud (Vercel)                 │
│  - Emergency access from home           │
│  - Remote admin access                  │
│  - Internet required                    │
│  - https://hospital-management-...app   │
└─────────────────────────────────────────┘
```

### Implementation Plan

1. **Week 1**: Set up local Docker server
2. **Week 2**: Test with staff, configure backups
3. **Week 3**: Go live with local server as primary
4. **Week 4**: Keep cloud as backup/emergency access

---

## 🚨 Emergency Procedures

### If Internet Goes Down
```
1. Staff continue using local server
2. No impact on operations
3. Access: http://192.168.0.102
4. All data saved locally
```

### If Local Server Goes Down
```
1. Check Docker status
2. Restart if needed
3. Check logs for errors
4. Contact IT administrator
5. Use cloud backup if critical
```

### If Both Down (Disaster Recovery)
```
1. Restore from latest backup
2. Use cloud version with mobile hotspot
3. Manual paper-based workflow
4. Call IT support
```

---

## 📊 Server Monitoring

### Windows Task Scheduler - Health Check

Create `healthcheck.ps1`:
```powershell
# Check if Docker containers are running
$status = docker-compose -f C:\Users\60113\hospital-management\docker-compose.production.yml ps

if ($status -match "Up") {
    Write-Host "✅ Hospital system is running"
} else {
    Write-Host "❌ Hospital system is down - restarting..."
    docker-compose -f C:\Users\60113\hospital-management\docker-compose.production.yml up -d
    
    # Send email alert
    # (Configure email settings)
}
```

Schedule to run every 5 minutes.

---

## 💡 Best Practices

### DO ✅
1. Run local Docker server as PRIMARY
2. Keep cloud as BACKUP only
3. Set up automatic daily backups
4. Test disaster recovery monthly
5. Monitor server health
6. Document procedures
7. Train backup administrators

### DON'T ❌
1. Rely only on cloud (internet required)
2. Skip regular backups
3. Ignore health check alerts
4. Run without UPS (power backup)
5. Forget to update regularly
6. Share server access widely

---

## 📞 Support

**Local Server Issues**:
- Check Docker Desktop is running
- View logs for errors
- Restart containers
- Check database connectivity

**Need Help?**:
- Review this guide
- Check Docker documentation
- Contact IT administrator

---

## 🎯 Summary

**Current Setup**: Cloud only (Vercel) ❌ Needs internet  
**Recommended Setup**: Local Docker + Cloud backup ✅ Works offline  

**Action Items**:
1. Install Docker Desktop
2. Create production configuration files
3. Deploy local server
4. Test with staff
5. Set up automatic backups
6. Keep cloud as emergency backup

Your hospital will have **100% uptime** even without internet! 🏥💪

---

**© 2025 HOME - Hospital Operation & Management Ecosystem**  
**Version**: 1.2.0  
**Last Updated**: January 13, 2025  
**Offline Deployment Guide**


