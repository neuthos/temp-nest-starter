import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import UserStreamData from './types/userStream.types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>
  ) {}

  async createOrUpdateUser(data: UserStreamData) {
    const user = await this.userRepo.findOne({
      select: ['uuid'],
      where: {
        uuid: data.user_id,
      },
    });

    if (user) {
      this.logger.log('🟢 DO UPDATE data USER from CDC 🟢');
      user.company_id = data.company_id;
      user.email = data.email;
      user.name = data.name;
      user.nik = data.identity_card_number;
      user.phoneNumber = data.phone;
      user.pin = data.pin;
      await this.userRepo.save(user);

      this.logger.log('🟢 DONE UPDATE data USER from CDC 🟢');
    } else {
      this.logger.log('🟢 DO CREATE data USER from CDC 🟢');
      await this.userRepo.insert({
        uuid: data.user_id,
        company_id: data.company_id,
        email: data.email,
        name: data.name,
        nik: data.identity_card_number,
        phoneNumber: data.phone,
        pin: data.pin,
      });
      this.logger.log('🟢 DO UPDATE data USER from CDC 🟢');
    }
  }

  async getUserPin(userId: string) {
    const user = await this.userRepo.findOne({
      where: {
        user_id: userId,
      },
      select: ['pin'],
    });

    return user;
  }
}
