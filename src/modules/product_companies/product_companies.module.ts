import { Module } from '@nestjs/common';
import { ProductCompaniesController } from './product_companies.controller';
import { ProductCompaniesService } from './product_companies.service';
import { ProductCompany } from './entities/product_companies.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ProductCompany])],
  controllers: [ProductCompaniesController],
  providers: [ProductCompaniesService],
})
export class ProductCompaniesModule {}
