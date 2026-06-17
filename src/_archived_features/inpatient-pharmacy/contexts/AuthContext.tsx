'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types/entities';

interface AuthContextType {
  user: User | null;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: Record<UserRole, User> = {
  ward_clinical_pharmacist: {
    id: '1',
    name: 'Dr. Siti Aminah',
    email: 'pharm.clinical@hsb.gov.my',
    role: 'ward_clinical_pharmacist',
    licenseNo: 'PF12345',
    contact: '+60123456789',
  },
  dispensing_pharmacist: {
    id: '2',
    name: 'Ahmad Fariz',
    email: 'pharm.fpd@hsb.gov.my',
    role: 'dispensing_pharmacist',
    licenseNo: 'PF12346',
    contact: '+60123456790',
  },
  technician: {
    id: '3',
    name: 'Lim Wei Hong',
    email: 'tech.fpd@hsb.gov.my',
    role: 'technician',
    contact: '+60123456791',
  },
  qa_safety: {
    id: '4',
    name: 'Dr. Ranjit Kumar',
    email: 'qa.safety@hsb.gov.my',
    role: 'qa_safety',
    licenseNo: 'PF12347',
    contact: '+60123456792',
  },
  oncall_pharmacist: {
    id: '5',
    name: 'Nur Huda',
    email: 'oncall.fp@hsb.gov.my',
    role: 'oncall_pharmacist',
    licenseNo: 'PF12348',
    contact: '+60123456793',
  },
  admin: {
    id: '6',
    name: 'System Admin',
    email: 'admin.fp@hsb.gov.my',
    role: 'admin',
    contact: '+60123456794',
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(mockUsers.ward_clinical_pharmacist);

  const setRole = (role: UserRole) => {
    setUser(mockUsers[role]);
  };

  return (
    <AuthContext.Provider value={{ user, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

