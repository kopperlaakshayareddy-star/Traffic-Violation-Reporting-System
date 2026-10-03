import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle, ChevronDown } from 'lucide-react';
import type { UserRole } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/constants';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('citizen');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email.trim(), password, fullName.trim(), phone.trim(), role);
    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else {
      navigate('/dashboard', { replace: true });
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
            Join the Mission for<br />Safer Roads
          </h1>
          <p className="text-gov-blue-100 text-lg leading-relaxed max-w-md">
            Create your account today and start reporting traffic violations.
            Every report helps make our community safer.
          </p>
          <div className="mt-12 p-6 bg-white/10 backdrop-blur rounded-xl">
            <h3 className="font-semibold mb-3 text-gov-orange-300">Choose Your Role</h3>
            <div className="space-y-2">
              {(['citizen', 'officer', 'admin'] as UserRole[]).map((r) => (
                <div key={r} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-gov-orange-400" />
                  <span className="font-medium">{ROLE_LABELS[r]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gov-blue-700 text-white">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Traffic Violation</h2>
              <p className="text-xs text-gray-500">Reporting System</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h2>
          <p className="text-sm text-gray-500 mb-6">Register to start reporting violations</p>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-slide-up">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition appearance-none bg-white"
                >
                  <option value="citizen">Citizen</option>
                  <option value="officer">Traffic Officer</option>
                  <option value="admin">Administrator</option>
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                  placeholder="At least 6 characters"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-gov-blue-500 focus:border-gov-blue-500 outline-none transition"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-gov-blue-700 text-white font-semibold hover:bg-gov-blue-800 focus:ring-2 focus:ring-gov-blue-500 focus:ring-offset-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-gov-blue-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
