function isTruthy(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isOcrKillSwitchEnabled(): boolean {
  return isTruthy(process.env.OCR_KILL_SWITCH);
}
