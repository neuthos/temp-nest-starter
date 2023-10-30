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
    const brandIds = brandId.split(',');

    return this.productCompaniesService.mobileList(brandIds, companyId, prefix);
  }

  getPaymentMethod(source: string) {
    const paymentMethod = [
      {
        label: 'Cash',
        value: 'CASH',
        icon: 'https://hay-images.sgp1.digitaloceanspaces.com/cfee39d20a9a3da39eaea656e00ebb6a-original',
      },
      {
        label: 'Allowance',
        value: 'ALLOWANCE',
        icon: 'https://hay-images.sgp1.digitaloceanspaces.com/cfee39d20a9a3da39eaea656e00ebb6a-original',
      },
      {
        label: 'Qris',
        value: 'QRIS',
        icon: 'https://hay-images.sgp1.digitaloceanspaces.com/cfee39d20a9a3da39eaea656e00ebb6a-original',
      },
      // {
      //   label: 'E-Wallet',
      //   value: 'EWALLET',
      //   icon: 'https://hay-images.sgp1.digitaloceanspaces.com/cfee39d20a9a3da39eaea656e00ebb6a-original',
      // },
      // {
      //   label: 'Metode Pembayaran Lainnya',
      //   value: 'PAYMENT_METHOD',
      //   icon: 'https://hay-images.sgp1.digitaloceanspaces.com/cfee39d20a9a3da39eaea656e00ebb6a-original',
      // },
    ];

    if (source !== 'KASIR') {
      paymentMethod.shift();
    }

    return paymentMethod;
  }
}
