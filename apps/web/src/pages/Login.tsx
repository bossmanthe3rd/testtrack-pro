import React, { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../features/auth/api';
import { useAuthStore } from '../features/auth/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';

// 1. Zod Schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  // 2. Connect to our Global Brain
  const { setTokens, fetchMe } = useAuthStore();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // 3. Handling the Login process
  const onSubmit = async (data: LoginFormValues) => {
    try {
      setServerError('');
      // Ask the backend if the credentials are correct
      const response = await api.post('/api/auth/login', data);
      console.log("1. BACKEND RESPONSE:", response.data);

      const accessToken = response.data.data?.accessToken || response.data.accessToken;
      const refreshToken = response.data.data?.refreshToken || response.data.refreshToken || "";

      // Save to browser storage
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Update the Global Brain with the new keys
      setTokens(accessToken, refreshToken);

      // Immediately ask the backend for the user's profile info
      await fetchMe();

      // 🟢 NEW: SMART REDIRECTION BASED ON ROLE
      // We use .getState() to get the freshest user data right after fetchMe() finishes
      const currentUser = useAuthStore.getState().user;

      if (currentUser?.role === 'DEVELOPER') {
        navigate('/developer/dashboard');
      } else {
        navigate('/dashboard'); // Testers and Admins go here
      }
      
    } catch (error: unknown) {
      let errorMessage = 'Login failed';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setServerError(errorMessage);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      {/* Subtle background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-[0_0_40px_-10px_rgba(79,70,229,0.15)] z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Sign in to access your dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {serverError && (
            <div className="mb-6 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <Input
                {...register('email')}
                type="email"
                placeholder="name@example.com"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
              />
              {errors.email && <p className="text-[0.8rem] font-medium text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Password
                </label>
              </div>
              <Input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
              />
              {errors.password && <p className="text-[0.8rem] font-medium text-red-400">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all duration-200 mt-2"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-slate-800/50 pt-6">
          <p className="text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Register here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};