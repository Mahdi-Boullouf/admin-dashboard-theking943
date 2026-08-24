"use client";

import { useClinicLang } from "@/components/clinic-lang";
import type { Dict } from "@/lib/clinic-i18n";

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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { clinicDoctorsAPI, clinicCategoriesAPI } from "@/lib/clinic-api";
import type { DaySchedule } from "@/lib/clinic-api";
import {
  WeeklyScheduleEditor,
  emptyWeeklySchedule,
  validateWeeklySchedule,
} from "@/components/weekly-schedule-editor";
import {
  ClinicCredentialsDialog,
  type DoctorCredentials,
} from "@/components/clinic-credentials-dialog";
import { TableSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import { Search, Plus, UserPlus, Eye } from "lucide-react";

const ITEMS_PER_PAGE = 10;

const STATUS_FILTERS = [
  { value: "all", key: "all" },
  { value: "active", key: "active" },
  { value: "invited", key: "invited" },
  { value: "disabled", key: "disabled" },
] as const satisfies ReadonlyArray<{ value: string; key: keyof Dict }>;

const statusColor = (status: string) => {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return "bg-green-100 text-green-800";
    case "invited":
      return "bg-yellow-100 text-yellow-800";
    case "disabled":
      return "bg-gray-200 text-gray-700";
    case "declined":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function ClinicDoctorsPage() {
  const { tr } = useClinicLang();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Returned exactly once by the backend — see ClinicCredentialsDialog.
  const [credentials, setCredentials] = useState<DoctorCredentials | null>(null);

  const [newDoctor, setNewDoctor] = useState({
    fullName: "",
    specialty: "",
    subSpecialty: "",
    email: "",
    professionalPhone: "",
    medicalLicenseNumber: "",
    consultationDurationMinutes: "30",
    patientsPerPeriod: "",
    isOnlineConsultationAvailable: false,
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [schedule, setSchedule] = useState<DaySchedule[]>(emptyWeeklySchedule());

  const [inviteMode, setInviteMode] = useState<"doctorId" | "email">("doctorId");
  const [inviteValue, setInviteValue] = useState("");

  const queryClient = useQueryClient();

  const { data: response, isLoading } = useQuery({
    queryKey: ["clinic-doctors", page, search, status],
    queryFn: () =>
      clinicDoctorsAPI.getDoctors(page, ITEMS_PER_PAGE, status, search),
  });

  const resetAddForm = () => {
    setNewDoctor({
      fullName: "",
      specialty: "",
      subSpecialty: "",
      email: "",
      professionalPhone: "",
      medicalLicenseNumber: "",
      consultationDurationMinutes: "30",
      patientsPerPeriod: "",
      isOnlineConsultationAvailable: false,
    });
    setPhoto(null);
    setSchedule(emptyWeeklySchedule());
  };

  // The platform's specialties. Free text here produced doctors that matched no
  // patient-side filter, so the field is a picker from this list only.
  const { data: categoriesResp } = useQuery({
    queryKey: ["clinic-specialties"],
    queryFn: () => clinicCategoriesAPI.getAll(),
    staleTime: 5 * 60 * 1000,
  });
  const specialties: string[] = (categoriesResp?.data?.data ?? [])
    .map((c: any) => c?.speciality_name)
    .filter(Boolean);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => clinicDoctorsAPI.createDoctor(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["clinic-doctors"] });
      queryClient.invalidateQueries({ queryKey: ["clinic-dashboard"] });
      toast.success(tr.doctorCreated);
      setIsAddOpen(false);
      resetAddForm();
      const creds = res?.data?.data?.credentials;
      if (creds) setCredentials(creds);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create doctor");
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (payload: { doctorId?: string; email?: string }) =>
      clinicDoctorsAPI.inviteDoctor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-doctors"] });
      toast.success(tr.invitationSent);
      setIsInviteOpen(false);
      setInviteValue("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send invitation");
    },
  });

  const doctors = response?.data?.data || [];
  const totalResults = response?.data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor.fullName.trim()) {
      toast.error(tr.nameRequired);
      return;
    }
    if (!newDoctor.specialty.trim()) {
      toast.error(tr.specialtyRequired);
      return;
    }
    const scheduleError = validateWeeklySchedule(schedule);
    if (scheduleError) {
      toast.error(scheduleError);
      return;
    }

    const data = new FormData();
    data.append("fullName", newDoctor.fullName.trim());
    data.append("specialty", newDoctor.specialty.trim());
    if (newDoctor.subSpecialty.trim())
      data.append("subSpecialty", newDoctor.subSpecialty.trim());
    if (newDoctor.email.trim()) data.append("email", newDoctor.email.trim());
    if (newDoctor.professionalPhone.trim())
      data.append("professionalPhone", newDoctor.professionalPhone.trim());
    if (newDoctor.medicalLicenseNumber.trim())
      data.append("medicalLicenseNumber", newDoctor.medicalLicenseNumber.trim());
    if (newDoctor.consultationDurationMinutes)
      data.append(
        "consultationDurationMinutes",
        newDoctor.consultationDurationMinutes
      );
    if (newDoctor.patientsPerPeriod)
      data.append("patientsPerPeriod", newDoctor.patientsPerPeriod);
    data.append(
      "isOnlineConsultationAvailable",
      String(newDoctor.isOnlineConsultationAvailable)
    );
    data.append("weeklySchedule", JSON.stringify(schedule));
    if (photo) data.append("photo", photo);

    createMutation.mutate(data);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inviteValue.trim();
    if (!value) {
      toast.error(
        inviteMode === "doctorId"
          ? "Enter a doctor ID (e.g. DOC-12345)"
          : "Enter the doctor's email"
      );
      return;
    }
    inviteMutation.mutate(
      inviteMode === "doctorId" ? { doctorId: value } : { email: value }
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctors</h1>
          <p className="text-gray-600 mt-2">
            Create doctor accounts, invite existing doctors and manage their
            access
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite doctor
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add doctor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder={tr.searchDoctorsPlaceholder}
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
                <SelectValue placeholder={tr.allStatuses} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {tr[f.key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{tr.clinicDoctors}</CardTitle>
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
                    <TableHead>{tr.doctor}</TableHead>
                    <TableHead>{tr.specialty}</TableHead>
                    <TableHead>{tr.origin}</TableHead>
                    <TableHead>{tr.consultation}</TableHead>
                    <TableHead>{tr.status}</TableHead>
                    <TableHead>{tr.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map((membership: any) => (
                    <TableRow key={membership._id}>
                      <TableCell>
                        <Link
                          href={`/clinic-portal/doctors/${membership._id}`}
                          className="flex items-center gap-3 group"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={membership.doctor?.avatar?.url} />
                            <AvatarFallback>
                              {membership.doctor?.fullName?.charAt(0) || "D"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium group-hover:text-teal-700 group-hover:underline">
                              Dr. {membership.doctor?.fullName || "—"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {membership.doctor?.doctorId || "—"}
                            </p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {membership.doctor?.specialty ||
                            membership.subSpecialty ||
                            "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {membership.origin || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {membership.consultationDurationMinutes ?? "—"} min
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColor(membership.status)}>
                          {membership.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link href={`/clinic-portal/doctors/${membership._id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            {tr.manage}
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {tr.noDoctorsFound}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {tr.page} {page} {tr.of} {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              {tr.previous}
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              {tr.next}
            </Button>
          </div>
        </div>
      )}

      {/* Add doctor dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tr.addADoctor}</DialogTitle>
            <DialogDescription>
              This creates a real doctor account owned by the doctor. Login
              credentials are generated and shown to you once.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDoctor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  Full name <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={newDoctor.fullName}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, fullName: e.target.value })
                  }
                  placeholder="Amina Belkacem"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">
                  Specialty <span className="text-red-600">*</span>
                </Label>
                <Select
                  value={newDoctor.specialty}
                  onValueChange={(val) =>
                    setNewDoctor({ ...newDoctor, specialty: val })
                  }
                >
                  <SelectTrigger id="specialty">
                    <SelectValue placeholder={tr.chooseSpecialty} />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subSpecialty">{tr.subSpecialty}</Label>
                <Input
                  id="subSpecialty"
                  value={newDoctor.subSpecialty}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, subSpecialty: e.target.value })
                  }
                  placeholder={tr.subSpecialtyPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor-email">{tr.emailOptional}</Label>
                <Input
                  id="doctor-email"
                  type="email"
                  value={newDoctor.email}
                  onChange={(e) =>
                    setNewDoctor({ ...newDoctor, email: e.target.value })
                  }
                  placeholder="doctor@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalPhone">{tr.professionalPhone}</Label>
                <Input
                  id="professionalPhone"
                  value={newDoctor.professionalPhone}
                  onChange={(e) =>
                    setNewDoctor({
                      ...newDoctor,
                      professionalPhone: e.target.value,
                    })
                  }
                  placeholder="0555 00 00 00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">{tr.licenceNumber}</Label>
                <Input
                  id="license"
                  value={newDoctor.medicalLicenseNumber}
                  onChange={(e) =>
                    setNewDoctor({
                      ...newDoctor,
                      medicalLicenseNumber: e.target.value,
                    })
                  }
                  placeholder={tr.licenceNumberPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{tr.consultationDuration}</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  value={newDoctor.consultationDurationMinutes}
                  onChange={(e) =>
                    setNewDoctor({
                      ...newDoctor,
                      consultationDurationMinutes: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientsPerPeriod">{tr.patientsPerPeriod}</Label>
                <Input
                  id="patientsPerPeriod"
                  type="number"
                  min={0}
                  value={newDoctor.patientsPerPeriod}
                  onChange={(e) =>
                    setNewDoctor({
                      ...newDoctor,
                      patientsPerPeriod: e.target.value,
                    })
                  }
                  placeholder="e.g. 20"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="photo">{tr.photoOptional}</Label>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="online"
                checked={newDoctor.isOnlineConsultationAvailable}
                onCheckedChange={(checked) =>
                  setNewDoctor({
                    ...newDoctor,
                    isOnlineConsultationAvailable: checked,
                  })
                }
              />
              <Label htmlFor="online" className="cursor-pointer">
                Available for online consultations
              </Label>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>{tr.workingHoursHere}</Label>
              <WeeklyScheduleEditor value={schedule} onChange={setSchedule} />
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? tr.creating : tr.createDoctor}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr.inviteExistingTitle}</DialogTitle>
            <DialogDescription>
              {tr.inviteExistingHint}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={inviteMode === "doctorId" ? "default" : "outline"}
                className={
                  inviteMode === "doctorId" ? "bg-teal-600 hover:bg-teal-700" : ""
                }
                onClick={() => {
                  setInviteMode("doctorId");
                  setInviteValue("");
                }}
              >
                By doctor ID
              </Button>
              <Button
                type="button"
                size="sm"
                variant={inviteMode === "email" ? "default" : "outline"}
                className={
                  inviteMode === "email" ? "bg-teal-600 hover:bg-teal-700" : ""
                }
                onClick={() => {
                  setInviteMode("email");
                  setInviteValue("");
                }}
              >
                By email
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-value">
                {inviteMode === "doctorId" ? tr.doctorIdLabel : tr.emailAddress}
              </Label>
              <Input
                id="invite-value"
                type={inviteMode === "email" ? "email" : "text"}
                value={inviteValue}
                onChange={(e) => setInviteValue(e.target.value)}
                placeholder={
                  inviteMode === "doctorId" ? "DOC-12345" : "doctor@example.com"
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? tr.sending : tr.sendInvitation}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* One-time credentials dialog */}
      <ClinicCredentialsDialog
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />
    </div>
  );
}
