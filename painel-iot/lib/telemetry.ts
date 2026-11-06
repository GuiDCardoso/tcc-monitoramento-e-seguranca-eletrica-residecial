export const MAX_TELEMETRY_GAP_MS = 15_000;
export const OVERLOAD_CONFIRMATION_MS = 5_000;

type PreviousReading = {
  alerta: boolean;
  registradoEm: Date;
};

export function hasSustainedOverload(
  previous: PreviousReading | null,
  currentTimestamp: Date,
): previous is PreviousReading & { alerta: true } {
  if (!previous?.alerta) return false;

  const duration = currentTimestamp.getTime() - previous.registradoEm.getTime();
  return duration >= OVERLOAD_CONFIRMATION_MS && duration <= MAX_TELEMETRY_GAP_MS;
}
