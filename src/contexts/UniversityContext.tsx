import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { universitiesApi } from '@/api/universities';
import { adminApi } from '@/api/admin';
import { useAuth } from './AuthContext';
import type { UniversityResponse, FundraiserResponse } from '@/api/types';

export interface UniversityBranding {
  id: string;
  name: string;
  logo: string;
  colors: {
    light: {
      primary: string;
      secondary: string;
      accent: string;
    };
    dark: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };
}

export interface Fundraiser {
  id: string;
  universityId: string;
  title: string;
  description: string;
  image: string;
  goalAmount: number;
  currentAmount: number;
  donationLink: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface UniversityContextType {
  universities: UniversityBranding[];
  fundraisers: Fundraiser[];
  isLoading: boolean;
  error: string | null;
  getUniversity: (id: string) => UniversityBranding | undefined;
  updateUniversityBranding: (id: string, branding: Partial<UniversityBranding>) => Promise<void>;
  addFundraiser: (fundraiser: Omit<Fundraiser, 'id'>) => Promise<void>;
  updateFundraiser: (id: string, data: Partial<Fundraiser>) => Promise<void>;
  deleteFundraiser: (id: string) => Promise<void>;
  getActiveFundraisers: (universityId: string) => Fundraiser[];
  refreshUniversities: () => Promise<void>;
  refreshFundraisers: () => Promise<void>;
}

const UniversityContext = createContext<UniversityContextType | undefined>(undefined);

// Default universities as fallback
const defaultUniversities: UniversityBranding[] = [
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    logo: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=200&h=200&fit=crop',
    colors: {
      light: { primary: '#A31F34', secondary: '#8A8B8C', accent: '#750014' },
      dark: { primary: '#D31F3A', secondary: '#A0A1A2', accent: '#FF4458' },
    },
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    logo: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=200&h=200&fit=crop',
    colors: {
      light: { primary: '#B1810B', secondary: '#2E2D29', accent: '#E6A82D' },
      dark: { primary: '#FFD700', secondary: '#5F574F', accent: '#FFA500' },
    },
  },
];

// Transform API response to frontend format
const transformUniversity = (apiUni: UniversityResponse): UniversityBranding => ({
  id: apiUni.id,
  name: apiUni.name,
  logo: apiUni.logo || 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=200&h=200&fit=crop',
  colors: apiUni.colors || {
    light: { primary: '#3B82F6', secondary: '#6B7280', accent: '#2563EB' },
    dark: { primary: '#60A5FA', secondary: '#9CA3AF', accent: '#3B82F6' },
  },
});

const transformFundraiser = (apiFund: FundraiserResponse): Fundraiser => ({
  id: apiFund.id,
  universityId: apiFund.university_id,
  title: apiFund.title,
  description: apiFund.description || '',
  image: apiFund.image || '',
  goalAmount: apiFund.goal_amount,
  currentAmount: apiFund.current_amount,
  donationLink: apiFund.donation_link || '',
  startDate: apiFund.start_date,
  endDate: apiFund.end_date,
  isActive: apiFund.is_active,
});

export const UniversityProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAdmin } = useAuth();
  const [universities, setUniversities] = useState<UniversityBranding[]>(defaultUniversities);
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUniversities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await universitiesApi.getUniversities();
      const transformed = response.universities.map(transformUniversity);
      setUniversities(transformed.length > 0 ? transformed : defaultUniversities);
    } catch (err) {
      console.error('Failed to fetch universities:', err);
      setError('Failed to load universities');
      // Keep default universities as fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshFundraisers = useCallback(async () => {
    if (!user?.universityId) return;
    
    try {
      const response = await universitiesApi.getFundraisers(user.universityId);
      setFundraisers(response.map(transformFundraiser));
    } catch (err) {
      console.error('Failed to fetch fundraisers:', err);
    }
  }, [user?.universityId]);

  // Load universities on mount
  useEffect(() => {
    refreshUniversities();
  }, [refreshUniversities]);

  // Load fundraisers when user changes
  useEffect(() => {
    if (user?.universityId) {
      refreshFundraisers();
    }
  }, [user?.universityId, refreshFundraisers]);

  const getUniversity = (id: string) => {
    return universities.find(u => u.id === id);
  };

  const updateUniversityBranding = async (id: string, branding: Partial<UniversityBranding>) => {
    if (!isAdmin) return;
    
    try {
      await adminApi.updateBranding({
        name: branding.name,
        logo: branding.logo,
        colors: branding.colors,
      });
      
      setUniversities(prev => prev.map(u => 
        u.id === id ? { ...u, ...branding } : u
      ));
    } catch (err) {
      console.error('Failed to update branding:', err);
      throw err;
    }
  };

  const addFundraiser = async (fundraiser: Omit<Fundraiser, 'id'>) => {
    if (!isAdmin) return;
    
    try {
      const response = await adminApi.createFundraiser({
        title: fundraiser.title,
        description: fundraiser.description,
        image: fundraiser.image,
        goal_amount: fundraiser.goalAmount,
        donation_link: fundraiser.donationLink,
        start_date: fundraiser.startDate,
        end_date: fundraiser.endDate,
      });
      
      setFundraisers(prev => [...prev, transformFundraiser(response)]);
    } catch (err) {
      console.error('Failed to create fundraiser:', err);
      throw err;
    }
  };

  const updateFundraiser = async (id: string, data: Partial<Fundraiser>) => {
    if (!isAdmin) return;
    
    try {
      const response = await adminApi.updateFundraiser(id, {
        title: data.title,
        description: data.description,
        image: data.image,
        goal_amount: data.goalAmount,
        donation_link: data.donationLink,
        is_active: data.isActive,
      });
      
      setFundraisers(prev => prev.map(f => 
        f.id === id ? transformFundraiser(response) : f
      ));
    } catch (err) {
      console.error('Failed to update fundraiser:', err);
      throw err;
    }
  };

  const deleteFundraiser = async (id: string) => {
    if (!isAdmin) return;
    
    try {
      await adminApi.deleteFundraiser(id);
      setFundraisers(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Failed to delete fundraiser:', err);
      throw err;
    }
  };

  const getActiveFundraisers = (universityId: string) => {
    const now = new Date();
    return fundraisers.filter(f => 
      f.universityId === universityId && 
      f.isActive &&
      new Date(f.startDate) <= now &&
      new Date(f.endDate) >= now
    );
  };

  return (
    <UniversityContext.Provider
      value={{
        universities,
        fundraisers,
        isLoading,
        error,
        getUniversity,
        updateUniversityBranding,
        addFundraiser,
        updateFundraiser,
        deleteFundraiser,
        getActiveFundraisers,
        refreshUniversities,
        refreshFundraisers,
      }}
    >
      {children}
    </UniversityContext.Provider>
  );
};

export const useUniversity = () => {
  const context = useContext(UniversityContext);
  if (!context) {
    throw new Error('useUniversity must be used within UniversityProvider');
  }
  return context;
};
