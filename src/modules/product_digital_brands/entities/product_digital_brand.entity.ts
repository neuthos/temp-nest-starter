/* eslint-disable import/no-cycle */
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
// Pastikan Anda mengganti path sesuai dengan struktur berkas Anda.
import { ProductDigitalCategory } from '../../product_digital_categories/entities/product_digital_categories.entity';

@Entity('product_digital_brand')
export class ProductDigitalBrand {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ name: 'product_digital_category_id', type: 'uuid' })
  product_digital_category_id: string;

  @ManyToOne(() => ProductDigitalCategory)
  @JoinColumn({ name: 'product_digital_category_id' })
  product_digital_category: ProductDigitalCategory;

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({ length: 255, nullable: true })
  icon: string;

  @Column({ default: 1, nullable: true })
  status: number;

  @Column({ length: 200, nullable: true })
  description: string;

  @Column({ length: 250, nullable: true })
  category_code: string;

  @Column({ default: 0, nullable: true })
  priority: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at?: Date;
}
