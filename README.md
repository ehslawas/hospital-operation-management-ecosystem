# Hospital Operation Management Ecosystem (HOME)

A comprehensive, modern hospital management system built with React, TypeScript, and Tailwind CSS.

## 🚀 Features

### Phase 1: Foundation (✅ Completed)
- **Authentication System**
  - Secure login with Employee ID and Password
  - Failed login attempt tracking (5 attempts = account lock)
  - Password reset functionality
  - Session management
  - Role-based access control

- **Access Request System**
  - Multi-step registration form
  - Personal details with profile photo upload
  - Department and hospital selection
  - Emergency contact information
  - Form validation and error handling

- **Contact & Support**
  - Inquiry form
  - Email contact information
  - AI Chat assistant (simulated)
  - Multiple contact methods

- **User Interface**
  - Modern, responsive design
  - Toast notifications
  - Modal dialogs
  - Loading states
  - Error handling
  - Animations with Framer Motion

### Phase 2: Administration (🔄 Coming Soon)
- User management
- Hospital management
- Department management
- Role & Permission management
- Access request approval workflow
- Audit logging
- System settings

### Phase 3: Pharmacy Logistics (🔄 Coming Soon)
- Product management
- Inventory management
- Supplier management
- Purchase Requisitions (PR)
- Purchase Orders (PO)
- Goods Receipts (GR)
- Stock transfers and adjustments

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Backend**: Supabase (configured for production, mock data for local dev)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ehslawas/hospital-operation-management-ecosystem.git
   cd hospital-operation-management-ecosystem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
   
   **Security Note**: The `VITE_SUPABASE_SERVICE_ROLE_KEY` is used to create Auth users automatically when users are created. 
   For production, consider using a Supabase Edge Function instead of exposing the service role key in client-side code.
   If not provided, the system will attempt to use `signUp` as a fallback (requires email confirmation).

4. **Set up email service (Resend - Recommended)**
   
   For sending welcome emails and password reset links:
   
   a) Sign up for Resend (FREE): https://resend.com
   b) Get your API key from Resend dashboard
   c) Configure in Supabase Dashboard:
      - Go to Authentication → Email Templates → SMTP Settings
      - Enable "Custom SMTP"
      - Enter Resend credentials:
        ```
        SMTP Host: smtp.resend.com
        SMTP Port: 587
        SMTP User: resend
        SMTP Password: [Your Resend API Key]
        Sender Email: onboarding@resend.dev
        ```
   d) See `RESEND_SETUP_GUIDE.md` for detailed instructions
   
   **Note**: Email sending works automatically once SMTP is configured in Supabase.

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔐 Demo Credentials (Local Development)

For local development without Supabase, use these mock credentials:

- **System Admin**
  - Employee ID: `SYS001`
  - Password: `Password123`

- **Hospital Admin**
  - Employee ID: `HKL001`
  - Password: `Password123`

- **Pharmacy Manager**
  - Employee ID: `HKL-PHR-001`
  - Password: `Password123`

## 📁 Project Structure

```
D:\MY HOME\
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # Base UI components
│   │   ├── forms/         # Form components
│   │   ├── layout/        # Layout components
│   │   └── shared/        # Shared components
│   ├── pages/             # Page components
│   │   ├── auth/          # Authentication pages
│   │   └── dashboard/     # Dashboard pages
│   ├── services/          # API services
│   ├── stores/            # Zustand stores
│   ├── types/             # TypeScript types
│   ├── lib/               # Utilities and helpers
│   └── routes/            # Route configuration
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🎨 Design System

### Colors
- **Primary**: Teal (#0F766E)
- **Secondary**: Indigo (#6366F1)
- **Accent**: Amber (#F59E0B)
- **Success**: Emerald (#10B981)
- **Warning**: Amber (#F59E0B)
- **Error**: Red (#EF4444)
- **Info**: Blue (#3B82F6)

### Typography
- **Font Family**: Plus Jakarta Sans, Inter, system-ui
- **Sizes**: xs (12px) to 4xl (36px)

## 🔒 Security Features

- Password strength validation
- Account lockout after 5 failed attempts
- Session timeout (60 minutes)
- Role-based access control (RBAC)
- Audit logging (coming soon)
- Secure password reset flow

## 📝 Form Validation

All forms use Zod schemas for validation:
- Email format validation
- Malaysian IC number validation (12 digits)
- Phone number validation (Malaysian format)
- Password strength requirements
- File upload validation (size, type)

## 🚦 Getting Started

1. **Login Page**
   - Enter Employee ID and Password
   - Click "Sign In"
   - Or click "Request System Access" to register

2. **Request Access**
   - Fill in personal details
   - Select hospital and department
   - Add emergency contact
   - Submit for approval

3. **Dashboard**
   - View system overview
   - Check recent activities
   - Monitor pending tasks
   - Access different modules

## 🧪 Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

## 📄 License

This project is proprietary software for hospital operations management.

## 👥 Support

For support, contact:
- **Email**: support@home.gov.my
- **Phone**: +603-2615-5555
- **Inquiry Form**: Available on login page

## 🗺️ Roadmap

- [x] Phase 1: Foundation & Authentication
- [ ] Phase 2: Administration Module
- [ ] Phase 3: Pharmacy Logistics Module
- [ ] Phase 4: Additional Modules (HR, Finance, etc.)
- [ ] Phase 5: Mobile App
- [ ] Phase 6: Advanced Analytics & Reporting

## 🤝 Contributing

This is a private project. For contributions, please contact the development team.

---

**© 2024 HOME System. All rights reserved.**

