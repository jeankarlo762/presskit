import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/auth.store";
import { API_URL } from "../config";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
});

/** Pulls the API's `message` out of an axios error so forms can show the
 * server's own explanation ("esse link é do YouTube...") instead of a
 * generic one. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; issues?: { fieldErrors?: Record<string, string[]> } } | undefined;
    const fieldError = data?.issues?.fieldErrors ? Object.values(data.issues.fieldErrors).flat()[0] : undefined;
    return fieldError ?? data?.message ?? fallback;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Concurrent 401s during a refresh must not each fire their own /auth/refresh
// call (that would race the rotating refresh token and log the user out) —
// the first request to hit a 401 drives the refresh, the rest queue on it.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, user } = useAuthStore.getState();
  if (!refreshToken || !user) throw new Error("Sem sessão para renovar");

  const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
  useAuthStore.getState().setSession(data);
  return data.accessToken as string;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (error.response?.status !== 401 || !original || original._retried) {
      if (error.response?.status === 401) {
        useAuthStore.getState().clearSession();
      }
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newAccessToken = await refreshPromise;
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (refreshError) {
      useAuthStore.getState().clearSession();
      return Promise.reject(refreshError);
    }
  },
);
