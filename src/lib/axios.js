import axios from "axios";

// Using localStorage inherently prevents the circular dependency with the `useAuthStore` that breaks axios initializations
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    console.log("Axios Interceptor: Sending request to", config.url);
    try {
      const authStorage = localStorage.getItem("stress_companion_auth");
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {
      console.error("Axios Interceptor Error extracting token:", e);
    }
    return config;
  },
  (error) => {
    console.error("Axios Request Error:", error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Axios Response Error intercept:", error);
    // Extract token from request config to see if it's the demo token
    const isDemoToken = error.config?.headers?.Authorization?.includes("demo-token-123");

    if (error.response && error.response.status === 401 && !isDemoToken) {
      localStorage.removeItem("stress_companion_auth");
      if (window.location.pathname !== "/login") {
         window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
