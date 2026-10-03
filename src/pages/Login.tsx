import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { UserRole } from '@/lib/types';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email.trim(), password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
    } else {
      navigate(from, { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gov-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gov-blue-800 via-gov-blue-700 to-gov-blue-900" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/10 backdrop-blur">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Traffic Violation</h2>
              <p className="text-sm text-gov-blue-200">Reporting System</p>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Making Roads Safer,<br />Together
          </h1>
          <p className="text-gov-blue-100 text-lg leading-relaxed max-w-md">
            Report traffic violations, track their status, and help authorities take action.
            A unified platform for citizens, officers, and administrators.
          </p>
          <div className="mt-12 space-y-4">
            {[
              { label: 'Citizens', desc: 'Report violations with photos & GPS' },
              { label: 'Officers', desc: 'Review, approve & reject reports' },
              { label: 'Admins', desc: 'Manage users & oversee all reports' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gov-orange-400" />
                <div>
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-gov-blue-200 text-sm ml-2">— {item.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gov-blue-700 text-white">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Traffic Violation</h2>
              <p className="text-xs text-gray-500">Reporting System</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
          <p className="text-sm text-gray-500 mb-8">Sign in to your account to continue</p>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-slide-up">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gov-blue-700 text-white font-semibold hover:bg-gov-blue-800 focus:ring-2 focus:ring-gov-blue-500 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-gov-blue-700 font-semibold hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
