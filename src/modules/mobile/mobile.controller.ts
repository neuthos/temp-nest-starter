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
      companyId ?? '2f7b5e2b-6532-4418-97ac-32046de81d1d',
      prefix
    );
  }

  @Get('payment-method')
  async getPaymentMethod(@Query('source') source?: string) {
    return this.mobileService.getPaymentMethod(source);
  }
}
