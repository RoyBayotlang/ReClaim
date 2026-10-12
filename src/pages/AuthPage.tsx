import { useState, FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Recycle, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

interface FormErrors {
  full_name?: string;
  email?: string;
  password?: string;
  confirm_password?: string;
  general?: string;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AuthPage() {
  const { session, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // If already authenticated, redirect to dashboard
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }
  if (session) {
    return <Navigate to="/" replace />;
  }

  const updateField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
    // Clear field-level error on change
    setErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
    setSuccessMessage('');
  };

  function validate(): FormErrors {
    const errs: FormErrors = {};

    if (mode === 'register' && !form.full_name.trim()) {
      errs.full_name = 'Full name is required.';
    }

    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!validateEmail(form.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!form.password) {
      errs.password = 'Password is required.';
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (mode === 'register') {
      if (!form.confirm_password) {
        errs.confirm_password = 'Please confirm your password.';
      } else if (form.password !== form.confirm_password) {
        errs.confirm_password = 'Passwords do not match.';
      }
    }

    return errs;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccessMessage('');

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) {
          setErrors({ general: error.message });
        }
        // On success, the AuthContext listener will detect the session change
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.full_name.trim(),
            },
          },
        });

        if (error) {
          setErrors({ general: error.message });
        } else if (data.user && !data.session) {
          // Email confirmation is required
          setSuccessMessage(
            'Account created! Please check your email to confirm your address, then log in.'
          );
          setMode('login');
          setForm({ full_name: '', email: form.email, password: '', confirm_password: '' });
        }
        // If data.session exists, the user is auto-confirmed and AuthContext will pick it up
      }
    } catch {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
    setSuccessMessage('');
    setForm({ full_name: '', email: form.email, password: '', confirm_password: '' });
  }

  const inputBase =
    'w-full px-4 py-2.5 text-sm border rounded-lg bg-white transition-colors ' +
    'focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ' +
    'disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500 rounded-xl mb-4">
            <Recycle size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Re<span className="text-emerald-600">Claim</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Refurbishment & asset recovery management
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {mode === 'login'
              ? 'Sign in to continue to your dashboard.'
              : 'Set up your account to start tracking refurbishments.'}
          </p>

          {/* Success message */}
          {successMessage && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle size={16} className="text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-800">{successMessage}</p>
            </div>
          )}

          {/* General error */}
          {errors.general && (
            <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full name (register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-fullname" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full name
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  autoComplete="name"
                  className={`${inputBase} ${errors.full_name ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Juan Dela Cruz"
                  value={form.full_name}
                  onChange={updateField('full_name')}
                  disabled={submitting}
                />
                {errors.full_name && (
                  <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>
                )}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                className={`${inputBase} ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="you@example.com"
                value={form.email}
                onChange={updateField('email')}
                disabled={submitting}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className={`${inputBase} pr-10 ${errors.password ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={updateField('password')}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm password (register only) */}
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="auth-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`${inputBase} pr-10 ${errors.confirm_password ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="••••••••"
                    value={form.confirm_password}
                    onChange={updateField('confirm_password')}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirm_password}</p>
                )}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium
                         rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-sm text-center text-gray-500 mt-5">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          ReClaim — Asset Recovery System v0.1.0
        </p>
      </div>
    </div>
  );
}
