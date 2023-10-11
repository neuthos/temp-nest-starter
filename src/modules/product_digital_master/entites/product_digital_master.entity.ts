import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ProductCompany } from '@/modules/product_companies/entities/product_companies.entity';
import { ProductDigitalBrand } from '../../product_digital_brands/entities/product_digital_brand.entity';

@Entity('product_digital_master')
@Unique(['product_code'])
export class ProductDigitalMaster {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ name: 'product_digital_brand_id', type: 'uuid' })
  product_digital_brand_id: string;

  @ManyToOne(() => ProductDigitalBrand)
  @JoinColumn({ name: 'product_digital_brand_id' })
  product_digital_brand: ProductDigitalBrand;

  @Column({ length: 50, nullable: true })
  name: string;

  @Column({ length: 200, nullable: true })
  description: string;

  @Column({ length: 10, nullable: true })
  denom: string;

  @Column({ length: 50, unique: true })
  product_code: string;

  @Column({ length: 50, nullable: true })
  supplier_code: string;

  @Column({ type: 'decimal', precision: 20, scale: 2, nullable: true })
  buy_price: number;

  @Column({ nullable: true, default: 1 })
  status: number;

  @Column({
    nullable: true,
    default: 0,
    comment: '0 = Prabayar | 1 = Pascabayar',
  })
  is_bill_payment: number;

  @Column({ nullable: true, default: false })
  is_private: boolean;

  @Column({ length: 100, nullable: true })
  company_id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at?: Date;

  @OneToMany(
    () => ProductCompany,
    (productCompany: ProductCompany) => productCompany.product_digital_master
  )
  product_companies: ProductCompany[];
}
