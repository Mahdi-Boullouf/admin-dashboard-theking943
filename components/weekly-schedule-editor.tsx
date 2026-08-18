"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";
import type { DaySchedule, ScheduleSlot } from "@/lib/clinic-api";

/**
 * Days are lowercase english and in this exact order — the backend enforces
 * them as an enum (model/shared/schedule.schema.js).
 */
export const WEEK_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/** A full 7-day skeleton, every day closed. Safe starting value for a new form. */
export function emptyWeeklySchedule(): DaySchedule[] {
  return WEEK_DAYS.map((day) => ({ day, isActive: false, slots: [] }));
}

/**
 * Normalises whatever the API returned into all 7 days in canonical order, so
 * the editor never renders a partial week and never drops a day on save.
 */
export function normalizeWeeklySchedule(input: any): DaySchedule[] {
  const source: any[] = Array.isArray(input) ? input : [];
  return WEEK_DAYS.map((day) => {
    const found = source.find((d) => d?.day === day);
    return {
      day,
      isActive: Boolean(found?.isActive),
      slots: Array.isArray(found?.slots)
        ? found.slots.map((s: any) => ({
            start: String(s?.start ?? "08:00"),
            end: String(s?.end ?? "12:00"),
          }))
        : [],
    };
  });
}

/**
 * Returns an error message if any active day has a slot whose start is not
 * before its end — the same rule the backend rejects with a 400.
 */
export function validateWeeklySchedule(schedule: DaySchedule[]): string | null {
  for (const day of schedule) {
    if (!day.isActive) continue;
    if (!day.slots.length) {
      return `${DAY_LABELS[day.day] || day.day} is marked open but has no time slots`;
    }
    for (const slot of day.slots) {
      if (!slot.start || !slot.end) {
        return `${DAY_LABELS[day.day] || day.day} has an incomplete time slot`;
      }
      if (slot.start >= slot.end) {
        return `${DAY_LABELS[day.day] || day.day}: start (${slot.start}) must be before end (${slot.end})`;
      }
    }
  }
  return null;
}

export function WeeklyScheduleEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: DaySchedule[];
  onChange: (next: DaySchedule[]) => void;
  disabled?: boolean;
}) {
  const days = value.length === WEEK_DAYS.length ? value : normalizeWeeklySchedule(value);

  const patchDay = (index: number, patch: Partial<DaySchedule>) => {
    onChange(days.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const patchSlot = (
    dayIndex: number,
    slotIndex: number,
    patch: Partial<ScheduleSlot>
  ) => {
    const day = days[dayIndex];
    patchDay(dayIndex, {
      slots: day.slots.map((s, i) => (i === slotIndex ? { ...s, ...patch } : s)),
    });
  };

  const addSlot = (dayIndex: number) => {
    const day = days[dayIndex];
    const last = day.slots[day.slots.length - 1];
    const next: ScheduleSlot = last
      ? { start: last.end, end: "18:00" }
      : { start: "08:00", end: "12:00" };
    patchDay(dayIndex, { slots: [...day.slots, next], isActive: true });
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const day = days[dayIndex];
    patchDay(dayIndex, { slots: day.slots.filter((_, i) => i !== slotIndex) });
  };

  return (
    <div className="space-y-2">
      {days.map((day, dayIndex) => (
        <div
          key={day.day}
          className="border rounded-lg p-3 flex flex-col sm:flex-row sm:items-start gap-3"
        >
          <div className="flex items-center gap-3 sm:w-40 shrink-0">
            <Switch
              checked={day.isActive}
              disabled={disabled}
              onCheckedChange={(checked) => {
                // Turning a closed day on with no slots would fail validation,
                // so seed one sensible default slot.
                patchDay(dayIndex, {
                  isActive: checked,
                  slots:
                    checked && day.slots.length === 0
                      ? [{ start: "08:00", end: "12:00" }]
                      : day.slots,
                });
              }}
            />
            <span
              className={
                day.isActive
                  ? "text-sm font-medium text-gray-900"
                  : "text-sm text-gray-400"
              }
            >
              {DAY_LABELS[day.day] || day.day}
            </span>
          </div>

          <div className="flex-1 space-y-2">
            {day.isActive ? (
              <>
                {day.slots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="w-32"
                      value={slot.start}
                      disabled={disabled}
                      onChange={(e) =>
                        patchSlot(dayIndex, slotIndex, { start: e.target.value })
                      }
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <Input
                      type="time"
                      className="w-32"
                      value={slot.end}
                      disabled={disabled}
                      onChange={(e) =>
                        patchSlot(dayIndex, slotIndex, { end: e.target.value })
                      }
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={disabled}
                      onClick={() => removeSlot(dayIndex, slotIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={disabled}
                  onClick={() => addSlot(dayIndex)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add slot
                </Button>
              </>
            ) : (
              <p className="text-sm text-gray-400 pt-2">Closed</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
