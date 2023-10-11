// product-digital-categories.service.ts

import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ProductDigitalCategory } from './entities/product_digital_categories.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductDigitalCategoriesService {
  constructor(
    @InjectRepository(ProductDigitalCategory)
    private readonly categoryRepository: Repository<ProductDigitalCategory>
  ) {}

  async list(): Promise<ProductDigitalCategory[]> {
    return this.categoryRepository.find({
      where: { status: 1 },
      order: { priority: 'ASC' },
    });
  }
}
