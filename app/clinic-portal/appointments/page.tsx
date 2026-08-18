"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clinicAppointmentsAPI, clinicDoctorsAPI } from "@/lib/clinic-api";
import { TableSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import { CheckCircle, XCircle, Video, MapPin } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusColor = (status: string) => {
  switch (String(status || "").toLowerCase()) {
    case "accepted":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ClinicAppointmentsPage() {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("all");
  const [doctorId, setDoctorId] = useState("all");

  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["clinic-appointments", page, date, status, doctorId],
    queryFn: () =>
      clinicAppointmentsAPI.getAppointments(
        page,
        ITEMS_PER_PAGE,
        date,
        status,
        doctorId
      ),
  });

  // Feeds the doctor filter. A high limit keeps every doctor in one request —
  // a clinic's roster is small enough that paging the filter would be noise.
  const { data: doctorsResponse } = useQuery({
    queryKey: ["clinic-doctors-filter"],
    queryFn: () => clinicDoctorsAPI.getDoctors(1, 100, "active", ""),
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      nextStatus,
    }: {
      id: string;
      nextStatus: "accepted" | "cancelled";
    }) => clinicAppointmentsAPI.updateStatus(id, nextStatus),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clinic-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-dashboard"] });
      toast.success(
        variables.nextStatus === "accepted"
          ? "Appointment confirmed"
          : "Appointment cancelled"
      );
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update the appointment"
      );
    },
  });

  const appointments = response?.data?.data || [];
  const totalResults = response?.data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
  const doctors = doctorsResponse?.data?.data || [];

  const clearFilters = () => {
    setDate("");
    setStatus("all");
    setDoctorId("all");
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <p className="text-gray-600 mt-2">
          Appointments booked with your clinic&apos;s doctors
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="date" className="text-sm text-gray-600">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-sm text-gray-600">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => {
                  setStatus(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-sm text-gray-600">Doctor</Label>
              <Select
                value={doctorId}
                onValueChange={(val) => {
                  setDoctorId(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All doctors" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">All doctors</SelectItem>
                  {doctors
                    .filter((m: any) => m.doctor?._id)
                    .map((m: any) => (
                      <SelectItem key={m._id} value={m.doctor._id}>
                        Dr. {m.doctor.fullName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments List</CardTitle>
          <CardDescription>
            Showing {appointments.length} of {totalResults} results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={ITEMS_PER_PAGE} />
          ) : appointments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date &amp; time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appt: any) => (
                    <TableRow key={appt._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={appt.patient?.avatar?.url} />
                            <AvatarFallback>
                              {appt.patient?.fullName?.charAt(0) || "P"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {appt.bookedFor?.fullName ||
                                appt.patient?.fullName ||
                                "—"}
                            </p>
                            {appt.patient?.phone && (
                              <p className="text-xs text-gray-500">
                                {appt.patient.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          Dr. {appt.doctor?.fullName || "—"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appt.doctor?.specialty || ""}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {appt.appointmentDate
                          ? new Date(appt.appointmentDate).toLocaleDateString()
                          : "—"}
                        <span className="text-gray-500"> {appt.time || ""}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {appt.appointmentType === "video" ? (
                            <Video className="h-3 w-3" />
                          ) : (
                            <MapPin className="h-3 w-3" />
                          )}
                          {appt.appointmentType || "physical"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor(appt.status)}>
                          {appt.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {/* "completed" is a doctor-only transition — the API
                            answers 403 for a clinic, so it is never offered. */}
                        <div className="flex items-center gap-2">
                          {appt.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:text-green-700 bg-transparent"
                              disabled={statusMutation.isPending}
                              onClick={() =>
                                statusMutation.mutate({
                                  id: appt._id,
                                  nextStatus: "accepted",
                                })
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                          )}
                          {(appt.status === "pending" ||
                            appt.status === "accepted") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                              disabled={statusMutation.isPending}
                              onClick={() =>
                                statusMutation.mutate({
                                  id: appt._id,
                                  nextStatus: "cancelled",
                                })
                              }
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}
                          {appt.status !== "pending" &&
                            appt.status !== "accepted" && (
                              <span className="text-xs text-gray-400">
                                No actions
                              </span>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No appointments found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
