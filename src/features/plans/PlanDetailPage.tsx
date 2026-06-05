import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { QRCodeBox } from '../../components/QRCodeBox';
import { StatusBadge } from '../../components/StatusBadge';

import { formatDisplayDate } from '../../lib/dateUtils';
import { buildCheckinUrl, copyToClipboard } from '../../lib/nfc';
import { downloadIcsFile, generatePackageIcs } from '../../lib/ics';
import {
  buildInitialPackageMessage,
  buildRescheduleMessage,
  buildWhatsappLink,
} from '../../lib/whatsapp';

import {
  confirmCut,
  getNextPendingCut,
  getPlanDetail,
  rescheduleCutAndFollowing,
  type PlanDetail,
} from './planService';

function getPlanStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Activo',
    completed: 'Completado',
    cancelled: 'Cancelado',
    expired: 'Vencido',
  };

  return labels[status] ?? status;
}

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

export function PlanDetailPage() {
  const { planId } = useParams();

  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [rescheduleCutId, setRescheduleCutId] = useState<string | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [moveFollowingCuts, setMoveFollowingCuts] = useState(true);
  const [lastRescheduleMessage, setLastRescheduleMessage] = useState('');

  const nfcUrl = useMemo(() => {
    if (!detail) return '';
    return buildCheckinUrl(detail.plan.token);
  }, [detail]);

  const nextPendingCut = useMemo(() => {
    if (!detail) return null;
    return getNextPendingCut(detail.cuts);
  }, [detail]);

  const selectedRescheduleCut = useMemo(() => {
    if (!detail || !rescheduleCutId) return null;
    return detail.cuts.find((cut) => cut.id === rescheduleCutId) ?? null;
  }, [detail, rescheduleCutId]);

  const initialWhatsappMessage = useMemo(() => {
    if (!detail) return '';

    return buildInitialPackageMessage({
      clientName: detail.client.full_name,
      dates: detail.cuts.map((cut) => cut.scheduled_date),
    });
  }, [detail]);

  const whatsappUrl = useMemo(() => {
    if (!detail?.client.phone) return '';
    return buildWhatsappLink(detail.client.phone, initialWhatsappMessage);
  }, [detail, initialWhatsappMessage]);

  const rescheduleWhatsappUrl = useMemo(() => {
    if (!detail?.client.phone || !lastRescheduleMessage) return '';
    return buildWhatsappLink(detail.client.phone, lastRescheduleMessage);
  }, [detail, lastRescheduleMessage]);

  async function loadPlan() {
    if (!planId) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await getPlanDetail(planId);
      setDetail(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo cargar el paquete.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPlan();
  }, [planId]);

  async function handleConfirmCut(cutId: string) {
    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setLastRescheduleMessage('');

    try {
      const updatedDetail = await confirmCut(cutId);
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

  async function handleRescheduleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRescheduleCut || !detail) return;

    setActionLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setLastRescheduleMessage('');

    try {
      const oldCutNumber = selectedRescheduleCut.cut_number;

      const updatedDetail = await rescheduleCutAndFollowing({
        cutId: selectedRescheduleCut.id,
        reason: rescheduleReason,
        moveFollowingCuts,
      });

      const updatedCut = updatedDetail.cuts.find(
        (cut) => cut.cut_number === oldCutNumber
      );

      if (updatedCut) {
        const message = buildRescheduleMessage({
          clientName: updatedDetail.client.full_name,
          cutNumber: updatedCut.cut_number,
          newDate: updatedCut.scheduled_date,
          usedReschedules: updatedDetail.reschedulesUsed,
        });

        setLastRescheduleMessage(message);
      }

      setDetail(updatedDetail);
      setSuccessMessage('Turno reprogramado correctamente.');
      setRescheduleCutId(null);
      setRescheduleReason('');
      setMoveFollowingCuts(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo reprogramar el corte.';
      setErrorMessage(message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCopyNfcUrl() {
    if (!nfcUrl) return;

    await copyToClipboard(nfcUrl);
    setSuccessMessage('URL NFC copiada.');
  }

  function handleDownloadIcs() {
    if (!detail) return;

    const icsContent = generatePackageIcs({
      clientName: detail.client.full_name,
      planToken: detail.plan.token,
      cuts: detail.cuts,
    });

    downloadIcsFile(
      `barber-pack-${detail.client.full_name
        .replace(/\s+/g, '-')
        .toLowerCase()}.ics`,
      icsContent
    );
  }

  if (isLoading) {
    return <Loading text="Cargando paquete..." />;
  }

  if (errorMessage && !detail) {
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

  const canReschedule = detail.plan.status === 'active' && detail.reschedulesUsed < 2;

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="page__eyebrow">Paquete</p>
          <h1>{detail.client.full_name}</h1>
        </div>

        <StatusBadge
          label={getPlanStatusLabel(detail.plan.status)}
          tone={detail.plan.status === 'completed' ? 'success' : 'warning'}
        />
      </div>

      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {successMessage ? <p className="success-message">{successMessage}</p> : null}

      <Card title="Resumen del paquete">
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
            <p className="muted">Monto</p>
            <strong>
              {detail.plan.payment_amount !== null
                ? `$ ${detail.plan.payment_amount}`
                : 'Sin monto'}
            </strong>
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

          <div>
            <p className="muted">Inicio</p>
            <strong>{formatDisplayDate(detail.plan.start_date)}</strong>
          </div>
        </div>
      </Card>

      <Card title="Próximo corte">
        {nextPendingCut ? (
          <div className="next-cut-box">
            <div>
              <p className="muted">Corte actual</p>
              <h2>#{nextPendingCut.cut_number}</h2>
              <p>{formatDisplayDate(nextPendingCut.scheduled_date)}</p>
            </div>

            <div className="form-actions">
              <Button
                type="button"
                disabled={actionLoading}
                onClick={() => handleConfirmCut(nextPendingCut.id)}
              >
                {actionLoading ? 'Confirmando...' : 'Confirmar corte realizado'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={!canReschedule || actionLoading}
                onClick={() => setRescheduleCutId(nextPendingCut.id)}
              >
                Reprogramar
              </Button>
            </div>
          </div>
        ) : (
          <p>Este paquete ya no tiene cortes pendientes.</p>
        )}

        {!canReschedule && detail.plan.status === 'active' ? (
          <p className="muted">
            Este paquete ya usó las 2 reprogramaciones permitidas.
          </p>
        ) : null}
      </Card>

      {selectedRescheduleCut ? (
        <Card title={`Reprogramar corte #${selectedRescheduleCut.cut_number}`}>
          <form className="form-grid" onSubmit={handleRescheduleSubmit}>
            <p>
              Fecha actual:{' '}
              <strong>
                {formatDisplayDate(selectedRescheduleCut.scheduled_date)}
              </strong>
            </p>

            <p className="muted">
              Para este MVP, cada reprogramación mueve el corte 1 semana.
            </p>

            <label className="check-row">
              <input
                type="checkbox"
                checked={moveFollowingCuts}
                onChange={(event) => setMoveFollowingCuts(event.target.checked)}
              />
              <span>Mover también los cortes siguientes</span>
            </label>

            <label className="field" htmlFor="rescheduleReason">
              <span className="field__label">Motivo opcional</span>
              <textarea
                id="rescheduleReason"
                className="field__textarea"
                value={rescheduleReason}
                onChange={(event) => setRescheduleReason(event.target.value)}
                placeholder="Ej: el cliente pidió pasar el turno una semana"
              />
            </label>

            <div className="form-actions">
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? 'Reprogramando...' : 'Confirmar reprogramación'}
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={actionLoading}
                onClick={() => {
                  setRescheduleCutId(null);
                  setRescheduleReason('');
                  setMoveFollowingCuts(true);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {lastRescheduleMessage ? (
        <Card title="Mensaje de WhatsApp por reprogramación">
          <div className="message-preview">
            <pre>{lastRescheduleMessage}</pre>
          </div>

          <div className="form-actions">
            {rescheduleWhatsappUrl ? (
              <a href={rescheduleWhatsappUrl} target="_blank" rel="noreferrer">
                <Button type="button">Abrir WhatsApp</Button>
              </a>
            ) : (
              <p className="muted">El cliente no tiene teléfono cargado.</p>
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={() => setLastRescheduleMessage('')}
            >
              Ocultar mensaje
            </Button>
          </div>
        </Card>
      ) : null}

      <Card title="Fechas pactadas">
        <div className="cut-list">
          {detail.cuts.map((cut) => (
            <article className="cut-item" key={cut.id}>
              <div>
                <h3>Corte #{cut.cut_number}</h3>
                <p>{formatDisplayDate(cut.scheduled_date)}</p>
                {cut.completed_at ? (
                  <p className="muted">
                    Confirmado: {formatDisplayDate(cut.completed_at)}
                  </p>
                ) : null}
                {cut.reschedule_count_applied > 0 ? (
                  <p className="muted">
                    Movido {cut.reschedule_count_applied} vez/veces
                  </p>
                ) : null}
              </div>

              <div className="cut-item__actions">
                <StatusBadge
                  label={getCutStatusLabel(cut.status)}
                  tone={getCutTone(cut.status)}
                />

                {cut.status !== 'completed' ? (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!canReschedule || actionLoading}
                      onClick={() => setRescheduleCutId(cut.id)}
                    >
                      Reprogramar
                    </Button>

                    <Button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleConfirmCut(cut.id)}
                    >
                      Confirmar
                    </Button>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </Card>

      <Card title="URL para NFC / QR de respaldo">
        <div className="success-panel">
          <p>
            Esta es la URL que se graba manualmente en NFC Tools. Escanearla abre
            el check-in, pero no confirma automáticamente ningún corte.
          </p>

          <code>{nfcUrl}</code>

          <div className="form-actions">
            <Button type="button" onClick={handleCopyNfcUrl}>
              Copiar URL NFC
            </Button>

            <Link to={`/checkin/${detail.plan.token}`}>
              <Button type="button" variant="secondary">
                Abrir check-in
              </Button>
            </Link>
          </div>

          <QRCodeBox value={nfcUrl} />
        </div>
      </Card>

      <Card title="WhatsApp y calendario">
        <div className="message-preview">
          <p className="field__label">Mensaje inicial</p>
          <pre>{initialWhatsappMessage}</pre>
        </div>

        <div className="form-actions">
          {whatsappUrl ? (
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <Button type="button">Abrir WhatsApp</Button>
            </a>
          ) : (
            <p className="muted">El cliente no tiene teléfono cargado.</p>
          )}

          <Button type="button" variant="secondary" onClick={handleDownloadIcs}>
            Descargar .ics actualizado
          </Button>
        </div>
      </Card>
    </div>
  );
}