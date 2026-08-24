import axios, { AxiosInstance } from "axios";
import { getSession } from "next-auth/react";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001/api";

let axiosInstance: AxiosInstance;

export const getApiClient = async (): Promise<AxiosInstance> => {
  if (!axiosInstance) {
    axiosInstance = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    axiosInstance.interceptors.request.use(
      async (config) => {
        const session = await getSession();


        console.log("SSSSSSSSSSSSS", session)
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
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
        if (error.response?.status === 401) {
          // Handle token refresh or redirect to login
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    );
  }

  return axiosInstance;
};

// Auth APIs
export const authAPI = {
  login: async (email: string, password: string) => {
    const client = await getApiClient();
    return client.post("/auth/login", { email, password });
  },

  forgotPassword: async (email: string) => {
    const client = await getApiClient();
    return client.post("/auth/forget", { email });
  },

  sendOTP: async (email: string) => {
    const client = await getApiClient();
    return client.post("/auth/send-otp", { email });
  },

  verifyOTP: async (email: string, otp: string) => {
    const client = await getApiClient();
    return client.post("/auth/verify-otp", { email, otp });
  },

  resetPassword: async (email: string, otp: string, password: string) => {
    const client = await getApiClient();
    return client.post("/auth/reset-password", { email, otp, password });
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    const client = await getApiClient();
    return client.post("/auth/change-password", { oldPassword, newPassword });
  },
};

// Notifications APIs
export const notificationsAPI = {
  getNotifications: async (page = 1, limit = 20, isRead?: boolean) => {
    const client = await getApiClient();
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (isRead !== undefined) params.append("isRead", isRead.toString());
    return client.get(`/notification?${params.toString()}`);
  },

  markAsRead: async (notificationId: string) => {
    const client = await getApiClient();
    return client.patch(`/notification/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    const client = await getApiClient();
    return client.patch("/notification/read-all");
  },
};

// Dashboard APIs
export const dashboardAPI = {
  getOverview: async () => {
    const client = await getApiClient();
    return client.get("/user/dashboard/overview");
  },
};

// Doctors APIs
export const doctorsAPI = {
  getDoctors: async (
    page = 1,
    limit = 10,
    search = "",
    status = "",
    cabinetStatus = "",
  ) => {
    const client = await getApiClient();
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    // Admin must see clinic-created doctors too (see lib/api.ts).
    params.append("includeClinicOnly", "true");
    if (cabinetStatus && cabinetStatus !== "all")
      params.append("cabinetStatus", cabinetStatus);
    return client.get(`/user/role/doctor?${params.toString()}`);
  },

  // Cabinet approval is a separate decision from account approval: the doctor
  // is already approved, this grants them their own practice location.
  approveCabinet: async (id: string, approvalStatus: string) => {
    const client = await getApiClient();
    return client.patch(`/user/doctor/${id}/cabinet-approval`, {
      approvalStatus,
    });
  },

  getDoctorById: async (id: string) => {
    const client = await getApiClient();
    return client.get(`/user/${id}`);
  },

  approveDoctorRegistration: async (id: string, approvalStatus: string) => {
    const client = await getApiClient();
    return client.patch(`/user/doctor/${id}/approval`, { approvalStatus });
  },

  updateDoctor: async (id: string, data: any) => {
    const client = await getApiClient();
    return client.patch(`/user/doctor/${id}`, data);
  },

  deleteDoctor: async (id: string) => {
    const client = await getApiClient();
    // Backend exposes a single admin delete route: DELETE /user/:id
    return client.delete(`/user/${id}`);
  },
};

// Clinics APIs (admin verification section)
export const clinicsAdminAPI = {
  getClinics: async (
    page = 1,
    limit = 10,
    search = "",
    status = "",
    wilaya = "",
  ) => {
    const client = await getApiClient();
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (status && status !== "all") params.append("status", status);
    if (wilaya && wilaya !== "all") params.append("wilaya", wilaya);
    return client.get(`/clinic/admin/list?${params.toString()}`);
  },

  getClinicById: async (id: string) => {
    const client = await getApiClient();
    return client.get(`/clinic/admin/${id}`);
  },

  // "approved" is the stored value for what the UI calls "Verified".
  // rejectionReason is REQUIRED by the backend when rejecting (400 otherwise).
  updateVerification: async (
    id: string,
    approvalStatus: "pending" | "approved" | "rejected" | "suspended",
    rejectionReason?: string,
  ) => {
    const client = await getApiClient();
    return client.patch(`/clinic/admin/${id}/verification`, {
      approvalStatus,
      ...(rejectionReason ? { rejectionReason } : {}),
    });
  },

  // Approves a doctor's private practice (cabinet) so they show up in the
  // public doctor list. Lives here because it is an admin-only verification.
  updateDoctorCabinetApproval: async (
    id: string,
    approvalStatus: "approved" | "rejected" | "pending",
  ) => {
    const client = await getApiClient();
    return client.patch(`/user/doctor/${id}/cabinet-approval`, {
      approvalStatus,
    });
  },
};

// Patients APIs
export const patientsAPI = {
  getPatients: async (page = 1, limit = 10, search = "", status = "") => {
    const client = await getApiClient();
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    return client.get(`/user/role/patient?${params.toString()}`);
  },

  getPatientById: async (id: string) => {
    const client = await getApiClient();
    return client.get(`/user/${id}`);
  },

  updatePatient: async (id: string, data: any) => {
    const client = await getApiClient();
    return client.patch(`/user/patient/${id}`, data);
  },

  deletePatient: async (id: string) => {
    const client = await getApiClient();
    // Backend exposes a single admin delete route: DELETE /user/:id
    return client.delete(`/user/${id}`);
  },
};

// Appointments APIs
export const appointmentsAPI = {
  getAppointments: async (page = 1, limit = 10, search = "", status = "") => {
    const client = await getApiClient();
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (status) params.append("status", status);
    return client.get(`/appointment?${params.toString()}`);
  },

  getAppointmentById: async (id: string) => {
    const client = await getApiClient();
    return client.get(`/appointment/${id}`);
  },

  updateAppointment: async (id: string, data: any) => {
    const client = await getApiClient();
    return client.patch(`/appointment/${id}`, data);
  },

  cancelAppointment: async (id: string) => {
    const client = await getApiClient();
    // Cancellation goes through the status endpoint; there is no /cancel route.
    return client.patch(`/appointment/${id}/status`, { status: "cancelled" });
  },
};

// Categories APIs
export const categoriesAPI = {
  getCategories: async (page = 1, limit = 10, search = "") => {
    const client = await getApiClient();
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    return client.get(`/category/admin/all?${params.toString()}`);
  },

  getCategoryById: async (id: string) => {
    const client = await getApiClient();
    return client.get(`/category/${id}`);
  },

  createCategory: async (data: FormData) => {
    const client = await getApiClient();
    return client.post("/category", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateCategory: async (id: string, data: FormData | any) => {
    const client = await getApiClient();
    // If data is FormData, set correct headers
    const config = data instanceof FormData 
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : {};
    return client.patch(`/category/${id}`, data, config);
  },

  deleteCategory: async (id: string) => {
    const client = await getApiClient();
    return client.delete(`/category/${id}`);
  },
};

// Earnings APIs
export const earningsAPI = {
  getEarningsOverview: async (view = "monthly") => {
    const client = await getApiClient();
    return client.get(`/appointment/earnings/overview?view=${view}`);
  },

  // A single doctor's earnings, optionally within a custom date range (admin).
  getDoctorEarnings: async (doctorId: string, startDate = "", endDate = "") => {
    const client = await getApiClient();
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const qs = params.toString();
    return client.get(
      `/appointment/earnings/doctor/${doctorId}${qs ? `?${qs}` : ""}`,
    );
  },
};

// Referral Codes APIs
export const referralAPI = {
  getReferralCodes: async (status = "") => {
    const client = await getApiClient();
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    const query = params.toString();
    return client.get(query ? `/referral/get-referral-codes?${query}` : "/referral/get-referral-codes");
  },

  createReferralCode: async (data: any) => {
    const client = await getApiClient();
    return client.post("/referral/create-referral-code", data);
  },

  updateReferralCode: async (id: string, data: any) => {
    const client = await getApiClient();
    return client.patch(`/referral/update-referral-code/${id}`, data);
  },

  updateReferralStatus: async (id: string, isActive: boolean) => {
    const client = await getApiClient();
    // Note: Backend updateReferralCode only handles code and description currently.
    // Sending it anyway in case the backend is updated later or handles it via save().
    return client.patch(`/referral/update-referral-code/${id}`, { isActive });
  },

  deleteReferralCode: async (id: string) => {
    const client = await getApiClient();
    return client.delete(`/referral/delete-referral-code/${id}`);
  },
};

// App Settings APIs
export const appSettingsAPI = {
  toggleReferralSystem: async () => {
    const client = await getApiClient();
    return client.patch("/app-setting/toggle-referral-system");
  },

  getAppSetting: async () => {
    const client = await getApiClient();
    return client.get("/app-setting/get-referral-setting");
  },

  // 🔄 Force update configuration
  getAppConfig: async () => {
    const client = await getApiClient();
    return client.get("/app-config");
  },

  updateAppConfig: async (payload: {
    minAppVersion?: number;
    forceUpdateEnabled?: boolean;
    androidStoreUrl?: string;
    iosStoreUrl?: string;
    forceUpdateMessage?: string;
  }) => {
    const client = await getApiClient();
    return client.patch("/app-config", payload);
  },

  // 🎬 "How it works" tutorial video links
  getYoutubeLinks: async () => {
    const client = await getApiClient();
    return client.get("/youtube-links");
  },

  updateYoutubeLinks: async (payload: {
    patientVideo?: string;
    doctorVideo?: string;
  }) => {
    const client = await getApiClient();
    return client.patch("/youtube-links", payload);
  },
};
