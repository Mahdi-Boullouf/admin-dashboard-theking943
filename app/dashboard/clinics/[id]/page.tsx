"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { clinicsAdminAPI } from "@/lib/api-client";
import { CardSkeleton } from "@/components/skeletons";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  UserCog,
  CalendarCheck,
  ShieldCheck,
  Clock,
} from "lucide-react";

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

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clinicId = String(params?.id || "");

  const { data: detailResponse, isLoading } = useQuery({
    queryKey: ["clinic-detail", clinicId],
    queryFn: () => clinicsAdminAPI.getClinicById(clinicId),
    enabled: Boolean(clinicId),
  });

  const clinic = detailResponse?.data?.data || null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Details</h1>
          <p className="text-gray-600">
            Read-only profile, verification state and documents
          </p>
        </div>
      </div>

      {/* Profile card */}
      {isLoading ? (
        <CardSkeleton />
      ) : clinic ? (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {clinic.logo?.url ? (
                  <img
                    src={clinic.logo.url}
                    alt={clinic.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-7 w-7 text-gray-400" />
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xl font-semibold">{clinic.name || "N/A"}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <UserCog className="h-4 w-4" />
                      {clinic.managerName || "N/A"}
                    </span>
                    {clinic.owner?.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" /> {clinic.owner.email}
                      </span>
                    )}
                    {(clinic.phone || clinic.owner?.phone) && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />{" "}
                        {clinic.phone || clinic.owner?.phone}
                      </span>
                    )}
                    {(clinic.wilaya || clinic.commune) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {[clinic.commune, clinic.wilaya]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge className={statusColor(clinic.approvalStatus)}>
                      {STATUS_LABELS[clinic.approvalStatus] ||
                        clinic.approvalStatus ||
                        "Unknown"}
                    </Badge>
                    <Badge variant="outline">{clinic.clinicId || "—"}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Verification"
              value={
                STATUS_LABELS[clinic.approvalStatus] ||
                clinic.approvalStatus ||
                "Unknown"
              }
              icon={ShieldCheck}
              color="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              title="Documents Submitted"
              value={String(clinic.verificationDocuments?.length ?? 0)}
              icon={FileText}
              color="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Registered On"
              value={
                clinic.createdAt
                  ? new Date(clinic.createdAt).toLocaleDateString()
                  : "—"
              }
              icon={CalendarCheck}
              color="bg-purple-100"
              iconColor="text-purple-600"
            />
          </div>

          {/* Profile info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Address</p>
                  <p className="font-medium">{clinic.address || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contact email</p>
                  <p className="font-medium">{clinic.contactEmail || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Contact phone</p>
                  <p className="font-medium">{clinic.contactPhone || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Coordinates</p>
                  <p className="font-medium">
                    {clinic.location?.lat && clinic.location?.lng
                      ? `${clinic.location.lat}, ${clinic.location.lng}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Verified at</p>
                  <p className="font-medium">
                    {clinic.verifiedAt
                      ? new Date(clinic.verifiedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Owner account created</p>
                  <p className="font-medium">
                    {clinic.owner?.createdAt
                      ? new Date(clinic.owner.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-gray-500 text-sm">Specialties</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {clinic.specialties?.length ? (
                    clinic.specialties.map((s: string, i: number) => (
                      <Badge key={i} variant="outline">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm font-medium">—</span>
                  )}
                </div>
              </div>

              {clinic.rejectionReason && (
                <>
                  <Separator />
                  <div>
                    <p className="text-gray-500 text-sm">Rejection reason</p>
                    <p className="text-sm font-medium text-red-600">
                      {clinic.rejectionReason}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Services */}
          {clinic.services?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {clinic.services.map((service: any, i: number) => (
                    <div key={service._id || i} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{service.name}</p>
                        <Badge
                          className={
                            service.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {service.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {service.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">
                        {(service.price ?? 0).toLocaleString()} DA ·{" "}
                        {service.durationMinutes ?? 0} min
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Opening hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Opening hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {clinic.weeklySchedule?.length ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {clinic.weeklySchedule.map((day: any) => (
                    <div key={day.day} className="border rounded-lg p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">
                        {DAY_LABELS[day.day] || day.day}
                      </p>
                      {day.isActive && day.slots?.length ? (
                        day.slots.map((slot: any, idx: number) => (
                          <p key={idx} className="font-medium text-sm">
                            {slot.start} - {slot.end}
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500">Closed</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No opening hours set</p>
              )}
            </CardContent>
          </Card>

          {/* Verification documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification documents</CardTitle>
            </CardHeader>
            <CardContent>
              {clinic.verificationDocuments?.length ? (
                <div className="space-y-2">
                  {clinic.verificationDocuments.map((doc: any, i: number) => (
                    <a
                      key={doc.public_id || i}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 border rounded-lg p-3 text-sm hover:bg-gray-50 hover:border-blue-300 transition-colors"
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
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Clinic not found
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  iconColor,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`${color} p-3 rounded-lg`}>
            <Icon className={`${iconColor} h-6 w-6`} />
          </div>
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
