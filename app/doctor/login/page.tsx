"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Eye, EyeOff, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { doctorAuthAPI } from "@/lib/doctor-api";
import { t, getLang, setLang, type Lang } from "@/lib/doctor-i18n";

export default function DoctorLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    setLangState(getLang());
    if (localStorage.getItem("doctor_token")) {
      router.replace("/doctor/my-appointments");
    }
  }, [router]);

  const toggleLang = () => {
    const next: Lang = lang === "fr" ? "en" : "fr";
    setLang(next);
    setLangState(next);
  };

  const tr = t[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(tr.fillAllFields);
      return;
    }
    setIsLoading(true);
    try {
      const res = await doctorAuthAPI.login(email, password);
      const { data } = res.data;

      if (data?.user?.role !== "doctor") {
        toast.error(tr.accessDenied);
        return;
      }

      localStorage.setItem("doctor_token", data.accessToken);
      localStorage.setItem("doctor_user", JSON.stringify(data.user));
      toast.success(`${tr.welcome} ${data.user.fullName?.split(" ")[0] ?? ""}`);
      router.push("/doctor/my-appointments");
    } catch (err: any) {
      toast.error(err.response?.data?.message || tr.invalidCredentials);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="fixed top-4 right-4 text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-300 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm"
      >
        {lang === "fr" ? "EN" : "FR"}
      </button>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center pb-2">
          <div className="relative w-32 h-20 mx-auto">
            <Image src="/logo.png" alt="Docmobi" fill className="object-contain" priority />
          </div>
          <div className="flex items-center justify-center gap-2 text-blue-700">
            <Stethoscope size={20} />
            <span className="font-semibold text-base">{tr.doctorPortal}</span>
          </div>
          <CardDescription>{tr.signInSubtitle}</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{tr.emailAddress}</Label>
              <Input
                id="email"
                type="email"
                placeholder={tr.emailPlaceholder}
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
              className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? tr.signingIn : tr.signIn}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
