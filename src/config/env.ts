import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
});

export type Env = z.infer<typeof envSchema>;

// Falha na inicialização caso alguma variável de ambiente esteja inválida.
export const env: Env = envSchema.parse(process.env);
