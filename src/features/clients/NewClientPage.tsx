import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { QRCodeBox } from '../../components/QRCodeBox';

import { getDefaultLocalDateTimeInputValue, toIsoFromLocalDateTime } from '../../lib/dateUtils';
import { buildCheckinUrl, copyToClipboard } from '../../lib/nfc';
import { buildInitialPackageMessage, buildWhatsappLink } from '../../lib/whatsapp';
import { downloadIcsFile, generatePackageIcs } from '../../lib/ics';

import { createClientWithPlan } from '../plans/planService';
import type { Database } from '../../types/database';

type PlanRow = Database['public']['Tables']['plans']['Row'];
type CutRow = Database['public']['Tables']['cuts']['Row'];
type ClientRow = Database['public']['Tables']['clients']['Row'];

interface CreatedData {
  client: ClientRow;
  plan: PlanRow;
  cuts: CutRow[];
}

export function NewClientPage() {
  const [clientFullName, setClientFullName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [startDateLocal, setStartDateLocal] = useState(
    getDefaultLocalDateTimeInputValue()
  );
  const [paid, setPaid] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [firstCutCompleted, setFirstCutCompleted] = useState(false);

  const [createdData, setCreatedData] = useState<CreatedData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  const nfcUrl = useMemo(() => {
    if (!createdData) return '';
    return buildCheckinUrl(createdData.plan.token);
  }, [createdData]);

  const initialWhatsappMessage = useMemo(() => {
    if (!createdData) return '';

    return buildInitialPackageMessage({
      clientName: createdData.client.full_name,
      dates: createdData.cuts.map((cut) => cut.scheduled_date),
    });
  }, [createdData]);

  const whatsappUrl = useMemo(() => {
    if (!createdData?.client.phone) return '';

    return buildWhatsappLink(createdData.client.phone, initialWhatsappMessage);
  }, [createdData, initialWhatsappMessage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage('');
    setCopyMessage('');
    setCreatedData(null);
    setIsSubmitting(true);

    try {
      const startDateIso = toIsoFromLocalDateTime(startDateLocal);

      const amount =
        paymentAmount.trim() === '' ? null : Number(paymentAmount.replace(',', '.'));

      if (amount !== null && Number.isNaN(amount)) {
        throw new Error('El monto de pago no es válido.');
      }

      const result = await createClientWithPlan({
        clientFullName,
        clientPhone,
        clientNotes,
        startDateIso,
        paid,
        paymentAmount: amount,
        firstCutCompleted,
      });

      setCreatedData(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error creando el cliente y el paquete.';

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCopyNfcUrl() {
    if (!nfcUrl) return;

    await copyToClipboard(nfcUrl);
    setCopyMessage('URL copiada.');
  }

  function handleDownloadIcs() {
    if (!createdData) return;

    const icsContent = generatePackageIcs({
      clientName: createdData.client.full_name,
      planToken: createdData.plan.token,
      cuts: createdData.cuts,
    });

    downloadIcsFile(
      `barber-pack-${createdData.client.full_name.replace(/\s+/g, '-').toLowerCase()}.ics`,
      icsContent
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="page__eyebrow">Alta</p>
          <h1>Crear cliente + paquete</h1>
        </div>
      </div>

      <Card title="Datos del cliente y paquete">
        <form className="form-grid" onSubmit={handleSubmit}>
          <Input
            label="Nombre completo"
            name="clientFullName"
            value={clientFullName}
            onChange={(event) => setClientFullName(event.target.value)}
            required
          />

          <Input
            label="Teléfono WhatsApp"
            name="clientPhone"
            value={clientPhone}
            onChange={(event) => setClientPhone(event.target.value)}
            placeholder="Ej: 5491123456789"
          />

          <label className="field" htmlFor="clientNotes">
            <span className="field__label">Notas</span>
            <textarea
              id="clientNotes"
              className="field__textarea"
              value={clientNotes}
              onChange={(event) => setClientNotes(event.target.value)}
              placeholder="Ej: prefiere turno por la tarde"
            />
          </label>

          <Input
            label="Fecha y hora del primer corte"
            name="startDateLocal"
            type="datetime-local"
            value={startDateLocal}
            onChange={(event) => setStartDateLocal(event.target.value)}
            required
          />

          <Input
            label="Monto pagado"
            name="paymentAmount"
            type="text"
            inputMode="decimal"
            value={paymentAmount}
            onChange={(event) => setPaymentAmount(event.target.value)}
            placeholder="Ej: 18000"
          />

          <label className="check-row">
            <input
              type="checkbox"
              checked={paid}
              onChange={(event) => setPaid(event.target.checked)}
            />
            <span>Paquete pagado</span>
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={firstCutCompleted}
              onChange={(event) => setFirstCutCompleted(event.target.checked)}
            />
            <span>Marcar el primer corte como realizado ahora</span>
          </label>

          {errorMessage ? (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="form-actions">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear cliente y paquete'}
            </Button>

            <Link to="/clients">
              <Button type="button" variant="secondary">
                Volver
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      {createdData ? (
        <Card title="Paquete creado correctamente">
          <div className="success-panel">
            <p>
              Cliente: <strong>{createdData.client.full_name}</strong>
            </p>

            <p>
              Cortes restantes:{' '}
              <strong>
                {createdData.plan.remaining_cuts}/{createdData.plan.total_cuts}
              </strong>
            </p>

            <p>
              Token NFC/check-in:
              <br />
              <code>{createdData.plan.token}</code>
            </p>

            <div className="nfc-url-box">
              <p className="field__label">URL para grabar en NFC Tools</p>
              <code>{nfcUrl}</code>
            </div>

            <div className="form-actions">
              <Button type="button" onClick={handleCopyNfcUrl}>
                Copiar URL NFC
              </Button>

              <Link to={`/plans/${createdData.plan.id}`}>
                <Button type="button" variant="secondary">
                  Ver paquete
                </Button>
              </Link>
            </div>

            {copyMessage ? <p className="success-message">{copyMessage}</p> : null}

            <QRCodeBox value={nfcUrl} />

            <div className="message-preview">
              <p className="field__label">Mensaje inicial para WhatsApp</p>
              <pre>{initialWhatsappMessage}</pre>
            </div>

            <div className="form-actions">
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <Button type="button">Abrir WhatsApp</Button>
                </a>
              ) : (
                <p className="muted">
                  No se cargó teléfono. Podés copiar el mensaje manualmente.
                </p>
              )}

              <Button type="button" variant="secondary" onClick={handleDownloadIcs}>
                Descargar calendario .ics
              </Button>
            </div>

            <div className="instructions-box">
              <p className="field__label">Instrucciones NFC Tools</p>
              <ol>
                <li>Abrir NFC Tools.</li>
                <li>Elegir “Escribir”.</li>
                <li>Agregar registro tipo URL.</li>
                <li>Pegar la URL generada.</li>
                <li>Acercar la etiqueta NFC.</li>
                <li>Guardar.</li>
                <li>Probar escaneando la etiqueta.</li>
              </ol>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}