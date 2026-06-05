import {
  addDays,
  addWeeks,
  endOfDay,
  endOfWeek,
  format,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';

export function toIsoFromLocalDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('La fecha ingresada no es válida.');
  }

  return date.toISOString();
}

export function generateFourWeeklyDates(startDateIso: string): string[] {
  const startDate = new Date(startDateIso);

  return [0, 1, 2, 3].map((weekOffset) =>
    addWeeks(startDate, weekOffset).toISOString()
  );
}

export function formatDisplayDate(dateIso: string): string {
  return format(new Date(dateIso), "EEEE d 'de' MMMM yyyy, HH:mm", {
    locale: es,
  });
}

export function formatShortDate(dateIso: string): string {
  return format(new Date(dateIso), 'dd/MM/yyyy HH:mm', {
    locale: es,
  });
}

export function formatDayTitle(dateIso: string): string {
  return format(new Date(dateIso), "EEEE d 'de' MMMM", {
    locale: es,
  });
}

export function getDefaultLocalDateTimeInputValue(): string {
  const now = new Date();

  now.setMinutes(0);
  now.setSeconds(0);
  now.setMilliseconds(0);

  return format(now, "yyyy-MM-dd'T'HH:mm");
}

export function getCurrentWeekRange(): { startIso: string; endIso: string } {
  const now = new Date();

  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

export function getTomorrowRange(): { startIso: string; endIso: string } {
  const tomorrow = addDays(new Date(), 1);

  return {
    startIso: startOfDay(tomorrow).toISOString(),
    endIso: endOfDay(tomorrow).toISOString(),
  };
}

export function groupByDay<T extends { scheduled_date: string }>(
  items: T[]
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = format(new Date(item.scheduled_date), 'yyyy-MM-dd');

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);

    return acc;
  }, {});
}