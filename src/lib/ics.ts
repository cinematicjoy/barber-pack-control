import { addMinutes } from 'date-fns';

interface IcsCut {
  id: string;
  cut_number: number;
  scheduled_date: string;
}

interface GeneratePackageIcsParams {
  clientName: string;
  planToken: string;
  cuts: IcsCut[];
}

function formatDateForIcs(dateIso: string): string {
  return new Date(dateIso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function generatePackageIcs({
  clientName,
  planToken,
  cuts,
}: GeneratePackageIcsParams): string {
  const now = formatDateForIcs(new Date().toISOString());

  const events = cuts
    .map((cut) => {
      const start = new Date(cut.scheduled_date);
      const end = addMinutes(start, 45);

      const dtStart = formatDateForIcs(start.toISOString());
      const dtEnd = formatDateForIcs(end.toISOString());

      return [
        'BEGIN:VEVENT',
        `UID:barber-pack-${planToken}-cut-${cut.cut_number}@barber-pack-control`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${escapeIcsText(`Corte #${cut.cut_number} - ${clientName}`)}`,
        `DESCRIPTION:${escapeIcsText(
          'Turno correspondiente al paquete Barber Pack Control.'
        )}`,
        'END:VEVENT',
      ].join('\r\n');
    })
    .join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Barber Pack Control//MVP//ES',
    'CALSCALE:GREGORIAN',
    events,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(filename: string, content: string): void {
  const blob = new Blob([content], {
    type: 'text/calendar;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}