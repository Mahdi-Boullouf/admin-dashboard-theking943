"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { doctorAppointmentsAPI } from "@/lib/doctor-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";

const ITEMS_PER_PAGE = 12;

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function statusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "pending":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
          Pending
        </Badge>
      );
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
          Accepted
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
          Completed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DoctorAppointmentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ["doctor-appointments", page, statusFilter],
    queryFn: () =>
      doctorAppointmentsAPI.getAppointments(page, ITEMS_PER_PAGE, statusFilter),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "cancelled" }) =>
      doctorAppointmentsAPI.updateStatus(id, status),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      toast.success(
        vars.status === "accepted"
          ? "Appointment accepted"
          : "Appointment refused"
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Action failed");
    },
  });

  const appointments: any[] = response?.data?.data ?? [];
  const total: number = response?.data?.pagination?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Client-side search filter (by patient name)
  const filtered = search.trim()
    ? appointments.filter((a) =>
        a.patient?.fullName?.toLowerCase().includes(search.toLowerCase())
      )
    : appointments;

  const pendingCount = appointments.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {total} total appointment{total !== 1 ? "s" : ""}
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-600 font-medium">
                · {pendingCount} pending your action
              </span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-1.5"
        >
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
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

        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <Input
            placeholder="Search patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Content */}
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
          <p className="font-medium">Failed to load appointments</p>
          <Button variant="outline" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <CalendarDays size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-500">No appointments found</p>
          {statusFilter !== "all" && (
            <button
              className="mt-2 text-sm text-blue-600 hover:underline"
              onClick={() => setStatusFilter("all")}
            >
              View all appointments
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((appt) => {
            const isPending = appt.status === "pending";
            const isUpdating =
              updateMutation.isPending &&
              (updateMutation.variables as any)?.id === appt._id;

            return (
              <div
                key={appt._id}
                className={`bg-white rounded-xl border p-5 flex flex-col gap-4 transition-shadow hover:shadow-md ${
                  isPending ? "border-amber-200 shadow-amber-50 shadow" : "border-gray-200"
                }`}
              >
                {/* Patient info + status */}
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
                  {statusBadge(appt.status)}
                </div>

                {/* Appointment details */}
                <div className="space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                    <span>{formatDate(appt.appointmentDate)}</span>
                  </div>
                  {appt.time && (
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400 shrink-0" />
                      <span>{appt.time}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {appt.appointmentType === "video" ? (
                      <Video size={14} className="text-blue-400 shrink-0" />
                    ) : (
                      <Building2 size={14} className="text-green-400 shrink-0" />
                    )}
                    <span className="capitalize">
                      {appt.appointmentType ?? "—"}
                    </span>
                  </div>
                  {appt.symptoms && (
                    <p className="text-xs text-gray-400 italic line-clamp-2 pt-0.5">
                      "{appt.symptoms}"
                    </p>
                  )}
                </div>

                {/* Action buttons — only for pending */}
                {isPending && (
                  <div className="flex gap-2 pt-1 border-t border-gray-100">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      disabled={isUpdating}
                      onClick={() =>
                        updateMutation.mutate({ id: appt._id, status: "accepted" })
                      }
                    >
                      <CheckCircle size={14} />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5"
                      disabled={isUpdating}
                      onClick={() =>
                        updateMutation.mutate({ id: appt._id, status: "cancelled" })
                      }
                    >
                      <XCircle size={14} />
                      Refuse
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
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
}
