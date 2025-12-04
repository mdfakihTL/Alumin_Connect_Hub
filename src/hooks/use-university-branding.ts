import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversity } from '@/contexts/UniversityContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from 'react-router-dom';

export const useUniversityBranding = () => {
  const { user } = useAuth();
  const { getUniversity } = useUniversity();
  const { theme } = useTheme();
  const location = useLocation();

  useEffect(() => {
    // Check if we're on a public page
    const isPublicPage = ['/', '/login', '/forgot-password'].includes(location.pathname);
    
    // Super admin should always use default theme
    if (user?.role === 'superadmin') {
      const root = document.documentElement;
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.removeAttribute('data-university');
      document.title = 'Super Admin - Alumni Connect Hub';
      return;
    }
    
    // Only apply branding if user is logged in, has a university, and not on public pages
    if (!user || !user.universityId || isPublicPage) {
      // Reset to default if no user or on public page
      const root = document.documentElement;
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.removeAttribute('data-university');
      document.title = 'Alumni Connect Hub';
      return;
    }

    const university = getUniversity(user.universityId);
    if (!university) {
      console.warn('University not found for ID:', user.universityId);
      return;
    }

    console.log('Applying branding for:', university.name, 'Theme:', theme);

    const colors = theme === 'light' ? university.colors.light : university.colors.dark;

    // Convert hex to HSL
    const hexToHSL = (hex: string): string => {
      hex = hex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      
      return `${h} ${s}% ${l}%`;
    };

    // Apply colors to CSS variables
    const root = document.documentElement;
    const primaryHSL = hexToHSL(colors.primary);
    const secondaryHSL = hexToHSL(colors.secondary);
    const accentHSL = hexToHSL(colors.accent);
    
    root.style.setProperty('--primary', primaryHSL);
    root.style.setProperty('--primary-foreground', '0 0% 100%'); // White text on primary
    
    console.log('Applied colors:', { primary: primaryHSL, university: university.name, theme });

    // Also store in data attribute for easy access
    root.setAttribute('data-university', user.universityId);
    
    // Update favicon if logo exists (optional)
    if (university.logo) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = university.logo;
      }
    }

    // Update page title
    document.title = `${university.name} - Alumni Connect Hub`;

  }, [user?.universityId, theme, getUniversity, location.pathname]);
};

