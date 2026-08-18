import axios from "axios";

/**
 * API layer for the CLINIC self-service portal (/clinic-portal).
 *
 * Deliberately separate from `lib/api-client.ts`: that one reads the NextAuth
 * admin session for every request, so a clinic logged in through NextAuth would
 * make the admin-only grouped APIs fire with clinic credentials. The clinic
 * portal therefore keeps its own Bearer token in localStorage under
 * `clinic_token`, exactly like the doctor portal does with `doctor_token`.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4000/api/v1";

const clinicClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

clinicClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("clinic_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

clinicClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("clinic_token");
      localStorage.removeItem("clinic_user");
      window.location.href = "/clinic-portal/login";
    }
    return Promise.reject(error);
  }
);

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

export type ScheduleSlot = { start: string; end: string };
export type DaySchedule = {
  day: string;
  isActive: boolean;
  slots: ScheduleSlot[];
};

export const clinicAuthAPI = {
  // Uses a bare axios call: at login time there is no token to inject yet, and
  // a 401 here must surface as a form error rather than trigger the redirect
  // interceptor.
  login: (email: string, password: string) =>
    axios.post(`${BASE_URL}/auth/login`, { email, password }),

  // Public multipart registration — no auth header.
  register: (data: FormData) =>
    axios.post(`${BASE_URL}/clinic/register`, data, multipart),
};

export const clinicProfileAPI = {
  getProfile: () => clinicClient.get("/clinic/me"),

  updateProfile: (data: FormData) =>
    clinicClient.patch("/clinic/me", data, multipart),

  updateWorkingHours: (weeklySchedule: DaySchedule[]) =>
    clinicClient.put("/clinic/me/working-hours", { weeklySchedule }),

  updateServices: (services: any[]) =>
    clinicClient.put("/clinic/me/services", { services }),
};

export const clinicDashboardAPI = {
  getDashboard: () => clinicClient.get("/clinic/me/dashboard"),
};

export const clinicDoctorsAPI = {
  getDoctors: (page = 1, limit = 10, status = "", search = "") => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status && status !== "all") params.append("status", status);
    if (search) params.append("search", search);
    return clinicClient.get(`/clinic/me/doctors?${params.toString()}`);
  },

  // Multipart because of the optional `photo` field. Returns
  // data.credentials = { doctorId, username, temporaryPassword } exactly once.
  createDoctor: (data: FormData) =>
    clinicClient.post("/clinic/me/doctors", data, multipart),

  inviteDoctor: (payload: { doctorId?: string; email?: string }) =>
    clinicClient.post("/clinic/me/doctors/invite", payload),

  getDoctor: (membershipId: string) =>
    clinicClient.get(`/clinic/me/doctors/${membershipId}`),

  updateDoctor: (membershipId: string, data: any) =>
    clinicClient.patch(`/clinic/me/doctors/${membershipId}`, data),

  updateSchedule: (membershipId: string, weeklySchedule: DaySchedule[]) =>
    clinicClient.put(`/clinic/me/doctors/${membershipId}/schedule`, {
      weeklySchedule,
    }),

  setStatus: (membershipId: string, status: "active" | "disabled") =>
    clinicClient.patch(`/clinic/me/doctors/${membershipId}/status`, { status }),

  // Removes the doctor from THIS clinic only — the account itself survives.
  removeDoctor: (membershipId: string) =>
    clinicClient.delete(`/clinic/me/doctors/${membershipId}`),

  resetAccess: (membershipId: string) =>
    clinicClient.post(`/clinic/me/doctors/${membershipId}/reset-access`),
};

export const clinicAppointmentsAPI = {
  getAppointments: (
    page = 1,
    limit = 10,
    date = "",
    status = "",
    doctorId = ""
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (date) params.append("date", date);
    if (status && status !== "all") params.append("status", status);
    if (doctorId && doctorId !== "all") params.append("doctorId", doctorId);
    return clinicClient.get(`/clinic/me/appointments?${params.toString()}`);
  },

  // A clinic may only confirm or cancel; the backend returns 403 for
  // "completed", so that action is never offered in the UI.
  updateStatus: (id: string, status: "accepted" | "cancelled") =>
    clinicClient.patch(`/appointment/${id}/status`, { status }),
};

export const clinicAuditAPI = {
  getAuditLog: (page = 1, limit = 20) =>
    clinicClient.get(`/clinic/me/audit?page=${page}&limit=${limit}`),
};

export default clinicClient;
