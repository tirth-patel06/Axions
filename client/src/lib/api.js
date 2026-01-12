import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ensure cookies (JWT) are sent/received
  timeout: 30000, // 30 second timeout
});

export { api, API_BASE_URL };
