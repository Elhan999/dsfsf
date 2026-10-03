import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError, ApiSuccess, AuthSession } from '@/types/api';
import { tokenStore } from './tokenStore';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send the HTTP-only refresh cookie
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;
type SessionListener = (session: AuthSession | null) => void;
let onSessionChange: SessionListener = () => {};

/** Lets the auth provider learn about sessions refreshed by the interceptor. */
export function setSessionListener(listener: SessionListener) {
  onSessionChange = listener;
}

/** Single-flight refresh: concurrent 401s share one /auth/refresh call. */
export function refreshAccessToken(): Promise<string | null> {
  refreshPromise ??= axios
    .post<ApiSuccess<AuthSession>>(`${API_URL}/auth/refresh`, null, { withCredentials: true })
    .then((res) => {
      tokenStore.set(res.data.data.accessToken);
      onSessionChange(res.data.data);
      return res.data.data.accessToken;
    })
    .catch((error) => {
      const rejected = axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403);
      // A network blip shouldn't end a live session; only an explicit rejection (or no session at all) does.
      if (rejected || !tokenStore.get()) {
        tokenStore.set(null);
        onSessionChange(null);
      }
      return rejected ? null : tokenStore.get();
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall && tokenStore.get()) {
      original._retried = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Human-readable message from any API/network error. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your connection.';
  }
  return fallback;
}

/** Unwraps `{ success, data }`. */
export const unwrap = <T>(promise: Promise<{ data: ApiSuccess<T> }>) => promise.then((res) => res.data.data);
