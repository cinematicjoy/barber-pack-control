import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import { loginWithEmail } from './authService';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Loading } from '../../components/Loading';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname || '/dashboard';

  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [email, setEmail] = useState('barbero@test.com');
  const [password, setPassword] = useState('Barber123456!');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) return;

      setSession(data.session);
      setCheckingSession(false);
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage('');
    setIsSubmitting(true);

    const { error } = await loginWithEmail({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
        console.error('Login error:', error);
        setErrorMessage(error.message);
        return;
        }

    navigate(redirectTo, { replace: true });
  }

  if (checkingSession) {
    return <Loading text="Verificando sesión..." />;
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-card__header">
          <p className="login-card__eyebrow">MVP Demo</p>
          <h1>Barber Pack Control</h1>
          <p>
            Ingresá con el usuario del barbero para administrar clientes,
            paquetes, agenda y check-ins por NFC.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <Input
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {errorMessage ? (
            <p className="form-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <p className="login-card__hint">
          Usuario demo sugerido: <strong>barbero@test.com</strong>
        </p>
      </section>
    </main>
  );
}