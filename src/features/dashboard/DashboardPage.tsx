import { Link } from 'react-router-dom';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export function DashboardPage() {
  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="page__eyebrow">Inicio</p>
          <h1>Dashboard</h1>
        </div>

        <Link to="/clients/new">
          <Button>Nuevo cliente</Button>
        </Link>
      </div>

      <div className="grid">
        <Card title="Crear paquete">
          <p>
            Cargá un cliente nuevo y generá automáticamente su paquete de 4 cortes.
          </p>

          <Link to="/clients/new">
            <Button type="button">Nuevo cliente</Button>
          </Link>
        </Card>

        <Card title="Clientes">
          <p>
            Consultá clientes, paquetes activos, URLs NFC y fichas de check-in.
          </p>

          <Link to="/clients">
            <Button type="button" variant="secondary">
              Ver clientes
            </Button>
          </Link>
        </Card>

        <Card title="Agenda semanal">
          <p>
            Revisá los cortes pendientes y reprogramados de la semana actual.
          </p>

          <Link to="/agenda">
            <Button type="button" variant="secondary">
              Ver agenda
            </Button>
          </Link>
        </Card>

        <Card title="Recordatorios de mañana">
          <p>
            Abrí WhatsApp con mensajes precargados y marcá los recordatorios enviados.
          </p>

          <Link to="/reminders">
            <Button type="button" variant="secondary">
              Ver recordatorios
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}