import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getWebSocketUrl() {
  const base = API_URL.replace(/\/$/, "");
  if (base) {
    const wsBase = base.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
    return `${wsBase}/ws`;
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

let authToken = null;

export function getAuthToken() {
  if (authToken) {
    return authToken;
  }
  const stored = localStorage.getItem("authToken");
  if (stored?.trim()) {
    authToken = stored.trim();
    return authToken;
  }
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.token?.trim()) {
      authToken = user.token.trim();
      localStorage.setItem("authToken", authToken);
      return authToken;
    }
  } catch {
    // ignore invalid user json
  }
  return null;
}

export function setAuthToken(token) {
  authToken = token?.trim() || null;
  if (authToken) {
    localStorage.setItem("authToken", authToken);
    api.defaults.headers.common.Authorization = `Bearer ${authToken}`;
  } else {
    localStorage.removeItem("authToken");
    delete api.defaults.headers.common.Authorization;
  }
}

export function clearAuth() {
  authToken = null;
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  delete api.defaults.headers.common.Authorization;
}

export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const savedToken = localStorage.getItem("authToken");
if (savedToken?.trim()) {
  setAuthToken(savedToken);
}

function attachAuthHeader(config) {
  const url = config.url || "";
  const isAuthRoute = url.includes("/auth/");
  const token = getAuthToken();

  if (!isAuthRoute && token) {
    if (typeof config.headers.set === "function") {
      config.headers.set("Authorization", `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
}

api.interceptors.request.use(attachAuthHeader);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
