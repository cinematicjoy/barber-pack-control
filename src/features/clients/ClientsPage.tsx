import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDisplayDate } from '../../lib/dateUtils';

import { listClients, type ClientWithPlans } from './clientService';

export function ClientsPage() {
  const [clients, setClients] = useState<ClientWithPlans[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadClients(term = '') {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await listClients(term);
      setClients(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los clientes.';

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadClients(searchTerm);
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="page__eyebrow">Clientes</p>
          <h1>Clientes activos</h1>
        </div>

        <Link to="/clients/new">
          <Button>Nuevo cliente</Button>
        </Link>
      </div>

      <Card title="Buscar cliente">
        <form className="search-row" onSubmit={handleSearch}>
          <input
            className="field__input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombre"
          />

          <Button type="submit">Buscar</Button>
        </form>
      </Card>

      {isLoading ? <Loading text="Cargando clientes..." /> : null}

      {errorMessage ? (
        <Card title="Error">
          <p className="form-error">{errorMessage}</p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage ? (
        <Card title="Listado de clientes">
          {clients.length === 0 ? (
            <p className="muted">Todavía no hay clientes cargados.</p>
          ) : (
            <div className="list">
              {clients.map((client) => {
                const activePlan = client.plans?.find(
                  (plan) => plan.status === 'active'
                );

                return (
                  <article className="list-item" key={client.id}>
                    <div>
                      <h3>{client.full_name}</h3>
                      <p className="muted">
                        {client.phone || 'Sin teléfono cargado'}
                      </p>

                      {activePlan ? (
                        <p>
                          Paquete activo · Restantes:{' '}
                          <strong>
                            {activePlan.remaining_cuts}/{activePlan.total_cuts}
                          </strong>
                        </p>
                      ) : (
                        <p className="muted">Sin paquete activo</p>
                      )}

                      {activePlan ? (
                        <p className="muted">
                          Inicio: {formatDisplayDate(activePlan.start_date)}
                        </p>
                      ) : null}
                    </div>

                    <div className="list-item__actions">
                      {activePlan ? (
                        <StatusBadge label="Activo" tone="success" />
                      ) : (
                        <StatusBadge label="Sin plan" tone="neutral" />
                      )}

                      <Link to={`/clients/${client.id}`}>
                        <Button type="button" variant="secondary">
                          Ver cliente
                        </Button>
                      </Link>

                      {activePlan ? (
                        <Link to={`/plans/${activePlan.id}`}>
                          <Button type="button">Ver paquete</Button>
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}