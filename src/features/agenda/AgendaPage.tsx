import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';

import {
  formatDayTitle,
  formatShortDate,
  getCurrentWeekRange,
  groupByDay,
} from '../../lib/dateUtils';

import { listAgendaCutsBetween, type AgendaCut } from './agendaService';

function getCutStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    completed: 'Realizado',
    rescheduled: 'Reprogramado',
    missed: 'Ausente',
    cancelled: 'Cancelado',
  };

  return labels[status] ?? status;
}

function getCutTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'completed') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'rescheduled') return 'neutral';
  if (status === 'cancelled' || status === 'missed') return 'danger';
  return 'neutral';
}

export function AgendaPage() {
  const [cuts, setCuts] = useState<AgendaCut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const groupedCuts = useMemo(() => groupByDay(cuts), [cuts]);
  const dayKeys = useMemo(() => Object.keys(groupedCuts).sort(), [groupedCuts]);

  async function loadAgenda() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const { startIso, endIso } = getCurrentWeekRange();
      const data = await listAgendaCutsBetween(startIso, endIso);
      setCuts(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cargar la agenda.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAgenda();
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="page__eyebrow">Agenda</p>
          <h1>Agenda semanal</h1>
        </div>

        <Button type="button" variant="secondary" onClick={loadAgenda}>
          Actualizar
        </Button>
      </div>

      <Card title="Semana actual">
        <p className="muted">
          Se muestran los cortes pendientes o reprogramados de esta semana.
        </p>
      </Card>

      {isLoading ? <Loading text="Cargando agenda..." /> : null}

      {errorMessage ? (
        <Card title="Error">
          <p className="form-error">{errorMessage}</p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && cuts.length === 0 ? (
        <Card title="Sin turnos">
          <p className="muted">
            No hay cortes pendientes ni reprogramados para esta semana.
          </p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && cuts.length > 0 ? (
        <div className="agenda-days">
          {dayKeys.map((dayKey) => {
            const dayCuts = groupedCuts[dayKey];

            return (
              <Card key={dayKey} title={formatDayTitle(dayCuts[0].scheduled_date)}>
                <div className="list">
                  {dayCuts.map((cut) => (
                    <article className="list-item" key={cut.id}>
                      <div>
                        <h3>
                          Corte #{cut.cut_number} · {cut.client.full_name}
                        </h3>

                        <p>
                          <strong>{formatShortDate(cut.scheduled_date)}</strong>
                        </p>

                        <p className="muted">
                          Teléfono: {cut.client.phone || 'Sin teléfono'}
                        </p>

                        <p className="muted">
                          Cortes restantes del paquete: {cut.plan.remaining_cuts}/
                          {cut.plan.total_cuts}
                        </p>
                      </div>

                      <div className="list-item__actions">
                        <StatusBadge
                          label={getCutStatusLabel(cut.status)}
                          tone={getCutTone(cut.status)}
                        />

                        <Link to={`/plans/${cut.plan_id}`}>
                          <Button type="button">Ver paquete</Button>
                        </Link>

                        <Link to={`/checkin/${cut.plan.token}`}>
                          <Button type="button" variant="secondary">
                            Check-in
                          </Button>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}