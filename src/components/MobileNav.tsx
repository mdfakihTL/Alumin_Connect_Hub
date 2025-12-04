import { Home, Users, Calendar, MessageCircle, User, FileText, Moon, Sun, Heart, Shield, LayoutDashboard, Settings } from 'lucide-react';
import { NavLink } from './NavLink';
import { Button } from './ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

const MobileNav = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, isSuperAdmin } = useAuth();
  
  // Super Admin navigation items
  const superAdminNavItems = [
    { to: '/superadmin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  // Admin navigation items
  const adminNavItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/branding', icon: Settings, label: 'Branding' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  // Alumni navigation items
  const alumniNavItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/mentorship', icon: Heart, label: 'Mentor' },
    { to: '/events', icon: Calendar, label: 'Events' },
    { to: '/chat', icon: MessageCircle, label: 'Chat' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  const navItems = isSuperAdmin ? superAdminNavItems : (isAdmin ? adminNavItems : alumniNavItems);

  return (
    <>
      {/* Theme Toggle Button - Floating */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 md:hidden w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border-border shadow-lg hover:shadow-xl transition-all"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </Button>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-primary"
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
