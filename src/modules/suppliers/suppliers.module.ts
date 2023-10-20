import { KoperasiMiddleware } from '@/middleware/jwt-strategy';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductCompaniesService } from '../product_companies/product_companies.service';
import { ProductCompany } from '../product_companies/entities/product_companies.entity';
import { ProductDigitalBrand } from '../product_digital_brands/entities/product_digital_brand.entity';
import { ProductDigitalCategory } from '../product_digital_categories/entities/product_digital_categories.entity';
import { ProductDigitalMaster } from '../product_digital_master/entites/product_digital_master.entity';
import { ProductDigitalMasterService } from '../product_digital_master/product_digital_master.service';
import { Supplier } from './entities/suppliers.entity';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Supplier,
      ProductCompany,
      ProductDigitalBrand,
      ProductDigitalCategory,
      ProductDigitalMaster,
    ]),
  ],
  controllers: [SuppliersController],
  providers: [
    SuppliersService,
    ProductCompaniesService,
    ProductDigitalMasterService,
  ],
})
export class SuppliersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(KoperasiMiddleware).forRoutes(SuppliersController);
  }
}
