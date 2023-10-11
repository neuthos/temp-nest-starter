// product-digital-categories.controller.ts

import { Controller, Get } from '@nestjs/common';
import { ProductDigitalCategoriesService } from './product_digital_categories.service';
import { ProductDigitalCategory } from './entities/product_digital_categories.entity';

@Controller('product-categories')
export class ProductDigitalCategoriesController {
  constructor(
    private readonly categoryService: ProductDigitalCategoriesService
  ) {}

  @Get()
  async list(): Promise<ProductDigitalCategory[]> {
    return this.categoryService.list();
  }
}
