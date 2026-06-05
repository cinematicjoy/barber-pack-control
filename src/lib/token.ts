export function generateSecureToken(length = 32): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const values = new Uint32Array(length);

  crypto.getRandomValues(values);

  return Array.from(values)
    .map((value) => chars[value % chars.length])
    .join('');
}