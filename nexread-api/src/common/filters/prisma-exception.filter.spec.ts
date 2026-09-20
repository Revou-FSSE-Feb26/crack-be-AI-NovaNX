/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ArgumentsHost } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { PrismaClientExceptionFilter } from './prisma-exception.filter';

describe('PrismaClientExceptionFilter', () => {
  const makeError = (code: string, meta?: Record<string, unknown>) =>
    new PrismaClientKnownRequestError('database error', {
      code,
      clientVersion: 'test',
      meta,
    });

  it.each([
    ['P2002', { target: ['email'] }, 409, 'email'],
    ['P2002', undefined, 409, 'unique fields'],
    ['P2003', undefined, 400, 'referenced records'],
    ['P2025', undefined, 404, 'Record not found'],
    ['P9999', undefined, 500, 'Database error'],
  ])(
    'maps Prisma %s errors to HTTP responses',
    (code, meta, status, message) => {
      const json = jest.fn();
      const statusFn = jest.fn().mockReturnValue({ json });
      const host = {
        switchToHttp: () => ({ getResponse: () => ({ status: statusFn }) }),
      } as unknown as ArgumentsHost;

      new PrismaClientExceptionFilter().catch(makeError(code, meta), host);

      expect(statusFn).toHaveBeenCalledWith(status);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining(message) }),
      );
    },
  );
});
