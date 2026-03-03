import { create } from 'zustand';
import { api } from './api'; // Import the custom Axios instance we just made!

// 1. Define the "Blueprint" for our User
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'TESTER' | 'DEVELOPER' | 'ADMIN'; // Based on the project requirements
}

// 2. Define the "Blueprint" for our Global Brain (The Store)
interface AuthState {
  user: User | null;              // Holds user data, or null if not logged in
  accessToken: string | null;     // Holds the 15-minute badge
  isAuthenticated: boolean;       // A simple true/false flag for easy checking
  isLoading: boolean;             // To show loading spinners while talking to the backend

  // These are the "Actions" our brain can perform
  setTokens: (accessToken: string, refreshToken: string) => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

// 3. Create the actual Global Brain using Zustand
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial State (When the app first loads, nobody is logged in)
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: false,
  isLoading: localStorage.getItem('accessToken') !== null, // Start as true so we can check if they are already logged in

  // Action: Save tokens when a user logs in
  setTokens: (accessToken: string, refreshToken: string) => {
    // Save to the browser's memory so they survive page refreshes
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    // Update the global brain
    set({ accessToken: accessToken, isAuthenticated: true });
  },

  // Action: Fetch the logged-in user's profile data
  fetchMe: async () => {
    try {
      set({ isLoading: true });
      // Call our backend protected route to get the user data
      const response = await api.get('/api/auth/me');

      // If successful, update the brain with the user's data
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false
      });
    } catch (error) {
      // If it fails (e.g., token is invalid), wipe everything clean
      console.error("Failed to fetch user profile", error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  // Action: Log the user out completely
  logout: async () => {
    try {
      // Tell the backend to invalidate the session
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      // Regardless of what the backend says, wipe the frontend clean
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false
      });
    }
  }
}));