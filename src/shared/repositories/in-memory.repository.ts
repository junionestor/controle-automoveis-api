import { randomUUID } from 'node:crypto';
import type { Entity, EntityData } from '../domain/entity';
import type { Repository } from './repository';

/**
 * Implementação genérica de repositório com persistência em memória.
 *
 * As entidades são armazenadas e devolvidas como cópias (`structuredClone`) para
 * que alterações feitas por quem as consome não modifiquem o estado interno sem
 * passar por `update` — o mesmo comportamento que teríamos com um banco de dados.
 */
export abstract class InMemoryRepository<T extends Entity> implements Repository<T> {
  private readonly entities = new Map<string, T>();

  async create(data: EntityData<T>): Promise<T> {
    const now = new Date();
    const entity = { id: randomUUID(), ...data, createdAt: now, updatedAt: now } as T;

    this.entities.set(entity.id, structuredClone(entity));
    return structuredClone(entity);
  }

  async update(id: string, data: Partial<EntityData<T>>): Promise<T> {
    const current = this.entities.get(id);
    if (!current) {
      throw new Error(`Entity "${id}" not found.`);
    }

    const updated: T = { ...current, ...data, updatedAt: new Date() };
    this.entities.set(id, structuredClone(updated));
    return structuredClone(updated);
  }

  async findById(id: string): Promise<T | null> {
    const entity = this.entities.get(id);
    return entity ? structuredClone(entity) : null;
  }

  async findByIds(ids: readonly string[]): Promise<T[]> {
    const idSet = new Set(ids);
    return this.findWhere((entity) => idSet.has(entity.id));
  }

  async delete(id: string): Promise<void> {
    this.entities.delete(id);
  }

  /** Busca as entidades que atendem ao predicado, na ordem em que foram criadas. */
  protected async findWhere(predicate: (entity: T) => boolean): Promise<T[]> {
    return [...this.entities.values()].filter(predicate).map((entity) => structuredClone(entity));
  }

  protected async findFirstWhere(predicate: (entity: T) => boolean): Promise<T | null> {
    const entity = [...this.entities.values()].find(predicate);
    return entity ? structuredClone(entity) : null;
  }

  protected async existsWhere(predicate: (entity: T) => boolean): Promise<boolean> {
    return [...this.entities.values()].some(predicate);
  }
}
