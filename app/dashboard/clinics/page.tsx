"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clinicsAdminAPI } from "@/lib/api-client";
import { ALGERIA_WILAYAS } from "@/lib/algeria-wilayas";
import { TableSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  Building2,
  FileText,
  Mail,
  Phone,
  MapPin,
  UserCog,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

/**
 * "approved" is the value the backend stores; the spec calls that state
 * VERIFIED, so the label and the wire value deliberately differ here.
 */
const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Verified",
  rejected: "Rejected",
  suspended: "Suspended",
};

const statusColor = (status: string) => {
  switch (String(status || "").toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    case "suspended":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ClinicsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [wilaya, setWilaya] = useState("all");

  const [reviewId, setReviewId] = useState<string | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectReason, setShowRejectReason] = useState(false);

  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["clinics", page, search, status, wilaya],
    queryFn: () =>
      clinicsAdminAPI.getClinics(page, ITEMS_PER_PAGE, search, status, wilaya),
  });

  const { data: detailResponse, isFetching: isDetailLoading } = useQuery({
    queryKey: ["clinic-detail", reviewId],
    queryFn: () => clinicsAdminAPI.getClinicById(reviewId || ""),
    enabled: Boolean(reviewId) && isReviewOpen,
  });

  const clinic = detailResponse?.data?.data || null;

  const verificationMutation = useMutation({
    mutationFn: ({
      id,
      approvalStatus,
      reason,
    }: {
      id: string;
      approvalStatus: "approved" | "rejected" | "suspended" | "pending";
      reason?: string;
    }) => clinicsAdminAPI.updateVerification(id, approvalStatus, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-detail"] });
      toast.success(
        variables.approvalStatus === "approved"
          ? "Clinic verified"
          : variables.approvalStatus === "rejected"
          ? "Clinic rejected"
          : variables.approvalStatus === "suspended"
          ? "Clinic suspended"
          : "Clinic status updated"
      );
      closeReview();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to update clinic status"
      );
    },
  });

  const clinics = response?.data?.data || [];
  const totalResults = response?.data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  const openReview = (id: string) => {
    setReviewId(id);
    setIsReviewOpen(true);
    setRejectionReason("");
    setShowRejectReason(false);
  };

  const closeReview = () => {
    setIsReviewOpen(false);
    setReviewId(null);
    setRejectionReason("");
    setShowRejectReason(false);
  };

  const handleReject = () => {
    // The backend answers 400 without a reason, so it is required here too.
    if (!rejectionReason.trim()) {
      toast.error("A rejection reason is required");
      return;
    }
    if (!reviewId) return;
    verificationMutation.mutate({
      id: reviewId,
      approvalStatus: "rejected",
      reason: rejectionReason.trim(),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clinic Management</h1>
        <p className="text-gray-600 mt-2">
          Review clinic registrations, verify their documents and manage access
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search by clinic name, manager, clinic ID or address..."
                className="pl-10"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <Select
              value={wilaya}
              onValueChange={(val) => {
                setWilaya(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="All Wilayas" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All Wilayas</SelectItem>
                {ALGERIA_WILAYAS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status tabs */}
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.value}
                size="sm"
                variant={status === tab.value ? "default" : "outline"}
                className={
                  status === tab.value ? "bg-blue-600 hover:bg-blue-700" : ""
                }
                onClick={() => {
                  setStatus(tab.value);
                  setPage(1);
                }}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clinics List</CardTitle>
          <CardDescription>
            Showing {clinics.length} of {totalResults} results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={ITEMS_PER_PAGE} />
          ) : clinics.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Clinic Name</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Doctors</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clinics.map((row: any) => (
                    <TableRow key={row._id}>
                      <TableCell>
                        {row.logo?.url ? (
                          <img
                            src={row.logo.url}
                            alt={row.name}
                            className="h-9 w-9 rounded object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 bg-gray-100 rounded flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/clinics/${row._id}`}
                          className="group"
                        >
                          <p className="font-medium group-hover:text-blue-600 group-hover:underline">
                            {row.name || "N/A"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {row.clinicId || "—"}
                          </p>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{row.managerName || "—"}</p>
                        <p className="text-xs text-gray-500">
                          {row.phone || row.email || ""}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {[row.commune, row.wilaya].filter(Boolean).join(", ") ||
                          "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{row.doctorCount ?? 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor(row.approvalStatus)}>
                          {STATUS_LABELS[row.approvalStatus] ||
                            row.approvalStatus ||
                            "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReview(row._id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No clinics found</div>
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

      {/* Review dialog */}
      <Dialog
        open={isReviewOpen}
        onOpenChange={(open) => (open ? setIsReviewOpen(true) : closeReview())}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clinic Verification</DialogTitle>
            <DialogDescription>
              Check the submitted details and documents before deciding.
            </DialogDescription>
          </DialogHeader>

          {isDetailLoading ? (
            <div className="py-6 text-sm text-gray-500">Loading...</div>
          ) : clinic ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {clinic.logo?.url ? (
                  <img
                    src={clinic.logo.url}
                    alt={clinic.name}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-xl font-semibold">{clinic.name || "N/A"}</p>
                  <p className="text-sm text-gray-500">
                    {clinic.clinicId || "—"}
                  </p>
                  <Badge className={`${statusColor(clinic.approvalStatus)} mt-1`}>
                    {STATUS_LABELS[clinic.approvalStatus] ||
                      clinic.approvalStatus ||
                      "Unknown"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Manager</p>
                  <p className="font-medium">{clinic.managerName || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> Account email
                  </p>
                  <p className="font-medium">{clinic.owner?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> Phone
                  </p>
                  <p className="font-medium">
                    {clinic.phone || clinic.owner?.phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Location
                  </p>
                  <p className="font-medium">
                    {[clinic.commune, clinic.wilaya].filter(Boolean).join(", ") ||
                      "—"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500">Address</p>
                  <p className="font-medium">{clinic.address || "—"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-gray-500">Specialties</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {clinic.specialties?.length ? (
                      clinic.specialties.map((s: string, i: number) => (
                        <Badge key={i} variant="outline">
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="font-medium">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Registered</p>
                  <p className="font-medium">
                    {clinic.createdAt
                      ? new Date(clinic.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
                {clinic.rejectionReason && (
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Previous rejection reason</p>
                    <p className="font-medium text-red-600">
                      {clinic.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Verification documents */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Verification documents
                </p>
                {clinic.verificationDocuments?.length ? (
                  <div className="space-y-2">
                    {clinic.verificationDocuments.map((doc: any, i: number) => (
                      <a
                        key={doc.public_id || i}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 border rounded-lg p-2.5 text-sm hover:bg-gray-50 hover:border-blue-300 transition-colors"
                      >
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="flex-1 truncate">
                          {doc.name || `Document ${i + 1}`}
                        </span>
                        <span className="text-xs text-blue-600">Open</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No documents were uploaded
                  </p>
                )}
              </div>

              {/* Rejection reason */}
              {showRejectReason && (
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason">
                    Rejection reason <span className="text-red-600">*</span>
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Explain what is missing or invalid. The clinic will see this."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {showRejectReason ? (
                  <>
                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleReject}
                      disabled={verificationMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Confirm rejection
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectReason(false);
                        setRejectionReason("");
                      }}
                      disabled={verificationMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={
                        verificationMutation.isPending ||
                        clinic.approvalStatus === "approved"
                      }
                      onClick={() =>
                        reviewId &&
                        verificationMutation.mutate({
                          id: reviewId,
                          approvalStatus: "approved",
                        })
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      disabled={verificationMutation.isPending}
                      onClick={() => setShowRejectReason(true)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      className="text-orange-600 hover:text-orange-700"
                      disabled={
                        verificationMutation.isPending ||
                        clinic.approvalStatus === "suspended"
                      }
                      onClick={() =>
                        reviewId &&
                        verificationMutation.mutate({
                          id: reviewId,
                          approvalStatus: "suspended",
                        })
                      }
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                    <Link href={`/dashboard/clinics/${reviewId}`}>
                      <Button variant="ghost">
                        <UserCog className="h-4 w-4 mr-1" />
                        Full details
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-sm text-gray-500">No details found</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
