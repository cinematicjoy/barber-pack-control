import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';

import { formatDisplayDate } from '../../lib/dateUtils';
import { buildReminderMessage, buildWhatsappLink } from '../../lib/whatsapp';

import {
  listTomorrowReminderCuts,
  markReminderSent,
  type ReminderCut,
} from '../agenda/agendaService';

interface ReminderPreview {
  cutId: string;
  message: string;
  whatsappUrl: string;
}

export function RemindersPage() {
  const [cuts, setCuts] = useState<ReminderCut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingCutId, setActionLoadingCutId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [preview, setPreview] = useState<ReminderPreview | null>(null);

  const pendingCount = useMemo(
    () => cuts.filter((cut) => !cut.reminderSent).length,
    [cuts]
  );

  async function loadReminders() {
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setPreview(null);

    try {
      const data = await listTomorrowReminderCuts();
      setCuts(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los recordatorios.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReminders();
  }, []);

  function buildReminderPreview(cut: ReminderCut): ReminderPreview | null {
    const message = buildReminderMessage({
      clientName: cut.client.full_name,
      cutNumber: cut.cut_number,
      scheduledDate: cut.scheduled_date,
    });

    if (!cut.client.phone) {
      return {
        cutId: cut.id,
        message,
        whatsappUrl: '',
      };
    }

    return {
      cutId: cut.id,
      message,
      whatsappUrl: buildWhatsappLink(cut.client.phone, message),
    };
  }

  function handlePreviewReminder(cut: ReminderCut) {
    const nextPreview = buildReminderPreview(cut);

    if (!nextPreview) return;

    setPreview(nextPreview);
    setSuccessMessage('');
    setErrorMessage('');
  }

  async function handleMarkReminderSent(cut: ReminderCut) {
    setActionLoadingCutId(cut.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await markReminderSent(cut);

      setCuts((currentCuts) =>
        currentCuts.map((item) =>
          item.id === cut.id ? { ...item, reminderSent: true } : item
        )
      );

      setSuccessMessage(
        `Recordatorio marcado como enviado para ${cut.client.full_name}.`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo marcar el recordatorio como enviado.';
      setErrorMessage(message);
    } finally {
      setActionLoadingCutId(null);
    }
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="page__eyebrow">WhatsApp</p>
          <h1>Recordatorios de mañana</h1>
        </div>

        <Button type="button" variant="secondary" onClick={loadReminders}>
          Actualizar
        </Button>
      </div>

      <Card title="Resumen">
        <p>
          Pendientes de marcar como enviados:{' '}
          <strong>{pendingCount}</strong>
        </p>

        <p className="muted">
          La app no envía WhatsApp automáticamente. Abre WhatsApp con el texto
          precargado y el barbero confirma manualmente el envío.
        </p>
      </Card>

      {isLoading ? <Loading text="Cargando recordatorios..." /> : null}

      {errorMessage ? (
        <Card title="Error">
          <p className="form-error">{errorMessage}</p>
        </Card>
      ) : null}

      {successMessage ? (
        <Card title="Acción registrada">
          <p className="success-message">{successMessage}</p>
        </Card>
      ) : null}

      {preview ? (
        <Card title="Vista previa del mensaje">
          <div className="message-preview">
            <pre>{preview.message}</pre>
          </div>

          <div className="form-actions">
            {preview.whatsappUrl ? (
              <a href={preview.whatsappUrl} target="_blank" rel="noreferrer">
                <Button type="button">Abrir WhatsApp</Button>
              </a>
            ) : (
              <p className="muted">
                Este cliente no tiene teléfono cargado. Copiá el mensaje manualmente.
              </p>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={() => setPreview(null)}
            >
              Ocultar vista previa
            </Button>
          </div>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && cuts.length === 0 ? (
        <Card title="Sin recordatorios">
          <p className="muted">
            No hay cortes programados para mañana.
          </p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && cuts.length > 0 ? (
        <Card title="Turnos de mañana">
          <div className="list">
            {cuts.map((cut) => {
              const isActionLoading = actionLoadingCutId === cut.id;

              return (
                <article className="list-item" key={cut.id}>
                  <div>
                    <h3>
                      Corte #{cut.cut_number} · {cut.client.full_name}
                    </h3>

                    <p>
                      <strong>{formatDisplayDate(cut.scheduled_date)}</strong>
                    </p>

                    <p className="muted">
                      Teléfono: {cut.client.phone || 'Sin teléfono'}
                    </p>

                    <p className="muted">
                      Paquete: {cut.plan.remaining_cuts}/{cut.plan.total_cuts}{' '}
                      cortes restantes
                    </p>
                  </div>

                  <div className="list-item__actions">
                    {cut.reminderSent ? (
                      <StatusBadge label="Recordatorio enviado" tone="success" />
                    ) : (
                      <StatusBadge label="Pendiente" tone="warning" />
                    )}

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handlePreviewReminder(cut)}
                    >
                      Ver mensaje
                    </Button>

                    {cut.client.phone ? (
                      <a
                        href={
                          buildReminderPreview(cut)?.whatsappUrl || undefined
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button type="button">Abrir WhatsApp</Button>
                      </a>
                    ) : null}

                    <Button
                      type="button"
                      variant={cut.reminderSent ? 'secondary' : 'primary'}
                      disabled={cut.reminderSent || isActionLoading}
                      onClick={() => handleMarkReminderSent(cut)}
                    >
                      {isActionLoading
                        ? 'Marcando...'
                        : cut.reminderSent
                          ? 'Ya marcado'
                          : 'Marcar enviado'}
                    </Button>

                    <Link to={`/plans/${cut.plan_id}`}>
                      <Button type="button" variant="secondary">
                        Ver paquete
                      </Button>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}