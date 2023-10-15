import { KoperasiMiddleware } from '@/middleware/jwt-strategy';
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductDigitalMaster } from './entites/product_digital_master.entity';
import { ProductDigitalMasterController } from './product_digital_master.controller';
import { ProductDigitalMasterService } from './product_digital_master.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ProductDigitalMaster])],
  controllers: [ProductDigitalMasterController],
  providers: [ProductDigitalMasterService],
})
export class ProductDigitalMasterModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(KoperasiMiddleware)
      .forRoutes(ProductDigitalMasterController);
  }
}
