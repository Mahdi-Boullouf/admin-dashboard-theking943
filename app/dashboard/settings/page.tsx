"use client";

import React from "react";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authAPI, appSettingsAPI } from "@/lib/api-client";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Youtube, Smartphone } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and the mobile app configuration
        </p>
      </div>

      <ChangePasswordCard />
      <TutorialVideosCard />
      <AppVersionCard />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Change Password                                                   */
/* ---------------------------------------------------------------- */
function ChangePasswordCard() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordMutation = useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) =>
      authAPI.changePassword(data.oldPassword, data.newPassword),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to change password");
    },
  });

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (oldPassword === newPassword) {
      toast.error("New password must be different from old password");
      return;
    }
    changePasswordMutation.mutate({ oldPassword, newPassword });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="old-password">Current Password</Label>
            <div className="relative">
              <Input
                id="old-password"
                type={showOldPassword ? "text" : "password"}
                placeholder="••••••••"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={changePasswordMutation.isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={changePasswordMutation.isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-600">
              Must be at least 6 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={changePasswordMutation.isPending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* Tutorial Videos (YouTube links)                                   */
/* ---------------------------------------------------------------- */
function TutorialVideosCard() {
  const queryClient = useQueryClient();
  const [patientVideo, setPatientVideo] = useState("");
  const [doctorVideo, setDoctorVideo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["youtube-links"],
    queryFn: () => appSettingsAPI.getYoutubeLinks(),
  });

  useEffect(() => {
    if (data?.data?.data) {
      setPatientVideo(data.data.data.patientVideo || "");
      setDoctorVideo(data.data.data.doctorVideo || "");
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: { patientVideo: string; doctorVideo: string }) =>
      appSettingsAPI.updateYoutubeLinks(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtube-links"] });
      toast.success("Tutorial videos saved");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save videos");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-600" />
          Tutorial Videos
        </CardTitle>
        <CardDescription>
          "How it works" YouTube links shown to patients and doctors in the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="patient-video">Patient Video URL</Label>
              <Input
                id="patient-video"
                placeholder="https://www.youtube.com/watch?v=..."
                value={patientVideo}
                onChange={(e) => setPatientVideo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doctor-video">Doctor Video URL</Label>
              <Input
                id="doctor-video"
                placeholder="https://www.youtube.com/watch?v=..."
                value={doctorVideo}
                onChange={(e) => setDoctorVideo(e.target.value)}
              />
            </div>
            <Button
              onClick={() =>
                saveMutation.mutate({
                  patientVideo: patientVideo.trim(),
                  doctorVideo: doctorVideo.trim(),
                })
              }
              disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Videos
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ---------------------------------------------------------------- */
/* App Version & Force Update (+ store links)                        */
/* ---------------------------------------------------------------- */
type AppConfig = {
  minAppVersion: number;
  forceUpdateEnabled: boolean;
  androidStoreUrl: string;
  iosStoreUrl: string;
  forceUpdateMessage: string;
};

const EMPTY_CONFIG: AppConfig = {
  minAppVersion: 0,
  forceUpdateEnabled: false,
  androidStoreUrl: "",
  iosStoreUrl: "",
  forceUpdateMessage: "",
};

function AppVersionCard() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AppConfig>(EMPTY_CONFIG);

  const { data, isLoading } = useQuery({
    queryKey: ["app-config"],
    queryFn: () => appSettingsAPI.getAppConfig(),
  });

  useEffect(() => {
    if (data?.data?.data) {
      const d = data.data.data;
      setConfig({
        minAppVersion: Number(d.minAppVersion) || 0,
        forceUpdateEnabled: Boolean(d.forceUpdateEnabled),
        androidStoreUrl: d.androidStoreUrl || "",
        iosStoreUrl: d.iosStoreUrl || "",
        forceUpdateMessage: d.forceUpdateMessage || "",
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: AppConfig) => appSettingsAPI.updateAppConfig(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-config"] });
      toast.success("App version settings saved");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to save settings");
    },
  });

  const handleSave = () => {
    if (config.minAppVersion < 0 || Number.isNaN(config.minAppVersion)) {
      toast.error("Minimum version must be a positive number");
      return;
    }
    saveMutation.mutate(config);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          App Version &amp; Force Update
        </CardTitle>
        <CardDescription>
          Force users on older app versions to update. Any install whose build
          number is <strong>below</strong> the minimum version is blocked — but
          only while the switch below is on. Publish the new version to the
          stores <strong>before</strong> enabling this.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label
                  htmlFor="force-toggle"
                  className="text-base cursor-pointer"
                >
                  Enable Force Update
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  When off, no one is blocked regardless of the version below.
                </p>
              </div>
              <Switch
                id="force-toggle"
                checked={config.forceUpdateEnabled}
                onCheckedChange={(v) =>
                  setConfig((prev) => ({ ...prev, forceUpdateEnabled: v }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-version">Minimum Build Version</Label>
              <Input
                id="min-version"
                type="number"
                min={0}
                placeholder="e.g., 20261"
                value={config.minAppVersion}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    minAppVersion: parseInt(e.target.value, 10) || 0,
                  }))
                }
              />
              <p className="text-xs text-gray-500">
                Users running a build number lower than this are forced to
                update.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="android-url">Android Store URL (Play Store)</Label>
              <Input
                id="android-url"
                placeholder="https://play.google.com/store/apps/details?id=..."
                value={config.androidStoreUrl}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    androidStoreUrl: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ios-url">iOS Store URL (App Store)</Label>
              <Input
                id="ios-url"
                placeholder="https://apps.apple.com/app/id..."
                value={config.iosStoreUrl}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, iosStoreUrl: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Update Message (optional)</Label>
              <Textarea
                id="message"
                rows={3}
                placeholder="A new version of Docmobi is available. Please update to continue."
                value={config.forceUpdateMessage}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    forceUpdateMessage: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-gray-500">
                Shown on the blocking screen. Leave empty to use the default.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saveMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save App Settings
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
