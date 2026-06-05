import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export function Navbar() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  return (
    <header className="navbar">
      <div className="navbar__top">
        <div>
          <p className="navbar__eyebrow">Barber Pack Control</p>
          <h1 className="navbar__title">Panel del barbero</h1>
        </div>

        <button className="navbar__logout" type="button" onClick={handleLogout}>
          Salir
        </button>
      </div>

      <nav className="navbar__links">
        <NavLink to="/dashboard">Inicio</NavLink>
        <NavLink to="/clients">Clientes</NavLink>
        <NavLink to="/agenda">Agenda</NavLink>
        <NavLink to="/reminders">Recordatorios</NavLink>
        <NavLink to="/activity">Historial</NavLink>
        <NavLink to="/settings">Config</NavLink>
      </nav>
    </header>
  );
}