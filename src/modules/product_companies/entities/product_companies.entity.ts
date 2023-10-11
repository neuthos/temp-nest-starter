import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '@/modules/company/entities/company.entity';
import { ProductDigitalMaster } from '../../product_digital_master/entites/product_digital_master.entity';
import { Supplier } from '@/modules/suppliers/entities/suppliers.entity';

@Entity('product_companies')
@Unique(['product_digital_master_id', 'company_id'])
export class ProductCompany {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ name: 'product_digital_master_id', type: 'uuid' })
  product_digital_master_id: string;

  @ManyToOne(() => ProductDigitalMaster)
  @JoinColumn({ name: 'product_digital_master_id' })
  product_digital_master: ProductDigitalMaster;

  @Column({ name: 'company_id', type: 'uuid' })
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'supplier_id', type: 'uuid' })
  supplier_id: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  margin: number;

  @Column({ length: 1, comment: '1: aktif, 0: tidak aktif' })
  status: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at?: Date;
}
