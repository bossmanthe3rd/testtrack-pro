import axios from 'axios';

// 1. Create the custom Axios instance
export const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// 2. Request Interceptor: The "Security Guard on the way OUT"
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); 
    
    if (token) {
      // FIX 2: Direct assignment is safer across Axios versions
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  // ...
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: The "Security Guard on the way IN"
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 (Unauthorized) and not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // FIX: Use the 'api' instance or attach withCredentials so the cookie is sent!
        // Also, the backend returns the token inside a 'data' object.
        const response = await axios.post('http://localhost:5000/api/auth/refresh', {}, {
          withCredentials: true
        });

        // Save the new access token (it is nested inside response.data.data)
        const newAccessToken = response.data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        // Update the failed request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Try the original request again
        return api(originalRequest);

      } catch (refreshError) {
        console.error('Session expired. Please log in again.');

        // Clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Send them back to the login page so they aren't stuck on a blank screen
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;