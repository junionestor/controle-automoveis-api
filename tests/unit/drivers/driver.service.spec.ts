import { beforeEach, describe, expect, it } from 'vitest';
import { InMemoryCarUsageRepository } from '../../../src/modules/car-usages/in-memory-car-usage.repository';
import { DriverService } from '../../../src/modules/drivers/driver.service';
import { InMemoryDriverRepository } from '../../../src/modules/drivers/in-memory-driver.repository';
import { ConflictError, NotFoundError } from '../../../src/shared/errors/app-error';
import { driverInput } from '../../helpers/fixtures';

describe('DriverService', () => {
  let carUsageRepository: InMemoryCarUsageRepository;
  let driverService: DriverService;

  beforeEach(() => {
    carUsageRepository = new InMemoryCarUsageRepository();
    driverService = new DriverService(new InMemoryDriverRepository(), carUsageRepository);
  });

  it('cadastra um motorista', async () => {
    const driver = await driverService.create(driverInput());

    expect(driver).toMatchObject({ id: expect.any(String), name: 'João da Silva' });
    expect(await driverService.findById(driver.id)).toEqual(driver);
  });

  it('atualiza um motorista', async () => {
    const driver = await driverService.create(driverInput());

    const updated = await driverService.update(driver.id, { name: 'João Souza' });

    expect(updated).toMatchObject({ id: driver.id, name: 'João Souza' });
  });

  it('lança NotFoundError ao atualizar motorista inexistente', async () => {
    await expect(driverService.update('missing-id', driverInput())).rejects.toThrow(NotFoundError);
  });

  it('exclui um motorista', async () => {
    const driver = await driverService.create(driverInput());

    await driverService.delete(driver.id);

    await expect(driverService.findById(driver.id)).rejects.toThrow(NotFoundError);
  });

  it('não permite excluir motorista com registros de utilização', async () => {
    const driver = await driverService.create(driverInput());
    await carUsageRepository.create({
      carId: 'car-id',
      driverId: driver.id,
      reason: 'Visita a cliente',
      startDate: new Date('2024-01-01T08:00:00Z'),
      endDate: null,
    });

    await expect(driverService.delete(driver.id)).rejects.toThrow(ConflictError);
  });

  it('lança NotFoundError ao excluir motorista inexistente', async () => {
    await expect(driverService.delete('missing-id')).rejects.toThrow(NotFoundError);
  });

  it('lança NotFoundError ao buscar motorista inexistente', async () => {
    await expect(driverService.findById('missing-id')).rejects.toThrow(NotFoundError);
  });

  describe('list', () => {
    beforeEach(async () => {
      await driverService.create({ name: 'João da Silva' });
      await driverService.create({ name: 'Maria Joana' });
      await driverService.create({ name: 'Pedro Alves' });
    });

    const namesOf = (drivers: { name: string }[]) => drivers.map((driver) => driver.name);

    it('lista todos os motoristas sem filtro', async () => {
      expect(namesOf(await driverService.list())).toEqual([
        'João da Silva',
        'Maria Joana',
        'Pedro Alves',
      ]);
    });

    it('filtra por parte do nome ignorando maiúsculas e acentos', async () => {
      expect(namesOf(await driverService.list({ name: 'JOA' }))).toEqual([
        'João da Silva',
        'Maria Joana',
      ]);
    });

    it('retorna lista vazia quando nenhum motorista atende ao filtro', async () => {
      expect(await driverService.list({ name: 'Carlos' })).toEqual([]);
    });
  });
});
