import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Shield, Crown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUniversityBranding } from '@/hooks/use-university-branding';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Apply university branding
  useUniversityBranding();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: 'Missing credentials',
        description: 'Please enter both email and password',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      
      // Check user role and redirect accordingly
      const storedUser = JSON.parse(localStorage.getItem('alumni_user') || '{}');
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
      
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${storedUser.name}`,
      });
    } catch (error: any) {
      const message = error?.detail || 'Please check your credentials and try again';
      toast({ 
        title: 'Login failed', 
        description: message,
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  const isDisabled = isSubmitting || isLoading;

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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                  disabled={isDisabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-base font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                  disabled={isDisabled}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium"
                disabled={isDisabled}
              >
                {isDisabled ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

          <div className="mt-6 text-center text-sm">
            <Link to="/forgot-password" className="text-primary hover:underline font-medium">
              Forgot your password?
            </Link>
          </div>
          </div>
        </div>

        {/* Credentials Sidebar - Demo Credentials for Testing */}
        <div className="space-y-4 max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-2">
            <Badge variant="outline" className="text-xs">Demo Credentials</Badge>
          </div>

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
            
            <Card className="p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => fillCredentials('superadmin@alumnihub.com', 'super123')}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">System Administrator</h4>
                <Badge variant="secondary" className="text-[10px]">Super</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">superadmin@alumnihub.com</p>
              <p className="text-xs font-mono bg-muted px-2 py-1 rounded">super123</p>
            </Card>
          </Card>

          {/* Admin Credentials */}
          <Card className="p-6 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-lg">Admin Access</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Full university management access
            </p>
            
            <div className="space-y-3">
              {/* MIT Admin */}
              <Card className="p-4 hover:shadow-md transition-all cursor-pointer bg-[#A31F34]/5 border-[#A31F34]/20" onClick={() => fillCredentials('admin@mit.edu', 'mit123')}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">MIT Admin</h4>
                  <Badge variant="destructive" className="text-xs">Admin</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">admin@mit.edu</p>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded">mit123</p>
              </Card>

              {/* Stanford Admin */}
              <Card className="p-4 hover:shadow-md transition-all cursor-pointer bg-[#B1810B]/10 border-[#B1810B]/30" onClick={() => fillCredentials('admin@stanford.edu', 'stanford123')}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">Stanford Admin</h4>
                  <Badge className="bg-[#B1810B] text-white text-xs">Admin</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">admin@stanford.edu</p>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded">stanford123</p>
              </Card>
            </div>
          </Card>

          {/* MIT Alumni Credentials */}
          <Card className="p-6 bg-gradient-to-br from-[#A31F34]/10 to-[#750014]/10 border-[#A31F34]/20">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5" style={{ color: '#A31F34' }} />
              <h3 className="font-bold text-lg">MIT Alumni</h3>
            </div>
            
            <div className="space-y-2">
              <Card className="p-3 hover:shadow-md transition-all cursor-pointer" onClick={() => fillCredentials('john.doe@mit.edu', 'mit123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">John Doe</h4>
                  <Badge variant="secondary" className="text-[10px]">Mentor</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">Computer Science '20</p>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded">john.doe@mit.edu / mit123</p>
              </Card>

              <Card className="p-3 hover:shadow-md transition-all cursor-pointer" onClick={() => fillCredentials('sarah.chen@mit.edu', 'mit123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">Sarah Chen</h4>
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">Electrical Engineering '19</p>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded">sarah.chen@mit.edu / mit123</p>
              </Card>
            </div>
          </Card>

          {/* Stanford Alumni Credentials */}
          <Card className="p-6 bg-gradient-to-br from-[#B1810B]/10 to-[#E6A82D]/10 border-[#B1810B]/20">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5" style={{ color: '#B1810B' }} />
              <h3 className="font-bold text-lg">Stanford Alumni</h3>
            </div>
            
            <div className="space-y-2">
              <Card className="p-3 hover:shadow-md transition-all cursor-pointer" onClick={() => fillCredentials('michael.smith@stanford.edu', 'stanford123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">Michael Smith</h4>
                  <Badge variant="secondary" className="text-[10px]">Mentor</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">Business Administration '21</p>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded">michael.smith@stanford.edu / stanford123</p>
              </Card>

              <Card className="p-3 hover:shadow-md transition-all cursor-pointer" onClick={() => fillCredentials('emily.johnson@stanford.edu', 'stanford123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">Emily Johnson</h4>
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">Data Science '18</p>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded">emily.johnson@stanford.edu / stanford123</p>
              </Card>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
