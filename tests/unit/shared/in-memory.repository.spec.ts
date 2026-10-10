import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Entity } from '../../../src/shared/domain/entity';
import { InMemoryRepository } from '../../../src/shared/repositories/in-memory.repository';

interface Book extends Entity {
  title: string;
}

class InMemoryBookRepository extends InMemoryRepository<Book> {}

describe('InMemoryRepository', () => {
  let repository: InMemoryBookRepository;

  beforeEach(() => {
    repository = new InMemoryBookRepository();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gera id e datas de criação/atualização ao criar', async () => {
    const book = await repository.create({ title: 'Clean Code' });

    expect(book).toEqual({
      id: expect.any(String),
      title: 'Clean Code',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
    });
    expect(await repository.findById(book.id)).toEqual(book);
  });

  it('gera ids diferentes para cada entidade', async () => {
    const first = await repository.create({ title: 'A' });
    const second = await repository.create({ title: 'B' });

    expect(first.id).not.toBe(second.id);
  });

  it('atualiza os campos informados e a data de atualização', async () => {
    const book = await repository.create({ title: 'Clean Code' });
    vi.setSystemTime(new Date('2024-01-02T10:00:00Z'));

    const updated = await repository.update(book.id, { title: 'Refactoring' });

    expect(updated).toEqual({
      ...book,
      title: 'Refactoring',
      updatedAt: new Date('2024-01-02T10:00:00Z'),
    });
  });

  it('lança erro ao atualizar uma entidade inexistente', async () => {
    await expect(repository.update('missing-id', { title: 'X' })).rejects.toThrow();
  });

  it('não permite alterar o estado interno modificando o objeto retornado', async () => {
    const book = await repository.create({ title: 'Clean Code' });

    book.title = 'Alterado fora do repositório';
    const found = await repository.findById(book.id);
    found!.title = 'Alterado novamente';

    expect((await repository.findById(book.id))?.title).toBe('Clean Code');
  });

  it('busca várias entidades pelos ids', async () => {
    const first = await repository.create({ title: 'A' });
    await repository.create({ title: 'B' });
    const third = await repository.create({ title: 'C' });

    const books = await repository.findByIds([first.id, third.id, 'missing-id']);

    expect(books.map((book) => book.title)).toEqual(['A', 'C']);
  });

  it('exclui uma entidade', async () => {
    const book = await repository.create({ title: 'Clean Code' });

    await repository.delete(book.id);

    expect(await repository.findById(book.id)).toBeNull();
  });
});
