"use client";

import { useClinicLang } from "@/components/clinic-lang";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { clinicDoctorsAPI } from "@/lib/clinic-api";
import type { DaySchedule } from "@/lib/clinic-api";
import {
  WeeklyScheduleEditor,
  normalizeWeeklySchedule,
  validateWeeklySchedule,
} from "@/components/weekly-schedule-editor";
import {
  ClinicCredentialsDialog,
  type DoctorCredentials,
} from "@/components/clinic-credentials-dialog";
import { CardSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import {
  ArrowLeft,
  MessageSquare,
  KeyRound,
  Trash2,
  Power,
  Lock,
} from "lucide-react";

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

export default function ClinicDoctorDetailPage() {
  const { tr } = useClinicLang();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const membershipId = String(params?.id || "");

  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [settings, setSettings] = useState({
    subSpecialty: "",
    professionalPhone: "",
    consultationDurationMinutes: "",
    patientsPerPeriod: "",
    isOnlineConsultationAvailable: false,
    feeAmount: "",
  });
  const [credentials, setCredentials] = useState<DoctorCredentials | null>(null);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["clinic-doctor", membershipId],
    queryFn: () => clinicDoctorsAPI.getDoctor(membershipId),
    enabled: Boolean(membershipId),
  });

  const membership = response?.data?.data || null;
  const doctor = membership?.doctor || null;
  const messaging = membership?.messaging || null;

  // Seed the editable state once the membership arrives.
  useEffect(() => {
    if (!membership) return;
    setSchedule(normalizeWeeklySchedule(membership.weeklySchedule));
    setSettings({
      subSpecialty: membership.subSpecialty || "",
      professionalPhone: membership.professionalPhone || "",
      consultationDurationMinutes:
        membership.consultationDurationMinutes != null
          ? String(membership.consultationDurationMinutes)
          : "",
      patientsPerPeriod:
        membership.patientsPerPeriod != null
          ? String(membership.patientsPerPeriod)
          : "",
      isOnlineConsultationAvailable: Boolean(
        membership.isOnlineConsultationAvailable
      ),
      feeAmount:
        membership.fees?.amount != null ? String(membership.fees.amount) : "",
    });
  }, [membership]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["clinic-doctor", membershipId] });
    queryClient.invalidateQueries({ queryKey: ["clinic-doctors"] });
    queryClient.invalidateQueries({ queryKey: ["clinic-dashboard"] });
  };

  const updateMutation = useMutation({
    mutationFn: (data: any) => clinicDoctorsAPI.updateDoctor(membershipId, data),
    onSuccess: () => {
      invalidate();
      toast.success(tr.doctorUpdated);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || tr.doctorUpdateFailed);
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (weeklySchedule: DaySchedule[]) =>
      clinicDoctorsAPI.updateSchedule(membershipId, weeklySchedule),
    onSuccess: () => {
      invalidate();
      toast.success(tr.scheduleSaved);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || tr.scheduleSaveFailed);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: "active" | "disabled") =>
      clinicDoctorsAPI.setStatus(membershipId, status),
    onSuccess: (_data, status) => {
      invalidate();
      toast.success(status === "active" ? tr.doctorEnabled : tr.doctorDisabled);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || tr.statusUpdateFailed);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => clinicDoctorsAPI.removeDoctor(membershipId),
    onSuccess: () => {
      invalidate();
      toast.success(tr.doctorRemovedFromClinic);
      setShowRemoveConfirm(false);
      router.push("/clinic-portal/doctors");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || tr.doctorRemoveFailed);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => clinicDoctorsAPI.resetAccess(membershipId),
    onSuccess: (res) => {
      setShowResetConfirm(false);
      const creds = res?.data?.data?.credentials || res?.data?.data;
      if (creds?.temporaryPassword) {
        setCredentials(creds);
      } else {
        toast.success(tr.accessResetShort);
      }
    },
    onError: (error: any) => {
      // A 403 here means the doctor has become independent of the clinic — the
      // message explains exactly why, so surface it verbatim.
      toast.error(
        error.response?.data?.message || "Failed to reset doctor access"
      );
      setShowResetConfirm(false);
    },
  });

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      subSpecialty: settings.subSpecialty,
      professionalPhone: settings.professionalPhone,
      isOnlineConsultationAvailable: settings.isOnlineConsultationAvailable,
    };
    if (settings.consultationDurationMinutes)
      payload.consultationDurationMinutes = Number(
        settings.consultationDurationMinutes
      );
    if (settings.patientsPerPeriod)
      payload.patientsPerPeriod = Number(settings.patientsPerPeriod);
    if (settings.feeAmount)
      payload.fees = { amount: Number(settings.feeAmount), currency: "DZD" };
    updateMutation.mutate(payload);
  };

  const handleSaveSchedule = () => {
    const error = validateWeeklySchedule(schedule);
    if (error) {
      toast.error(error);
      return;
    }
    scheduleMutation.mutate(schedule);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!membership) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          Doctor not found
        </CardContent>
      </Card>
    );
  }

  const isDisabled = membership.status === "disabled";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor</h1>
          <p className="text-gray-600">
            Manage this doctor&apos;s practice inside your clinic
          </p>
        </div>
      </div>

      {/* Profile */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={doctor?.avatar?.url} />
              <AvatarFallback>{doctor?.fullName?.charAt(0) || "D"}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 flex-1">
              <p className="text-xl font-semibold">
                Dr. {doctor?.fullName || "—"}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                <span>{doctor?.specialty || "—"}</span>
                <span>{doctor?.doctorId || "—"}</span>
                <span className="capitalize">Origin: {membership.origin || "—"}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Badge className={statusColor(membership.status)}>
                  {membership.status}
                </Badge>
                {doctor?.approvalStatus && (
                  <Badge variant="outline" className="capitalize">
                    Account: {doctor.approvalStatus}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice settings */}
      <Card>
        <CardHeader>
          <CardTitle>{tr.practiceSettings}</CardTitle>
          <CardDescription>
            {tr.practiceSettingsDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subSpecialty">{tr.subSpecialty}</Label>
                <Input
                  id="subSpecialty"
                  value={settings.subSpecialty}
                  onChange={(e) =>
                    setSettings({ ...settings, subSpecialty: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professionalPhone">{tr.professionalPhone}</Label>
                <Input
                  id="professionalPhone"
                  value={settings.professionalPhone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      professionalPhone: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{tr.consultationDuration}</Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  value={settings.consultationDurationMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
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
                  value={settings.patientsPerPeriod}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      patientsPerPeriod: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee">{tr.consultationFee}</Label>
                <Input
                  id="fee"
                  type="number"
                  min={0}
                  value={settings.feeAmount}
                  onChange={(e) =>
                    setSettings({ ...settings, feeAmount: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="online"
                checked={settings.isOnlineConsultationAvailable}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    isOnlineConsultationAvailable: checked,
                  })
                }
              />
              <Label htmlFor="online" className="cursor-pointer">
                Available for online consultations
              </Label>
            </div>

            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save settings"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Weekly schedule */}
      <Card>
        <CardHeader>
          <CardTitle>{tr.workingHoursThisClinic}</CardTitle>
          <CardDescription>
            {tr.hoursThisClinicOnly}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WeeklyScheduleEditor value={schedule} onChange={setSchedule} />
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={handleSaveSchedule}
            disabled={scheduleMutation.isPending}
          >
            {scheduleMutation.isPending ? "Saving..." : "Save schedule"}
          </Button>
        </CardContent>
      </Card>

      {/* Messaging — counts only */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> {tr.messagingActivity}
          </CardTitle>
          <CardDescription>
            {tr.messagingActivityDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Conversations</p>
              <p className="text-2xl font-bold text-gray-900">
                {messaging?.conversationCount ?? 0}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Messages</p>
              <p className="text-2xl font-bold text-gray-900">
                {messaging?.messageCount ?? 0}
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-600">Last activity</p>
              <p className="text-lg font-semibold text-gray-900">
                {messaging?.lastActivityAt
                  ? new Date(messaging.lastActivityAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg border bg-gray-50 p-3 text-sm text-gray-600">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{tr.messageContentBlocked}</p>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">{tr.accessSection}</CardTitle>
          <CardDescription>
            {tr.accessSectionDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={statusMutation.isPending}
              onClick={() =>
                statusMutation.mutate(isDisabled ? "active" : "disabled")
              }
            >
              <Power className="h-4 w-4 mr-1" />
              {isDisabled ? "Enable doctor" : "Disable doctor"}
            </Button>
            <Button
              variant="outline"
              disabled={resetMutation.isPending}
              onClick={() => setShowResetConfirm(true)}
            >
              <KeyRound className="h-4 w-4 mr-1" />
              Reset access
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setShowRemoveConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove from clinic
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset access confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.resetAccessConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr.resetAccessConfirmBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-teal-600 hover:bg-teal-700"
              disabled={resetMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                resetMutation.mutate();
              }}
            >
              {resetMutation.isPending ? "Resetting..." : "Reset access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove confirmation */}
      <AlertDialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr.removeConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              Dr. {doctor?.fullName || tr.thisDoctor} will no longer practise at
              your clinic and will disappear from your lists. Their DocMobi
              account is <strong>not</strong> deleted — they keep their profile,
              their history and any other clinic they belong to.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={removeMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                removeMutation.mutate();
              }}
            >
              {removeMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* One-time credentials from reset-access */}
      <ClinicCredentialsDialog
        credentials={credentials}
        onClose={() => setCredentials(null)}
      />
    </div>
  );
}
