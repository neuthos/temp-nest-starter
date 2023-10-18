/* eslint-disable no-await-in-loop */
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { NormalException } from '@/exception';
import { ProductCompany } from './entities/product_companies.entity';
import { ProductDigitalBrand } from '../product_digital_brands/entities/product_digital_brand.entity';
import { ProductDigitalMasterService } from '../product_digital_master/product_digital_master.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import paginate from '@/shared/pagination';

@Injectable()
export class ProductCompaniesService {
  constructor(
    @InjectRepository(ProductCompany)
    private productCompanyRepo: Repository<ProductCompany>,
    @InjectRepository(ProductDigitalBrand)
    private readonly brandRepository: Repository<ProductDigitalBrand>,

    private readonly productDigitalMasterService: ProductDigitalMasterService,
    private readonly supplierService: SuppliersService
  ) {}

  private async _validateCompanyId(
    productCompanyId: string,
    companyId: string
  ): Promise<ProductCompany> {
    const productCompany = await this.productCompanyRepo.findOne({
      where: { uuid: productCompanyId, company_id: companyId },
      select: [
        'uuid',
        'company_id',
        'margin',
        'status',
        'supplier_id',
        'product_digital_master_id',
        'supplier',
      ],
    });

    if (!productCompany) {
      throw NormalException.NOTFOUND(
        'Product company not found or invalid company ID.'
      );
    }

    return productCompany;
  }

  async list(filter: any, companyId: string, customSelection?: string[]) {
    const page = filter.page || 1;
    const limit = filter.limit || 1;

    const query = this.productCompanyRepo
      .createQueryBuilder('productCompany')
      .leftJoinAndMapOne(
        'productCompany.product_digital_master',
        'product_digital_master',
        'product_digital_master',
        'productCompany.product_digital_master_id = product_digital_master.uuid'
      )
      .leftJoin('productCompany.supplier', 'supplier')
      .addSelect(['supplier.uuid', 'supplier.name'])
      .where(
        'productCompany.company_id = :companyId AND product_digital_master.status = 1',
        {
          companyId,
        }
      );

    if (customSelection) query.select(customSelection);

    if (filter.product_digital_brand_id) {
      query.andWhere(
        'product_digital_master.product_digital_brand_id = :product_digital_brand_id',
        { product_digital_brand_id: filter.product_digital_brand_id }
      );
    }

    if (filter.is_bill_payment !== undefined) {
      query.andWhere(
        'product_digital_master.is_bill_payment = :is_bill_payment',
        {
          is_bill_payment: +filter.is_bill_payment,
        }
      );
    }

    if (filter.name) {
      query.andWhere('product_digital_master.name LIKE :name', {
        name: `%${filter.name}%`,
      });
    }

    if (filter.product_code) {
      query.andWhere('product_digital_master.product_code LIKE :product_code', {
        product_code: `%${filter.product_code}%`,
      });
    }

    query.orderBy('product_digital_master.name', 'ASC');
    const result = await paginate(query, { page, limit });
    return result;
  }

  async mobileList(brandId: string, companyId: string) {
    const query = this.productCompanyRepo
      .createQueryBuilder('productCompany')
      .leftJoinAndMapOne(
        'productCompany.product_digital_master',
        'product_digital_master',
        'product_digital_master',
        'productCompany.product_digital_master_id = product_digital_master.uuid'
      )
      .select([
        'productCompany.uuid',
        'productCompany.product_digital_master_id',
        'productCompany.buy_price',
        'productCompany.buy_price AS "productCompany_sell_price"',
        'productCompany.margin',
        'supplier.uuid',
        'supplier.name',
      ])
      .leftJoin('productCompany.supplier', 'supplier')
      .where(
        'productCompany.company_id = :companyId AND product_digital_master.status = 1',
        {
          companyId,
        }
      );

    const result = await query
      .orderBy('product_digital_master.name', 'ASC')
      .getManyAndCount();

    return result;
  }

  async updateStatus(
    productCompanyIds: string[],
    status: string,
    companyId: string
  ): Promise<string> {
    if (status !== '0' && status !== '1') {
      throw NormalException.UNEXPECTED('Invalid Status');
    }

    for (let i = 0; i < productCompanyIds.length; i += 1) {
      const productCompanyId = productCompanyIds[i];
      const productCompany = await this._validateCompanyId(
        productCompanyId,
        companyId
      );
      productCompany.status = status;
      await this.productCompanyRepo.save(productCompany);
    }

    return `Berhasil update status menjadi ${
      status === '0' ? 'Nonaktif' : 'Aktif'
    }`;
  }

