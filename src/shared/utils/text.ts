/**
 * Normaliza um texto para comparações tolerantes: remove acentos, espaços nas
 * extremidades e diferenças entre maiúsculas e minúsculas ("  São " -> "sao").
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

export function equalsIgnoringCaseAndAccents(value: string, other: string): boolean {
  return normalizeText(value) === normalizeText(other);
}

export function includesIgnoringCaseAndAccents(value: string, search: string): boolean {
  return normalizeText(value).includes(normalizeText(search));
}
