import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, Building2, Users, TrendingUp, DollarSign, 
  LayoutDashboard, Settings, Shield, Image, Key, Menu, Target
} from 'lucide-react';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import { useSidebar } from '@/contexts/SidebarContext';
import SuperAdminAnalytics from '@/components/superadmin/SuperAdminAnalytics';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  // Get statistics
  const [stats, setStats] = useState({
    totalUniversities: 0,
    enabledUniversities: 0,
    totalAdmins: 0,
    totalAlumni: 0,
    totalAds: 0,
    activeAds: 0,
    pendingPasswordResets: 0,
  });

  useEffect(() => {
    // Get real stats from localStorage
    const universities = JSON.parse(localStorage.getItem('alumni_universities') || '[]');
    const enabledUniversities = universities.filter((u: any) => u.enabled !== false);
    
    let totalAdmins = 0;
    let totalAlumni = 0;
    
    universities.forEach((uni: any) => {
      const users = JSON.parse(localStorage.getItem(`alumni_users_${uni.id}`) || '[]');
      totalAlumni += users.length;
    });

    // Count admins from super_admin_admins
    const admins = JSON.parse(localStorage.getItem('super_admin_admins') || '[]');
    totalAdmins = admins.length;

    const ads = JSON.parse(localStorage.getItem('super_admin_ads') || '[]');
    const activeAds = ads.filter((ad: any) => ad.isActive);

    const passwordResets = JSON.parse(localStorage.getItem('super_admin_password_resets') || '[]');
    const pendingResets = passwordResets.filter((r: any) => r.status === 'pending');

    setStats({
      totalUniversities: universities.length,
      enabledUniversities: enabledUniversities.length,
      totalAdmins: totalAdmins || 2,
      totalAlumni: totalAlumni || 0,
      totalAds: ads.length,
      activeAds: activeAds.length,
      pendingPasswordResets: pendingResets.length,
    });
  }, [user?.universityId]);

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg sm:text-xl md:text-2xl font-bold">Super Admin Dashboard</h1>
                      <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">Master Control</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">AlumniHub Central Management</p>
                  </div>
                </div>
                {/* Sidebar Toggle - All Screen Sizes */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSidebar}
                  className="h-10 w-10 flex-shrink-0"
                  title="Toggle menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto space-y-4">
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  {/* Total Universities */}
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/superadmin/universities')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold">{stats.totalUniversities}</h3>
                        <p className="text-xs text-muted-foreground truncate">Universities</p>
                      </div>
                    </div>
                  </Card>

                  {/* Enabled Universities */}
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold">{stats.enabledUniversities}</h3>
                        <p className="text-xs text-muted-foreground truncate">Active</p>
                      </div>
                    </div>
                  </Card>

                  {/* Total Admins */}
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/superadmin/admins')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold">{stats.totalAdmins}</h3>
                        <p className="text-xs text-muted-foreground truncate">Admins</p>
                      </div>
                    </div>
                  </Card>

                  {/* Total Alumni */}
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/superadmin/users')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-cyan-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold">{stats.totalAlumni}</h3>
                        <p className="text-xs text-muted-foreground truncate">Alumni</p>
                      </div>
                    </div>
                  </Card>

                  {/* Total Ads */}
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/superadmin/ads')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <Image className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold">{stats.totalAds}</h3>
                        <p className="text-xs text-muted-foreground truncate">Ads</p>
                      </div>
                    </div>
                  </Card>

                  {/* Active Ads */}
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-pink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold">{stats.activeAds}</h3>
                        <p className="text-xs text-muted-foreground truncate">Active</p>
                      </div>
                    </div>
                  </Card>
                </div>

            {/* Quick Actions */}
            <Card className="p-4">
              <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <Button onClick={() => navigate('/superadmin/universities')} size="sm" className="h-auto py-3 flex flex-col gap-1.5">
                  <Building2 className="w-4 h-4" />
                  <span className="text-xs">Add University</span>
                </Button>
                <Button onClick={() => navigate('/superadmin/admins')} size="sm" variant="outline" className="h-auto py-3 flex flex-col gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">Assign Admin</span>
                </Button>
                <Button onClick={() => navigate('/superadmin/ads')} size="sm" variant="outline" className="h-auto py-3 flex flex-col gap-1.5">
                  <Image className="w-4 h-4" />
                  <span className="text-xs">Create Ad</span>
                </Button>
                <Button onClick={() => navigate('/superadmin/analytics')} size="sm" variant="outline" className="h-auto py-3 flex flex-col gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs">View Analytics</span>
                </Button>
                <Button onClick={() => navigate('/superadmin/leads')} size="sm" variant="outline" className="h-auto py-3 flex flex-col gap-1.5 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30 hover:border-primary/50">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-xs">Lead Intelligence</span>
                </Button>
              </div>
            </Card>

            {/* System Status */}
            <SuperAdminAnalytics />
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default SuperAdminDashboard;

