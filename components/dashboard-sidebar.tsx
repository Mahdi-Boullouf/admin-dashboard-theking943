"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  UserCog,
  Building2,
  Calendar,
  LayoutGrid,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // Sidebar mobile toggle
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Modal toggle

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  const menuItems = [
    { name: "Home", icon: Home, href: "/dashboard" },
    { name: "Doctor's", icon: UserCog, href: "/dashboard/doctors" },
    { name: "Clinics", icon: Building2, href: "/dashboard/clinics" },
    { name: "Earnings", icon: Wallet, href: "/dashboard/earnings" },
    { name: "Patients", icon: Users, href: "/dashboard/patients" },
    { name: "Referral Code", icon: Users, href: "/dashboard/referral" },
    { name: "Appointments", icon: Calendar, href: "/dashboard/appointments" },
    { name: "Category", icon: LayoutGrid, href: "/dashboard/categories" },
  ];

  return (
    <>
      {/* Sidebar logic remains the same... */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-[#2DA2BB] text-white p-5 flex flex-col z-40 transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col items-center justify-center mb-10 mt-4">
          <div className="relative w-32 h-20">
            <Image src="/logo.png" alt="Docmobi Logo" fill className="object-contain" priority />
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all",
                  isActive
                    ? "bg-[#5E72E4] border-[#5E72E4] font-medium shadow-md"
                    : "bg-white/10 border-white/20 hover:bg-white/20"
                )}
              >
                <Icon size={20} />
                <span className="text-[15px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 pt-6 border-t border-white/10">
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border bg-white/10 border-white/20 hover:bg-white/20 transition-all",
              pathname === "/dashboard/settings" && "bg-white/20"
            )}
          >
            <Settings size={20} />
            <span className="text-[15px]">Settings</span>
          </Link>

          {/* Trigger Modal instead of direct logout */}
          <Button
            onClick={() => setShowLogoutModal(true)}
            className="w-full justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-6 rounded-xl border-none"
          >
            <LogOut size={20} />
            Log Out
          </Button>
        </div>
      </aside>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm Logout</DialogTitle>
            <DialogDescription className="py-4 text-base">
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-3 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 sm:flex-none"
            >
              No, Stay
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex-1 sm:flex-none bg-red-600"
            >
              Yes, Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}