import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

describe('Rotas de utilização de automóveis (/car-usages)', () => {
  let app: Express;
  let carId: string;
  let driverId: string;

  const createCar = async (plate: string): Promise<string> =>
    (await request(app).post('/cars').send({ plate, color: 'Prata', brand: 'Fiat' })).body.id;

  const createDriver = async (name: string): Promise<string> =>
    (await request(app).post('/drivers').send({ name })).body.id;

  const startUsage = (body: object) => request(app).post('/car-usages').send(body);

  beforeEach(async () => {
    app = createApp();
    carId = await createCar('ABC1234');
    driverId = await createDriver('João da Silva');
  });

  describe('POST /car-usages', () => {
    it('registra a utilização de um automóvel por um motorista', async () => {
      const response = await startUsage({
        carId,
        driverId,
        reason: 'Visita a cliente',
        startDate: '2024-05-10T08:00:00-03:00',
      });

      expect(response.status).toBe(201);
      expect(response.headers.location).toBe(`/car-usages/${response.body.id}`);
      expect(response.body).toEqual({
        id: expect.any(String),
        startDate: '2024-05-10T11:00:00.000Z',
        endDate: null,
        reason: 'Visita a cliente',
        driver: { id: driverId, name: 'João da Silva' },
        car: { id: carId, plate: 'ABC1234', color: 'Prata', brand: 'Fiat' },
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('responde 400 para dados inválidos', async () => {
      const response = await startUsage({
        carId: 'not-a-uuid',
        driverId,
        reason: '',
        startDate: '10/05/2024',
      });

      expect(response.status).toBe(400);
      expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual([
        'carId',
        'reason',
        'startDate',
      ]);
    });

    it('responde 404 quando o automóvel não existe', async () => {
      const response = await startUsage({
        carId: '00000000-0000-4000-8000-000000000000',
        driverId,
        reason: 'Entrega',
      });

      expect(response.status).toBe(404);
      expect(response.body.error.message).toBe('Automóvel não encontrado.');
    });

    it('responde 409 quando o automóvel já está em uso por outro motorista', async () => {
      const otherDriverId = await createDriver('Maria');
      await startUsage({ carId, driverId, reason: 'Entrega' });

      const response = await startUsage({ carId, driverId: otherDriverId, reason: 'Reunião' });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toBe(
        'O automóvel ABC1234 já está em utilização por um motorista no período informado.',
      );
    });

    it('responde 409 quando o motorista já está utilizando outro automóvel', async () => {
      const otherCarId = await createCar('XYZ9876');
      await startUsage({ carId, driverId, reason: 'Entrega' });

      const response = await startUsage({ carId: otherCarId, driverId, reason: 'Reunião' });

      expect(response.status).toBe(409);
      expect(response.body.error.message).toBe(
        'O motorista João da Silva já está utilizando um automóvel no período informado.',
      );
    });
  });

  describe('PATCH /car-usages/:id/finish', () => {
    it('finaliza a utilização com a data informada e libera o automóvel', async () => {
      const { body: usage } = await startUsage({
        carId,
        driverId,
        reason: 'Entrega',
        startDate: '2024-05-10T08:00:00Z',
      });

      const response = await request(app)
        .patch(`/car-usages/${usage.id}/finish`)
        .send({ endDate: '2024-05-10T12:00:00Z' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: usage.id, endDate: '2024-05-10T12:00:00.000Z' });

      const otherDriverId = await createDriver('Maria');
      const nextUsage = await startUsage({ carId, driverId: otherDriverId, reason: 'Reunião' });
      expect(nextUsage.status).toBe(201);
    });

    it('finaliza com a data/hora atual quando nenhum corpo é enviado', async () => {
      const { body: usage } = await startUsage({ carId, driverId, reason: 'Entrega' });

      const response = await request(app).patch(`/car-usages/${usage.id}/finish`);

      expect(response.status).toBe(200);
      expect(response.body.endDate).toEqual(expect.any(String));
    });

    it('responde 400 quando a data de término é anterior à de início', async () => {
      const { body: usage } = await startUsage({
        carId,
        driverId,
        reason: 'Entrega',
        startDate: '2024-05-10T08:00:00Z',
      });

      const response = await request(app)
        .patch(`/car-usages/${usage.id}/finish`)
        .send({ endDate: '2024-05-10T07:00:00Z' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('responde 409 quando a utilização já foi finalizada', async () => {
      const { body: usage } = await startUsage({ carId, driverId, reason: 'Entrega' });
      await request(app).patch(`/car-usages/${usage.id}/finish`);

      const response = await request(app).patch(`/car-usages/${usage.id}/finish`);

      expect(response.status).toBe(409);
    });

    it('responde 404 para utilização inexistente', async () => {
      expect((await request(app).patch('/car-usages/missing-id/finish')).status).toBe(404);
    });
  });

  describe('GET /car-usages', () => {
    it('lista as utilizações com o nome do motorista e os dados do automóvel', async () => {
      const { body: usage } = await startUsage({ carId, driverId, reason: 'Entrega' });

      const response = await request(app).get('/car-usages');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([usage]);
      expect(response.body[0]).toMatchObject({
        driver: { name: 'João da Silva' },
        car: { plate: 'ABC1234', color: 'Prata', brand: 'Fiat' },
      });
    });
  });

  describe('GET /car-usages/:id', () => {
    it('recupera uma utilização', async () => {
      const { body: usage } = await startUsage({ carId, driverId, reason: 'Entrega' });

      const response = await request(app).get(`/car-usages/${usage.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(usage);
    });

    it('responde 404 para utilização inexistente', async () => {
      expect((await request(app).get('/car-usages/missing-id')).status).toBe(404);
    });
  });

  describe('exclusão de automóveis e motoristas com utilizações', () => {
    it('responde 409 ao excluir automóvel ou motorista com histórico de utilização', async () => {
      await startUsage({ carId, driverId, reason: 'Entrega' });

      const deleteCar = await request(app).delete(`/cars/${carId}`);
      const deleteDriver = await request(app).delete(`/drivers/${driverId}`);

      expect(deleteCar.status).toBe(409);
      expect(deleteDriver.status).toBe(409);
    });
  });
});
