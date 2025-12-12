import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi } from '@/api/auth';
import { handleApiError } from '@/api/client';
import type { UserResponse, UniversityBrandingResponse } from '@/api/types';

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
  universityBranding: UniversityBrandingResponse | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; universityId?: string; message: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Transform API user to frontend user format
const transformUser = (apiUser: UserResponse, universityName?: string): User => ({
  id: apiUser.id,
  email: apiUser.email,
  name: apiUser.name,
  avatar: apiUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiUser.email}`,
  university: universityName || 'University',
  universityId: apiUser.university_id,
  graduationYear: apiUser.graduation_year,
  major: apiUser.major,
  role: apiUser.role,
  isMentor: apiUser.is_mentor,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('alumni_user');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem('alumni_user');
    }
    return null;
  });

  const [universityBranding, setUniversityBranding] = useState<UniversityBrandingResponse | null>(() => {
    try {
      const stored = localStorage.getItem('university_branding');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading branding from localStorage:', error);
      localStorage.removeItem('university_branding');
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync with localStorage on storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedUser = localStorage.getItem('alumni_user');
        const storedBranding = localStorage.getItem('university_branding');
        
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          setUser(null);
        }
        
        if (storedBranding) {
          setUniversityBranding(JSON.parse(storedBranding));
        } else {
          setUniversityBranding(null);
        }
      } catch (error) {
        console.error('Error syncing from localStorage:', error);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      
      const universityName = response.university_branding?.name || 'University';
      const transformedUser = transformUser(response.user, universityName);
      
      setUser(transformedUser);
      localStorage.setItem('alumni_user', JSON.stringify(transformedUser));
      
      if (response.university_branding) {
        setUniversityBranding(response.university_branding);
        localStorage.setItem('university_branding', JSON.stringify(response.university_branding));
      }
    } catch (error) {
      handleApiError(error, 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout errors, just clear local state
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setUniversityBranding(null);
      localStorage.removeItem('alumni_user');
      localStorage.removeItem('university_branding');
      localStorage.removeItem('access_token');
      setIsLoading(false);
    }
  };

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await authApi.getCurrentUser();
      const transformedUser = transformUser(response, response.university_name);
      setUser(transformedUser);
      localStorage.setItem('alumni_user', JSON.stringify(transformedUser));
    } catch (error) {
      // Token might be expired, clear everything
      console.error('Failed to refresh user:', error);
      setUser(null);
      localStorage.removeItem('alumni_user');
      localStorage.removeItem('access_token');
    }
  }, []);

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; universityId?: string; message: string }> => {
    try {
      const response = await authApi.requestPasswordReset(email);
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to request password reset. Please try again.',
      };
    }
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
    <AuthContext.Provider value={{
      user,
      universityBranding,
      isAdmin,
      isSuperAdmin,
      isLoading,
      login,
      logout,
      updateProfile,
      requestPasswordReset,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
