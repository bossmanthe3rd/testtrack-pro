import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../features/auth/api';
import axios from 'axios';

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
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">Create an Account</h2>
        
        {/* If the backend complains (like email already exists), show it here */}
        {serverError && <div className="mb-4 text-red-500 text-sm text-center">{serverError}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input 
              {...register('name')} 
              type="text" 
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none" 
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              {...register('email')} 
              type="email" 
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none" 
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input 
              {...register('password')} 
              type="password" 
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none" 
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input 
              {...register('confirmPassword')} 
              type="password" 
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:outline-none" 
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting} // Disable button while loading to prevent double clicks
            className="w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};