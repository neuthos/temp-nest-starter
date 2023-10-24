/* eslint-disable import/no-cycle */
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { NormalException } from '@/exception';
import { ProductCompaniesService } from '../product_companies/product_companies.service';
import { Repository } from 'typeorm';
import { Supplier } from './entities/suppliers.entity';
import { encryptAES256 } from '@/shared/aes';
import paginate from '@/shared/pagination';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,

    private readonly productCompanyService: ProductCompaniesService
  ) {}

  async create(
    companyId: string,
    supplierData: Partial<Supplier>
  ): Promise<Supplier> {
    const supplier = this.supplierRepository.create(supplierData);
    const secretKey = process.env.SUPPLIER_SECRET_KEY;
    supplier.public_key = encryptAES256(supplier.public_key, secretKey);
    supplier.secret_key = encryptAES256(supplier.secret_key, secretKey);
    supplier.company_id = companyId;
    return this.supplierRepository.save(supplier);
  }

  async findAll(
    companyId: string,
    page: number = 1,
    limit: number = 10,
    name?: string,
    status?: string,
    type?: string
  ): Promise<any> {
    const query = this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.company_id = :companyId', { companyId });

    if (name) {
      query.andWhere('supplier.name LIKE :name', { name: `%${name}%` });
    }

    if (status) {
      query.andWhere('supplier.status = :status', { status: +status });
    }

    if (type === 'all') {
      query.orWhere('supplier.uuid = :defaultSupplierID', {
        defaultSupplierID: process.env.QPAY_UUID,
      });
    }

    query.orderBy('supplier.created_at', 'DESC');

    const result = await paginate(query, { page, limit });
    return result;
  }

  async defaultSupplier(): Promise<any> {
    return this.supplierRepository.find({
      where: {
        company_id: null,
        status: 1,
      },
      select: ['uuid', 'created_at', 'name'],
      order: {
        created_at: 'DESC',
      },
    });
  }

  async findOne(id: string, companyId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { uuid: id, company_id: companyId },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier dengan ID ${id} tidak ditemukan`);
    }
    return supplier;
  }

  async update(
    companyId: string,
    id: string,
    supplierData: Partial<Supplier>
  ): Promise<Supplier> {
    const supplier = await this.findOne(id, companyId);
    if (supplier) await this.supplierRepository.update(id, supplierData);
    return supplier;
  }

  async remove(id: string, companyId: string) {
    const supplier = await this.findOne(id, companyId);
    await this.supplierRepository.remove(supplier);
    return supplier;
  }

  async updateSupplierStatus(
    companyId: string,
    supplierId: string,
    status: number
  ) {
    const supplier = await this.supplierRepository.findOne({
      where: {
        uuid: supplierId,
        company_id: companyId,
      },
    });

    if (!supplier) {
      throw NormalException.NOTFOUND('Supplier tidak ditemukan');
    }

    const productCompanies =
      await this.productCompanyService.productCompaniesByKeyVal(
        'company_id',
        companyId
      );

    const isSupplierUsed = productCompanies.length !== 0;
    const isUpdateToAktif = status === 1;

    if (isSupplierUsed && !isUpdateToAktif) {
      const productCompanyIds = productCompanies.map((el) => el.uuid);

      await this.productCompanyService.updateSupplier(
        productCompanyIds,
        process.env.QPAY_UUID,
        companyId
      );
    }

    supplier.status = status;

    await this.supplierRepository.save(supplier);

    return 'Berhasil mengupdate status supplier';
  }
}
