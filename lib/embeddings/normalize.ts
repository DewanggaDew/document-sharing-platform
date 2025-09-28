export function normalizeVector(values: readonly number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(norm) || norm === 0) {
    return [...values];
  }
  return values.map((value) => value / norm);
}

