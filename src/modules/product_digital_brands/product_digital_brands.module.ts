import { KoperasiMiddleware } from '@/middleware/jwt-strategy';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductDigitalBrand } from './entities/product_digital_brand.entity';
import { ProductDigitalBrandsController } from './product_digital_brands.controller';
import { ProductDigitalBrandsService } from './product_digital_brands.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ProductDigitalBrand])],
  controllers: [ProductDigitalBrandsController],
  providers: [ProductDigitalBrandsService],
})
export class ProductDigitalBrandsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(KoperasiMiddleware)
      .forRoutes(ProductDigitalBrandsController);
  }
}
