// apps/web/src/features/auth/useAuth.ts
import { useAuthStore } from './authStore';

// A convenient hook that exposes the auth store's state and actions.
// Components can call `useAuth()` instead of `useAuthStore()` directly.
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setTokens = useAuthStore((state) => state.setTokens);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const logout = useAuthStore((state) => state.logout);

  return { user, isAuthenticated, isLoading, setTokens, fetchMe, logout };
}
