import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Shield, Crown, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUniversityBranding } from '@/hooks/use-university-branding';
import { ApiClientError } from '@/lib/api';

const Login = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Apply university branding
  useUniversityBranding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(emailOrUsername, password);
      
      // Get stored user to determine redirect
      const storedUser = JSON.parse(localStorage.getItem('alumni_user') || '{}');
      
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${storedUser.name || storedUser.username || 'User'}`,
      });
      
      // Redirect based on role
      if (storedUser.role === 'superadmin') {
        navigate('/superadmin');
      } else if (storedUser.role === 'admin') {
        navigate('/admin');
      } else {
        // Alumni - check if profile completion needed
        const profileCompleted = localStorage.getItem(`profile_completion_${storedUser.id}`);
        if (!profileCompleted) {
          navigate('/profile-completion');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      let errorMessage = 'Login failed. Please check your credentials and try again.';
      
      if (err instanceof ApiClientError) {
        errorMessage = err.message;
        
        // Specific error handling
        if (err.status === 401) {
          errorMessage = 'Invalid username/email or password';
        } else if (err.status === 403) {
          errorMessage = 'Your account has been deactivated. Please contact support.';
        } else if (err.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (err instanceof Error) {
        // Network errors
        if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        }
      }
      
      setError(errorMessage);
      toast({ 
        title: 'Login failed', 
        description: errorMessage,
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (email: string, pwd: string) => {
    setEmailOrUsername(email);
    setPassword(pwd);
    setError(null);
  };

  const isButtonDisabled = isSubmitting || isLoading || !emailOrUsername || !password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Login Form */}
        <div className="lg:col-span-2">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Sign in to connect with your network</p>
          </div>

          <div className="bg-card rounded-2xl p-6 sm:p-8 shadow-lg border border-border/50">
            {/* Error Alert */}
            {error && (
              <div className="mb-5 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername" className="text-base font-medium">Email or Username</Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="you@university.edu or username"
                  value={emailOrUsername}
                  onChange={(e) => {
                    setEmailOrUsername(e.target.value);
                    setError(null);
                  }}
                  className="h-11"
                  required
                  disabled={isSubmitting}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="h-11"
                  required
                  disabled={isSubmitting}
                  autoComplete="current-password"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium"
                disabled={isButtonDisabled}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
              <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                Forgot your password?
              </Link>
              <Link to="/register" className="text-muted-foreground hover:text-primary transition-colors">
                Don't have an account? <span className="font-medium text-primary">Sign up</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Credentials Sidebar - For demo purposes */}
        <div className="space-y-4 max-h-[90vh] overflow-y-auto">
          {/* Super Admin Credentials */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Super Admin</h3>
              <Badge variant="secondary" className="text-xs">Master</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Full system control - All universities
            </p>
            
            <Card 
              className="p-4 hover:shadow-md transition-all cursor-pointer" 
              onClick={() => fillCredentials('superadmin', 'superadmin123')}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">System Administrator</h4>
                <Badge variant="secondary" className="text-[10px]">Super</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">superadmin</p>
              <p className="text-xs font-mono bg-muted px-2 py-1 rounded">superadmin123</p>
            </Card>
          </Card>

          {/* Admin Credentials */}
          <Card className="p-6 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-lg">Admin Access</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              University management access
            </p>
            
            <div className="space-y-3">
              <Card 
                className="p-4 hover:shadow-md transition-all cursor-pointer bg-blue-500/5 border-blue-500/20" 
                onClick={() => fillCredentials('tech_admin', 'tech123')}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Tech University Admin</h4>
                  <Badge variant="destructive" className="text-xs">Admin</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">tech_admin</p>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded">tech123</p>
              </Card>
            </div>
          </Card>

          {/* Alumni Credentials */}
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-green-500" />
              <h3 className="font-bold text-lg">Alumni Access</h3>
            </div>
            
            <div className="space-y-2">
              <Card 
                className="p-3 hover:shadow-md transition-all cursor-pointer" 
                onClick={() => fillCredentials('alumni_john', 'alumni123')}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">John Alumni</h4>
                  <Badge variant="secondary" className="text-[10px]">Alumni</Badge>
                </div>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded">alumni_john / alumni123</p>
              </Card>
            </div>
          </Card>

          {/* API Info */}
          <Card className="p-4 bg-muted/50">
            <p className="text-xs text-muted-foreground text-center">
              Connected to backend API.<br />
              Click any card above to fill credentials.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
