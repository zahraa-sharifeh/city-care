import axios from "axios";

// IMPORTANT:
// - Android emulator can use: http://10.0.2.2:5000/api
// - Real phone must use your PC IP: http://192.168.x.x:5000/api
export const API_BASE = "http://10.0.2.2:5000/api";


const api = axios.create({
  baseURL: "http://10.0.2.2:5000/api",
});

export default api;
