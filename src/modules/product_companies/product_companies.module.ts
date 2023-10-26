import { Company } from '../company/entities/company.entity';
import { CompanyService } from '../company/company.service';
import { KoperasiMiddleware } from '@/middleware/jwt-strategy';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductCompaniesController } from './product_companies.controller';
import { ProductCompaniesService } from './product_companies.service';
import { ProductCompany } from './entities/product_companies.entity';
import { ProductDigitalBrand } from '../product_digital_brands/entities/product_digital_brand.entity';
import { ProductDigitalCategory } from '../product_digital_categories/entities/product_digital_categories.entity';
import { ProductDigitalMaster } from '../product_digital_master/entites/product_digital_master.entity';
import { ProductDigitalMasterService } from '../product_digital_master/product_digital_master.service';
import { Supplier } from '../suppliers/entities/suppliers.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductCompany,
      Supplier,
      ProductDigitalCategory,
      ProductDigitalMaster,
      ProductDigitalBrand,
      Company,
    ]),
  ],

  controllers: [ProductCompaniesController],
  providers: [
    ProductCompaniesService,
    ProductDigitalMasterService,
    SuppliersService,
    CompanyService,
  ],
})
export class ProductCompaniesModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(KoperasiMiddleware).forRoutes(ProductCompaniesController);
  }
}
