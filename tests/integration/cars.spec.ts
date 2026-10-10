import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

describe('Rotas de automóveis (/cars)', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  const createCar = (body: object) => request(app).post('/cars').send(body);

  describe('POST /cars', () => {
    it('cadastra um automóvel normalizando a placa', async () => {
      const response = await createCar({ plate: 'abc-1d23', color: 'Prata', brand: 'Fiat' });

      expect(response.status).toBe(201);
      expect(response.headers.location).toBe(`/cars/${response.body.id}`);
      expect(response.body).toEqual({
        id: expect.any(String),
        plate: 'ABC1D23',
        color: 'Prata',
        brand: 'Fiat',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('responde 400 com os detalhes de cada campo inválido', async () => {
      const response = await createCar({ plate: '123', color: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toEqual([
        'plate',
        'color',
        'brand',
      ]);
    });

    it('responde 409 para placa já cadastrada', async () => {
      await createCar({ plate: 'ABC1234', color: 'Prata', brand: 'Fiat' });

      const response = await createCar({ plate: 'abc-1234', color: 'Preto', brand: 'Ford' });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('GET /cars/:id', () => {
    it('recupera um automóvel pelo id', async () => {
      const { body: car } = await createCar({ plate: 'ABC1234', color: 'Prata', brand: 'Fiat' });

      const response = await request(app).get(`/cars/${car.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(car);
    });

    it('responde 404 para automóvel inexistente', async () => {
      const response = await request(app).get('/cars/missing-id');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'Automóvel não encontrado.',
          timestamp: expect.any(String),
          path: '/cars/missing-id',
          requestId: response.headers['x-request-id'],
        },
      });
    });
  });

  describe('GET /cars', () => {
    beforeEach(async () => {
      await createCar({ plate: 'AAA1111', color: 'Prata', brand: 'Fiat' });
      await createCar({ plate: 'BBB2222', color: 'Preto', brand: 'Fiat' });
      await createCar({ plate: 'CCC3333', color: 'Prata', brand: 'Ford' });
    });

    const platesOf = (response: request.Response) =>
      response.body.map((car: { plate: string }) => car.plate);

    it('lista todos os automóveis', async () => {
      const response = await request(app).get('/cars');

      expect(response.status).toBe(200);
      expect(platesOf(response)).toEqual(['AAA1111', 'BBB2222', 'CCC3333']);
    });

    it('filtra por cor', async () => {
      expect(platesOf(await request(app).get('/cars?color=prata'))).toEqual(['AAA1111', 'CCC3333']);
    });

    it('filtra por marca', async () => {
      expect(platesOf(await request(app).get('/cars?brand=FIAT'))).toEqual(['AAA1111', 'BBB2222']);
    });

    it('filtra por cor e marca', async () => {
      expect(
        platesOf(await request(app).get('/cars').query({ color: 'Prata', brand: 'Ford' })),
      ).toEqual(['CCC3333']);
    });
  });

  describe('PUT /cars/:id', () => {
    it('atualiza um automóvel', async () => {
      const { body: car } = await createCar({ plate: 'ABC1234', color: 'Prata', brand: 'Fiat' });

      const response = await request(app)
        .put(`/cars/${car.id}`)
        .send({ plate: 'ABC1234', color: 'Vermelho', brand: 'Fiat' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ id: car.id, color: 'Vermelho' });
    });

    it('responde 400 quando faltam campos', async () => {
      const { body: car } = await createCar({ plate: 'ABC1234', color: 'Prata', brand: 'Fiat' });

      const response = await request(app).put(`/cars/${car.id}`).send({ color: 'Vermelho' });

      expect(response.status).toBe(400);
    });

    it('responde 404 para automóvel inexistente', async () => {
      const response = await request(app)
        .put('/cars/missing-id')
        .send({ plate: 'ABC1234', color: 'Prata', brand: 'Fiat' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /cars/:id', () => {
    it('exclui um automóvel', async () => {
      const { body: car } = await createCar({ plate: 'ABC1234', color: 'Prata', brand: 'Fiat' });

      const response = await request(app).delete(`/cars/${car.id}`);

      expect(response.status).toBe(204);
      expect((await request(app).get(`/cars/${car.id}`)).status).toBe(404);
    });

    it('responde 404 para automóvel inexistente', async () => {
      expect((await request(app).delete('/cars/missing-id')).status).toBe(404);
    });
  });
});
