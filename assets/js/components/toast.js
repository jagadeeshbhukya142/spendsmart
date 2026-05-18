// toast.js — lightweight notification system
// Usage: showToast('Budget exceeded!', 'warning')
// Types: 'success' | 'error' | 'warning' | 'info'

(function () {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      Object.assign(container.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: '9999',
        pointerEvents: 'none',
      });
      document.body.appendChild(container);
    }
    return container;
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  const colors = {
    success: '#00c896',
    error: '#ff6b6b',
    warning: '#ffb347',
    info: '#4e9af1',
  };

  window.showToast = function (message, type = 'info', duration = 3500) {
    const c = getContainer();

    const toast = document.createElement('div');
    Object.assign(toast.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '12px 18px',
      background: 'var(--clr-bg-card)',
      border: `1px solid ${colors[type]}40`,
      borderLeft: `3px solid ${colors[type]}`,
      borderRadius: '10px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      color: 'var(--clr-text)',
      fontFamily: 'var(--font-body)',
      fontSize: '0.88rem',
      fontWeight: '500',
      pointerEvents: 'all',
      opacity: '0',
      transform: 'translateX(20px)',
      transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
      maxWidth: '320px',
    });

    toast.innerHTML = `
      <span style="font-size:1rem;">${icons[type]}</span>
      <span style="flex:1;">${message}</span>
      <span style="cursor:pointer;color:var(--clr-text-dim);font-size:0.85rem;" onclick="this.parentElement.remove()">✕</span>
    `;

    c.appendChild(toast);

    // trigger animation
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });

    // auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };
})();