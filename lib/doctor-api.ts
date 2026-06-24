import axios from "axios";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000/api/v1";

const doctorClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

doctorClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("doctor_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

doctorClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("doctor_token");
      localStorage.removeItem("doctor_user");
      window.location.href = "/doctor/login";
    }
    return Promise.reject(error);
  }
);

export const doctorAuthAPI = {
  login: (email: string, password: string) =>
    axios.post(`${BASE_URL}/auth/login`, { email, password }),
};

export const doctorAppointmentsAPI = {
  getAppointments: (page = 1, limit = 10, status = "") => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== "all") params.append("status", status);
    return doctorClient.get(`/appointment?${params}`);
  },
  // Fetch every appointment for export (no pagination cap)
  getAllForExport: () =>
    doctorClient.get(`/appointment?page=1&limit=5000`),
  updateStatus: (id: string, status: "accepted" | "cancelled" | "completed") =>
    doctorClient.patch(`/appointment/${id}/status`, { status }),
};
