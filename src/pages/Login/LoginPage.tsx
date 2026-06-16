import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserCheck, Mail, Lock, ChevronRight } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      setLoading(true);
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or server error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[420px] bg-[#0F172A] text-white p-10 flex-shrink-0">
        <div className="flex items-center gap-2.5 mb-16">
          <div className="w-8 h-8 bg-primary rounded-[7px] flex items-center justify-center">
            <UserCheck size={16} className="text-white" />
          </div>
          <div>
            <div className="text-base font-semibold leading-tight">RecruitTrack</div>
            <div className="text-[11px] text-slate-400 leading-tight">Hiring Operations Platform</div>
          </div>
        </div>

        <div className="flex-1">
          <h2 className="text-3xl font-semibold mb-3 leading-tight">Built for serious<br />hiring teams.</h2>
          <p className="text-slate-400 text-[15px] leading-relaxed mb-10">
            Manage your entire recruitment pipeline from sourcing to offer — all in one place.
          </p>

          <div className="space-y-4">
            {[
              'End-to-end candidate tracking',
              'Real-time hiring analytics',
              'Collaborative interview scorecards',
              'Role-based access control',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <div className="text-xs text-slate-500">
            Trusted by 500+ hiring teams · SOC 2 Type II Certified
          </div>
        </div>
      </div>

      {/* Right panel (form) */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 bg-primary rounded-[6px] flex items-center justify-center">
              <UserCheck size={14} className="text-white" />
            </div>
            <span className="text-base font-semibold text-text">RecruitTrack</span>
          </div>

          <h1 className="text-2xl font-semibold text-text mb-1">Sign in</h1>
          <p className="text-sm text-text-muted mb-7">Enter your credentials to access the platform.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  {...register('email')}
                  type="email"
                  className="w-full h-10 pl-9 pr-3 text-sm border border-border rounded-md bg-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-text">Password</label>
                <button type="button" className="text-xs text-primary hover:text-primary-hover transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  {...register('password')}
                  type="password"
                  className="w-full h-10 pl-9 pr-3 text-sm border border-border rounded-md bg-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
              iconRight={!loading ? <ChevronRight size={16} /> : undefined}
            >
              Sign In
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
