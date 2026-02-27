import axios from 'axios';
// We will import our Zustand store here in the next batch to grab our tokens!
// import { useAuthStore } from './authStore'; 

// 1. Create the custom Axios instance
export const api = axios.create({
  // This is the URL of your backend. Now you don't have to type it every time!
  baseURL: 'http://localhost:5000', 
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 2. Request Interceptor: The "Security Guard on the way OUT"
api.interceptors.request.use(
  (config) => {
    // Grab the access token from local storage (or our store, once we build it)
    const token = localStorage.getItem('accessToken'); 
    
    // If we have a token, attach it to the Authorization header like a visitor badge
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Let the request continue on its way to the backend
    return config;
  },
  (error) => {
    // If something goes wrong before the request even leaves, just reject it
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: The "Security Guard on the way IN"
api.interceptors.response.use(
  (response) => {
    // If the backend says "200 OK", just pass the response through to the app
    return response;
  },
  async (error) => {
    // Save the original request that just failed
    const originalRequest = error.config;

    // Check if the error is 401 (Unauthorized - meaning our token expired)
    // AND check that we haven't already tried to retry this exact request
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Mark this request so we don't get stuck in an infinite loop of retrying
      originalRequest._retry = true; 

      try {
        // 1. Get the refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        
        // 2. Ask the backend for a brand new access token
        // Notice we use regular 'axios' here, NOT our custom 'api', to avoid interceptor loops
        const response = await axios.post('http://localhost:5000/auth/refresh', { 
            token: refreshToken 
        });

        // 3. Save the new access token
        const newAccessToken = response.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        // 4. Update the failed request with the NEW badge (token)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // 5. Try the original request one more time!
        return api(originalRequest);

      } catch (refreshError) {
        // If the refresh token is ALSO expired, the user needs to log in again.
        console.error('Session expired. Please log in again.');
        
        // We will clear the tokens and redirect to login in the next batch
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        
        return Promise.reject(refreshError);
      }
    }
    
    // If it's any other error (like 404 Not Found or 500 Server Error), just reject it
    return Promise.reject(error);
  }
);