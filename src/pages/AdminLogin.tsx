import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname || '/admin';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(false);

    const { error } = await signIn(email, password);

    if (error) {
      setLoginError(true);
      toast.error('Invalid credentials');
      setLoading(false);
      return;
    }

    toast.success('Welcome back, Admin');
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-sm border border-border shadow-2xl">
        <div className="text-center">
          <h1 className="font-display text-3xl font-semibold tracking-wider mb-2">AVON2FLAME</h1>
          <p className="font-body text-sm text-muted-foreground uppercase tracking-widest">Admin Portal</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border focus:ring-primary"
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
              className="bg-background border-border focus:ring-primary"
              required
            />
          </div>
          {loginError && (
            <p className="text-xs text-destructive text-center font-body">Invalid email or password</p>
          )}
          <Button type="submit" disabled={loading} className="w-full h-12 uppercase tracking-widest text-xs">
            {loading ? 'Signing in...' : 'Access Dashboard'}
          </Button>
        </form>
        <div className="text-center pt-4 space-y-3">
          <Link to="/auth/forgot-password" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
            Forgot password?
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
            <ArrowLeft size={12} /> Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
