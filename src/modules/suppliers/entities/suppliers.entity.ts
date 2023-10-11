import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  uuid: string;

  @Column()
  name: string;

  @Column()
  host: string;

  @Column({ default: 0 })
  status: number;

  @Column({ name: 'public_key', type: 'text', default: null })
  public_key: string;

  @Column({ name: 'secret_key', type: 'text', default: null })
  secret_key: string;

  @Column({ name: 'callback_ip', type: 'text', default: null })
  callbackIP: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  created_at?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updated_at?: Date;
}