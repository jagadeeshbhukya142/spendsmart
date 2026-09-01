import * as preferences from '../services/preferenceService.js';
import { recordActivity, ActivityEvent } from '../services/activityService.js';
import { validatePreferenceUpdate } from '../validators/preferenceValidator.js';
import { sendSuccess } from '../utils/response.js';

export async function get(req, res) { return sendSuccess(res, await preferences.getPreferences(req.user.id)); }
export async function update(req, res) {
  const update = validatePreferenceUpdate(req.body);
  const result = await preferences.updatePreferences(req.user.id, update);
  await recordActivity(req.user.id, ActivityEvent.PREFERENCE_UPDATED, { fields: Object.keys(update).map((field) => field.split('.')[0]) });
  return sendSuccess(res, result);
}
