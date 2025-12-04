import { useAuth } from '@/contexts/AuthContext';
import { useUniversity } from '@/contexts/UniversityContext';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import AdminBranding from '@/components/admin/AdminBranding';

const AdminBrandingPage = () => {
  const { user, isAdmin } = useAuth();
  const { getUniversity } = useUniversity();
  const { isOpen: isSidebarOpen } = useSidebar();
  const navigate = useNavigate();

  const university = user?.universityId ? getUniversity(user.universityId) : null;

  // Redirect if not admin
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/admin')}
                  className="flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
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
                  <h1 className="text-2xl font-bold">University Branding</h1>
                  <p className="text-sm text-muted-foreground">{university?.name || user?.university}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <AdminBranding />
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
};

export default AdminBrandingPage;

