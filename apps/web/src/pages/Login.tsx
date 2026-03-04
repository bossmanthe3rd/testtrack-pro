import React, { useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../features/auth/api';
import { useAuthStore } from '../features/auth/authStore';

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
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">Welcome Back</h2>

        {serverError && <div className="mb-4 text-red-500 text-sm text-center">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              {...register('password')}
              type="password"
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none"
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};