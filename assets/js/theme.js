// theme.js — handles dark/light mode
// saving preference in localStorage so it stays on refresh

const THEME_KEY = 'spendsmart_theme';

function getStoredTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  // update toggle button icon if it exists
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

function toggleTheme() {
  const current = getStoredTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// Apply on page load immediately (no flash)
applyTheme(getStoredTheme());

// Expose globally
window.toggleTheme = toggleTheme;