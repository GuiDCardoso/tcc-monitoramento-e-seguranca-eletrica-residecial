import { MAX_TELEMETRY_GAP_MS } from "./telemetry";

export type EnergyReading = {
  registradoEm: Date;
  potenciaAparenteVA: number;
};

export function estimateEnergyKwh(
  readings: EnergyReading[],
  periodStart: Date,
  periodEnd: Date,
): number {
  let wattHours = 0;

  for (let index = 1; index < readings.length; index += 1) {
    const previous = readings[index - 1];
    const current = readings[index];
    const intervalStart = previous.registradoEm.getTime();
    const intervalEnd = current.registradoEm.getTime();
    const intervalDuration = intervalEnd - intervalStart;

    if (intervalDuration <= 0 || intervalDuration > MAX_TELEMETRY_GAP_MS) continue;

    const clippedStart = Math.max(intervalStart, periodStart.getTime());
    const clippedEnd = Math.min(intervalEnd, periodEnd.getTime());
    if (clippedEnd <= clippedStart) continue;

    const startRatio = (clippedStart - intervalStart) / intervalDuration;
    const endRatio = (clippedEnd - intervalStart) / intervalDuration;
    const clippedStartVA =
      previous.potenciaAparenteVA +
      (current.potenciaAparenteVA - previous.potenciaAparenteVA) * startRatio;
    const clippedEndVA =
      previous.potenciaAparenteVA +
      (current.potenciaAparenteVA - previous.potenciaAparenteVA) * endRatio;

    wattHours +=
      ((clippedStartVA + clippedEndVA) / 2) * ((clippedEnd - clippedStart) / 3_600_000);
  }

  return wattHours / 1000;
}
