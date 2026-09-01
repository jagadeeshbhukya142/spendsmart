import { Link } from 'react-router-dom';
import { CompassIcon, LayoutDashboard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { usePageTitle } from '../utils/usePageTitle';

export default function NotFoundPage() {
  usePageTitle('Page not found - SpendSmart');
  const { user } = useApp();

  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-icon" aria-hidden="true"><CompassIcon size={28} strokeWidth={1.8} /></div>
        <p className="not-found-eyebrow">404</p>
        <h1>This page took a wrong turn.</h1>
        <p>The page you're looking for doesn't exist or may have moved.</p>
        <Link className="btn btn-primary" to={user ? '/dashboard' : '/login'}>
          <LayoutDashboard size={17} strokeWidth={2} />
          {user ? 'Back to dashboard' : 'Back to login'}
        </Link>
      </div>
    </main>
  );
}
