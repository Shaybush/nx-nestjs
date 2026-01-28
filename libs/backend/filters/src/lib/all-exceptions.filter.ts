import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    let statusCode: number;
    let message: string;
    let error: string;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>)['message'] as string ?? exception.message;
      error = exception.name;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal Server Error';
      error = 'InternalServerError';
    }

    const timestamp = new Date().toISOString();
    const path = request.url as string;
    const method = request.method as string;

    this.logger.error(
      `[${timestamp}] ${method} ${path} - ${statusCode} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const responseBody = {
      statusCode,
      message,
      error,
      timestamp,
      path,
    };

    response.status(statusCode).json(responseBody);
  }
}
