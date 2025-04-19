import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { CheckCircle, Mail, AlertCircle, Check, X, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Auth = () => {
  const { login, register, loginAsGuest, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  const pendingConfirmation = searchParams.get('pendingConfirmation') === 'true';
  const confirmation = searchParams.get('confirmation') === 'true';

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasUppercase: false,
  });

  // Validate password on change
  useEffect(() => {
    setPasswordValidation({
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
    });
  }, [password]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  useEffect(() => {
    // If user was redirected back after confirmation, show confirmation success
    if (confirmation) {
      navigate('/auth'); // Remove query param after processing
    }
  }, [confirmation, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password before registration
    if (!isPasswordValid) {
      toast.error('Please ensure your password meets all requirements');
      return;
    }
    
    try {
      await register(name, email, password);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await loginAsGuest();
      navigate('/dashboard');
    } catch (error) {
      console.error('Guest login error:', error);
      toast.error('Failed to login as guest. Please try again.');
    }
  };

  if (pendingConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle>Check your email</CardTitle>
            <CardDescription>
              We've sent a confirmation link to your email address.
              Please check your inbox and click the link to confirm your account.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => navigate('/auth')}>
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (confirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <CardTitle>Account Confirmed!</CardTitle>
            <CardDescription>
              Your account has been successfully confirmed.
              You can now log in with your credentials.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => navigate('/auth')}>
              Continue to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            TechInterview.AI
          </h1>
          <p className="text-muted-foreground mt-2">
            Your AI interview preparation assistant
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    
                    <Alert className="mt-2" variant="outline">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Password Requirements</AlertTitle>
                      <AlertDescription>
                        <ul className="space-y-1 mt-2">
                          <li className="flex items-center text-xs">
                            {passwordValidation.minLength ? (
                              <Check className="mr-2 h-3 w-3 text-green-500" />
                            ) : (
                              <X className="mr-2 h-3 w-3 text-red-500" />
                            )}
                            <span>Be at least 8 characters long</span>
                          </li>
                          <li className="flex items-center text-xs">
                            {passwordValidation.hasNumber ? (
                              <Check className="mr-2 h-3 w-3 text-green-500" />
                            ) : (
                              <X className="mr-2 h-3 w-3 text-red-500" />
                            )}
                            <span>Include at least one number</span>
                          </li>
                          <li className="flex items-center text-xs">
                            {passwordValidation.hasSpecial ? (
                              <Check className="mr-2 h-3 w-3 text-green-500" />
                            ) : (
                              <X className="mr-2 h-3 w-3 text-red-500" />
                            )}
                            <span>Include at least one special character (!@#$%^&*)</span>
                          </li>
                          <li className="flex items-center text-xs">
                            {passwordValidation.hasUppercase ? (
                              <Check className="mr-2 h-3 w-3 text-green-500" />
                            ) : (
                              <X className="mr-2 h-3 w-3 text-red-500" />
                            )}
                            <span>Include at least one uppercase letter</span>
                          </li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || !isPasswordValid}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={handleGuestLogin}>
                Continue as Guest
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <Button
                  variant="link"
                  className="underline text-sm"
                  onClick={() => navigate('/')}
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
