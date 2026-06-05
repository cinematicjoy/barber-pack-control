import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '../components/ProtectedRoute';
import { Layout } from '../components/Layout';

import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { ClientsPage } from '../features/clients/ClientsPage';
import { NewClientPage } from '../features/clients/NewClientPage';
import { ClientDetailPage } from '../features/clients/ClientDetailPage';
import { PlanDetailPage } from '../features/plans/PlanDetailPage';
import { CheckinPage } from '../features/checkin/CheckinPage';
import { AgendaPage } from '../features/agenda/AgendaPage';
import { RemindersPage } from '../features/reminders/RemindersPage';
import { ActivityPage } from '../features/activity/ActivityPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/new" element={<NewClientPage />} />
        <Route path="/clients/:clientId" element={<ClientDetailPage />} />
        <Route path="/plans/:planId" element={<PlanDetailPage />} />
        <Route path="/checkin/:token" element={<CheckinPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}