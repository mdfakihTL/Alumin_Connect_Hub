import { useRef, useEffect } from 'react';
import { Home, Users, Calendar, MessageCircle, User, GraduationCap, Sparkles, LogOut, FileText, Moon, Sun, UserPlus, Menu, X, Heart, Shield, LayoutDashboard, Settings, UsersRound, DollarSign, Crown, Key, Book, Image, TrendingUp, Headset, Target } from 'lucide-react';
import { NavLink } from './NavLink';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversity } from '@/contexts/UniversityContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUniversityBranding } from '@/hooks/use-university-branding';

const DesktopNav = () => {
  const { user, isAdmin, isSuperAdmin, logout } = useAuth();
  const { getUniversity } = useUniversity();
  const { theme, toggleTheme } = useTheme();
  const { isOpen, toggleSidebar, closeSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);
  
  // Apply university branding
  useUniversityBranding();

  // Save and restore scroll position using sessionStorage for persistence
  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const SCROLL_KEY = 'sidebar_scroll_position';

    // Restore scroll position on mount and route change
    const savedScroll = sessionStorage.getItem(SCROLL_KEY);
    if (savedScroll) {
      const scrollPos = parseInt(savedScroll, 10);
      
      // Multiple restoration attempts with different timings
      navElement.scrollTop = scrollPos; // Immediate
      
      setTimeout(() => {
        if (navElement) navElement.scrollTop = scrollPos;
      }, 0);
      
      setTimeout(() => {
        if (navElement) navElement.scrollTop = scrollPos;
      }, 10);
      
      setTimeout(() => {
        if (navElement) navElement.scrollTop = scrollPos;
      }, 50);
      
      requestAnimationFrame(() => {
        if (navElement) navElement.scrollTop = scrollPos;
        requestAnimationFrame(() => {
          if (navElement) navElement.scrollTop = scrollPos;
        });
      });
    }

    // Save scroll position on scroll
    const handleScroll = () => {
      sessionStorage.setItem(SCROLL_KEY, navElement.scrollTop.toString());
    };

    navElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      navElement.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const university = user?.universityId ? getUniversity(user.universityId) : null;

  // Super Admin navigation items
  const superAdminNavItems = [
    { to: '/superadmin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/superadmin/universities', icon: Settings, label: 'Universities' },
    { to: '/superadmin/users', icon: Users, label: 'All Users' },
    { to: '/superadmin/admins', icon: Shield, label: 'Admins' },
    { to: '/superadmin/ads', icon: Image, label: 'Ads' },
    { to: '/superadmin/passwords', icon: Key, label: 'Passwords' },
    { to: '/superadmin/analytics', icon: TrendingUp, label: 'Analytics' },
    { to: '/superadmin/leads', icon: Target, label: 'Lead Intelligence' },
  ];

  // Admin navigation items
  const adminNavItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/branding', icon: Settings, label: 'Branding' },
    { to: '/admin/feed', icon: FileText, label: 'Feed' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/mentors', icon: Shield, label: 'Mentors' },
    { to: '/admin/passwords', icon: Key, label: 'Passwords' },
    { to: '/admin/documents', icon: FileText, label: 'Documents' },
    { to: '/admin/events', icon: Calendar, label: 'Events' },
    { to: '/admin/groups', icon: UsersRound, label: 'Groups' },
    { to: '/admin/fundraiser', icon: DollarSign, label: 'Fundraiser' },
    { to: '/admin/knowledge', icon: Book, label: 'Knowledge Base' },
    { to: '/admin/support', icon: Headset, label: 'Support Tickets' },
  ];

  // Alumni navigation items
  const alumniNavItems = [
    { to: '/dashboard', icon: Home, label: 'Feed' },
    { to: '/connections', icon: UserPlus, label: 'Connections' },
    { to: '/mentorship', icon: Heart, label: 'Find Mentor' },
    { to: '/roadmap', icon: Sparkles, label: 'AI Roadmap' },
    { to: '/groups', icon: Users, label: 'Groups' },
    { to: '/events', icon: Calendar, label: 'Events' },
    { to: '/chat', icon: MessageCircle, label: 'Messages' },
    { to: '/documents', icon: FileText, label: 'Documents' },
    { to: '/support', icon: Headset, label: 'Support' },
  ];

  const navItems = isSuperAdmin ? superAdminNavItems : (isAdmin ? adminNavItems : alumniNavItems);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed left-0 top-0 flex flex-col w-64 bg-card border-r border-border z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          h-[calc(100dvh-4rem)] md:h-[100dvh]
          md:z-40
        `}
      >
        {/* Header - Fixed */}
        <div className="p-3 sm:p-4 lg:p-5 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {university?.logo && !isSuperAdmin ? (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0 p-1.5">
                  <img 
                    src={university.logo} 
                    alt={university.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                  {isSuperAdmin ? (
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  ) : isAdmin ? (
                    <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  ) : (
                    <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base sm:text-lg truncate">
                    {isSuperAdmin ? 'Super Admin' : (isAdmin ? 'Admin Panel' : 'Alumni Network')}
                  </h1>
                  {isSuperAdmin && (
                    <Badge variant="secondary" className="text-[10px]">Super</Badge>
                  )}
                  {isAdmin && !isSuperAdmin && (
                    <Badge variant="secondary" className="text-[10px]">Admin</Badge>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {isSuperAdmin ? 'Master Control' : (university?.name || user?.university)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeSidebar}
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 hover:bg-destructive/10"
              title="Close menu"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav 
          ref={navRef} 
          className="flex-1 p-2 sm:p-3 space-y-1 overflow-y-auto min-h-0"
          style={{ scrollBehavior: 'auto' }}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.label === 'Dashboard'}
              onClick={(e) => {
                // Save scroll position before navigation
                if (navRef.current) {
                  sessionStorage.setItem('sidebar_scroll_position', navRef.current.scrollTop.toString());
                }
                if (window.innerWidth < 768) closeSidebar();
              }}
              className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-xs sm:text-sm"
              activeClassName="bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section - Fixed */}
        <div className="p-2 sm:p-3 border-t border-border space-y-1 sm:space-y-1.5 flex-shrink-0 bg-card">
          <NavLink
            to="/profile"
            onClick={() => {
              if (window.innerWidth < 768) closeSidebar();
            }}
            className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <img
              src={user?.avatar}
              alt={user?.name}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm truncate">{user?.name}</p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </NavLink>
          <Button
            variant="ghost"
            onClick={toggleTheme}
            className="w-full justify-start gap-2 sm:gap-2.5 text-muted-foreground hover:text-foreground h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Light Mode</span>
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-2 sm:gap-2.5 text-muted-foreground hover:text-foreground h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Logout</span>
          </Button>
        </div>
      </aside>
    </>
  );
};

export default DesktopNav;
