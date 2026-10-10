import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryCarUsageRepository } from '../../../src/modules/car-usages/in-memory-car-usage.repository';
import { CarService } from '../../../src/modules/cars/car.service';
import { InMemoryCarRepository } from '../../../src/modules/cars/in-memory-car.repository';
import { ConflictError, NotFoundError } from '../../../src/shared/errors/app-error';
import { carInput } from '../../helpers/fixtures';

describe('CarService', () => {
  let carUsageRepository: InMemoryCarUsageRepository;
  let carService: CarService;

  beforeEach(() => {
    carUsageRepository = new InMemoryCarUsageRepository();
    carService = new CarService(new InMemoryCarRepository(), carUsageRepository);
  });

  describe('create', () => {
    it('cadastra um automóvel', async () => {
      const car = await carService.create(carInput());

      expect(car).toMatchObject({ id: expect.any(String), ...carInput() });
      expect(await carService.findById(car.id)).toEqual(car);
    });

    it('não permite cadastrar duas vezes a mesma placa', async () => {
      await carService.create(carInput({ plate: 'ABC1234' }));

      await expect(carService.create(carInput({ plate: 'ABC1234' }))).rejects.toThrow(
        ConflictError,
      );
    });
  });

  describe('update', () => {
    it('atualiza um automóvel', async () => {
      const car = await carService.create(carInput());

      const updated = await carService.update(car.id, carInput({ color: 'Preto' }));

      expect(updated).toMatchObject({ id: car.id, color: 'Preto' });
      expect((await carService.findById(car.id)).color).toBe('Preto');
    });

    it('permite manter a própria placa', async () => {
      const car = await carService.create(carInput({ plate: 'ABC1234' }));

      await expect(
        carService.update(car.id, carInput({ plate: 'ABC1234', brand: 'Ford' })),
      ).resolves.toMatchObject({ brand: 'Ford' });
    });

    it('não permite usar a placa de outro automóvel', async () => {
      await carService.create(carInput({ plate: 'ABC1234' }));
      const otherCar = await carService.create(carInput({ plate: 'XYZ9876' }));

      await expect(carService.update(otherCar.id, carInput({ plate: 'ABC1234' }))).rejects.toThrow(
        ConflictError,
      );
    });

    it('lança NotFoundError para automóvel inexistente', async () => {
      await expect(carService.update('missing-id', carInput())).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('exclui um automóvel', async () => {
      const car = await carService.create(carInput());

      await carService.delete(car.id);

      await expect(carService.findById(car.id)).rejects.toThrow(NotFoundError);
    });

    it('não permite excluir automóvel com registros de utilização', async () => {
      const car = await carService.create(carInput());
      await carUsageRepository.create({
        carId: car.id,
        driverId: 'driver-id',
        reason: 'Visita a cliente',
        startDate: new Date('2024-01-01T08:00:00Z'),
        endDate: new Date('2024-01-01T18:00:00Z'),
      });

      await expect(carService.delete(car.id)).rejects.toThrow(ConflictError);
      await expect(carService.findById(car.id)).resolves.toBeDefined();
    });

    it('lança NotFoundError para automóvel inexistente', async () => {
      await expect(carService.delete('missing-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findById', () => {
    it('lança NotFoundError para automóvel inexistente', async () => {
      await expect(carService.findById('missing-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    beforeEach(async () => {
      await carService.create(carInput({ plate: 'AAA1111', color: 'Prata', brand: 'Fiat' }));
      await carService.create(carInput({ plate: 'BBB2222', color: 'Preto', brand: 'Fiat' }));
      await carService.create(carInput({ plate: 'CCC3333', color: 'Prata', brand: 'Citroën' }));
    });

    const platesOf = (cars: { plate: string }[]) => cars.map((car) => car.plate);

    it('lista todos os automóveis sem filtros', async () => {
      expect(platesOf(await carService.list())).toEqual(['AAA1111', 'BBB2222', 'CCC3333']);
    });

    it('filtra por cor', async () => {
      expect(platesOf(await carService.list({ color: 'prata' }))).toEqual(['AAA1111', 'CCC3333']);
    });

    it('filtra por marca ignorando acentos', async () => {
      expect(platesOf(await carService.list({ brand: 'citroen' }))).toEqual(['CCC3333']);
    });

    it('combina os filtros de cor e marca', async () => {
      expect(platesOf(await carService.list({ color: 'PRATA', brand: 'FIAT' }))).toEqual([
        'AAA1111',
      ]);
    });

    it('retorna lista vazia quando nenhum automóvel atende aos filtros', async () => {
      expect(await carService.list({ color: 'Azul' })).toEqual([]);
    });
  });
});
