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
    @Query('brandId') brandId: string,
    @Query('prefix') prefix?: string
  ) {
    return this.mobileService.getProductByBrand(
      brandId,
      companyId ?? '742072a3-8f1c-442c-9486-99da8c013002',
      prefix
    );
  }

  @Get('payment-method')
  async getPaymentMethod() {
    return this.mobileService.getPaymentMethod();
  }
}
