import axios, { AxiosInstance } from "axios";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001/api";

// Create axios instance
let axiosInstance: AxiosInstance;

export const getAxiosInstance = (): AxiosInstance => {
  if (!axiosInstance) {
    axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem("refreshToken");
            if (refreshToken) {
              const response = await axios.post(
                `${baseURL}/auth/reset-refresh-token`,
                { refreshToken }
              );
              const { accessToken } = response.data.data;
              localStorage.setItem("accessToken", accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return axiosInstance(originalRequest);
            }
          } catch (err) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            return Promise.reject(err);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  return axiosInstance;
};

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    getAxiosInstance().post("/auth/login", { email, password }),

  forgotPassword: (email: string) =>
    getAxiosInstance().post("/auth/forget", { email }),

  verifyOTP: (email: string, otp: string) =>
    getAxiosInstance().post("/auth/verify-otp", { email, otp }),

  resetPassword: (email: string, otp: string, password: string) =>
    getAxiosInstance().post("/auth/reset-password", { email, otp, password }),

  changePassword: (oldPassword: string, newPassword: string) =>
    getAxiosInstance().post("/auth/change-password", { oldPassword, newPassword }),
};

// Dashboard APIs
export const dashboardAPI = {
  getOverview: () =>
    getAxiosInstance().get("/user/dashboard/overview"),
};

// Doctors APIs
export const doctorsAPI = {
  getDoctors: (page = 1, limit = 10, search = "", status = "") => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    // Admin must see clinic-created doctors too. Without this the backend hides
    // them (isIndependentlyListed !== false) and they are invisible here.
    params.append("includeClinicOnly", "true");
    return getAxiosInstance().get(`/user/role/doctor?${params.toString()}`);
  },

  getDoctorById: (id: string) =>
    getAxiosInstance().get(`/user/${id}`),

  approveDoctorRegistration: (id: string, approvalStatus: string) =>
    getAxiosInstance().patch(`/user/doctor/${id}/approval`, { approvalStatus }),

  updateDoctor: (id: string, data: any) =>
    getAxiosInstance().patch(`/user/doctor/${id}`, data),

  deleteDoctor: (id: string) =>
    getAxiosInstance().delete(`/user/doctor/${id}`),
};

// Patients APIs
export const patientsAPI = {
  getPatients: (page = 1, limit = 10, search = "", status = "") => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    return getAxiosInstance().get(`/user/role/patient?${params.toString()}`);
  },

  getPatientById: (id: string) =>
    getAxiosInstance().get(`/user/${id}`),

  updatePatient: (id: string, data: any) =>
    getAxiosInstance().patch(`/user/patient/${id}`, data),

  deletePatient: (id: string) =>
    getAxiosInstance().delete(`/user/patient/${id}`),
};

// Appointments APIs
export const appointmentsAPI = {
  getAppointments: (page = 1, limit = 10, search = "", status = "") => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    return getAxiosInstance().get(`/appointment?${params.toString()}`);
  },

  getAppointmentById: (id: string) =>
    getAxiosInstance().get(`/appointment/${id}`),

  updateAppointment: (id: string, data: any) =>
    getAxiosInstance().patch(`/appointment/${id}`, data),

  cancelAppointment: (id: string) =>
    getAxiosInstance().patch(`/appointment/${id}/cancel`, {}),
};

// Categories APIs
export const categoriesAPI = {
  getCategories: (page = 1, limit = 10, search = "") => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    return getAxiosInstance().get(`/category?${params.toString()}`);
  },

  getCategoryById: (id: string) =>
    getAxiosInstance().get(`/category/${id}`),

  createCategory: (data: any) =>
    getAxiosInstance().post("/category", data),

  updateCategory: (id: string, data: any) =>
    getAxiosInstance().patch(`/category/${id}`, data),

  deleteCategory: (id: string) =>
    getAxiosInstance().delete(`/category/${id}`),
};

// Earnings APIs
export const earningsAPI = {
  getDoctorEarnings: (page = 1, limit = 10) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    return getAxiosInstance().get(`/earnings/doctors?${params.toString()}`);
  },

  getEarningsOverview: () =>
    getAxiosInstance().get("/earnings/overview"),
};
