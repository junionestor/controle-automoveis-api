import type { Express } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';

describe('Rotas de motoristas (/drivers)', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp();
  });

  const createDriver = (name: unknown) => request(app).post('/drivers').send({ name });

  it('POST /drivers cadastra um motorista', async () => {
    const response = await createDriver('  João da Silva ');

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/drivers/${response.body.id}`);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'João da Silva',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
  });

  it('POST /drivers responde 400 para nome inválido', async () => {
    const response = await createDriver('');

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([
      { field: 'name', message: 'O campo "name" não pode ser vazio.' },
    ]);
  });

  it('GET /drivers/:id recupera um motorista', async () => {
    const { body: driver } = await createDriver('João da Silva');

    const response = await request(app).get(`/drivers/${driver.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(driver);
  });

  it('GET /drivers/:id responde 404 para motorista inexistente', async () => {
    const response = await request(app).get('/drivers/missing-id');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Motorista não encontrado.');
  });

  it('GET /drivers lista os motoristas e filtra por nome', async () => {
    await createDriver('João da Silva');
    await createDriver('Maria Joana');
    await createDriver('Pedro Alves');

    const all = await request(app).get('/drivers');
    const filtered = await request(app).get('/drivers').query({ name: 'joa' });

    expect(all.body).toHaveLength(3);
    expect(filtered.body.map((driver: { name: string }) => driver.name)).toEqual([
      'João da Silva',
      'Maria Joana',
    ]);
  });

  it('PUT /drivers/:id atualiza um motorista', async () => {
    const { body: driver } = await createDriver('João da Silva');

    const response = await request(app).put(`/drivers/${driver.id}`).send({ name: 'João Souza' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: driver.id, name: 'João Souza' });
  });

  it('PUT /drivers/:id responde 404 para motorista inexistente', async () => {
    const response = await request(app).put('/drivers/missing-id').send({ name: 'João' });

    expect(response.status).toBe(404);
  });

  it('DELETE /drivers/:id exclui um motorista', async () => {
    const { body: driver } = await createDriver('João da Silva');

    expect((await request(app).delete(`/drivers/${driver.id}`)).status).toBe(204);
    expect((await request(app).get(`/drivers/${driver.id}`)).status).toBe(404);
  });
});
