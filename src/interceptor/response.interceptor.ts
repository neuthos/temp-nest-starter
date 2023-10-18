import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { DataResponse, HttpSuccessResponse } from '@share/interfaces';
import { Observable, map } from 'rxjs';

// Re-format all non-error response to fit Google JSON style
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, HttpSuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler
  ): Observable<HttpSuccessResponse<T>> {
    return next.handle().pipe(
      map((data: DataResponse) => ({
        success: true,
        status: 200,
        msg: data.message ?? 'Berhasil',
        data: data.data ? data.data : data,
      }))
    );
  }
}
