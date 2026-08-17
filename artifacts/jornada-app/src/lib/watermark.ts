/**
 * Watermark identity source.
 *
 * Updated by AuthContext immediately after the user is resolved —
 * before syncReady becomes true and any protected route is accessible.
 * BookReader reads the live binding at render time, so by the time it
 * mounts the real identity is already in place.
 */

export interface WatermarkIdentity {
  name:  string;
  email: string;
}

// Mutable live binding — reassigned by setWatermarkIdentity.
// ESM live bindings ensure all importers see the updated value.
export let mockWatermarkIdentity: WatermarkIdentity = {
  name:  'Usuário',
  email: '',
};

export function setWatermarkIdentity(identity: WatermarkIdentity): void {
  mockWatermarkIdentity = identity;
}