  async updateMargin(
    productCompanyIds: string[],
    margin: number,
    companyId: string
  ): Promise<string> {
    for (let i = 0; i < productCompanyIds.length; i += 1) {
      const productCompanyId = productCompanyIds[i];
      const productCompany = await this._validateCompanyId(
        productCompanyId,
        companyId
      );

      productCompany.margin = margin;
      await this.productCompanyRepo.save(productCompany);
    }

    return 'Berhasil setting margin';
  }

  async updateSupplier(
    productCompanyIds: string[],
    supplierId: string,
    companyId: string,
    buyPrice: number
  ): Promise<string> {
    for (let i = 0; i < productCompanyIds.length; i += 1) {
      const productCompanyId = productCompanyIds[i];
      const productCompany = await this._validateCompanyId(
        productCompanyId,
        companyId
      );

      const isQpay = productCompany.supplier_id === process.env.QPAY_UUID;

      if (isQpay) {
        productCompany.buy_price = null;
      } else {
        const avianaFee = +process.env.AVIANA_FEE || 100;
        const affiliatorFee = 0;
        productCompany.buy_price = buyPrice + avianaFee + affiliatorFee;
      }

      productCompany.supplier_id = supplierId;
      await this.productCompanyRepo.save(productCompany);
    }

    return 'Berhasil memperbarui status';
  }

  async updateMarginByCategories(
    productCategoryId: string,
    companyId: string,
    margin: number
  ) {
    const brandIds = await this.brandRepository.find({
      where: { product_digital_category_id: productCategoryId },
      select: ['uuid'],
    });

    const productIds = [];

    for (let i = 0; i < brandIds.length; i += 1) {
      const brand = brandIds[i];
      const prodDataRaw = await this.productDigitalMasterService.list(
        {
          page: 1,
          limit: 99999,
          product_digital_brand_id: brand.uuid,
          companyId,
        },
        companyId
      );

      prodDataRaw?.data?.content?.forEach((el: any) => {
        productIds.push(el.product_companies?.uuid);
      });
    }

    return this.updateMargin(productIds, margin, companyId);
  }

  async updateMarginByBrands(
    brandId: string,
    companyId: string,
    margin: number
  ) {
    const prodDataRaw = await this.productDigitalMasterService.list(
      {
        page: 1,
        limit: 99999,
        product_digital_brand_id: brandId,
      },
      companyId
    );

    const productIds = prodDataRaw?.data?.content?.map(
      (el: any) => el.product_companies?.uuid
    );

    return this.updateMargin(productIds, margin, companyId);
  }

  async updateMarginAllProducts(companyId: string, margin: number) {
    const prodDataRaw = await this.productDigitalMasterService.list(
      {
        page: 1,
        limit: 99999,
      },
      companyId
    );

    const productIds = prodDataRaw?.data?.content?.map(
      (el: any) => el.product_companies?.uuid
    );

    return this.updateMargin(productIds, margin, companyId);
  }

  async mapSupplierProductPrice(payload: {
    trx: EntityManager;
    supplierId: string;
    productCompanyId: string;
  }): Promise<{
    feeToAviana: number;
    feeAffiliate: number;
    buyPriceWithFee: number;
    marginFee: number;
    sellPriceWithMargin: number;
  }> {
    const supplier = await this.supplierService.findOne(payload.supplierId);
    const isQpaySupplier: boolean = supplier.uuid === process.env.QPAY_UUID;

    const productCompany = await this.productCompanyRepo.findOne({
      where: { uuid: payload.productCompanyId, status: 1 },
    });

    if (!productCompany) {
      throw NormalException.NOTFOUND('Produk tidak ditemukan');
    }

    const feeToAviana: number = +process.env.AVIANA_FEE || 100;
    const feeAffiliate: number = 0; // TODO
    const marginFee: number = +productCompany.margin;

    let buyPriceWithFee: number = +productCompany.buy_price;
    if (isQpaySupplier) {
      buyPriceWithFee = +productCompany.product_digital_master.buy_price;
    }

    const sellPriceWithMargin = buyPriceWithFee + marginFee;

    return {
      feeToAviana,
      feeAffiliate,
      buyPriceWithFee,
      marginFee,
      sellPriceWithMargin,
    };
  }
}
