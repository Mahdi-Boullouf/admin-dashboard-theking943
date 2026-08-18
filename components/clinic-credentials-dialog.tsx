"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Check, KeyRound, ShieldAlert } from "lucide-react";

export type DoctorCredentials = {
  doctorId?: string;
  username?: string;
  temporaryPassword?: string;
};

/**
 * The backend returns a doctor's credentials exactly ONCE — on creation and on
 * reset-access — and can never produce them again. The dialog therefore has no
 * close button and ignores escape / outside clicks: it can only be dismissed
 * after the clinic ticks "I have saved these".
 */
export function ClinicCredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: DoctorCredentials | null;
  onClose: () => void;
}) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (credentials) {
      setAcknowledged(false);
      setCopied(false);
    }
  }, [credentials]);

  const credentialsText = credentials
    ? [
        `Doctor ID: ${credentials.doctorId ?? ""}`,
        `Username: ${credentials.username ?? ""}`,
        `Temporary password: ${credentials.temporaryPassword ?? ""}`,
      ].join("\n")
    : "";

  const copyCredentials = async () => {
    try {
      await navigator.clipboard.writeText(credentialsText);
      setCopied(true);
      toast.success("Credentials copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy — please write them down manually");
    }
  };

  return (
    <Dialog
      open={Boolean(credentials)}
      onOpenChange={(open) => {
        if (!open && acknowledged) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-600" />
            Doctor credentials
          </DialogTitle>
          <DialogDescription>
            Give these to the doctor now. They are shown once and cannot be
            retrieved again.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            If you lose them, you will have to reset the doctor&apos;s access to
            generate a new password.
          </p>
        </div>

        <div className="space-y-3">
          <CredentialRow label="Doctor ID" value={credentials?.doctorId} />
          <CredentialRow label="Username" value={credentials?.username} />
          <CredentialRow
            label="Temporary password"
            value={credentials?.temporaryPassword}
          />
        </div>

        <Button variant="outline" onClick={copyCredentials} className="w-full">
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? "Copied" : "Copy all credentials"}
        </Button>

        <div className="flex items-start gap-2 pt-1">
          <Checkbox
            id="credentials-ack"
            checked={acknowledged}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
          />
          <Label htmlFor="credentials-ack" className="cursor-pointer leading-snug">
            I have saved these credentials
          </Label>
        </div>

        <Button
          className="w-full bg-teal-600 hover:bg-teal-700"
          disabled={!acknowledged}
          onClick={onClose}
        >
          Done
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-mono text-sm bg-gray-100 border rounded px-3 py-2 break-all select-all">
        {value || "—"}
      </p>
    </div>
  );
}
