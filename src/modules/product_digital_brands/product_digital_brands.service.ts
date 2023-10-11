import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ProductDigitalBrand } from './entities/product_digital_brand.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductDigitalBrandsService {
  constructor(
    @InjectRepository(ProductDigitalBrand)
    private readonly brandRepository: Repository<ProductDigitalBrand>
  ) {}

  async listByCategory(
    productDigitalCategoryId: string
  ): Promise<ProductDigitalBrand[]> {
    return this.brandRepository.find({
      where: {
        status: 1,
        product_digital_category_id: productDigitalCategoryId,
      },
      order: { priority: 'ASC' },
    });
  }
}
