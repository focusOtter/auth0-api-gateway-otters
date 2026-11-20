import { otters } from './data';
import { caller, json, JwtEvent } from './http';

export const handler = async (event: JwtEvent) => {
  const sub = caller(event);
  if (!sub) return json(401, { error: 'An authenticated caller is required.' });
  return json(200, { otters, caller: sub });
};
