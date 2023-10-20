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

  async list(filter: any, companyId: string): Promise<any> {
    const page = filter.page || 1;
    const limit = filter.limit || 1;

    const query = this.productMasterRepository
      .createQueryBuilder('product')
      .where('product.status = 1')
      .andWhere('product.company_id is null')
      .orWhere('product.company_id = :companyId', { companyId });

    if (filter.product_digital_brand_id) {
      query.andWhere(
        'product.product_digital_brand_id = :product_digital_brand_id',
        { product_digital_brand_id: filter.product_digital_brand_id }
      );
    }

    if (filter.is_bill_payment !== undefined) {
      query.andWhere('product.is_bill_payment = :is_bill_payment', {
        is_bill_payment: +filter.is_bill_payment,
      });
    }

    if (filter.name) {
      query.andWhere('product.name LIKE :name', { name: `%${filter.name}%` });
    }

    if (filter.product_code) {
      query.andWhere('product.product_code LIKE :product_code', {
        product_code: `%${filter.product_code}%`,
      });
    }

    query.leftJoinAndMapOne(
      'product.product_companies',
      'product_companies',
      'product_companies',
      `product_companies.company_id = :companyId AND product_companies.product_digital_master_id = product.uuid`,
      { companyId }
    );

    query
      .leftJoin('product_companies.supplier', 'supplier')
      .addSelect(['supplier.uuid', 'supplier.name'])
      .orderBy('product.name', 'ASC');

    // query.andWhere('product_companies.status = 0');
    const result = await paginate(query, { page, limit });
    return result;
  }
}
