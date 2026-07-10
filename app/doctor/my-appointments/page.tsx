"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { doctorAppointmentsAPI } from "@/lib/doctor-api";
import { t, getLang, type Lang } from "@/lib/doctor-i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Search,
  Video,
  Building2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  CalendarDays,
  Download,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

const ITEMS_PER_PAGE = 12;

function statusBadge(status: string, tr: (typeof t)["fr"] | (typeof t)["en"]) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: "bg-amber-100 text-amber-700 border-amber-200", label: tr.pending },
    accepted: { cls: "bg-green-100 text-green-700 border-green-200", label: tr.accepted },
    completed: { cls: "bg-blue-100 text-blue-700 border-blue-200", label: tr.completed },
    cancelled: { cls: "bg-red-100 text-red-700 border-red-200", label: tr.cancelled },
  };
  const { cls, label } = map[status?.toLowerCase()] ?? { cls: "", label: status };
  return <Badge className={`${cls} hover:${cls}`}>{label ?? "—"}</Badge>;
}

function fmt(dateStr?: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toInputDate(dateStr?: string) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 10);
}

export default function DoctorAppointmentsPage() {
  const queryClient = useQueryClient();
  const [lang, setLangState] = useState<Lang>("fr");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [rescheduleAppt, setRescheduleAppt] = useState<any | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [deleteAppt, setDeleteAppt] = useState<any | null>(null);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  useEffect(() => {
    setLangState(getLang());
    // Sync language changes from the layout's toggle
    const onStorage = () => setLangState(getLang());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const tr = t[lang];

  const STATUS_TABS = [
    { value: "all", label: tr.all },
    { value: "pending", label: tr.pending },
    { value: "accepted", label: tr.accepted },
    { value: "completed", label: tr.completed },
    { value: "cancelled", label: tr.cancelled },
  ];

  const exportToExcel = async () => {
    setExportOpen(false);
    const id = toast.loading(tr.preparingExport);
    try {
      const res = await doctorAppointmentsAPI.getAllForExport(
        exportStartDate || undefined,
        exportEndDate || undefined,
      );
      const rows: any[] = res.data?.data ?? [];
      if (!rows.length) { toast.dismiss(id); toast.info(tr.noExportData); return; }

      const sheet = rows.map((a, i) => ({
        "#": i + 1,
        [lang === "fr" ? "Nom patient" : "Patient Name"]: a.patient?.fullName ?? "—",
        "Email": a.patient?.email ?? "—",
        [lang === "fr" ? "Téléphone" : "Phone"]: a.patient?.phone ?? "—",
        [lang === "fr" ? "Date" : "Date"]: fmt(a.appointmentDate),
        [lang === "fr" ? "Heure" : "Time"]: a.time ?? "—",
        [lang === "fr" ? "Type" : "Type"]: a.appointmentType ?? "—",
        [lang === "fr" ? "Statut" : "Status"]: a.status ?? "—",
        [lang === "fr" ? "Symptômes" : "Symptoms"]: a.symptoms ?? "—",
        [lang === "fr" ? "Honoraires (DA)" : "Fees (DA)"]: a.doctor?.fees?.amount ?? a.paidAmount ?? 0,
        [lang === "fr" ? "Créé le" : "Created At"]: fmt(a.createdAt),
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sheet);
      ws["!cols"] = [
        { wch: 4 }, { wch: 22 }, { wch: 28 }, { wch: 16 },
        { wch: 14 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
        { wch: 30 }, { wch: 12 }, { wch: 14 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, lang === "fr" ? "Rendez-vous" : "Appointments");
      const dateSuffix = exportStartDate && exportEndDate
        ? `${exportStartDate}_${exportEndDate}`
        : new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `rendez-vous_${dateSuffix}.xlsx`);
      toast.dismiss(id);
      toast.success(tr.exported(rows.length));
    } catch {
      toast.dismiss(id);
      toast.error(tr.exportFailed);
    } finally {
      setExportStartDate("");
      setExportEndDate("");
    }
  };

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["doctor-appointments", page, statusFilter],
    queryFn: () => doctorAppointmentsAPI.getAppointments(page, ITEMS_PER_PAGE, statusFilter),
  });

  const acceptMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "cancelled" }) =>
      doctorAppointmentsAPI.updateStatus(id, status),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      toast.success(v.status === "accepted" ? tr.appointmentAccepted : tr.appointmentRefused);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || tr.actionFailed),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, date, time }: { id: string; date: string; time: string }) =>
      doctorAppointmentsAPI.reschedule(id, date, time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      setRescheduleAppt(null);
      toast.success(tr.rescheduled);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || tr.rescheduleFailed),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => doctorAppointmentsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      setDeleteAppt(null);
      toast.success(tr.appointmentDeleted);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || tr.deleteFailed),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await doctorAppointmentsAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      setDeleteAllOpen(false);
      toast.success(tr.allDeleted);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || tr.deleteAllFailed),
  });

  const appointments: any[] = response?.data?.data ?? [];
  const total: number = response?.data?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  const filtered = search.trim()
    ? appointments.filter((a) =>
        a.patient?.fullName?.toLowerCase().includes(search.toLowerCase())
      )
    : appointments;

  const openReschedule = (appt: any) => {
    setRescheduleAppt(appt);
    setNewDate(toInputDate(appt.appointmentDate));
    setNewTime(appt.time ?? "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tr.myAppointments}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {tr.totalAppointments(total)}
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                {tr.pendingAction(pendingCount)}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
            <RefreshCw size={14} />{tr.refresh}
          </Button>
          <Button size="sm" onClick={() => setExportOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Download size={14} />{tr.exportExcel}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="gap-1.5"
            disabled={appointments.length === 0}
            onClick={() => setDeleteAllOpen(true)}
          >
            <Trash2 size={14} />{tr.deleteAll}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <Input
            placeholder={tr.searchPatient}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="space-y-1.5">
                  <div className="h-3 w-28 bg-gray-200 rounded" />
                  <div className="h-2.5 w-20 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2.5 w-full bg-gray-200 rounded" />
                <div className="h-2.5 w-3/4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-red-500">
          <p className="font-medium">{tr.failedToLoad}</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>{tr.tryAgain}</Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CalendarDays size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-500">{tr.noAppointments}</p>
          {statusFilter !== "all" && (
            <button className="mt-2 text-sm text-blue-600 hover:underline" onClick={() => setStatusFilter("all")}>
              {tr.viewAll}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((appt) => {
            const isPending = appt.status === "pending";
            const canEdit = !["completed", "cancelled"].includes(appt.status);
            const isAccepting = acceptMutation.isPending && (acceptMutation.variables as any)?.id === appt._id && (acceptMutation.variables as any)?.status === "accepted";
            const isRefusing = acceptMutation.isPending && (acceptMutation.variables as any)?.id === appt._id && (acceptMutation.variables as any)?.status === "cancelled";
            const isDeleting = deleteMutation.isPending && (deleteMutation.variables as any) === appt._id;

            return (
              <div
                key={appt._id}
                className={`bg-white rounded-xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${
                  isPending ? "border-amber-200 shadow-amber-50 shadow" : "border-gray-200"
                }`}
              >
                {/* Patient + status + action icons */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={appt.patient?.avatar?.url} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                        {appt.patient?.fullName?.charAt(0) ?? "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {appt.patient?.fullName ?? "Patient"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {appt.patient?.phone ?? appt.patient?.email ?? "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {statusBadge(appt.status, tr)}
                    {canEdit && (
                      <button
                        onClick={() => openReschedule(appt)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title={tr.reschedule}
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteAppt(appt)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title={tr.delete}
                    >
                      {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                    <span>{fmt(appt.appointmentDate)}</span>
                  </div>
                  {appt.time && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400 shrink-0" />
                      <span>{appt.time}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {appt.appointmentType === "video"
                      ? <Video size={14} className="text-blue-400 shrink-0" />
                      : <Building2 size={14} className="text-green-400 shrink-0" />
                    }
                    <span className="capitalize">{appt.appointmentType ?? "—"}</span>
                  </div>
                  {appt.symptoms && (
                    <p className="text-xs text-gray-400 italic line-clamp-2 pt-0.5">
                      "{appt.symptoms}"
                    </p>
                  )}
                </div>

                {/* Accept / Refuse */}
                {isPending && (
                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      disabled={isAccepting || isRefusing}
                      onClick={() => acceptMutation.mutate({ id: appt._id, status: "accepted" })}
                    >
                      {isAccepting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      {tr.accept}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5"
                      disabled={isAccepting || isRefusing}
                      onClick={() => acceptMutation.mutate({ id: appt._id, status: "cancelled" })}
                    >
                      {isRefusing ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                      {tr.refuse}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-gray-600">
            {tr.page} {page} {tr.of} {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={!!rescheduleAppt} onOpenChange={(o) => !o && setRescheduleAppt(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{tr.rescheduleTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500">
              {tr.patient} : <span className="font-medium text-gray-800">{rescheduleAppt?.patient?.fullName}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="new-date">{tr.newDate}</Label>
              <Input
                id="new-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-time">{tr.newTime}</Label>
              <Input
                id="new-time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleAppt(null)}>{tr.cancel}</Button>
            <Button
              disabled={!newDate || !newTime || rescheduleMutation.isPending}
              onClick={() => rescheduleMutation.mutate({ id: rescheduleAppt._id, date: newDate, time: newTime })}
            >
              {rescheduleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tr.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteAppt} onOpenChange={(o) => !o && setDeleteAppt(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr.deleteDesc(deleteAppt?.patient?.fullName ?? "", fmt(deleteAppt?.appointmentDate))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteMutation.mutate(deleteAppt._id)}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tr.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirm */}
      <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.deleteAllTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr.deleteAllDesc(appointments.length)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteAllMutation.mutate(appointments.map((a) => a._id))}
            >
              {deleteAllMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {tr.deleteAll}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Date Range Dialog */}
      <Dialog open={exportOpen} onOpenChange={(o) => { if (!o) { setExportOpen(false); setExportStartDate(""); setExportEndDate(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{tr.exportTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">{tr.exportDesc}</p>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="export-start">{tr.startDate}</Label>
              <Input
                id="export-start"
                type="date"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="export-end">{tr.endDate}</Label>
              <Input
                id="export-end"
                type="date"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setExportOpen(false); setExportStartDate(""); setExportEndDate(""); }}>{tr.cancel}</Button>
            <Button onClick={exportToExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Download size={14} className="mr-2" />{tr.exportBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
