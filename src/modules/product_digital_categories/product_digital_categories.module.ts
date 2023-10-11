import { Module } from '@nestjs/common';
import { ProductDigitalCategoriesController } from './product_digital_categories.controller';
import { ProductDigitalCategoriesService } from './product_digital_categories.service';
import { ProductDigitalCategory } from './entities/product_digital_categories.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ProductDigitalCategory])],
  controllers: [ProductDigitalCategoriesController],
  providers: [ProductDigitalCategoriesService],
})
export class ProductDigitalCategoriesModule {}
