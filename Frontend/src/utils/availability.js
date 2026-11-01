// Helpers for the provider's weekly schedule screen.

export const DAYS = [
  { key: 'MONDAY', label: 'Monday' },
  { key: 'TUESDAY', label: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thursday' },
  { key: 'FRIDAY', label: 'Friday' },
  { key: 'SATURDAY', label: 'Saturday' },
  { key: 'SUNDAY', label: 'Sunday' },
];

export const DEFAULT_RANGE = { start: '09:00', end: '17:00' };

export function toMinutes(time) {
  const [hours, minutes] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

export function fromMinutes(total) {
  const hours = String(Math.floor(total / 60)).padStart(2, '0');
  const minutes = String(total % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// The backend sends a flat list of windows; the screen works with { MONDAY: [{ start, end }], ... }
export function scheduleFromWindows(windows) {
  const schedule = Object.fromEntries(DAYS.map((day) => [day.key, []]));
  windows.forEach((w) => {
    schedule[w.dayOfWeek]?.push({ start: w.startTime.slice(0, 5), end: w.endTime.slice(0, 5) });
  });
  DAYS.forEach((day) => schedule[day.key].sort((a, b) => toMinutes(a.start) - toMinutes(b.start)));
  return schedule;
}

export function windowsFromSchedule(schedule) {
  return DAYS.flatMap((day) =>
    (schedule[day.key] || []).map((range) => ({
      dayOfWeek: day.key,
      startTime: range.start,
      endTime: range.end,
    }))
  );
}

// Returns a message for one day's ranges, or '' when they are fine
export function validateDay(ranges, slotMinutes) {
  for (const range of ranges) {
    if (!range.start || !range.end) return 'Fill in both times.';
  }
  const sorted = [...ranges].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  for (let i = 0; i < sorted.length; i += 1) {
    const start = toMinutes(sorted[i].start);
    const end = toMinutes(sorted[i].end);
    if (start >= end) return 'A time range must start before it ends.';
    if (end - start < slotMinutes) return `Each time range must be at least ${slotMinutes} minutes long.`;
    if (i > 0 && start < toMinutes(sorted[i - 1].end)) return 'Time ranges can’t overlap.';
  }
  return '';
}

// A sensible starting point when the provider adds another range to a day
export function nextRange(ranges) {
  if (ranges.length === 0) return { ...DEFAULT_RANGE };
  const lastEnd = Math.max(...ranges.map((r) => toMinutes(r.end) || 0));
  const start = Math.min(lastEnd + 60, 22 * 60);
  const end = Math.min(start + 180, 23 * 60 + 59);
  return { start: fromMinutes(start), end: fromMinutes(end) };
}

export function presetSchedule(dayKeys) {
  return Object.fromEntries(
    DAYS.map((day) => [day.key, dayKeys.includes(day.key) ? [{ ...DEFAULT_RANGE }] : []])
  );
}

export const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
export const MON_TO_SAT = [...WEEKDAYS, 'SATURDAY'];
