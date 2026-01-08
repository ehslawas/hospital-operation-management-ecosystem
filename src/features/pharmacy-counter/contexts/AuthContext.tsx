'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'counter-pharmacist' | 'clinical-pharmacist' | 'supervisor' | 'clerk';

interface User {
  id: string;
  name: string;
  role: UserRole;
  credentialId: string;
}

interface AuthContextType {
  user: User | null;
  setRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for each role
const mockUsers: Record<UserRole, User> = {
  'admin': {
    id: 'USR001',
    name: 'Dr. Aminah Rahman',
    role: 'admin',
    credentialId: 'ADM-001',
  },
  'counter-pharmacist': {
    id: 'USR002',
    name: 'Pharmacist Sarah Tan',
    role: 'counter-pharmacist',
    credentialId: 'PHAR-12345',
  },
  'clinical-pharmacist': {
    id: 'USR003',
    name: 'Pharmacist Dr. Kumar Velan',
    role: 'clinical-pharmacist',
    credentialId: 'PHAR-23456',
  },
  'supervisor': {
    id: 'USR004',
    name: 'Supervisor Wong Mei Ling',
    role: 'supervisor',
    credentialId: 'SUP-001',
  },
  'clerk': {
    id: 'USR005',
    name: 'Siti Nurhaliza',
    role: 'clerk',
    credentialId: 'CLK-001',
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const savedRole = localStorage.getItem('pharmacy-user-role') as UserRole | null;
    if (savedRole && mockUsers[savedRole]) {
      setUser(mockUsers[savedRole]);
    } else {
      // Default to counter-pharmacist
      setUser(mockUsers['counter-pharmacist']);
      localStorage.setItem('pharmacy-user-role', 'counter-pharmacist');
    }
  }, []);

  const setRole = (role: UserRole) => {
    setUser(mockUsers[role]);
    localStorage.setItem('pharmacy-user-role', role);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pharmacy-user-role');
  };

  return (
    <AuthContext.Provider value={{ user, setRole, logout }}>
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

