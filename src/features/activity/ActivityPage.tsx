import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';

import { formatDisplayDate } from '../../lib/dateUtils';
import { listActivityLog, type ActivityItem } from './activityService';

function getActionLabel(actionType: string): string {
  const labels: Record<string, string> = {
    create_plan: 'Paquete creado',
    confirm_cut: 'Corte confirmado',
    reschedule_cut: 'Corte reprogramado',
    reminder_sent: 'Recordatorio enviado',
  };

  return labels[actionType] ?? actionType;
}

function getActionTone(
  actionType: string
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (actionType === 'confirm_cut') return 'success';
  if (actionType === 'create_plan') return 'success';
  if (actionType === 'reschedule_cut') return 'warning';
  if (actionType === 'reminder_sent') return 'neutral';

  return 'neutral';
}

export function ActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadActivity() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await listActivityLog(80);
      setItems(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo cargar el historial.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadActivity();
  }, []);

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="page__eyebrow">Historial</p>
          <h1>Actividad reciente</h1>
        </div>

        <Button type="button" variant="secondary" onClick={loadActivity}>
          Actualizar
        </Button>
      </div>

      <Card title="Registro de acciones">
        <p className="muted">
          Acá se registran las acciones importantes: altas de paquetes,
          confirmaciones de cortes, reprogramaciones y recordatorios marcados
          como enviados.
        </p>
      </Card>

      {isLoading ? <Loading text="Cargando historial..." /> : null}

      {errorMessage ? (
        <Card title="Error">
          <p className="form-error">{errorMessage}</p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && items.length === 0 ? (
        <Card title="Sin actividad">
          <p className="muted">Todavía no hay acciones registradas.</p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && items.length > 0 ? (
        <Card title="Últimos movimientos">
          <div className="activity-list">
            {items.map((item) => (
              <article className="activity-item" key={item.id}>
                <div className="activity-item__main">
                  <div className="activity-item__header">
                    <StatusBadge
                      label={getActionLabel(item.action_type)}
                      tone={getActionTone(item.action_type)}
                    />

                    <span className="muted">
                      {formatDisplayDate(item.created_at)}
                    </span>
                  </div>

                  <p>{item.description}</p>

                  <div className="activity-item__meta">
                    {item.client ? (
                      <span>Cliente: {item.client.full_name}</span>
                    ) : null}

                    {item.cut ? <span>Corte #{item.cut.cut_number}</span> : null}
                  </div>
                </div>

                <div className="activity-item__actions">
                  {item.client ? (
                    <Link to={`/clients/${item.client.id}`}>
                      <Button type="button" variant="secondary">
                        Cliente
                      </Button>
                    </Link>
                  ) : null}

                  {item.plan ? (
                    <Link to={`/plans/${item.plan.id}`}>
                      <Button type="button" variant="secondary">
                        Paquete
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}