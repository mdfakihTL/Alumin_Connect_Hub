import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { GraduationCap, Loader2, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiClientError } from '@/lib/api';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Validation
  const passwordsMatch = formData.password === formData.confirmPassword;
  const isPasswordValid = formData.password.length >= 8;
  const isUsernameValid = formData.username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(formData.username);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isFormValid = passwordsMatch && isPasswordValid && isUsernameValid && isEmailValid && formData.fullName.length >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!isUsernameValid) {
      setError('Username must be at least 3 characters and contain only letters, numbers, and underscores');
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
      });

      toast({
        title: 'Account created!',
        description: 'Welcome to the Alumni Network. Please complete your profile.',
      });

      // Navigate to profile completion
      navigate('/profile-completion');
    } catch (err) {
      let errorMessage = 'Registration failed. Please try again.';

      if (err instanceof ApiClientError) {
        errorMessage = err.message;

        // Handle specific errors
        if (err.message.toLowerCase().includes('email')) {
          errorMessage = 'This email is already registered. Please use a different email or try logging in.';
        } else if (err.message.toLowerCase().includes('username')) {
          errorMessage = 'This username is already taken. Please choose a different one.';
        } else if (err.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      } else if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        }
      }

      setError(errorMessage);
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create Account</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Join your alumni network today</p>
        </div>

        <Card className="p-6 sm:p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-base font-medium">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                className="h-11"
                required
                disabled={isSubmitting}
                autoComplete="name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@university.edu"
                value={formData.email}
                onChange={handleChange}
                className="h-11"
                required
                disabled={isSubmitting}
                autoComplete="email"
              />
              {formData.email && !isEmailValid && (
                <p className="text-xs text-destructive">Please enter a valid email address</p>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-base font-medium">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
                className="h-11"
                required
                disabled={isSubmitting}
                autoComplete="username"
              />
              {formData.username && !isUsernameValid && (
                <p className="text-xs text-destructive">
                  Username must be at least 3 characters (letters, numbers, underscores only)
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base font-medium">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                className="h-11"
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {formData.password && (
                <div className="flex items-center gap-2 text-xs">
                  {isPasswordValid ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span className={isPasswordValid ? 'text-green-600' : 'text-muted-foreground'}>
                    At least 8 characters
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base font-medium">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="h-11"
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {formData.confirmPassword && (
                <div className="flex items-center gap-2 text-xs">
                  {passwordsMatch ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-destructive" />
                  )}
                  <span className={passwordsMatch ? 'text-green-600' : 'text-destructive'}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isSubmitting || !isFormValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
