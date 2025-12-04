import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversityBranding } from '@/hooks/use-university-branding';

interface BrandingProviderProps {
  children: ReactNode;
}

const BrandingProvider = ({ children }: BrandingProviderProps) => {
  // Always call the hook (hooks must be called unconditionally)
  // The hook itself will handle the logic of when to apply branding
  useUniversityBranding();

  return <>{children}</>;
};

export default BrandingProvider;

