import type { Entity, EntityData } from '../domain/entity';

/**
 * Contrato básico de persistência. Os services dependem apenas das interfaces,
 * o que permite trocar a implementação em memória por um banco de dados sem
 * alterar as regras de negócio.
 */
export interface Repository<T extends Entity> {
  create(data: EntityData<T>): Promise<T>;
  /** Atualiza uma entidade existente. Lança erro se o `id` não existir. */
  update(id: string, data: Partial<EntityData<T>>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findByIds(ids: readonly string[]): Promise<T[]>;
  delete(id: string): Promise<void>;
}
