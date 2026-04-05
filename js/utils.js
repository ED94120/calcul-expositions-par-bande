export function normalizeNumericText(text) {
  return String(text ?? "").trim().replace(",", ".");
}

export function isValidNumberText(text) {
  const normalized = normalizeNumericText(text);
  if (normalized === "") return false;
  return /^-?\d+(\.\d+)?$/.test(normalized);
}

export function parseLocalizedNumber(text) {
  return Number(normalizeNumericText(text));
}

export function formatNumberForDisplay(value, decimals) {
  if (value == null || Number.isNaN(value)) return "";
  return Number(value).toFixed(decimals).replace(".", ",");
}

export function formatNumberForCopy(value, decimals) {
  return formatNumberForDisplay(value, decimals);
}

export function dbwToW(dbw) {
  return 10 ** (dbw / 10);
}

export function dbToLinear(db) {
  return 10 ** (db / 10);
}

export async function copyTextToClipboard(text) {
  await navigator.clipboard.writeText(text);
}
