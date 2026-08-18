"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Eye,
  EyeOff,
  Building2,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Upload,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clinicAuthAPI } from "@/lib/clinic-api";
import type { DaySchedule } from "@/lib/clinic-api";
import { ALGERIA_WILAYAS } from "@/lib/algeria-wilayas";
import {
  WeeklyScheduleEditor,
  emptyWeeklySchedule,
  validateWeeklySchedule,
} from "@/components/weekly-schedule-editor";
import { cn } from "@/lib/utils";

const STEPS = [
  { title: "Account", description: "Clinic identity and login" },
  { title: "Location", description: "Where patients will find you" },
  { title: "Profile", description: "Specialties and opening hours" },
  { title: "Documents", description: "Logo and proof of registration" },
];

const MAX_DOCUMENTS = 5;

export default function ClinicRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    clinicName: "",
    managerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    wilaya: "",
    commune: "",
    lat: "",
    lng: "",
  });

  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(
    emptyWeeklySchedule()
  );
  const [logo, setLogo] = useState<File | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);

  const setField = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
    if (specialties.includes(value)) {
      setSpecialtyInput("");
      return;
    }
    setSpecialties([...specialties, value]);
    setSpecialtyInput("");
  };

  const handleDocumentsChange = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files);
    const next = [...documents, ...incoming].slice(0, MAX_DOCUMENTS);
    if (documents.length + incoming.length > MAX_DOCUMENTS) {
      toast.error(`You can upload at most ${MAX_DOCUMENTS} documents`);
    }
    setDocuments(next);
  };

  /** Returns an error message for the given step, or null if it can be left. */
  const validateStep = (index: number): string | null => {
    if (index === 0) {
      if (!form.clinicName.trim()) return "Clinic name is required";
      if (!form.managerName.trim()) return "Manager name is required";
      if (!form.email.trim()) return "Email is required";
      if (!form.phone.trim()) return "Phone is required";
      if (form.password.length < 6)
        return "Password must be at least 6 characters";
      if (form.password !== form.confirmPassword)
        return "Passwords do not match";
      return null;
    }
    if (index === 1) {
      if (!form.address.trim()) return "Address is required";
      if (!form.wilaya) return "Wilaya is required";
      if (!form.commune.trim()) return "Commune is required";
      return null;
    }
    if (index === 2) {
      return validateWeeklySchedule(weeklySchedule);
    }
    return null;
  };

  const goNext = () => {
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Re-check every step: a user can jump back and break an earlier one.
    for (let i = 0; i < STEPS.length; i++) {
      const error = validateStep(i);
      if (error) {
        toast.error(error);
        setStep(i);
        return;
      }
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append("clinicName", form.clinicName.trim());
      data.append("managerName", form.managerName.trim());
      data.append("email", form.email.trim());
      data.append("password", form.password);
      data.append("confirmPassword", form.confirmPassword);
      data.append("phone", form.phone.trim());
      data.append("address", form.address.trim());
      data.append("wilaya", form.wilaya);
      data.append("commune", form.commune.trim());
      if (form.lat) data.append("lat", form.lat);
      if (form.lng) data.append("lng", form.lng);
      // Arrays travel as JSON strings — multipart has no notion of structure.
      data.append("specialties", JSON.stringify(specialties));
      data.append("weeklySchedule", JSON.stringify(weeklySchedule));
      if (logo) data.append("logo", logo);
      documents.forEach((file) => data.append("verificationDocuments", file));

      await clinicAuthAPI.register(data);
      setSubmitted(true);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          "Registration failed. Please check your details and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardContent className="pt-10 pb-8 text-center space-y-4">
            <CheckCircle2 className="h-14 w-14 text-green-600 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">
              Registration submitted
            </h1>
            <p className="text-gray-600">
              Your clinic account has been created and is now waiting for an
              administrator to verify your documents. You will not be able to
              sign in until it is approved.
            </p>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => router.push("/clinic-portal/login")}
            >
              Go to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="relative w-32 h-16 mx-auto">
            <Image
              src="/logo.png"
              alt="Docmobi"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-teal-700">
            <Building2 size={20} />
            <span className="font-semibold text-base">
              Register your clinic
            </span>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex-1 flex items-center gap-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold",
                    i < step
                      ? "bg-teal-600 text-white"
                      : i === step
                      ? "bg-teal-100 text-teal-700 ring-2 ring-teal-600"
                      : "bg-white text-gray-400 border"
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <p
                  className={cn(
                    "text-xs mt-1 text-center",
                    i === step ? "text-teal-700 font-medium" : "text-gray-500"
                  )}
                >
                  {s.title}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 -mt-5",
                    i < step ? "bg-teal-600" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>{STEPS[step].title}</CardTitle>
              <CardDescription>{STEPS[step].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1 — account */}
              {step === 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clinicName">
                        Clinic name <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="clinicName"
                        value={form.clinicName}
                        onChange={(e) => setField("clinicName", e.target.value)}
                        placeholder="Clinique El Amel"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="managerName">
                        Manager name <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="managerName"
                        value={form.managerName}
                        onChange={(e) => setField("managerName", e.target.value)}
                        placeholder="Full name of the responsible manager"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        placeholder="clinic@example.com"
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        Phone <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        placeholder="0555 00 00 00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Password <span className="text-red-600">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) => setField("password", e.target.value)}
                          placeholder="At least 6 characters"
                          className="pr-10"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm password <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setField("confirmPassword", e.target.value)
                        }
                        placeholder="Repeat your password"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Step 2 — location */}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="address">
                      Address <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => setField("address", e.target.value)}
                      placeholder="Street, building, floor"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wilaya">
                        Wilaya <span className="text-red-600">*</span>
                      </Label>
                      <Select
                        value={form.wilaya}
                        onValueChange={(val) => setField("wilaya", val)}
                      >
                        <SelectTrigger id="wilaya">
                          <SelectValue placeholder="Select a wilaya" />
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
                      <Label htmlFor="commune">
                        Commune <span className="text-red-600">*</span>
                      </Label>
                      <Input
                        id="commune"
                        value={form.commune}
                        onChange={(e) => setField("commune", e.target.value)}
                        placeholder="Commune"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lat">Latitude (optional)</Label>
                      <Input
                        id="lat"
                        value={form.lat}
                        onChange={(e) => setField("lat", e.target.value)}
                        placeholder="36.7538"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng">Longitude (optional)</Label>
                      <Input
                        id="lng"
                        value={form.lng}
                        onChange={(e) => setField("lng", e.target.value)}
                        placeholder="3.0588"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Coordinates let patients find you on the map. You can add
                    them later from your settings.
                  </p>
                </>
              )}

              {/* Step 3 — profile */}
              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Specialties</Label>
                    <div className="flex gap-2">
                      <Input
                        id="specialty"
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            // Enter must not submit the whole multi-step form.
                            e.preventDefault();
                            addSpecialty();
                          }
                        }}
                        placeholder="e.g. Cardiology — press Enter to add"
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
                                setSpecialties(
                                  specialties.filter((x) => x !== s)
                                )
                              }
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label>Opening hours</Label>
                    <WeeklyScheduleEditor
                      value={weeklySchedule}
                      onChange={setWeeklySchedule}
                    />
                  </div>
                </>
              )}

              {/* Step 4 — documents */}
              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="logo">Clinic logo (optional)</Label>
                    <div className="flex items-center gap-4">
                      {logoPreview && (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-14 w-14 rounded-lg object-cover border"
                        />
                      )}
                      <Input
                        id="logo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setLogo(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documents">
                      Verification documents (up to {MAX_DOCUMENTS})
                    </Label>
                    <Input
                      id="documents"
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={(e) => handleDocumentsChange(e.target.files)}
                    />
                    <p className="text-xs text-gray-500">
                      Images or PDF. Include your business registration and any
                      health-authority approval — an administrator reviews these
                      before your account is activated.
                    </p>
                    {documents.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {documents.map((file, i) => (
                          <div
                            key={`${file.name}-${i}`}
                            className="flex items-center gap-2 border rounded-lg p-2 text-sm"
                          >
                            <FileText className="h-4 w-4 text-teal-600" />
                            <span className="flex-1 truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setDocuments(
                                  documents.filter((_, idx) => idx !== i)
                                )
                              }
                              className="text-gray-400 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900 flex gap-2">
                    <Upload className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      After submitting, your account stays pending until an
                      administrator verifies it. You will not be able to sign in
                      before then.
                    </p>
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0 || isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>

                {step < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={goNext}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-teal-600 hover:bg-teal-700"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "Submitting..." : "Submit registration"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already registered?{" "}
          <Link
            href="/clinic-portal/login"
            className="text-teal-700 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
