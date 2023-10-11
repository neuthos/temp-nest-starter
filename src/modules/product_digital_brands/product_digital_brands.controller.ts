import { Controller, Get, Param } from '@nestjs/common';
import { ProductDigitalBrand } from './entities/product_digital_brand.entity';
import { ProductDigitalBrandsService } from './product_digital_brands.service';

@Controller('product-brands')
export class ProductDigitalBrandsController {
  constructor(
    private readonly productDigitalBrandsService: ProductDigitalBrandsService
  ) {}

  @Get('/:productDigitalCategoryId')
  async listByCategory(
    @Param('productDigitalCategoryId') productDigitalCategoryId: string
  ): Promise<ProductDigitalBrand[]> {
    return this.productDigitalBrandsService.listByCategory(
      productDigitalCategoryId
    );
  }
}
