import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "https://danial-abolishable-uncomputably.ngrok-free.dev";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// Tambahkan interceptor agar token otomatis disisipkan
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;