"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { clinicDashboardAPI } from "@/lib/clinic-api";
import { StatsSkeleton, ChartSkeleton } from "@/components/skeletons";
import {
  Stethoscope,
  UserCheck,
  CalendarDays,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

export default function ClinicDashboardPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["clinic-dashboard"],
    queryFn: () => clinicDashboardAPI.getDashboard(),
  });

  const data = response?.data?.data;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <StatsSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  const stats = [
    {
      title: "Doctors",
      value: data?.doctorCount ?? 0,
      icon: Stethoscope,
      color: "bg-teal-100",
      iconColor: "text-teal-600",
    },
    {
      title: "Active Doctors",
      value: data?.activeDoctorCount ?? 0,
      icon: UserCheck,
      color: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Today's Appointments",
      value: data?.todayAppointmentCount ?? 0,
      icon: CalendarDays,
      color: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Unique Patients",
      value: data?.uniquePatientCount ?? 0,
      icon: Users,
      color: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  const chartData = (data?.weeklyTrend || []).map((point: any) => ({
    name: point.date?.slice(5) || "",
    appointments: point.count ?? 0,
  }));

  const appointmentStats = data?.appointmentStats || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          An overview of your clinic&apos;s doctors and appointments
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {Number(stat.value).toLocaleString()}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className={`${stat.iconColor} h-6 w-6`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Appointment status breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["pending", "accepted", "completed", "cancelled"].map((key) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 capitalize">{key}</p>
              <p className="text-2xl font-bold text-gray-900">
                {appointmentStats[key] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly trend */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments — last 7 days</CardTitle>
          <CardDescription>
            Daily appointment volume across all your doctors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="#0D9488"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No appointment data yet
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming appointments</CardTitle>
              <CardDescription>The next appointments booked</CardDescription>
            </div>
            <Link href="/clinic-portal/appointments">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.upcomingAppointments?.length ? (
              <div className="space-y-3">
                {data.upcomingAppointments.map((appt: any) => (
                  <div
                    key={appt._id}
                    className="flex items-center gap-3 border rounded-lg p-3"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={appt.patient?.avatar?.url} />
                      <AvatarFallback>
                        {appt.patient?.fullName?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {appt.patient?.fullName || "Patient"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Dr. {appt.doctor?.fullName || "—"} ·{" "}
                        {appt.appointmentDate
                          ? new Date(appt.appointmentDate).toLocaleDateString()
                          : "—"}{" "}
                        {appt.time || ""}
                      </p>
                    </div>
                    <Badge className={statusColor(appt.status)}>
                      {appt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No upcoming appointments
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctors available now */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Available now
              </CardTitle>
              <CardDescription>
                Doctors whose hours cover the current time
              </CardDescription>
            </div>
            <Link href="/clinic-portal/doctors">
              <Button variant="ghost" size="sm">
                All doctors
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data?.doctorsAvailableNow?.length ? (
              <div className="space-y-3">
                {data.doctorsAvailableNow.map((doctor: any) => (
                  <div
                    key={doctor._id}
                    className="flex items-center gap-3 border rounded-lg p-3"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={doctor.avatar?.url} />
                      <AvatarFallback>
                        {doctor.fullName?.charAt(0) || "D"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        Dr. {doctor.fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {doctor.specialty || "—"} · {doctor.doctorId || ""}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Available
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No doctors available right now
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
