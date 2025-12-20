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

        {/* Credentials Sidebar - Actual DB Users */}
        <div className="space-y-4 max-h-[90vh] overflow-y-auto pr-2">
          <div className="text-center mb-2">
            <Badge variant="outline" className="text-xs">All passwords: password123</Badge>
          </div>
          
          {/* Super Admin Credentials */}
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-base">Super Admin</h3>
            </div>
            
            <Card className="p-3 hover:shadow-md transition-all cursor-pointer hover:border-purple-400" onClick={() => fillCredentials('superadmin@alumni.connect', 'password123')}>
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-sm">Super Administrator</h4>
                <Badge className="bg-purple-500 text-white text-[10px]">Super</Badge>
              </div>
              <p className="text-xs font-mono bg-muted px-2 py-1 rounded">superadmin@alumni.connect</p>
            </Card>
          </Card>

          {/* Admin Credentials */}
          <Card className="p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-base">University Admins</h3>
            </div>
            
            <div className="space-y-2">
              <Card className="p-3 hover:shadow-md transition-all cursor-pointer bg-[#A31F34]/5 border-[#A31F34]/20 hover:border-[#A31F34]/50" onClick={() => fillCredentials('admin@mit.edu', 'password123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm">MIT Admin</h4>
                  <Badge variant="destructive" className="text-[10px]">Admin</Badge>
                </div>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded">admin@mit.edu</p>
              </Card>

              <Card className="p-3 hover:shadow-md transition-all cursor-pointer bg-[#8C1515]/5 border-[#8C1515]/20 hover:border-[#8C1515]/50" onClick={() => fillCredentials('admin@stanford.edu', 'password123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-sm">Stanford Admin</h4>
                  <Badge className="bg-[#8C1515] text-white text-[10px]">Admin</Badge>
                </div>
                <p className="text-xs font-mono bg-muted px-2 py-1 rounded">admin@stanford.edu</p>
              </Card>
            </div>
          </Card>

          {/* MIT Alumni Credentials */}
          <Card className="p-4 bg-gradient-to-br from-[#A31F34]/10 to-[#750014]/10 border-[#A31F34]/20">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5" style={{ color: '#A31F34' }} />
              <h3 className="font-bold text-base">MIT Alumni</h3>
            </div>
            
            <div className="space-y-2">
              <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#A31F34]/50" onClick={() => fillCredentials('john.doe@alumni.mit.edu', 'password123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">John Doe</h4>
                  <Badge variant="secondary" className="text-[10px]">Mentor</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">Computer Science '20</p>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded mt-1">john.doe@alumni.mit.edu</p>
              </Card>

              <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#A31F34]/50" onClick={() => fillCredentials('jane.smith@alumni.mit.edu', 'password123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">Jane Smith</h4>
                  <Badge variant="secondary" className="text-[10px]">Mentor</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">Electrical Engineering '19</p>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded mt-1">jane.smith@alumni.mit.edu</p>
              </Card>

              <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#A31F34]/50" onClick={() => fillCredentials('bob.wilson@alumni.mit.edu', 'password123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">Bob Wilson</h4>
                </div>
                <p className="text-[10px] text-muted-foreground">Mechanical Engineering '21</p>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded mt-1">bob.wilson@alumni.mit.edu</p>
              </Card>

              {/* New test alumni */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#A31F34]/20">
                <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#A31F34]/50" onClick={() => fillCredentials('alice.chen@mit.edu', 'password123')}>
                  <h4 className="font-semibold text-xs">Alice Chen</h4>
                  <p className="text-[10px] text-muted-foreground">CS '20</p>
                </Card>
                <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#A31F34]/50" onClick={() => fillCredentials('bob.williams@mit.edu', 'password123')}>
                  <h4 className="font-semibold text-xs">Bob Williams</h4>
                  <p className="text-[10px] text-muted-foreground">EE '20</p>
                </Card>
                <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#A31F34]/50" onClick={() => fillCredentials('carol.davis@mit.edu', 'password123')}>
                  <h4 className="font-semibold text-xs">Carol Davis</h4>
                  <p className="text-[10px] text-muted-foreground">CS '21</p>
                </Card>
                <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#A31F34]/50" onClick={() => fillCredentials('david.lee@mit.edu', 'password123')}>
                  <h4 className="font-semibold text-xs">David Lee</h4>
                  <p className="text-[10px] text-muted-foreground">CS '19</p>
                </Card>
                <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#A31F34]/50 col-span-2" onClick={() => fillCredentials('emma.wilson@mit.edu', 'password123')}>
                  <h4 className="font-semibold text-xs">Emma Wilson</h4>
                  <p className="text-[10px] text-muted-foreground">Mechanical Engineering '20</p>
                </Card>
              </div>
            </div>
          </Card>

          {/* Stanford Alumni Credentials */}
          <Card className="p-4 bg-gradient-to-br from-[#8C1515]/10 to-[#B83A4B]/10 border-[#8C1515]/20">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5" style={{ color: '#8C1515' }} />
              <h3 className="font-bold text-base">Stanford Alumni</h3>
            </div>
            
            <div className="space-y-2">
              <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#8C1515]/50" onClick={() => fillCredentials('alice.johnson@alumni.stanford.edu', 'password123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">Alice Johnson</h4>
                  <Badge variant="secondary" className="text-[10px]">Mentor</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">Business Administration '18</p>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded mt-1">alice.johnson@alumni.stanford.edu</p>
              </Card>

              <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#8C1515]/50" onClick={() => fillCredentials('charlie.brown@alumni.stanford.edu', 'password123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">Charlie Brown</h4>
                </div>
                <p className="text-[10px] text-muted-foreground">Data Science '20</p>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded mt-1">charlie.brown@alumni.stanford.edu</p>
              </Card>

              <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#8C1515]/50" onClick={() => fillCredentials('david.lee@alumni.stanford.edu', 'password123')}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-semibold text-xs">David Lee</h4>
                  <Badge variant="secondary" className="text-[10px]">Mentor</Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">Medicine '19</p>
                <p className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded mt-1">david.lee@alumni.stanford.edu</p>
              </Card>

              {/* New test alumni */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#8C1515]/20">
                <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#8C1515]/50" onClick={() => fillCredentials('frank.brown@stanford.edu', 'password123')}>
                  <h4 className="font-semibold text-xs">Frank Brown</h4>
                  <p className="text-[10px] text-muted-foreground">CS '20</p>
                </Card>
                <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#8C1515]/50" onClick={() => fillCredentials('grace.taylor@stanford.edu', 'password123')}>
                  <h4 className="font-semibold text-xs">Grace Taylor</h4>
                  <p className="text-[10px] text-muted-foreground">Business '20</p>
                </Card>
                <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#8C1515]/50" onClick={() => fillCredentials('henry.martin@stanford.edu', 'password123')}>
                  <h4 className="font-semibold text-xs">Henry Martin</h4>
                  <p className="text-[10px] text-muted-foreground">CS '21</p>
                </Card>
                <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#8C1515]/50" onClick={() => fillCredentials('ivy.johnson@stanford.edu', 'password123')}>
                  <h4 className="font-semibold text-xs">Ivy Johnson</h4>
                  <p className="text-[10px] text-muted-foreground">CS '19</p>
                </Card>
                <Card className="p-2 hover:shadow-md transition-all cursor-pointer hover:border-[#8C1515]/50 col-span-2" onClick={() => fillCredentials('jack.anderson@stanford.edu', 'password123')}>
                  <h4 className="font-semibold text-xs">Jack Anderson</h4>
                  <p className="text-[10px] text-muted-foreground">Engineering '20</p>
                </Card>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
