/**
 * Watermark identity source.
 *
 * Today this exports a static mock. When authentication is integrated,
 * replace `mockWatermarkIdentity` with the real user object here —
 * BookReader and BookPage don't need to change.
 */

export interface WatermarkIdentity {
  name:  string;
  email: string;
}

/** Swap this for `currentUser` once auth is wired up. */
export const mockWatermarkIdentity: WatermarkIdentity = {
  name:  'Usuário',
  email: 'usuario@email.com',
};
