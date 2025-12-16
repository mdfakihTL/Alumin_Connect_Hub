import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UniversityProvider } from "./contexts/UniversityContext";
import { GroupsProvider } from "./contexts/GroupsContext";
import { EventsProvider } from "./contexts/EventsContext";
import { ConnectionsProvider } from "./contexts/ConnectionsContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import { SupportProvider } from "./contexts/SupportContext";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import ScrollToTop from "./components/ScrollToTop";
import Index from "./pages/Index";
import FeaturesPage from "./pages/FeaturesPage";
import AboutPage from "./pages/AboutPage";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ProfileCompletion from "./pages/ProfileCompletion";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminBrandingPage from "./pages/AdminBrandingPage";
import AdminFeedPage from "./pages/admin/AdminFeedPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminMentorsPage from "./pages/admin/AdminMentorsPage";
import AdminPasswordsPage from "./pages/admin/AdminPasswordsPage";
import AdminDocumentsPage from "./pages/admin/AdminDocumentsPage";
import AdminEventsPage from "./pages/admin/AdminEventsPage";
import AdminGroupsPage from "./pages/admin/AdminGroupsPage";
import AdminFundraiserPage from "./pages/admin/AdminFundraiserPage";
import AdminKnowledgePage from "./pages/admin/AdminKnowledgePage";
import AdminSupportPage from "./pages/admin/AdminSupportPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminUniversitiesPage from "./pages/superadmin/SuperAdminUniversitiesPage";
import SuperAdminUsersPage from "./pages/superadmin/SuperAdminUsersPage";
import SuperAdminAdminsPage from "./pages/superadmin/SuperAdminAdminsPage";
import SuperAdminAdsPage from "./pages/superadmin/SuperAdminAdsPage";
import SuperAdminPasswordsPage from "./pages/superadmin/SuperAdminPasswordsPage";
import SuperAdminAnalyticsPage from "./pages/superadmin/SuperAdminAnalyticsPage";
import SuperAdminLeadIntelligencePage from "./pages/superadmin/SuperAdminLeadIntelligencePage";
import Profile from "./pages/Profile";
import AdminProfile from "./pages/AdminProfile";
import Events from "./pages/Events";
import Groups from "./pages/Groups";
import Chat from "./pages/Chat";
import AIRoadmap from "./pages/AIRoadmap";
import Documents from "./pages/Documents";
import Notifications from "./pages/Notifications";
import Connections from "./pages/Connections";
import SinglePost from "./pages/SinglePost";
import MentorshipMatch from "./pages/MentorshipMatch";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Loading spinner component for auth checks
const AuthLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

// Protected Routes Components - Must be inside Router and AuthProvider
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  // Wait for auth check to complete before redirecting
  if (isLoading) return <AuthLoading />;
  
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const ProfileRoute = () => {
  const { user, isAdmin, isSuperAdmin, isLoading } = useAuth();
  
  // Wait for auth check to complete before redirecting
  if (isLoading) return <AuthLoading />;
  
  if (!user) return <Navigate to="/login" />;
  // Admin and Super Admin get simplified profile
  if (isAdmin || isSuperAdmin) return <AdminProfile />;
  // Alumni get full profile
  return <Profile />;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, isLoading } = useAuth();
  
  // Wait for auth check to complete before redirecting
  if (isLoading) return <AuthLoading />;
  
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/dashboard" />;
  return <>{children}</>;
};

const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isSuperAdmin, isLoading } = useAuth();
  
  // Wait for auth check to complete before redirecting
  if (isLoading) return <AuthLoading />;
  
  if (!user) return <Navigate to="/login" />;
  if (!isSuperAdmin) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
  return <>{children}</>;
};

// Routes Component - Must be inside AuthProvider
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/features" element={<FeaturesPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    
    {/* Super Admin Routes */}
    <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
    <Route path="/superadmin/universities" element={<SuperAdminRoute><SuperAdminUniversitiesPage /></SuperAdminRoute>} />
    <Route path="/superadmin/users" element={<SuperAdminRoute><SuperAdminUsersPage /></SuperAdminRoute>} />
    <Route path="/superadmin/admins" element={<SuperAdminRoute><SuperAdminAdminsPage /></SuperAdminRoute>} />
    <Route path="/superadmin/ads" element={<SuperAdminRoute><SuperAdminAdsPage /></SuperAdminRoute>} />
    <Route path="/superadmin/passwords" element={<SuperAdminRoute><SuperAdminPasswordsPage /></SuperAdminRoute>} />
    <Route path="/superadmin/analytics" element={<SuperAdminRoute><SuperAdminAnalyticsPage /></SuperAdminRoute>} />
    <Route path="/superadmin/leads" element={<SuperAdminRoute><SuperAdminLeadIntelligencePage /></SuperAdminRoute>} />
    
    {/* Admin Routes */}
    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    <Route path="/admin/branding" element={<AdminRoute><AdminBrandingPage /></AdminRoute>} />
    <Route path="/admin/feed" element={<AdminRoute><AdminFeedPage /></AdminRoute>} />
    <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
    <Route path="/admin/mentors" element={<AdminRoute><AdminMentorsPage /></AdminRoute>} />
    <Route path="/admin/passwords" element={<AdminRoute><AdminPasswordsPage /></AdminRoute>} />
    <Route path="/admin/documents" element={<AdminRoute><AdminDocumentsPage /></AdminRoute>} />
    <Route path="/admin/events" element={<AdminRoute><AdminEventsPage /></AdminRoute>} />
    <Route path="/admin/groups" element={<AdminRoute><AdminGroupsPage /></AdminRoute>} />
    <Route path="/admin/fundraiser" element={<AdminRoute><AdminFundraiserPage /></AdminRoute>} />
    <Route path="/admin/knowledge" element={<AdminRoute><AdminKnowledgePage /></AdminRoute>} />
    <Route path="/admin/support" element={<AdminRoute><AdminSupportPage /></AdminRoute>} />
    
    {/* Alumni Routes */}
    <Route path="/profile-completion" element={<ProtectedRoute><ProfileCompletion /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/profile" element={<ProfileRoute />} />
    <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
    <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/roadmap" element={<ProtectedRoute><AIRoadmap /></ProtectedRoute>} />
    <Route path="/mentorship" element={<ProtectedRoute><MentorshipMatch /></ProtectedRoute>} />
    <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
    <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} />
    <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
    <Route path="/post/:id" element={<ProtectedRoute><SinglePost /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <UniversityProvider>
          <SidebarProvider>
            <ConnectionsProvider>
              <GroupsProvider>
                <EventsProvider>
                  <SupportProvider>
                    <TooltipProvider>
                      <Toaster />
                      <Sonner />
                      <PWAInstallPrompt />
                      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <ScrollToTop />
                        <AppRoutes />
                      </BrowserRouter>
                    </TooltipProvider>
                  </SupportProvider>
                </EventsProvider>
              </GroupsProvider>
            </ConnectionsProvider>
          </SidebarProvider>
        </UniversityProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
