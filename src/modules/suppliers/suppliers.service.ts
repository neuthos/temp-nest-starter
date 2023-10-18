import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Supplier } from './entities/suppliers.entity';
import { encryptAES256 } from '@/shared/aes';
import paginate from '@/shared/pagination';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>
  ) {}

  async create(supplierData: Partial<Supplier>): Promise<Supplier> {
    const supplier = this.supplierRepository.create(supplierData);
    const secretKey = process.env.SUPPLIER_SECRET_KEY;
    supplier.public_key = encryptAES256(supplier.public_key, secretKey);
    supplier.secret_key = encryptAES256(supplier.secret_key, secretKey);
    return this.supplierRepository.save(supplier);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    name?: string,
    status?: string
  ): Promise<any> {
    const query = this.supplierRepository.createQueryBuilder('supplier');
    if (name) {
      query.andWhere('supplier.name LIKE :name', { name: `%${name}%` });
    }

    if (status) {
      query.andWhere('supplier.status = :status', { status });
    }

    const result = await paginate(query, { page, limit });
    return result;
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne(id);
    if (!supplier) {
      throw new NotFoundException(`Supplier dengan ID ${id} tidak ditemukan`);
    }
    return supplier;
  }

  async update(id: string, supplierData: Partial<Supplier>): Promise<Supplier> {
    await this.findOne(id);
    await this.supplierRepository.update(id, supplierData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const supplier = await this.findOne(id);
    await this.supplierRepository.remove(supplier);
  }
}
