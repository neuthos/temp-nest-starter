import { Module } from '@nestjs/common';
import { Supplier } from './entities/suppliers.entity';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Supplier])],
  controllers: [SuppliersController],
  providers: [SuppliersService],
})
export class SuppliersModule {}
