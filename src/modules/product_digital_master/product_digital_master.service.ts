// product-digital-master.service.ts

import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { ProductDigitalMaster } from './entites/product_digital_master.entity';
import { Repository } from 'typeorm';
import paginate from '@/shared/pagination';

@Injectable()
export class ProductDigitalMasterService {
  constructor(
    @InjectRepository(ProductDigitalMaster)
    private productMasterRepository: Repository<ProductDigitalMaster>
  ) {}

  async list(filter: any): Promise<any> {
    const page = filter.page || 1;
    const limit = filter.limit || 1;

    const query = this.productMasterRepository.createQueryBuilder('product');

    if (filter.product_digital_brand_id) {
      query.where(
        'product.product_digital_brand_id = :product_digital_brand_id',
        { product_digital_brand_id: filter.product_digital_brand_id }
      );
    }

    if (filter.is_bill_payment !== undefined) {
      query.andWhere('product.is_bill_payment = :is_bill_payment', {
        is_bill_payment: filter.is_bill_payment,
      });
    }

    if (filter.status !== undefined) {
      query.andWhere('product.status = :status', { status: filter.status });
    }

    if (filter.name) {
      query.andWhere('product.name LIKE :name', { name: `%${filter.name}%` });
    }

    if (filter.product_code) {
      query.andWhere('product.product_code LIKE :product_code', {
        product_code: `%${filter.product_code}%`,
      });
    }

    query
      .leftJoinAndSelect('product.product_companies', 'product_companies')
      .orderBy('product.name', 'ASC');

    const result = await paginate(query, { page, limit });

    return {
      ...result,
      data: {
        ...result?.data,
        content: result?.data.content.map((item) => ({
          ...item,
          product_companies:
            item.product_companies.length > 0
              ? item.product_companies[0]
              : null,
        })),
      },
    };
  }
}
