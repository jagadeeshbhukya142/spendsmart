import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChartNoAxesCombined, Download, LayoutDashboard, LogOut, Menu, Moon, Plus, ReceiptText, Settings, Sun, WalletCards, WalletMinimal } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import TransactionModal from '../common/TransactionModal';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: ReceiptText, label: 'Transactions' },
  { path: '/budgets', icon: WalletCards, label: 'Budget' },
  { path: '/reports', icon: ChartNoAxesCombined, label: 'Reports' },
];

const details = {
  '/dashboard': ['Dashboard', 'Overview for {month}'],
  '/transactions': ['Transactions', 'All your income and expenses in one place'],
  '/budgets': ['Budget', 'Keep your monthly spending on track'],
  '/reports': ['Reports', 'A clear view of your financial habits'],
  '/settings': ['Settings', 'Manage your account preferences'],
};

function getInitials(name) {
  return (name || 'SS').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { toggleTheme, preferences, user, signOut, showToast } = useApp();
  const [title, subtitleTemplate] = details[pathname] || details['/dashboard'];
  const month = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date());
  const subtitle = subtitleTemplate.replace('{month}', month);
  const closeMenu = () => setMenuOpen(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    closeMenu();
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      showToast(error.message, 'error');
      setIsSigningOut(false);
    }
  };

  return <>
    <button className={`sidebar-overlay ${menuOpen ? 'show' : ''}`} aria-label="Close navigation" onClick={closeMenu} />
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Primary navigation">
        <div className="sidebar-logo">
          <div className="logo-icon" aria-hidden="true"><WalletMinimal size={19} strokeWidth={1.9} /></div>
          <span className="logo-text">Spend<span>Smart</span></span>
        </div>
        <nav className="sidebar-nav" aria-label="Application">
          <span className="nav-section-label">Workspace</span>
          {navItems.map(({ path, icon: Icon, label }) => <NavLink key={path} to={path} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
            <Icon className="nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>)}
          <span className="nav-section-label nav-account-label">Account</span>
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMenu}>
            <Settings className="nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Settings</span>
          </NavLink>
          <button type="button" className="nav-link nav-button" onClick={handleSignOut} disabled={isSigningOut}>
            <LogOut className="nav-icon" size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{isSigningOut ? 'Logging out…' : 'Logout'}</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="user-avatar" aria-hidden="true">{getInitials(user?.name)}</div>
            <div className="user-info">
              <div className="user-name">{user?.name || 'Your account'}</div>
              {user?.email && <div className="user-email" title={user.email}>{user.email}</div>}
            </div>
          </div>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-btn menu-toggle" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={19} strokeWidth={1.9} /></button>
            <div><div className="page-title">{title}</div><div className="page-subtitle">{subtitle}</div></div>
          </div>
          <div className="topbar-right">
            <button className="topbar-btn" onClick={() => toggleTheme().catch((error) => showToast(error.message, 'error'))} title="Toggle theme" aria-label="Toggle theme">
              {preferences.theme === 'dark' ? <Sun size={18} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}
            </button>
            {pathname === '/transactions' && <button className="btn btn-outline" onClick={() => document.dispatchEvent(new Event('spendsmart-export'))}><Download size={16} strokeWidth={1.9} /> Export CSV</button>}
            <button className="btn btn-primary topbar-add-transaction" aria-label="Add transaction" onClick={() => setModalOpen(true)}><Plus size={17} strokeWidth={2} /><span className="topbar-add-label">Add Transaction</span></button>
          </div>
        </header>
        {children}
      </div>
    </div>
    <TransactionModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
  </>;
}
