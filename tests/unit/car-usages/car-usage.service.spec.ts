import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Car } from '../../../src/modules/cars/car.entity';
import { InMemoryCarRepository } from '../../../src/modules/cars/in-memory-car.repository';
import { CarUsageService } from '../../../src/modules/car-usages/car-usage.service';
import { InMemoryCarUsageRepository } from '../../../src/modules/car-usages/in-memory-car-usage.repository';
import type { Driver } from '../../../src/modules/drivers/driver.entity';
import { InMemoryDriverRepository } from '../../../src/modules/drivers/in-memory-driver.repository';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../src/shared/errors/app-error';
import { carInput, driverInput } from '../../helpers/fixtures';

const NOW = new Date('2024-05-10T12:00:00Z');

describe('CarUsageService', () => {
  let carRepository: InMemoryCarRepository;
  let driverRepository: InMemoryDriverRepository;
  let service: CarUsageService;
  let car: Car;
  let driver: Driver;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    carRepository = new InMemoryCarRepository();
    driverRepository = new InMemoryDriverRepository();
    service = new CarUsageService(
      new InMemoryCarUsageRepository(),
      carRepository,
      driverRepository,
    );

    car = await carRepository.create(carInput({ plate: 'ABC1234' }));
    driver = await driverRepository.create(driverInput({ name: 'João' }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('start', () => {
    it('registra a utilização com o motorista e o automóvel', async () => {
      const usage = await service.start({
        carId: car.id,
        driverId: driver.id,
        reason: 'Visita a cliente',
        startDate: new Date('2024-05-10T08:00:00Z'),
      });

      expect(usage).toEqual({
        id: expect.any(String),
        startDate: new Date('2024-05-10T08:00:00Z'),
        endDate: null,
        reason: 'Visita a cliente',
        driver: { id: driver.id, name: 'João' },
        car: { id: car.id, plate: 'ABC1234', color: 'Prata', brand: 'Fiat' },
        createdAt: NOW,
        updatedAt: NOW,
      });
    });

    it('usa a data/hora atual quando a data de início não é informada', async () => {
      const usage = await service.start({ carId: car.id, driverId: driver.id, reason: 'Entrega' });

      expect(usage.startDate).toEqual(NOW);
    });

    it('lança NotFoundError quando o automóvel não existe', async () => {
      await expect(
        service.start({ carId: 'missing-id', driverId: driver.id, reason: 'Entrega' }),
      ).rejects.toThrow(new NotFoundError('Automóvel não encontrado.'));
    });

    it('lança NotFoundError quando o motorista não existe', async () => {
      await expect(
        service.start({ carId: car.id, driverId: 'missing-id', reason: 'Entrega' }),
      ).rejects.toThrow(new NotFoundError('Motorista não encontrado.'));
    });

    it('não permite que o automóvel seja utilizado por dois motoristas ao mesmo tempo', async () => {
      const otherDriver = await driverRepository.create(driverInput({ name: 'Maria' }));
      await service.start({ carId: car.id, driverId: driver.id, reason: 'Entrega' });

      await expect(
        service.start({ carId: car.id, driverId: otherDriver.id, reason: 'Reunião' }),
      ).rejects.toThrow(ConflictError);
    });

    it('não permite que o motorista utilize dois automóveis ao mesmo tempo', async () => {
      const otherCar = await carRepository.create(carInput({ plate: 'XYZ9876' }));
      await service.start({ carId: car.id, driverId: driver.id, reason: 'Entrega' });

      await expect(
        service.start({ carId: otherCar.id, driverId: driver.id, reason: 'Reunião' }),
      ).rejects.toThrow(ConflictError);
    });

    it('permite uma nova utilização após a anterior ser finalizada', async () => {
      const otherDriver = await driverRepository.create(driverInput({ name: 'Maria' }));
      const first = await service.start({
        carId: car.id,
        driverId: driver.id,
        reason: 'Entrega',
        startDate: new Date('2024-05-10T08:00:00Z'),
      });
      await service.finish(first.id, { endDate: new Date('2024-05-10T10:00:00Z') });

      // O término de uma utilização pode coincidir com o início da próxima.
      const second = await service.start({
        carId: car.id,
        driverId: otherDriver.id,
        reason: 'Reunião',
        startDate: new Date('2024-05-10T10:00:00Z'),
      });

      expect(second.driver.name).toBe('Maria');
    });

    it('não permite registro retroativo que se sobreponha a uma utilização já finalizada', async () => {
      const otherDriver = await driverRepository.create(driverInput({ name: 'Maria' }));
      const first = await service.start({
        carId: car.id,
        driverId: driver.id,
        reason: 'Entrega',
        startDate: new Date('2024-05-10T08:00:00Z'),
      });
      await service.finish(first.id, { endDate: new Date('2024-05-10T10:00:00Z') });

      await expect(
        service.start({
          carId: car.id,
          driverId: otherDriver.id,
          reason: 'Reunião',
          startDate: new Date('2024-05-10T09:00:00Z'),
        }),
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('finish', () => {
    it('finaliza a utilização com a data/hora atual quando a data de término não é informada', async () => {
      const usage = await service.start({
        carId: car.id,
        driverId: driver.id,
        reason: 'Entrega',
        startDate: new Date('2024-05-10T08:00:00Z'),
      });

      const finished = await service.finish(usage.id, {});

      expect(finished).toMatchObject({ id: usage.id, endDate: NOW });
      expect((await service.findById(usage.id)).endDate).toEqual(NOW);
    });

    it('finaliza a utilização com a data de término informada', async () => {
      const usage = await service.start({
        carId: car.id,
        driverId: driver.id,
        reason: 'Entrega',
        startDate: new Date('2024-05-10T08:00:00Z'),
      });

      const finished = await service.finish(usage.id, {
        endDate: new Date('2024-05-10T09:30:00Z'),
      });

      expect(finished.endDate).toEqual(new Date('2024-05-10T09:30:00Z'));
    });

    it('não permite finalizar uma utilização já finalizada', async () => {
      const usage = await service.start({ carId: car.id, driverId: driver.id, reason: 'Entrega' });
      await service.finish(usage.id, {});

      await expect(service.finish(usage.id, {})).rejects.toThrow(ConflictError);
    });

    it('não permite data de término anterior à data de início', async () => {
      const usage = await service.start({
        carId: car.id,
        driverId: driver.id,
        reason: 'Entrega',
        startDate: new Date('2024-05-10T08:00:00Z'),
      });

      await expect(
        service.finish(usage.id, { endDate: new Date('2024-05-10T07:59:59Z') }),
      ).rejects.toThrow(ValidationError);
    });

    it('lança NotFoundError para utilização inexistente', async () => {
      await expect(service.finish('missing-id', {})).rejects.toThrow(NotFoundError);
    });
  });

  describe('findById', () => {
    it('retorna a utilização com o motorista e o automóvel', async () => {
      const usage = await service.start({ carId: car.id, driverId: driver.id, reason: 'Entrega' });

      expect(await service.findById(usage.id)).toEqual(usage);
    });

    it('lança NotFoundError para utilização inexistente', async () => {
      await expect(service.findById('missing-id')).rejects.toThrow(NotFoundError);
    });
  });

  describe('list', () => {
    it('lista as utilizações mais recentes primeiro, com o nome do motorista e os dados do automóvel', async () => {
      const otherCar = await carRepository.create(
        carInput({ plate: 'XYZ9876', color: 'Preto', brand: 'Ford' }),
      );
      const otherDriver = await driverRepository.create(driverInput({ name: 'Maria' }));
      const older = await service.start({
        carId: car.id,
        driverId: driver.id,
        reason: 'Entrega',
        startDate: new Date('2024-05-10T08:00:00Z'),
      });
      const newer = await service.start({
        carId: otherCar.id,
        driverId: otherDriver.id,
        reason: 'Reunião',
        startDate: new Date('2024-05-10T09:00:00Z'),
      });

      const usages = await service.list();

      expect(usages).toEqual([newer, older]);
      expect(usages[0]).toMatchObject({
        driver: { name: 'Maria' },
        car: { plate: 'XYZ9876', color: 'Preto', brand: 'Ford' },
      });
    });

    it('retorna lista vazia quando não há utilizações', async () => {
      expect(await service.list()).toEqual([]);
    });
  });
});
