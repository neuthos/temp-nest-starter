import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import {
  AllExceptionFilter,
  NormalExceptionFilter,
  ValidationExceptionFilter,
} from '@/filter';
import { AppConfig } from './app.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from '../company/company.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { Module, ValidationError, ValidationPipe } from '@nestjs/common';
import { ProductCompaniesModule } from '../product_companies/product_companies.module';
import { ProductDigitalBrandsModule } from '../product_digital_brands/product_digital_brands.module';
import { ProductDigitalCategoriesModule } from '../product_digital_categories/product_digital_categories.module';
import { ProductDigitalMasterModule } from '../product_digital_master/product_digital_master.module';
import { ResponseInterceptor } from '@/interceptor/response.interceptor';
import { SuppliersModule } from '../suppliers/suppliers.module';
import { TypeOrmConfigService } from '../typeorm/typeorm.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(AppConfig.getInitConifg()),
    LoggerModule.forRoot(AppConfig.getLoggerConfig()),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
    }),
    CompanyModule,
    UsersModule,
    SuppliersModule,
    ProductDigitalCategoriesModule,
    ProductDigitalBrandsModule,
    ProductDigitalMasterModule,
    ProductCompaniesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    { provide: APP_FILTER, useClass: NormalExceptionFilter },
    { provide: APP_FILTER, useClass: ValidationExceptionFilter },
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          exceptionFactory: (errors: ValidationError[]) => {
            return errors[0];
          },
        }),
    },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
