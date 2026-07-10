export type Lang = "fr" | "en";

export const t = {
  en: {
    // Layout
    doctorPortal: "Doctor Portal",
    logout: "Logout",

    // Login
    signInSubtitle: "Sign in to manage your appointments",
    emailAddress: "Email Address",
    emailPlaceholder: "doctor@example.com",
    password: "Password",
    signingIn: "Signing in…",
    signIn: "Sign In",
    accessDenied: "Access denied. This portal is for doctors only.",
    invalidCredentials: "Invalid credentials",
    fillAllFields: "Please fill in all fields",
    welcome: "Welcome back, Dr.",

    // Appointments page
    myAppointments: "My Appointments",
    totalAppointments: (n: number) => `${n} appointment${n !== 1 ? "s" : ""}`,
    pendingAction: (n: number) => `· ${n} pending your action`,
    refresh: "Refresh",
    exportExcel: "Export Excel",
    deleteAll: "Delete All",

    // Status tabs
    all: "All",
    pending: "Pending",
    accepted: "Accepted",
    completed: "Completed",
    cancelled: "Cancelled",

    // Search
    searchPatient: "Search patient…",

    // Card
    accept: "Accept",
    refuse: "Refuse",
    reschedule: "Reschedule",
    delete: "Delete",

    // Empty / error states
    failedToLoad: "Failed to load appointments",
    tryAgain: "Try again",
    noAppointments: "No appointments found",
    viewAll: "View all appointments",

    // Pagination
    page: "Page",
    of: "of",

    // Reschedule dialog
    rescheduleTitle: "Reschedule Appointment",
    patient: "Patient",
    newDate: "New Date",
    newTime: "New Time",
    cancel: "Cancel",
    save: "Save",

    // Delete dialog
    deleteTitle: "Delete this appointment?",
    deleteDesc: (name: string, date: string) =>
      `Appointment with ${name} on ${date} will be permanently removed.`,
    deleteAllTitle: "Delete all appointments?",
    deleteAllDesc: (n: number) =>
      `This will permanently delete all ${n} appointment${n !== 1 ? "s" : ""} on this page. This cannot be undone.`,

    // Export dialog
    exportTitle: "Export Appointments",
    exportDesc: "Select a date range to export appointments. Leave empty to export all.",
    startDate: "Start Date",
    endDate: "End Date",
    exportBtn: "Export",

    // Toasts
    preparingExport: "Preparing export…",
    noExportData: "No appointments to export",
    exportFailed: "Export failed",
    exported: (n: number) => `Exported ${n} appointments`,
    rescheduled: "Appointment rescheduled",
    rescheduleFailed: "Reschedule failed",
    appointmentAccepted: "Appointment accepted",
    appointmentRefused: "Appointment refused",
    actionFailed: "Action failed",
    appointmentDeleted: "Appointment deleted",
    deleteFailed: "Delete failed",
    allDeleted: "All appointments deleted",
    deleteAllFailed: "Delete all failed",
  },

  fr: {
    // Layout
    doctorPortal: "Portail Médecin",
    logout: "Déconnexion",

    // Login
    signInSubtitle: "Connectez-vous pour gérer vos rendez-vous",
    emailAddress: "Adresse e-mail",
    emailPlaceholder: "medecin@exemple.com",
    password: "Mot de passe",
    signingIn: "Connexion…",
    signIn: "Se connecter",
    accessDenied: "Accès refusé. Ce portail est réservé aux médecins.",
    invalidCredentials: "Identifiants invalides",
    fillAllFields: "Veuillez remplir tous les champs",
    welcome: "Bienvenue, Dr.",

    // Appointments page
    myAppointments: "Mes Rendez-vous",
    totalAppointments: (n: number) => `${n} rendez-vous`,
    pendingAction: (n: number) => `· ${n} en attente d'action`,
    refresh: "Actualiser",
    exportExcel: "Exporter Excel",
    deleteAll: "Tout supprimer",

    // Status tabs
    all: "Tous",
    pending: "En attente",
    accepted: "Accepté",
    completed: "Terminé",
    cancelled: "Annulé",

    // Search
    searchPatient: "Rechercher un patient…",

    // Card
    accept: "Accepter",
    refuse: "Refuser",
    reschedule: "Reprogrammer",
    delete: "Supprimer",

    // Empty / error states
    failedToLoad: "Échec du chargement des rendez-vous",
    tryAgain: "Réessayer",
    noAppointments: "Aucun rendez-vous trouvé",
    viewAll: "Voir tous les rendez-vous",

    // Pagination
    page: "Page",
    of: "sur",

    // Reschedule dialog
    rescheduleTitle: "Reprogrammer le rendez-vous",
    patient: "Patient",
    newDate: "Nouvelle date",
    newTime: "Nouvel horaire",
    cancel: "Annuler",
    save: "Enregistrer",

    // Delete dialog
    deleteTitle: "Supprimer ce rendez-vous ?",
    deleteDesc: (name: string, date: string) =>
      `Le rendez-vous avec ${name} le ${date} sera définitivement supprimé.`,
    deleteAllTitle: "Supprimer tous les rendez-vous ?",
    deleteAllDesc: (n: number) =>
      `Cela supprimera définitivement les ${n} rendez-vous de cette page. Cette action est irréversible.`,

    // Export dialog
    exportTitle: "Exporter les rendez-vous",
    exportDesc: "Sélectionnez une période pour l'export. Laissez vide pour tout exporter.",
    startDate: "Date de début",
    endDate: "Date de fin",
    exportBtn: "Exporter",

    // Toasts
    preparingExport: "Préparation de l'export…",
    noExportData: "Aucun rendez-vous à exporter",
    exportFailed: "Échec de l'export",
    exported: (n: number) => `${n} rendez-vous exportés`,
    rescheduled: "Rendez-vous reprogrammé",
    rescheduleFailed: "Échec de la reprogrammation",
    appointmentAccepted: "Rendez-vous accepté",
    appointmentRefused: "Rendez-vous refusé",
    actionFailed: "Échec de l'action",
    appointmentDeleted: "Rendez-vous supprimé",
    deleteFailed: "Échec de la suppression",
    allDeleted: "Tous les rendez-vous supprimés",
    deleteAllFailed: "Échec de la suppression totale",
  },
} as const;

export function getLang(): Lang {
  if (typeof window === "undefined") return "fr";
  return (localStorage.getItem("doctor_lang") as Lang) || "fr";
}

export function setLang(lang: Lang) {
  localStorage.setItem("doctor_lang", lang);
}
