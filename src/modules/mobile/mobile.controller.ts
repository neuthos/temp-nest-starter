import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { MobileService } from './mobile.service';

@Controller('mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Get('categories')
  async getCategories() {
    return this.mobileService.getCategories();
  }

  @Get('brands/:categoryId')
  async getBrands(@Param('categoryId') categoryId: string) {
    return this.mobileService.getBrands(categoryId);
  }

  @Get('products')
  async getProductByBrand(
    @Headers('companyId') companyId: string,
    @Query('brand_id') brandId: string
  ) {
    return this.mobileService.getProductByBrand(
      brandId,
      '742072a3-8f1c-442c-9486-99da8c013002'
    );
  }
}
