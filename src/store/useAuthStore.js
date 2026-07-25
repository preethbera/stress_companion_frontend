import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/axios";
import { API_ENDPOINTS } from "../config/api";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post(API_ENDPOINTS.AUTH_LOGIN, { email, password });
          const token = response.data.access_token;
          
          set({ token });
          
          const userResponse = await api.get(API_ENDPOINTS.AUTH_ME);
          const user = userResponse.data;
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          let errorMessage = "Invalid email or password";
          if (error.response?.data?.detail) {
            if (Array.isArray(error.response.data.detail)) {
              errorMessage = error.response.data.detail.map(e => e.msg).join(", ");
            } else {
              errorMessage = error.response.data.detail;
            }
          }
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post(API_ENDPOINTS.AUTH_REGISTER, userData);
          const token = response.data.access_token;
          
          set({ token });

          const userResponse = await api.get(API_ENDPOINTS.AUTH_ME);
          const user = userResponse.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Format FastAPI validation errors (array) into a string to prevent React crashes
          let errorMessage = "Registration failed";
          if (error.response?.data?.detail) {
            if (Array.isArray(error.response.data.detail)) {
              errorMessage = error.response.data.detail.map(e => e.msg).join(", ");
            } else {
              errorMessage = error.response.data.detail;
            }
          }
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put(API_ENDPOINTS.AUTH_ME, profileData);
          const updatedUser = response.data;
          
          set({
            user: updatedUser,
            isLoading: false,
          });
          return updatedUser;
        } catch (error) {
          let errorMessage = "Profile update failed";
          if (error.response?.data?.detail) {
            if (Array.isArray(error.response.data.detail)) {
              errorMessage = error.response.data.detail.map(e => e.msg).join(", ");
            } else {
              errorMessage = error.response.data.detail;
            }
          }
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      uploadProfileImage: async (file) => {
        set({ isLoading: true, error: null });
        try {
          const formData = new FormData();
          formData.append("file", file);
          const response = await api.post(API_ENDPOINTS.AUTH_PROFILE_IMAGE, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          const updatedUser = response.data;
          
          set({
            user: updatedUser,
            isLoading: false,
          });
          return updatedUser;
        } catch (error) {
          let errorMessage = "Avatar upload failed";
          if (error.response?.data?.detail) {
            if (Array.isArray(error.response.data.detail)) {
              errorMessage = error.response.data.detail.map(e => e.msg).join(", ");
            } else {
              errorMessage = error.response.data.detail;
            }
          }
          set({
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      loginAsDemo: () => {
        set({
          user: {
            person_id: "demo-user-123",
            name: "Demo User",
            email: "demo@example.com",
            age: 25,
            gender: "non-binary",
          },
          token: "demo-token-123",
          isAuthenticated: true,
          error: null,
          isLoading: false
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "stress_companion_auth", // unique name to store in localStorage
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }), // things to persist
    }
  )
);
