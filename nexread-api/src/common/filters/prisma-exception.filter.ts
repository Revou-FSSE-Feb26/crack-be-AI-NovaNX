import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import type { Response } from 'express';

/**
 * Translates Prisma's known request errors (constraint violations, missing
 * records, etc.) into proper HTTP responses instead of leaking a raw 500.
 *
 * https://www.prisma.io/docs/orm/reference/error-reference#error-codes
 */
@Catch(PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const httpException = this.toHttpException(exception);

    response
      .status(httpException.getStatus())
      .json(httpException.getResponse());
  }

  private toHttpException(
    exception: PrismaClientKnownRequestError,
  ): HttpException {
    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.['target'];
        const fields = Array.isArray(target) ? target.join(', ') : undefined;
        return new ConflictException(
          fields
            ? `A record with this ${fields} already exists`
            : 'A record with these unique fields already exists',
        );
      }
      case 'P2003':
        return new BadRequestException(
          'One or more referenced records do not exist',
        );
      case 'P2025':
        return new NotFoundException('Record not found');
      default:
        return new InternalServerErrorException('Database error');
    }
  }
}
