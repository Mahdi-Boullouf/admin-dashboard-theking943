"use client";

import { useClinicLang } from "@/components/clinic-lang";
import type { Dict } from "@/lib/clinic-i18n";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clinicAuditAPI } from "@/lib/clinic-api";
import { TableSkeleton } from "@/components/skeletons";

const ITEMS_PER_PAGE = 20;

/**
 * `action` is a free-form dotted string on the backend ("clinic.doctor.create"),
 * deliberately not an enum — so this map is a best-effort prettifier with a
 * generic fallback rather than an exhaustive switch.
 */
const ACTION_KEYS: Record<string, keyof Dict> = {
  "clinic.doctor.create": "actCreateDoctor",
  "clinic.doctor.invite": "actInviteDoctor",
  "clinic.doctor.update": "actUpdateDoctor",
  "clinic.doctor.schedule": "actDoctorSchedule",
  "clinic.doctor.status": "actDoctorStatus",
  "clinic.doctor.remove": "actRemoveDoctor",
  "clinic.doctor.reset_access": "actResetAccess",
  "clinic.profile.update": "actProfileUpdate",
  "clinic.services.update": "actServicesUpdate",
  "clinic.working_hours.update": "actHoursUpdate",
  "clinic.register": "actRegister",
  "clinic.verification.update": "actVerification",
  "clinic.logo.delete": "actLogoDelete",
};

const prettyAction = (action: string, tr: Dict) => {
  const key = ACTION_KEYS[action];
  if (key) return tr[key] as string;
  // Unknown dotted action: fall back to a readable form of the raw string.
  return String(action || "")
    .split(".")
    .join(" ")
    .replace(/_/g, " ");
};

const actionColor = (action: string) => {
  const value = String(action || "");
  if (value.includes("remove") || value.includes("delete"))
    return "bg-red-100 text-red-800";
  if (value.includes("create") || value.includes("invite"))
    return "bg-green-100 text-green-800";
  if (value.includes("reset") || value.includes("status"))
    return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
};

export default function ClinicAuditPage() {
  const { tr } = useClinicLang();
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ["clinic-audit", page],
    queryFn: () => clinicAuditAPI.getAuditLog(page, ITEMS_PER_PAGE),
  });

  const rows = response?.data?.data || [];
  const totalResults = response?.data?.pagination?.total || 0;
  const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{tr.auditLogTitle}</h1>
        <p className="text-gray-600 mt-2">
          Every administrative action taken on your clinic
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{tr.history}</CardTitle>
          <CardDescription>
            Showing {rows.length} of {totalResults} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={ITEMS_PER_PAGE} />
          ) : rows.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tr.when}</TableHead>
                    <TableHead>{tr.action}</TableHead>
                    <TableHead>{tr.performedBy}</TableHead>
                    <TableHead>{tr.target}</TableHead>
                    <TableHead>{tr.details}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row: any) => (
                    <TableRow key={row._id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={actionColor(row.action)}>
                          {prettyAction(row.action, tr)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <p className="font-medium">
                          {row.actor?.fullName || "—"}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {row.actorRole || row.actor?.role || ""}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.targetType || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-600 max-w-xs">
                        {row.meta && Object.keys(row.meta).length > 0 ? (
                          <span className="break-words">
                            {Object.entries(row.meta)
                              .map(
                                ([key, value]) =>
                                  `${key}: ${
                                    Array.isArray(value)
                                      ? value.join(", ")
                                      : typeof value === "object"
                                      ? JSON.stringify(value)
                                      : String(value)
                                  }`
                              )
                              .join(" · ")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No activity recorded yet
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
  );
}
