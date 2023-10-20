import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('product_digital_categories')
export class ProductDigitalCategory {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column({ length: 80, nullable: true })
  name: string;

  @Column({ length: 255, nullable: true })
  icon: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ default: 0, nullable: true })
  status: number;

  @Column({ default: 0, nullable: true })
  priority: number;

  @Column({
    type: 'varchar',
    enum: [
      'CARD_DENOM',
      'LIST_VIEW',
      'LIST_PRODUCT_CARD_DENOM',
      'CARD_DENOM_INQUIRY',
      'POSTPAID',
      'POSTPAID_DAERAH',
    ],
    default: null,
  })
  layout_type: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at?: Date;
}
