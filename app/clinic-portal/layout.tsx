"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LogOut,
  Building2,
  LayoutDashboard,
  Stethoscope,
  Calendar,
  Settings,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ClinicUser {
  _id: string;
  fullName?: string;
  name?: string;
  email: string;
  avatar?: { url?: string };
}

/**
 * Login and register sit outside the token gate. They are NOT protected by
 * `proxy.ts` either — that middleware only gates `/dashboard*`, and the clinic
 * portal deliberately stays out of the NextAuth session like `/doctor` does.
 */
const PUBLIC_ROUTES = ["/clinic-portal/login", "/clinic-portal/register"];

const NAV_ITEMS = [
  { name: "Dashboard", href: "/clinic-portal", icon: LayoutDashboard },
  { name: "Doctors", href: "/clinic-portal/doctors", icon: Stethoscope },
  { name: "Appointments", href: "/clinic-portal/appointments", icon: Calendar },
  { name: "Settings", href: "/clinic-portal/settings", icon: Settings },
  { name: "Activity", href: "/clinic-portal/audit", icon: ScrollText },
];

export default function ClinicPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [clinic, setClinic] = useState<ClinicUser | null>(null);
  const [checked, setChecked] = useState(false);

  const isPublic = PUBLIC_ROUTES.includes(pathname || "");

  useEffect(() => {
    const token = localStorage.getItem("clinic_token");
    const raw = localStorage.getItem("clinic_user");

    if (isPublic) {
      setChecked(true);
      return;
    }

    if (!token || !raw) {
      router.replace("/clinic-portal/login");
      return;
    }

    try {
      setClinic(JSON.parse(raw));
    } catch {
      router.replace("/clinic-portal/login");
      return;
    }
    setChecked(true);
  }, [pathname, router, isPublic]);

  const handleLogout = () => {
    localStorage.removeItem("clinic_token");
    localStorage.removeItem("clinic_user");
    toast.success("Logged out");
    router.push("/clinic-portal/login");
  };

  if (!checked) return null;
  if (isPublic) return <>{children}</>;

  const displayName = clinic?.name || clinic?.fullName || "Clinic";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo + portal label */}
          <div className="flex items-center gap-3">
            <div className="relative w-24 h-10">
              <Image
                src="/logo.png"
                alt="Docmobi"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-teal-700 bg-teal-50 px-3 py-1 rounded-full text-xs font-medium">
              <Building2 size={13} />
              Clinic Portal
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 border-2 border-teal-100">
                <AvatarImage src={clinic?.avatar?.url} />
                <AvatarFallback className="bg-teal-600 text-white text-sm font-semibold">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-right leading-tight">
                <p className="text-sm font-semibold text-gray-800">
                  {displayName}
                </p>
                {clinic?.email && (
                  <p className="text-xs text-gray-500">{clinic.email}</p>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} className="mr-1" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>

        {/* Nav */}
        <nav className="border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/clinic-portal"
                  ? pathname === "/clinic-portal"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 text-sm border-b-2 whitespace-nowrap transition-colors",
                    isActive
                      ? "border-teal-600 text-teal-700 font-medium"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  )}
                >
                  <Icon size={16} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
