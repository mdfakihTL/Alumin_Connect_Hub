import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '@/services/authService';
import { alumniService } from '@/services/alumniService';
import { tokenManager } from '@/lib/api';
import { ApiUser, UserRole, TOKEN_KEYS, LoginRequest, RegisterRequest } from '@/types/auth';
import { FrontendAlumniProfile } from '@/types/alumni';

// Frontend User interface that maps from API
interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar?: string;
  university: string;
  universityId?: string;
  graduationYear?: number;
  major?: string;
  bio?: string;
  role: 'alumni' | 'admin' | 'superadmin';
  isMentor?: boolean;
  isVerified?: boolean;
  isActive?: boolean;
}

interface AuthContextType {
  user: User | null;
  alumniProfile: FrontendAlumniProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  isAlumniProfileLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (data: { email: string; username: string; password: string; fullName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  refreshAlumniProfile: () => Promise<void>;
  updateAlumniProfile: (data: Partial<FrontendAlumniProfile>) => Promise<FrontendAlumniProfile>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; universityId?: string; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Map backend role to frontend role
function mapApiRoleToFrontend(role: UserRole): 'alumni' | 'admin' | 'superadmin' {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'superadmin';
    case 'UNIVERSITY_ADMIN':
      return 'admin';
    case 'ALUMNI':
    case 'STUDENT':
    default:
      return 'alumni';
  }
}

// Map API user to frontend user
function mapApiUserToFrontend(apiUser: ApiUser): User {
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    name: apiUser.full_name,
    username: apiUser.username,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${apiUser.username}`,
    university: apiUser.university_id ? `University ${apiUser.university_id}` : 'Alumni Network',
    universityId: apiUser.university_id ? String(apiUser.university_id) : undefined,
    role: mapApiRoleToFrontend(apiUser.role),
    isVerified: apiUser.is_verified,
    isActive: apiUser.is_active,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [alumniProfile, setAlumniProfile] = useState<FrontendAlumniProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAlumniProfileLoading, setIsAlumniProfileLoading] = useState(false);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have tokens
        const accessToken = tokenManager.getAccessToken();
        if (!accessToken) {
          setIsInitialized(true);
          return;
        }

        // Check if token is expired
        if (tokenManager.isTokenExpired(accessToken)) {
          // Try to refresh
          const refreshToken = tokenManager.getRefreshToken();
          if (!refreshToken) {
            tokenManager.clearTokens();
            setIsInitialized(true);
            return;
          }
        }

        // Fetch current user from API
        const apiUser = await authService.getCurrentUser();
        const frontendUser = mapApiUserToFrontend(apiUser);
        setUser(frontendUser);
        
        // Also store in localStorage for quick access
        localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(frontendUser));

        // Fetch alumni profile (non-blocking)
        try {
          const profile = await alumniService.getMyProfile();
          setAlumniProfile(profile);
        } catch {
          // Profile might not exist yet - that's okay
          setAlumniProfile(null);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        tokenManager.clearTokens();
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (emailOrUsername: string, password: string) => {
    setIsLoading(true);
    try {
      // Determine if input is email or username
      const isEmail = emailOrUsername.includes('@');
      const credentials: LoginRequest = {
        password,
        ...(isEmail ? { email: emailOrUsername } : { username: emailOrUsername }),
      };

      // Call login API
      await authService.login(credentials);

      // Fetch user details
      const apiUser = await authService.getCurrentUser();
      const frontendUser = mapApiUserToFrontend(apiUser);
      
      setUser(frontendUser);
      localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(frontendUser));

      // Fetch alumni profile (non-blocking)
      try {
        const profile = await alumniService.getMyProfile();
        setAlumniProfile(profile);
      } catch {
        // Profile might not exist yet - that's okay
        setAlumniProfile(null);
      }
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (data: { email: string; username: string; password: string; fullName: string }) => {
    setIsLoading(true);
    try {
      const registerData: RegisterRequest = {
        email: data.email,
        username: data.username,
        password: data.password,
        full_name: data.fullName,
      };

      const response = await authService.register(registerData);
      const frontendUser = mapApiUserToFrontend(response.user);
      
      setUser(frontendUser);
      localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(frontendUser));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAlumniProfile(null);
      setIsLoading(false);
    }
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      const apiUser = await authService.getCurrentUser();
      const frontendUser = mapApiUserToFrontend(apiUser);
      setUser(frontendUser);
      localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(frontendUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  // Refresh alumni profile
  const refreshAlumniProfile = useCallback(async () => {
    setIsAlumniProfileLoading(true);
    try {
      const profile = await alumniService.getMyProfile();
      setAlumniProfile(profile);
    } catch (error) {
      // Profile might not exist yet for new users
      console.error('Failed to refresh alumni profile:', error);
      setAlumniProfile(null);
    } finally {
      setIsAlumniProfileLoading(false);
    }
  }, []);

  // Update alumni profile
  const updateAlumniProfile = useCallback(async (data: Partial<FrontendAlumniProfile>): Promise<FrontendAlumniProfile> => {
    const updatedProfile = await alumniService.updateMyProfile(data);
    setAlumniProfile(updatedProfile);
    return updatedProfile;
  }, []);

  // Update profile locally (for optimistic updates)
  const updateProfile = useCallback((data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(updated));
  }, [user]);

  // Password reset request (placeholder - needs backend API)
  const requestPasswordReset = useCallback(async (email: string): Promise<{ success: boolean; universityId?: string; message: string }> => {
    // This would typically call a password reset API endpoint
    // For now, return a placeholder response
    return {
      success: true,
      message: 'Password reset request has been submitted. Please check your email or contact your administrator.',
    };
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  return (
    <AuthContext.Provider
      value={{
        user,
        alumniProfile,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
        isLoading,
        isInitialized,
        isAlumniProfileLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        refreshAlumniProfile,
        updateAlumniProfile,
        requestPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
