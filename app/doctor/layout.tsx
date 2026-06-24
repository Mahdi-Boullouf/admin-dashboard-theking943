"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { LogOut, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { t, getLang, setLang, type Lang } from "@/lib/doctor-i18n";

interface DoctorUser {
  _id: string;
  fullName: string;
  email: string;
  specialty?: string;
  avatar?: { url?: string };
}

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [doctor, setDoctor] = useState<DoctorUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    setLangState(getLang());

    const token = localStorage.getItem("doctor_token");
    const raw = localStorage.getItem("doctor_user");

    if (pathname === "/doctor/login") {
      setChecked(true);
      return;
    }

    if (!token || !raw) {
      router.replace("/doctor/login");
      return;
    }

    try {
      setDoctor(JSON.parse(raw));
    } catch {
      router.replace("/doctor/login");
      return;
    }
    setChecked(true);
  }, [pathname, router]);

  const toggleLang = () => {
    const next: Lang = lang === "fr" ? "en" : "fr";
    setLang(next);
    setLangState(next);
  };

  const handleLogout = () => {
    localStorage.removeItem("doctor_token");
    localStorage.removeItem("doctor_user");
    toast.success(t[lang].logout);
    router.push("/doctor/login");
  };

  if (!checked) return null;
  if (pathname === "/doctor/login") return <>{children}</>;

  const tr = t[lang];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo + portal label */}
          <div className="flex items-center gap-3">
            <div className="relative w-24 h-10">
              <Image src="/logo.png" alt="Docmobi" fill className="object-contain" priority />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs font-medium">
              <Stethoscope size={13} />
              {tr.doctorPortal}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              {lang === "fr" ? "EN" : "FR"}
            </button>

            {/* Doctor info */}
            <div className="flex items-center gap-2.5">
              <Avatar className="h-9 w-9 border-2 border-blue-100">
                <AvatarImage src={doctor?.avatar?.url} />
                <AvatarFallback className="bg-blue-600 text-white text-sm font-semibold">
                  {doctor?.fullName?.charAt(0) ?? "D"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-right leading-tight">
                <p className="text-sm font-semibold text-gray-800">
                  Dr. {doctor?.fullName ?? "Doctor"}
                </p>
                {doctor?.specialty && (
                  <p className="text-xs text-gray-500">{doctor.specialty}</p>
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
              <span className="hidden sm:inline">{tr.logout}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
