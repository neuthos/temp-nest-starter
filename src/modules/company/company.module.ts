import { ClientsModule, Transport } from '@nestjs/microservices';
import { Company } from './entities/company.entity';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { KoperasiMiddleware } from '@/middleware/jwt-strategy';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductCompaniesService } from '../product_companies/product_companies.service';
import { ProductCompany } from '../product_companies/entities/product_companies.entity';
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
      ProductDigitalMaster,
      ProductDigitalBrand,
      ProductDigitalCategory,
      Supplier,
      Company,
    ]),
    ClientsModule.register([
      {
        name: 'SERVICE_USER',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'PRODUCTDIGITAL_STREAM_QUEUE',
          persistent: true,
          prefetchCount: 2,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [CompanyController],
  providers: [
    SuppliersService,
    ProductCompaniesService,
    ProductDigitalMasterService,
    CompanyService,
  ],
})
export class CompanyModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(KoperasiMiddleware).forRoutes(CompanyController);
  }
}
