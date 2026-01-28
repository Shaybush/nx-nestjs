import type { ApiResponse } from '@nx-shay/shared';

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}



export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    throw new Error('Failed to refresh token');
  }

  const data: ApiResponse<{ accessToken: string }> = await response.json();
  const newAccessToken = data.data.accessToken;
  localStorage.setItem(TOKEN_KEY, newAccessToken);
  return newAccessToken;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(url, { ...options, headers });

  // Handle 401 - try to refresh token
  if (response.status === 401 && getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onRefreshed(newToken);
        
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      } catch (error) {
        isRefreshing = false;
        clearTokens();
        window.location.href = '/login';
        throw error;
      }
    } else {
      // Wait for refresh to complete
      const newToken = await new Promise<string>((resolve) => {
        refreshSubscribers.push(resolve);
      });
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  return response;
}

export async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetchWithAuth(url);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function apiPost<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}
