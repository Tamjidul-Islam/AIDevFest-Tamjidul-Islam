// Status rules (problem statement section 5). Dates are YYYY-MM-DD, compared as strings.
export const BLOCKING = new Set(['missing', 'expiryNeeded', 'expired']);

export function computeStatus(req, file, expiry, deadline) {
  if (!file) return req.mandatory ? 'missing' : 'notProvided';
  if (req.has_expiry) {
    if (!expiry) return 'expiryNeeded';
    if (deadline && expiry < deadline) return 'expired'; // same day as deadline is still OK
  }
  return 'ok';
}
