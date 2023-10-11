/* eslint-disable import/no-cycle */
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'decimal', precision: 20, scale: 2, default: null })
  default_fee: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at?: Date;
}
