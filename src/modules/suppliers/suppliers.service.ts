import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Supplier } from './entities/suppliers.entity';
import paginate from '@/shared/pagination';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>
  ) {}

  async create(supplierData: Partial<Supplier>): Promise<Supplier> {
    const supplier = this.supplierRepository.create(supplierData);
    return this.supplierRepository.save(supplier);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    name?: string,
    createdAtStart?: Date,
    createdAtEnd?: Date
  ): Promise<any> {
    const query = this.supplierRepository.createQueryBuilder('supplier');

    if (name) {
      query.andWhere('supplier.name LIKE :name', { name: `%${name}%` });
    }

    if (createdAtStart && createdAtEnd) {
      query.andWhere('supplier.created_at BETWEEN :start AND :end', {
        start: createdAtStart,
        end: createdAtEnd,
      });
    }

    const result = await paginate(query, { page, limit });
    return result;
  }

  async findOne(id: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne(id);
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
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
