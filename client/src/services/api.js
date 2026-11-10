
import axios from "axios";

const API = axios.create({
  baseURL: "https://wearloop-backend-f1r8.onrender.com/api",
});

// Automatically attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
