import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import { getCategories } from '../services/categoryService';
import { getPreferences, updatePreferences as savePreferenceChanges } from '../services/preferenceService';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null); const [authLoading, setAuthLoading] = useState(true); const [categories, setCategories] = useState([]);
  const storedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('spendsmart-theme') : null;
  const [preferences, setPreferences] = useState({ theme: storedTheme || 'light', currency: 'INR', dashboardPreferences: { showBalances: true, compactDashboard: false }, notificationPreferences: { budgetAlerts: true, weeklySummary: false } });
  const [toast, setToast] = useState(null); const [dataVersion, setDataVersion] = useState(0);
  const loadAccountData = async () => { const categoryData = await getCategories(); setCategories(categoryData); try { setPreferences(await getPreferences()); } catch { /* MongoDB preferences may be configured independently during local development. */ } };
  useEffect(() => { authService.getCurrentUser().then(async ({ data }) => { setUser(data); await loadAccountData(); }).catch(() => setUser(null)).finally(() => setAuthLoading(false)); }, []);
  useEffect(() => {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = preferences.theme === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preferences.theme;
    window.localStorage.setItem('spendsmart-theme', preferences.theme);
  }, [preferences.theme]);
  useEffect(() => { if (!toast) return undefined; const timer = setTimeout(() => setToast(null), 3500); return () => clearTimeout(timer); }, [toast]);
  const value = useMemo(() => ({
    user, authLoading, categories, preferences, dataVersion,
    signIn: async (credentials) => { const result = await authService.login(credentials); setUser(result.data); await loadAccountData(); return result.data; },
    signUp: async (registration) => { const result = await authService.register(registration); setUser(result.data); await loadAccountData(); return result.data; },
    signOut: async () => { await authService.logout(); setUser(null); setCategories([]); },
    savePreferences: async (changes) => { const result = await savePreferenceChanges(changes); setPreferences(result); return result; },
    // Optimistic: flip the theme in the UI immediately so the button feels
    // instant, then persist in the background. A slow or unreachable
    // preferences API shouldn't hold the toggle hostage - if the save fails
    // the user still keeps the theme they picked; we just surface a toast.
    toggleTheme: () => {
      const nextTheme = preferences.theme === 'dark' ? 'light' : 'dark';
      setPreferences((current) => ({ ...current, theme: nextTheme }));
      return savePreferenceChanges({ theme: nextTheme }).catch((error) => {
        throw error;
      });
    },
    refreshData: () => setDataVersion((current) => current + 1),
    showToast: (message, type = 'info') => setToast({ message, type }), toast, dismissToast: () => setToast(null),
  }), [user, authLoading, categories, preferences, dataVersion, toast]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
