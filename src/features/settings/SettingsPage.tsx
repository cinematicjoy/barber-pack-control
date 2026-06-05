import { useEffect, useMemo, useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Loading } from '../../components/Loading';

import { buildCheckinUrl, copyToClipboard, getAppBaseUrl } from '../../lib/nfc';
import { getSettingsProfile, type SettingsProfile } from './settingsService';

export function SettingsPage() {
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');

  const appBaseUrl = useMemo(() => getAppBaseUrl(), []);
  const exampleCheckinUrl = useMemo(
    () => buildCheckinUrl('TOKEN_UNICO_DEL_PAQUETE'),
    []
  );

  async function loadSettings() {
    setIsLoading(true);
    setErrorMessage('');
    setCopyMessage('');

    try {
      const data = await getSettingsProfile();
      setProfile(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo cargar la configuración.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  async function handleCopy(text: string, label: string) {
    await copyToClipboard(text);
    setCopyMessage(`${label} copiada.`);
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <p className="page__eyebrow">Configuración</p>
          <h1>Configuración básica</h1>
        </div>

        <Button type="button" variant="secondary" onClick={loadSettings}>
          Actualizar
        </Button>
      </div>

      {isLoading ? <Loading text="Cargando configuración..." /> : null}

      {errorMessage ? (
        <Card title="Error">
          <p className="form-error">{errorMessage}</p>
        </Card>
      ) : null}

      {copyMessage ? (
        <Card title="Copiado">
          <p className="success-message">{copyMessage}</p>
        </Card>
      ) : null}

      {!isLoading && !errorMessage ? (
        <>
          <Card title="Usuario activo">
            <div className="detail-grid">
              <div>
                <p className="muted">Email</p>
                <strong>{profile?.email || 'Sin email'}</strong>
              </div>

              <div>
                <p className="muted">Nombre</p>
                <strong>{profile?.fullName || 'Sin nombre configurado'}</strong>
              </div>
            </div>
          </Card>

          <Card title="URL base de la app">
            <div className="success-panel">
              <p>
                Esta es la URL base que la app usa para generar las URLs de
                check-in que después se graban en las etiquetas NFC.
              </p>

              <code>{appBaseUrl}</code>

              <div className="form-actions">
                <Button
                  type="button"
                  onClick={() => handleCopy(appBaseUrl, 'URL base')}
                >
                  Copiar URL base
                </Button>
              </div>

              <p className="muted">
                En local puede verse como{' '}
                <strong>http://localhost:5173/barber-pack-control</strong>. En
                GitHub Pages debería verse como{' '}
                <strong>https://USUARIO.github.io/barber-pack-control</strong>.
              </p>
            </div>
          </Card>

          <Card title="Formato de URL para NFC">
            <div className="success-panel">
              <p>
                Cada paquete genera un token aleatorio. La URL final para NFC
                siempre tiene este formato:
              </p>

              <code>{exampleCheckinUrl}</code>

              <div className="form-actions">
                <Button
                  type="button"
                  onClick={() =>
                    handleCopy(exampleCheckinUrl, 'Ejemplo de URL NFC')
                  }
                >
                  Copiar ejemplo
                </Button>
              </div>

              <p className="muted">
                El token real se genera al crear un paquete. No uses nombre,
                teléfono, DNI ni datos sensibles como token.
              </p>
            </div>
          </Card>

          <Card title="Instrucciones para grabar NFC con NFC Tools">
            <div className="instructions-box">
              <ol>
                <li>Crear cliente y paquete desde la app.</li>
                <li>Copiar la URL NFC generada en la ficha del paquete.</li>
                <li>Abrir la app externa NFC Tools.</li>
                <li>Elegir la opción “Escribir”.</li>
                <li>Agregar un registro de tipo URL.</li>
                <li>Pegar la URL generada por Barber Pack Control.</li>
                <li>Acercar la etiqueta NFC al celular.</li>
                <li>Confirmar la escritura.</li>
                <li>Probar escaneando la etiqueta.</li>
              </ol>

              <p className="muted">
                El escaneo NFC solo abre la ficha/check-in. No confirma cortes
                automáticamente.
              </p>
            </div>
          </Card>

          <Card title="Variables de entorno para deploy">
            <div className="env-list">
              <div>
                <p className="field__label">VITE_SUPABASE_URL</p>
                <code>https://TU-PROYECTO.supabase.co</code>
              </div>

              <div>
                <p className="field__label">VITE_SUPABASE_ANON_KEY</p>
                <code>tu_anon_key_o_publishable_key</code>
              </div>

              <div>
                <p className="field__label">VITE_APP_BASE_URL</p>
                <code>https://USUARIO.github.io/barber-pack-control</code>
              </div>
            </div>

            <p className="muted">
              En el frontend nunca pongas la service_role key de Supabase. Para
              esta app solo va la anon/public key, protegida por RLS.
            </p>
          </Card>

          <Card title="Configuración esperada en vite.config.ts">
            <div className="message-preview">
              <pre>{`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/barber-pack-control/' : '/',
}));`}</pre>
            </div>

            <p className="muted">
              Esto permite desarrollar localmente con{' '}
              <strong>http://localhost:5173/#/login</strong> y publicar en
              GitHub Pages bajo <strong>/barber-pack-control/</strong>.
            </p>
          </Card>

          <Card title="Checklist antes del deploy">
            <div className="instructions-box">
              <ol>
                <li>Login funcionando.</li>
                <li>Crear cliente funcionando.</li>
                <li>Crear paquete funcionando.</li>
                <li>URL NFC generada correctamente.</li>
                <li>Check-in por token funcionando.</li>
                <li>Confirmar corte funcionando.</li>
                <li>Reprogramar corte funcionando.</li>
                <li>Agenda semanal funcionando.</li>
                <li>Recordatorios de mañana funcionando.</li>
                <li>Historial de actividad funcionando.</li>
                <li>Variables de entorno listas para GitHub Actions.</li>
              </ol>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}