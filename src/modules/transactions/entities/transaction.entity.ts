import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '@/modules/company/entities/company.entity';
import { ProductCompany } from '@/modules/product_companies/entities/product_companies.entity';
import { ProductDigitalMaster } from '@/modules/product_digital_master/entites/product_digital_master.entity';
import { Supplier } from '@/modules/suppliers/entities/suppliers.entity';
import { User } from '@/modules/users/entities/users.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column('uuid')
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('uuid')
  supplier_id: string;

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column('uuid')
  product_master_id: string;

  @ManyToOne(() => ProductDigitalMaster)
  @JoinColumn({ name: 'product_master_id' })
  product_master: ProductDigitalMaster;

  @Column('uuid')
  product_companies_id: string;

  @ManyToOne(() => ProductCompany)
  @JoinColumn({ name: 'product_companies_id' })
  product_company: ProductCompany;

  @Column('varchar')
  product_name: string;

  @Column('varchar')
  product_categories: string;

  @Column('varchar')
  product_brand: string;

  @Column('varchar')
  product_code: string;

  @Column('decimal', { precision: 20, scale: 2 })
  sell_price: number;

  @Column('decimal', { precision: 20, scale: 2 })
  buy_price: number;

  @Column('varchar')
  supplier_name: string;

  @Column('varchar')
  supplier_host: string;

  @Column('varchar', { unique: true, default: null })
  reference_number: string;

  @Column('varchar', { nullable: true })
  serial_number: string;

  @Column('varchar')
  destination: string;

  @Column({
    type: 'int',
    comment: '0 = Pending, 1 = Success, 2 = Gagal',
    default: 0,
  })
  status: number;

  @Column('varchar')
  message: string;

  @Column({ type: 'varchar', enum: ['CASH', 'ALLOWANCE', 'PAYMENT_METHOD'] })
  payment_method: string;

  @Column('varchar')
  payment_code: string;

  @Column('int')
  payment_fee: number;

  @Column({ type: 'int', name: 'payment_charged_amount' })
  getPaymentChargedAmount(): number {
    return this.sell_price + this.payment_fee;
  }

  @Column('varchar')
  user_name: string;

  @Column('varchar')
  user_email: string;

  @Column('decimal', {
    precision: 20,
    scale: 2,
    name: 'affiliate_total_commision',
  })
  affiliate_total_commision: number;

  @Column({ name: 'callback_at', type: 'timestamp with time zone' })
  callback_at: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at?: Date;
}
