import { Company } from '../company/entities/company.entity';
import { CompanyService } from '../company/company.service';
import { HttpModule } from '@nestjs/axios';
import { HttpRequestService } from '../http-request/http-request.service';
import { KoperasiMiddleware } from '@/middleware/jwt-strategy';
import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ProductCompaniesService } from '../product_companies/product_companies.service';
import { ProductCompany } from '../product_companies/entities/product_companies.entity';
import { ProductDigitalBrand } from '../product_digital_brands/entities/product_digital_brand.entity';
import { ProductDigitalMaster } from '../product_digital_master/entites/product_digital_master.entity';
import { ProductDigitalMasterService } from '../product_digital_master/product_digital_master.service';
import { RabbitmqPublisherService } from '../rmq-publisher/rmq-publisher.service';
import { Supplier } from '../suppliers/entities/suppliers.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { Transaction } from './entities/transaction.entity';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/users.entity';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      Transaction,
      Supplier,
      ProductCompany,
      ProductDigitalBrand,
      ProductDigitalMaster,
      User,
      Company,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [
    UsersService,
    TransactionsService,
    SuppliersService,
    ProductCompaniesService,
    RabbitmqPublisherService,
    ProductDigitalMasterService,
    HttpRequestService,
    CompanyService,
  ],
})
export class TransactionsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(KoperasiMiddleware)
      .exclude({
        path: 'transactions/callback',
        method: RequestMethod.POST,
      })
      .forRoutes(TransactionsController);
  }
}
