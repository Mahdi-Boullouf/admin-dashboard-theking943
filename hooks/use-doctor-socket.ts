"use client";

import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

// Events the doctor cares about
export const APPOINTMENT_EVENTS = [
  "appointment_booked",
  "appointment_rescheduled",
  "appointment_confirmed",
  "appointment_cancelled",
  "appointment_completed",
  "appointment_status_change",
] as const;

export type AppointmentEvent = (typeof APPOINTMENT_EVENTS)[number];

interface UseDoctorSocketOptions {
  onAppointmentEvent?: (event: AppointmentEvent, payload: unknown) => void;
}

export function useDoctorSocket({ onAppointmentEvent }: UseDoctorSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("doctor_user") : null;
    if (!raw) return;

    let userId: string;
    try {
      userId = JSON.parse(raw)._id;
    } catch {
      return;
    }

    const socket = io(SOCKET_URL, {
      query: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("joinUserRoom", userId);
    });

    socket.on("disconnect", () => setIsConnected(false));

    APPOINTMENT_EVENTS.forEach((event) => {
      socket.on(event, (payload: unknown) => {
        onAppointmentEvent?.(event, payload);
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // onAppointmentEvent intentionally not in deps — caller should memoize it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isConnected };
}
