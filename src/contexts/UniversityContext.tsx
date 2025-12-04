import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  getUniversity: (id: string) => UniversityBranding | undefined;
  updateUniversityBranding: (id: string, branding: Partial<UniversityBranding>) => void;
  fundraisers: Fundraiser[];
  addFundraiser: (fundraiser: Omit<Fundraiser, 'id'>) => void;
  updateFundraiser: (id: string, data: Partial<Fundraiser>) => void;
  deleteFundraiser: (id: string) => void;
  getActiveFundraisers: (universityId: string) => Fundraiser[];
}

const UniversityContext = createContext<UniversityContextType | undefined>(undefined);

// Default universities with distinct branding
const defaultUniversities: UniversityBranding[] = [
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology',
    logo: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=200&h=200&fit=crop', // MIT-style logo placeholder
    colors: {
      light: {
        primary: '#A31F34', // MIT Cardinal Red
        secondary: '#8A8B8C', // MIT Gray
        accent: '#750014', // Darker Cardinal
      },
      dark: {
        primary: '#D31F3A', // Brighter Cardinal for dark mode
        secondary: '#A0A1A2', // Lighter Gray
        accent: '#FF4458', // Bright accent
      },
    },
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    logo: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=200&h=200&fit=crop', // Stanford-style logo placeholder
    colors: {
      light: {
        primary: '#B1810B', // Stanford Gold/Yellow
        secondary: '#2E2D29', // Stanford Brown
        accent: '#E6A82D', // Bright Gold
      },
      dark: {
        primary: '#FFD700', // Bright Gold for dark mode
        secondary: '#5F574F', // Lighter Brown
        accent: '#FFA500', // Orange accent
      },
    },
  },
];

export const UniversityProvider = ({ children }: { children: ReactNode }) => {
  const [universities, setUniversities] = useState<UniversityBranding[]>(() => {
    const stored = localStorage.getItem('alumni_universities');
    return stored ? JSON.parse(stored) : defaultUniversities;
  });

  const [fundraisers, setFundraisers] = useState<Fundraiser[]>(() => {
    const stored = localStorage.getItem('alumni_fundraisers');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('alumni_universities', JSON.stringify(universities));
  }, [universities]);

  useEffect(() => {
    localStorage.setItem('alumni_fundraisers', JSON.stringify(fundraisers));
  }, [fundraisers]);

  const getUniversity = (id: string) => {
    return universities.find(u => u.id === id);
  };

  const updateUniversityBranding = (id: string, branding: Partial<UniversityBranding>) => {
    setUniversities(prev => prev.map(u => 
      u.id === id ? { ...u, ...branding } : u
    ));
  };

  const addFundraiser = (fundraiser: Omit<Fundraiser, 'id'>) => {
    const newFundraiser: Fundraiser = {
      ...fundraiser,
      id: `fundraiser_${Date.now()}`,
    };
    setFundraisers(prev => [...prev, newFundraiser]);
  };

  const updateFundraiser = (id: string, data: Partial<Fundraiser>) => {
    setFundraisers(prev => prev.map(f => 
      f.id === id ? { ...f, ...data } : f
    ));
  };

  const deleteFundraiser = (id: string) => {
    setFundraisers(prev => prev.filter(f => f.id !== id));
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
        getUniversity,
        updateUniversityBranding,
        fundraisers,
        addFundraiser,
        updateFundraiser,
        deleteFundraiser,
        getActiveFundraisers,
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

