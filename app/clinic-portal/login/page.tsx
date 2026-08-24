"use client";

import { useClinicLang } from "@/components/clinic-lang";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Eye, EyeOff, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { clinicAuthAPI } from "@/lib/clinic-api";

export default function ClinicLoginPage() {
  const { lang, tr, toggle } = useClinicLang();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // A pending / rejected / suspended clinic gets a 403 with an explanatory
  // message. That deserves a persistent banner, not a toast that vanishes.
  const [blockedMessage, setBlockedMessage] = useState("");

  useEffect(() => {
    if (localStorage.getItem("clinic_token")) {
      router.replace("/clinic-portal");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(tr.fillAllFields);
      return;
    }
    setIsLoading(true);
    setBlockedMessage("");
    try {
      const res = await clinicAuthAPI.login(email, password);
      const { data } = res.data;

      if (data?.role !== "clinic" && data?.user?.role !== "clinic") {
        toast.error(tr.notAClinicAccount);
        return;
      }

      localStorage.setItem("clinic_token", data.accessToken);
      localStorage.setItem("clinic_user", JSON.stringify(data.user));
      toast.success(`Welcome back${data.user?.fullName ? `, ${data.user.fullName}` : ""}`);
      router.push("/clinic-portal");
    } catch (err: any) {
      const message = err.response?.data?.message;
      if (err.response?.status === 403 && message) {
        setBlockedMessage(message);
      } else {
        toast.error(message || tr.invalidEmailOrPassword);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-cyan-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center pb-2">
          <div className="relative w-32 h-20 mx-auto">
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
            <span className="font-semibold text-base">{tr.clinicPortal}</span>
            {/* Login sits outside the portal chrome, so it carries its own
                toggle — otherwise the sign-in page is stuck in one language. */}
            <button
              type="button"
              onClick={toggle}
              className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-colors"
            >
              {lang === "fr" ? "EN" : "FR"}
            </button>
          </div>
          <CardDescription>
            {tr.signInSubtitleFull}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {blockedMessage && (
            <div className="mb-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{blockedMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{tr.emailAddress}</Label>
              <Input
                id="email"
                type="email"
                placeholder="clinic@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{tr.password}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                  autoComplete="current-password"
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

            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700 mt-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? tr.signingIn : tr.signIn}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            {tr.noAccountYet}{" "}
            <Link
              href="/clinic-portal/register"
              className="text-teal-700 font-medium hover:underline"
            >
              {tr.registerYourClinic}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
