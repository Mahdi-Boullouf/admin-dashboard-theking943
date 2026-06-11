"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { earningsAPI } from "@/lib/api-client";
import { CardSkeleton, TableSkeleton } from "@/components/skeletons";
import {
  DollarSign,
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

export default function EarningsPage() {
  const [page, setPage] = useState(1);
  const [period, setPeriod] = useState("all");

  const { data: response, isLoading } = useQuery({
    queryKey: ["earnings-overview", period],
    queryFn: () => earningsAPI.getEarningsOverview(period),
  });

  const dashboardData = response?.data?.data;
  const allDoctors = dashboardData?.doctors || [];

  // The earnings endpoint returns ALL doctors at once, so paginate client-side.
  const PAGE_SIZE = 10;
  const totalResults = allDoctors.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const doctors = allDoctors.slice(startIdx, startIdx + PAGE_SIZE);

  const stats = [
    {
      title: "Total Earnings",
      value: `${(dashboardData?.totalDoctorFees ?? dashboardData?.totalEarnings ?? 0).toLocaleString()}`,
      change: "+ 36%", // Static for UI matching, or dashboardData?.earningsChange
      icon: "",
      color: "bg-[#E6F9F1]", // Light green
      iconColor: "text-[#22C55E]",
      borderColor: "border-b-4 border-green-500",
      image: "/Algerian-dinar.png",
    },
    {
      title: "Appointments",
      value: dashboardData?.totalAppointments || 0,
      change: "- 14%",
      icon: Calendar,
      color: "bg-[#F3E8FF]", // Light purple
      iconColor: "text-[#A855F7]",
      borderColor: "border-b-4 border-purple-500",
      image: "",
    },
    {
      title: "Avg per Doctor",
      value: `${dashboardData?.avgPerDoctor?.toFixed(2) || "0.00"}`,
      change: "- 14%",
      icon: Users,
      color: "bg-[#FFEFED]", // Light red/pink
      iconColor: "text-[#F87171]",
      borderColor: "border-b-4 border-red-400",
      image: "/Algerian-dinar.png",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Doctors Management
          </h1>
          <p className="text-slate-500">
            Track doctor-wise earnings and completed appointments
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <Button
            variant={period === "all" ? "default" : "ghost"}
            onClick={() => { setPeriod("all"); setPage(1); }}
            className={`rounded-md px-6 ${period === "all" ? "bg-[#3B82F6]" : ""}`}
          >
            All Time
          </Button>
          <Button
            variant={period === "weekly" ? "default" : "ghost"}
            onClick={() => { setPeriod("weekly"); setPage(1); }}
            className={`rounded-md px-6 ${period === "weekly" ? "bg-[#3B82F6]" : ""}`}
          >
            Weekly View
          </Button>
          <Button
            variant={period === "monthly" ? "default" : "ghost"}
            onClick={() => { setPeriod("monthly"); setPage(1); }}
            className={`rounded-md px-6 ${period === "monthly" ? "bg-[#3B82F6]" : ""}`}
          >
            Monthly View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          <CardSkeleton />
        ) : (
          stats.map((stat, i) => (
            <Card
              key={i}
              className={`border-none shadow-sm ${stat.borderColor}`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`${stat.color} p-2 rounded-lg`}>
                        {stat.icon ? <stat.icon className={`${stat.iconColor} h -5 w-5`} /> : <img src={stat.image} alt="" className="h-5 w-5" />}
                      </div>
                      <span className="text-sm font-medium text-slate-500">
                        {stat.title}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                       {stat.image && <Image src={stat.image} alt="" className="h-6 w-6" width={32} height={32} /> }{stat.value}
                      </h2>
                      {/* <div className="flex items-center mt-1">
                        <span
                          className={`text-xs font-bold ${stat.change.includes("+") ? "text-green-500" : "text-red-500"}`}
                        >
                          {stat.change} {stat.change.includes("+") ? "↑" : "↓"}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-2 uppercase font-semibold">
                          This Month
                        </span>
                      </div> */}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Doctors Table */}
      <Card className="border-none shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-5 px-6 font-bold text-slate-800">
                  Doctor Name
                </TableHead>
                <TableHead className="font-bold text-slate-800">
                  Speciality
                </TableHead>
                <TableHead className="font-bold text-slate-800">
                  Appointment
                </TableHead>
                <TableHead className="font-bold text-slate-800">
                  EARNINGS
                </TableHead>
                <TableHead className="font-bold text-slate-800">
                  DETAILS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : (
                doctors.map((doc: any, idx: number) => (
                  <TableRow key={idx} className="border-slate-50">
                    <TableCell className="py-4 px-6 font-medium text-slate-600">
                      {doc.doctorName}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {doc.specialty}
                    </TableCell>
                    <TableCell className="text-slate-600 font-semibold">
                      {doc.appointments}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900 flex items-center gap-2 ">
                      <Image
                        src="/Algerian-dinar.png"
                        alt="Dinar"
                        width={32}
                        height={32}
                        className="h-6 w-6"
                      />
                      ${doc.earnings.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                      >
                        {idx === 1 ? (
                          <>
                            <ChevronUp className="h-4 w-4" /> Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" /> View
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="p-6 flex items-center justify-between border-t border-slate-50">
            <span className="text-sm text-slate-400">
              {totalResults === 0
                ? "No results"
                : `Showing ${startIdx + 1} to ${Math.min(
                    startIdx + PAGE_SIZE,
                    totalResults,
                  )} of ${totalResults} results`}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-slate-400 border-slate-200"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  variant={n === currentPage ? "default" : "outline"}
                  className={`h-8 w-8 p-0 ${n === currentPage ? "bg-blue-600" : "text-slate-500 border-slate-200"}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-slate-400 border-slate-200"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
