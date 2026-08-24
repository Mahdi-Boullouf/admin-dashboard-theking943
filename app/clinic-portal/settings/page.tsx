"use client";

import { useClinicLang } from "@/components/clinic-lang";

import { useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clinicProfileAPI } from "@/lib/clinic-api";
import type { DaySchedule } from "@/lib/clinic-api";
import { ALGERIA_WILAYAS } from "@/lib/algeria-wilayas";
import {
  WeeklyScheduleEditor,
  normalizeWeeklySchedule,
  validateWeeklySchedule,
} from "@/components/weekly-schedule-editor";
import { CardSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import { Building2, Plus, Trash2, X } from "lucide-react";

type ServiceRow = {
  name: string;
  description: string;
  price: string;
  durationMinutes: string;
  isActive: boolean;
};

export default function ClinicSettingsPage() {
  const { tr } = useClinicLang();
  const queryClient = useQueryClient();

  const [profile, setProfile] = useState({
    name: "",
    managerName: "",
    phone: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    wilaya: "",
    commune: "",
    lat: "",
    lng: "",
  });
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);

  const { data: response, isLoading } = useQuery({
    queryKey: ["clinic-profile"],
    queryFn: () => clinicProfileAPI.getProfile(),
  });

  const clinic = response?.data?.data || null;

  useEffect(() => {
    if (!clinic) return;
    setProfile({
      name: clinic.name || "",
      managerName: clinic.managerName || "",
      phone: clinic.phone || "",
      contactEmail: clinic.contactEmail || "",
      contactPhone: clinic.contactPhone || "",
      address: clinic.address || "",
      wilaya: clinic.wilaya || "",
      commune: clinic.commune || "",
      lat: clinic.location?.lat || "",
      lng: clinic.location?.lng || "",
    });
    setSpecialties(Array.isArray(clinic.specialties) ? clinic.specialties : []);
    setSchedule(normalizeWeeklySchedule(clinic.weeklySchedule));
    setServices(
      (clinic.services || []).map((s: any) => ({
        name: s.name || "",
        description: s.description || "",
        price: s.price != null ? String(s.price) : "0",
        durationMinutes:
          s.durationMinutes != null ? String(s.durationMinutes) : "30",
        isActive: s.isActive !== false,
      }))
    );
  }, [clinic]);

  const profileMutation = useMutation({
    mutationFn: (data: FormData) => clinicProfileAPI.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-profile"] });
      toast.success(tr.profileUpdated);
      setLogo(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  const hoursMutation = useMutation({
    mutationFn: (weeklySchedule: DaySchedule[]) =>
      clinicProfileAPI.updateWorkingHours(weeklySchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-profile"] });
      toast.success(tr.hoursSaved);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save hours");
    },
  });

  const servicesMutation = useMutation({
    mutationFn: (payload: any[]) => clinicProfileAPI.updateServices(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinic-profile"] });
      toast.success(tr.servicesSaved);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save services");
    },
  });

  // Memoised + revoked: calling createObjectURL straight in the JSX would mint
  // a new blob URL on every keystroke and never release any of them.
  const logoPreview = useMemo(
    () => (logo ? URL.createObjectURL(logo) : null),
    [logo]
  );
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  const addSpecialty = () => {
    const value = specialtyInput.trim();
    if (!value) return;
    if (!specialties.includes(value)) setSpecialties([...specialties, value]);
    setSpecialtyInput("");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      toast.error(tr.clinicNameRequired);
      return;
    }

    const data = new FormData();
    data.append("name", profile.name.trim());
    data.append("managerName", profile.managerName.trim());
    data.append("phone", profile.phone.trim());
    data.append("contactEmail", profile.contactEmail.trim());
    data.append("contactPhone", profile.contactPhone.trim());
    data.append("address", profile.address.trim());
    data.append("wilaya", profile.wilaya);
    data.append("commune", profile.commune.trim());
    data.append("lat", profile.lat);
    data.append("lng", profile.lng);
    data.append("specialties", JSON.stringify(specialties));
    if (logo) data.append("logo", logo);

    profileMutation.mutate(data);
  };

  const handleSaveHours = () => {
    const error = validateWeeklySchedule(schedule);
    if (error) {
      toast.error(error);
      return;
    }
    hoursMutation.mutate(schedule);
  };

  const handleSaveServices = () => {
    for (const service of services) {
      if (!service.name.trim()) {
        toast.error(tr.serviceNeedsName);
        return;
      }
    }
    servicesMutation.mutate(
      services.map((s) => ({
        name: s.name.trim(),
        description: s.description.trim(),
        price: Number(s.price) || 0,
        durationMinutes: Number(s.durationMinutes) || 30,
        isActive: s.isActive,
      }))
    );
  };

  const patchService = (index: number, patch: Partial<ServiceRow>) =>
    setServices(services.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  if (isLoading) {
    return (
      <div className="space-y-8">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{tr.settingsTitle}</h1>
        <p className="text-gray-600 mt-2">
          {tr.settingsSubtitle}
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>{tr.clinicProfile}</CardTitle>
          <CardDescription>
            {clinic?.clinicId
              ? `${tr.clinicIdLabel}: ${clinic.clinicId}`
              : tr.detailsPatientsSee}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="New logo"
                  className="h-16 w-16 rounded-lg object-cover border"
                />
              ) : clinic?.logo?.url ? (
                <img
                  src={clinic.logo.url}
                  alt={clinic.name}
                  className="h-16 w-16 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-7 w-7 text-gray-400" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Label htmlFor="logo">{tr.logo}</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogo(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{tr.clinicName}</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="managerName">{tr.managerName}</Label>
                <Input
                  id="managerName"
                  value={profile.managerName}
                  onChange={(e) =>
                    setProfile({ ...profile, managerName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{tr.phone}</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">{tr.publicContactPhone}</Label>
                <Input
                  id="contactPhone"
                  value={profile.contactPhone}
                  onChange={(e) =>
                    setProfile({ ...profile, contactPhone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">{tr.publicContactEmail}</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={profile.contactEmail}
                  onChange={(e) =>
                    setProfile({ ...profile, contactEmail: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{tr.address}</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) =>
                    setProfile({ ...profile, address: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wilaya">{tr.wilaya}</Label>
                <Select
                  value={profile.wilaya}
                  onValueChange={(val) =>
                    setProfile({ ...profile, wilaya: val })
                  }
                >
                  <SelectTrigger id="wilaya">
                    <SelectValue placeholder={tr.selectAWilaya} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ALGERIA_WILAYAS.map((w) => (
                      <SelectItem key={w} value={w}>
                        {w}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commune">{tr.commune}</Label>
                <Input
                  id="commune"
                  value={profile.commune}
                  onChange={(e) =>
                    setProfile({ ...profile, commune: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lat">{tr.latitude}</Label>
                <Input
                  id="lat"
                  value={profile.lat}
                  onChange={(e) =>
                    setProfile({ ...profile, lat: e.target.value })
                  }
                  placeholder="36.7538"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">{tr.longitude}</Label>
                <Input
                  id="lng"
                  value={profile.lng}
                  onChange={(e) =>
                    setProfile({ ...profile, lng: e.target.value })
                  }
                  placeholder="3.0588"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="specialty">{tr.specialties}</Label>
              <div className="flex gap-2">
                <Input
                  id="specialty"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialty();
                    }
                  }}
                  placeholder={tr.specialtyChipHint}
                />
                <Button type="button" variant="outline" onClick={addSpecialty}>
                  Add
                </Button>
              </div>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {specialties.map((s) => (
                    <Badge
                      key={s}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() =>
                          setSpecialties(specialties.filter((x) => x !== s))
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={profileMutation.isPending}
            >
              {profileMutation.isPending ? tr.saving : tr.saveProfile}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Opening hours */}
      <Card>
        <CardHeader>
          <CardTitle>{tr.openingHours}</CardTitle>
          <CardDescription>
            {tr.openingHoursHint}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <WeeklyScheduleEditor value={schedule} onChange={setSchedule} />
          <Button
            className="bg-teal-600 hover:bg-teal-700"
            onClick={handleSaveHours}
            disabled={hoursMutation.isPending}
          >
            {hoursMutation.isPending ? tr.saving : tr.saveOpeningHours}
          </Button>
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardHeader>
          <CardTitle>{tr.services}</CardTitle>
          <CardDescription>
            {tr.servicesHint}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.length > 0 ? (
            <div className="space-y-3">
              {services.map((service, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs text-gray-500">Name</Label>
                      <Input
                        value={service.name}
                        onChange={(e) =>
                          patchService(index, { name: e.target.value })
                        }
                        placeholder={tr.servicePlaceholder}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Price (DA)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={service.price}
                        onChange={(e) =>
                          patchService(index, { price: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">
                        {tr.durationMinutes}
                      </Label>
                      <Input
                        type="number"
                        min={5}
                        value={service.durationMinutes}
                        onChange={(e) =>
                          patchService(index, {
                            durationMinutes: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Description</Label>
                    <Textarea
                      rows={2}
                      value={service.description}
                      onChange={(e) =>
                        patchService(index, { description: e.target.value })
                      }
                      placeholder={tr.optionalDescription}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.isActive}
                        onCheckedChange={(checked) =>
                          patchService(index, { isActive: checked })
                        }
                      />
                      <span className="text-sm text-gray-600">
                        {service.isActive ? tr.active : tr.inactive}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setServices(services.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {tr.noServicesYet}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setServices([
                  ...services,
                  {
                    name: "",
                    description: "",
                    price: "0",
                    durationMinutes: "30",
                    isActive: true,
                  },
                ])
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              {tr.addService}
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={handleSaveServices}
              disabled={servicesMutation.isPending}
            >
              {servicesMutation.isPending ? tr.saving : tr.saveServices}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
