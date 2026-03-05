import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../features/auth/api';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';

// 1. Define the Zod Schema (The rules for the form)
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Show the error under the confirm password field
});

// Infer the TypeScript type from the Zod schema
type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate(); // Tool to redirect the user to a new page
  const [serverError, setServerError] = useState(''); // To show errors from the backend

  // 2. Connect React Hook Form with Zod
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  // 3. What happens when the user clicks submit and passes the Zod checks?
  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setServerError('');
      // Send the data to the backend endpoint we built on Day 3
      await api.post('/api/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      // If successful, send them to the login page!
      navigate('/login');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setServerError(error.response?.data?.message || 'Registration failed');
      } else {
        setServerError('Registration failed');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      {/* Subtle background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

      <Card className="w-full max-w-md bg-slate-900 border-slate-800 shadow-[0_0_40px_-10px_rgba(79,70,229,0.15)] z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-white tracking-tight">Create an Account</CardTitle>
          <CardDescription className="text-center text-slate-400">
            Join TestTrack Pro today
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
                Name
              </label>
              <Input 
                {...register('name')} 
                type="text" 
                placeholder="John Doe"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500" 
              />
              {errors.name && <p className="text-[0.8rem] font-medium text-red-400">{errors.name.message}</p>}
            </div>

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
              <label className="text-sm font-medium leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Password
              </label>
              <Input 
                {...register('password')} 
                type="password" 
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500" 
              />
              {errors.password && <p className="text-[0.8rem] font-medium text-red-400">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-slate-300 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Confirm Password
              </label>
              <Input 
                {...register('confirmPassword')} 
                type="password" 
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500" 
              />
              {errors.confirmPassword && <p className="text-[0.8rem] font-medium text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-medium shadow-lg shadow-indigo-500/20 transition-all duration-200 mt-6"
            >
              {isSubmitting ? 'Registering...' : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-slate-800/50 pt-6">
          <p className="text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Log in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};