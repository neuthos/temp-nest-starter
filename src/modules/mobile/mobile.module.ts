import { MobileController } from './mobile.controller';
import { MobileService } from './mobile.service';
import { Module } from '@nestjs/common';
import { ProductCompaniesService } from '../product_companies/product_companies.service';
import { ProductCompany } from '../product_companies/entities/product_companies.entity';
import { ProductDigitalBrand } from '../product_digital_brands/entities/product_digital_brand.entity';
import { ProductDigitalBrandsService } from '../product_digital_brands/product_digital_brands.service';
import { ProductDigitalCategoriesService } from '../product_digital_categories/product_digital_categories.service';
import { ProductDigitalCategory } from '../product_digital_categories/entities/product_digital_categories.entity';
import { ProductDigitalMaster } from '../product_digital_master/entites/product_digital_master.entity';
import { ProductDigitalMasterService } from '../product_digital_master/product_digital_master.service';
import { Supplier } from '../suppliers/entities/suppliers.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductDigitalCategory,
      ProductDigitalBrand,
      ProductCompany,
      ProductDigitalMaster,
      Supplier,
    ]),
  ],

  controllers: [MobileController],
  providers: [
    MobileService,
    ProductDigitalCategoriesService,
    ProductDigitalBrandsService,
    ProductCompaniesService,
    ProductDigitalMasterService,
    SuppliersService,
  ],
})
export class MobileModule {}
