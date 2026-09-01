import AppError from '../utils/AppError.js';

const themes = ['dark', 'light', 'system'];

function booleanValue(value, field) {
  if (typeof value !== 'boolean') throw new AppError(`${field} must be a boolean.`, 400, 'VALIDATION_ERROR');
  return value;
}

export function validatePreferenceUpdate(body) {
  const update = {};
  if (body.theme !== undefined) {
    if (!themes.includes(body.theme)) throw new AppError('theme must be dark, light, or system.', 400, 'VALIDATION_ERROR');
    update.theme = body.theme;
  }
  if (body.currency !== undefined) {
    if (!/^[A-Z]{3}$/.test(body.currency)) throw new AppError('currency must be a three-letter uppercase code.', 400, 'VALIDATION_ERROR');
    update.currency = body.currency;
  }
  if (body.dashboardPreferences !== undefined) {
    if (!body.dashboardPreferences || typeof body.dashboardPreferences !== 'object' || Array.isArray(body.dashboardPreferences)) throw new AppError('dashboardPreferences must be an object.', 400, 'VALIDATION_ERROR');
    for (const key of Object.keys(body.dashboardPreferences)) {
      if (!['showBalances', 'compactDashboard'].includes(key)) throw new AppError(`dashboardPreferences.${key} is not supported.`, 400, 'VALIDATION_ERROR');
      update[`dashboardPreferences.${key}`] = booleanValue(body.dashboardPreferences[key], `dashboardPreferences.${key}`);
    }
  }
  if (body.notificationPreferences !== undefined) {
    if (!body.notificationPreferences || typeof body.notificationPreferences !== 'object' || Array.isArray(body.notificationPreferences)) throw new AppError('notificationPreferences must be an object.', 400, 'VALIDATION_ERROR');
    for (const key of Object.keys(body.notificationPreferences)) {
      if (!['budgetAlerts', 'weeklySummary'].includes(key)) throw new AppError(`notificationPreferences.${key} is not supported.`, 400, 'VALIDATION_ERROR');
      update[`notificationPreferences.${key}`] = booleanValue(body.notificationPreferences[key], `notificationPreferences.${key}`);
    }
  }
  if (!Object.keys(update).length) throw new AppError('Provide at least one preference to update.', 400, 'VALIDATION_ERROR');
  return update;
}
