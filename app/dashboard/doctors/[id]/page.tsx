"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { doctorsAPI, earningsAPI } from "@/lib/api-client";
import { CardSkeleton } from "@/components/skeletons";
import {
  ArrowLeft,
  Mail,
  Phone,
  Stethoscope,
  Calendar,
  Wallet,
  Video,
  MapPin,
} from "lucide-react";

export default function DoctorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = String(params?.id || "");

  // Date-range filter (applied values vs. the inputs being edited)
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [range, setRange] = useState<{ startDate: string; endDate: string }>({
    startDate: "",
    endDate: "",
  });

  const { data: detailResponse, isLoading: isDoctorLoading } = useQuery({
    queryKey: ["doctor-detail", doctorId],
    queryFn: () => doctorsAPI.getDoctorById(doctorId),
    enabled: Boolean(doctorId),
  });
  const doctor = detailResponse?.data?.data || null;

  const { data: earningsResponse, isLoading: isEarningsLoading } = useQuery({
    queryKey: ["doctor-earnings", doctorId, range.startDate, range.endDate],
    queryFn: () =>
      earningsAPI.getDoctorEarnings(doctorId, range.startDate, range.endDate),
    enabled: Boolean(doctorId),
  });
  const earnings = earningsResponse?.data?.data || null;

  const applyRange = () => setRange({ startDate: startInput, endDate: endInput });
  const clearRange = () => {
    setStartInput("");
    setEndInput("");
    setRange({ startDate: "", endDate: "" });
  };

  const money = (n: number | undefined) =>
    `${(n ?? 0).toLocaleString()} DA`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Doctor Details</h1>
          <p className="text-gray-600">Profile and earnings breakdown</p>
        </div>
      </div>

      {/* Profile card */}
      {isDoctorLoading ? (
        <CardSkeleton />
      ) : doctor ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={doctor.avatar?.url || "/placeholder.svg"}
                  alt={doctor.fullName}
                />
                <AvatarFallback>{doctor.fullName?.charAt(0) || "D"}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-xl font-semibold">{doctor.fullName || "N/A"}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Stethoscope className="h-4 w-4" />
                    {doctor.specialty || doctor.specialties?.[0] || "N/A"}
                  </span>
                  {doctor.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" /> {doctor.email}
                    </span>
                  )}
                  {doctor.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" /> {doctor.phone}
                    </span>
                  )}
                  {(doctor.wilaya || doctor.commune) && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {[doctor.commune, doctor.wilaya].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="mt-1">
                  Fee: {money(doctor.fees?.amount)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Doctor not found
          </CardContent>
        </Card>
      )}

      {/* Date-range filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter earnings by period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">From</label>
              <Input
                type="date"
                value={startInput}
                max={endInput || undefined}
                onChange={(e) => setStartInput(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-600 mb-1 block">To</label>
              <Input
                type="date"
                value={endInput}
                min={startInput || undefined}
                onChange={(e) => setEndInput(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={applyRange} className="bg-blue-600 hover:bg-blue-700">
                Apply
              </Button>
              <Button variant="outline" onClick={clearRange}>
                All time
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {range.startDate || range.endDate
              ? `Showing ${range.startDate || "the beginning"} → ${range.endDate || "today"}`
              : "Showing all-time earnings"}
          </p>
        </CardContent>
      </Card>

      {/* Earnings stats */}
      {isEarningsLoading ? (
        <CardSkeleton />
      ) : earnings ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Doctor Earnings"
              value={money(earnings.doctorEarnings)}
              icon={Wallet}
              color="bg-green-100"
              iconColor="text-green-600"
            />
            <StatCard
              title="Admin Earnings"
              value={money(earnings.adminEarnings)}
              icon={Wallet}
              color="bg-blue-100"
              iconColor="text-blue-600"
            />
            <StatCard
              title="Completed Appointments"
              value={String(earnings.totalAppointments ?? 0)}
              icon={Calendar}
              color="bg-purple-100"
              iconColor="text-purple-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Stethoscope className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Physical visits</p>
                  <p className="text-lg font-bold">
                    {earnings.physical?.count ?? 0} · {money(earnings.physical?.earnings)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-4">
                <div className="bg-sky-100 p-3 rounded-lg">
                  <Video className="h-6 w-6 text-sky-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Video consultations</p>
                  <p className="text-lg font-bold">
                    {earnings.video?.count ?? 0} · {money(earnings.video?.earnings)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
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
