/**
 * Formatos de placa aceitos (após a normalização):
 * - padrão antigo:   AAA9999 (ex.: ABC1234)
 * - padrão Mercosul: AAA9A99 (ex.: ABC1D23)
 */
export const PLATE_PATTERN = /^[A-Z]{3}\d[A-Z\d]\d{2}$/;

/** Remove hífens/espaços e converte para maiúsculas ("abc-1234" -> "ABC1234"). */
export function normalizePlate(plate: string): string {
  return plate.replace(/[\s-]/g, '').toUpperCase();
}
