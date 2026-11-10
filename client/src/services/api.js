import axios from "axios";

const API = axios.create({
  baseURL: "https://wearloop-backend-f1r8.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;