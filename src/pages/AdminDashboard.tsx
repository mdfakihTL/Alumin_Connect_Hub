import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversity } from '@/contexts/UniversityContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, UserPlus, Shield, FileText, Calendar, 
  UsersRound, DollarSign, Settings, Menu, RefreshCw
} from 'lucide-react';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import { useSidebar } from '@/contexts/SidebarContext';
import WorldMapHeatmap from '@/components/WorldMapHeatmap';
import { adminApi } from '@/api/admin';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { getUniversity } = useUniversity();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const { toast } = useToast();
  const navigate = useNavigate();

  const university = user?.universityId ? getUniversity(user.universityId) : null;

  // Get real statistics from API
  const [stats, setStats] = useState({
    totalAlumni: 0,
    activeMentors: 0,
    pendingDocuments: 0,
    pendingEvents: 0,
    pendingPasswordResets: 0,
    activeGroups: 0,
    activeFundraisers: 0,
    openTickets: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    if (!user?.universityId) return;

    setIsLoading(true);
    try {
      const dashboardStats = await adminApi.getDashboardStats();
      setStats({
        totalAlumni: dashboardStats.total_alumni,
        activeMentors: dashboardStats.active_mentors,
        pendingDocuments: dashboardStats.pending_documents,
        pendingEvents: dashboardStats.upcoming_events,
        pendingPasswordResets: dashboardStats.password_resets,
        activeGroups: dashboardStats.active_groups,
        activeFundraisers: dashboardStats.active_fundraisers,
        openTickets: dashboardStats.open_tickets,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
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
                  {university?.logo ? (
                  <div className="w-12 h-12 rounded-xl bg-card border-2 border-primary/20 flex items-center justify-center p-2">
                    <img 
                      src={university.logo} 
                      alt={university.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-primary"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                )}
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">{university?.name || user?.university}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Refresh Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={fetchStats}
                    disabled={isLoading}
                    className="h-10 w-10 flex-shrink-0"
                    title="Refresh stats"
                  >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
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
        </div>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-6">
          <div className="max-w-7xl mx-auto space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                  {/* Total Alumni */}
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {isLoading ? (
                          <Skeleton className="h-7 w-12 mb-1" />
                        ) : (
                          <h3 className="text-xl font-bold">{stats.totalAlumni}</h3>
                        )}
                        <p className="text-xs text-muted-foreground truncate">Alumni</p>
                      </div>
                    </div>
                  </Card>

                  {/* Active Mentors */}
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {isLoading ? (
                          <Skeleton className="h-7 w-12 mb-1" />
                        ) : (
                          <h3 className="text-xl font-bold">{stats.activeMentors}</h3>
                        )}
                        <p className="text-xs text-muted-foreground truncate">Mentors</p>
                      </div>
                    </div>
                  </Card>

                  {/* Pending Documents */}
                  <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/documents')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0 relative">
                        <FileText className="w-5 h-5 text-orange-500" />
                        {!isLoading && stats.pendingDocuments > 0 && (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 p-0 text-[9px] flex items-center justify-center">{stats.pendingDocuments}</Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isLoading ? (
                          <Skeleton className="h-7 w-12 mb-1" />
                        ) : (
                          <h3 className="text-xl font-bold">{stats.pendingDocuments}</h3>
                        )}
                        <p className="text-xs text-muted-foreground truncate">Docs</p>
                      </div>
                    </div>
                  </Card>

                  {/* Pending Password Resets */}
                  <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/passwords')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 relative">
                        <Shield className="w-5 h-5 text-red-500" />
                        {!isLoading && stats.pendingPasswordResets > 0 && (
                          <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 p-0 text-[9px] flex items-center justify-center">{stats.pendingPasswordResets}</Badge>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isLoading ? (
                          <Skeleton className="h-7 w-12 mb-1" />
                        ) : (
                          <h3 className="text-xl font-bold">{stats.pendingPasswordResets}</h3>
                        )}
                        <p className="text-xs text-muted-foreground truncate">Resets</p>
                      </div>
                    </div>
                  </Card>

                  {/* Events */}
                  <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/events')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {isLoading ? (
                          <Skeleton className="h-7 w-12 mb-1" />
                        ) : (
                          <h3 className="text-xl font-bold">{stats.pendingEvents}</h3>
                        )}
                        <p className="text-xs text-muted-foreground truncate">Events</p>
                      </div>
                    </div>
                  </Card>

                  {/* Active Groups */}
                  <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/groups')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <UsersRound className="w-5 h-5 text-cyan-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {isLoading ? (
                          <Skeleton className="h-7 w-12 mb-1" />
                        ) : (
                          <h3 className="text-xl font-bold">{stats.activeGroups}</h3>
                        )}
                        <p className="text-xs text-muted-foreground truncate">Groups</p>
                      </div>
                    </div>
                  </Card>

                  {/* Active Fundraisers */}
                  <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/admin/fundraiser')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5 text-pink-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {isLoading ? (
                          <Skeleton className="h-7 w-12 mb-1" />
                        ) : (
                          <h3 className="text-xl font-bold">{stats.activeFundraisers}</h3>
                        )}
                        <p className="text-xs text-muted-foreground truncate">Campaigns</p>
                      </div>
                    </div>
                  </Card>
                </div>

            {/* Quick Actions */}
            <Card className="p-4">
              <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Button onClick={() => navigate('/admin/users')} size="sm" className="h-auto py-3 flex flex-col gap-1.5">
                  <UserPlus className="w-4 h-4" />
                  <span className="text-xs">Add Alumni</span>
                </Button>
                <Button onClick={() => navigate('/admin/events')} size="sm" variant="outline" className="h-auto py-3 flex flex-col gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Create Event</span>
                </Button>
                <Button onClick={() => navigate('/admin/groups')} size="sm" variant="outline" className="h-auto py-3 flex flex-col gap-1.5">
                  <UsersRound className="w-4 h-4" />
                  <span className="text-xs">Create Group</span>
                </Button>
                <Button onClick={() => navigate('/admin/fundraiser')} size="sm" variant="outline" className="h-auto py-3 flex flex-col gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs">Fundraiser</span>
                </Button>
              </div>
            </Card>

            {/* University Branding Quick Access */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold">University Branding</h2>
                  <p className="text-xs text-muted-foreground">Manage colors, logo, and name</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/branding')}>
                  <Settings className="w-4 h-4 mr-2" />
                  <span className="text-xs">Customize</span>
                </Button>
              </div>
            </Card>

            {/* Alumni World Map */}
            {user?.universityId && (
              <WorldMapHeatmap 
                universityId={user.universityId}
                title="Global Alumni Distribution"
                height="500px"
              />
            )}
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default AdminDashboard;

