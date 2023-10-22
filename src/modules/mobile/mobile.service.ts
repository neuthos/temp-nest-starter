import { Injectable } from '@nestjs/common';
import { NormalException } from '@/exception';
import { ProductCompaniesService } from '../product_companies/product_companies.service';
import { ProductDigitalBrandsService } from '../product_digital_brands/product_digital_brands.service';
import { ProductDigitalCategoriesService } from '../product_digital_categories/product_digital_categories.service';

@Injectable()
export class MobileService {
  constructor(
    private readonly productCategoryService: ProductDigitalCategoriesService,
    private readonly productBrandService: ProductDigitalBrandsService,
    private readonly productCompaniesService: ProductCompaniesService
  ) {}

  async getCategories() {
    const data = await this.productCategoryService.list();
    return data;
  }

  async getBrands(categoryId: string) {
    const data = await this.productBrandService.listByCategory(categoryId);
    return data;
  }

  async getProductByBrand(brandId: string, companyId: string, prefix?: string) {
    if (!brandId) {
      throw NormalException.NOTFOUND('Query tidak lengkap');
    }

    return this.productCompaniesService.mobileList(brandId, companyId, prefix);
  }
}
