import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  university: string;
  universityId?: string;
  graduationYear?: number;
  major?: string;
  bio?: string;
  role?: 'alumni' | 'admin' | 'superadmin';
  isMentor?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; universityId?: string; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('alumni_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // Super Admin credential
  const superAdminCredential = {
    'superadmin@alumnihub.com': {
      password: 'super123',
    },
  };

  // Admin credentials for two universities
  const adminCredentials = {
    'admin@mit.edu': {
      password: 'mit123',
      universityId: 'mit',
      universityName: 'Massachusetts Institute of Technology',
    },
    'admin@stanford.edu': {
      password: 'stanford123',
      universityId: 'stanford',
      universityName: 'Stanford University',
    },
  };

  // Alumni credentials for demo purposes
  const alumniCredentials = {
    'john.doe@mit.edu': {
      password: 'mit123',
      name: 'John Doe',
      universityId: 'mit',
      universityName: 'Massachusetts Institute of Technology',
      graduationYear: 2020,
      major: 'Computer Science',
      isMentor: true,
    },
    'sarah.chen@mit.edu': {
      password: 'mit123',
      name: 'Sarah Chen',
      universityId: 'mit',
      universityName: 'Massachusetts Institute of Technology',
      graduationYear: 2019,
      major: 'Electrical Engineering',
      isMentor: false,
    },
    'michael.smith@stanford.edu': {
      password: 'stanford123',
      name: 'Michael Smith',
      universityId: 'stanford',
      universityName: 'Stanford University',
      graduationYear: 2021,
      major: 'Business Administration',
      isMentor: true,
    },
    'emily.johnson@stanford.edu': {
      password: 'stanford123',
      name: 'Emily Johnson',
      universityId: 'stanford',
      universityName: 'Stanford University',
      graduationYear: 2018,
      major: 'Data Science',
      isMentor: false,
    },
  };

  const login = async (email: string, password: string) => {
    // Check if super admin login
    const superAdminCred = superAdminCredential[email as keyof typeof superAdminCredential];
    if (superAdminCred && password === superAdminCred.password) {
      const superAdminUser: User = {
        id: 'superadmin_root',
        email,
        name: 'Super Administrator',
        university: 'AlumniHub HQ',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin',
        role: 'superadmin',
      };
      setUser(superAdminUser);
      localStorage.setItem('alumni_user', JSON.stringify(superAdminUser));
      return;
    }

    // Check if admin login
    const adminCred = adminCredentials[email as keyof typeof adminCredentials];
    if (adminCred && password === adminCred.password) {
      const adminUser: User = {
        id: `admin_${adminCred.universityId}`,
        email,
        name: `${adminCred.universityName} Admin`,
        university: adminCred.universityName,
        universityId: adminCred.universityId,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin${adminCred.universityId}`,
        role: 'admin',
      };
      setUser(adminUser);
      localStorage.setItem('alumni_user', JSON.stringify(adminUser));
      return;
    }

    // Check if alumni login
    const alumniCred = alumniCredentials[email as keyof typeof alumniCredentials];
    if (alumniCred && password === alumniCred.password) {
      const alumniUser: User = {
        id: `alumni_${Date.now()}`,
        email,
        name: alumniCred.name,
        university: alumniCred.universityName,
        universityId: alumniCred.universityId,
        graduationYear: alumniCred.graduationYear,
        major: alumniCred.major,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        role: 'alumni',
        isMentor: alumniCred.isMentor,
      };
      setUser(alumniUser);
      localStorage.setItem('alumni_user', JSON.stringify(alumniUser));
      return;
    }

    // Regular alumni login (fallback for any email)
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      university: 'Demo University',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      role: 'alumni',
    };
    setUser(mockUser);
    localStorage.setItem('alumni_user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('alumni_user');
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; universityId?: string; message: string }> => {
    // Check if email exists in admin credentials
    const adminCred = adminCredentials[email as keyof typeof adminCredentials];
    if (adminCred) {
      // Create admin password reset request for super admin
      const request = {
        id: `admin_reset_${Date.now()}`,
        email,
        name: `${adminCred.universityName} Admin`,
        universityId: adminCred.universityId,
        universityName: adminCred.universityName,
        requestDate: new Date().toISOString(),
        status: 'pending',
        type: 'admin',
      };

      const existingRequests = JSON.parse(
        localStorage.getItem('super_admin_password_resets') || '[]'
      );
      existingRequests.push(request);
      localStorage.setItem('super_admin_password_resets', JSON.stringify(existingRequests));

      return {
        success: true,
        message: 'Password reset request sent to Super Administrator.',
      };
    }

    // Check if email exists in alumni credentials
    const alumniCred = alumniCredentials[email as keyof typeof alumniCredentials];
    if (alumniCred) {
      // Create password reset request
      const request = {
        id: `reset_${Date.now()}`,
        email,
        name: alumniCred.name,
        universityId: alumniCred.universityId,
        requestDate: new Date().toISOString(),
        status: 'pending',
      };

      // Store in university-specific requests
      const existingRequests = JSON.parse(
        localStorage.getItem(`password_reset_requests_${alumniCred.universityId}`) || '[]'
      );
      existingRequests.push(request);
      localStorage.setItem(
        `password_reset_requests_${alumniCred.universityId}`,
        JSON.stringify(existingRequests)
      );

      return {
        success: true,
        universityId: alumniCred.universityId,
        message: `Password reset request sent to ${alumniCred.universityName} administration.`,
      };
    }

    return {
      success: false,
      message: 'Email not found in our records. Please contact your university administrator.',
    };
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('alumni_user', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <AuthContext.Provider value={{ user, isAdmin, isSuperAdmin, login, logout, updateProfile, requestPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
};
