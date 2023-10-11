import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { NormalException } from '@/exception';

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    this.logger.error(exception.stack);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    response
      .status(exception?.getStatus?.() || HttpStatus.BAD_REQUEST)
      .send(NormalException.UNEXPECTED(exception?.message).toJSON());
  }
}
