import axios from "axios";

// Switch backend by changing VITE_API_URL in .env
// Node.js  → VITE_API_URL=http://localhost:5000/api
// FastAPI  → VITE_API_URL=http://localhost:8001/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8001/api",
  headers: { "Content-Type": "application/json" },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
