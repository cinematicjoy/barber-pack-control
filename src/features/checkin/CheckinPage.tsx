import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';

import { formatDisplayDate } from '../../lib/dateUtils';
import {
  confirmCut,
  getNextPendingCut,
  getPlanDetailByToken,
  type PlanDetail,
} from '../plans/planService';

export function CheckinPage() {
  const { token } = useParams();

  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const nextPendingCut = useMemo(() => {
    if (!detail) return null;
    return getNextPendingCut(detail.cuts);
  }, [detail]);

  async function loadCheckin() {
    if (!token) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getPlanDetailByToken(token);
      setDetail(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cargar el check-in.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCheckin();
  }, [token]);

  async function handleConfirmCurrentCut() {
    if (!nextPendingCut) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedDetail = await confirmCut(nextPendingCut.id);
      setDetail(updatedDetail);
      setSuccessMessage('Corte confirmado correctamente.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo confirmar el corte.';
      setErrorMessage(message);
    } finally {
      setActionLoading(false);
    }
  }

  if (isLoading) {
    return <Loading text="Cargando check-in..." />;
  }

  if (errorMessage && !detail) {
    return (
      <div className="page">
        <Card title="No se pudo abrir el check-in">
          <p className="form-error">{errorMessage}</p>
          <Link to="/dashboard">
            <Button type="button" variant="secondary">
              Volver al inicio
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
          <p className="page__eyebrow">Check-in NFC</p>
          <h1>{detail.client.full_name}</h1>
        </div>

        <StatusBadge
          label={detail.plan.status === 'completed' ? 'Completado' : 'Activo'}
          tone={detail.plan.status === 'completed' ? 'success' : 'warning'}
        />
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {successMessage ? <p className="success-message">{successMessage}</p> : null}

      <Card title="Ficha rápida">
        <div className="detail-grid">
          <div>
            <p className="muted">Cliente</p>
            <strong>{detail.client.full_name}</strong>
          </div>

          <div>
            <p className="muted">Teléfono</p>
            <strong>{detail.client.phone || 'Sin teléfono'}</strong>
          </div>

          <div>
            <p className="muted">Pago</p>
            <strong>{detail.plan.paid ? 'Pagado' : 'Pendiente'}</strong>
          </div>

          <div>
            <p className="muted">Cortes restantes</p>
            <strong>
              {detail.plan.remaining_cuts}/{detail.plan.total_cuts}
            </strong>
          </div>

          <div>
            <p className="muted">Reprogramaciones usadas</p>
            <strong>{detail.reschedulesUsed}/2</strong>
        </div>
        
        </div>
      </Card>

      <Card title="Corte actual">
        {nextPendingCut ? (
          <div className="next-cut-box">
            <div>
              <p className="muted">Próximo corte pendiente</p>
              <h2>#{nextPendingCut.cut_number}</h2>
              <p>{formatDisplayDate(nextPendingCut.scheduled_date)}</p>
            </div>

            <Button
              type="button"
              disabled={actionLoading}
              onClick={handleConfirmCurrentCut}
            >
              {actionLoading ? 'Confirmando...' : 'Confirmar corte realizado'}
            </Button>
          </div>
        ) : (
          <p>Este paquete ya no tiene cortes pendientes.</p>
        )}
      </Card>

      <Card title="Fechas del paquete">
        <div className="cut-list">
          {detail.cuts.map((cut) => (
            <article className="cut-item" key={cut.id}>
              <div>
                <h3>Corte #{cut.cut_number}</h3>
                <p>{formatDisplayDate(cut.scheduled_date)}</p>
              </div>

              <StatusBadge
                label={cut.status === 'completed' ? 'Realizado' : 'Pendiente'}
                tone={cut.status === 'completed' ? 'success' : 'warning'}
              />
            </article>
          ))}
        </div>
      </Card>

      <div className="form-actions">
        <Link to={`/plans/${detail.plan.id}`}>
          <Button type="button" variant="secondary">
            Ver paquete completo
          </Button>
        </Link>

        <Link to="/dashboard">
          <Button type="button" variant="secondary">
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}