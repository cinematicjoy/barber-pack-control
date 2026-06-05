import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';

import { formatDisplayDate } from '../../lib/dateUtils';
import { getClientDetail, type ClientDetail } from './clientService';

export function ClientDetailPage() {
  const { clientId } = useParams();

  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadClient() {
    if (!clientId) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getClientDetail(clientId);
      setDetail(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cargar el cliente.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClient();
  }, [clientId]);

  if (isLoading) {
    return <Loading text="Cargando cliente..." />;
  }

  if (errorMessage) {
    return (
      <div className="page">
        <Card title="Error">
          <p className="form-error">{errorMessage}</p>
          <Link to="/clients">
            <Button type="button" variant="secondary">
              Volver a clientes
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="page__eyebrow">Cliente</p>
          <h1>{detail.client.full_name}</h1>
        </div>

        <Link to="/clients">
          <Button type="button" variant="secondary">
            Volver
          </Button>
        </Link>
      </div>

      <Card title="Datos del cliente">
        <div className="detail-grid">
          <div>
            <p className="muted">Nombre</p>
            <strong>{detail.client.full_name}</strong>
          </div>

          <div>
            <p className="muted">Teléfono</p>
            <strong>{detail.client.phone || 'Sin teléfono'}</strong>
          </div>

          <div>
            <p className="muted">Creado</p>
            <strong>{formatDisplayDate(detail.client.created_at)}</strong>
          </div>

          <div>
            <p className="muted">Notas</p>
            <strong>{detail.client.notes || 'Sin notas'}</strong>
          </div>
        </div>
      </Card>

      <Card title="Paquetes del cliente">
        {detail.plans.length === 0 ? (
          <p className="muted">Este cliente todavía no tiene paquetes.</p>
        ) : (
          <div className="list">
            {detail.plans.map((plan) => (
              <article className="list-item" key={plan.id}>
                <div>
                  <h3>Paquete de 4 cortes</h3>
                  <p>
                    Cortes restantes:{' '}
                    <strong>
                      {plan.remaining_cuts}/{plan.total_cuts}
                    </strong>
                  </p>
                  <p className="muted">Inicio: {formatDisplayDate(plan.start_date)}</p>
                  <p className="muted">
                    Pago: {plan.paid ? 'Pagado' : 'Pendiente'}
                  </p>
                </div>

                <div className="list-item__actions">
                  <StatusBadge
                    label={plan.status === 'completed' ? 'Completado' : 'Activo'}
                    tone={plan.status === 'completed' ? 'success' : 'warning'}
                  />

                  <Link to={`/plans/${plan.id}`}>
                    <Button type="button">Ver paquete</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}