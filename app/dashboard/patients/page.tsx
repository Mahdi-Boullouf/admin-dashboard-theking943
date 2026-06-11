"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { patientsAPI } from "@/lib/api-client";
import { TableSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import { Search, Eye, Check, X, Mail, Phone, MapPin, User, Trash2 } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Suspense } from "react";
import Loading from "../appointments/loading";

export default function PatientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all"); // Updated default value to "all"
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // Patient pending deletion (null = no confirmation dialog open)
  const [patientToDelete, setPatientToDelete] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const ITEMS_PER_PAGE = 10;

  const { data: response, isLoading } = useQuery({
    queryKey: ["patients", page, search, status],
    queryFn: () => patientsAPI.getPatients(page, ITEMS_PER_PAGE, search, status),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      patientsAPI.updatePatient(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientsAPI.deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient deleted");
      setPatientToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete patient");
    },
  });

  const patients = response?.data?.data || [];
  const totalResults = response?.data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  const {
    data: detailResponse,
    isFetching: isDetailLoading,
  } = useQuery({
    queryKey: ["patient-detail", selectedId],
    queryFn: () => patientsAPI.getPatientById(selectedId || ""),
    enabled: Boolean(selectedId) && isDetailOpen,
  });

  const patientDetail = detailResponse?.data?.data || null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "block":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-gray-600 mt-2">View and manage all registered patients</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search by name"
                  className="pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select value={status} onValueChange={(val) => {
                setStatus(val);
                setPage(1);
              }}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem> {/* Updated value prop */}
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="block">Block</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Patient's List</CardTitle>
            <CardDescription>Showing {patients.length} of {totalResults} results</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={ITEMS_PER_PAGE} />
            ) : patients.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Appointments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient: any) => (
                      <TableRow key={patient._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={patient.avatar?.url || "/placeholder.svg"} alt={patient.fullName} />
                              <AvatarFallback>{patient.fullName?.charAt(0) || "P"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{patient.fullName || "N/A"}</p>
                              <p className="text-xs text-gray-600">{patient.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{patient.email}</TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline">
                            {patient.appointmentCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(patient.status)}>
                            {patient.status?.charAt(0).toUpperCase() + patient.status?.slice(1) || "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {patient.status !== "block" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 bg-transparent"
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: patient._id,
                                    status: "block",
                                  })
                                }
                                disabled={updateMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Block
                              </Button>
                            )}
                            {patient.status === "block" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 bg-transparent"
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: patient._id,
                                    status: "active",
                                  })
                                }
                                disabled={updateMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Unblock
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedId(patient._id);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setPatientToDelete(patient)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No patients found
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
            <DialogDescription>
              Quick view of patient profile information.
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="py-6 text-sm text-gray-500">Loading...</div>
          ) : patientDetail ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={patientDetail.avatar?.url || "/placeholder.svg"} alt={patientDetail.fullName} />
                  <AvatarFallback>{patientDetail.fullName?.charAt(0) || "P"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" /> {patientDetail.fullName || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {patientDetail.email || "—"}
                  </p>
                  {patientDetail.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="h-4 w-4" /> {patientDetail.phone}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium capitalize">{patientDetail.status || "active"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Language</p>
                  <p className="font-medium">{patientDetail.language || "en"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Role</p>
                  <p className="font-medium capitalize">{patientDetail.role || "patient"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">
                    {patientDetail.createdAt ? new Date(patientDetail.createdAt).toLocaleString() : "—"}
                  </p>
                </div>
              </div>

              {patientDetail.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium">{patientDetail.address}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-sm text-gray-500">No details found</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(patientToDelete)}
        onOpenChange={(open) => !open && setPatientToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold">
                {patientToDelete?.fullName || "this patient"}
              </span>{" "}
              and their account data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (patientToDelete?._id) deleteMutation.mutate(patientToDelete._id);
              }}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Suspense>
  );
}
