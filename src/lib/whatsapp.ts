import { formatDisplayDate } from './dateUtils';

export function normalizePhoneForWhatsapp(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildWhatsappLink(phone: string, message: string): string {
  const normalizedPhone = normalizePhoneForWhatsapp(phone);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

interface InitialPackageMessageParams {
  clientName: string;
  dates: string[];
}

export function buildInitialPackageMessage({
  clientName,
  dates,
}: InitialPackageMessageParams): string {
  const formattedDates = dates
    .map((date, index) => `${index + 1}. ${formatDisplayDate(date)}`)
    .join('\n');

  return `Hola ${clientName}, quedó confirmado tu paquete de 4 cortes. Fechas pactadas:

${formattedDates}

Recordá que el paquete permite hasta 2 reprogramaciones de 1 semana. Gracias.`;
}

interface ReminderMessageParams {
  clientName: string;
  cutNumber: number;
  scheduledDate: string;
}

export function buildReminderMessage({
  clientName,
  cutNumber,
  scheduledDate,
}: ReminderMessageParams): string {
  return `Hola ${clientName}, te recordamos tu turno de mañana para tu corte #${cutNumber}: ${formatDisplayDate(
    scheduledDate
  )}. Si necesitás reprogramar, avisá con anticipación. Gracias.`;
}

interface RescheduleMessageParams {
  clientName: string;
  cutNumber: number;
  newDate: string;
  usedReschedules: number;
}

export function buildRescheduleMessage({
  clientName,
  cutNumber,
  newDate,
  usedReschedules,
}: RescheduleMessageParams): string {
  return `Hola ${clientName}, tu corte #${cutNumber} fue reprogramado. Nueva fecha: ${formatDisplayDate(
    newDate
  )}. Reprogramaciones usadas: ${usedReschedules}/2.`;
}