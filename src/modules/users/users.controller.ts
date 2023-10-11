import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import UserStreamData from './types/userStream.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('STREAM-USER')
  public async listenCompanyTags(@Payload() data: UserStreamData) {
    return this.usersService.createOrUpdateUser(data);
  }
}
