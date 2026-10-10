/** Campos comuns a todas as entidades, controlados pela camada de persistência. */
export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Dados de uma entidade, sem os campos controlados pela camada de persistência. */
export type EntityData<T extends Entity> = Omit<T, keyof Entity>;
