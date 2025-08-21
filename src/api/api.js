import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "https://cc2188215d15.ngrok-free.app";

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
