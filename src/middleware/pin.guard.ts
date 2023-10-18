import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { NormalException } from '@/exception';

import { UsersService } from '@/modules/users/users.service';
import { hashSHA256NonSalt } from '@util/helper';

@Injectable()
export class ProtectPinGuard implements CanActivate {
  private readonly logger = new Logger(ProtectPinGuard.name);

  constructor(private readonly userService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    this.logger.log(`🔵 Action From: ${request.headers.user_guid}`);

    const user = await this.userService.getUserPin(request.headers.user_guid);

    if (!user) {
      this.logger.log(`🟠 User Not Found ${request.headers.user_guid}`);
      throw NormalException.VALIDATION_ERROR(
        'PIN pengguna belum diatur. Silakan atur PIN sebelum melanjutkan.'
      );
    }

    const expectedPin = user.pin;

    if (request.headers.pin === undefined) {
      this.logger.log('🟠 Pin Not Match');
      throw NormalException.VALIDATION_ERROR('Pin tidak valid');
    }

    const hashReqPin = hashSHA256NonSalt(request.headers.pin);
    const pinIsMatch = hashReqPin === expectedPin;

    if (request.headers.pin === undefined || !pinIsMatch) {
      this.logger.log('🟠 Pin Not Match');
      throw NormalException.VALIDATION_ERROR('Pin tidak valid');
    }

    return true;
  }
}
