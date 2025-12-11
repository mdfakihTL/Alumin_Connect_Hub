import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Menu, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DesktopNav from '@/components/DesktopNav';
import MobileNav from '@/components/MobileNav';
import SuperAdminLeadIntelligence from '@/components/superadmin/SuperAdminLeadIntelligence';

const SuperAdminLeadIntelligencePage = () => {
  const { isOpen: isSidebarOpen, toggleSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <DesktopNav />
      <main className={`min-h-screen pb-20 md:pb-0 transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
        {/* Header */}
        <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm">
          <div className="w-full px-3 sm:px-4 lg:px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar} 
                className="h-10 w-10 flex-shrink-0" 
                title="Toggle menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">Lead Intelligence</h1>
                  <Badge variant="secondary" className="hidden sm:inline-flex text-[10px]">Beta</Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  AI-powered lead scoring & analytics
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <SuperAdminLeadIntelligence />
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
};

export default SuperAdminLeadIntelligencePage;

