import { z } from 'zod';

/** Texto obrigatório, sem espaços nas extremidades e com tamanho máximo. */
export function requiredText(field: string, maxLength: number) {
  return z
    .string({ error: `O campo "${field}" é obrigatório e deve ser um texto.` })
    .trim()
    .min(1, `O campo "${field}" não pode ser vazio.`)
    .max(maxLength, `O campo "${field}" deve ter no máximo ${maxLength} caracteres.`);
}

/** Identificador (UUID) de um recurso referenciado no corpo da requisição. */
export function uuid(field: string) {
  return z.uuid({ error: `O campo "${field}" deve ser um UUID válido.` });
}

/** Data/hora no formato ISO 8601 com fuso horário explícito, convertida para `Date`. */
export function isoDateTime(field: string) {
  return z.iso
    .datetime({
      offset: true,
      error: `O campo "${field}" deve ser uma data/hora ISO 8601 com fuso horário (ex.: 2024-05-10T08:30:00-03:00).`,
    })
    .transform((value) => new Date(value));
}

/** Filtro opcional da query string. Valores vazios (ex.: `?color=`) são ignorados. */
export function optionalQueryFilter(field: string) {
  return z
    .string({ error: `O filtro "${field}" deve ser informado uma única vez.` })
    .trim()
    .optional()
    .transform((value) => value || undefined);
}
