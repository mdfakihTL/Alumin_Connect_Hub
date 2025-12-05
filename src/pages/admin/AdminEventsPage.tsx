import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import AdminEvents from '@/components/admin/AdminEvents';

const AdminEventsPage = () => {
  const { isAdmin } = useAuth();
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-10 w-10 flex-shrink-0" title="Toggle menu">
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold">Event Management</h1>
            </div>
          </div>
        </div>
        <div className="w-full px-3 sm:px-4 lg:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <AdminEvents />
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default AdminEventsPage;
