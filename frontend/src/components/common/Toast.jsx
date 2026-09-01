import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const icons = { success: CheckCircle2, error: XCircle, warning: TriangleAlert, info: Info };

export default function Toast() {
  const { toast, dismissToast } = useApp();
  if (!toast) return null;
  const Icon = icons[toast.type] || Info;
  return <div id="toast-container" role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'}>
    <div className={`toast toast-${toast.type}`}><Icon className="toast-icon" size={18} strokeWidth={1.9} aria-hidden="true" /><span className="toast-message">{toast.message}</span><button type="button" aria-label="Dismiss notification" onClick={dismissToast}><X size={16} strokeWidth={2} /></button></div>
  </div>;
}
