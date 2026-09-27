export function normalizeKey(name: string): string {
  // Strip accents ("Arsène" -> "arsene") the same way the data pipeline's slugs do.
  return name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/'/g, '')
    .replace(/\+/g, '_plus')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizeQualityKey(quality: string): string {
  return normalizeKey(quality);
}
