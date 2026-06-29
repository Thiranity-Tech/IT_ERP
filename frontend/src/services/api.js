import axios from "axios";

const normalizeBaseUrl = (value) => {
  if (!value) {
    return "";
  }

  return value.trim().replace(/\/+$/, "");
};

const getBaseUrl = () => {
  const launchBaseUrl = normalizeBaseUrl(
    new URLSearchParams(window.location.search).get("apiBaseUrl")
  );
  if (launchBaseUrl) {
    localStorage.setItem("apiBaseUrl", launchBaseUrl);
    return launchBaseUrl;
  }

  const injectedBaseUrl = window.__IT_ERP_CONFIG__?.apiBaseUrl;
  if (injectedBaseUrl) {
    const normalizedInjectedBaseUrl = normalizeBaseUrl(injectedBaseUrl);
    localStorage.setItem("apiBaseUrl", normalizedInjectedBaseUrl);
    return normalizedInjectedBaseUrl;
  }

  const savedBaseUrl = localStorage.getItem("apiBaseUrl");
  if (savedBaseUrl) {
    return normalizeBaseUrl(savedBaseUrl);
  }

  return (
    normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL) ||
    "http://127.0.0.1:3000"
  );
};

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
