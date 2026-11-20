import { otters } from './data';
import { caller, json, AuthorizedEvent } from './http';

export const handler = async (event: AuthorizedEvent) => {
  const sub = caller(event);
  if (!sub) return json(401, { error: 'An authenticated caller is required.' });
  const otter = otters.find(item => item.id === event.pathParameters?.id);
  if (!otter) return json(404, { error: 'That otter has paddled away.' });
  let body: unknown;
  try {
    body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString('utf8') : event.body ?? '');
  } catch {
    return json(400, { error: 'Send a JSON body with a snack string.' });
  }
  if (!body || typeof body !== 'object' || !('snack' in body) || typeof body.snack !== 'string' || !body.snack.trim() || body.snack.trim().length > 80) {
    return json(400, { error: 'snack must be a non-empty string of at most 80 characters.' });
  }
  return json(200, { message: `${otter.name} accepts your ${body.snack.trim()} with a happy splash!`, otterId: otter.id, caller: sub });
};
