/* eslint-disable import/no-cycle */
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductCompany } from '@/modules/product_companies/entities/product_companies.entity';

@Entity('companies')
export class Company {
  @PrimaryColumn('uuid')
  uuid: string;

  @Column({ type: 'uuid', default: null })
  affiliate_id?: string;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 200 })
  default_fee: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at?: Date;

  @OneToMany(
    () => ProductCompany,
    (productCompany: ProductCompany) => productCompany.company
  )
  product_companies: ProductCompany[];
}
