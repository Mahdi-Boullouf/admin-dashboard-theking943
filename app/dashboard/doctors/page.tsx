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
import { doctorsAPI } from "@/lib/api-client";
import { TableSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  Star,
  Briefcase,
  Trash2,
} from "lucide-react";
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
import Link from "next/link";
import Loading from "../appointments/loading";

export default function DoctorsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  // Doctor pending deletion (null = no confirmation dialog open)
  const [doctorToDelete, setDoctorToDelete] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const ITEMS_PER_PAGE = 10;

  const { data: response, isLoading } = useQuery({
    queryKey: ["doctors", page, search, status],
    queryFn: () => doctorsAPI.getDoctors(page, ITEMS_PER_PAGE, search, status),
  });

  const { data: detailResponse, isFetching: isDetailLoading } = useQuery({
    queryKey: ["doctor-detail", selectedId],
    queryFn: () => doctorsAPI.getDoctorById(selectedId || ""),
    enabled: Boolean(selectedId) && isDetailOpen,
  });

  const doctorDetail = detailResponse?.data?.data || null;

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      approvalStatus,
    }: {
      id: string;
      approvalStatus: string;
    }) => doctorsAPI.approveDoctorRegistration(id, approvalStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Doctor status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => doctorsAPI.deleteDoctor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      toast.success("Doctor deleted");
      setDoctorToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete doctor");
    },
  });

  const doctors = response?.data?.data || [];
  const totalResults = response?.data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
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
          <h1 className="text-3xl font-bold text-gray-900">
            Doctor's Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage all doctors, approve registrations, and edit profiles
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search by name or Speciality..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select
                value={status}
                onValueChange={(val) => {
                  setStatus(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Doctor's List</CardTitle>
            <CardDescription>
              Showing {doctors.length} of {totalResults} results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={ITEMS_PER_PAGE} />
            ) : doctors.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doctor Name</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Referral</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {doctors.map((doctor: any) => (
                      <TableRow key={doctor._id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/doctors/${doctor._id}`}
                            className="flex items-center gap-3 group"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={doctor.avatar?.url || "/placeholder.svg"}
                                alt={doctor.fullName}
                              />
                              <AvatarFallback>
                                {doctor.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium group-hover:text-blue-600 group-hover:underline">
                                {doctor.fullName}
                              </p>
                              <p className="text-xs text-gray-600">
                                {doctor.email}
                              </p>
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {doctor.specialty ||
                              doctor.specialties?.[0] ||
                              "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {doctor.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusColor(doctor.approvalStatus)}
                          >
                            {doctor.approvalStatus?.charAt(0).toUpperCase() +
                              doctor.approvalStatus?.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {doctor.referralCode?.code || "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {doctor.approvalStatus === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700 bg-transparent"
                                  onClick={() =>
                                    approveMutation.mutate({
                                      id: doctor._id,
                                      approvalStatus: "approved",
                                    })
                                  }
                                  disabled={approveMutation.isPending}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 bg-transparent"
                                  onClick={() =>
                                    approveMutation.mutate({
                                      id: doctor._id,
                                      approvalStatus: "rejected",
                                    })
                                  }
                                  disabled={approveMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedId(doctor._id);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => setDoctorToDelete(doctor)}
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
                No doctors found
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

      {/* Detail modal */}
      <Dialog
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open);
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Doctor Details</DialogTitle>
            <DialogDescription>
              Profile and professional info at a glance.
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="py-6 text-sm text-gray-500">Loading...</div>
          ) : doctorDetail ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage
                    src={doctorDetail.avatar?.url || "/placeholder.svg"}
                    alt={doctorDetail.fullName}
                  />
                  <AvatarFallback>
                    {doctorDetail.fullName?.charAt(0) || "D"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-semibold flex items-center gap-2">
                    {doctorDetail.fullName || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" /> {doctorDetail.email || "—"}
                  </p>
                  {doctorDetail.phone && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Phone className="h-4 w-4" /> {doctorDetail.phone}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Specialty</p>
                  <p className="font-medium">
                    {doctorDetail.specialty ||
                      doctorDetail.specialties?.[0] ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Experience</p>
                  <p className="font-medium">
                    {doctorDetail.experienceYears || 0} yrs
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">License</p>
                  <p className="font-medium">
                    {doctorDetail.medicalLicenseNumber || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Fees</p>
                  <p className="font-medium">
                    {doctorDetail.fees?.amount ?? 0}{" "}
                    {doctorDetail.fees?.currency || "USD"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium capitalize">
                    {doctorDetail.approvalStatus || "pending"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <div>
                    <p className="text-gray-500">Rating</p>
                    <p className="font-medium">
                      {doctorDetail.ratingSummary?.avgRating ?? 0} / 5 •{" "}
                      {doctorDetail.ratingSummary?.totalReviews ?? 0} reviews
                    </p>
                  </div>
                </div>
              </div>

              {doctorDetail.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium">{doctorDetail.address}</p>
                  </div>
                </div>
              )}

              {doctorDetail.bio && (
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Briefcase className="h-4 w-4" /> Bio
                  </div>
                  <p className="font-medium leading-relaxed">
                    {doctorDetail.bio}
                  </p>
                </div>
              )}

              {doctorDetail.weeklySchedule?.length ? (
                <div className="text-sm space-y-2">
                  <p className="text-gray-500 font-medium">Weekly Schedule</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {doctorDetail.weeklySchedule.map((day: any) => (
                      <div key={day.day} className="border rounded-lg p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {day.day}
                        </p>
                        {day.isActive && day.slots?.length ? (
                          day.slots.map((slot: any, idx: number) => (
                            <p key={idx} className="font-medium">
                              {slot.start} - {slot.end}
                            </p>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">No slots</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="py-6 text-sm text-gray-500">No details found</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={Boolean(doctorToDelete)}
        onOpenChange={(open) => !open && setDoctorToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete doctor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <span className="font-semibold">
                {doctorToDelete?.fullName || "this doctor"}
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
                if (doctorToDelete?._id) deleteMutation.mutate(doctorToDelete._id);
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
