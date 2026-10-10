import type { Entity } from '../../shared/domain/entity';

export interface Car extends Entity {
  /** Placa normalizada: maiúscula e sem hífen (ex.: "ABC1D23"). */
  plate: string;
  color: string;
  brand: string;
}
