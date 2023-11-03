import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { NormalException } from '@/exception';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>
  ) {}

  async create(createUserDto: User) {
    const newUser = this.userRepo.create(createUserDto);
    await this.userRepo.save(newUser);
    return newUser;
  }

  findAll() {
    return this.userRepo.find();
  }

  async findOne(id: string) {
    return this.userRepo.findOne(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (!user) {
      throw NormalException.NOTFOUND('User tidak ditemukan');
    }
    user.name = updateUserDto.name;
    await this.userRepo.save(user);
    return `Berhasil update user dengan nama ${user.name}`;
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw NormalException.NOTFOUND('User tidak ditemukan');
    }
    await this.userRepo.delete(id);

    return `This action removes a #${id} user`;
  }
}
