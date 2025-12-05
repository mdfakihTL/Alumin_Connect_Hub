import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversity } from '@/contexts/UniversityContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palette, Image as ImageIcon, Type, Sun, Moon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';

const AdminBranding = () => {
  const { user } = useAuth();
  const { getUniversity, updateUniversityBranding } = useUniversity();
  const { theme } = useTheme();
  const { toast } = useToast();
  
  const university = getUniversity(user?.universityId || '');
  
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    lightPrimary: '',
    lightSecondary: '',
    lightAccent: '',
    darkPrimary: '',
    darkSecondary: '',
    darkAccent: '',
  });

  useEffect(() => {
    if (university) {
      setFormData({
        name: university.name,
        logo: university.logo,
        lightPrimary: university.colors.light.primary,
        lightSecondary: university.colors.light.secondary,
        lightAccent: university.colors.light.accent,
        darkPrimary: university.colors.dark.primary,
        darkSecondary: university.colors.dark.secondary,
        darkAccent: university.colors.dark.accent,
      });
    }
  }, [university]);

  const handleSave = () => {
    if (!user?.universityId) return;

    updateUniversityBranding(user.universityId, {
      name: formData.name,
      logo: formData.logo,
      colors: {
        light: {
          primary: formData.lightPrimary,
          secondary: formData.lightSecondary,
          accent: formData.lightAccent,
        },
        dark: {
          primary: formData.darkPrimary,
          secondary: formData.darkSecondary,
          accent: formData.darkAccent,
        },
      },
    });

    // Apply colors to CSS variables
    applyColors();

    toast({
      title: 'Branding updated',
      description: 'University branding has been saved successfully',
    });
  };

  const applyColors = () => {
    const root = document.documentElement;
    const currentTheme = theme;
    
    if (currentTheme === 'light') {
      root.style.setProperty('--primary', hexToHSL(formData.lightPrimary));
      root.style.setProperty('--secondary', hexToHSL(formData.lightSecondary));
      root.style.setProperty('--accent', hexToHSL(formData.lightAccent));
    } else {
      root.style.setProperty('--primary', hexToHSL(formData.darkPrimary));
      root.style.setProperty('--secondary', hexToHSL(formData.darkSecondary));
      root.style.setProperty('--accent', hexToHSL(formData.darkAccent));
    }
  };

  const hexToHSL = (hex: string): string => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert hex to RGB
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

  const resetToDefault = () => {
    if (university) {
      const defaults = {
        mit: {
          name: 'Massachusetts Institute of Technology',
          logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/MIT_logo.svg',
          lightPrimary: '#A31F34',
          lightSecondary: '#8A8B8C',
          lightAccent: '#C41E3A',
          darkPrimary: '#C41E3A',
          darkSecondary: '#A0A1A2',
          darkAccent: '#E94B3C',
        },
        stanford: {
          name: 'Stanford University',
          logo: 'https://images.unsplash.com/photo-1607237138185-eedd9c632b0b?w=200&h=200&fit=crop',
          lightPrimary: '#B1810B',
          lightSecondary: '#2E2D29',
          lightAccent: '#E6A82D',
          darkPrimary: '#FFD700',
          darkSecondary: '#5F574F',
          darkAccent: '#FFA500',
        },
      };

      const defaultData = defaults[user?.universityId as keyof typeof defaults];
      if (defaultData) {
        setFormData(defaultData);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">University Branding</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Customize your university's appearance across the platform
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={resetToDefault} className="w-full sm:w-auto">
              Reset to Default
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* University Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">University Information</h3>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">University Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="University Name"
                className="text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-sm">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="text-sm"
              />
              {formData.logo && (
                <div className="mt-2 p-3 sm:p-4 border rounded-lg bg-muted/50">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Logo Preview:</p>
                  <img src={formData.logo} alt="Logo preview" className="h-12 sm:h-16 object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Light Mode Colors */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sun className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Light Mode Colors</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lightPrimary" className="text-sm">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="lightPrimary"
                    type="color"
                    value={formData.lightPrimary}
                    onChange={(e) => setFormData({ ...formData, lightPrimary: e.target.value })}
                    className="w-16 sm:w-20 h-10 flex-shrink-0"
                  />
                  <Input
                    value={formData.lightPrimary}
                    onChange={(e) => setFormData({ ...formData, lightPrimary: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lightSecondary" className="text-sm">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="lightSecondary"
                    type="color"
                    value={formData.lightSecondary}
                    onChange={(e) => setFormData({ ...formData, lightSecondary: e.target.value })}
                    className="w-16 sm:w-20 h-10 flex-shrink-0"
                  />
                  <Input
                    value={formData.lightSecondary}
                    onChange={(e) => setFormData({ ...formData, lightSecondary: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lightAccent" className="text-sm">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="lightAccent"
                    type="color"
                    value={formData.lightAccent}
                    onChange={(e) => setFormData({ ...formData, lightAccent: e.target.value })}
                    className="w-16 sm:w-20 h-10 flex-shrink-0"
                  />
                  <Input
                    value={formData.lightAccent}
                    onChange={(e) => setFormData({ ...formData, lightAccent: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dark Mode Colors */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Moon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Dark Mode Colors</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="darkPrimary" className="text-sm">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="darkPrimary"
                    type="color"
                    value={formData.darkPrimary}
                    onChange={(e) => setFormData({ ...formData, darkPrimary: e.target.value })}
                    className="w-16 sm:w-20 h-10 flex-shrink-0"
                  />
                  <Input
                    value={formData.darkPrimary}
                    onChange={(e) => setFormData({ ...formData, darkPrimary: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="darkSecondary" className="text-sm">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="darkSecondary"
                    type="color"
                    value={formData.darkSecondary}
                    onChange={(e) => setFormData({ ...formData, darkSecondary: e.target.value })}
                    className="w-16 sm:w-20 h-10 flex-shrink-0"
                  />
                  <Input
                    value={formData.darkSecondary}
                    onChange={(e) => setFormData({ ...formData, darkSecondary: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="darkAccent" className="text-sm">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="darkAccent"
                    type="color"
                    value={formData.darkAccent}
                    onChange={(e) => setFormData({ ...formData, darkAccent: e.target.value })}
                    className="w-16 sm:w-20 h-10 flex-shrink-0"
                  />
                  <Input
                    value={formData.darkAccent}
                    onChange={(e) => setFormData({ ...formData, darkAccent: e.target.value })}
                    placeholder="#000000"
                    className="flex-1 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Color Preview ({theme} mode)</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div 
                className="p-4 sm:p-6 rounded-lg text-white flex items-center justify-center font-semibold text-xs sm:text-base"
                style={{ backgroundColor: theme === 'light' ? formData.lightPrimary : formData.darkPrimary }}
              >
                Primary
              </div>
              <div 
                className="p-4 sm:p-6 rounded-lg text-white flex items-center justify-center font-semibold text-xs sm:text-base"
                style={{ backgroundColor: theme === 'light' ? formData.lightSecondary : formData.darkSecondary }}
              >
                Secondary
              </div>
              <div 
                className="p-4 sm:p-6 rounded-lg text-white flex items-center justify-center font-semibold text-xs sm:text-base"
                style={{ backgroundColor: theme === 'light' ? formData.lightAccent : formData.darkAccent }}
              >
                Accent
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminBranding;

