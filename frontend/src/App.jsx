import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import Toast from './components/common/Toast';
import AuthPage from './pages/AuthPage';
import NotFoundPage from './pages/NotFoundPage';

// Each page is its own chunk. The auth screen is the one thing every visitor
// downloads before we even know who they are, so it stays out of this split -
// everything behind login (including Chart.js, which is not small) only
// loads once someone actually signs in.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TransactionsPage = lazy(() => import('./pages/TransactionsPage'));
const BudgetsPage = lazy(() => import('./pages/UtilityPages').then((m) => ({ default: m.BudgetsPage })));
const ReportsPage = lazy(() => import('./pages/UtilityPages').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/UtilityPages').then((m) => ({ default: m.SettingsPage })));

function PageFallback() {
  return <div className="app-loading" role="status">Loading…</div>;
}

function ProtectedPage({ children }) {
  const { user, authLoading } = useApp();
  if (authLoading) return <PageFallback />;
  return user ? <AppLayout><Suspense fallback={<PageFallback />}>{children}</Suspense></AppLayout> : <Navigate to="/login" replace />;
}

function PublicAuth() {
  const { user, authLoading } = useApp();
  if (authLoading) return <PageFallback />;
  return user ? <Navigate to="/dashboard" replace /> : <AuthPage />;
}

export default function App() {
  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<PublicAuth />} />
        <Route path="/register" element={<PublicAuth />} />
        <Route path="/dashboard" element={<ProtectedPage><DashboardPage /></ProtectedPage>} />
        <Route path="/transactions" element={<ProtectedPage><TransactionsPage /></ProtectedPage>} />
        <Route path="/budgets" element={<ProtectedPage><BudgetsPage /></ProtectedPage>} />
        <Route path="/reports" element={<ProtectedPage><ReportsPage /></ProtectedPage>} />
        <Route path="/settings" element={<ProtectedPage><SettingsPage /></ProtectedPage>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toast />
    </AppProvider>
  );
}
