import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductDigitalBrand } from './product_digital_brand.entity';
// Pastikan Anda mengganti path sesuai dengan struktur berkas Anda.

@Entity('product_brand_prefix')
@Index(['prefix'])
export class ProductBrandPrefix {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ name: 'product_digital_brand_id', type: 'uuid' })
  product_digital_brand_id: string;

  @ManyToOne(() => ProductDigitalBrand)
  @JoinColumn({ name: 'product_digital_brand_id' })
  product_digital_brand: ProductDigitalBrand;

  @Column({ type: 'varchar' })
  prefix: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at?: Date;
}
