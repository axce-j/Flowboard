import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  path: string;
  timestamp: string;
  message: string | string[];
  error: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const httpResponse = isHttp ? exception.getResponse() : null;
    const message =
      httpResponse && typeof httpResponse === 'object' && 'message' in httpResponse
        ? (httpResponse as any).message
        : isHttp
          ? exception.message
          : 'Internal server error';

    const error =
      httpResponse && typeof httpResponse === 'object' && 'error' in httpResponse
        ? (httpResponse as any).error
        : HttpStatus[status] ?? 'Error';

    if (!isHttp) {
      // Unexpected errors always get logged server-side with full detail,
      // never leaked to the client.
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    const body: ErrorBody = {
      statusCode: status,
      path: req.url,
      timestamp: new Date().toISOString(),
      message,
      error,
    };

    res.status(status).json(body);
  }
}
