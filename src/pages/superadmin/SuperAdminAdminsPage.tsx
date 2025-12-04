import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import SuperAdminAdmins from '@/components/superadmin/SuperAdminAdmins';

const SuperAdminAdminsPage = () => {
  const { isSuperAdmin } = useAuth();
  const { isOpen: isSidebarOpen } = useSidebar();
  const navigate = useNavigate();

  if (!isSuperAdmin) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        <div className="w-full px-3 sm:px-4 lg:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <SuperAdminAdmins />
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default SuperAdminAdminsPage;
