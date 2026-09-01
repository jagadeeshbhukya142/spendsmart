import { api } from './api';

export const getPreferences = async () => (await api('/preferences')).data;
export const updatePreferences = async (data) => (await api('/preferences', { method: 'PATCH', body: JSON.stringify(data) })).data;
