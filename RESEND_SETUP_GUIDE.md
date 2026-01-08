# Resend Email Setup Guide

Complete step-by-step guide to set up Resend for sending emails in your application.

---

## 📋 **Step 1: Sign Up for Resend (FREE)**

1. Go to **https://resend.com**
2. Click **"Sign Up"** (top right)
3. Enter your email and create a password
4. Verify your email address
5. **No credit card required!** ✅

**Free Tier Includes:**
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ API access
- ✅ SMTP access
- ✅ Email templates

---

## 🔑 **Step 2: Get Your API Key**

1. After signing up, you'll be in the **Dashboard**
2. Click on **"API Keys"** in the sidebar
3. Click **"Create API Key"**
4. Give it a name: `Hospital System Production`
5. Select permissions: **"Sending access"**
6. Click **"Add"**
7. **Copy the API key** (you'll only see it once!)
   - Format: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
8. Save it securely (you'll need it for Step 4)

---

## 📧 **Step 3: Verify Your Domain (Optional but Recommended)**

### For Production:
1. Go to **"Domains"** in Resend dashboard
2. Click **"Add Domain"**
3. Enter your domain: `yourdomain.com`
4. Follow DNS setup instructions:
   - Add SPF record
   - Add DKIM records
   - Add DMARC record (optional)
5. Wait for verification (usually 5-10 minutes)

### For Development/Testing:
- ✅ You can use Resend's default domain: `onboarding.resend.dev`
- ✅ No domain verification needed
- ✅ Works immediately

---

## ⚙️ **Step 4: Configure Supabase SMTP Settings**

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your **Supabase Dashboard**
2. Select your project
3. Go to **Authentication** → **Email Templates**
4. Scroll down to **"SMTP Settings"**
5. Click **"Enable Custom SMTP"**
6. Fill in the following:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [Your Resend API Key from Step 2]
Sender Email: onboarding@resend.dev (or your verified domain)
Sender Name: Hospital Operation Management System
```

7. Click **"Save"**
8. Test by clicking **"Send Test Email"**

### Option B: Using Supabase CLI (Alternative)

If you prefer CLI:

```bash
supabase secrets set SMTP_HOST=smtp.resend.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=resend
supabase secrets set SMTP_PASS=re_your_api_key_here
supabase secrets set SMTP_SENDER_EMAIL=onboarding@resend.dev
```

---

## 🧪 **Step 5: Test Email Sending**

### Test Password Reset (Already in your code):

1. Go to your login page
2. Click **"Forgot Password?"**
3. Enter an email address
4. Click **"Send Reset Link"**
5. Check the email inbox
6. You should receive the password reset email!

### Test Welcome Email (After we implement):

When admin approves an access request, user should receive welcome email automatically.

---

## 🔐 **Step 6: Environment Variables (For Direct API Use - Optional)**

If you want to use Resend API directly (not just SMTP), add to your `.env`:

```env
# Resend API (Optional - for direct API calls)
VITE_RESEND_API_KEY=re_your_api_key_here
```

**Note:** For now, we'll use Supabase SMTP (configured in Step 4), so this is optional.

---

## ✅ **Step 7: Verify Setup**

### Checklist:
- [ ] Resend account created
- [ ] API key generated and saved
- [ ] Supabase SMTP configured
- [ ] Test email sent successfully
- [ ] Password reset email received
- [ ] Domain verified (if using custom domain)

---

## 🚀 **Step 8: Deploy Configuration**

### For Production Deployment:

1. **Supabase Dashboard:**
   - SMTP settings are already saved (from Step 4)
   - These settings persist across deployments
   - ✅ No additional configuration needed

2. **Environment Variables:**
   - If using Resend API directly, add `VITE_RESEND_API_KEY` to your hosting platform
   - For Vercel: Project Settings → Environment Variables
   - For Netlify: Site Settings → Environment Variables
   - For other platforms: Check their documentation

3. **Domain (if using custom domain):**
   - Make sure DNS records are set up correctly
   - Verify domain in Resend dashboard

---

## 📊 **Monitoring & Limits**

### Check Email Usage:
1. Go to Resend Dashboard
2. Click **"Logs"** to see sent emails
3. Check **"Usage"** for monthly quota

### Free Tier Limits:
- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ⚠️ If you exceed, you'll need to upgrade (or wait for next month)

---

## 🔧 **Troubleshooting**

### Emails Not Sending?

1. **Check Supabase SMTP Settings:**
   - Verify SMTP credentials are correct
   - Make sure "Enable Custom SMTP" is ON
   - Test with "Send Test Email"

2. **Check Resend Dashboard:**
   - Go to **"Logs"** → Check for errors
   - Verify API key is active
   - Check if you've exceeded daily limit

3. **Check Spam Folder:**
   - Emails might go to spam initially
   - Domain verification helps with deliverability

4. **Check Email Templates:**
   - Supabase → Authentication → Email Templates
   - Make sure templates are enabled

### Common Issues:

**Issue:** "SMTP authentication failed"
- **Solution:** Double-check API key in Supabase SMTP settings

**Issue:** "Email not received"
- **Solution:** Check Resend logs, verify email address, check spam

**Issue:** "Domain not verified"
- **Solution:** Complete DNS setup in Resend dashboard

---

## 📝 **Next Steps**

After completing this setup:

1. ✅ Your password reset emails will work automatically
2. ✅ We'll implement welcome emails for new users
3. ✅ All emails will use Resend SMTP
4. ✅ Ready for production deployment!

---

## 🎯 **Quick Reference**

**Resend Dashboard:** https://resend.com/emails
**Supabase SMTP Settings:** Dashboard → Authentication → SMTP Settings
**Resend API Docs:** https://resend.com/docs

**SMTP Credentials:**
```
Host: smtp.resend.com
Port: 587
User: resend
Password: [Your API Key]
```

---

## ✅ **You're All Set!**

Once you complete Steps 1-4, your email system is ready for production! 🎉

